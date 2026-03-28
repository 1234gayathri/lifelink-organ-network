import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import prisma from '../../prisma';

// Extend express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    // Verify token
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');

    // Check if user still exists
    let currentUser;
    if (decoded.role === 'admin') {
      currentUser = await prisma.admin.findUnique({ where: { id: decoded.id } });
    } else {
      currentUser = await prisma.hospital.findUnique({ where: { id: decoded.id } });
    }

    if (!currentUser) {
      return next(new AppError('The user belonging to this token does no longer exist.', 401));
    }
    
    // Check if hospital is suspended or pending
    if (decoded.role === 'hospital' && ('verificationStatus' in currentUser)) {
      if (currentUser.verificationStatus !== 'active' || currentUser.accountStatus !== 'active') {
        return next(new AppError('Your account is not active or suspended', 403));
      }
    }

    // Grant access
    req.user = {
      ...currentUser,
      role: decoded.role
    };
    next();
  } catch (error) {
    next(new AppError('Invalid token or expired. Please log in again.', 401));
  }
};

export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};
