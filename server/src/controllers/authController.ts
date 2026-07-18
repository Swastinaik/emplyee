import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import Employee from '../models/Employee';
import { createError } from '../middleware/errorHandler';

/**
 * Helper to generate JWT token
 */
const generateToken = (userId: string, role: string): string => {
  return jwt.sign({ id: userId, role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as any,
  });
};

/**
 * Helper to set HTTP-only cookie
 */
const sendCookie = (res: Response, token: string) => {
  const cookieOptions = {
    httpOnly: true,
    expires: new Date(
      Date.now() + 24 * 60 * 60 * 1000 // 1 day
    ),
    secure: config.nodeEnv === 'production',
    sameSite: (config.nodeEnv === 'production' ? 'none' : 'lax') as 'none' | 'lax' | 'strict',
  };
  res.cookie(config.jwt.cookieName, token, cookieOptions);
};

/**
 * @desc    Login employee
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { email, password } = req.body;

  try {
    // Find employee and explicitly select password field
    const employee = await Employee.findOne({ email }).select('+password');

    if (!employee) {
      next(createError('Invalid email or password', 401));
      return;
    }

    if (employee.status !== 'Active') {
      next(createError('Your account is currently inactive. Please contact HR.', 403));
      return;
    }

    // Verify password
    const isMatch = await employee.comparePassword(password);
    if (!isMatch) {
      next(createError('Invalid email or password', 401));
      return;
    }

    // Generate JWT
    const token = generateToken((employee._id as any).toString(), employee.role);

    // Set cookie
    sendCookie(res, token);

    // Remove password from response
    const userResponse = employee.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: {
        user: userResponse,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout employee / Clear cookie
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.cookie(config.jwt.cookieName, '', {
      httpOnly: true,
      expires: new Date(0), // Set to expire immediately
      secure: config.nodeEnv === 'production',
      sameSite: (config.nodeEnv === 'production' ? 'none' : 'lax') as 'none' | 'lax' | 'strict',
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently logged in employee profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      next(createError('User not authenticated', 401));
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    next(error);
  }
};
