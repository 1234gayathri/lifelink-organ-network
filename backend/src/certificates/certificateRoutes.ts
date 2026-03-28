import { Router } from 'express';
import { getMyCertificates, generateCertificate } from './certificateController';
import { protect } from '../common/middlewares/authMiddleware';

const router = Router();

router.use(protect);

router.get('/my', getMyCertificates);
router.post('/generate', generateCertificate);

export default router;
