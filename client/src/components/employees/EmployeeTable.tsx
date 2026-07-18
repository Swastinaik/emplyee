'use client';

import React from 'react';
import { User } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi';

interface TableProps {
  employees: User[];
  onEdit: (emp: User) => void;
  onDelete: (id: string) => void;
}

export default function EmployeeTable({ employees, onEdit, onDelete }: TableProps) {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'Super Admin';

  if (employees.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm fade-in">
        <p className="text-slate-400 font-medium text-sm">No employees found matching the filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden fade-in">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-400 text-xs font-bold uppercase tracking-wider">
              <th className="py-4 px-6">ID</th>
              <th className="py-4 px-6">Employee</th>
              <th className="py-4 px-6">Department & Title</th>
              <th className="py-4 px-6">Joined Date</th>
              <th className="py-4 px-6">Role</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
            {employees.map((emp) => (
              <tr key={emp._id} className="hover:bg-slate-50/50 transition-colors">
                {/* Employee ID */}
                <td className="py-4.5 px-6 font-mono text-xs font-bold text-slate-500">
                  {emp.employeeId}
                </td>

                {/* Name / Avatar / Email */}
                <td className="py-4.5 px-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-indigo-600 overflow-hidden uppercase flex-shrink-0">
                      {emp.profileImage ? (
                        <img
                          src={
                            emp.profileImage.startsWith('http')
                              ? emp.profileImage
                              : `http://localhost:5000/${emp.profileImage}`
                          }
                          alt={emp.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        emp.name.slice(0, 2)
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 leading-none mb-1">{emp.name}</p>
                      <p className="text-xs text-slate-400 font-medium">{emp.email}</p>
                    </div>
                  </div>
                </td>

                {/* Dept & Designation */}
                <td className="py-4.5 px-6">
                  <p className="font-medium text-slate-700 leading-none mb-1">{emp.designation}</p>
                  <p className="text-xs text-slate-400 font-medium">{emp.department}</p>
                </td>

                {/* Joining Date */}
                <td className="py-4.5 px-6 text-slate-500 font-medium">
                  {new Date(emp.joiningDate).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>

                {/* Role badge */}
                <td className="py-4.5 px-6">
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                      emp.role === 'Super Admin'
                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                        : emp.role === 'HR Manager'
                        ? 'bg-blue-50 text-blue-600 border border-blue-100'
                        : 'bg-slate-50 text-slate-600 border border-slate-100'
                    }`}
                  >
                    {emp.role}
                  </span>
                </td>

                {/* Status badge */}
                <td className="py-4.5 px-6">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold leading-none ${
                      emp.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        emp.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    ></span>
                    {emp.status}
                  </span>
                </td>

                {/* Actions */}
                <td className="py-4.5 px-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <a
                      href={`/employees/${emp._id}`}
                      className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer transition-all"
                      title="View Profile"
                    >
                      <FiEye className="h-4.5 w-4.5" />
                    </a>

                    <button
                      onClick={() => onEdit(emp)}
                      className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-indigo-600 rounded-lg cursor-pointer transition-all"
                      title="Edit Employee"
                    >
                      <FiEdit2 className="h-4.5 w-4.5" />
                    </button>

                    {isSuperAdmin && (
                      <button
                        onClick={() => onDelete(emp._id)}
                        className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer transition-all"
                        title="Delete Employee"
                      >
                        <FiTrash2 className="h-4.5 w-4.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
