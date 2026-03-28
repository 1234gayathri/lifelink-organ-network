import { Router } from 'express';
import { getActiveAlerts, createAlert } from './alertController';
import { protect } from '../common/middlewares/authMiddleware';

const router = Router();

// Protect all routes
router.use(protect);

router.get('/', getActiveAlerts);
router.post('/', createAlert);

export default router;
