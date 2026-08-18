import React, { useState } from 'react';
import { TestCycle, TestExecutionStatus, JiraBug, UserProfile, TestCase, AgentExecutionRun } from '../types';
import { CheckCircle2, XCircle, AlertTriangle, Clock, MessageSquare, Bug, Download, ArrowLeft, User, Calendar, ExternalLink, ShieldCheck, RefreshCw, Camera, Video, X, Lock, Eye, Monitor, Server, Plus, Edit3, Trash2, Code2, Play, Bot, Sparkles, Terminal, Layers, Search } from 'lucide-react';
import { calculateCycleReport, generateCycleCSVReport, generateCycleMarkdownReport } from '../engine/cycle-report-exporter';
import { JiraBugModal } from './JiraBugModal';
import { AddCasesToCycleModal } from './AddCasesToCycleModal';
import { EditTestCaseModal } from './EditTestCaseModal';
import { BulkEditCasesModal } from './BulkEditCasesModal';
import { ConfirmModal } from './ConfirmModal';

interface CycleExecutionBoardProps {
  cycle: TestCycle;
  currentUser: UserProfile;
  allAvailableCases?: TestCase[];
  isHydrated?: boolean;
  onUpdateStatus: (
    cycleId: string,
    itemKey: string,
    status: TestExecutionStatus,
    jiraBug?: JiraBug,
    bugNotes?: string,
    defectId?: string
  ) => void;
  onAddCasesToCycle?: (cycleId: string, newCases: TestCase[]) => void;
  onReopenBug?: (itemKey: string, bugKey: string, notes: string, screenshotUrl?: string, videoUrl?: string) => void;
  onRequestPassEvidence?: (cycleId: string, itemKey: string, itemTitle: string) => void;
  onSaveTestCase?: (updatedCase: TestCase) => void;
  onDeleteCycleItem?: (cycleId: string, itemKey: string) => void;
  onBulkEditCycleItems?: (cycleId: string, itemKeys: string[], updates: { priority?: string; type?: string; status?: string }) => void;
  onBulkDeleteCycleItems?: (cycleId: string, itemKeys: string[]) => void;
  onSyncEditedCasesToCycle?: (cycleId: string) => void;
  onViewCodeSpec?: (testCase: TestCase) => void;
  onAutomateTestCase?: (testCase: TestCase) => void;
  onOpenAgentConsoleTrace?: (testCase: TestCase, status?: TestExecutionStatus, screenshotUrl?: string, stepRuns?: any[]) => void;
  onBackToCycles: () => void;
}

