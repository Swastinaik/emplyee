import { Router } from 'express';
import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  importEmployees,
} from '../controllers/employeeController';
import { getDirectReports, updateReportingManager } from '../controllers/organizationController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { upload } from '../middleware/upload';
import { createEmployeeSchema, updateEmployeeSchema } from '../validators/employeeValidator';
import { EmployeeRole } from '../models/Employee';

const router = Router();

// Apply authenticate to all employee routes
router.use(authenticate);

// GET /api/employees - Get list of employees (Admin/HR only)
// POST /api/employees - Create new employee (Admin/HR only)
router.route('/')
  .get(
    authorize(EmployeeRole.SUPER_ADMIN, EmployeeRole.HR_MANAGER),
    getEmployees
  )
  .post(
    authorize(EmployeeRole.SUPER_ADMIN, EmployeeRole.HR_MANAGER),
    upload.single('profileImage'),
    //validate(createEmployeeSchema),
    createEmployee
  );

// POST /api/employees/import - Import CSV (Admin/HR only)
router.post(
  '/import',
  authorize(EmployeeRole.SUPER_ADMIN, EmployeeRole.HR_MANAGER),
  upload.single('file'),
  importEmployees
);

// GET /api/employees/:id - View profile details (All roles, checked inside controller)
// PUT /api/employees/:id - Update profile details (All roles, checks inside controller)
// DELETE /api/employees/:id - Soft delete employee (Super Admin only)
router.route('/:id')
  .get(getEmployeeById)
  .put(
    upload.single('profileImage'),
    validate(updateEmployeeSchema),
    updateEmployee
  )
  .delete(
    authorize(EmployeeRole.SUPER_ADMIN),
    deleteEmployee
  );

// GET /api/employees/:id/reportees - View direct reports (All roles)
router.get('/:id/reportees', getDirectReports);

// PATCH /api/employees/:id/manager - Update reporting manager (Admin/HR only)
router.patch(
  '/:id/manager',
  authorize(EmployeeRole.SUPER_ADMIN, EmployeeRole.HR_MANAGER),
  updateReportingManager
);

export default router;
