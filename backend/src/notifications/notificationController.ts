import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../common/middlewares/errorHandler';

// Get all notifications for current hospital
export const getMyNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { hospitalId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      status: 'success',
      data: { notifications }
    });
  } catch (error) {
    next(error);
  }
};

// Mark notification as read
export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id: id as string }
    });

    if (!notification || notification.hospitalId !== req.user.id) {
      return next(new AppError('Notification not found', 404));
    }

    const updated = await prisma.notification.update({
      where: { id: id as string },
      data: { isRead: true }
    });

    res.status(200).json({
      status: 'success',
      data: { notification: updated }
    });
  } catch (error) {
    next(error);
  }
};

// Mark all as read
export const markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.updateMany({
      where: { hospitalId: req.user.id, isRead: false },
      data: { isRead: true }
    });

    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};
