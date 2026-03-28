import { Router } from 'express';
import { getMyConversations, getMessages, sendMessage, getUnreadCount } from './chatController';
import { protect } from '../common/middlewares/authMiddleware';

const router = Router();

router.use(protect);

router.get('/conversations', getMyConversations);
router.get('/unread-count', getUnreadCount);
router.get('/:targetHospitalId', getMessages);
router.post('/send', sendMessage);

export default router;
