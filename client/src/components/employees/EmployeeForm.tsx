'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole, UserStatus } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';
import { FiX, FiUpload, FiImage } from 'react-icons/fi';

interface FormProps {
  employee?: User | null; // If null, we are in CREATE mode
  activeEmployees: User[]; // Used to select reporting manager
  onClose: () => void;
  onSuccess: () => void;
}

export default function EmployeeForm({ employee, activeEmployees, onClose, onSuccess }: FormProps) {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'Super Admin';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [salary, setSalary] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [status, setStatus] = useState<UserStatus>('Active');
  const [role, setRole] = useState<UserRole>('Employee');
  const [reportingManager, setReportingManager] = useState('');
  const [password, setPassword] = useState('');
  
  // Image states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with employee values if editing
  useEffect(() => {
    if (employee) {
      setEmployeeId(employee.employeeId || '');
      setName(employee.name || '');
      setEmail(employee.email || '');
      setPhone(employee.phone || '');
      setDepartment(employee.department || '');
      setDesignation(employee.designation || '');
      setSalary(employee.salary?.toString() || '');
      setStatus(employee.status || 'Active');
      setRole(employee.role || 'Employee');
      
      // Handle reporting manager format (could be populated object or ID string)
      if (employee.reportingManager) {
        if (typeof employee.reportingManager === 'object') {
          setReportingManager(employee.reportingManager._id);
        } else {
          setReportingManager(employee.reportingManager);
        }
      } else {
        setReportingManager('');
      }

      // Format date to YYYY-MM-DD
      if (employee.joiningDate) {
        setJoiningDate(new Date(employee.joiningDate).toISOString().split('T')[0]);
      }

      // Profile image preview
      if (employee.profileImage) {
        setImagePreview(
          employee.profileImage.startsWith('http')
            ? employee.profileImage
            : `http://localhost:5000/${employee.profileImage}`
        );
      }
    } else {
      // Default dates and fields for CREATE mode
      setJoiningDate(new Date().toISOString().split('T')[0]);
    }
  }, [employee]);

  // Handle image select
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter manager options (cannot report to self)
  const managerOptions = activeEmployees.filter(
    (emp) => emp._id !== employee?._id && emp.status === 'Active'
  );

  // Client-side validations
  const validateForm = () => {
    if (!employeeId || !name || !email || !phone || !department || !designation || !salary) {
      toast.error('Please fill in all required fields.');
      return false;
    }
    
    // Password is required for creation
    if (!employee && !password) {
      toast.error('Password is required for new employees.');
      return false;
    }

    if (password && password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return false;
    }

    if (isNaN(Number(salary)) || Number(salary) < 0) {
      toast.error('Salary must be a positive number.');
      return false;
    }

    // Phone checks
    const phoneRegex = /^\+?[1-9]\d{1,14}$|^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      toast.error('Please enter a valid phone number (10 digits or E.164 format).');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('employeeId', employeeId);
      formData.append('name', name);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('department', department);
      formData.append('designation', designation);
      formData.append('salary', salary);
      formData.append('joiningDate', joiningDate);
      formData.append('status', status);
      formData.append('role', role);
      
      if (reportingManager) {
        formData.append('reportingManager', reportingManager);
      } else {
        formData.append('reportingManager', '');
      }

      if (password) {
        formData.append('password', password);
      }

      if (imageFile) {
        formData.append('profileImage', imageFile);
      }

      let response;
      if (employee) {
        // UPDATE MODE
        response = await api.put(`/employees/${employee._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        // CREATE MODE
        response = await api.post('/employees', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      if (response.data?.success) {
        toast.success(employee ? 'Employee details updated' : 'Employee created successfully');
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to submit employee data.';
      toast.error(errorMsg);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Background Overlay */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      {/* Modal Container */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/75">
          <h3 className="text-base font-bold text-slate-800">
            {employee ? 'Edit Employee Details' : 'Add New Employee'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200/60 rounded-lg text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Avatar selector and profile header */}
          <div className="flex flex-col sm:flex-row items-center gap-5 pb-5 border-b border-slate-100">
            <div className="relative group">
              <div className="h-20 w-20 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 font-bold overflow-hidden uppercase">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <FiImage className="h-8 w-8 text-slate-300" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-xs font-semibold"
              >
                <FiUpload className="mr-1" /> Change
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            <div className="text-center sm:text-left">
              <h4 className="text-sm font-bold text-slate-800">Profile Image</h4>
              <p className="text-xs text-slate-400 mt-1">PNG, JPG or WEBP. Max size 2MB.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Employee ID */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Employee ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                disabled={!!employee} // Immutable once created
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="e.g. EMP001"
                className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-60 transition-all text-slate-800"
              />
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-800"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john.doe@company.com"
                className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-800"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10 digit number"
                className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-800"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Department <span className="text-rose-500">*</span>
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-700 appearance-none"
              >
                <option value="">Select Department</option>
                <option value="Engineering">Engineering</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="Operations">Operations</option>
                <option value="Administration">Administration</option>
              </select>
            </div>

            {/* Designation */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Designation <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="Software Engineer"
                className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-800"
              />
            </div>

            {/* Salary */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Salary (Annual) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="80000"
                className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-800"
              />
            </div>

            {/* Joining Date */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Joining Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-700"
              />
            </div>

            {/* Role (Conditional on Super Admin) */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Role <span className="text-rose-500">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-700 appearance-none"
              >
                <option value="Employee">Employee</option>
                <option value="HR Manager">HR Manager</option>
                {/* HR can create employees, but cannot assign Super Admin roles */}
                {(isSuperAdmin || employee?.role === 'Super Admin') && (
                  <option value="Super Admin">Super Admin</option>
                )}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Status <span className="text-rose-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as UserStatus)}
                className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-700 appearance-none"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Reporting Manager Select */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Reporting Manager
              </label>
              <select
                value={reportingManager}
                onChange={(e) => setReportingManager(e.target.value)}
                className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-700 appearance-none"
              >
                <option value="">No Manager (Root)</option>
                {managerOptions.map((mgr) => (
                  <option key={mgr._id} value={mgr._id}>
                    {mgr.name} ({mgr.designation} - {mgr.department})
                  </option>
                ))}
              </select>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                {employee ? 'Change Password' : 'Password'} {!employee && <span className="text-rose-500">*</span>}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={employee ? 'Leave blank to keep current' : 'At least 6 characters'}
                className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-800"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 text-sm font-semibold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/10 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  <span>Saving...</span>
                </>
              ) : (
                'Save Employee'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
