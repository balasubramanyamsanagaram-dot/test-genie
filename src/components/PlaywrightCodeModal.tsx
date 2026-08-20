import React, { useState, useEffect } from 'react';
import { X, Copy, Download, Play, Check, Code2, Clipboard, Trash2, Info, Save, FileCode } from 'lucide-react';

interface PlaywrightCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  testCaseKey?: string;
  testCaseTitle: string;
  startingUrl?: string;
  steps: string[];
  onRunAutomation?: (scriptCode?: string) => void;
}

export const PlaywrightCodeModal: React.FC<PlaywrightCodeModalProps> = ({
  isOpen,
  onClose,
  testCaseKey,
  testCaseTitle,
  onRunAutomation
}) => {
  const [code, setCode] = useState<string>('');
  const [filename, setFilename] = useState<string>('test.spec.ts');
  const [copied, setCopied] = useState<boolean>(false);
  const [pasted, setPasted] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const storageKey = `playwright_code_${testCaseKey || testCaseTitle.replace(/[^a-zA-Z0-9]/g, '_')}`;

  useEffect(() => {
    if (isOpen) {
      const cleanKey = (testCaseKey || testCaseTitle.split(':')[0] || 'TEST').trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
      setFilename(`${cleanKey}_playwright.spec.ts`);

      try {
        const savedCode = localStorage.getItem(storageKey);
        if (savedCode !== null) {
          setCode(savedCode);
        } else {
          setCode(''); // Empty by default for user to paste custom code
        }
      } catch (e) {
        setCode('');
      }
    }
  }, [isOpen, testCaseKey, testCaseTitle, storageKey]);

  if (!isOpen) return null;

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
  };

  const handleSave = () => {
    try {
      localStorage.setItem(storageKey, code);
      localStorage.setItem('global_pasted_playwright_code', code);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (e) {
      alert('Failed to save code: ' + e);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        handleCodeChange(text);
        setPasted(true);
        setTimeout(() => setPasted(false), 2000);
      }
    } catch (err) {
      alert('Clipboard access denied. Please right-click or press Cmd+V / Ctrl+V inside the code editor to paste.');
    }
  };

  const handleClear = () => {
    handleCodeChange('');
  };

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

  const lineCount = code ? code.split('\n').length : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 font-sans">
      <div className="w-full max-w-6xl h-[85vh] bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600">
              <Code2 className="w-5.5 h-5.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-indigo-600">Custom Playwright Code Editor</span>
                <span className="text-[10px] font-mono bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-semibold">{filename}</span>
              </div>
              <h3 className="text-sm font-bold text-slate-800 truncate max-w-xl">{testCaseTitle}</h3>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-150 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Prompt Banner */}
        <div className="px-5 py-3 bg-indigo-50/50 border-b border-indigo-100 flex items-center justify-between text-xs text-indigo-900">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            <span>Paste your custom Playwright TypeScript (<code className="text-indigo-600 font-mono font-semibold">.spec.ts</code>) script below to execute or export for this test scenario.</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePasteFromClipboard}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-[11px] flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>{pasted ? 'Pasted!' : 'Paste Clipboard'}</span>
            </button>
            {code && (
              <button
                onClick={handleClear}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 font-bold rounded-xl text-[11px] flex items-center gap-1.5 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Code Content Viewport (Editable Textarea - Expanded) */}
        <div className="flex-1 overflow-hidden p-6 bg-slate-50 flex flex-col relative font-mono text-xs">
          <div className="flex-1 overflow-hidden bg-white border border-slate-200 rounded-2xl flex flex-col shadow-sm">
            <textarea
              value={code}
              onChange={e => handleCodeChange(e.target.value)}
              placeholder={`// Paste your custom Playwright TypeScript code here...\n// Example:\n\nimport { test, expect } from '@playwright/test';\n\ntest('${testCaseTitle.replace(/'/g, "\\'")}', async ({ page }) => {\n  await page.goto('https://qa.hrmgenie.outstrive.co/login');\n  await page.getByPlaceholder('Enter email').fill(process.env.USER_EMAIL || '\${USER_EMAIL}');\n  await page.getByPlaceholder('Enter password').fill(process.env.USER_PASSWORD || '\${USER_PASSWORD}');\n  await page.getByRole('button', { name: 'Login' }).click();\n});`}
              className="w-full h-full p-5 bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none resize-none font-mono text-xs leading-relaxed"
              spellCheck={false}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>Lines: {lineCount} | Characters: {code.length}</span>
            <span className="flex items-center">
              <FileCode className="w-3 h-3 mr-1 text-slate-400" />
              Auto-saves on manual Save action
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={!code}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all border border-slate-200 disabled:opacity-40"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={!code}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all border border-slate-200 disabled:opacity-40"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Download .spec.ts</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className="px-5 py-2.5 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
            >
              {saveSuccess ? <Check className="w-4 h-4 text-emerald-600" /> : <Save className="w-4 h-4" />}
              <span>{saveSuccess ? 'Changes Saved!' : 'Save Code Changes'}</span>
            </button>

            {onRunAutomation && (
              <button
                onClick={() => {
                  handleSave();
                  onClose();
                  onRunAutomation(code);
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-600/10 flex items-center gap-2 transition-all active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Run Automation Code</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
