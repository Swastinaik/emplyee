'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../../lib/api';
import { User } from '../../../../types';
import { useAuth } from '../../../../hooks/useAuth';
import { FiChevronLeft, FiPhone, FiMail, FiCalendar, FiDollarSign, FiFolder, FiBriefcase, FiUser, FiActivity } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EmployeeDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const { user: currentUser } = useAuth();

  const [employee, setEmployee] = useState<User | null>(null);
  const [reportees, setReportees] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDetails = async () => {
    try {
      setIsLoading(true);
      // 1. Fetch employee details
      const empResponse = await api.get(`/employees/${id}`);
      if (empResponse.data?.success) {
        setEmployee(empResponse.data.data.employee);
      }

      // 2. Fetch direct reportees
      const reporteesResponse = await api.get(`/employees/${id}/reportees`);
      if (reporteesResponse.data?.success) {
        setReportees(reporteesResponse.data.data.reportees);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to fetch employee details';
      toast.error(errorMsg);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-sm font-semibold text-slate-500">Retrieving profile details...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
        <p className="text-slate-400 font-medium text-sm">Employee not found.</p>
        <button
          onClick={() => router.back()}
          className="mt-4 inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-500 font-bold"
        >
          <FiChevronLeft /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
      >
        <FiChevronLeft className="h-4.5 w-4.5" />
        <span>Back to Directory</span>
      </button>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Core Profile Card */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center text-center">
          <div className="h-28 w-28 rounded-full border border-slate-200 bg-indigo-50 flex items-center justify-center font-bold text-indigo-600 overflow-hidden uppercase text-3xl shadow-sm">
            {employee.profileImage ? (
              <img
                src={
                  employee.profileImage.startsWith('http')
                    ? employee.profileImage
                    : `http://localhost:5000/${employee.profileImage}`
                }
                alt={employee.name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              employee.name.slice(0, 2)
            )}
          </div>

          <h2 className="text-xl font-bold text-slate-800 mt-4 leading-none">{employee.name}</h2>
          <p className="text-sm font-medium text-indigo-600 mt-2">{employee.designation}</p>
          <p className="text-xs text-slate-400 font-medium mt-1">{employee.department} Division</p>

          <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold mt-4 ${
              employee.status === 'Active'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                : 'bg-rose-50 text-rose-700 border border-rose-100'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                employee.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            ></span>
            {employee.status}
          </span>

          <div className="w-full border-t border-slate-100 my-6"></div>

          {/* Quick Contact Links */}
          <div className="w-full space-y-4.5 text-left text-sm text-slate-600">
            <div className="flex items-center gap-3.5">
              <span className="p-2 bg-slate-50 text-slate-400 rounded-xl">
                <FiMail />
              </span>
              <span className="truncate font-medium">{employee.email}</span>
            </div>

            <div className="flex items-center gap-3.5">
              <span className="p-2 bg-slate-50 text-slate-400 rounded-xl">
                <FiPhone />
              </span>
              <span className="font-medium">{employee.phone}</span>
            </div>

            <div className="flex items-center gap-3.5">
              <span className="p-2 bg-slate-50 text-slate-400 rounded-xl">
                <FiCalendar />
              </span>
              <span className="font-medium">
                Joined{' '}
                {new Date(employee.joiningDate).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column - Secondary Data Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detailed Info Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 mb-6">Employment Specification</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <FiBriefcase className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employee ID</p>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">{employee.employeeId}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <FiUser className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">System Role</p>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">{employee.role}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <FiFolder className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Business Unit</p>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">{employee.department}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <FiDollarSign className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Annual Remuneration</p>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">
                    ${employee.salary?.toLocaleString()} USD
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Reporting Structure Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 mb-4">Management & Reporting</h3>
            
            {employee.reportingManager ? (
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 uppercase">
                    {typeof employee.reportingManager === 'object' && employee.reportingManager
                      ? employee.reportingManager.name.slice(0, 2)
                      : 'M'}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reports to Manager</p>
                    <p className="text-sm font-semibold text-slate-700 mt-0.5">
                      {typeof employee.reportingManager === 'object' && employee.reportingManager
                        ? employee.reportingManager.name
                        : 'Reporting Manager Assigned'}
                    </p>
                  </div>
                </div>
                
                {typeof employee.reportingManager === 'object' && employee.reportingManager && (
                  <a
                    href={`/employees/${employee.reportingManager._id}`}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-500 transition-colors"
                  >
                    View Profile
                  </a>
                )}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                <p className="text-xs font-semibold text-slate-400">Head of Organization / Root Level</p>
              </div>
            )}
          </div>

          {/* Direct Reports Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 mb-4">
              Direct Subordinates ({reportees.length})
            </h3>
            
            {reportees.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {reportees.map((rep) => (
                  <a
                    key={rep._id}
                    href={`/employees/${rep._id}`}
                    className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all group"
                  >
                    <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-500 uppercase text-xs flex-shrink-0 group-hover:text-indigo-600 group-hover:border-indigo-200 transition-all">
                      {rep.profileImage ? (
                        <img
                          src={`http://localhost:5000/${rep.profileImage}`}
                          alt={rep.name}
                          className="h-full w-full object-cover rounded-full"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        rep.name.slice(0, 2)
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-700 truncate group-hover:text-indigo-600 transition-all">
                        {rep.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium truncate">
                        {rep.designation}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                <p className="text-xs font-semibold text-slate-400">No direct reports found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
