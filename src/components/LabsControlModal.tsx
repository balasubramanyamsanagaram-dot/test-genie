import React, { useState } from 'react';
import { FeatureFlags, toggleFeatureFlag, promoteToPermanent, rollbackAllLabs, toggleLabsGlobal } from '../engine/feature-flags';
import { X, Sparkles, ShieldAlert, CheckCircle2, RotateCcw, Zap, Terminal, Code2, Moon, Eye, Key } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface LabsControlModalProps {
  flags: FeatureFlags;
  onFlagsUpdated: (flags: FeatureFlags) => void;
  onClose: () => void;
  onLaunchCodeSpec?: () => void;
  onLaunchAutomate?: () => void;
}

export const LabsControlModal: React.FC<LabsControlModalProps> = ({
  flags,
  onFlagsUpdated,
  onClose,
  onLaunchCodeSpec,
  onLaunchAutomate
}) => {
  const handleToggle = (key: keyof FeatureFlags) => {
    const updated = toggleFeatureFlag(key);
    onFlagsUpdated(updated);
  };

  const handleGlobalToggle = () => {
    const updated = toggleLabsGlobal();
    onFlagsUpdated(updated);
  };

  const [isPromoteConfirmOpen, setIsPromoteConfirmOpen] = useState(false);

  const handlePromoteConfirm = () => {
    const updated = promoteToPermanent();
    onFlagsUpdated(updated);
    setIsPromoteConfirmOpen(false);
  };

  const handleRollback = () => {
    const updated = rollbackAllLabs();
    onFlagsUpdated(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn font-sans">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Banner */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-white tracking-tight">Genie Labs Control Center</h2>
                <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-indigo-500/30">
                  Stealth Mode (Cmd+Shift+L)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Toggle stealth power features on/off secretly or promote them permanently to production.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Controls Bar */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-700">Labs Status:</span>
            {flags.permanent_mode ? (
              <span className="bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-1 rounded-full border border-emerald-300 inline-flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Permanent Production Mode
              </span>
            ) : flags.labs_enabled ? (
              <span className="bg-purple-100 text-purple-800 font-extrabold px-2.5 py-1 rounded-full border border-purple-300 inline-flex items-center">
                <Zap className="w-3.5 h-3.5 mr-1 text-purple-600" />
                Active (Stealth Mode)
              </span>
            ) : (
              <span className="bg-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded-full border border-slate-300">
                Disabled (Standard UI)
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {!flags.permanent_mode && (
              <button
                onClick={handleGlobalToggle}
                className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all ${
                  flags.labs_enabled
                    ? 'bg-slate-900 text-white hover:bg-slate-800'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                }`}
              >
                {flags.labs_enabled ? 'Deactivate Labs' : 'Enable Labs Stealth'}
              </button>
            )}
          </div>
        </div>

        {/* Features List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            Available Power Features ({Object.keys(flags).length - 2} Modules)
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            




            {/* Feature 3: AI Story Importer */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="font-extrabold text-xs text-slate-900">AI Story-to-Test Generator</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Parse Jira stories/wireframe images into 4-step manual scenarios.
                </p>
              </div>
              <input
                type="checkbox"
                checked={flags.permanent_mode || flags.ai_story_generator}
                disabled={flags.permanent_mode}
                onChange={() => handleToggle('ai_story_generator')}
                className="w-4 h-4 text-indigo-600 rounded cursor-pointer mt-1"
              />
            </div>

            {/* Feature 4: Playwright Code Spec Generator */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-1.5">
                    <Code2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-extrabold text-xs text-slate-900">Playwright Code Spec Generator</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Side-by-side drawer generating runnable TypeScript .spec.ts code.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={flags.permanent_mode || flags.playwright_drawer}
                  disabled={flags.permanent_mode}
                  onChange={() => handleToggle('playwright_drawer')}
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer mt-1"
                />
              </div>

              {onLaunchCodeSpec && (
                <button
                  onClick={onLaunchCodeSpec}
                  className="w-full py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold text-[11px] border border-emerald-200 flex items-center justify-center transition-all active:scale-95 shadow-2xs"
                >
                  <Code2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                  Launch Code Spec Generator
                </button>
              )}
            </div>

            {/* Feature 5: Headed Browser Automation Runner */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-1.5">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span className="font-extrabold text-xs text-slate-900">Browser Automation Agent</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Local chromium headed execution engine with step trace viewer.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={flags.permanent_mode || flags.browser_automation_runner}
                  disabled={flags.permanent_mode}
                  onChange={() => handleToggle('browser_automation_runner')}
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer mt-1"
                />
              </div>

              {onLaunchAutomate && (
                <button
                  onClick={onLaunchAutomate}
                  className="w-full py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-extrabold text-[11px] border border-amber-200 flex items-center justify-center transition-all active:scale-95 shadow-2xs"
                >
                  <Zap className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                  Launch Browser Automation Agent
                </button>
              )}
            </div>

            {/* Feature 6: Dark Mode Theme */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-1.5">
                  <Moon className="w-4 h-4 text-indigo-500" />
                  <span className="font-extrabold text-xs text-slate-900">Dark / Light Theme Switcher</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Sleek dark mode theme for night QA testing sessions.
                </p>
              </div>
              <input
                type="checkbox"
                checked={flags.permanent_mode || flags.dark_mode_theme}
                disabled={flags.permanent_mode}
                onChange={() => handleToggle('dark_mode_theme')}
                className="w-4 h-4 text-indigo-600 rounded cursor-pointer mt-1"
              />
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <button
            onClick={handleRollback}
            className="inline-flex items-center text-slate-600 hover:text-slate-900 font-bold"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1 text-slate-500" />
            Rollback All Labs Features
          </button>

          <button
            onClick={() => setIsPromoteConfirmOpen(true)}
            className="inline-flex items-center px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-md transition-all active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-200" />
            Promote to Permanent Production
          </button>
        </div>

      </div>

      {isPromoteConfirmOpen && (
        <ConfirmModal
          isOpen={true}
          type="info"
          title="Promote to Permanent Production Mode"
          message="This will permanently enable all advanced QA features across the application for all users."
          confirmText="Promote to Production"
          cancelText="Cancel"
          onConfirm={handlePromoteConfirm}
          onCancel={() => setIsPromoteConfirmOpen(false)}
        />
      )}
    </div>
  );
};
