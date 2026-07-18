import { authorize } from '../src/middleware/rbac';
import { EmployeeRole } from '../src/models/Employee';
import { Request, Response, NextFunction } from 'express';

describe('RBAC Middleware - Role Authorization Unit Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();

  beforeEach(() => {
    mockRequest = {
      user: {
        role: EmployeeRole.EMPLOYEE,
      } as any,
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it('should allow access if user has one of the allowed roles', () => {
    mockRequest.user!.role = EmployeeRole.HR_MANAGER;

    const middleware = authorize(EmployeeRole.SUPER_ADMIN, EmployeeRole.HR_MANAGER);
    middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(); // called with no errors
  });

  it('should block access with 403 if user role is not allowed', () => {
    mockRequest.user!.role = EmployeeRole.EMPLOYEE;

    const middleware = authorize(EmployeeRole.SUPER_ADMIN, EmployeeRole.HR_MANAGER);
    middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 403,
        message: expect.stringContaining('Access denied'),
      })
    );
  });

  it('should block access with 401 if user is not authenticated', () => {
    mockRequest.user = undefined;

    const middleware = authorize(EmployeeRole.SUPER_ADMIN);
    middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: 'Authentication required.',
      })
    );
  });
});
describe('Verification test stub', () => {
  it('should pass a basic validation', () => {
    expect(true).toBe(true);
  });
});
