import { Router } from 'express';
import { body } from 'express-validator';
import { addOrgan, getOrgans, getOrganById, updateOrganStatus, notifyHospital, getDashboardStats, getMyOrgans } from './organController';
import { protect, restrictTo } from '../common/middlewares/authMiddleware';
import { validate } from '../common/middlewares/validationMiddleware';

const router = Router();

router.use(protect); // Only logged-in users
router.use(restrictTo('hospital', 'admin'));

router.post('/', [
  body('organType').notEmpty().withMessage('Missing Organ Type'),
  body('bloodGroup').notEmpty().withMessage('Missing Blood Group'),
  body('hlaType').notEmpty().withMessage('Missing HLA Type'),
  body('extractionTime').isISO8601().withMessage('Missing mapping for extractionTime or invalid date'),
  body('maxStorageMinutes').isInt({ min: 1 }).withMessage('Missing valid storage time'),
  validate
], addOrgan);

router.get('/', getOrgans);
router.get('/stats', getDashboardStats);
router.get('/my', getMyOrgans);
router.get('/:id', getOrganById);

router.patch('/:id/status', [
  body('status').isIn(['available', 'reserved', 'allocated', 'expired', 'transported', 'completed']),
  validate
], updateOrganStatus);

router.post('/:id/notify', protect, notifyHospital);

export default router;
