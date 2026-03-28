import { Router } from 'express';
import { body } from 'express-validator';
import { getMyProfile, updateMyProfile, changePassword, getAllHospitals, sendDirectEmail } from './hospitalController';
import { protect } from '../common/middlewares/authMiddleware';
import { validate } from '../common/middlewares/validationMiddleware';

const router = Router();

// All routes require authentication
router.use(protect);

// Get my profile
router.get('/me', getMyProfile);

// Update my profile
router.patch('/me', [
  body('hospitalName').optional().notEmpty(),
  body('contactPerson').optional().notEmpty(),
  body('phoneNumber').optional().notEmpty(),
  body('location').optional().notEmpty(),
  validate
], updateMyProfile);

// Change password
router.post('/change-password', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  validate
], changePassword);

router.get('/', getAllHospitals);
router.post('/communicate', [
  body('hospitalId').notEmpty(),
  body('subject').notEmpty(),
  body('message').notEmpty(),
  validate
], sendDirectEmail);

export default router;
