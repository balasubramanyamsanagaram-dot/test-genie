import React from 'react';
import { UserProfile, EnterpriseProject } from '../types';
import { Download, Search, X, Plus, FolderKanban } from 'lucide-react';
import { UserProfileDropdown } from './UserProfileDropdown';

interface HeaderProps {
  activeTab: 'dashboard' | 'matrix' | 'repository' | 'cycles' | 'execution';
  setActiveTab: (tab: 'dashboard' | 'matrix' | 'repository' | 'cycles' | 'execution') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onExport: () => void;
  testCasesCount: number;
  currentUser: UserProfile;
  projects: EnterpriseProject[];
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
  onOpenNewProjectModal: () => void;
  onOpenUserManagementModal: () => void;
  onRestoreDefaultModules: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  onSearchChange,
  onExport,
  testCasesCount,
  currentUser,
  projects,
  selectedProjectId,
  onSelectProject,
  onOpenNewProjectModal,
  onOpenUserManagementModal,
  onRestoreDefaultModules,
  onLogout
}) => {
  const canManageProjects = currentUser.role === 'Admin' || currentUser.role === 'QA Lead' || currentUser.role === 'QA Engineer';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Left: Project Switcher Dropdown */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-white rounded-xl shadow-xs border border-slate-200">
                <FolderKanban className="w-4 h-4 text-indigo-600" />
                <select
                  value={selectedProjectId}
                  onChange={e => onSelectProject(e.target.value)}
                  className="bg-transparent text-xs font-extrabold text-slate-900 focus:outline-none cursor-pointer pr-1"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      [{p.key}] {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {canManageProjects && (
                <button
                  onClick={onOpenNewProjectModal}
                  className="p-1.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-white transition-all ml-1"
                  title="Create New Project"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Right: Global Search, Export & User Profile Popover Dropdown */}
          <div className="flex items-center space-x-3">
            
            {/* Global Search Input */}
            <div className="relative hidden sm:block">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                placeholder="Search test cases, modules, or Jira bugs..."
                className="w-64 bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-8 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-sans"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Export Zephyr CSV / Audit Button */}
            <button
              onClick={onExport}
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-extrabold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export
            </button>

            {/* User Profile Popover Dropdown (Matches User Screenshot Layout) */}
            <UserProfileDropdown
              currentUser={currentUser}
              onOpenUserManagementModal={onOpenUserManagementModal}
              onLogout={onLogout}
              onRestoreDefaults={onRestoreDefaultModules}
            />

          </div>

        </div>
      </div>
    </header>
  );
};
