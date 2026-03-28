import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../common/middlewares/errorHandler';
import { sendOrganInterestEmail } from '../utils/emailService';

export const addOrgan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      organType, 
      bloodGroup, 
      hlaType, 
      donorAge, 
      donorGender, 
      donorMedicalDetails, 
      extractionTime, 
      extractedAt, 
      maxStorageMinutes,
      storageLife,
      notes,
      donorName,
      donorGovtId,
      donorContact,
      familyName,
      familyContact
    } = req.body;

    const finalExtractionTime = extractionTime || extractedAt;
    const finalMaxStorageMinutes = Number(maxStorageMinutes || storageLife || 1);

    if (!finalExtractionTime) {
      return next(new AppError('Extraction time is required.', 400));
    }

    // Calculate expiryTime based on extractionTime and maxStorageMinutes
    const extTimeMs = new Date(finalExtractionTime).getTime();
    const expiryTimeMs = extTimeMs + (finalMaxStorageMinutes * 60 * 1000);
    const expiryTime = new Date(expiryTimeMs);

    // Validate that expiry time is not already in the past
    if (expiryTime <= new Date()) {
      return next(new AppError('Organ is already expired or has an invalid extraction window.', 400));
    }

    const organ = await prisma.organ.create({
      data: {
        organType,
        bloodGroup,
        hlaType: hlaType || 'Not Specified',
        donorAge: donorAge ? Number(donorAge) : null,
        donorGender,
        donorMedicalDetails,
        extractionTime: new Date(finalExtractionTime),
        maxStorageMinutes: finalMaxStorageMinutes,
        expiryTime,
        status: 'available',
        notes,
        donorName,
        donorGovtId,
        donorContact,
        familyName,
        familyContact,
        sourceHospitalId: req.user.id
      }
    });

    res.status(201).json({
      status: 'success',
      data: { organ }
    });
  } catch (error) {
    next(error);
  }
};

export const getMyOrgans = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organs = await prisma.organ.findMany({
      where: { sourceHospitalId: req.user.id },
      include: {
        sourceHospital: {
          select: { id: true, hospitalName: true, location: true, contactPerson: true }
        }
      },
      orderBy: { extractionTime: 'desc' }
    });

    res.status(200).json({
      status: 'success',
      results: organs.length,
      data: { organs }
    });
  } catch (error) {
    next(error);
  }
};

export const getOrgans = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Basic filter
    const status = req.query.status as string || 'available';

    // Set organs to expired dynamically here?
    // Let cron job handle it, but we can also filter out past expiry items.
    
    let queryArgs: any = { status };
    if (status === 'available') {
      queryArgs.expiryTime = { gt: new Date() };
    }

    const organs = await prisma.organ.findMany({
      where: queryArgs,
      include: {
        sourceHospital: {
          select: {
            id: true,
            hospitalName: true,
            location: true,
            contactPerson: true
          }
        }
      }
    });

    res.status(200).json({
      status: 'success',
      results: organs.length,
      data: { organs }
    });
  } catch (error) {
    next(error);
  }
};

export const getOrganById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organ = await prisma.organ.findUnique({
      where: { id: req.params.id as string },
      include: {
        sourceHospital: {
          select: { hospitalName: true, location: true }
        }
      }
    });

    if (!organ) {
      return next(new AppError('Organ not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { organ }
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrganStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    
    const organ = await prisma.organ.findUnique({ where: { id: req.params.id as string } });
    if (!organ) {
      return next(new AppError('Organ not found', 404));
    }

    if (organ.sourceHospitalId !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('You only have permission to update organs from your hospital', 403));
    }

    const updated = await prisma.organ.update({
      where: { id: req.params.id as string },
      data: { status }
    });

    res.status(200).json({
      status: 'success',
      data: { organ: updated }
    });
  } catch (error) {
    next(error);
  }
};

export const notifyHospital = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organ = await prisma.organ.findUnique({
      where: { id: req.params.id as string },
      include: { sourceHospital: true }
    });

    if (!organ) {
      return next(new AppError('Organ not found', 404));
    }

    // Send email
    await sendOrganInterestEmail(
      organ.sourceHospital.officialEmail,
      organ.organType,
      req.user.hospitalName,
      'URGENT'
    );

    res.status(200).json({
      status: 'success',
      message: `Email notification sent to ${organ.sourceHospital.hospitalName}`
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const totalOrgans = await prisma.organ.count({
      where: { status: 'available', expiryTime: { gt: new Date() } }
    });
    
    const totalHospitals = await prisma.hospital.count();
    
    // Count alerts in last 24 hours
    const activeAlerts = await prisma.alert.count({
      where: { 
        createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        totalOrgans,
        totalHospitals,
        activeAlerts
      }
    });
  } catch (error) {
    next(error);
  }
};
