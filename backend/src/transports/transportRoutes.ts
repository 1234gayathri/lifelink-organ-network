import { Router } from 'express';
import { getMyTransports, updateCheckpoint } from './transportController';
import { protect } from '../common/middlewares/authMiddleware';

const router = Router();

router.use(protect);

router.get('/my', getMyTransports);
router.patch('/:id/checkpoint', updateCheckpoint);

export default router;
