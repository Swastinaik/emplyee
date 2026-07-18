import { login } from '../src/controllers/authController';
import Employee from '../src/models/Employee';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// Mock Employee Model and jsonwebtoken
jest.mock('../src/models/Employee');
jest.mock('jsonwebtoken');

describe('Auth Controller - Login Unit Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();

  beforeEach(() => {
    mockRequest = {
      body: {
        email: 'admin@ems.com',
        password: 'adminpassword123',
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };

    jest.clearAllMocks();
  });

  it('should log in successfully with valid credentials', async () => {
    const mockEmployee = {
      _id: 'mockId123',
      role: 'Super Admin',
      status: 'Active',
      comparePassword: jest.fn().mockResolvedValue(true),
      toObject: jest.fn().mockReturnValue({
        _id: 'mockId123',
        name: 'Super Admin',
        email: 'admin@ems.com',
        role: 'Super Admin',
        status: 'Active',
      }),
    };

    // Mock DB queries
    (Employee.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(mockEmployee),
    });

    // Mock token sign
    (jwt.sign as jest.Mock).mockReturnValue('mockJwtTokenValue');

    await login(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(Employee.findOne).toHaveBeenCalledWith({ email: 'admin@ems.com' });
    expect(mockEmployee.comparePassword).toHaveBeenCalledWith('adminpassword123');
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.cookie).toHaveBeenCalled();
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        token: 'mockJwtTokenValue',
      })
    );
  });

  it('should fail if email is not found', async () => {
    (Employee.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    await login(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: 'Invalid email or password',
      })
    );
  });

  it('should fail if password does not match', async () => {
    const mockEmployee = {
      _id: 'mockId123',
      role: 'Super Admin',
      status: 'Active',
      comparePassword: jest.fn().mockResolvedValue(false),
    };

    (Employee.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(mockEmployee),
    });

    await login(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockEmployee.comparePassword).toHaveBeenCalledWith('adminpassword123');
    expect(nextFunction).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: 'Invalid email or password',
      })
    );
  });
});
