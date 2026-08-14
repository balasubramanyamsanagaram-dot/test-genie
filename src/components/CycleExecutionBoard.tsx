import React, { useState } from 'react';
import { TestCycle, TestExecutionStatus, JiraBug, UserProfile } from '../types';
import { CheckCircle2, XCircle, AlertTriangle, Clock, MessageSquare, Bug, Download, ArrowLeft, User, Calendar, ExternalLink, ShieldCheck, RefreshCw, Camera, Video, X, Lock, Eye, Monitor, Server, Plus } from 'lucide-react';
import { calculateCycleReport, generateCycleCSVReport, generateCycleMarkdownReport } from '../engine/cycle-report-exporter';
import { JiraBugModal } from './JiraBugModal';

import { TestCase } from '../types';
import { AddCasesToCycleModal } from './AddCasesToCycleModal';

interface CycleExecutionBoardProps {
  cycle: TestCycle;
  currentUser: UserProfile;
  allAvailableCases?: TestCase[];
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
  onBackToCycles: () => void;
}

export const CycleExecutionBoard: React.FC<CycleExecutionBoardProps> = ({
  cycle,
  currentUser,
  allAvailableCases = [],
  onUpdateStatus,
  onAddCasesToCycle,
  onReopenBug,
  onRequestPassEvidence,
  onBackToCycles
}) => {
  const [selectedItemKey, setSelectedItemKey] = useState<string>(cycle.items[0]?.testCase.key || '');
  const [isBugModalOpen, setIsBugModalOpen] = useState<boolean>(false);
  const [isAddCasesModalOpen, setIsAddCasesModalOpen] = useState<boolean>(false);

  // Lightbox Media Viewer State
  const [activeMediaUrl, setActiveMediaUrl] = useState<{ url: string; type: 'image' | 'video' } | null>(null);

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
            <span>Cycle Test Cases ({cycle.items.length})</span>
            <span className="text-[10px] text-slate-400 font-mono">Assigned & Executed</span>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto flex-1 p-2 space-y-1">
            {cycle.items.map(item => {
              const isSelected = item.testCase.key === selectedItemKey;
              const bugsCount = (item.jiraBugs || (item.jiraBug ? [item.jiraBug] : [])).length;
              
              return (
                <button
                  key={item.testCase.key}
                  onClick={() => setSelectedItemKey(item.testCase.key)}
                  className={`w-full text-left p-3 rounded-xl transition-all ${
                    isSelected
                      ? 'bg-indigo-50 border border-indigo-200 shadow-sm'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-indigo-700">
                      {item.testCase.key}
                    </span>

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
                </button>
              );
            })}
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
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">{activeItem.testCase.name}</h4>
                <p className="text-slate-600 leading-relaxed">{activeItem.testCase.objective}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700 block mb-1">Precondition</span>
                <span className="text-slate-600 font-mono">{activeItem.testCase.precondition}</span>
              </div>

              {/* Numbered 4-Step Instructions */}
              <div>
                <span className="font-bold text-slate-900 block mb-2">Numbered 4-Step Instructions</span>
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

                        <div className="text-[11px] text-slate-600 space-y-1 bg-white/70 p-2.5 rounded-xl border border-slate-200">
                          <div>
                            Severity: <strong className="text-slate-800">{bug.severity}</strong> | Dev: <strong className="text-indigo-700">{bug.assignedDeveloper}</strong> | Raised by: <strong className="text-slate-800">{bug.raisedBy}</strong> at {bug.raisedAt}
                          </div>
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

    </div>
  );
};
