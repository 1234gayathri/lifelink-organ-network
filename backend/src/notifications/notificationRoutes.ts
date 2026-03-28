import { Router } from 'express';
import { getMyNotifications, markAsRead, markAllAsRead } from './notificationController';
import { protect } from '../common/middlewares/authMiddleware';

const router = Router();

// Protect all routes
router.use(protect);

// Get notifications
router.get('/', getMyNotifications);

// Mark as read
router.patch('/:id/read', markAsRead);

// Mark all as read
router.patch('/read-all', markAllAsRead);

export default router;
