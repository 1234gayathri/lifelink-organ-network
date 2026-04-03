import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../prisma';
import { AppError } from '../common/middlewares/errorHandler';
import sendEmail from '../utils/sendEmail';
import { activeSessions } from '../common/middlewares/sessionManager';

const signToken = (id: string, role: string) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret', {
    expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as jwt.SignOptions['expiresIn'],
  });
};

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { hospitalName, hospitalId, officialEmail, contactPerson, phoneNumber, location, password } = req.body;

    // Reject .com emails (except whitelisted test emails)
    const whitelisted = ['rakotisaigayathri@gmail.com', 'saicharishmajoga@gmail.com', 'pravallikaramu66@gmail.com', 'pittakalpana88@gmail.com'];
    const emailLower = officialEmail.toLowerCase().trim();

    if (emailLower.endsWith('.com') && !whitelisted.includes(emailLower)) {
      return next(new AppError('Official institutional emails cannot use .com domains', 400));
    }

    // Check duplicate hospitalId or email
    const existing = await prisma.hospital.findFirst({
      where: {
        OR: [{ hospitalId }, { officialEmail }]
      }
    });

    if (existing) {
      return next(new AppError('Hospital ID or Email already exists', 400));
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create hospital
    const newHospital = await prisma.hospital.create({
      data: {
        hospitalName,
        hospitalId,
        officialEmail,
        contactPerson,
        phoneNumber,
        location,
        password: hashedPassword,
        verificationStatus: 'active', // Changed to active for testing without an Admin!
      }
    });

    const token = signToken(newHospital.id, 'hospital');

    res.status(201).json({
      status: 'success',
      token,
      data: {
        hospital: {
          id: newHospital.id,
          hospitalName: newHospital.hospitalName,
          verificationStatus: newHospital.verificationStatus
        }
      }
    });
    
    // Register active session
    activeSessions.set(newHospital.id, token);
  } catch (error) {
    next(error);
  }
};

