import React, { useState } from 'react';
import { FeatureFlags, toggleFeatureFlag, promoteToPermanent, rollbackAllLabs, toggleLabsGlobal } from '../engine/feature-flags';
import { X, Sparkles, CheckCircle2, RotateCcw, Zap, Video, Check, Layers } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface LabsControlModalProps {
  flags: FeatureFlags;
  onFlagsUpdated: (flags: FeatureFlags) => void;
  onClose: () => void;
  onLaunchCodeSpec?: () => void;
  onLaunchAutomate?: () => void;
  onLaunchReflectRecorder?: () => void;
}

export const LabsControlModal: React.FC<LabsControlModalProps> = ({
  flags,
  onFlagsUpdated,
  onClose
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
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Banner */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-white tracking-tight">Genie Labs Control Center</h2>
                <span className="bg-purple-500/20 text-purple-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-purple-500/30">
                  Stealth Mode Preferences
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Toggle stealth recording mode on/off or configure power preferences.
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

        {/* Status Banner */}
        <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-b border-purple-200/80 space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-sm">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-purple-950">
                ⚡ Stealth Recording Control Center
              </h3>
              <p className="text-xs text-purple-800 leading-relaxed mt-1">
                Toggle the purple <strong>📹 RECORD</strong> mode button on your top navigation bar on or off below:
              </p>
            </div>
          </div>
        </div>

        {/* Experimental Stealth Toggles */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            EXPERIMENTAL SYSTEM PREFERENCES
          </div>

          <div className="space-y-3">
            {/* Record Mode Toggle (Matching User Request) */}
            <div className="p-4 rounded-2xl border-2 border-purple-200 bg-purple-50/40 hover:bg-purple-50 flex items-center justify-between transition-all">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Video className="w-4 h-4 text-purple-600" />
                  <span className="font-extrabold text-xs text-slate-900">Reflect Remote Record Mode</span>
                  <span className="bg-purple-200 text-purple-800 font-mono text-[9px] font-black px-2 py-0.5 rounded-full">
                    📹 RECORD BUTTON
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Toggle purple <strong>📹 RECORD</strong> button visibility on top header toolbar.
                </p>
              </div>
              <input
                type="checkbox"
                checked={flags.reflect_remote_recorder}
                onChange={() => handleToggle('reflect_remote_recorder')}
                className="w-5 h-5 text-purple-600 rounded cursor-pointer transition-all"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 text-xs">
          <button
            onClick={handleRollback}
            className="inline-flex items-center text-slate-600 hover:text-slate-900 font-bold"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1 text-slate-500" />
            Reset Flags
          </button>

          <button
            onClick={onClose}
            className="inline-flex items-center px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold shadow-md transition-all active:scale-95"
          >
            Done
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
