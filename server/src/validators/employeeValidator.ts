import { z } from 'zod';
import { EmployeeRole, EmployeeStatus } from '../models/Employee';

export const createEmployeeSchema = z.object({
  employeeId: z
    .string({ required_error: 'Employee ID is required' })
    .trim()
    .min(1, 'Employee ID cannot be empty'),
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(1, 'Name cannot be empty'),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Please enter a valid email address'),
  phone: z
    .string({ required_error: 'Phone number is required' })
    .trim()
    .regex(/^\+?[1-9]\d{1,14}$|^[0-9]{10}$/, 'Please enter a valid phone number'),
  department: z
    .string({ required_error: 'Department is required' })
    .trim()
    .min(1, 'Department cannot be empty'),
  designation: z
    .string({ required_error: 'Designation is required' })
    .trim()
    .min(1, 'Designation cannot be empty'),
  salary: z
    .number({ required_error: 'Salary is required' })
    .nonnegative('Salary must be a non-negative number'),
  joiningDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  status: z
    .nativeEnum(EmployeeStatus)
    .optional()
    .default(EmployeeStatus.ACTIVE),
  role: z.nativeEnum(EmployeeRole, {
    required_error: 'Role is required',
  }),
  reportingManager: z
    .string()
    .trim()
    .nullable()
    .optional()
    .refine((val) => {
      if (!val) return true;
      // Basic check for MongoDB ObjectId hex format
      return /^[0-9a-fA-F]{24}$/.test(val);
    }, 'Invalid reporting manager ID'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters long'),
});

export const updateEmployeeSchema = createEmployeeSchema
  .partial()
  .omit({ password: true })
  .extend({
    password: z.string().min(6, 'Password must be at least 6 characters long').optional(),
  });

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
