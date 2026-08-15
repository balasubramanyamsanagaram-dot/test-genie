import React, { useState, useEffect } from 'react';
import { TestCycle, TestCycleItem, TestExecutionStatus, UserProfile } from '../types';
import { CheckCircle2, XCircle, AlertTriangle, ChevronLeft, ChevronRight, Zap, X, ShieldAlert } from 'lucide-react';

interface SpeedRunExecutionBoardProps {
  cycle: TestCycle;
  currentUser: UserProfile;
  onUpdateStatus: (cycleId: string, testCaseKey: string, status: TestExecutionStatus) => void;
  onClose: () => void;
}

export const SpeedRunExecutionBoard: React.FC<SpeedRunExecutionBoardProps> = ({
  cycle,
  currentUser,
  onUpdateStatus,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const items = cycle.items;
  const activeItem = items[currentIndex];

  const canExecuteTests = currentUser.role === 'Admin' || currentUser.role === 'QA Lead' || currentUser.role === 'QA Engineer';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid handling if typing in input/textarea
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        if (activeItem && canExecuteTests) {
          onUpdateStatus(cycle.id, activeItem.testCase.key, 'PASSED');
          if (currentIndex < items.length - 1) setCurrentIndex(prev => prev + 1);
        }
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        if (activeItem && canExecuteTests) {
          onUpdateStatus(cycle.id, activeItem.testCase.key, 'FAILED');
          if (currentIndex < items.length - 1) setCurrentIndex(prev => prev + 1);
        }
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        if (activeItem && canExecuteTests) {
          onUpdateStatus(cycle.id, activeItem.testCase.key, 'BLOCKED');
          if (currentIndex < items.length - 1) setCurrentIndex(prev => prev + 1);
        }
      } else if (e.key === 'j' || e.key === 'J' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentIndex < items.length - 1) setCurrentIndex(prev => prev + 1);
      } else if (e.key === 'k' || e.key === 'K' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, items, activeItem, cycle.id, canExecuteTests, onUpdateStatus, onClose]);

  if (!activeItem) return null;

  const passedCount = items.filter(i => i.executionStatus === 'PASSED').length;
  const failedCount = items.filter(i => i.executionStatus === 'FAILED').length;
  const blockedCount = items.filter(i => i.executionStatus === 'BLOCKED').length;
  const progressPercent = Math.round(((currentIndex + 1) / items.length) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col font-sans animate-fadeIn selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top SpeedRun Header Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-black text-white">SpeedRun Keyboard Execution Mode</h2>
              <span className="bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                10x Speed Mode
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Cycle: <strong className="text-slate-200">{cycle.name}</strong> ({currentIndex + 1} of {items.length})
            </p>
          </div>
        </div>

        {/* Shortcuts Bar Legend */}
        <div className="hidden lg:flex items-center space-x-4 text-xs font-mono">
          <div className="flex items-center space-x-1"><kbd className="bg-emerald-600 text-white px-2 py-1 rounded-md font-bold">P</kbd><span>Pass</span></div>
          <div className="flex items-center space-x-1"><kbd className="bg-rose-600 text-white px-2 py-1 rounded-md font-bold">F</kbd><span>Fail</span></div>
          <div className="flex items-center space-x-1"><kbd className="bg-amber-600 text-white px-2 py-1 rounded-md font-bold">B</kbd><span>Block</span></div>
          <div className="flex items-center space-x-1"><kbd className="bg-slate-800 text-slate-300 px-2 py-1 rounded-md">J / K</kbd><span>Next / Prev</span></div>
          <div className="flex items-center space-x-1"><kbd className="bg-slate-800 text-slate-300 px-2 py-1 rounded-md">ESC</kbd><span>Exit</span></div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 h-1.5">
        <div className="bg-gradient-to-r from-amber-500 to-indigo-500 h-1.5 transition-all duration-300" style={{ width: `${progressPercent}%` }} />
      </div>

      {/* Main Execution Split View */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        
        {/* Left Side: Test Case Scenarios Navigator Sidebar */}
        <div className="w-full md:w-80 bg-slate-900/60 border-r border-slate-800 p-4 overflow-y-auto space-y-2">
          <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
            Execution Queue ({items.length})
          </div>
          {items.map((item, idx) => {
            const isCurrent = idx === currentIndex;
            return (
              <div
                key={item.testCase.key}
                onClick={() => setCurrentIndex(idx)}
                className={`p-3 rounded-2xl cursor-pointer transition-all border ${
                  isCurrent
                    ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-lg'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-bold text-amber-400">{item.testCase.key}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                    item.executionStatus === 'PASSED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                    item.executionStatus === 'FAILED' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                    item.executionStatus === 'BLOCKED' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {item.executionStatus || 'UNEXECUTED'}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-200 truncate">{item.testCase.name}</div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Active Case View */}
        <div className="flex-1 p-6 lg:p-10 overflow-y-auto space-y-6 bg-slate-950">
          
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-sm font-bold text-amber-400 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-800/60">
                {activeItem.testCase.key}
              </span>
              <h1 className="text-2xl font-black text-white mt-3">{activeItem.testCase.name}</h1>
              <span className="inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300">
                Type: {activeItem.testCase.type}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(prev => prev - 1)}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                disabled={currentIndex === items.length - 1}
                onClick={() => setCurrentIndex(prev => prev + 1)}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Numbered Steps List */}
          <div className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800 space-y-4">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Numbered Instructions</h3>
            <div className="space-y-3">
              {(activeItem.testCase.testSteps ? activeItem.testCase.testSteps.split('\n').filter(Boolean) : ['Perform step 1 verification', 'Perform step 2 submission']).map((step: string, idx: number) => (
                <div key={idx} className="flex items-start space-x-3 text-sm text-slate-200">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-amber-400 font-mono text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Expected Result */}
          <div className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800 space-y-2">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Expected Verification Result</h3>
            <p className="text-sm font-semibold text-emerald-400 leading-relaxed">
              {activeItem.testCase.expectedResult}
            </p>
          </div>

          {/* Speed Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  onUpdateStatus(cycle.id, activeItem.testCase.key, 'PASSED');
                  if (currentIndex < items.length - 1) setCurrentIndex(prev => prev + 1);
                }}
                className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 flex items-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>PASSED (P)</span>
              </button>

              <button
                onClick={() => {
                  onUpdateStatus(cycle.id, activeItem.testCase.key, 'FAILED');
                  if (currentIndex < items.length - 1) setCurrentIndex(prev => prev + 1);
                }}
                className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 flex items-center space-x-2"
              >
                <XCircle className="w-4 h-4" />
                <span>FAILED (F)</span>
              </button>

              <button
                onClick={() => {
                  onUpdateStatus(cycle.id, activeItem.testCase.key, 'BLOCKED');
                  if (currentIndex < items.length - 1) setCurrentIndex(prev => prev + 1);
                }}
                className="px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs shadow-lg shadow-amber-600/30 flex items-center space-x-2"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>BLOCKED (B)</span>
              </button>
            </div>

            <div className="text-xs text-slate-500 font-mono">
              Passed: <span className="text-emerald-400 font-bold">{passedCount}</span> • Failed: <span className="text-rose-400 font-bold">{failedCount}</span> • Blocked: <span className="text-amber-400 font-bold">{blockedCount}</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
