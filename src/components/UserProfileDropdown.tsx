import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { Users, Database, Upload, RotateCw, LogOut, ChevronDown, Shield, CheckCircle2, Lock } from 'lucide-react';

interface UserProfileDropdownProps {
  currentUser: UserProfile;
  onOpenUserManagementModal: () => void;
  onLogout: () => void;
  onRestoreDefaults?: () => void;
}

export const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({
  currentUser,
  onOpenUserManagementModal,
  onLogout
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = currentUser.role === 'Admin';
  const canManage = currentUser.role === 'Admin' || currentUser.role === 'QA Lead';

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Export Backup JSON
  const handleExportBackup = () => {
    const cyclesV2 = JSON.parse(localStorage.getItem('test_genie_test_cycles_v2') || '[]');
    const cyclesV1 = JSON.parse(localStorage.getItem('test_genie_test_cycles_v1') || '[]');
    const cycles = cyclesV2.length > 0 ? cyclesV2 : cyclesV1;

    const casesV2 = JSON.parse(localStorage.getItem('test_genie_custom_cases_v2') || '{}');
    const casesV1 = JSON.parse(localStorage.getItem('test_genie_custom_cases_v1') || '{}');
    const customCases = Object.keys(casesV2).length > 0 ? casesV2 : casesV1;

    const data = {
      timestamp: new Date().toISOString(),
      projects: JSON.parse(localStorage.getItem('test_genie_projects_v2') || '[]'),
      customCases,
      testCycles: cycles,
      registeredUsers: JSON.parse(localStorage.getItem('registered_enterprise_users_v2') || '[]')
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `testgenie_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsOpen(false);
  };

  // Handle Restore Backup JSON File Upload
  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.projects) localStorage.setItem('test_genie_projects_v2', JSON.stringify(parsed.projects));
        if (parsed.customCases) {
          localStorage.setItem('test_genie_custom_cases_v2', JSON.stringify(parsed.customCases));
          localStorage.setItem('test_genie_custom_cases_v1', JSON.stringify(parsed.customCases));
        }
        if (parsed.testCycles) {
          localStorage.setItem('test_genie_test_cycles_v2', JSON.stringify(parsed.testCycles));
          localStorage.setItem('test_genie_test_cycles_v1', JSON.stringify(parsed.testCycles));
        }
        if (parsed.registeredUsers) localStorage.setItem('registered_enterprise_users_v2', JSON.stringify(parsed.registeredUsers));

        alert('System Backup successfully restored! Reloading platform...');
        window.location.reload();
      } catch (err) {
        console.error('[TestGenie Restoration Error]', err);
        alert(`Restoration Failed: Invalid JSON backup file format. Details: ${err instanceof Error ? err.message : String(err)}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      
      {/* Profile Avatar Pill Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2.5 bg-slate-50 hover:bg-slate-100 p-1.5 pr-3 rounded-2xl border border-slate-200 transition-all cursor-pointer shadow-xs active:scale-95"
      >
        <div className={`w-8 h-8 rounded-xl ${currentUser.avatarColor} text-white font-extrabold flex items-center justify-center text-xs shadow-xs`}>
          {currentUser.name.charAt(0)}
        </div>
        <div className="text-left hidden sm:block">
          <span className="block text-[11px] font-extrabold leading-tight text-slate-900">{currentUser.name}</span>
          <span className="text-[10px] text-slate-500 font-medium leading-tight">{currentUser.role}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Dropdown Menu (Matching User Screenshot Layout) */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
          
          {/* Header Info Section */}
          <div className="p-4 bg-slate-50/80 border-b border-slate-100">
            <div className="flex items-center justify-between mb-1">
              <span className="font-extrabold text-slate-900 text-sm">{currentUser.name}</span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                currentUser.role === 'Admin' ? 'bg-rose-50 text-rose-800 border-rose-300' :
                currentUser.role === 'QA Lead' ? 'bg-indigo-50 text-indigo-800 border-indigo-300' :
                'bg-emerald-50 text-emerald-800 border-emerald-300'
              }`}>
                {currentUser.role}
              </span>
            </div>
            <p className="text-slate-500 font-mono text-[11px] truncate">{currentUser.email}</p>
            <span className="text-[10px] text-slate-400 font-medium block mt-1">
              TestGenie Version 5.0.0 (Enterprise Full-Stack)
            </span>
          </div>

          {/* Actions List */}
          <div className="p-2 space-y-1">
            
            {/* Manage Users (Admin) */}
            {isAdmin && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenUserManagementModal();
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-100 text-slate-800 font-bold flex items-center transition-colors"
              >
                <Users className="w-4 h-4 mr-2.5 text-rose-600" />
                Manage Users & RBAC Roles
              </button>
            )}

            {/* Export System Backup */}
            {canManage && (
              <button
                onClick={handleExportBackup}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-100 text-slate-800 font-bold flex items-center transition-colors"
              >
                <Database className="w-4 h-4 mr-2.5 text-indigo-600" />
                Export System Data Backup
              </button>
            )}

            {/* Restore System Backup */}
            {isAdmin && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-100 text-slate-800 font-bold flex items-center transition-colors"
                >
                  <Upload className="w-4 h-4 mr-2.5 text-emerald-600" />
                  Restore System Data Backup
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileRestore}
                  accept=".json"
                  className="hidden"
                />
              </>
            )}
          </div>

          {/* Footer Logout Button (Matches Screenshot Log out style) */}
          <div className="p-2 border-t border-slate-100 bg-slate-50/50">
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-extrabold flex items-center transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2.5" />
              Log out
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
