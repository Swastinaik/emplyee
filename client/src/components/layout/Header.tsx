'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { FiBell, FiChevronDown, FiUser, FiLogOut } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Ensure light theme is forced when dark mode is removed
    document.documentElement.classList.remove('dark');
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-20">
      {/* Search / Title Placeholder */}
      <div>
        <h2 className="text-lg font-bold text-slate-800">
          Welcome back, <span className="text-indigo-600 font-semibold">{user?.name}</span>
        </h2>
      </div>

      {/* Action Icons */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-all cursor-pointer relative">
          <FiBell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-indigo-600 border-2 border-white rounded-full"></span>
        </button>

        {/* Vertical divider */}
        <span className="h-6 w-px bg-slate-200 dark:bg-slate-700"></span>

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 py-1.5 px-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer text-left"
          >
            <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 overflow-hidden uppercase">
              {user?.profileImage ? (
                <img
                  src={
                    user.profileImage.startsWith('http')
                      ? user.profileImage
                      : `http://localhost:5000/${user.profileImage}`
                  }
                  alt={user?.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                user?.name?.slice(0, 2)
              )}
            </div>
            <div className="hidden md:block">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-none">{user?.name}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1">{user?.role}</p>
            </div>
            <FiChevronDown className="text-slate-400 h-4 w-4 transition-transform duration-200" />
          </button>

          {dropdownOpen && (
            <>
              {/* Overlay background to close dropdown on click outside */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              ></div>

              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
                <a
                  href="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 cursor-pointer"
                >
                  <FiUser className="text-slate-400" />
                  <span>My Profile</span>
                </a>
                
                <hr className="border-slate-100 dark:border-slate-700 my-1" />

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer text-left font-semibold"
                >
                  <FiLogOut className="text-rose-400" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
