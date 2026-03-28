import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../common/middlewares/errorHandler';

// Get or create conversation between current hospital and another
const getOrCreateConversation = async (h1Id: string, h2Id: string) => {
  // Ensure hospital order for unique constraint
  const [firstId, secondId] = h1Id < h2Id ? [h1Id, h2Id] : [h2Id, h1Id];

  let conv = await prisma.conversation.findUnique({
    where: { hospital1Id_hospital2Id: { hospital1Id: firstId, hospital2Id: secondId } }
  });

  if (!conv) {
    conv = await prisma.conversation.create({
      data: { hospital1Id: firstId, hospital2Id: secondId }
    });
  }
  return conv;
};

// Get list of all conversations for current hospital
export const getMyConversations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const convs = await prisma.conversation.findMany({
      where: {
        OR: [
          { hospital1Id: req.user.id },
          { hospital2Id: req.user.id }
        ]
      },
      include: {
        hospital1: { select: { id: true, hospitalName: true, location: true } },
        hospital2: { select: { id: true, hospitalName: true, location: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const formatted = convs.map(c => {
      const otherHospital = c.hospital1Id === req.user.id ? c.hospital2 : c.hospital1;
      return {
        id: c.id,
        otherHospital,
        lastMessage: c.messages[0] || null,
        updatedAt: c.updatedAt
      };
    });

    res.status(200).json({ status: 'success', data: { conversations: formatted } });
  } catch (error) {
    next(error);
  }
};

// Get messages for a specific conversation (identified by target hospital)
export const getMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const targetHospitalId = req.params.targetHospitalId as string;
    const conv = await getOrCreateConversation(req.user.id, targetHospitalId);

    const messages = await prisma.message.findMany({
      where: { conversationId: conv.id },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { hospitalName: true } } }
    });

    // Mark as read
    await prisma.message.updateMany({
      where: { conversationId: conv.id, senderId: targetHospitalId, isRead: false },
      data: { isRead: true }
    });

    res.status(200).json({ status: 'success', data: { conversationId: conv.id, messages } });
  } catch (error) {
    next(error);
  }
};

// Get unread messages count for current hospital
export const getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const unreadCount = await prisma.message.count({
      where: {
        conversation: {
          OR: [
            { hospital1Id: req.user.id },
            { hospital2Id: req.user.id }
          ]
        },
        senderId: { not: req.user.id },
        isRead: false
      }
    });

    res.status(200).json({ status: 'success', data: { unreadCount } });
  } catch (error) {
    next(error);
  }
};

// Send a message
export const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { targetHospitalId, content } = req.body;
    if (!content) return next(new AppError('Message content is required', 400));

    const conv = await getOrCreateConversation(req.user.id, targetHospitalId);

    const message = await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderId: req.user.id,
        content
      }
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conv.id },
      data: { updatedAt: new Date() }
    });

    // Trigger Notification for Recipient
    await prisma.notification.create({
      data: {
        hospitalId: targetHospitalId,
        title: 'New Private Message',
        message: `New message from ${req.user.hospitalName}: "${content.substring(0, 40)}${content.length > 40 ? '...' : ''}"`,
        type: 'new_request', // Using existing type for icon consistency or create new one
        priority: 'medium'
      }
    });

    res.status(201).json({ status: 'success', data: { message } });
  } catch (error) {
    next(error);
  }
};
