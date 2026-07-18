import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import csvParser from 'csv-parser';
import Employee, { EmployeeRole, EmployeeStatus } from '../models/Employee';
import { createError } from '../middleware/errorHandler';
import { deleteFile } from '../utils/helpers';

/**
 * @desc    Create new employee
 * @route   POST /api/employees
 * @access  Private (Super Admin, HR Manager)
 */
export const createEmployee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const creator = req.user;
    if (!creator) {
      next(createError('Authentication required', 401));
      return;
    }

    const employeeData = { ...req.body };

    // 1. Check if email already exists
    const emailExists = await Employee.findOne({ email: employeeData.email });
    if (emailExists) {
      next(createError('An employee with this email already exists', 400));
      return;
    }

    // 2. Check if employeeId already exists
    const idExists = await Employee.findOne({ employeeId: employeeData.employeeId });
    if (idExists) {
      next(createError('An employee with this Employee ID already exists', 400));
      return;
    }

    // 3. Enforce RBAC for role assignment
    if (employeeData.role === EmployeeRole.SUPER_ADMIN && creator.role !== EmployeeRole.SUPER_ADMIN) {
      next(createError('HR Managers cannot assign the Super Admin role', 403));
      return;
    }

    // 4. Handle file upload for profile image
    if (req.file) {
      // Store relative path (e.g. 'uploads/image.png')
      employeeData.profileImage = `uploads/${req.file.filename}`;
    }

    // 5. Create employee
    const newEmployee = new Employee(employeeData);
    await newEmployee.save();

    // Remove password before returning
    const responseData = newEmployee.toObject();
    delete responseData.password;

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: {
        employee: responseData,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all employees with pagination, search, sorting, and filtering
 * @route   GET /api/employees
 * @access  Private (Super Admin, HR Manager)
 */
export const getEmployees = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      search,
      department,
      role,
      status,
      sortBy = 'name',
      sortOrder = 'asc',
      page = '1',
      limit = '10',
    } = req.query;

    const query: any = { isDeleted: false };

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Filters
    if (department) {
      query.department = department;
    }
    if (role) {
      query.role = role;
    }
    if (status) {
      query.status = status;
    }

    // Sorting
    const sort: any = {};
    if (sortBy === 'joiningDate' || sortBy === 'name') {
      sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort['name'] = 1;
    }

    // Pagination
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const skipNum = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Employee.countDocuments(query);

    // Get employees
    const employees = await Employee.find(query)
      .sort(sort)
      .skip(skipNum)
      .limit(limitNum)
      .populate('reportingManager', '_id name email employeeId');

    res.status(200).json({
      success: true,
      count: employees.length,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
      data: {
        employees,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single employee details
 * @route   GET /api/employees/:id
 * @access  Private (All roles)
 */
export const getEmployeeById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    if (!currentUser) {
      next(createError('Authentication required', 401));
      return;
    }

    // If role is Employee, they can only view their own profile
    if (currentUser.role === EmployeeRole.EMPLOYEE && currentUser.id !== id) {
      next(createError('Access denied. You can only view your own profile.', 403));
      return;
    }

    const employee = await Employee.findById(id).populate('reportingManager', '_id name email employeeId');

    if (!employee || employee.isDeleted) {
      next(createError('Employee not found', 404));
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        employee,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update employee details
 * @route   PUT /api/employees/:id
 * @access  Private (All roles with different field restrictions)
 */
export const updateEmployee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    if (!currentUser) {
      next(createError('Authentication required', 401));
      return;
    }

    // Find the target employee
    const employee = await Employee.findById(id);
    if (!employee || employee.isDeleted) {
      next(createError('Employee not found', 404));
      return;
    }

    const updates: any = { ...req.body };

    // Ensure we handle file upload if profile image changes
    if (req.file) {
      // Delete old profile image if it exists
      if (employee.profileImage) {
        deleteFile(employee.profileImage);
      }
      updates.profileImage = `uploads/${req.file.filename}`;
    }

    // ─── Enforce RBAC Rules ───

    // Case 1: Employee role
    if (currentUser.role === EmployeeRole.EMPLOYEE) {
      // Can only update own profile
      if (currentUser.id !== id) {
        // Cleanup newly uploaded file if permission denied
        if (req.file) deleteFile(`uploads/${req.file.filename}`);
        next(createError('Access denied. You can only edit your own profile.', 403));
        return;
      }

      // Can only update: phone, profileImage, and password (if they change it)
      const allowedFields = ['phone', 'profileImage', 'password'];
      const filteredUpdates: any = {};
      
      allowedFields.forEach((field) => {
        if (updates[field] !== undefined) {
          filteredUpdates[field] = updates[field];
        }
      });

      // Apply filtered updates
      Object.assign(employee, filteredUpdates);
    } 
    
    // Case 2: HR Manager role
    else if (currentUser.role === EmployeeRole.HR_MANAGER) {
      // Cannot edit a Super Admin's account
      if (employee.role === EmployeeRole.SUPER_ADMIN) {
        if (req.file) deleteFile(`uploads/${req.file.filename}`);
        next(createError('Access denied. HR Managers cannot modify Super Admin profiles.', 403));
        return;
      }

      // Cannot change role to Super Admin
      if (updates.role === EmployeeRole.SUPER_ADMIN) {
        if (req.file) deleteFile(`uploads/${req.file.filename}`);
        next(createError('HR Managers cannot assign the Super Admin role.', 403));
        return;
      }

      // HR can edit other fields (except employeeId, which shouldn't be edited)
      delete updates.employeeId;
      Object.assign(employee, updates);
    } 
    
    // Case 3: Super Admin role (Full update privileges)
    else {
      // Cannot edit own role to prevent self-demotion if they are the only admin
      if (currentUser.id === id && updates.role && updates.role !== EmployeeRole.SUPER_ADMIN) {
        const adminCount = await Employee.countDocuments({ role: EmployeeRole.SUPER_ADMIN, isDeleted: false });
        if (adminCount <= 1) {
          if (req.file) deleteFile(`uploads/${req.file.filename}`);
          next(createError('Cannot change your role. You are the only Super Admin.', 400));
          return;
        }
      }
      
      delete updates.employeeId; // Employee ID remains immutable
      Object.assign(employee, updates);
    }

    // Save modifications
    await employee.save();

    // Return the updated employee
    const updatedEmployee = await Employee.findById(id).populate('reportingManager', '_id name email employeeId');
    const responseData = updatedEmployee?.toObject();
    if (responseData) {
      delete responseData.password;
    }

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: {
        employee: responseData,
      },
    });
  } catch (error) {
    // Clean up uploaded file in case of error
    if (req.file) {
      deleteFile(`uploads/${req.file.filename}`);
    }
    next(error);
  }
};

