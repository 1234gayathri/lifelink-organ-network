import { Router } from 'express';
import { body } from 'express-validator';
import { signup, loginHospital, loginAdmin, getMe, forgotPassword, resetPassword, getAdminStats } from './authController';
import { sendOtp, verifyOtp } from './otpController';
import { protect, restrictTo } from '../common/middlewares/authMiddleware';
import { validate } from '../common/middlewares/validationMiddleware';

const router = Router();

// Hospital Signup
router.post(
  '/hospital/signup',
  [
    body('hospitalName').notEmpty().withMessage('Hospital name is required'),
    body('hospitalId').notEmpty().withMessage('Hospital ID is required'),
    body('officialEmail')
      .isEmail().withMessage('Valid email is required')
      .custom(val => {
        const whitelisted = ['rakotisaigayathri@gmail.com', 'saicharishmajoga@gmail.com'];
        const emailLower = val.toLowerCase().trim();
        if (whitelisted.includes(emailLower)) return true;
        if (emailLower.endsWith('.com')) throw new Error('.com emails are not allowed');
        return true;
      }),
    body('contactPerson').notEmpty(),
    body('phoneNumber').notEmpty(),
    body('location').notEmpty(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 chars'),
    validate
  ],
  signup
);

// Hospital Login
router.post('/hospital/login', [
  body('officialEmail').isEmail(),
  body('password').notEmpty(),
  validate
], loginHospital);

// Admin Login
router.post('/admin/login', [
  body('email').isEmail(),
  body('password').notEmpty(),
  validate
], loginAdmin);

// OTP Routes
router.post('/otp/send', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('purpose').isIn(['signup', 'login']).withMessage('Purpose must be signup or login'),
  validate
], sendOtp);

router.post('/otp/verify', [
  body('email').isEmail(),
  body('code').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('purpose').isIn(['signup', 'login']),
  validate
], verifyOtp);

// Aadhar OTP (Simulated via email to hospital)
import { sendAadharOtp, verifyAadharOtp } from './otpController';

router.post('/aadhar/send', protect, [
  body('aadharNumber').isLength({ min: 12, max: 12 }),
  validate
], sendAadharOtp);

router.post('/aadhar/verify', protect, [
  body('aadharNumber').isLength({ min: 12, max: 12 }),
  body('code').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  validate
], verifyAadharOtp);

// Me
router.get('/me', protect, getMe);

// Admin Monitoring (Live Data)
router.get('/monitor', protect, restrictTo('admin'), getAdminStats);

// Password Reset
router.post('/forgot-password', [
  body('hospitalId').notEmpty().withMessage('Hospital ID is required'),
  body('officialEmail').isEmail().withMessage('Please provide a valid official email')
], validate, forgotPassword);

router.post('/reset-password/:token', [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], validate, resetPassword);

export default router;
