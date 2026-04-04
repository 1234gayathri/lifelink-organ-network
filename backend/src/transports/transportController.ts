import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../common/middlewares/errorHandler';

// Get transports for current hospital (as source or destination)
export const getMyTransports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transports = await prisma.transportRecord.findMany({
      where: {
        OR: [
          { sourceHospitalId: req.user.id },
          { destinationHospitalId: req.user.id }
        ]
      },
      include: {
        organ: true,
        destination: true,
        source: true,
        request: {
          include: { requestingHospital: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const mappedTransports = transports.map(t => ({
      ...t,
      checkpoints: typeof t.checkpoints === 'string' ? JSON.parse(t.checkpoints) : []
    }));

    res.status(200).json({
      status: 'success',
      data: { transports: mappedTransports }
    });
  } catch (error) {
    next(error);
  }
};

// Update transport checkpoint (Hospitals update this manually)
export const updateCheckpoint = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const {
      checkpoints,
      status,
      currentLatitude,
      currentLongitude,
      remainingDistanceKm,
      totalDistanceKm,
      vehicleType,
      pilotName,
      emergencyContact,
      organConditionStatus
    } = req.body;

    // Validate Distances
    if (totalDistanceKm !== undefined && (typeof totalDistanceKm !== 'number' || totalDistanceKm <= 0)) {
      return next(new AppError('Total distance must be a positive number', 400));
    }
    if (remainingDistanceKm !== undefined && (typeof remainingDistanceKm !== 'number' || remainingDistanceKm < 0)) {
      return next(new AppError('Remaining distance cannot be negative', 400));
    }
    if (totalDistanceKm !== undefined && remainingDistanceKm !== undefined && remainingDistanceKm > totalDistanceKm) {
      return next(new AppError('Remaining distance cannot exceed total distance', 400));
    }

    // Validate Emergency Contact (if provided)
    if (emergencyContact !== undefined) {
      const phoneCleaner = emergencyContact.replace(/\D/g, '');
      if (phoneCleaner.length < 10) {
        return next(new AppError('Invalid emergency contact. Please provide a valid 10-digit number.', 400));
      }
    }

    const transport = await prisma.transportRecord.findUnique({
      where: { id: id as string }
    });

    if (!transport) return next(new AppError('Record not found', 404));

    // Only the source hospital (dispatching hospital) or an admin can update
    if (transport.sourceHospitalId !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('Unauthorized update', 403));
    }

    const updated = await prisma.transportRecord.update({
      where: { id: id as string },
      data: {
        checkpoints: checkpoints !== undefined ? JSON.stringify(checkpoints) : transport.checkpoints || undefined,
        status: status || transport.status,
        currentLatitude: currentLatitude !== undefined ? currentLatitude : transport.currentLatitude,
        currentLongitude: currentLongitude !== undefined ? currentLongitude : transport.currentLongitude,
        remainingDistanceKm: remainingDistanceKm !== undefined ? remainingDistanceKm : transport.remainingDistanceKm,
        totalDistanceKm: totalDistanceKm !== undefined ? totalDistanceKm : transport.totalDistanceKm,
        vehicleType: vehicleType !== undefined ? vehicleType : transport.vehicleType,
        pilotName: pilotName !== undefined ? pilotName : transport.pilotName,
        emergencyContact: emergencyContact !== undefined ? emergencyContact : transport.emergencyContact,
        organConditionStatus: organConditionStatus !== undefined ? organConditionStatus : transport.organConditionStatus,
        updatedAt: new Date()
      },
      include: { organ: true, request: true, source: true }
    });

    // Check if ALL checkpoints are now done → trigger delivery completion
    const cpToEvaluate = checkpoints ?? (transport.checkpoints ? JSON.parse(transport.checkpoints as string) : []);
    const allDone = cpToEvaluate.length > 0 && cpToEvaluate.every((cp: any) => cp.done);

    if (allDone && transport.status !== 'delivered') {
      // Atomically mark transport delivered, request completed, organ completed
      await prisma.$transaction([
        prisma.transportRecord.update({
          where: { id: transport.id },
          data: { status: 'delivered', remainingDistanceKm: 0 }
        }),
        prisma.organRequest.update({
          where: { id: transport.requestId },
          data: { status: 'completed', completedAt: new Date() }
        }),
        prisma.organ.update({
          where: { id: transport.organId },
          data: { status: 'completed' }
        }),
        // Notify destination hospital of delivery
        prisma.notification.create({
          data: {
            hospitalId: transport.destinationHospitalId,
            title: '🎉 Organ Delivered Successfully',
            message: `The ${(updated as any).organ?.organType || 'organ'} from ${(updated as any).source?.hospitalName || 'source hospital'} has been delivered to your surgical team. The transplant can proceed.`,
            type: 'transport_update',
            priority: 'high'
          }
        }),
        // Notify source hospital that delivery is confirmed
        prisma.notification.create({
          data: {
            hospitalId: transport.sourceHospitalId,
            title: '✅ Delivery Confirmed',
            message: `Organ delivery to destination hospital has been completed successfully. The organ request has been marked as completed.`,
            type: 'transport_update',
            priority: 'medium'
          }
        }),
        // AUTO-GENERATE DONOR CERTIFICATE
        prisma.donorCertificate.create({
          data: {
            requestId: transport.requestId,
            organId: transport.organId,
            sourceHospitalId: transport.sourceHospitalId,
            issuedToHospitalId: transport.destinationHospitalId,
            organType: (updated as any).organ?.organType || 'Organ',
            certificateNumber: `CERT-${Date.now().toString().slice(-8)}-${((updated as any).organ?.organType || 'ORG').toUpperCase().slice(0, 3)}`
          }
        })
      ]);
    } else {
      // Standard status change notification (non-delivery)
      if (status && status !== transport.status) {
        await prisma.notification.create({
          data: {
            hospitalId: transport.destinationHospitalId,
            title: 'Transport Update',
            message: `Organ transport status updated to: ${status.replace('_', ' ').toUpperCase()}.`,
            type: 'transport_update',
            priority: 'medium'
          }
        });
      }
    }

    res.status(200).json({
      status: 'success',
      data: { transport: updated, deliveryCompleted: allDone }
    });
  } catch (error) {
    next(error);
  }
};
