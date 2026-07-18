import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import Employee, { IEmployee } from '../models/Employee';
import { createError } from './errorHandler';

interface JwtPayload {
  id: string;
  role: string;
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token = req.cookies[config.jwt.cookieName];

  // Also check Authorization header as fallback (useful for API development/testing)
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    next(createError('Authentication required. Please log in.', 401));
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    const employee = await Employee.findById(decoded.id);

    if (!employee) {
      next(createError('The user belonging to this token no longer exists.', 401));
      return;
    }

    if (employee.status !== 'Active') {
      next(createError('Your account is currently inactive. Please contact admin.', 403));
      return;
    }

    // Attach employee object to the request
    req.user = employee;
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      next(createError('Invalid token. Please log in again.', 401));
    } else if (error.name === 'TokenExpiredError') {
      next(createError('Your session has expired. Please log in again.', 401));
    } else {
      next(error);
    }
  }
};
