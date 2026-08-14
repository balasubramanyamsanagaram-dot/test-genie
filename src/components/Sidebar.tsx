import React, { useState } from 'react';
import { ProjectModule, UserProfile, EnterpriseProject } from '../types';
import {
  FolderKanban,
  Plus,
  LayoutDashboard,
  RotateCw,
  PlaySquare,
  FileCheck2,
  FolderPlus,
  X,
  Search,
  ShieldCheck,
  Building2,
  Layers,
  Lock,
  Boxes,
  Edit2,
  Trash2,
  Check
} from 'lucide-react';
import { ConfirmModal, ConfirmType } from './ConfirmModal';

interface SidebarProps {
  modules: ProjectModule[];
  selectedModuleId: string;
  currentUser: UserProfile;
  activeProject: EnterpriseProject;
  onSelectModule: (id: string) => void;
  onAddNewModule: (moduleName: string) => void;
  onEditModule: (moduleId: string, newName: string) => void;
  onDeleteModule: (moduleId: string) => void;
  activeTab: 'dashboard' | 'matrix' | 'repository' | 'cycles' | 'execution';
  setActiveTab: (tab: 'dashboard' | 'matrix' | 'repository' | 'cycles' | 'execution') => void;
  testCasesCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  modules,
  selectedModuleId,
  currentUser,
  activeProject,
  onSelectModule,
  onAddNewModule,
  onEditModule,
  onDeleteModule,
  activeTab,
  setActiveTab,
  testCasesCount
}) => {
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  // Editing state for module
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Custom confirmation modal state
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: ConfirmType;
    confirmText: string;
    onConfirm: () => void;
  } | null>(null);

  // QA Engineers, QA Leads, and Admins can manage module repositories
  const canManageModule = currentUser.role === 'Admin' || currentUser.role === 'QA Lead' || currentUser.role === 'QA Engineer';

  const filteredModules = modules.filter(m =>
    m.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageModule) return;
    if (!newModuleName.trim()) return;
    onAddNewModule(newModuleName.trim());
    setNewModuleName('');
    setIsAddingModule(false);
  };

  const handleStartRename = (mod: ProjectModule, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingModuleId(mod.id);
    setEditingName(mod.name);
  };

  const handleSaveRename = (modId: string, e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (editingName.trim()) {
      onEditModule(modId, editingName.trim());
    }
    setEditingModuleId(null);
  };

  const handleDeleteClick = (mod: ProjectModule, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canManageModule) return;
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Module Repository',
      message: `Are you sure you want to permanently delete module repository "${mod.name}"? All associated manual test cases will be permanently removed. This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete Module',
      onConfirm: () => {
        onDeleteModule(mod.id);
        setConfirmConfig(null);
      }
    });
  };

  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 shadow-sm z-30 flex-shrink-0 select-none text-slate-800">
      
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-200 flex items-center space-x-3 bg-slate-50/80">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 font-bold">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <h1 className="text-sm font-black text-slate-900 tracking-tight font-sans">TestGenie QA</h1>
            <span className="text-[9px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded">
              v4.2
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
            Enterprise Quality Assurance Portal
          </p>
        </div>
      </div>

      {/* Active Project Banner */}
      <div className="px-4 py-3 bg-indigo-50/60 border-b border-indigo-100 flex items-center justify-between">
        <div className="flex items-center space-x-2 min-w-0">
          <Boxes className="w-4 h-4 text-indigo-600 flex-shrink-0" />
          <div className="min-w-0">
            <span className="text-[9px] font-mono font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded border border-indigo-200 uppercase">
              {activeProject.key}
            </span>
            <span className="text-xs font-bold text-slate-900 truncate block mt-0.5">
              {activeProject.name}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Navigation Section */}
      <div className="p-3 border-b border-slate-200 space-y-1">
        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider px-3 block mb-1">
          Core Workspaces
        </span>

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 active:scale-[0.98] ${
            activeTab === 'dashboard'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent hover:border-slate-200'
          }`}
        >
          <span className="flex items-center">
            <LayoutDashboard className={`w-4 h-4 mr-2.5 ${activeTab === 'dashboard' ? 'text-white' : 'text-indigo-600'}`} />
            Overview &amp; Analytics
          </span>
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 active:scale-[0.98] ${
            activeTab === 'matrix'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent hover:border-slate-200'
          }`}
        >
          <span className="flex items-center">
            <FileCheck2 className={`w-4 h-4 mr-2.5 ${activeTab === 'matrix' ? 'text-white' : 'text-indigo-600'}`} />
            Test Repositories
          </span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
            activeTab === 'matrix' ? 'bg-indigo-700/60 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {testCasesCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('cycles')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 active:scale-[0.98] ${
            activeTab === 'cycles'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent hover:border-slate-200'
          }`}
        >
          <span className="flex items-center">
            <RotateCw className={`w-4 h-4 mr-2.5 ${activeTab === 'cycles' ? 'text-white' : 'text-indigo-600'}`} />
            Test Execution Cycles
          </span>
        </button>

        <button
          onClick={() => setActiveTab('execution')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 active:scale-[0.98] ${
            activeTab === 'execution'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent hover:border-slate-200'
          }`}
        >
          <span className="flex items-center">
            <PlaySquare className={`w-4 h-4 mr-2.5 ${activeTab === 'execution' ? 'text-white' : 'text-indigo-600'}`} />
            Live Execution Board
          </span>
        </button>
      </div>

      {/* Module Repositories Section */}
      <div className="flex-1 flex flex-col min-h-0 p-3 space-y-2">
        <div className="flex items-center justify-between px-2">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            Module Repositories ({modules.length})
          </span>

          {canManageModule ? (
            <button
              onClick={() => setIsAddingModule(true)}
              className="p-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm"
              title="Create New Module Repository"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span title="Creating modules restricted for Developer/Auditor" className="p-1 rounded-lg bg-slate-100 text-slate-400 cursor-not-allowed">
              <Lock className="w-3.5 h-3.5" />
            </span>
          )}
        </div>

        {/* Filter Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            placeholder="Filter modules..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-sans"
          />
        </div>

        {/* Inline Create Form */}
        {isAddingModule && canManageModule && (
          <form onSubmit={handleCreateSubmit} className="bg-slate-50 p-2.5 rounded-xl border border-indigo-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-700">New Module Repository</span>
              <button type="button" onClick={() => setIsAddingModule(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <input
              type="text"
              value={newModuleName}
              onChange={e => setNewModuleName(e.target.value)}
              placeholder="e.g. Holidays & Leave Management"
              autoFocus
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-sans font-medium"
            />
            <button
              type="submit"
              className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
            >
              Add Module
            </button>
          </form>
        )}

        {/* Scrollable Module List with Edit & Delete Actions */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {filteredModules.map(mod => {
            const isSelected = activeTab === 'repository' && mod.id === selectedModuleId;
            const isEditing = editingModuleId === mod.id;

            if (isEditing) {
              return (
                <form key={mod.id} onSubmit={e => handleSaveRename(mod.id, e)} className="flex items-center space-x-1 p-1 bg-indigo-50 border border-indigo-300 rounded-xl">
                  <input
                    type="text"
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    autoFocus
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 font-bold focus:outline-none"
                  />
                  <button type="submit" className="p-1 text-emerald-600 hover:bg-emerald-100 rounded-lg" title="Save Rename">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => setEditingModuleId(null)} className="p-1 text-slate-400 hover:bg-slate-200 rounded-lg" title="Cancel">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>
              );
            }

            return (
              <div
                key={mod.id}
                onClick={() => onSelectModule(mod.id)}
                className={`group w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all text-left cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50 text-indigo-900 font-extrabold border border-indigo-200 shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center min-w-0 flex-1 mr-2">
                  <FolderKanban className={`w-3.5 h-3.5 mr-2 flex-shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className="truncate">{mod.name}</span>
                </div>

                <div className="flex items-center space-x-1">
                  {canManageModule && (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity">
                      <button
                        onClick={e => handleStartRename(mod, e)}
                        className="p-1 rounded hover:bg-indigo-100 text-slate-400 hover:text-indigo-600"
                        title="Rename Repository"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={e => handleDeleteClick(mod, e)}
                        className="p-1 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-600"
                        title="Delete Repository"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600 shadow-sm shadow-indigo-600 flex-shrink-0" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Light Theme Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/80 text-[10px] text-slate-500 flex items-center justify-between">
        <span className="flex items-center font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
          {currentUser.role} Session Active
        </span>
        <span className="font-mono">Build 2026.08</span>
      </div>

      {/* Reusable Confirm Modal */}
      {confirmConfig && (
        <ConfirmModal
          isOpen={confirmConfig.isOpen}
          title={confirmConfig.title}
          message={confirmConfig.message}
          type={confirmConfig.type}
          confirmText={confirmConfig.confirmText}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmConfig(null)}
        />
      )}

    </aside>
  );
};
