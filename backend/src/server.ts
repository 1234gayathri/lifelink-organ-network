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
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      console.log(`Database connecting... (Attempt ${retries + 1}/${maxRetries})`);
      await prisma.$connect();
      console.log('Database connected successfully.');
      break;
    } catch (error: any) {
      retries++;
      console.error(`Database connection failed (Attempt ${retries}/${maxRetries}):`, error.message);
      if (retries === maxRetries) {
        console.error('Max database connection retries reached. Exiting.');
        process.exit(1);
      }
      // Wait before retrying (2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

bootstrap();
