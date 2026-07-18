import { Request, Response, NextFunction } from 'express';
import Employee, { EmployeeRole } from '../models/Employee';
import { createError } from '../middleware/errorHandler';
import { buildOrgTree, isCircularReporting } from '../services/organizationService';

/**
 * @desc    Get full organizational reporting hierarchy tree
 * @route   GET /api/organization/tree
 * @access  Private (All authenticated roles)
 */
export const getOrgTree = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tree = await buildOrgTree();
    res.status(200).json({
      success: true,
      data: {
        tree,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get direct reports of an employee
 * @route   GET /api/employees/:id/reportees
 * @access  Private (All authenticated roles)
 */
export const getDirectReports = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if target employee exists
    const employee = await Employee.findById(id);
    if (!employee || employee.isDeleted) {
      next(createError('Employee not found', 404));
      return;
    }

    // Find all active employees whose reportingManager is this employee id
    const reportees = await Employee.find({
      reportingManager: id,
      isDeleted: false,
    }).select('name email employeeId phone department designation role status profileImage');

    res.status(200).json({
      success: true,
      count: reportees.length,
      data: {
        reportees,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Assign or change reporting manager of an employee
 * @route   PATCH /api/employees/:id/manager
 * @access  Private (Super Admin, HR Manager)
 */
export const updateReportingManager = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { managerId } = req.body; // Can be a string ID or null
    const currentUser = req.user;

    if (!currentUser) {
      next(createError('Authentication required', 401));
      return;
    }

    // 1. Find the target employee
    const employee = await Employee.findById(id);
    if (!employee || employee.isDeleted) {
      next(createError('Employee not found', 404));
      return;
    }

    // 2. Enforce RBAC constraints: HR cannot modify Super Admin manager
    if (employee.role === EmployeeRole.SUPER_ADMIN && currentUser.role !== EmployeeRole.SUPER_ADMIN) {
      next(createError('Access denied. HR Managers cannot update Super Admin reporting manager.', 403));
      return;
    }

    // 3. Handle manager assignment
    if (managerId) {
      // Cannot report to self
      if (id === managerId) {
        next(createError('An employee cannot report to themselves.', 400));
        return;
      }

      // Check if prospective manager exists and is active
      const manager = await Employee.findById(managerId);
      if (!manager || manager.isDeleted) {
        next(createError('Manager not found', 404));
        return;
      }
      if (manager.status !== 'Active') {
        next(createError('Cannot assign an inactive employee as reporting manager.', 400));
        return;
      }

      // Prevent circular reporting loop
      const circular = await isCircularReporting(id as string, managerId as string);
      if (circular) {
        next(
          createError(
            'Circular reporting loop detected. The prospective manager reports to this employee (directly or indirectly).',
            400
          )
        );
        return;
      }

      employee.reportingManager = managerId;
    } else {
      // Removing the reporting manager
      employee.reportingManager = null;
    }

    await employee.save();

    const updatedEmployee = await Employee.findById(id).populate(
      'reportingManager',
      '_id name email employeeId'
    );

    res.status(200).json({
      success: true,
      message: 'Reporting manager updated successfully',
      data: {
        employee: updatedEmployee,
      },
    });
  } catch (error) {
    next(error);
  }
};
