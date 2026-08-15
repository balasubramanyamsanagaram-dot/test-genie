import React from 'react';
import { UserProfile, EnterpriseProject } from '../types';
import { Download, Search, X, Plus, FolderKanban, HelpCircle, Bell, Lock } from 'lucide-react';
import { UserProfileDropdown } from './UserProfileDropdown';
import { SearchableSelect } from './SearchableSelect';

interface HeaderProps {
  activeTab: 'dashboard' | 'matrix' | 'repository' | 'cycles' | 'execution' | 'bugs' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'matrix' | 'repository' | 'cycles' | 'execution' | 'bugs' | 'settings') => void;
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
  onRestoreDefaultModules?: () => void;
  onOpenCommandPalette?: () => void;
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
  onOpenCommandPalette,
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
              <div className="flex items-center space-x-2 px-2 py-1 bg-white rounded-xl shadow-xs border border-slate-200">
                <FolderKanban className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <SearchableSelect
                  options={projects.map(p => ({ value: p.id, label: `[${p.key}] ${p.name}` }))}
                  value={selectedProjectId}
                  onChange={onSelectProject}
                  className="w-48 text-xs"
                />
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

          {/* Center: Global Search Input / Command Palette Trigger */}
          <div 
            onClick={() => onOpenCommandPalette?.()}
            className="flex-1 max-w-md mx-4 relative hidden md:block cursor-pointer group"
          >
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            <input
              type="text"
              readOnly
              value={searchQuery}
              placeholder="Search test cases, run commands (⌘ + Shift + L)..."
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-9 pr-16 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none group-hover:border-indigo-300 font-sans font-medium cursor-pointer"
            />
            <div className="absolute right-2 top-2 flex items-center space-x-1 font-mono text-[9px] font-bold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md shadow-2xs">
              <span>⌘+Shift+L</span>
            </div>
          </div>

          {/* Right: Export, Help, Notification & Profile Dropdown */}
          <div className="flex items-center space-x-4">
            
            {/* Export Zephyr CSV / Audit Button */}
            {(currentUser.role === 'Admin' || currentUser.role === 'QA Lead') && (
              <button
                onClick={onExport}
                className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-extrabold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Export
              </button>
            )}

            {/* Help Icon */}
            <button className="text-slate-400 hover:text-slate-600 transition-colors p-1" title="Help & Documentation">
              <HelpCircle className="w-5 h-5" />
            </button>

            {/* Notification Bell with alert badge */}
            <button className="text-slate-400 hover:text-indigo-600 transition-colors p-1 relative" title="Notifications">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-rose-500 text-white font-mono text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                1
              </span>
            </button>

            {/* User Profile Popover Dropdown */}
            <UserProfileDropdown
              currentUser={currentUser}
              onOpenUserManagementModal={onOpenUserManagementModal}
              onLogout={onLogout}
            />

          </div>

        </div>
      </div>
    </header>
  );
};
