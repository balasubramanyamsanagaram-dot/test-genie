import React from 'react';
import { UserProfile, EnterpriseProject } from '../types';
import { Download, Plus, FolderKanban } from 'lucide-react';
import { UserProfileDropdown } from './UserProfileDropdown';
import { SearchableSelect } from './SearchableSelect';

interface HeaderProps {
  activeTab: 'dashboard' | 'matrix' | 'repository' | 'cycles' | 'execution' | 'bugs' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'matrix' | 'repository' | 'cycles' | 'execution' | 'bugs' | 'settings') => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onExport: () => void;
  testCasesCount?: number;
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
  onExport,
  currentUser,
  projects,
  selectedProjectId,
  onSelectProject,
  onOpenNewProjectModal,
  onOpenUserManagementModal,
  onLogout
}) => {
  const canManageProjects = currentUser.role === 'Admin' || currentUser.role === 'QA Lead' || currentUser.role === 'QA Engineer';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs font-sans">
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

          {/* Right: Export Button & Profile Dropdown */}
          <div className="flex items-center space-x-3 relative">
            
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
