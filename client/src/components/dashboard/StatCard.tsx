import React, { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  description: string;
  colorClass: string; // e.g. 'bg-blue-500'
  textColorClass: string; // e.g. 'text-blue-600'
}

export default function StatCard({
  title,
  value,
  icon,
  description,
  colorClass,
  textColorClass,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center gap-5 hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 fade-in">
      <div className={`p-4 rounded-xl ${colorClass} ${textColorClass} bg-opacity-10 flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800 mt-1 leading-none">{value}</h3>
        <p className="text-xs text-slate-500 mt-2 font-medium">{description}</p>
      </div>
    </div>
  );
}
