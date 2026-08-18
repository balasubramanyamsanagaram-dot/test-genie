import React, { useState } from 'react';
import { TestCycle, TestCase, UserProfile, TestCycleItem, ProjectModule } from '../types';
import { AddCasesToCycleModal } from './AddCasesToCycleModal';
import { ConfirmModal } from './ConfirmModal';
import { RotateCw, Plus, PlaySquare, Calendar, Layers, ShieldCheck, CheckCircle2, User, FileSpreadsheet, Lock, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import { SearchableSelect } from './SearchableSelect';

interface TestCycleManagerProps {
  moduleName: string;
  allModules: ProjectModule[];
  allModuleCasesMap: Record<string, TestCase[]>;
  currentModuleCases: TestCase[];
  testCycles: TestCycle[];
  currentUser: UserProfile;
  onCreateCycle: (newCycle: TestCycle) => void;
  onAddCasesToCycle: (cycleId: string, newCases: TestCase[]) => void;
  onSelectCycleToExecute: (cycleId: string) => void;
  onDeleteCycle?: (cycleId: string) => void;
  onSyncEditedCasesToCycle?: (cycleId: string) => void;
  onToggleIgnoreSync?: (cycleId: string) => void;
}

export const TestCycleManager: React.FC<TestCycleManagerProps> = ({
  moduleName,
  allModules,
  allModuleCasesMap,
  currentModuleCases,
  testCycles,
  currentUser,
  onCreateCycle,
  onAddCasesToCycle,
  onSelectCycleToExecute,
  onDeleteCycle,
  onSyncEditedCasesToCycle,
  onToggleIgnoreSync
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [targetCycleForAddModal, setTargetCycleForAddModal] = useState<TestCycle | null>(null);
  const [deletingCycle, setDeletingCycle] = useState<TestCycle | null>(null);

  // Form State
  const [cycleName, setCycleName] = useState(`Sprint 24 — ${moduleName} Execution`);
  const [version, setVersion] = useState('v2.4.0');
  const [environment, setEnvironment] = useState<'Staging' | 'Production' | 'UAT' | 'QA-Dev'>('Staging');
  const [assignedTester, setAssignedTester] = useState(currentUser.name);  // Multi-Module & Test Case Selection State
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>(['ALL']);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCaseKeys, setSelectedCaseKeys] = useState<string[]>([]);

  const canCreateCycle = currentUser.role === 'Admin' || currentUser.role === 'QA Lead' || currentUser.role === 'QA Engineer';

  // Compute all available cases across all modules
  const allAvailableCases: TestCase[] = React.useMemo(() => {
    return Object.values(allModuleCasesMap).flat();
  }, [allModuleCasesMap]);

  // Compute available pool of test cases based on selected module scope
  const availablePool = React.useMemo(() => {
    const pool: { testCase: TestCase; moduleName: string; moduleId: string }[] = [];
    const isAll = selectedModuleIds.includes('ALL');

    allModules.forEach(mod => {
      if (isAll || selectedModuleIds.includes(mod.id)) {
        const cases = allModuleCasesMap[mod.id] || [];
        cases.forEach(tc => {
          pool.push({
            testCase: tc,
            moduleName: mod.name,
            moduleId: mod.id
          });
        });
      }
    });

    return pool;
  }, [allModules, allModuleCasesMap, selectedModuleIds]);

  // Filter pool by search query
  const filteredPool = React.useMemo(() => {
    if (!searchQuery.trim()) return availablePool;
    const q = searchQuery.toLowerCase().trim();
    return availablePool.filter(p =>
      p.testCase.key.toLowerCase().includes(q) ||
      p.testCase.name.toLowerCase().includes(q) ||
      p.moduleName.toLowerCase().includes(q)
    );
  }, [availablePool, searchQuery]);

  // Total available cases across all modules
  const totalAllModulesCasesCount = React.useMemo(() => {
    return Object.values(allModuleCasesMap).flat().length;
  }, [allModuleCasesMap]);

  // When opening creation drawer, select all cases in available pool by default
  const handleOpenCreateDrawer = () => {
    setSelectedModuleIds(['ALL']);
    const allKeys = Object.values(allModuleCasesMap).flat().map(c => c.key);
    setSelectedCaseKeys(allKeys);
    setIsCreating(true);
  };

  // Toggle Module Scope Selection
  const handleToggleModuleScope = (modId: string) => {
    if (modId === 'ALL') {
      setSelectedModuleIds(['ALL']);
      const allKeys = Object.values(allModuleCasesMap).flat().map(c => c.key);
      setSelectedCaseKeys(allKeys);
      return;
    }

    let nextModuleIds: string[];
    if (selectedModuleIds.includes('ALL')) {
      nextModuleIds = [modId];
    } else if (selectedModuleIds.includes(modId)) {
      nextModuleIds = selectedModuleIds.filter(id => id !== modId);
      if (nextModuleIds.length === 0) nextModuleIds = ['ALL'];
    } else {
      nextModuleIds = [...selectedModuleIds, modId];
    }

    setSelectedModuleIds(nextModuleIds);

    // Auto-select keys belonging to selected modules
    const nextPool: TestCase[] = [];
    const isAll = nextModuleIds.includes('ALL');
    allModules.forEach(m => {
      if (isAll || nextModuleIds.includes(m.id)) {
        const cases = allModuleCasesMap[m.id] || [];
        nextPool.push(...cases);
      }
    });
    setSelectedCaseKeys(nextPool.map(c => c.key));
  };

  // Handle Select All toggle for filtered scenarios
  const handleSelectAllToggle = () => {
    const visibleKeys = filteredPool.map(p => p.testCase.key);
    const allVisibleSelected = visibleKeys.length > 0 && visibleKeys.every(k => selectedCaseKeys.includes(k));

    if (allVisibleSelected) {
      setSelectedCaseKeys(prev => prev.filter(k => !visibleKeys.includes(k)));
    } else {
      setSelectedCaseKeys(prev => Array.from(new Set([...prev, ...visibleKeys])));
    }
  };

  // Handle individual checkbox toggle
  const handleToggleCase = (key: string) => {
    setSelectedCaseKeys(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  // Create Cycle Submit
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateCycle) {
      alert(`Role Restriction: User role '${currentUser.role}' cannot create test cycles. Only Admin, QA Lead, or QA Engineer roles can create cycles.`);
      return;
    }
    if (selectedCaseKeys.length === 0) {
      alert('Validation Error: Please select at least 1 test case scenario to include in this test cycle.');
      return;
    }

    const selectedPool = availablePool.filter(p => selectedCaseKeys.includes(p.testCase.key));

    const cycleItems: TestCycleItem[] = selectedPool.map(p => ({
      id: `item-${p.testCase.key}-${Date.now()}`,
      testCase: p.testCase,
      executionStatus: 'UNEXECUTED',
      assignedTo: assignedTester
    }));

    // Compute Module Title for Cycle
    let targetModuleName = moduleName;
    if (selectedModuleIds.includes('ALL')) {
      targetModuleName = `All Project Modules (${allModules.length} Modules)`;
    } else if (selectedModuleIds.length > 1) {
      const names = allModules.filter(m => selectedModuleIds.includes(m.id)).map(m => m.name);
      targetModuleName = `Cross-Module (${names.join(', ')})`;
    } else if (selectedModuleIds.length === 1) {
      const single = allModules.find(m => m.id === selectedModuleIds[0]);
      if (single) targetModuleName = single.name;
    }

    const newCycle: TestCycle = {
      id: `cycle-${Date.now().toString().slice(-4)}`,
      name: cycleName.trim(),
      version: version.trim(),
      environment,
      moduleName: targetModuleName,
      assignedTester,
      createdBy: currentUser.name,
      createdAt: new Date().toLocaleString(),
      items: cycleItems
    };

    onCreateCycle(newCycle);
    setIsCreating(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center">
            <RotateCw className="w-5 h-5 text-indigo-600 mr-2" />
            Test Execution Cycles — {moduleName}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Group test cases into release runs, assign QA testers, and sync newly uploaded test cases live.
          </p>
        </div>

        {canCreateCycle && (
          <button
            onClick={handleOpenCreateDrawer}
            className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            + Create New Test Cycle
          </button>
        )}
      </div>

      {/* Inline Create Form Drawer */}
      {isCreating && canCreateCycle && (
        <form onSubmit={handleCreateSubmit} className="bg-white rounded-3xl p-6 border border-indigo-200 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Configure New Test Cycle Run</h3>
              <p className="text-xs text-slate-500 mt-0.5">Select single module, multiple modules, or entire project suite for this execution run.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Cycle Title *</label>
              <input
                type="text"
                value={cycleName}
                onChange={e => setCycleName(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Release Version *</label>
              <input
                type="text"
                value={version}
                onChange={e => setVersion(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Target Environment</label>
              <SearchableSelect
                options={[
                  { value: 'Staging', label: 'Staging (QA-Staging)' },
                  { value: 'UAT', label: 'UAT (Client Sandbox)' },
                  { value: 'QA-Dev', label: 'QA-Dev (Integration)' },
                  { value: 'Production', label: 'Production (Sanity Check)' }
                ]}
                value={environment}
                onChange={val => setEnvironment(val as any)}
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Assign QA Tester</label>
              <input
                type="text"
                value={assignedTester}
                onChange={e => setAssignedTester(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold"
              />
            </div>
          </div>

          {/* Module Selector Filter Pills */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="font-extrabold text-slate-800 text-xs block">
              Target Module Scope (Select single module, multiple modules, or all project modules)
            </label>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleToggleModuleScope('ALL')}
                className={`px-3 py-1.5 rounded-xl font-extrabold border transition-all ${
                  selectedModuleIds.includes('ALL')
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🌐 All Project Modules ({totalAllModulesCasesCount} Scenarios)
              </button>

              {allModules.map(mod => {
                const count = (allModuleCasesMap[mod.id] || []).length;
                const isSelected = selectedModuleIds.includes('ALL') || selectedModuleIds.includes(mod.id);
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => handleToggleModuleScope(mod.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold border transition-all flex items-center ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-800 border-indigo-300 font-extrabold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="mr-1">{mod.name}</span>
                    <span className="bg-white/80 text-indigo-700 px-1.5 py-0.2 rounded text-[10px] font-mono border border-indigo-200">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Test Case Selection Table */}
          <div className="space-y-2 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="font-extrabold text-slate-800">
                Select Scenarios to Include ({selectedCaseKeys.length} of {availablePool.length} Selected)
              </span>

              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  placeholder="🔍 Search test cases by ID, name, or module..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 text-slate-800 font-medium text-xs w-64"
                />
                <button
                  type="button"
                  onClick={handleSelectAllToggle}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 whitespace-nowrap"
                >
                  {filteredPool.length > 0 && filteredPool.every(p => selectedCaseKeys.includes(p.testCase.key)) ? 'Deselect Filtered' : 'Select All Filtered Scenarios'}
                </button>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100 bg-slate-50/50">
              {filteredPool.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-bold">
                  No matching test case scenarios found for the selected module scope or search query.
                </div>
              ) : (
                filteredPool.map(p => {
                  const tc = p.testCase;
                  const isSelected = selectedCaseKeys.includes(tc.key);
                  return (
                    <label key={`${p.moduleId}-${tc.key}`} className="flex items-center px-4 py-2.5 hover:bg-white transition-colors cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleCase(tc.key)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                      <span className="font-mono font-bold text-indigo-700 ml-3 mr-2 w-20 flex-shrink-0">{tc.key}</span>
                      
                      <span className="bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded-md text-[10px] font-extrabold mr-3 flex-shrink-0 border border-indigo-200">
                        {p.moduleName}
                      </span>

                      <span className="font-bold text-slate-900 flex-1 truncate">{tc.name}</span>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        tc.type === 'Positive' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                      }`}>
                        {tc.type}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-md active:scale-95 transition-all"
            >
              Start Execution Cycle Run ({selectedCaseKeys.length} Scenarios)
            </button>
          </div>
        </form>
      )}

      {/* Cycle List Cards */}
      {testCycles.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <RotateCw className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
          <h3 className="text-lg font-extrabold text-slate-900">No Test Execution Cycles Created Yet</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Create your first test execution cycle run to execute test cases live on Staging/UAT environments.
          </p>
          {canCreateCycle && (
            <button
              onClick={() => {
                setSelectedCaseKeys(currentModuleCases.map(c => c.key));
                setIsCreating(true);
              }}
              className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
            >
              + Create First Test Cycle
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {testCycles.map(cycle => {
            const total = cycle.items.length;
            const passed = cycle.items.filter(i => i.executionStatus === 'PASSED').length;
            const failed = cycle.items.filter(i => i.executionStatus === 'FAILED').length;
            const blocked = cycle.items.filter(i => i.executionStatus === 'BLOCKED').length;
            const unexec = total - (passed + failed + blocked);

            const passPercent = total > 0 ? Math.round((passed / total) * 100) : 0;
            const failPercent = total > 0 ? Math.round((failed / total) * 100) : 0;
            const blockPercent = total > 0 ? Math.round((blocked / total) * 100) : 0;
            const executedTotal = passed + failed + blocked;
            const execPercent = total > 0 ? Math.round((executedTotal / total) * 100) : 0;

            // Filter all master repository cases across all modules
            const allCasesPool = Object.values(allModuleCasesMap).flat();

            // Check if there are newly uploaded cases in the repository NOT in this cycle (scoped by Category + Key)
            const existingScopedKeys = new Set(
              cycle.items.map(i => {
                const cat = (i.testCase.category || cycle.moduleName || '').trim().toLowerCase();
                const key = (i.testCase.key || '').trim().toUpperCase();
                return `${cat}:${key}`;
              })
            );
            const existingIds = new Set(cycle.items.map(i => i.testCase.id).filter(Boolean));

            const isAllOrCrossModuleCycle = 
              !cycle.moduleName ||
              cycle.moduleName.toLowerCase().includes('all project modules') ||
              cycle.moduleName.toLowerCase().includes('cross-module');

            const newUnassignedCasesCount = allCasesPool.filter(c => {
              // If cycle is for a single module, only check unassigned cases for that module!
              if (!isAllOrCrossModuleCycle) {
                const cCat = (c.category || '').trim().toLowerCase();
                const cycleMod = (cycle.moduleName || '').trim().toLowerCase();
                if (cCat && cycleMod && cCat !== cycleMod) return false;
              }

              if (c.id && existingIds.has(c.id)) return false;
              const cat = (c.category || '').trim().toLowerCase();
              const key = (c.key || '').trim().toUpperCase();
              return !existingScopedKeys.has(`${cat}:${key}`);
            }).length;

            // Check if any test cases in this cycle have been edited in the master repository
            const outdatedCasesCount = cycle.items.filter(item => {
              const itemKeyUpper = item.testCase.key?.trim().toUpperCase();
              if (!itemKeyUpper) return false;

              const itemCatNorm = (item.testCase.category || '').trim().toLowerCase();

              const master = (
                (item.testCase.id && allCasesPool.find(c => c.id === item.testCase.id)) ||
                (itemCatNorm && allCasesPool.find(c => (c.category || '').trim().toLowerCase() === itemCatNorm && c.key?.trim().toUpperCase() === itemKeyUpper)) ||
                allCasesPool.find(c => c.key?.trim().toUpperCase() === itemKeyUpper)
              );

              if (!master) return false;

              const normalize = (str?: string) => (str || '').replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
              return (
                normalize(master.name) !== normalize(item.testCase.name) ||
                normalize(master.testSteps) !== normalize(item.testCase.testSteps) ||
                normalize(master.expectedResult) !== normalize(item.testCase.expectedResult) ||
                normalize(master.objective) !== normalize(item.testCase.objective) ||
                normalize(master.precondition) !== normalize(item.testCase.precondition)
              );
            }).length;

            return (
              <div
                key={cycle.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                      {cycle.version}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      Env: {cycle.environment}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">{cycle.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Module: <strong className="text-slate-800">{cycle.moduleName}</strong> • Assigned: <strong className="text-indigo-600">{cycle.assignedTester}</strong>
                    </p>
                  </div>

                  {/* Sync Alert Banner for Edited/New Cases */}
                  {!cycle.ignoredSync && (outdatedCasesCount > 0 || newUnassignedCasesCount > 0) && (
                    <div className="bg-amber-50 p-2.5 rounded-2xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <span className="text-amber-900 font-bold flex items-center">
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-amber-600 animate-spin-slow flex-shrink-0" />
                        {outdatedCasesCount > 0 && newUnassignedCasesCount > 0
                          ? `${outdatedCasesCount} edited & ${newUnassignedCasesCount} new cases available!`
                          : outdatedCasesCount > 0
                          ? `${outdatedCasesCount} edited test case${outdatedCasesCount > 1 ? 's' : ''} ready to sync!`
                          : `${newUnassignedCasesCount} newly uploaded test case${newUnassignedCasesCount > 1 ? 's' : ''} available!`}
                      </span>
                      <div className="flex items-center space-x-1.5 flex-shrink-0">
                        {outdatedCasesCount > 0 && onSyncEditedCasesToCycle && canCreateCycle && (
                          <button
                            onClick={() => onSyncEditedCasesToCycle(cycle.id)}
                            className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-[11px] shadow-sm transition-all flex items-center active:scale-95"
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Sync {outdatedCasesCount} Cases
                          </button>
                        )}
                        {newUnassignedCasesCount > 0 && canCreateCycle && (
                          <button
                            onClick={() => setTargetCycleForAddModal(cycle)}
                            className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] shadow-sm transition-all"
                          >
                            + Add New Cases
                          </button>
                        )}
                        {onToggleIgnoreSync && (
                          <button
                            onClick={() => onToggleIgnoreSync(cycle.id)}
                            className="px-2 py-1 rounded-xl bg-amber-200/60 hover:bg-amber-200 text-amber-900 font-bold text-[11px] transition-all"
                            title="Ignore sync warnings for this execution cycle"
                          >
                            ✕ Ignore
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {cycle.ignoredSync && (outdatedCasesCount > 0 || newUnassignedCasesCount > 0) && (
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium italic">
                        Sync notice ignored for this cycle ({outdatedCasesCount || newUnassignedCasesCount} updates available)
                      </span>
                      {onToggleIgnoreSync && (
                        <button
                          onClick={() => onToggleIgnoreSync(cycle.id)}
                          className="text-indigo-600 hover:text-indigo-800 font-bold"
                        >
                          Re-enable Sync
                        </button>
                      )}
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800 font-extrabold">Execution Progress</span>
                      <div className="flex items-center space-x-1.5 text-[11px]">
                        <span className="text-slate-600 font-mono">{execPercent}% Executed</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-emerald-600 font-mono">{passPercent}% Passed</span>
                        {failPercent > 0 && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-rose-600 font-mono">{failPercent}% Failed</span>
                          </>
                        )}
                        {blockPercent > 0 && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-amber-600 font-mono">{blockPercent}% Blocked</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex shadow-inner border border-slate-200/80 p-0.5" title={`Passed: ${passed} | Failed: ${failed} | Blocked: ${blocked} | Unexecuted: ${unexec}`}>
                      <div style={{ width: `${total > 0 ? (passed / total) * 100 : 0}%` }} className="bg-emerald-500 h-full transition-all rounded-l-full" title={`Passed: ${passed} (${passPercent}%)`} />
                      <div style={{ width: `${total > 0 ? (failed / total) * 100 : 0}%` }} className="bg-rose-500 h-full transition-all" title={`Failed: ${failed} (${failPercent}%)`} />
                      <div style={{ width: `${total > 0 ? (blocked / total) * 100 : 0}%` }} className="bg-amber-500 h-full transition-all" title={`Blocked: ${blocked} (${blockPercent}%)`} />
                      <div style={{ width: `${total > 0 ? (unexec / total) * 100 : 0}%` }} className="bg-slate-200 h-full transition-all rounded-r-full" title={`Unexecuted: ${unexec}`} />
                    </div>
                  </div>

                  {/* Stat Counters */}
                  <div className="grid grid-cols-4 gap-2 text-center text-xs pt-1 font-mono font-bold">
                    <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200 text-emerald-800">
                      <span className="block text-[10px] text-emerald-600">Passed</span>
                      {passed}
                    </div>
                    <div className="bg-rose-50 p-2 rounded-xl border border-rose-200 text-rose-800">
                      <span className="block text-[10px] text-rose-600">Failed</span>
                      {failed}
                    </div>
                    <div className="bg-amber-50 p-2 rounded-xl border border-amber-200 text-amber-800">
                      <span className="block text-[10px] text-amber-600">Blocked</span>
                      {blocked}
                    </div>
                    <div className="bg-slate-100 p-2 rounded-xl border border-slate-200 text-slate-700">
                      <span className="block text-[10px] text-slate-500">Total</span>
                      {total}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1">
                    {canCreateCycle && (
                      <button
                        onClick={() => setTargetCycleForAddModal(cycle)}
                        className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                        Add / Sync Cases
                      </button>
                    )}
                    {canCreateCycle && onDeleteCycle && (
                      <button
                        onClick={() => setDeletingCycle(cycle)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                        title="Delete Cycle"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => onSelectCycleToExecute(cycle.id)}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all active:scale-95 ml-auto"
                  >
                    <PlaySquare className="w-3.5 h-3.5 mr-1.5" />
                    Open Live Execution Board
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Add Cases Modal */}
      {targetCycleForAddModal && (
        <AddCasesToCycleModal
          cycle={targetCycleForAddModal}
          availableCases={allAvailableCases}
          onAddCasesToCycle={onAddCasesToCycle}
          onClose={() => setTargetCycleForAddModal(null)}
        />
      )}

      {/* Delete Cycle Confirmation Modal */}
      {deletingCycle && (
        <ConfirmModal
          isOpen={true}
          type="danger"
          title={`Delete Execution Cycle — ${deletingCycle.name}`}
          message={`Are you sure you want to delete execution cycle "${deletingCycle.name}"? This will also wipe its telemetry and logged defects from the dashboard.`}
          confirmText="Yes, Delete Cycle"
          cancelText="Cancel"
          onConfirm={() => {
            if (onDeleteCycle) onDeleteCycle(deletingCycle.id);
            setDeletingCycle(null);
          }}
          onCancel={() => setDeletingCycle(null)}
        />
      )}

    </div>
  );
};
