import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Play, 
  Plus, 
  Save, 
  Trash2, 
  Edit3, 
  Lock, 
  RefreshCw, 
  X, 
  ShieldCheck,
  Sparkles,
  Check,
  ChevronUp,
  ChevronDown,
  Copy,
  Eye
} from 'lucide-react';
import { ReflectRemoteBrowserCanvas } from './ReflectRemoteBrowserCanvas';

interface ReflectRecordingStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSteps: (stepsText: string) => void;
  testCaseTitle: string;
  startingUrl: string;
  initialRecordedSteps?: string[];
}

export const ReflectRecordingStudioModal: React.FC<ReflectRecordingStudioModalProps> = ({
  isOpen,
  onClose,
  onSaveSteps,
  testCaseTitle,
  startingUrl,
  initialRecordedSteps = []
}) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [isRecording, setIsRecording] = useState(true);
  const [navActions, setNavActions] = useState<{ goBack: () => void; goForward: () => void; reload: () => void } | null>(null);

  if (!isOpen) return null;

  const handleStepCreated = (step: any) => {
    setSteps(prev => [...prev, step]);
  };

  const handleSave = () => {
    const formattedSteps = steps.map((s, idx) => `${idx + 1}. ${s.description || s}`).join('\n');
    onSaveSteps(formattedSteps);
    onClose();
  };

  const handleDeleteStep = (index: number) => {
    setSteps(prev => prev.filter((_, i) => i !== index));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setSteps(prev => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === steps.length - 1) return;
    setSteps(prev => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleDuplicate = (index: number) => {
    setSteps(prev => {
      const copy = [...prev];
      const item = copy[index];
      const newItem = typeof item === 'string' ? `${item} (Copy)` : { ...item, description: `${item.description} (Copy)` };
      copy.splice(index + 1, 0, newItem);
      return copy;
    });
  };

  const handleAddAssertion = () => {
    const text = prompt('Enter text to assert is visible on page:');
    if (text) {
      setSteps(prev => [...prev, {
        type: 'assert_visible',
        description: `Assert "${text}" is displayed`,
        target: { text, strategy: 'text' },
        timestamp: Date.now()
      }]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-slate-950/90 backdrop-blur-md overflow-hidden text-slate-100 animate-in fade-in duration-200">
      
      {/* LEFT PANEL: Live Zephyr Action Streamer (Matching Reflect Layout) */}
      <div className="w-[420px] bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0 shadow-2xl">
        
        {/* Top Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-rose-400">Live Automation Stream</span>
          </div>
          <span className="text-[11px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-semibold">
            {steps.length} Steps Recorded
          </span>
        </div>

        {/* Test Case Header Info */}
        <div className="p-4 border-b border-slate-800/60 bg-slate-900/50">
          <button 
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 mb-2 font-medium"
          >
            ‹ Exit Studio
          </button>
          <h2 className="text-sm font-bold text-slate-100 truncate" title={testCaseTitle}>
            {testCaseTitle}
          </h2>
        </div>

        {/* Live Step Stream List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {steps.length === 0 ? (
            <div className="h-48 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center p-6 text-center text-slate-500 space-y-2">
              <Sparkles className="w-6 h-6 text-indigo-400 animate-bounce" />
              <p className="text-xs font-medium">Click or type inside the remote browser screen on the right</p>
              <p className="text-[10px] text-slate-600">Every mouse click and keystroke will stream live here as a Zephyr test step</p>
            </div>
          ) : (
            steps.map((step, index) => {
              const stepText = typeof step === 'string' ? step : step.description;
              const isSensitive = step.sensitive;
              const pillValue = step.value;

              return (
                <div 
                  key={index}
                  className="bg-slate-950 border border-slate-800/90 hover:border-slate-700 rounded-xl p-3 flex items-start gap-3 shadow-md transition-all group relative"
                >
                  {/* Step Index Badge */}
                  <div className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    {index + 1}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 min-w-0">
                    {editingIndex === index ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="flex-1 bg-slate-900 border border-indigo-500 rounded px-2 py-1 text-xs text-white"
                        />
                        <button 
                          onClick={() => {
                            setSteps(prev => prev.map((s, i) => i === index ? (typeof s === 'string' ? editingText : { ...s, description: editingText }) : s));
                            setEditingIndex(null);
                          }}
                          className="p-1 text-emerald-400 hover:text-emerald-300"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-slate-200 leading-relaxed font-medium">
                          {stepText}
                        </p>

                        {/* Input Value Data Pill */}
                        {pillValue && (
                          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/30 rounded-md text-[11px] font-mono text-indigo-300 font-semibold">
                            <span>{isSensitive ? (step.secretType || '{{PASSWORD}}') : pillValue}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Purple Checkmark Badge & Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </span>

                    <div className="hidden group-hover:flex items-center gap-1 ml-1 bg-slate-900 px-1 py-0.5 rounded-lg border border-slate-800">
                      <button 
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded"
                        title="Move Step Up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleMoveDown(index)}
                        disabled={index === steps.length - 1}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded"
                        title="Move Step Down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDuplicate(index)}
                        className="p-1 text-slate-400 hover:text-indigo-400 rounded"
                        title="Duplicate Step"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => {
                          setEditingIndex(index);
                          setEditingText(stepText);
                        }}
                        className="p-1 text-slate-400 hover:text-white rounded"
                        title="Edit Step Text"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteStep(index)}
                        className="p-1 text-rose-400 hover:text-rose-300 rounded"
                        title="Delete Step"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Save Action Toolbar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const text = prompt('Enter manual step description:');
                if (text) {
                  setSteps(prev => [...prev, { description: text, timestamp: Date.now() }]);
                }
              }}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all border border-slate-700"
              title="Add Manual Step"
            >
              <Plus className="w-4 h-4 text-indigo-400" />
              <span>Add Step</span>
            </button>

            <button
              onClick={handleAddAssertion}
              className="px-3 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 text-purple-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all border border-purple-800/60"
              title="Add Visual/Text Assertion Step"
            >
              <Eye className="w-4 h-4 text-purple-400" />
              <span>Add Assertion</span>
            </button>
          </div>

          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Automation Steps</span>
          </button>
        </div>
      </div>

      {/* RIGHT PANEL: Remote Headless Playwright Canvas Viewport */}
      <div className="flex-1 flex flex-col bg-slate-950 h-full overflow-hidden">
        
        {/* Navigation Bar */}
        <div className="h-12 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 flex-1 max-w-3xl">
            <div className="flex items-center gap-1.5 text-slate-400">
              <button 
                onClick={() => navActions?.goBack()} 
                className="w-7 h-7 rounded hover:bg-slate-800 flex items-center justify-center text-sm font-bold active:scale-95 transition-all cursor-pointer"
                title="Go Back"
              >
                ‹
              </button>
              <button 
                onClick={() => navActions?.goForward()} 
                className="w-7 h-7 rounded hover:bg-slate-800 flex items-center justify-center text-sm font-bold active:scale-95 transition-all cursor-pointer"
                title="Go Forward"
              >
                ›
              </button>
              <button 
                onClick={() => navActions?.reload()} 
                className="w-7 h-7 rounded hover:bg-slate-800 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                title="Reload Page"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300">
              <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">{startingUrl || 'https://qa.hrmgenie.outstrive.co/login'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>Headless Playwright Viewport</span>
            </div>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Remote Browser Canvas Viewport */}
        <div className="flex-1 p-4 flex flex-col bg-slate-950 overflow-hidden relative">
          <ReflectRemoteBrowserCanvas
            startingUrl={startingUrl}
            deviceProfile="Desktop"
            onSessionReady={(sessId) => setSessionId(sessId)}
            onStepCreated={handleStepCreated}
            onBindActions={(actions) => setNavActions(actions)}
            isRecording={isRecording}
          />
        </div>

        {/* Reflect Bottom Status Bar */}
        <div className="h-10 bg-slate-900 border-t border-slate-800 px-6 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2 font-medium">
            <span className="text-slate-500">((•))</span>
            <span>Public Cloud Isolated Engine</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-4 bg-indigo-600 rounded-full relative p-0.5 cursor-pointer">
              <div className="w-3 h-3 bg-white rounded-full shadow-md transform translate-x-4 transition-transform" />
            </div>
            <span className="font-semibold text-slate-200">Recording</span>
          </div>
        </div>
      </div>

    </div>
  );
};
