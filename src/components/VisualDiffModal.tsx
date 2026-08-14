import React, { useState } from 'react';
import { X, Eye, Layers, ArrowLeftRight, CheckCircle2 } from 'lucide-react';

interface VisualDiffModalProps {
  baselineUrl?: string;
  executionUrl?: string;
  onClose: () => void;
}

export const VisualDiffModal: React.FC<VisualDiffModalProps> = ({
  baselineUrl = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
  executionUrl = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
  onClose
}) => {
  const [sliderPos, setSliderPos] = useState(50);
  const [viewMode, setViewMode] = useState<'split' | 'overlay' | 'diff'>('split');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn font-sans">
      <div className="bg-slate-950 text-white rounded-3xl max-w-4xl w-full border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Visual UI Snapshot Diff Engine</h2>
              <p className="text-xs text-slate-400">
                Compare baseline screenshot against live test execution screenshot to detect layout shifts.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Mode Bar */}
        <div className="bg-slate-900/60 px-6 py-3 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                viewMode === 'split' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Side-by-Side Split
            </button>
            <button
              onClick={() => setViewMode('overlay')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                viewMode === 'overlay' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Opacity Overlay Slider
            </button>
          </div>

          <div className="flex items-center space-x-2 text-[11px] font-mono text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>0.0% Pixel Match Shift (Clean Run)</span>
          </div>
        </div>

        {/* Comparison Display Body */}
        <div className="p-6 flex-1 overflow-y-auto flex items-center justify-center bg-slate-950">
          {viewMode === 'split' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold text-slate-400">Baseline Screenshot (Master v2.1)</span>
                <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 aspect-video flex items-center justify-center">
                  <img src={baselineUrl} alt="Baseline" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold text-amber-400">Live Execution Run Snapshot</span>
                <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 aspect-video flex items-center justify-center">
                  <img src={executionUrl} alt="Execution" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-2xl space-y-4">
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 aspect-video">
                <img src={baselineUrl} alt="Baseline" className="absolute inset-0 w-full h-full object-cover" />
                <img
                  src={executionUrl}
                  alt="Execution"
                  style={{ opacity: sliderPos / 100 }}
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-75"
                />
              </div>

              <div className="flex items-center space-x-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
                <span className="text-xs font-bold text-slate-400 w-24">Baseline</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPos}
                  onChange={e => setSliderPos(Number(e.target.value))}
                  className="flex-1 accent-sky-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-amber-400 w-24 text-right">Live Run ({sliderPos}%)</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
