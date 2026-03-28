import http from 'http';
import app from './app';
// import { setupSocket } from './chat/socket';
import dotenv from 'dotenv';
import prisma from './prisma';
// import './utils/scheduler';

dotenv.config();

const server = http.createServer(app);

// Initialize Socket.io
// setupSocket(server);

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully.');

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to the database', error);
    process.exit(1);
  }
}

bootstrap();
