import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle2, Bug, Eye, Sliders, Layers, Sparkles, AlertTriangle } from 'lucide-react';
import { fetchApi } from '../api/client';

export interface VisualCompareData {
  testCaseKey: string;
  isMatch: boolean;
  diffPercentage: number;
  toleranceThreshold: number;
  status: 'PASSED' | 'VISUAL_REGRESSION_FAILED';
  baselineUrl: string;
  candidateUrl: string;
  diffOverlayUrl: string;
  summary: string;
}

interface VisualRegressionModalProps {
  data: VisualCompareData;
  onApproveBaseline?: () => void;
  onLogJiraBug?: () => void;
  onClose: () => void;
}

export const VisualRegressionModal: React.FC<VisualRegressionModalProps> = ({
  data,
  onApproveBaseline,
  onLogJiraBug,
  onClose
}) => {
  const [viewMode, setViewMode] = useState<'diff' | 'split' | 'swipe'>('diff');
  const [sliderPosition, setSliderPosition] = useState(50); // percentage 0-100
  const [isApproving, setIsApproving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await fetchApi('/automation/approve-baseline', {
        method: 'POST',
        body: JSON.stringify({
          testCaseKey: data.testCaseKey,
          newBaselineBase64: data.candidateUrl
        })
      });
      setToastMessage(`New Golden Baseline approved for ${data.testCaseKey}!`);
      if (onApproveBaseline) onApproveBaseline();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      alert('Failed to approve new baseline: ' + err);
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 font-sans animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-md ${
              data.isMatch ? 'bg-emerald-600 shadow-emerald-600/30' : 'bg-rose-600 shadow-rose-600/30 animate-pulse'
            }`}>
              {data.isMatch ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-extrabold text-white">Visual Regression Report</h3>
                <span className="font-mono text-xs text-indigo-400 bg-indigo-950/80 border border-indigo-800/80 px-2 py-0.5 rounded-lg">
                  {data.testCaseKey}
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  data.isMatch
                    ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                    : 'bg-rose-950/80 text-rose-400 border-rose-800'
                }`}>
                  {data.isMatch ? 'PASSED (0.00% Diff)' : `🔴 REGRESSION DETECTED (${data.diffPercentage}% Mismatch)`}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{data.summary}</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Controls Toolbar */}
        <div className="px-6 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('diff')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 ${
                viewMode === 'diff' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Pixel Diff Overlay</span>
            </button>

            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 ${
                viewMode === 'split' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Side-by-Side View</span>
            </button>

            <button
              onClick={() => setViewMode('swipe')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 ${
                viewMode === 'swipe' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Interactive Swipe</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 font-mono flex items-center space-x-3">
            <span>Tolerance Limit: <strong className="text-indigo-400">{data.toleranceThreshold}%</strong></span>
            <span>Mismatch: <strong className={data.isMatch ? 'text-emerald-400' : 'text-rose-400'}>{data.diffPercentage}%</strong></span>
          </div>
        </div>

        {/* Media Canvas Body */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-950/60 flex items-center justify-center relative min-h-[380px]">
          
          {toastMessage && (
            <div className="absolute top-4 bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-extrabold shadow-xl border border-emerald-400 animate-in fade-in duration-150 z-30 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Mode 1: Pixel Diff Overlay */}
          {viewMode === 'diff' && (
            <div className="relative max-w-3xl w-full border border-slate-800 rounded-2xl overflow-hidden shadow-2xl bg-slate-900 group">
              <img src={data.candidateUrl} alt="Candidate Run" className="w-full h-auto max-h-[500px] object-contain block opacity-40" />
              <img
                src={data.diffOverlayUrl}
                alt="Diff Highlight"
                className="absolute inset-0 w-full h-full object-contain mix-blend-difference filter contrast-200 hue-rotate-90 pointer-events-none"
              />
              <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-xl text-[11px] font-mono text-rose-400 font-bold flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <span>Highlighted Red Pixels = Visual UI Divergence</span>
              </div>
            </div>
          )}

          {/* Mode 2: Side-by-Side View */}
          {viewMode === 'split' && (
            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="border border-slate-800 rounded-2xl p-3 bg-slate-900 space-y-2 text-center">
                <span className="text-xs font-mono font-bold text-slate-300 block">📷 Golden Master Baseline (Approved)</span>
                <img src={data.baselineUrl} alt="Baseline" className="w-full h-72 object-contain rounded-xl border border-slate-800 bg-slate-950" />
              </div>
              <div className="border border-slate-800 rounded-2xl p-3 bg-slate-900 space-y-2 text-center">
                <span className="text-xs font-mono font-bold text-slate-300 block">📷 Candidate Release (Current Run)</span>
                <img src={data.candidateUrl} alt="Candidate" className="w-full h-72 object-contain rounded-xl border border-slate-800 bg-slate-950" />
              </div>
            </div>
          )}

          {/* Mode 3: Interactive Swipe Slider */}
          {viewMode === 'swipe' && (
            <div className="relative max-w-3xl w-full h-[450px] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl bg-slate-950 select-none">
              {/* Baseline Image underneath */}
              <img src={data.baselineUrl} alt="Baseline" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
              
              {/* Candidate Image clipped on top */}
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ width: `${sliderPosition}%` }}
              >
                <img src={data.candidateUrl} alt="Candidate" className="w-full h-full object-contain max-w-none" style={{ width: '100%' }} />
              </div>

              {/* Slider Line Divider */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-indigo-500 cursor-ew-resize z-20"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-indigo-600 border-2 border-white shadow-lg flex items-center justify-center text-white">
                  <Sliders className="w-4 h-4" />
                </div>
              </div>

              {/* Range Input Overlay */}
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={e => setSliderPosition(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
              />
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 px-6 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
          >
            Close Viewer
          </button>

          <div className="flex items-center space-x-3">
            {onLogJiraBug && !data.isMatch && (
              <button
                type="button"
                onClick={onLogJiraBug}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs inline-flex items-center shadow-md active:scale-95 transition-all"
              >
                <Bug className="w-3.5 h-3.5 mr-1.5" />
                Log Visual Defect in Jira
              </button>
            )}

            <button
              type="button"
              onClick={handleApprove}
              disabled={isApproving}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs inline-flex items-center shadow-md active:scale-95 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              {isApproving ? 'Approving...' : 'Approve New Baseline'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
