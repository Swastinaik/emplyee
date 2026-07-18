'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import api from '../../../lib/api';
import { toast } from 'react-hot-toast';
import { FiPhone, FiMail, FiCalendar, FiDollarSign, FiFolder, FiBriefcase, FiUser, FiUpload, FiImage } from 'react-icons/fi';

export default function MyProfilePage() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editable Form states
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state with logged-in user
  useEffect(() => {
    if (user) {
      setPhone(user.phone || '');
      if (user.profileImage) {
        setImagePreview(
          user.profileImage.startsWith('http')
            ? user.profileImage
            : `http://localhost:5000/${user.profileImage}`
        );
      }
    }
  }, [user]);

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

  const validateForm = () => {
    if (!phone) {
      toast.error('Phone number is required.');
      return false;
    }

    // Phone format
    const phoneRegex = /^\+?[1-9]\d{1,14}$|^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      toast.error('Please enter a valid phone number (10 digits or E.164 format).');
      return false;
    }

    // Password validation (optional, only if they entered a password)
    if (password) {
      if (password.length < 6) {
        toast.error('Password must be at least 6 characters.');
        return false;
      }
      if (password !== confirmPassword) {
        toast.error('Passwords do not match.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (!user) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('phone', phone);
      
      if (password) {
        formData.append('password', password);
      }

      if (imageFile) {
        formData.append('profileImage', imageFile);
      }

      const response = await api.put(`/employees/${user._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data?.success) {
        toast.success('Profile details updated successfully');
        // Update user state inside AuthContext immediately
        updateUser(response.data.data.employee);
        
        // Clear password fields
        setPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to update profile details.';
      toast.error(errorMsg);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Review credentials, edit contact numbers, change password, and upload user profile picture.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Core Specifications Display */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center text-center">
          <div className="h-28 w-28 rounded-full border border-slate-200 bg-indigo-50 flex items-center justify-center font-bold text-indigo-600 overflow-hidden uppercase text-3xl shadow-sm relative group">
            {imagePreview ? (
              <img src={imagePreview} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              user.name.slice(0, 2)
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-xs font-semibold"
            >
              <FiUpload className="mr-1" /> Edit
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <h2 className="text-xl font-bold text-slate-800 mt-4 leading-none">{user.name}</h2>
          <p className="text-sm font-medium text-indigo-600 mt-2">{user.designation}</p>
          <p className="text-xs text-slate-400 font-medium mt-1">{user.department} Department</p>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-4 bg-emerald-50 text-emerald-700 border border-emerald-100">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            {user.status}
          </span>

          <div className="w-full border-t border-slate-100 my-6"></div>

          {/* Core Info Details */}
          <div className="w-full space-y-4 text-left text-sm text-slate-600">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-slate-50 text-slate-400 rounded-xl">
                <FiMail />
              </span>
              <span className="truncate font-medium">{user.email}</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="p-2 bg-slate-50 text-slate-400 rounded-xl">
                <FiCalendar />
              </span>
              <span className="font-medium">
                Joined{' '}
                {new Date(user.joiningDate).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="p-2 bg-slate-50 text-slate-400 rounded-xl">
                <FiBriefcase />
              </span>
              <span className="font-medium">System ID: {user.employeeId}</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="p-2 bg-slate-50 text-slate-400 rounded-xl">
                <FiFolder />
              </span>
              <span className="font-medium">Authority: {user.role}</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="p-2 bg-slate-50 text-slate-400 rounded-xl">
                <FiDollarSign />
              </span>
              <span className="font-medium">Salary: ${user.salary?.toLocaleString()} USD</span>
            </div>
          </div>
        </div>

        {/* Right Column - Profile Form Editor */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 mb-6">Modify Details</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Phone Input */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Contact Number
                </label>
                <div className="relative max-w-md">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <FiPhone className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contact Number"
                    className="block w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-800"
                  />
                </div>
              </div>

              {/* Password Settings */}
              <div className="border-t border-slate-100 pt-6">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
                  Security (Change Password)
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Save changes */}
              <div className="border-t border-slate-100 pt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/10 cursor-pointer transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    'Update Profile'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
