export type UserRole = 'Super Admin' | 'HR Manager' | 'Employee';
export type UserStatus = 'Active' | 'Inactive';

export interface User {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  salary: number;
  joiningDate: string;
  status: UserStatus;
  role: UserRole;
  reportingManager?: string | { _id: string; name: string; email: string; employeeId: string } | null;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginInput {
  email: string;
  password?: string;
}

