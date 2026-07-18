'use client';

import React, { useState } from 'react';
import { OrgTreeNode as TreeNodeType } from '../../../../server/src/services/organizationService'; // Just reference the type shape
import { FiChevronDown, FiChevronRight, FiUser, FiEye } from 'react-icons/fi';

interface NodeProps {
  node: any; // We use any or map custom types matching OrgTreeNode frontend structure
  searchQuery: string;
}

export default function OrgTreeNode({ node, searchQuery }: NodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  // Highlight node if search query matches name, designation or email
  const isMatch =
    searchQuery &&
    (node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.email.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="ml-6 relative mt-4">
      {/* Connector lines (rendered via CSS borders) */}
      <div className="absolute -left-4 top-0 bottom-0 w-px bg-slate-200"></div>
      <div className="absolute -left-4 top-6 w-4 h-px bg-slate-200"></div>

      {/* Node Content */}
      <div
        className={`inline-flex items-center gap-4 bg-white border rounded-2xl p-4 shadow-sm min-w-[280px] max-w-sm transition-all duration-300 relative z-10 ${
          isMatch
            ? 'ring-2 ring-indigo-500 border-indigo-200 bg-indigo-50/20'
            : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
        }`}
      >
        {/* Toggle Expand Button for Children */}
        {hasChildren && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="absolute -left-3 top-1/2 -translate-y-1/2 bg-white border border-slate-200 text-slate-400 hover:text-slate-600 h-6 w-6 rounded-full flex items-center justify-center cursor-pointer shadow-sm z-20 hover:scale-105 transition-all"
          >
            {isExpanded ? <FiChevronDown className="h-3 w-3" /> : <FiChevronRight className="h-3 w-3" />}
          </button>
        )}

        {/* User Details */}
        <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-500 uppercase overflow-hidden flex-shrink-0">
          {node.profileImage ? (
            <img
              src={`http://localhost:5000/${node.profileImage}`}
              alt={node.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            node.name.slice(0, 2)
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-bold text-slate-800 truncate leading-none mb-1">{node.name}</h4>
          <p className="text-[10px] text-indigo-600 font-bold truncate leading-none mb-1">
            {node.designation}
          </p>
          <p className="text-[9px] text-slate-400 font-semibold truncate leading-none">
            {node.department}
          </p>
        </div>

        {/* Actions - View Profile */}
        <a
          href={`/employees/${node._id}`}
          className="p-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-100 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer transition-all flex-shrink-0"
          title="View Profile"
        >
          <FiEye className="h-4 w-4" />
        </a>
      </div>

      {/* Children Recursion */}
      {hasChildren && isExpanded && (
        <div className="pl-2 relative">
          {node.children.map((child: any) => (
            <OrgTreeNode key={child._id} node={child} searchQuery={searchQuery} />
          ))}
        </div>
      )}
    </div>
  );
}
