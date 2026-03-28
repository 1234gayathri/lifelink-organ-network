import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../common/middlewares/errorHandler';

export const sendRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organId, urgencyLevel, patientBloodGroup, patientHlaType, patientAge, compatibilitySummary, doctorNotes, caseSummary } = req.body;

    // Check if organ is available
    const organ = await prisma.organ.findUnique({
      where: { id: organId }
    });

    if (!organ) {
      return next(new AppError('Organ not found', 404));
    }

    if (organ.status !== 'available' || organ.expiryTime <= new Date()) {
      return next(new AppError('Organ is not available or has expired', 400));
    }
    
    // Cannot request own organ
    if (organ.sourceHospitalId === req.user.id) {
        return next(new AppError('You cannot request an organ uploaded by your own hospital', 400));
    }

    // Check if a request already exists from this hospital
    const existing = await prisma.organRequest.findFirst({
        where: {
            organId,
            requestingHospitalId: req.user.id,
            status: { notIn: ['cancelled', 'rejected'] }
        }
    });
    
    if (existing) {
        return next(new AppError('You have already submitted an active request for this organ', 400));
    }

    const newRequest = await prisma.organRequest.create({
      data: {
        organId,
        sourceHospitalId: organ.sourceHospitalId,
        requestingHospitalId: req.user.id,
        urgencyLevel,
        patientBloodGroup,
        patientHlaType,
        patientAge,
        compatibilitySummary,
        doctorNotes,
        caseSummary,
        status: 'pending'
      }
    });

    // Create Notification for the Source Hospital
    await prisma.notification.create({
      data: {
        hospitalId: organ.sourceHospitalId,
        title: 'New Organ Request',
        message: `You have received a new request for ${organ.organType} (Blood Group: ${organ.bloodGroup}) from ${req.user.hospitalName}.`,
        type: 'new_request',
        priority: urgencyLevel === 'critical' ? 'critical' : urgencyLevel === 'high' ? 'high' : 'medium'
      }
    });

    res.status(201).json({
      status: 'success',
      data: { request: newRequest }
    });
  } catch (error) {
    next(error);
  }
};

export const getIncomingRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requests = await prisma.organRequest.findMany({
      where: { sourceHospitalId: req.user.id },
      include: {
        organ: true,
        requestingHospital: { select: { id: true, hospitalName: true, officialEmail: true, phoneNumber: true, location: true } }
      }
    });

    res.status(200).json({ status: 'success', results: requests.length, data: { requests } });
  } catch (error) {
    next(error);
  }
};

export const getOutgoingRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requests = await prisma.organRequest.findMany({
      where: { requestingHospitalId: req.user.id },
      include: {
        organ: true,
        sourceHospital: { select: { id: true, hospitalName: true, officialEmail: true, phoneNumber: true, location: true } }
      }
    });

    res.status(200).json({ status: 'success', results: requests.length, data: { requests } });
  } catch (error) {
    next(error);
  }
};

export const updateRequestStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, rejectionReason } = req.body;
    
    // Find request
    const organRequest = await prisma.organRequest.findUnique({
      where: { id: req.params.id as string },
      include: { organ: true }
    });

    if (!organRequest) {
      return next(new AppError('Request not found', 404));
    }

    // Authorization checks
    const isSource = organRequest.sourceHospitalId === req.user.id;
    const isRequester = organRequest.requestingHospitalId === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isSource && !isRequester && !isAdmin) {
      return next(new AppError('Not authorized to access this request', 403));
    }

    // Business Logic - transaction required for approval
    if (status === 'approved') {
      if (!isSource && !isAdmin) {
          return next(new AppError('Only source hospital can approve a request', 403));
      }
      
      if (organRequest.status !== 'sent' && organRequest.status !== 'pending' && organRequest.status !== 'under_review') {
          return next(new AppError('Can only approve pending requests', 400));
      }

      // Check organ status again just to be safe
      if (organRequest.organ.status !== 'available') {
          return next(new AppError('Organ is no longer available.', 400));
      }

      // Run transactional update
      const [updatedRequest, updatedOrgan, newTransport] = await prisma.$transaction([
        prisma.organRequest.update({
          where: { id: organRequest.id },
          data: { 
            status: 'approved', 
            approvedAt: new Date(),
            ...(req.body.compatibilitySummary && { compatibilitySummary: req.body.compatibilitySummary }),
            ...(req.body.compatibilityScore && { compatibilityScore: parseInt(req.body.compatibilityScore, 10) })
          }
        }),
        prisma.organ.update({
          where: { id: organRequest.organId },
          data: { status: 'allocated' }
        }),
        // Initialize Transport Tracking Record immediately upon approval
        prisma.transportRecord.create({
          data: {
            requestId: organRequest.id,
            organId: organRequest.organId,
            sourceHospitalId: organRequest.sourceHospitalId,
            destinationHospitalId: organRequest.requestingHospitalId,
            status: 'pending',
            totalDistanceKm: Math.floor(Math.random() * 300) + 50, // Mock distance
            remainingDistanceKm: Math.floor(Math.random() * 300) + 50,
            checkpoints: [
              { label: 'Dispatch from Source Hospital', time: new Date().toISOString(), done: true },
              { label: 'In Transit via Medical Corridor', time: new Date(Date.now() + 1000 * 60 * 30).toISOString(), done: false },
              { label: 'Approaching Destination City', time: new Date(Date.now() + 1000 * 60 * 90).toISOString(), done: false },
              { label: 'Delivered to Surgical Team', time: new Date(Date.now() + 1000 * 60 * 120).toISOString(), done: false }
            ]
          }
        }),
        // Optional: cancel all other pending requests for this organ
        prisma.organRequest.updateMany({
            where: {
                organId: organRequest.organId,
                id: { not: organRequest.id },
                status: { in: ['sent', 'pending', 'under_review'] }
            },
            data: {
                status: 'rejected',
                rejectionReason: 'Organ has been allocated to another hospital',
                respondedAt: new Date()
            }
        })
      ]);

      // Create Notification for the Requester (Approval)
      await prisma.notification.create({
        data: {
          hospitalId: organRequest.requestingHospitalId,
          title: 'Request Approved!',
          message: `Your request for ${organRequest.organ.organType} (ID: ${organRequest.organ.id.split('-')[0]}) has been approved by ${req.user.hospitalName}. Coordination starting soon.`,
          type: 'approval',
          priority: 'high'
        }
      });

      return res.status(200).json({ status: 'success', data: { request: updatedRequest } });
    }

    // For other generic status updates
    const updated = await prisma.organRequest.update({
      where: { id: req.params.id as string },
      data: {
          status,
          ...(rejectionReason && { rejectionReason }),
          ...(status === 'rejected' && { respondedAt: new Date() }),
          ...(status === 'delivered' && { deliveredAt: new Date() }),
          ...(status === 'completed' && { completedAt: new Date() })
      }
    });

    if (status === 'rejected') {
      await prisma.notification.create({
        data: {
          hospitalId: organRequest.requestingHospitalId,
          title: 'Request Declined',
          message: `Your request for ${organRequest.organ.organType} has been declined by ${req.user.hospitalName}. Reason: ${rejectionReason || 'No reason provided.'}`,
          type: 'rejection',
          priority: 'medium'
        }
      });
    }

    res.status(200).json({ status: 'success', data: { request: updated } });
  } catch (error) {
    next(error);
  }
};