export const loginHospital = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { hospitalId, officialEmail, password } = req.body;

    let hospital = await prisma.hospital.findUnique({
      where: { officialEmail }
    });

    // Demo Mode Bypass: If not found, check if it's a valid institutional/test email
    const whitelisted = ['rakotisaigayathri@gmail.com', 'saicharishmajoga@gmail.com', 'pravallikaramu66@gmail.com', 'pittakalpana88@gmail.com'];
    const isInstitutional = officialEmail.endsWith('.org') || officialEmail.endsWith('.edu') || officialEmail.endsWith('.gov') || officialEmail.endsWith('.in');
    
    if (!hospital && (isInstitutional || whitelisted.includes(officialEmail.toLowerCase()))) {
      // Auto-create for demo/testing purposes
      const hashedPassword = await bcrypt.hash(password, 12);
      hospital = await prisma.hospital.create({
        data: {
          hospitalName: hospitalId.replace(/_/g, ' ').replace(/-/g, ' ').toUpperCase() || 'Demo Hospital',
          hospitalId: hospitalId || 'HOSP-' + Math.random().toString(36).substring(7).toUpperCase(),
          officialEmail,
          contactPerson: 'Medical Director',
          phoneNumber: '9123456789',
          location: 'Network Node',
          password: hashedPassword,
          verificationStatus: 'active'
        }
      });
    }

    if (!hospital) {
      return next(new AppError('Incorrect email or password', 401));
    }

    if (hospital.hospitalId !== hospitalId) {
      return next(new AppError('Incorrect Hospital ID for this account', 401));
    }

    if (!(await bcrypt.compare(password, hospital.password))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    if (hospital.verificationStatus !== 'active' || hospital.accountStatus !== 'active') {
      return next(new AppError('Hospital account is not active or suspended', 403));
    }

    // === SINGLE DEVICE POLICY ===
    // If an active session already exists for this hospital, BLOCK the new login
    if (activeSessions.has(hospital.id)) {
      // Send security alert email to the hospital
      try {
        await sendEmail({
          email: hospital.officialEmail,
          subject: '⚠️ LifeLink Security Alert: Unauthorized Login Attempt Blocked',
          message: `Dear ${hospital.hospitalName},\n\nA login attempt was made on your LifeLink account from a new device or browser, but it was BLOCKED because your account is already active on another device.\n\nIf this was not you, please immediately log out from your current device and reset your password.\n\nIf this was you, please log out from your current device first before logging in on another device.\n\nStay safe,\nLifeLink Security Team`
        });
      } catch (err) {
        console.error('Failed to send security alert email', err);
      }

      return next(new AppError(
        'This account is already logged in on another device. Simultaneous access is not permitted for security purposes. Please log out from the other device first.',
        403
      ));
    }

    const token = signToken(hospital.id, 'hospital');
    activeSessions.set(hospital.id, token);

    res.status(200).json({
      status: 'success',
      token,
      data: {
        hospital: {
          id: hospital.id,
          hospitalName: hospital.hospitalName
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const loginAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const admin = await prisma.admin.findUnique({
      where: { email }
    });

    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    const token = signToken(admin.id, 'admin');

    res.status(200).json({
      status: 'success',
      token,
      data: {
        admin: {
          id: admin.id,
          email: admin.email
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user
    }
  });
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (userId) {
      activeSessions.delete(userId);
    }
    res.status(200).json({ status: 'success', message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};


export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { officialEmail, hospitalId } = req.body;

    const hospital = await prisma.hospital.findUnique({ where: { officialEmail } });
    if (!hospital || hospital.hospitalId !== hospitalId) {
      return next(new AppError('Invalid Hospital ID or Official Email address.', 404));
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const tokenExpires = new Date();
    tokenExpires.setMinutes(tokenExpires.getMinutes() + 10);

    await prisma.hospital.update({
      where: { officialEmail },
      data: {
        resetPasswordToken: passwordResetToken,
        resetPasswordExpire: tokenExpires
      }
    });

    const resetURL = `http://localhost:5173/reset-password/${resetToken}`;
    const message = `Forgot your password? Click on the link below to reset your password:\n\n${resetURL}\n\nIf you didn't forget your password, please ignore this email!`;

    try {
      await sendEmail({
        email: hospital.officialEmail,
        subject: 'LifeLink - Your Password Reset Token (valid for 10 min)',
        message
      });

      res.status(200).json({
        status: 'success',
        message: 'Token sent to email!'
      });
    } catch (err) {
      await prisma.hospital.update({
        where: { officialEmail },
        data: {
          resetPasswordToken: null,
          resetPasswordExpire: null
        }
      });
      return next(new AppError('There was an error sending the reset email. Try again later.', 500));
    }
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token as string).digest('hex');

    const hospital = await prisma.hospital.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { gte: new Date() }
      }
    });

    if (!hospital) {
      return next(new AppError('Token is invalid or has expired', 400));
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 12);

    await prisma.hospital.update({
      where: { id: hospital.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpire: null
      }
    });

    const token = signToken(hospital.id, 'hospital');

    res.status(200).json({
        status: 'success',
        token,
        data: {
          hospital: {
            id: hospital.id,
            hospitalName: hospital.hospitalName
          }
        }
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [hospitals, auditLogs, allocations] = await Promise.all([
      prisma.hospital.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          hospitalName: true,
          hospitalId: true,
          officialEmail: true,
          location: true,
          verificationStatus: true,
          createdAt: true
        }
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20
      }),
      prisma.organRequest.findMany({
        orderBy: { requestedAt: 'desc' },
        take: 10,
        include: {
          requestingHospital: { select: { hospitalName: true } },
          sourceHospital: { select: { hospitalName: true } },
          organ: { select: { organType: true } }
        }
      })
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        hospitals,
        auditLogs,
        allocations
      }
    });
  } catch (error) {
    next(error);
  }
};
