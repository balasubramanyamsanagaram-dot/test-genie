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
  onSyncEditedCasesToCycle
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [targetCycleForAddModal, setTargetCycleForAddModal] = useState<TestCycle | null>(null);
  const [deletingCycle, setDeletingCycle] = useState<TestCycle | null>(null);

  // Form State
  const [cycleName, setCycleName] = useState(`Sprint 24 — ${moduleName} Execution`);
  const [version, setVersion] = useState('v2.4.0');
  const [environment, setEnvironment] = useState<'Staging' | 'Production' | 'UAT' | 'QA-Dev'>('Staging');
  const [assignedTester, setAssignedTester] = useState(currentUser.name);

  // Selected Test Cases State
  const [selectedCaseKeys, setSelectedCaseKeys] = useState<string[]>([]);

  const canCreateCycle = currentUser.role === 'Admin' || currentUser.role === 'QA Lead' || currentUser.role === 'QA Engineer';

  // Combine all test cases across all modules into one pool mapped by module ID
  const allAvailableCases: TestCase[] = React.useMemo(() => {
    return Object.values(allModuleCasesMap).flat();
  }, [allModuleCasesMap]);

  // Handle Select All toggle
  const handleSelectAllToggle = () => {
    if (selectedCaseKeys.length === currentModuleCases.length) {
      setSelectedCaseKeys([]);
    } else {
      setSelectedCaseKeys(currentModuleCases.map(c => c.key));
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

    const cycleItems: TestCycleItem[] = currentModuleCases
      .filter(c => selectedCaseKeys.includes(c.key))
      .map(c => ({
        id: `item-${c.key}-${Date.now()}`,
        testCase: c,
        executionStatus: 'UNEXECUTED',
        assignedTo: assignedTester
      }));

    const newCycle: TestCycle = {
      id: `cycle-${Date.now().toString().slice(-4)}`,
      name: cycleName.trim(),
      version: version.trim(),
      environment,
      moduleName,
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
          <p className="text-xs text-slate-500">
            Group test cases into release runs, assign QA testers, and sync newly uploaded test cases live.
          </p>
        </div>

        {canCreateCycle && (
          <button
            onClick={() => {
              setSelectedCaseKeys(currentModuleCases.map(c => c.key));
              setIsCreating(true);
            }}
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
            <h3 className="text-base font-extrabold text-slate-900">Configure New Test Cycle Run</h3>
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

          {/* Test Case Selection Table */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">
                Select Scenarios to Include ({selectedCaseKeys.length} of {currentModuleCases.length} Selected)
              </span>
              <button
                type="button"
                onClick={handleSelectAllToggle}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
              >
                {selectedCaseKeys.length === currentModuleCases.length ? 'Deselect All' : 'Select All Scenarios'}
              </button>
            </div>

            <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100 bg-slate-50/50">
              {currentModuleCases.map(tc => {
                const isSelected = selectedCaseKeys.includes(tc.key);
                return (
                  <label key={tc.key} className="flex items-center px-4 py-2.5 hover:bg-white transition-colors cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleCase(tc.key)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="font-mono font-bold text-indigo-700 ml-3 mr-4 w-24 flex-shrink-0">{tc.key}</span>
                    <span className="font-bold text-slate-900 flex-1 truncate">{tc.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      tc.type === 'Positive' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                    }`}>
                      {tc.type}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-md"
            >
              Start Execution Cycle Run
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

            // Check if there are newly uploaded cases in the repository NOT in this cycle
            const existingCycleKeys = new Set([
              ...cycle.items.map(i => i.testCase.key?.trim().toUpperCase()).filter(Boolean),
              ...cycle.items.map(i => i.testCase.name?.trim().toLowerCase()).filter(Boolean)
            ]);

            const newUnassignedCasesCount = currentModuleCases.filter(c => 
              !existingCycleKeys.has(c.key?.trim().toUpperCase()) &&
              !existingCycleKeys.has(c.name?.trim().toLowerCase())
            ).length;

            // Check if any test cases in this cycle have been edited in the master repository
            const masterCaseMap = new Map((currentModuleCases || []).map(c => [c.key?.trim().toUpperCase(), c]));
            const outdatedCasesCount = cycle.items.filter(item => {
              const keyUpper = item.testCase.key?.trim().toUpperCase();
              if (!keyUpper) return false;
              const master = masterCaseMap.get(keyUpper);
              if (!master) return false;
              return (
                master.name !== item.testCase.name ||
                master.testSteps !== item.testCase.testSteps ||
                master.expectedResult !== item.testCase.expectedResult ||
                master.objective !== item.testCase.objective ||
                master.precondition !== item.testCase.precondition
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

                  {/* New Uploaded Cases Available Badge Alert */}
                  {newUnassignedCasesCount > 0 && (
                    <div className="bg-indigo-50 p-2.5 rounded-2xl border border-indigo-200 flex items-center justify-between text-xs">
                      <span className="text-indigo-900 font-bold flex items-center">
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-indigo-600 animate-spin-slow" />
                        {newUnassignedCasesCount} newly uploaded test cases available in repository!
                      </span>
                      {canCreateCycle && (
                        <button
                          onClick={() => setTargetCycleForAddModal(cycle)}
                          className="px-2.5 py-1 rounded-xl bg-indigo-600 text-white font-extrabold text-[11px] shadow-sm hover:bg-indigo-700 transition-all"
                        >
                          + Sync to Cycle
                        </button>
                      )}
                    </div>
                  )}

                  {/* Edited Cases Available for Sync Alert */}
                  {outdatedCasesCount > 0 && (
                    <div className="bg-amber-50 p-2.5 rounded-2xl border border-amber-200 flex items-center justify-between text-xs">
                      <span className="text-amber-900 font-bold flex items-center">
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-amber-600 animate-spin-slow" />
                        {outdatedCasesCount} edited test case{outdatedCasesCount > 1 ? 's' : ''} ready to sync!
                      </span>
                      {canCreateCycle && onSyncEditedCasesToCycle && (
                        <button
                          onClick={() => onSyncEditedCasesToCycle(cycle.id)}
                          className="px-2.5 py-1 rounded-xl bg-amber-600 text-white font-extrabold text-[11px] shadow-sm hover:bg-amber-700 transition-all flex items-center active:scale-95"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Sync Edited Cases
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