/**
 * @desc    Soft delete an employee
 * @route   DELETE /api/employees/:id
 * @access  Private (Super Admin only)
 */
export const deleteEmployee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if target exists
    const employee = await Employee.findById(id);
    if (!employee || employee.isDeleted) {
      next(createError('Employee not found', 404));
      return;
    }

    // Prevent self deletion
    if (req.user?.id === id) {
      next(createError('You cannot delete your own account', 400));
      return;
    }

    // Prevent deletion of the last Super Admin
    if (employee.role === EmployeeRole.SUPER_ADMIN) {
      const adminCount = await Employee.countDocuments({ role: EmployeeRole.SUPER_ADMIN, isDeleted: false });
      if (adminCount <= 1) {
        next(createError('Cannot delete the only remaining Super Admin account', 400));
        return;
      }
    }

    // Soft delete
    employee.isDeleted = true;
    employee.status = EmployeeStatus.INACTIVE; // Mark inactive as well
    await employee.save();

    res.status(200).json({
      success: true,
      message: `Employee ${employee.name} soft deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk CSV Import employees
 * @route   POST /api/employees/import
 * @access  Private (Super Admin, HR Manager)
 */
export const importEmployees = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const creator = req.user;
    if (!creator) {
      next(createError('Authentication required', 401));
      return;
    }

    if (!req.file) {
      next(createError('Please upload a CSV file', 400));
      return;
    }

    const results: any[] = [];
    const errors: string[] = [];
    let successCount = 0;

    // Read and parse the uploaded CSV file
    fs.createReadStream(req.file.path)
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        // Remove file after loading into memory
        fs.unlinkSync(req.file!.path);

        for (let i = 0; i < results.length; i++) {
          const row = results[i];
          const rowNum = i + 2; // CSV headers are row 1

          const {
            employeeId,
            name,
            email,
            phone,
            department,
            designation,
            salary,
            joiningDate,
            status,
            role,
            password,
          } = row;

          try {
            // 1. Basic field presence checks
            if (!employeeId || !name || !email || !phone || !department || !designation || !salary || !role) {
              errors.push(`Row ${rowNum}: Missing one or more required fields.`);
              continue;
            }

            // 2. Validate email format
            const emailRegex = /^\S+@\S+\.\S+$/;
            if (!emailRegex.test(email)) {
              errors.push(`Row ${rowNum}: Invalid email format (${email}).`);
              continue;
            }

            // 3. Validate phone format
            const phoneRegex = /^\+?[1-9]\d{1,14}$|^[0-9]{10}$/;
            if (!phoneRegex.test(phone)) {
              errors.push(`Row ${rowNum}: Invalid phone format (${phone}).`);
              continue;
            }

            // 4. Validate salary positive numeric
            const salaryNum = Number(salary);
            if (isNaN(salaryNum) || salaryNum < 0) {
              errors.push(`Row ${rowNum}: Salary must be a positive number (${salary}).`);
              continue;
            }

            // 5. Check if employeeId already exists in DB
            const idExists = await Employee.findOne({ employeeId });
            if (idExists) {
              errors.push(`Row ${rowNum}: Employee ID '${employeeId}' already exists.`);
              continue;
            }

            // 6. Check if email already exists in DB
            const emailExists = await Employee.findOne({ email });
            if (emailExists) {
              errors.push(`Row ${rowNum}: Email '${email}' already exists.`);
              continue;
            }

            // 7. Enforce RBAC for role assignment
            if (role === EmployeeRole.SUPER_ADMIN && creator.role !== EmployeeRole.SUPER_ADMIN) {
              errors.push(`Row ${rowNum}: HR Managers cannot create Super Admin records.`);
              continue;
            }

            // Validate status and role match expected values
            if (!Object.values(EmployeeRole).includes(role as EmployeeRole)) {
              errors.push(`Row ${rowNum}: Invalid role '${role}'.`);
              continue;
            }

            if (status && !Object.values(EmployeeStatus).includes(status as EmployeeStatus)) {
              errors.push(`Row ${rowNum}: Invalid status '${status}'.`);
              continue;
            }

            // 8. Create employee
            const newEmp = new Employee({
              employeeId,
              name,
              email,
              phone,
              department,
              designation,
              salary: salaryNum,
              joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
              status: (status as EmployeeStatus) || EmployeeStatus.ACTIVE,
              role: role as EmployeeRole,
              password: password || 'Welcome123', // default temp password
              isDeleted: false,
            });

            await newEmp.save();
            successCount++;
          } catch (err: any) {
            errors.push(`Row ${rowNum}: Save failed - ${err.message || 'unknown error'}`);
          }
        }

        res.status(200).json({
          success: true,
          message: `CSV processing complete. Successfully imported ${successCount} of ${results.length} rows.`,
          data: {
            successCount,
            failureCount: results.length - successCount,
            errors,
          },
        });
      });
  } catch (error) {
    next(error);
  }
};
