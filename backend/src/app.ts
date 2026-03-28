import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './common/middlewares/errorHandler';

const app = express();

// Security middlewares
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // limit each IP to 2000 requests per windowMs (to accommodate polling heartbeats)
});
app.use('/api/', limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import authRoutes from './auth/authRoutes';
import organRoutes from './organs/organRoutes';
import requestRoutes from './requests/requestRoutes';
import hospitalRoutes from './hospitals/hospitalRoutes';
import alertRoutes from './alerts/alertRoutes';
import notificationRoutes from './notifications/notificationRoutes';
import transportRoutes from './transports/transportRoutes';
import certificateRoutes from './certificates/certificateRoutes';
import chatRoutes from './chat/chatRoutes';

app.use('/api/auth', authRoutes);
app.use('/api/organs', organRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/transports', transportRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/chat', chatRoutes);


app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Error handling
app.use(errorHandler);

export default app;
