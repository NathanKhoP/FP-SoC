import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../models/User';

// Extend the Express Request interface to include user information
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
      };
    }
  }
}

// Get JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-jwt-secret';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  // Get token from Authorization header or x-auth-token
  let token = req.header('x-auth-token');
  
  // Check Authorization header if x-auth-token is not present
  if (!token) {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  // Check if no token
  if (!token) {
    res.status(401).json({ message: 'No token, authorization denied' });
    return;
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: UserRole };
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export const authorize = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if user exists on the request (should be set by authenticate middleware)
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return; // Return without calling next()
    }

    // Check if user has required role
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Not authorized to access this resource' });
      return; // Return without calling next()
    }

    next();
  };
};