export const CycleExecutionBoard: React.FC<CycleExecutionBoardProps> = ({
  cycle,
  currentUser,
  allAvailableCases = [],
  isHydrated = false,
  onUpdateStatus,
  onAddCasesToCycle,
  onReopenBug,
  onRequestPassEvidence,
  onSaveTestCase,
  onDeleteCycleItem,
  onBulkEditCycleItems,
  onBulkDeleteCycleItems,
  onSyncEditedCasesToCycle,
  onViewCodeSpec,
  onAutomateTestCase,
  onOpenAgentConsoleTrace,
  onBackToCycles
}) => {
  const [selectedItemKey, setSelectedItemKey] = useState<string>(cycle.items[0]?.testCase.key || '');
  const [selectedItemKeys, setSelectedItemKeys] = useState<string[]>([]);
  const [isBugModalOpen, setIsBugModalOpen] = useState<boolean>(false);
  const [isAddCasesModalOpen, setIsAddCasesModalOpen] = useState<boolean>(false);

  // Edit & Delete In-App Modal States
  const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);
  const [deletingItemKey, setDeletingItemKey] = useState<string | null>(null);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState<boolean>(false);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState<boolean>(false);

  // Search & Filtering State
  const [searchTerm, setSearchTerm] = useState('');

  // Lightbox Media Viewer State
  const [activeMediaUrl, setActiveMediaUrl] = useState<{ url: string; type: 'image' | 'video' } | null>(null);

  const filteredItems = cycle.items.filter(item => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      item.testCase.key.toLowerCase().includes(q) ||
      item.testCase.name.toLowerCase().includes(q) ||
      (item.testCase.testSteps || '').toLowerCase().includes(q) ||
      item.executionStatus.toLowerCase().includes(q)
    );
  });

  const masterCaseMap = new Map((allAvailableCases || []).map(c => [c.key?.trim().toUpperCase(), c]));
  const outdatedCasesCount = (!isHydrated || !allAvailableCases || allAvailableCases.length === 0) ? 0 : cycle.items.filter(item => {
    const keyUpper = item.testCase.key?.trim().toUpperCase();
    if (!keyUpper) return false;
    const master = masterCaseMap.get(keyUpper);
    if (!master) return false;

    const norm = (str?: string) => (str || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
    
    const isDifferent = (
      norm(master.name) !== norm(item.testCase.name) ||
      norm(master.testSteps) !== norm(item.testCase.testSteps) ||
      norm(master.expectedResult) !== norm(item.testCase.expectedResult) ||
      norm(master.objective) !== norm(item.testCase.objective) ||
      norm(master.precondition) !== norm(item.testCase.precondition)
    );

    return isDifferent;
  }).length;

  const report = calculateCycleReport(cycle);
  const activeItem = cycle.items.find(i => i.testCase.key === selectedItemKey) || cycle.items[0];

  const allItemBugs: JiraBug[] = activeItem ? (activeItem.jiraBugs || (activeItem.jiraBug ? [activeItem.jiraBug] : [])) : [];

  // Permission Checks based on Role Specification
  const canExecuteTests = currentUser.role === 'QA Engineer' || currentUser.role === 'QA Lead' || currentUser.role === 'Admin';
  const canRaiseDefects = currentUser.role === 'QA Engineer' || currentUser.role === 'QA Lead' || currentUser.role === 'Admin';
  const isDeveloperViewOnly = currentUser.role === 'Developer';
  const isAuditorViewOnly = currentUser.role === 'Auditor' || currentUser.role === 'Viewer';

  const handleStatusChange = (status: TestExecutionStatus) => {
    if (!canExecuteTests) {
      if (isDeveloperViewOnly) {
        alert('Developer Role Notice: Developers have read-only access to view test failures and inspect attached visual evidence proof. Status updates require a QA Engineer, QA Lead, or Admin role.');
      } else {
        alert('Auditor Read-Only Notice: Auditors have read-only access. Status updates require a QA Engineer or QA Lead role.');
      }
      return;
    }

    if (!activeItem) return;

    // Requirement 3: Mandatory Evidence Proof Upload on PASSED manual action!
    if (status === 'PASSED' && onRequestPassEvidence) {
      onRequestPassEvidence(cycle.id, activeItem.testCase.key, activeItem.testCase.name);
      return;
    }

    // Mandatory Bug Modal on FAILED
    if (status === 'FAILED') {
      setIsBugModalOpen(true);
      return;
    }

    // Preserve existing Jira Bug details when re-testing to PASSED or BLOCKED!
    onUpdateStatus(
      cycle.id,
      activeItem.testCase.key,
      status,
      activeItem.jiraBug ? { ...activeItem.jiraBug, status: status === 'PASSED' ? 'Resolved' : activeItem.jiraBug.status } : undefined,
      activeItem.bugNotes,
      activeItem.defectId
    );
  };

  const handleSaveJiraBug = (jiraBug: JiraBug) => {
    if (!activeItem) return;

    onUpdateStatus(
      cycle.id,
      activeItem.testCase.key,
      'FAILED',
      jiraBug,
      jiraBug.summary,
      jiraBug.issueKey
    );
    setIsBugModalOpen(false);
  };

  const handleReopenBug = (bugKey: string, notes: string, screenshotUrl?: string, videoUrl?: string) => {
    if (!activeItem || !onReopenBug) return;
    onReopenBug(activeItem.testCase.key, bugKey, notes, screenshotUrl, videoUrl);
    setIsBugModalOpen(false);
  };

  // Download Report Handlers
  const handleDownloadCSV = () => {
    const csvContent = generateCycleCSVReport(cycle);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${cycle.name.replace(/[^a-zA-Z0-9]/g, '_')}_Execution_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadMarkdown = () => {
    const mdContent = generateCycleMarkdownReport(cycle);
    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${cycle.name.replace(/[^a-zA-Z0-9]/g, '_')}_Audit_Report.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Metrics Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBackToCycles}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                  {cycle.id}
                </span>
                <h2 className="text-xl font-extrabold text-slate-900">{cycle.name}</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Target Module: <strong className="text-slate-800">{cycle.moduleName}</strong> | Assigned Lead: <strong className="text-indigo-700">{cycle.assignedTester}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {outdatedCasesCount > 0 && onSyncEditedCasesToCycle && canExecuteTests && (
              <button
                onClick={() => onSyncEditedCasesToCycle(cycle.id)}
                className="inline-flex items-center px-3.5 py-2.5 rounded-xl text-xs font-extrabold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm transition-all active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin-slow" />
                Sync {outdatedCasesCount} Edited Case{outdatedCasesCount > 1 ? 's' : ''}
              </button>
            )}

            {canExecuteTests && onAddCasesToCycle && (
              <button
                onClick={() => setIsAddCasesModalOpen(true)}
                className="inline-flex items-center px-3.5 py-2.5 rounded-xl text-xs font-extrabold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-sm transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                Add / Sync Cases
              </button>
            )}

            <button
              onClick={handleDownloadCSV}
              className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-extrabold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Download CSV Report
            </button>
            <button
              onClick={handleDownloadMarkdown}
              className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Download Markdown Audit
            </button>
          </div>
        </div>

        {/* Live Execution Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] text-slate-500 font-medium block">Total Cases</span>
            <span className="text-xl font-black text-slate-900">{report.totalCases}</span>
          </div>

          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-center">
            <span className="text-[10px] text-emerald-700 font-medium block">PASSED ✅</span>
            <span className="text-xl font-black text-emerald-700">{report.passedCount} ({report.passRatePercentage}%)</span>
          </div>

          <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-center">
            <span className="text-[10px] text-rose-700 font-medium block">FAILED 🛑</span>
            <span className="text-xl font-black text-rose-700">{report.failedCount}</span>
          </div>

          <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-center">
            <span className="text-[10px] text-amber-700 font-medium block">BLOCKED ⚠️</span>
            <span className="text-xl font-black text-amber-700">{report.blockedCount}</span>
          </div>

          <div className="bg-slate-100 p-3 rounded-xl border border-slate-300 text-center">
            <span className="text-[10px] text-slate-600 font-medium block">UNEXECUTED ⏳</span>
            <span className="text-xl font-black text-slate-700">{report.unexecutedCount}</span>
          </div>
        </div>
      </div>

      {/* Main Execution Workspace (List + Details Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Test Cases List (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col max-h-[700px]">
          <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filteredItems.length > 0 && filteredItems.every(i => selectedItemKeys.includes(i.testCase.key))}
                onChange={() => {
                  const filteredKeys = filteredItems.map(i => i.testCase.key);
                  const isAllSelected = filteredKeys.every(k => selectedItemKeys.includes(k));
                  if (isAllSelected) {
                    setSelectedItemKeys(prev => prev.filter(k => !filteredKeys.includes(k)));
                  } else {
                    setSelectedItemKeys(prev => Array.from(new Set([...prev, ...filteredKeys])));
                  }
                }}
                className="w-3.5 h-3.5 text-indigo-600 rounded cursor-pointer"
              />
              <span>Cycle Test Cases ({filteredItems.length !== cycle.items.length ? `${filteredItems.length}/${cycle.items.length}` : cycle.items.length})</span>
            </div>
            {selectedItemKeys.length > 0 ? (
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setIsBulkEditOpen(true)}
                  className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold shadow-2xs flex items-center"
                >
                  <Layers className="w-3 h-3 mr-1" />
                  Edit ({selectedItemKeys.length})
                </button>
                <button
                  onClick={() => setIsBulkDeleteConfirmOpen(true)}
                  className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold shadow-2xs flex items-center"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete ({selectedItemKeys.length})
                </button>
              </div>
            ) : (
              <span className="text-[10px] text-slate-400 font-mono">Assigned & Executed</span>
            )}
          </div>

          {/* Search Box */}
          <div className="p-2 bg-slate-50/50 border-b border-slate-200">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by TC - ID, Manual Test Cases, or Test Steps..."
                className="w-full bg-white text-slate-800 text-xs rounded-xl pl-8 pr-7 py-1.5 border border-slate-200 focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-400 shadow-2xs"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto flex-1 p-2 space-y-1">
            {filteredItems.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No test cases matched "{searchTerm}".
              </div>
            ) : (
              filteredItems.map(item => {
              const isSelected = item.testCase.key === selectedItemKey;
              const isChecked = selectedItemKeys.includes(item.testCase.key);
              const bugsCount = (item.jiraBugs || (item.jiraBug ? [item.jiraBug] : [])).length;
              
              return (
                <div
                  key={item.testCase.key}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start space-x-2 ${
                    isSelected
                      ? 'bg-indigo-50 border border-indigo-200 shadow-2xs'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      e.stopPropagation();
                      setSelectedItemKeys(prev => 
                        prev.includes(item.testCase.key)
                          ? prev.filter(k => k !== item.testCase.key)
                          : [...prev, item.testCase.key]
                      );
                    }}
                    className="w-3.5 h-3.5 text-indigo-600 rounded cursor-pointer mt-1 flex-shrink-0"
                  />

                  <div 
                    onClick={() => setSelectedItemKey(item.testCase.key)}
                    className="flex-1 cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-1">
                        <span className="font-mono text-xs font-bold text-indigo-700">
                          {item.testCase.key}
                        </span>
                        {canExecuteTests && (
                          <div className="inline-flex items-center space-x-0.5 ml-1">
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTestCase(item.testCase);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                              title="Edit Test Case"
                            >
                              <Edit3 className="w-3 h-3" />
                            </span>
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingItemKey(item.testCase.key);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                              title="Delete Test Case from Cycle"
                            >
                              <Trash2 className="w-3 h-3" />
                            </span>
                          </div>
                        )}
                      </div>

                       <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border transition-all ${
                          item.executionStatus === 'PASSED'
                            ? 'bg-emerald-100/60 text-emerald-800 border-emerald-300/80 glow-passed'
                            : item.executionStatus === 'FAILED'
                            ? 'bg-rose-100/60 text-rose-800 border-rose-300/80 glow-failed'
                            : item.executionStatus === 'BLOCKED'
                            ? 'bg-amber-100/60 text-amber-800 border-amber-300/80 glow-blocked'
                            : 'bg-slate-100/60 text-slate-600 border-slate-300/80 glow-unexecuted'
                        }`}
                      >
                        {item.executionStatus}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-900 line-clamp-1">
                      {item.testCase.name}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 pt-1 border-t border-slate-100">
                      <span>Assigned: {item.assignedTo || item.testCase.assignedTo || 'Unassigned'}</span>
                      {bugsCount > 0 && (
                        <span className="font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          {bugsCount} Jira Bug{bugsCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            }))}
          </div>
        </div>

        {/* Right Side: Active Test Step & Execution Form (8 Cols) */}
        {activeItem && (
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            
            {/* Status Marking Action Bar */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                    {activeItem.testCase.key}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    Role: <strong className="text-indigo-700">{currentUser.role}</strong>
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">
                  Mark Execution Status
                </h3>
              </div>

              {/* Status Action Buttons with RBAC Guarding */}
              <div className="flex items-center space-x-2">
                {!canExecuteTests ? (
                  <div className="bg-amber-50 text-amber-900 px-3 py-2 rounded-xl border border-amber-200 text-xs font-medium inline-flex items-center">
                    <Lock className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                    <span>{isDeveloperViewOnly ? 'Developer View Only (Evidence Inspection)' : 'Auditor Read-Only Mode'}</span>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleStatusChange('PASSED')}
                      className={`inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 active:scale-95 ${
                        activeItem.executionStatus === 'PASSED'
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20 glow-passed'
                          : 'bg-emerald-50/70 text-emerald-700 border border-emerald-300 hover:bg-emerald-100/80'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                      PASSED ✅
                    </button>

                    <button
                      onClick={() => handleStatusChange('FAILED')}
                      className={`inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 active:scale-95 ${
                        activeItem.executionStatus === 'FAILED'
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20 glow-failed'
                          : 'bg-rose-50/70 text-rose-700 border border-rose-300 hover:bg-rose-100/80'
                      }`}
                    >
                      <XCircle className="w-4 h-4 mr-1.5" />
                      FAILED 🛑 (Raise / Re-open Bug)
                    </button>

                    <button
                      onClick={() => handleStatusChange('BLOCKED')}
                      className={`inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 active:scale-95 ${
                        activeItem.executionStatus === 'BLOCKED'
                          ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20 glow-blocked'
                          : 'bg-amber-50/70 text-amber-700 border border-amber-300 hover:bg-amber-100/80'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4 mr-1.5" />
                      BLOCKED ⚠️
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Execution Audit & User Attribution Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
              <div>
                <span className="text-[10px] text-slate-500 font-medium block">Author (Added By)</span>
                <span className="font-bold text-slate-800">{activeItem.testCase.createdBy || 'Suresh QA Lead'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-medium block">Assigned Tester</span>
                <span className="font-bold text-indigo-700">{activeItem.assignedTo || activeItem.testCase.assignedTo || cycle.assignedTester}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-medium block">Logged User</span>
                <span className="font-bold text-slate-800">{currentUser.name} ({currentUser.role})</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-medium block">Execution Timestamp</span>
                <span className="font-mono text-slate-700">{activeItem.executedAt || 'Not Executed Yet'}</span>
              </div>
            </div>

            {/* Test Case Details */}
            <div className="space-y-4 text-xs">
              
              {/* Executive Scenario Header Card */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                
                {/* Top Row: Meta Badges + Actions Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="font-mono text-xs font-extrabold text-indigo-700 bg-indigo-100/90 px-3 py-1 rounded-xl border border-indigo-200 shadow-2xs whitespace-nowrap">
                      {activeItem.testCase.key}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-xl border whitespace-nowrap ${
                      activeItem.testCase.type === 'Positive' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'
                    }`}>
                      {activeItem.testCase.type}
                    </span>
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-200/70 px-2.5 py-1 rounded-xl border border-slate-300/60 whitespace-nowrap">
                      Priority: {activeItem.testCase.priority || 'High'}
                    </span>
                  </div>

                  {/* Right Action Toolbar */}
                  <div className="flex flex-wrap items-center gap-2">
                    {onAutomateTestCase && (
                      <button
                        onClick={() => onAutomateTestCase(activeItem.testCase)}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 font-mono font-extrabold text-[11px] border border-indigo-300 shadow-2xs flex items-center transition-all active:scale-95 hover:border-indigo-400"
                        title="Run No-Code Playwright Automation Trace"
                      >
                        <Play className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                        ▷ AUTOMATE
                      </button>
                    )}

                    {canExecuteTests && (
                      <>
                        <button
                          onClick={() => setEditingTestCase(activeItem.testCase)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] shadow-md shadow-indigo-600/20 flex items-center transition-all active:scale-95"
                        >
                          <Edit3 className="w-3.5 h-3.5 mr-1" />
                          Edit Case
                        </button>
                        <button
                          onClick={() => setDeletingItemKey(activeItem.testCase.key)}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-[11px] border border-rose-200 flex items-center transition-all active:scale-95"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1 text-rose-600" />
                          Delete Case
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Scenario Title Header */}
                <h3 className="text-base font-black text-slate-900 leading-snug tracking-tight">
                  {activeItem.testCase.name}
                </h3>

                {/* Scenario Objective Description */}
                {activeItem.testCase.objective && (
                  <p className="text-xs text-slate-600 font-medium leading-relaxed bg-white/80 p-3 rounded-xl border border-slate-200/80">
                    <strong className="text-slate-800">Objective: </strong>
                    {activeItem.testCase.objective}
                  </p>
                )}
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700 block mb-1">Precondition</span>
                <span className="text-slate-600 font-mono">{activeItem.testCase.precondition}</span>
              </div>

              {/* Test Steps */}
              <div>
                <span className="font-bold text-slate-900 block mb-2">Test Steps</span>
                <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-[11px] whitespace-pre-line leading-relaxed shadow-inner">
                  {activeItem.testCase.testSteps}
                </div>
              </div>

              {/* Expected Result */}
              <div>
                <span className="font-bold text-slate-900 block mb-1">Expected Result</span>
                <div className="bg-emerald-50 text-emerald-900 p-3 rounded-xl border border-emerald-200 font-medium">
                  {activeItem.testCase.expectedResult}
                </div>
              </div>

              {/* BrowserAutomationAgent Execution Run Audit History (With Date, Time, Screenshots & Logs) */}
              {((activeItem.executionHistory && activeItem.executionHistory.length > 0) || activeItem.evidenceScreenshotUrl || activeItem.evidenceVideoUrl || (activeItem.attachments && activeItem.attachments.length > 0)) && (
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-slate-900 flex items-center text-xs">
                      <Bot className="w-4 h-4 text-indigo-600 mr-1.5" />
                      BrowserAutomationAgent Execution Audit & Evidence History ({ activeItem.executionHistory?.length || (activeItem.attachments || []).length || 1 } Runs)
                    </h4>
                    <span className="font-mono text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      BrowserAutomationAgent@{activeItem.testCase.key}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {(activeItem.executionHistory && activeItem.executionHistory.length > 0) ? (
                      activeItem.executionHistory.map((run, rIdx) => (
                        <div
                          key={run.id}
                          className={`p-4 rounded-2xl border transition-all space-y-3 ${
                            run.executionStatus === 'PASSED'
                              ? 'bg-emerald-50/50 border-emerald-200/80 hover:bg-emerald-50'
                              : run.executionStatus === 'FAILED'
                              ? 'bg-rose-50/50 border-rose-200/80 hover:bg-rose-50'
                              : 'bg-amber-50/50 border-amber-200/80 hover:bg-amber-50'
                          }`}
                        >
                          {/* Top Run Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-extrabold text-xs text-indigo-700 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs">
                                {run.agentName || `BrowserAutomationAgent@${activeItem.testCase.key}`}
                              </span>

                              <span className={`text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-full border ${
                                run.executionStatus === 'PASSED'
                                  ? 'bg-emerald-600 text-white border-emerald-700'
                                  : run.executionStatus === 'FAILED'
                                  ? 'bg-rose-600 text-white border-rose-700'
                                  : 'bg-amber-600 text-white border-amber-700'
                              }`}>
                                {run.executionStatus === 'PASSED' ? 'PASSED ✅' : run.executionStatus === 'FAILED' ? 'FAILED 🛑' : 'BLOCKED ⚠️'}
                              </span>

                              <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                {run.executionType === 'Automated' ? '⚡ Playwright Engine' : '👤 Manual Run'}
                              </span>
                            </div>

                            <div className="text-[11px] font-mono text-slate-500">
                              <span>📅 {run.executedAt || new Date().toLocaleString()}</span>
                            </div>
                          </div>

                          {/* Summary Log & Attributions */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                            <div className="space-y-1">
                              <p className="text-slate-700 font-medium leading-relaxed">
                                {run.summaryLog}
                              </p>
                              <div className="flex items-center space-x-3 text-[10px] text-slate-500">
                                <span>Executed By: <strong className="text-slate-800">{run.executedBy}</strong></span>
                                {run.jiraBugKey && (
                                  <span className="font-mono font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200">
                                    Linked Defect: {run.jiraBugKey}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Evidence & Trace Console Action Buttons */}
                            <div className="flex items-center space-x-2 flex-shrink-0 pt-1 sm:pt-0">
                              <button
                                onClick={() => onOpenAgentConsoleTrace?.(activeItem.testCase, run.executionStatus, run.screenshotUrl, run.stepRuns || activeItem.stepRuns)}
                                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-xs transition-all active:scale-95 flex items-center"
                              >
                                <Terminal className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                                Inspect Agent Console Trace
                              </button>

                              {run.videoUrl && (
                                <button
                                  onClick={() => setActiveMediaUrl({ url: run.videoUrl!, type: 'video' })}
                                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-xs transition-all active:scale-95 flex items-center"
                                >
                                  <Video className="w-3.5 h-3.5 mr-1.5" />
                                  Recording
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      /* Fallback view if item has legacy attachments but no executionHistory array */
                      <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 space-y-3">
                        <div className="flex items-center justify-between border-b border-indigo-200/60 pb-2">
                          <span className="font-mono font-extrabold text-xs text-indigo-800">
                            BrowserAutomationAgent@{activeItem.testCase.key}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            Executed At: {activeItem.executedAt || new Date().toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-700 font-medium">
                            {activeItem.executionStatus} execution trace saved for future audit reference.
                          </span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => onOpenAgentConsoleTrace?.(activeItem.testCase, activeItem.executionStatus, activeItem.evidenceScreenshotUrl, activeItem.stepRuns)}
                              className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-extrabold text-xs shadow-xs flex items-center"
                            >
                              <Terminal className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                              Inspect Agent Console Trace
                            </button>
                            {activeItem.evidenceVideoUrl && (
                              <button
                                onClick={() => setActiveMediaUrl({ url: activeItem.evidenceVideoUrl!, type: 'video' })}
                                className="px-3 py-1.5 rounded-xl bg-purple-600 text-white font-extrabold text-xs shadow-xs"
                              >
                                Play Video
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Multi-Defect History List & Visual Proof Media Buttons (Fully Accessible to Developers & QA) */}
              {allItemBugs.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-slate-900 flex items-center text-xs">
                      <Bug className="w-4 h-4 text-rose-600 mr-1.5" />
                      Jira Defect History & Developer Evidence Proof ({allItemBugs.length} Defects)
                    </h4>
                  </div>

                  <div className="space-y-2">
                    {allItemBugs.map((bug, bIdx) => (
                      <div
                        key={bug.issueKey}
                        className={`border rounded-2xl p-4 space-y-2 transition-all ${
                          bug.status === 'Re-opened'
                            ? 'bg-rose-100/60 border-rose-300'
                            : bug.status === 'Resolved'
                            ? 'bg-emerald-50/80 border-emerald-200'
                            : 'bg-rose-50/80 border-rose-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-[10px] font-bold text-slate-400">#{bIdx + 1}</span>
                            <span className="font-mono font-bold text-rose-800 bg-white px-2 py-0.5 rounded border border-rose-200">
                              {bug.issueKey}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                              bug.status === 'Re-opened'
                                ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
                                : bug.status === 'Resolved'
                                ? 'bg-emerald-600 text-white border-emerald-700'
                                : 'bg-rose-200 text-rose-900 border-rose-300'
                            }`}>
                              {bug.status === 'Re-opened' ? '🔄 RE-OPENED' : bug.status === 'Resolved' ? '🟢 RESOLVED' : '🔴 OPEN'}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            {/* Visual Screenshot Evidence Button */}
                            {bug.screenshotUrl && (
                              <button
                                onClick={() => setActiveMediaUrl({ url: bug.screenshotUrl!, type: 'image' })}
                                className="inline-flex items-center text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 shadow-sm"
                              >
                                <Camera className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                                View Screenshot
                              </button>
                            )}

                            {/* Visual Video Evidence Button */}
                            {bug.videoUrl && (
                              <button
                                onClick={() => setActiveMediaUrl({ url: bug.videoUrl!, type: 'video' })}
                                className="inline-flex items-center text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-200 shadow-sm"
                              >
                                <Video className="w-3.5 h-3.5 mr-1 text-purple-600" />
                                Play Recording
                              </button>
                            )}

                            <a
                              href={bug.issueUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-sm"
                            >
                              Jira <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                          </div>
                        </div>

                        <p className="font-extrabold text-slate-900 text-xs">
                          {bug.summary}
                        </p>

                        <div className="text-[11px] text-slate-600 space-y-1.5 bg-white/70 p-2.5 rounded-xl border border-slate-200">
                          <div>
                            Severity: <strong className="text-slate-800">{bug.severity}</strong> | Dev: <strong className="text-indigo-700">{bug.assignedDeveloper}</strong> | Raised by: <strong className="text-slate-800">{bug.raisedBy}</strong> at {bug.raisedAt}
                          </div>
                          {bug.lastUpdatedBy && (
                            <div className="text-[10px] font-bold text-indigo-700 bg-indigo-50/80 px-2.5 py-1 rounded-lg border border-indigo-200 flex items-center justify-between">
                              <span>⚡ Last Jira Action: {bug.lastActionDescription || `Updated by ${bug.lastUpdatedBy}`}</span>
                              <span className="font-mono text-slate-500">{bug.lastUpdatedAt ? new Date(bug.lastUpdatedAt).toLocaleTimeString() : ''}</span>
                            </div>
                          )}
                          {bug.reopenNotes && (
                            <div className="text-rose-900 font-medium bg-rose-50 p-2 rounded-lg border border-rose-200 mt-1">
                              <strong>🔄 Re-open Notes:</strong> {bug.reopenNotes}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>

      {/* Mandatory Jira Bug Creator / Re-opener Modal */}
      {isBugModalOpen && activeItem && (
        <JiraBugModal
          testCase={activeItem.testCase}
          executedBy={currentUser.name}
          existingBugs={allItemBugs}
          onSaveBug={handleSaveJiraBug}
          onReopenBug={handleReopenBug}
          onClose={() => setIsBugModalOpen(false)}
        />
      )}

      {/* Lightbox Media Evidence Viewer Modal (Full Screen Inspection for Developers & Testers) */}
      {activeMediaUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-slate-900 rounded-3xl max-w-4xl w-full border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center">
                {activeMediaUrl.type === 'image' ? <Camera className="w-4 h-4 text-indigo-400 mr-2" /> : <Video className="w-4 h-4 text-purple-400 mr-2" />}
                Defect Visual Evidence Proof (Inspected by {currentUser.name})
              </span>
              <button onClick={() => setActiveMediaUrl(null)} className="p-1 rounded-full text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex items-center justify-center bg-black/60 flex-1 overflow-hidden">
              {activeMediaUrl.type === 'image' ? (
                <img src={activeMediaUrl.url} alt="Defect Screenshot" className="max-h-[70vh] w-auto object-contain rounded-xl shadow-lg border border-slate-800" />
              ) : (
                <video src={activeMediaUrl.url} controls autoPlay className="max-h-[70vh] w-full rounded-xl shadow-lg border border-slate-800" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Cases Modal for Syncing Newly Uploaded Test Cases Live */}
      {isAddCasesModalOpen && onAddCasesToCycle && (
        <AddCasesToCycleModal
          cycle={cycle}
          availableCases={allAvailableCases}
          onAddCasesToCycle={(cId, newCases) => {
            onAddCasesToCycle(cId, newCases);
            setIsAddCasesModalOpen(false);
          }}
          onClose={() => setIsAddCasesModalOpen(false)}
        />
      )}

      {/* Edit Test Case In-App Modal */}
      {editingTestCase && (
        <EditTestCaseModal
          testCase={editingTestCase}
          onSaveTestCase={(updated) => {
            if (onSaveTestCase) onSaveTestCase(updated);
            setEditingTestCase(null);
          }}
          onClose={() => setEditingTestCase(null)}
        />
      )}

      {/* Delete Test Case In-App Confirm Modal */}
      {deletingItemKey && (
        <ConfirmModal
          isOpen={true}
          title="Delete Test Case from Execution Cycle"
          message={`Are you sure you want to remove test case ${deletingItemKey} from this execution cycle?`}
          type="danger"
          confirmText="Yes, Delete Case"
          cancelText="Cancel"
          onConfirm={() => {
            if (onDeleteCycleItem) onDeleteCycleItem(cycle.id, deletingItemKey);
            setDeletingItemKey(null);
          }}
          onCancel={() => setDeletingItemKey(null)}
        />
      )}

      {/* Bulk Edit Cases in Cycle Modal */}
      {isBulkEditOpen && (
        <BulkEditCasesModal
          selectedCount={selectedItemKeys.length}
          onClose={() => setIsBulkEditOpen(false)}
          onApplyBulkEdit={(updates) => {
            if (onBulkEditCycleItems) {
              onBulkEditCycleItems(cycle.id, selectedItemKeys, updates);
            }
            setSelectedItemKeys([]);
            setIsBulkEditOpen(false);
          }}
        />
      )}

      {/* Bulk Delete Cases from Cycle Confirm Modal */}
      {isBulkDeleteConfirmOpen && (
        <ConfirmModal
          isOpen={isBulkDeleteConfirmOpen}
          type="danger"
          title={`Remove ${selectedItemKeys.length} Test Cases from Execution Cycle`}
          message={`Are you sure you want to remove ${selectedItemKeys.length} selected test cases from this execution cycle?`}
          confirmText={`Yes, Delete ${selectedItemKeys.length} Cases`}
          onConfirm={() => {
            if (onBulkDeleteCycleItems) {
              onBulkDeleteCycleItems(cycle.id, selectedItemKeys);
            }
            setSelectedItemKeys([]);
            setIsBulkDeleteConfirmOpen(false);
          }}
          onCancel={() => setIsBulkDeleteConfirmOpen(false)}
        />
      )}

    </div>
  );
};
