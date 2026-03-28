import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../common/middlewares/errorHandler';

// Get all alerts
export const getActiveAlerts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alerts = await prisma.alert.findMany({
      where: { status: 'active' },
      include: {
        hospital: {
          select: {
            hospitalName: true,
            location: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      status: 'success',
      data: { alerts }
    });
  } catch (error) {
    next(error);
  }
};

// Create a new alert
export const createAlert = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      requiredOrgan, 
      urgencyLevel, 
      gender, 
      age, 
      hlaType, 
      bloodGroup, 
      medicalNotes,
      expiresInHours 
    } = req.body;

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (expiresInHours || 24));

    const alert = await prisma.alert.create({
      data: {
        createdByHospitalId: req.user.id as string,
        requiredOrgan,
        urgencyLevel,
        gender: gender || 'Any',
        age: age ? parseInt(age as string) : null,
        hlaType: hlaType || 'Any',
        bloodGroup,
        medicalNotes: medicalNotes || '',
        expiresAt
      }
    });

    // Create system notifications for all other hospitals
    const hospitals = await prisma.hospital.findMany({
      where: { id: { not: req.user.id } }
    });

    const notifications = hospitals.map(h => ({
      hospitalId: h.id,
      type: 'new_alert',
      title: `URGENT: ${requiredOrgan} Needed`,
      message: `${req.user.hospitalName} has broadcast a ${urgencyLevel} alert for a ${bloodGroup} organ.`,
      relatedEntityType: 'Alert',
      relatedEntityId: alert.id,
      priority: urgencyLevel === 'critical' ? 'critical' : 'high'
    }));

    await prisma.notification.createMany({
      data: notifications
    });

    res.status(201).json({
      status: 'success',
      data: { alert }
    });
  } catch (error) {
    next(error);
  }
};
