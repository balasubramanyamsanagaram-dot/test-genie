import React, { useState, useEffect, useRef } from 'react';
import { X, Play, AlertCircle, CheckCircle2, Shield, Eye, HelpCircle, Terminal, FileCode, Check } from 'lucide-react';
import { TestCase } from '../types';

export interface AutomationStepRun {
  stepNumber: number;
  instruction: string;
  status: 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED' | 'SKIPPED';
  screenshot?: string;
  log: string;
}

interface AutomationSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  testCase: TestCase | null;
  startingUrl: string;
  deviceProfile: string;
  browser: string;
  isHeaded: boolean;
  readOnlyMode?: boolean;
  initialStatus?: 'PASSED' | 'FAILED';
  initialScreenshotUrl?: string;
  onSaveToCycle?: (status: 'PASSED' | 'FAILED', evidence?: { screenshotUrl?: string; videoUrl?: string; evidenceName?: string }) => void;
  onRaiseBug?: (failedStep: string, screenshotUrl?: string) => void;
}

export const AutomationSimulator: React.FC<AutomationSimulatorProps> = ({
  isOpen,
  onClose,
  testCase,
  startingUrl,
  deviceProfile,
  browser,
  isHeaded,
  readOnlyMode = false,
  initialStatus,
  initialScreenshotUrl,
  onSaveToCycle,
  onRaiseBug
}) => {
  const [isRunning, setIsRunning] = useState(!readOnlyMode);
  const [status, setStatus] = useState<'PASSED' | 'FAILED' | 'RUNNING'>(readOnlyMode ? (initialStatus || 'PASSED') : 'RUNNING');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // State for parsed instructions
  const [steps, setSteps] = useState<AutomationStepRun[]>([]);
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);
  
  // Console log entries
  const [logs, setLogs] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !testCase) return;

    const testSteps = testCase.testSteps
      ? testCase.testSteps.split(/\n+/).filter(line => line.trim().length > 0)
      : [];

    // Initialize steps
    const initialSteps = testSteps.map((inst, idx) => ({
      stepNumber: idx + 1,
      instruction: inst,
      status: (readOnlyMode ? (initialStatus || 'PASSED') : 'PENDING') as any,
      log: readOnlyMode ? `Verified step ${idx + 1}` : 'Waiting for queue execution.'
    }));

    if (readOnlyMode) {
      const mapped: AutomationStepRun[] = initialSteps.map((step, idx) => ({
        stepNumber: step.stepNumber,
        instruction: step.instruction,
        status: (initialStatus || 'PASSED') as any,
        screenshot: initialScreenshotUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
        log: `[READONLY TRACE] Verified step ${idx + 1}: ${step.instruction}`
      }));
      setSteps(mapped);
      setStatus(initialStatus || 'PASSED');
      setIsRunning(false);
      setLogs([
        `[SYSTEM] Loaded stored Playwright execution trace console for BrowserAutomationAgent@${testCase.key}.`,
        `[SYSTEM] Execution Status: ${initialStatus || 'PASSED'}. Click any step on the left panel to inspect step screenshot captures.`
      ]);
      setActiveStepIdx(0);
      return;
    }

    setSteps(initialSteps);
    setIsRunning(true);
    setStatus('RUNNING');
    setErrorMsg(null);
    setLogs([`[SYSTEM] Starting Browser Automation Agent (Device: ${deviceProfile}, Browser: ${browser}, Headed: ${isHeaded})`]);
    setActiveStepIdx(0);

    // Call NestJS API to run playwright browser tests
    const runPlaywrightAutomation = async () => {
      try {
        setLogs(prev => [...prev, `[INFO] Requesting Playwright browser run session...`]);

        const response = await fetch('http://localhost:4600/api/v1/automation/run', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            startingUrl,
            deviceProfile,
            browser,
            testSteps,
            isHeaded
          })
        });

        if (!response.ok) {
          throw new Error(`API server returned status ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Update steps state based on API response
        const mapped: AutomationStepRun[] = (data.steps || []).map((s: any) => ({
          stepNumber: s.stepNumber,
          instruction: s.instruction,
          status: s.status,
          screenshot: s.screenshot,
          log: s.log
        }));

        setSteps(mapped);
        
        // Log all outputs in the terminal log panel
        const allLogs: string[] = [];
        mapped.forEach(s => {
          allLogs.push(`[STEP ${s.stepNumber}] Status: ${s.status}`);
          allLogs.push(`[LOG] ${s.log}`);
        });

        setLogs(prev => [...prev, ...allLogs]);

        if (data.status === 'PASSED') {
          setStatus('PASSED');
          setIsRunning(false);
          setLogs(prev => [...prev, `[SYSTEM] Automation completed successfully. Test Passed.`]);
          setActiveStepIdx(0);

          const proofScreenshot = mapped.find(s => s.screenshot)?.screenshot || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80';
          if (onSaveToCycle) {
            onSaveToCycle('PASSED', {
              screenshotUrl: proofScreenshot,
              evidenceName: `${testCase.key}_Automated_PASSED_Proof.png`
            });
          }
        } else {
          setStatus('FAILED');
          setIsRunning(false);
          setErrorMsg(data.error || 'Step validation checks failed.');
          setLogs(prev => [...prev, `[SYSTEM] Automation execution failed. Details: ${data.error || 'Check failed step.'}`]);
          
          // Find first failed step index
          const failedIdx = mapped.findIndex(s => s.status === 'FAILED');
          if (failedIdx !== -1) {
            setActiveStepIdx(failedIdx);
          }

          const errorScreenshot = mapped.find(s => s.status === 'FAILED')?.screenshot || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80';
          if (onSaveToCycle) {
            onSaveToCycle('FAILED', {
              screenshotUrl: errorScreenshot,
              evidenceName: `${testCase.key}_Automated_FAILED_ErrorTrace.png`
            });
          }
          if (onRaiseBug) {
            onRaiseBug(data.error || 'Step validation checks failed.', errorScreenshot);
          }
        }

      } catch (err) {
        setStatus('FAILED');
        setIsRunning(false);
        const errMsg = err instanceof Error ? err.message : String(err);
        setErrorMsg(errMsg);
        setLogs(prev => [...prev, `[FATAL] Error launching local playwright browser: ${errMsg}`]);
      }
    };

    runPlaywrightAutomation();

  }, [isOpen, testCase]);

  // Scroll to bottom of logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  if (!isOpen || !testCase) return null;

  const currentActiveStep = steps[activeStepIdx];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white rounded-3xl w-full max-w-5xl h-[85vh] shadow-2xl flex flex-col border border-slate-200 overflow-hidden animate-scaleUp"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Terminal Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="flex space-x-1.5 flex-shrink-0">
              <span className="w-3 h-3 rounded-full bg-rose-500 block"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500 block"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500 block"></span>
            </div>
            <div className="h-4 w-px bg-slate-800"></div>
            <div>
              <h3 className="text-sm font-extrabold font-mono tracking-tight flex items-center">
                <Terminal className="w-4 h-4 mr-2 text-indigo-400" />
                BrowserAutomationAgent@{testCase.key}
              </h3>
              <p className="text-[10px] text-slate-500 font-mono">Running local chromium headed engine...</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-extrabold border ${
              status === 'RUNNING' 
                ? 'bg-indigo-950 text-indigo-400 border-indigo-900 animate-pulse'
                : status === 'PASSED'
                ? 'bg-emerald-950 text-emerald-400 border-emerald-900'
                : 'bg-rose-950 text-rose-400 border-rose-900'
            }`}>
              {status}
            </span>
            <button 
              disabled={isRunning}
              onClick={onClose}
              className="w-7 h-7 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white flex items-center justify-center transition-colors disabled:opacity-30"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Work Area: Left (Steps), Middle (Visual evidence), Bottom (Console) */}
        <div className="flex-1 flex min-h-0">
          
          {/* Left panel: Automation steps status */}
          <div className="w-80 border-r border-slate-200 bg-slate-50/50 flex flex-col min-h-0">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-[10px] font-mono font-extrabold text-slate-400 uppercase tracking-wider">Scenario Instructions</span>
              <span className="text-[9px] font-mono text-slate-500">Click to view screenshot</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {steps.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => s.status !== 'PENDING' && s.status !== 'SKIPPED' && setActiveStepIdx(idx)}
                  disabled={s.status === 'PENDING' || s.status === 'SKIPPED'}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-start space-x-2.5 ${
                    activeStepIdx === idx
                      ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/10'
                      : s.status === 'PASSED'
                      ? 'bg-white border-emerald-100 hover:bg-slate-50'
                      : s.status === 'FAILED'
                      ? 'bg-white border-rose-100 hover:bg-slate-50 font-bold'
                      : 'bg-slate-100/50 border-slate-200/50 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-extrabold text-[10px] flex-shrink-0 mt-0.5 ${
                    s.status === 'PASSED'
                      ? 'bg-emerald-50 text-emerald-600'
                      : s.status === 'FAILED'
                      ? 'bg-rose-50 text-rose-600'
                      : 'bg-slate-200 text-slate-400'
                  }`}>
                    {s.status === 'PASSED' ? <Check className="w-3 h-3 stroke-[3]" /> : s.status === 'FAILED' ? '!' : s.stepNumber}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className={`text-xs ${activeStepIdx === idx ? 'text-indigo-900 font-extrabold' : 'text-slate-700 font-medium'}`}>
                      {s.instruction}
                    </p>
                    {s.status !== 'PENDING' && (
                      <span className={`text-[8px] font-mono uppercase font-bold mt-1 inline-block ${
                        s.status === 'PASSED' ? 'text-emerald-600' : s.status === 'FAILED' ? 'text-rose-600' : 'text-slate-400'
                      }`}>
                        {s.status}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Middle: Canvas evidence viewer */}
          <div className="flex-1 bg-slate-100 flex flex-col min-h-0 relative">
            <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center space-x-2 text-[10px] text-slate-500 font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200 border flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              </span>
              <span className="text-slate-400">Environment View:</span>
              <span className="text-slate-800 font-bold bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-sm">
                {currentActiveStep?.status === 'PASSED' || currentActiveStep?.status === 'FAILED' ? startingUrl : 'Initializing Session...'}
              </span>
            </div>

            <div className="flex-1 p-5 flex items-center justify-center min-h-0 overflow-hidden">
              {isRunning && status === 'RUNNING' && !currentActiveStep?.screenshot ? (
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800">Browser Executing...</h4>
                    <p className="text-[10px] text-slate-500 max-w-xs mx-auto">
                      Chromium is running manual test instructions headed on your Mac desktop screen. Please wait...
                    </p>
                  </div>
                </div>
              ) : currentActiveStep?.screenshot ? (
                <div className="relative border border-slate-200/80 rounded-2xl shadow-lg bg-white overflow-hidden max-h-full max-w-full flex items-center justify-center animate-fadeIn">
                  <img
                    src={currentActiveStep.screenshot}
                    alt="Automation step visual evidence proof"
                    className="object-contain max-h-[40vh] md:max-h-[50vh] w-auto h-auto rounded-xl"
                  />
                  <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-xs text-[9px] font-mono text-white px-2.5 py-1 rounded-md flex items-center space-x-1.5">
                    <Eye className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Visual Capture Step {currentActiveStep.stepNumber}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-400 space-y-2">
                  <AlertCircle className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-xs font-medium">Select an executed step to view visual screenshot.</p>
                </div>
              )}
            </div>

            {/* Bottom console debugger */}
            <div className="h-44 bg-slate-950 border-t border-slate-800 flex flex-col font-mono text-[10px] p-4 text-emerald-400 overflow-hidden">
              <div className="flex items-center space-x-2 border-b border-slate-900 pb-1.5 mb-2 flex-shrink-0 text-slate-500 uppercase font-bold text-[9px]">
                <FileCode className="w-3.5 h-3.5" />
                <span>Console Telemetry Logs</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className="leading-relaxed">
                    {log}
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>

          </div>

        </div>

        {/* Footer controls */}
        <div className="p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            {status === 'PASSED' ? (
              <div className="flex items-center space-x-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                <CheckCircle2 className="w-4 h-4" />
                <span>Test Suite Validation: PASSED</span>
              </div>
            ) : status === 'FAILED' ? (
              <div className="flex items-center space-x-1.5 text-xs text-rose-700 font-bold bg-rose-50 border border-rose-200 px-3 py-1 rounded-xl">
                <AlertCircle className="w-4 h-4" />
                <span>Test Suite Validation: FAILED</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-xs text-indigo-700 font-bold bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-xl animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 block"></span>
                <span>Executing Automated Steps...</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition-all"
            >
              Close Console
            </button>

            {status === 'PASSED' && onSaveToCycle && (
              <button
                onClick={() => {
                  onSaveToCycle('PASSED');
                  onClose();
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-95 transition-all"
              >
                Save Pass Result to Active Cycles
              </button>
            )}

            {status === 'FAILED' && (
              <>
                {onSaveToCycle && (
                  <button
                    onClick={() => {
                      onSaveToCycle('FAILED');
                      onClose();
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-slate-900 hover:bg-slate-800 text-white shadow-md active:scale-95 transition-all"
                  >
                    Save Fail Result
                  </button>
                )}
                {onRaiseBug && (
                  <button
                    onClick={() => {
                      const failedStep = currentActiveStep?.instruction || 'Validation check failed.';
                      onRaiseBug(failedStep);
                      onClose();
                    }}
                    className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-rose-600 hover:bg-rose-700 text-white shadow-md active:scale-95 transition-all"
                  >
                    Create Jira Bug
                  </button>
                )}
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
