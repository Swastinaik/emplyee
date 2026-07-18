'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import EmployeeFilters from '../../../components/employees/EmployeeFilters';
import EmployeeTable from '../../../components/employees/EmployeeTable';
import EmployeeForm from '../../../components/employees/EmployeeForm';
import CsvImportModal from '../../../components/employees/CsvImportModal';
import { User } from '../../../types';
import { FiPlus, FiUpload, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

export default function EmployeesListPage() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [allEmployees, setAllEmployees] = useState<User[]>([]); // For manager dropdown
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Pagination states
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal states
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  // Fetch employees list
  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        search: debouncedSearch,
        department,
        role,
        status,
        sortBy,
        sortOrder,
        page: page.toString(),
        limit: '10',
      });

      const response = await api.get(`/employees?${queryParams.toString()}`);
      if (response.data?.success) {
        setEmployees(response.data.data.employees);
        setTotalPages(response.data.pagination.pages);
        setTotalCount(response.data.pagination.total);
      }
    } catch (error: any) {
      toast.error('Failed to load employees list');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all active employees (for manager selector dropdown)
  const fetchAllEmployees = async () => {
    try {
      const response = await api.get('/employees?limit=1000');
      if (response.data?.success) {
        setAllEmployees(response.data.data.employees);
      }
    } catch (error) {
      console.error('Failed to fetch reporting managers list:', error);
    }
  };

  // Trigger data fetches on filter/pagination changes
  useEffect(() => {
    fetchEmployees();
  }, [debouncedSearch, department, role, status, sortBy, sortOrder, page]);

  // Fetch options once when modals might open
  useEffect(() => {
    fetchAllEmployees();
  }, [formOpen]);

  // Handle edit clicked
  const handleEditClick = (emp: User) => {
    setSelectedEmployee(emp);
    setFormOpen(true);
  };

  // Handle delete clicked
  const handleDeleteClick = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this employee? This will perform a soft delete.')) {
      try {
        const response = await api.delete(`/employees/${id}`);
        if (response.data?.success) {
          toast.success(response.data.message || 'Employee deleted successfully');
          fetchEmployees();
        }
      } catch (error: any) {
        const errorMsg = error.response?.data?.message || 'Failed to delete employee.';
        toast.error(errorMsg);
        console.error(error);
      }
    }
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Employee Management</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Search, filter, view details, update information, and manage headcount roles.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setImportOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 bg-white"
          >
            <FiUpload className="h-4 w-4" />
            <span>Import CSV</span>
          </button>
          
          <button
            onClick={() => {
              setSelectedEmployee(null);
              setFormOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/10 cursor-pointer transition-all duration-200"
          >
            <FiPlus className="h-5 w-5" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Filters and search section */}
      <EmployeeFilters
        search={search}
        setSearch={setSearch}
        department={department}
        setDepartment={setDepartment}
        role={role}
        setRole={setRole}
        status={status}
        setStatus={setStatus}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
      />

      {/* Loading state or Table */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
          <div className="inline-flex items-center gap-3">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></span>
            <span className="text-sm font-semibold text-slate-500">Querying employees list...</span>
          </div>
        </div>
      ) : (
        <>
          <EmployeeTable
            employees={employees}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
          />

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <span className="text-xs font-semibold text-slate-400">
                Showing {employees.length} of {totalCount} records
              </span>

              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-all"
                >
                  <FiChevronLeft className="h-4 w-4" />
                </button>

                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      page === i + 1
                        ? 'bg-indigo-600 text-white'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-all"
                >
                  <FiChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      {formOpen && (
        <EmployeeForm
          employee={selectedEmployee}
          activeEmployees={allEmployees}
          onClose={() => setFormOpen(false)}
          onSuccess={fetchEmployees}
        />
      )}

      {/* CSV Import Modal */}
      {importOpen && (
        <CsvImportModal
          onClose={() => setImportOpen(false)}
          onSuccess={fetchEmployees}
        />
      )}
    </div>
  );
}
