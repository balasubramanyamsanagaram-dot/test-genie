import React from 'react';
import { ProjectModule, TestCase, UserProfile } from '../types';
import { Folder, FileCheck2, Plus, ArrowRight, Layers, Sparkles, Upload, Lock, Edit2, Trash2 } from 'lucide-react';

interface ModuleCardsGridProps {
  modules: ProjectModule[];
  customModuleCases: Record<string, TestCase[]>;
  selectedModuleId: string;
  currentUser: UserProfile;
  searchQuery?: string;
  onSelectModule: (id: string) => void;
  onOpenImporter: (moduleId: string) => void;
  onNavigateToRepository: (moduleId: string) => void;
  onEditModule: (moduleId: string, newName: string) => void;
  onDeleteModule: (moduleId: string) => void;
}

export const ModuleCardsGrid: React.FC<ModuleCardsGridProps> = ({
  modules,
  customModuleCases,
  selectedModuleId,
  currentUser,
  searchQuery = '',
  onSelectModule,
  onOpenImporter,
  onNavigateToRepository,
  onEditModule,
  onDeleteModule
}) => {
  const canManageCases = currentUser.role === 'Admin' || currentUser.role === 'QA Lead' || currentUser.role === 'QA Engineer';

  const filteredModules = modules.filter(m => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const cases = customModuleCases[m.id] || [];
    const matchesModuleName = m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q);
    const matchesCase = cases.some(c =>
      c.key.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.objective.toLowerCase().includes(q)
    );
    return matchesModuleName || matchesCase;
  });

  const handleAddCasesClick = (modId: string) => {
    if (!canManageCases) {
      alert(`Role Restriction: User role '${currentUser.role}' cannot add or upload test cases.`);
      return;
    }
    onOpenImporter(modId);
  };

  const handleRenameClick = (mod: ProjectModule, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canManageCases) return;
    const newName = prompt('Enter new repository name:', mod.name);
    if (newName && newName.trim()) {
      onEditModule(mod.id, newName.trim());
    }
  };

  const handleDeleteClick = (mod: ProjectModule, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canManageCases) return;
    if (confirm(`Are you sure you want to delete module repository "${mod.name}"? All associated test cases will be removed.`)) {
      onDeleteModule(mod.id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center">
            <Layers className="w-5 h-5 text-indigo-600 mr-2" />
            Module Repositories ({filteredModules.length} Modules)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Click any module card to open its test case repository.
          </p>
        </div>
      </div>

      {filteredModules.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 text-slate-500 text-xs">
          No module repositories matched your search "{searchQuery}".
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredModules.map(mod => {
            const cases = customModuleCases[mod.id] || [];
            const isSelected = mod.id === selectedModuleId;
            const posCount = cases.filter(c => c.type === 'Positive').length;
            const negCount = cases.length - posCount;

            return (
              <div
                key={mod.id}
                onClick={() => onSelectModule(mod.id)}
                className={`bg-white rounded-3xl p-6 border transition-all shadow-sm hover:shadow-md flex flex-col justify-between space-y-4 cursor-pointer group ${
                  isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/10'
                    : 'border-slate-200 hover:border-indigo-300'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <Folder className="w-5 h-5" />
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                        {cases.length} Test Cases
                      </span>

                      {canManageCases && (
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={e => handleRenameClick(mod, e)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-100 text-slate-500 hover:text-indigo-700 transition-all"
                            title="Rename Repository"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={e => handleDeleteClick(mod, e)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-700 transition-all"
                            title="Delete Repository"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">{mod.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-mono">
                      ID: {mod.id}
                    </p>
                  </div>

                  {/* Case Breakdown Pills */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200 text-center">
                      <span className="text-[10px] text-emerald-700 block font-medium">Positive Scenarios</span>
                      <span className="font-extrabold text-emerald-800 text-sm">{posCount}</span>
                    </div>
                    <div className="bg-rose-50 p-2 rounded-xl border border-rose-200 text-center">
                      <span className="text-[10px] text-rose-700 block font-medium">Negative Scenarios</span>
                      <span className="font-extrabold text-rose-800 text-sm">{negCount}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons with RBAC Guarding */}
                <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-2" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => handleAddCasesClick(mod.id)}
                    className={`inline-flex items-center justify-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      canManageCases
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95'
                        : 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed'
                    }`}
                  >
                    {canManageCases ? <Plus className="w-3.5 h-3.5 mr-1 text-indigo-600" /> : <Lock className="w-3.5 h-3.5 mr-1 text-slate-400" />}
                    Add Cases
                  </button>

                  <button
                    onClick={() => onNavigateToRepository(mod.id)}
                    className="inline-flex items-center justify-center px-3 py-2.5 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm active:scale-95"
                  >
                    <FileCheck2 className="w-3.5 h-3.5 mr-1" />
                    Repository
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
