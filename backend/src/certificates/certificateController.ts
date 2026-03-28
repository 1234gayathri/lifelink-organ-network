import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../common/middlewares/errorHandler';

// Get certificates for current hospital (as source or recipient)
export const getMyCertificates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const certificates = await prisma.donorCertificate.findMany({
      where: {
        OR: [
          { sourceHospitalId: req.user.id },
          { issuedToHospitalId: req.user.id }
        ]
      },
      include: {
        organ: true,
        source: true,
        issuedTo: true
      },
      orderBy: { issuedAt: 'desc' }
    });

    res.status(200).json({
      status: 'success',
      data: { certificates }
    });
  } catch (error) {
    next(error);
  }
};

// Generate certificate manually (for admins or source hospital upon completion)
export const generateCertificate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { requestId } = req.body;

    const request = await prisma.organRequest.findUnique({
      where: { id: requestId },
      include: { organ: true }
    });

    if (!request || request.status !== 'completed' && request.status !== 'delivered') {
      return next(new AppError('Request must be completed to issue certificate', 400));
    }

    // Check if certificate already exists
    const existing = await prisma.donorCertificate.findUnique({
      where: { requestId }
    });
    if (existing) return next(new AppError('Certificate already issued', 400));

    const certificate = await prisma.donorCertificate.create({
      data: {
        requestId,
        organId: request.organId,
        sourceHospitalId: request.sourceHospitalId,
        issuedToHospitalId: request.requestingHospitalId,
        organType: request.organ.organType,
        certificateNumber: `CERT-${Date.now().toString().slice(-8)}-${request.organ.organType.toUpperCase().slice(0, 3)}`
      }
    });

    res.status(201).json({
      status: 'success',
      data: { certificate }
    });
  } catch (error) {
    next(error);
  }
};
