import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { UserProfile, EnterpriseProject } from '../types';
import { Download, Search, X, Plus, FolderKanban, HelpCircle, Bell, ShieldCheck, Terminal, Bug, FileSpreadsheet, CheckCircle2, Clock } from 'lucide-react';
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
  searchQuery,
  onSearchChange,
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

  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);

  const sampleNotifications = [
    {
      id: 'notif-1',
      title: 'Jira Cloud Active Sync Connected',
      message: 'Direct API connection established with Atlassian Jira Cloud (Project: HGA).',
      time: 'Just now',
      icon: <Bug className="w-4 h-4 text-emerald-500" />
    },
    {
      id: 'notif-2',
      title: 'Playwright Automation Engine Active',
      message: 'Local browser headed runner initialized on port 4600.',
      time: '10m ago',
      icon: <Terminal className="w-4 h-4 text-indigo-500" />
    },
    {
      id: 'notif-3',
      title: 'Master Test Repository Hydrated',
      message: '115 zero-gap verified test scenarios loaded across modules.',
      time: '1h ago',
      icon: <ShieldCheck className="w-4 h-4 text-purple-500" />
    }
  ];

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

          {/* Center: Global Search Input */}
          <div className="flex-1 max-w-md mx-4 relative hidden md:block">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search test cases..."
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-sans font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right: Export, Help, Notification & Profile Dropdown */}
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

            {/* Help Icon */}
            <button
              onClick={() => setIsHelpOpen(true)}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-xl hover:bg-slate-100"
              title="Help & Platform Guide"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            {/* Notification Bell with alert badge */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  setUnreadCount(0);
                }}
                className="text-slate-400 hover:text-indigo-600 transition-colors p-1.5 rounded-xl hover:bg-slate-100 relative"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-rose-500 text-white font-mono text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Popover Menu */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 p-4 animate-in fade-in slide-in-from-top-2 duration-150 font-sans">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                    <h4 className="text-xs font-extrabold text-slate-900 flex items-center">
                      <Bell className="w-3.5 h-3.5 text-indigo-600 mr-1.5" />
                      Live System Notifications
                    </h4>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      System Operational
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-64 overflow-y-auto">
                    {sampleNotifications.map(n => (
                      <div key={n.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/80 transition-all flex items-start space-x-2.5">
                        <div className="p-1.5 bg-white rounded-lg border border-slate-200 shadow-2xs mt-0.5">
                          {n.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 truncate">{n.title}</span>
                            <span className="text-[9px] text-slate-400 flex items-center"><Clock className="w-2.5 h-2.5 mr-0.5" />{n.time}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{n.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Popover Dropdown */}
            <UserProfileDropdown
              currentUser={currentUser}
              onOpenUserManagementModal={onOpenUserManagementModal}
              onLogout={onLogout}
            />

          </div>

        </div>
      </div>

      {/* Help & System Documentation Modal */}
      {isHelpOpen && createPortal(
        <div
          className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 font-sans"
          onClick={() => setIsHelpOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col font-sans"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-indigo-900 text-white flex items-center justify-between border-b border-indigo-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
                  ?
                </div>
                <div>
                  <h3 className="text-sm font-extrabold">TestGenie Enterprise QA Guide</h3>
                  <p className="text-[10px] text-indigo-300">Platform documentation & user overview</p>
                </div>
              </div>
              <button
                onClick={() => setIsHelpOpen(false)}
                className="p-1.5 rounded-xl hover:bg-indigo-800 text-indigo-200 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-100 space-y-1">
                <h4 className="font-extrabold text-indigo-900 flex items-center text-xs">
                  <Terminal className="w-4 h-4 text-indigo-600 mr-1.5" />
                  1. Playwright Browser Automation Engine
                </h4>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Click <strong>🤖 Automate</strong> on any test case to open the local Playwright browser runner (Port 4600). It compiles and executes step assertions in real-time, recording console traces and screenshots.
                </p>
              </div>

              <div className="p-3.5 bg-rose-50/70 rounded-2xl border border-rose-100 space-y-1">
                <h4 className="font-extrabold text-rose-900 flex items-center text-xs">
                  <Bug className="w-4 h-4 text-rose-600 mr-1.5" />
                  2. Atlassian Jira Cloud Integration
                </h4>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  When a test execution fails, click <strong>Create Jira Bug</strong> to open the Jira Defect Management modal. Defects are created directly under project <strong>HGA</strong> with auto-assigned developers fetched live from Jira Cloud.
                </p>
              </div>

              <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-100 space-y-1">
                <h4 className="font-extrabold text-emerald-900 flex items-center text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-1.5" />
                  3. Automated vs Manual Execution Audits
                </h4>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Manual status updates record <strong>👤 Manual Execution Audit</strong> with uploaded proof. Automated Playwright runs record <strong>🤖 BrowserAutomationAgent Audit</strong> with interactive console traces.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <h4 className="font-extrabold text-slate-900 flex items-center text-xs">
                  <FileSpreadsheet className="w-4 h-4 text-slate-600 mr-1.5" />
                  4. Exporting Reports & Zephyr Scale CSVs
                </h4>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Use the <strong>Export</strong> button in the top right header to export cycle reports as CSV, Markdown, or Zephyr Scale compatible formats for instant import.
                </p>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsHelpOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-xs"
              >
                Got It
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};
