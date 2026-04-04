import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../common/middlewares/errorHandler';
import { sendOtpEmail } from '../utils/emailService';

// Generate a random 6-digit OTP
const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP
export const sendOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, purpose } = req.body; // purpose: 'signup' or 'login'

    console.log(`\n[OTP Request] Sending to ${email} for ${purpose}...`);

    if (!email || !purpose) {
      return next(new AppError('Email and purpose are required', 400));
    }

    // Delete any existing unexpired OTPs for this email + purpose
    try {
      await prisma.otp.deleteMany({
        where: { email, purpose }
      });
    } catch (dbErr: any) {
      console.error(`[Prisma OTP Cleanup Error]: ${dbErr.message}`);
      // Don't crash here - if delete fails, we can still try to create
    }

    // Generate new OTP
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store OTP in database
    try {
      await prisma.otp.create({
        data: { email, code, purpose, expiresAt }
      });
    } catch (dbErr: any) {
      console.error(`[Prisma OTP Create Error]: ${dbErr.message}`);
      return next(new AppError('Database connection error. Please try again.', 500));
    }

    // Send OTP via email - Fire and forget to avoid Render timeouts
    sendOtpEmail(email, code, purpose).catch(emailErr => {
      console.error(`[Background Email Error]: ${emailErr.message}`);
    });

    console.log(`\n=================================\n🚨 OTP for ${email}: ${code}\n=================================\n`);

    res.status(200).json({
      status: 'success',
      message: 'OTP sent successfully to your account'
    });
  } catch (error) {
    next(error);
  }
};

// Verify OTP
export const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, code, purpose } = req.body;

    if (!email || !code || !purpose) {
      return next(new AppError('Email, code, and purpose are required', 400));
    }

    // Removed Demo Bypass: All users must now use the dynamic OTP sent to their email.

    // Find the OTP record
    const otpRecord = await prisma.otp.findFirst({
      where: {
        email,
        purpose,
        verified: false
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!otpRecord) {
      return next(new AppError('No OTP found. Please request a new one.', 400));
    }

    // Check expiry
    if (new Date() > otpRecord.expiresAt) {
      await prisma.otp.delete({ where: { id: otpRecord.id } });
      return next(new AppError('OTP has expired. Please request a new one.', 400));
    }

    // Check code
    if (otpRecord.code !== code) {
      return next(new AppError('Invalid OTP. Please try again.', 400));
    }

    // Mark as verified
    await prisma.otp.update({
      where: { id: otpRecord.id },
      data: { verified: true }
    });

    res.status(200).json({
      status: 'success',
      message: 'OTP verified successfully'
    });
  } catch (error) {
    next(error);
  }
};

// --- AADHAR VERIFICATION SIMULATION ---
export const sendAadharOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { aadharNumber } = req.body;
    const email = req.user.officialEmail; 
    
    // Clear previous Aadhar OTPs
    await prisma.otp.deleteMany({
      where: { email, purpose: 'aadhar_verify' }
    });

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.otp.create({
      data: { email, code, purpose: 'aadhar_verify', expiresAt }
    });

    // We send to the Hospital email to simulate the donor receiving it, so the user can test the flow.
    await sendOtpEmail(email, code, 'aadhar_verify');

    // Also log it for convenience
    console.log(`\n=================================\n🚨 simulated Aadhar OTP for ${aadharNumber}: ${code}\n=================================\n`);

    res.status(200).json({
      status: 'success',
      message: 'OTP sent successfully (Simulated to Hospital Email)'
    });
  } catch (err) {
    next(err);
  }
};

export const verifyAadharOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { aadharNumber, code } = req.body;
    const email = req.user.officialEmail;

    // Removed Demo Bypass: All users must now use the dynamic OTP sent to their email.

    const otpRecord = await prisma.otp.findFirst({
      where: { email, purpose: 'aadhar_verify', verified: false },
      orderBy: { createdAt: 'desc' }
    });

    if (!otpRecord) return next(new AppError('No OTP found. Please request a new one.', 400));
    if (new Date() > otpRecord.expiresAt) return next(new AppError('OTP expired.', 400));
    if (otpRecord.code !== code) return next(new AppError('Invalid OTP.', 400));

    await prisma.otp.update({ where: { id: otpRecord.id }, data: { verified: true } });

    res.status(200).json({ status: 'success', message: 'Aadhar verified successfully!' });
  } catch (err) {
    next(err);
  }
};
