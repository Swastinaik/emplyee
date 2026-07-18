import mongoose from 'mongoose';
import Employee, { IEmployee } from '../models/Employee';

export interface OrgTreeNode {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  role: string;
  status: string;
  profileImage?: string;
  reportingManager?: string | null;
  children: OrgTreeNode[];
}

/**
 * Recursively check if assigning managerId as the reporting manager of employeeId
 * would create a circular reporting loop.
 * A loop is created if the employeeId exists in the management chain above managerId.
 */
export const isCircularReporting = async (
  employeeId: string,
  managerId: string
): Promise<boolean> => {
  // If they are the same person, that's self-reporting (which is circular)
  if (employeeId === managerId) {
    return true;
  }

  let currentManagerId = managerId;

  // Trace the reporting manager chain upwards
  while (currentManagerId) {
    const manager = await Employee.findById(currentManagerId).select('reportingManager');
    
    if (!manager || !manager.reportingManager) {
      break;
    }

    const parentId = manager.reportingManager.toString();
    
    // If the employee is found anywhere in the chain above the prospective manager, it's circular!
    if (parentId === employeeId) {
      return true;
    }

    currentManagerId = parentId;
  }

  return false;
};

/**
 * Build the full organizational reporting hierarchy tree.
 * Roots are employees with no reporting manager (or reporting manager does not exist/is deleted).
 */
export const buildOrgTree = async (): Promise<OrgTreeNode[]> => {
  const employees = await Employee.find({ isDeleted: false })
    .select('name email employeeId phone department designation role status profileImage reportingManager')
    .lean();

  const employeeMap: { [key: string]: OrgTreeNode } = {};

  // Initialize nodes
  employees.forEach((emp) => {
    employeeMap[(emp._id as mongoose.Types.ObjectId).toString()] = {
      _id: (emp._id as mongoose.Types.ObjectId).toString(),
      employeeId: emp.employeeId,
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      department: emp.department,
      designation: emp.designation,
      role: emp.role,
      status: emp.status,
      profileImage: emp.profileImage,
      reportingManager: emp.reportingManager ? emp.reportingManager.toString() : null,
      children: [],
    };
  });

  const roots: OrgTreeNode[] = [];

  // Connect parents and children
  employees.forEach((emp) => {
    const empId = (emp._id as mongoose.Types.ObjectId).toString();
    const node = employeeMap[empId];
    
    if (emp.reportingManager) {
      const managerId = emp.reportingManager.toString();
      const parent = employeeMap[managerId];
      
      if (parent) {
        parent.children.push(node);
      } else {
        // If reporting manager is not in our active map (e.g. deleted or inactive), it's a root node
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
};
