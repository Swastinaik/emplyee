'use client';

import React from 'react';
import Link from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import {
  FiGrid,
  FiUsers,
  FiGitPullRequest,
  FiUser,
  FiLogOut,
  FiBriefcase,
} from 'react-icons/fi';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isHRorAdmin = user?.role === 'Super Admin' || user?.role === 'HR Manager';

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <FiGrid className="h-5 w-5" />,
      show: true,
    },
    {
      name: 'Employees',
      path: '/employees',
      icon: <FiUsers className="h-5 w-5" />,
      show: isHRorAdmin,
    },
    {
      name: 'Organization Tree',
      path: '/organization',
      icon: <FiGitPullRequest className="h-5 w-5" />,
      show: true,
    },
    {
      name: 'My Profile',
      path: '/profile',
      icon: <FiUser className="h-5 w-5" />,
      show: true,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-white flex flex-col h-full z-30 transition-all duration-300">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
        <div className="flex-shrink-0 bg-indigo-600 p-2 rounded-lg text-white">
          <FiBriefcase className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-wide">EMS Portal</h1>
          <p className="text-[10px] text-slate-500 font-medium">Enterprise Management</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {menuItems
          .filter((item) => item.show)
          .map((item) => {
            const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
            return (
              <a
                key={item.name}
                href={item.path}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </a>
            );
          })}
      </nav>

      {/* User Status Card */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-indigo-400 overflow-hidden uppercase">
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
                  // Fallback to initial
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              user?.name?.slice(0, 2)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate text-slate-200">{user?.name}</p>
            <p className="text-xs text-slate-500 font-medium truncate">{user?.role}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/80 cursor-pointer transition-all duration-200"
        >
          <FiLogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
