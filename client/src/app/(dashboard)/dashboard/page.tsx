'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import api from '../../../lib/api';
import StatCard from '../../../components/dashboard/StatCard';
import { DepartmentChart, JoiningTrendChart, RoleChart } from '../../../components/dashboard/Charts';
import { FiUsers, FiUserCheck, FiUserX, FiFolder } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { User } from '../../../types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<User[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    departmentsCount: 0,
  });
  const [deptData, setDeptData] = useState<{ name: string; value: number }[]>([]);
  const [roleData, setRoleData] = useState<{ role: string; count: number }[]>([]);
  const [trendData, setTrendData] = useState<{ month: string; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const calculateStats = (list: User[]) => {
    // 1. Core Counts
    const total = list.length;
    const active = list.filter((e) => e.status === 'Active').length;
    const inactive = list.filter((e) => e.status === 'Inactive').length;

    // Get unique departments
    const uniqueDepts = Array.from(new Set(list.map((e) => e.department).filter(Boolean)));
    const departmentsCount = uniqueDepts.length;

    setStats({ total, active, inactive, departmentsCount });

    // 2. Department Chart Data
    const deptMap: { [key: string]: number } = {};
    list.forEach((e) => {
      if (e.department) {
        deptMap[e.department] = (deptMap[e.department] || 0) + 1;
      }
    });
    const formattedDept = Object.keys(deptMap).map((key) => ({
      name: key,
      value: deptMap[key],
    }));
    setDeptData(formattedDept);

    // 3. Role Chart Data
    const roleMap: { [key: string]: number } = {};
    list.forEach((e) => {
      if (e.role) {
        roleMap[e.role] = (roleMap[e.role] || 0) + 1;
      }
    });
    const formattedRole = Object.keys(roleMap).map((key) => ({
      role: key,
      count: roleMap[key],
    }));
    setRoleData(formattedRole);

    // 4. Monthly Trend Data (Cumulative Joinings)
    // Group joinings by Year-Month
    const trendMap: { [key: string]: number } = {};
    list.forEach((e) => {
      if (e.joiningDate) {
        const date = new Date(e.joiningDate);
        // Format to 'MMM YYYY', e.g., 'Jan 2026'
        const key = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        trendMap[key] = (trendMap[key] || 0) + 1;
      }
    });

    // Sort the month-year entries chronologically
    const sortedMonths = Object.keys(trendMap).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateA.getTime() - dateB.getTime();
    });

    let runningCount = 0;
    const formattedTrend = sortedMonths.map((month) => {
      runningCount += trendMap[month];
      return {
        month,
        count: runningCount,
      };
    });
    setTrendData(formattedTrend);
  };

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      // Fetch up to 1000 employees for client-side analytics
      const response = await api.get('/employees?limit=1000');
      if (response.data?.success) {
        const empList: User[] = response.data.data.employees;
        setEmployees(empList);
        calculateStats(empList);
      }
    } catch (error: unknown) {
      toast.error('Failed to load dashboard metrics');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-sm font-semibold text-slate-500">Compiling dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in">
      {/* Upper header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Operational Dashboard</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Real-time metrics, status highlights, and department distributions
        </p>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Employees"
          value={stats.total}
          icon={<FiUsers className="h-6 w-6" />}
          description="Registered headcount"
          colorClass="bg-indigo-600"
          textColorClass="text-indigo-600"
        />
        <StatCard
          title="Active Employees"
          value={stats.active}
          icon={<FiUserCheck className="h-6 w-6" />}
          description="Productive headcount"
          colorClass="bg-emerald-600"
          textColorClass="text-emerald-600"
        />
        <StatCard
          title="Inactive Employees"
          value={stats.inactive}
          icon={<FiUserX className="h-6 w-6" />}
          description="Suspended / On Leave"
          colorClass="bg-rose-600"
          textColorClass="text-rose-600"
        />
        <StatCard
          title="Departments"
          value={stats.departmentsCount}
          icon={<FiFolder className="h-6 w-6" />}
          description="Business divisions"
          colorClass="bg-amber-600"
          textColorClass="text-amber-600"
        />
      </div>

      {/* Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Department Distribution Pie Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-800">Department Distribution</h3>
            <p className="text-xs text-slate-400 font-medium">Headcount allocated per division</p>
          </div>
          <DepartmentChart data={deptData} />
        </div>

        {/* Roles Distribution Bar Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-800">Role Structure</h3>
            <p className="text-xs text-slate-400 font-medium">Headcount split by user authorization roles</p>
          </div>
          <RoleChart data={roleData} />
        </div>

        {/* Joining Trend Area Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm lg:col-span-2">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-800">Growth Timeline</h3>
            <p className="text-xs text-slate-400 font-medium">Cumulative headcount expansion trend</p>
          </div>
          <JoiningTrendChart data={trendData} />
        </div>
      </div>
    </div>
  );
}
