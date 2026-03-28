import { Router } from 'express';
import { body } from 'express-validator';
import { sendRequest, getIncomingRequests, getOutgoingRequests, updateRequestStatus } from './requestController';
import { protect, restrictTo } from '../common/middlewares/authMiddleware';
import { validate } from '../common/middlewares/validationMiddleware';

const router = Router();

router.use(protect);
router.use(restrictTo('hospital', 'admin'));

router.post('/', [
  body('organId').notEmpty(),
  body('urgencyLevel').isIn(['low', 'medium', 'high', 'critical']),
  body('patientBloodGroup').notEmpty(),
  body('patientHlaType').notEmpty(),
  validate
], sendRequest);

router.get('/incoming', getIncomingRequests);
router.get('/outgoing', getOutgoingRequests);

router.patch('/:id/status', [
  body('status').isIn(['sent', 'received', 'under_review', 'approved', 'rejected', 'transport_started', 'delivered', 'completed', 'cancelled']),
  validate
], updateRequestStatus);

export default router;
