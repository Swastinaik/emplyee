import { Request, Response, NextFunction } from 'express';
import { EmployeeRole } from '../models/Employee';
import { createError } from './errorHandler';

export const authorize = (...allowedRoles: EmployeeRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(createError('Authentication required.', 401));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(
        createError(
          `Access denied. Your role (${req.user.role}) does not have permission to perform this action.`,
          403
        )
      );
      return;
    }

    next();
  };
};
