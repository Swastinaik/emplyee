'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import OrgTreeNode from '../../../components/organization/OrgTreeNode';
import { FiSearch, FiGitBranch, FiRefreshCw } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

export default function OrganizationTreePage() {
  const [treeRoots, setTreeRoots] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchTree = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/organization/tree');
      if (response.data?.success) {
        setTreeRoots(response.data.data.tree);
      }
    } catch (error) {
      toast.error('Failed to load organization hierarchy');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
  }, []);

  return (
    <div className="space-y-6 fade-in">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Organizational Hierarchy</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Visual reporting tree mapping management chains, roles, and child reportee allocations.
          </p>
        </div>

        <button
          onClick={fetchTree}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 transition-all cursor-pointer bg-white"
        >
          <FiRefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Hierarchy</span>
        </button>
      </div>

      {/* Control Area: Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <FiSearch className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search hierarchy (e.g. name, title)..."
            className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
          <FiGitBranch className="text-indigo-500 text-sm" />
          <span>Roots (Top Management): {treeRoots.length}</span>
        </div>
      </div>

      {/* Tree Visualization Canvas */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
          <div className="inline-flex items-center gap-3">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></span>
            <span className="text-sm font-semibold text-slate-500">Mapping organization tree...</span>
          </div>
        </div>
      ) : treeRoots.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <p className="text-slate-400 font-semibold text-sm">No hierarchy records found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-x-auto min-h-[500px]">
          {/* We wrap tree in relative block, and adjust starting offsets */}
          <div className="inline-block py-4 pr-12 min-w-full">
            {treeRoots.map((root) => (
              <div key={root._id} className="relative first:mt-0 mt-8">
                {/* Visual Root Node Wrapper (removes connector lines for absolute roots) */}
                <div className="ml-0 relative">
                  <div className="inline-flex items-center gap-4 bg-white border-2 border-indigo-500 rounded-2xl p-4 shadow-sm min-w-[280px] max-w-sm relative z-10">
                    <div className="h-10 w-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-600 uppercase overflow-hidden flex-shrink-0">
                      {root.profileImage ? (
                        <img
                          src={`http://localhost:5000/${root.profileImage}`}
                          alt={root.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        root.name.slice(0, 2)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="inline-block bg-indigo-50 text-indigo-600 text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-full mb-1">
                        Root Leader
                      </span>
                      <h4 className="text-xs font-bold text-slate-800 truncate leading-none mb-1">{root.name}</h4>
                      <p className="text-[10px] text-indigo-600 font-bold truncate leading-none mb-1">
                        {root.designation}
                      </p>
                      <p className="text-[9px] text-slate-400 font-semibold truncate leading-none">
                        {root.department}
                      </p>
                    </div>
                    <a
                      href={`/employees/${root._id}`}
                      className="p-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-100 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer transition-all flex-shrink-0"
                      title="View Profile"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </a>
                  </div>

                  {/* Render root's child branches recursively */}
                  {root.children && root.children.length > 0 && (
                    <div className="pl-2 relative">
                      {root.children.map((child: any) => (
                        <OrgTreeNode key={child._id} node={child} searchQuery={searchQuery} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
