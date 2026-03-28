import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../prisma';
import { AppError } from '../common/middlewares/errorHandler';
import { sendHospitalDirectEmail } from '../utils/emailService';

// Get current hospital's profile
export const getMyProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospital = await prisma.hospital.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        hospitalName: true,
        hospitalId: true,
        officialEmail: true,
        contactPerson: true,
        phoneNumber: true,
        location: true,
        verificationStatus: true,
        accountStatus: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!hospital) {
      return next(new AppError('Hospital not found', 404));
    }

    // Get stats
    const [organsCount, requestsSentCount, requestsReceivedCount, certificatesCount] = await Promise.all([
      prisma.organ.count({ where: { sourceHospitalId: req.user.id } }),
      prisma.organRequest.count({ where: { requestingHospitalId: req.user.id } }),
      prisma.organRequest.count({ where: { sourceHospitalId: req.user.id } }),
      prisma.donorCertificate.count({ where: { sourceHospitalId: req.user.id } }),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        hospital,
        stats: {
          organsUploaded: organsCount,
          requestsSent: requestsSentCount,
          requestsReceived: requestsReceivedCount,
          certificatesIssued: certificatesCount,
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update hospital profile
export const updateMyProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { hospitalName, contactPerson, phoneNumber, location } = req.body;

    const updated = await prisma.hospital.update({
      where: { id: req.user.id },
      data: {
        ...(hospitalName && { hospitalName }),
        ...(contactPerson && { contactPerson }),
        ...(phoneNumber && { phoneNumber }),
        ...(location && { location }),
      },
      select: {
        id: true,
        hospitalName: true,
        hospitalId: true,
        officialEmail: true,
        contactPerson: true,
        phoneNumber: true,
        location: true,
        verificationStatus: true,
        accountStatus: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: { hospital: updated }
    });
  } catch (error) {
    next(error);
  }
};

// Change password
export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return next(new AppError('Current password and new password are required', 400));
    }

    if (newPassword.length < 8) {
      return next(new AppError('New password must be at least 8 characters', 400));
    }

    // Get hospital with password
    const hospital = await prisma.hospital.findUnique({
      where: { id: req.user.id }
    });

    if (!hospital) {
      return next(new AppError('Hospital not found', 404));
    }

    // Verify current password
    const isCorrect = await bcrypt.compare(currentPassword, hospital.password);
    if (!isCorrect) {
      return next(new AppError('Current password is incorrect', 401));
    }

    // Hash and update
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.hospital.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    res.status(200).json({
      status: 'success',
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getAllHospitals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitals = await prisma.hospital.findMany({
      select: {
          id: true,
          hospitalName: true,
          hospitalId: true,
          location: true,
          officialEmail: true
      }
    });

    res.status(200).json({
      status: 'success',
      data: { hospitals }
    });
  } catch (error) {
    next(error);
  }
};

export const sendDirectEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { hospitalId, subject, message } = req.body;

    const target = await prisma.hospital.findUnique({
      where: { id: hospitalId }
    });

    if (!target) return next(new AppError('Target hospital not found', 404));

    await sendHospitalDirectEmail(
      target.officialEmail,
      req.user.hospitalName,
      subject,
      message
    );

    res.status(200).json({
      status: 'success',
      message: 'Email notification sent successfully'
    });
  } catch (error) {
    next(error);
  }
};
