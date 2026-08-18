import React, { useState, useEffect } from 'react';
import { X, Copy, Download, Play, Check, Code2, Sparkles, Terminal } from 'lucide-react';
import { fetchApi } from '../api/client';

interface PlaywrightCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  testCaseTitle: string;
  startingUrl?: string;
  steps: string[];
  onRunAutomation?: () => void;
}

export const PlaywrightCodeModal: React.FC<PlaywrightCodeModalProps> = ({
  isOpen,
  onClose,
  testCaseTitle,
  startingUrl = 'https://qa.hrmgenie.outstrive.co/login',
  steps,
  onRunAutomation
}) => {
  const [code, setCode] = useState<string>('');
  const [filename, setFilename] = useState<string>('test.spec.ts');
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchApi<{ code: string; filename: string }>('/automation/generate-code', {
        method: 'POST',
        body: JSON.stringify({
          title: testCaseTitle,
          startingUrl,
          deviceProfile: 'Desktop',
          testSteps: steps
        })
      })
        .then(res => {
          if (res) {
            setCode(res.code || '');
            setFilename(res.filename || 'test.spec.ts');
          }
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to generate Playwright code:', err);
          setCode(`// Failed to generate code: ${err.message}`);
          setLoading(false);
        });
    }
  }, [isOpen, testCaseTitle, startingUrl, steps]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">Generated Playwright Script</span>
                <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-semibold">{filename}</span>
              </div>
              <h3 className="text-sm font-bold text-slate-100 truncate max-w-md">{testCaseTitle}</h3>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Code Content Viewport */}
        <div className="flex-1 overflow-hidden p-4 bg-slate-950 flex flex-col relative font-mono text-xs">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Sparkles className="w-6 h-6 text-indigo-400 animate-spin" />
              <p className="text-xs font-sans font-semibold">Generating production Playwright TypeScript code...</p>
            </div>
          ) : (
            <div className="flex-1 overflow-auto bg-slate-900 border border-slate-800/80 rounded-xl p-4 text-slate-200 leading-relaxed font-mono shadow-inner">
              <pre className="text-emerald-400">{code}</pre>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={loading}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-200 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all border border-slate-700 cursor-pointer disabled:opacity-50"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={loading}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-200 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all border border-slate-700 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span>Download .spec.ts</span>
            </button>
          </div>

          {onRunAutomation && (
            <button
              onClick={() => {
                onClose();
                onRunAutomation();
              }}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Run Automation Code</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
