'use client';

import React, { useState, useRef } from 'react';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';
import { FiX, FiUpload, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';

interface ImportModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CsvImportModal({ onClose, onSuccess }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [report, setReport] = useState<{
    successCount: number;
    failureCount: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast.error('Please upload a valid CSV file (.csv)');
        return;
      }
      setFile(selectedFile);
      setReport(null); // Reset report on new file
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a CSV file first');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/employees/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data?.success) {
        setReport(response.data.data);
        toast.success(response.data.message || 'CSV Import complete');
        onSuccess(); // Refresh the list
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'CSV upload failed';
      toast.error(errorMsg);
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Background Overlay */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      {/* Modal Container */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/75">
          <h3 className="text-base font-bold text-slate-800">CSV Bulk Import</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200/60 rounded-lg text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {!report ? (
            // Upload Form
            <form onSubmit={handleUpload} className="space-y-6">
              {/* CSV Schema Help */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                <p className="font-bold text-slate-700 mb-1">Expected CSV columns:</p>
                <p className="font-mono leading-relaxed bg-white border border-slate-100 p-2 rounded-lg overflow-x-auto text-[10px]">
                  employeeId,name,email,phone,department,designation,salary,joiningDate,status,role,password
                </p>
                <p className="mt-2 text-indigo-600 font-semibold">
                  Note: Values must match schema validators. password defaults to 'Welcome123' if omitted.
                </p>
              </div>

              {/* File Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-indigo-500/80 rounded-2xl p-8 text-center cursor-pointer transition-all bg-slate-50 hover:bg-indigo-50/10 flex flex-col items-center justify-center gap-3"
              >
                <FiUpload className="h-8 w-8 text-slate-300" />
                {file ? (
                  <div>
                    <p className="text-sm font-bold text-slate-700 truncate max-w-xs">{file.name}</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-bold text-slate-600">Select Employee CSV</p>
                    <p className="text-xs text-slate-400 mt-1">Accepts spreadsheet CSV tables up to 2MB</p>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv"
                  className="hidden"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 text-sm font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !file}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/10 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                      <span>Processing...</span>
                    </>
                  ) : (
                    'Upload and Import'
                  )}
                </button>
              </div>
            </form>
          ) : (
            // Results Report Display
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-4 rounded-xl border bg-slate-50">
                <div className="text-slate-800">
                  <h4 className="text-sm font-bold">Import Status Report</h4>
                  <div className="flex gap-4 mt-2 text-xs">
                    <span className="flex items-center gap-1 text-emerald-600 font-bold">
                      <FiCheckCircle /> Succeeded: {report.successCount}
                    </span>
                    <span className="flex items-center gap-1 text-rose-600 font-bold">
                      <FiAlertTriangle /> Failed: {report.failureCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Error messages scrollable list */}
              {report.errors.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Error Log details ({report.errors.length})
                  </h5>
                  <div className="max-h-48 overflow-y-auto bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-1.5 font-mono text-[10px] text-rose-600">
                    {report.errors.map((err, idx) => (
                      <p key={idx} className="leading-relaxed">
                        • {err}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Close report button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/10 transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
