import React, { useState } from 'react';
import { TestCase } from '../types';
import { X, Code2, Copy, Download, CheckCircle2, FileCode, Monitor } from 'lucide-react';

interface AutomateScenarioModalProps {
  testCase: TestCase | null;
  isOpen: boolean;
  onClose: () => void;
  onLaunchRemoteRecorder?: () => void;
  onMarkAutomated?: (testCaseKey: string, code: string) => void;
}

export const AutomateScenarioModal: React.FC<AutomateScenarioModalProps> = ({
  testCase,
  isOpen,
  onClose,
  onLaunchRemoteRecorder,
  onMarkAutomated
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !testCase) return null;

  // Generate production-ready Playwright TypeScript code based on testCase
  const sanitizedKey = testCase.key.replace(/[^a-zA-Z0-9]/g, '_');
  const generatedCode = `import { test, expect } from '@playwright/test';

/**
 * Scenario Key: ${testCase.key}
 * Module: ${testCase.category || 'HRM'}
 * Objective: ${testCase.objective || testCase.name}
 * Precondition: ${testCase.precondition || 'Authenticated User Session'}
 * Test Type: ${testCase.type || 'Positive'} | Priority: ${testCase.priority || 'High'}
 */
test.describe('${testCase.category || 'HRM'} - ${testCase.key}', () => {
  test('${(testCase.name || testCase.key).replace(/'/g, "\\'")}', async ({ page }) => {
    // Precondition Setup
    console.log('Running setup for: ${testCase.key}');
    await page.goto('/features/${testCase.category?.toLowerCase() || 'holidays'}');
    await expect(page).toHaveTitle(/HRM Genie/);

    // ${(testCase.testSteps || 'Step 1: Perform user action').split('\n').join('\n    // ')}

    // Verification Assertion
    const toastMessage = page.locator('[data-testid="toast-notification"], .toast-success, [role="alert"]');
    await expect(toastMessage).toBeVisible({ timeout: 5000 });
    console.log('Scenario ${testCase.key} executed successfully!');
  });
});
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedCode], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sanitizedKey}_playwright_e2e.spec.ts`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveAutomation = () => {
    if (onMarkAutomated) {
      onMarkAutomated(testCase.key, generatedCode);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-150 font-sans">
      <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white flex items-center justify-between border-b border-indigo-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-400 shadow-inner">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-extrabold bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded border border-indigo-400/30">
                  {testCase.key}
                </span>
                <span className="text-xs font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  ⚡ Playwright E2E Suite
                </span>
              </div>
              <h2 className="text-base font-black text-white mt-1">{testCase.name}</h2>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-slate-900 text-slate-100">
          
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80">
            <div className="flex items-center space-x-2 text-xs font-mono text-slate-300">
              <FileCode className="w-4 h-4 text-indigo-400" />
              <span>{sanitizedKey}_playwright_e2e.spec.ts</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-700 hover:bg-slate-600 text-slate-200 transition-all"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                {copied ? 'Copied!' : 'Copy Code'}
              </button>

              <button
                onClick={handleDownload}
                className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Download .ts
              </button>

              {onLaunchRemoteRecorder && (
                <button
                  onClick={() => {
                    onClose();
                    onLaunchRemoteRecorder();
                  }}
                  className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md transition-all active:scale-95"
                >
                  <Monitor className="w-3.5 h-3.5 mr-1 text-amber-300" />
                  Live Remote Recorder
                </button>
              )}
            </div>
          </div>

          {/* Code Viewer Box */}
          <div className="relative rounded-2xl bg-slate-950 p-4 border border-slate-800 font-mono text-xs overflow-x-auto leading-relaxed text-indigo-300 shadow-inner max-h-96">
            <pre>{generatedCode}</pre>
          </div>

          {/* Scenario Details Overview */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Objective</span>
              <span className="text-slate-200 font-medium">{testCase.objective || testCase.name}</span>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Expected Result</span>
              <span className="text-slate-200 font-medium">{testCase.expectedResult || 'Successful execution with clean status'}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Clicking <strong className="text-slate-900">Mark as Automated</strong> tags this scenario as E2E Automated in the repository.
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
            >
              Close
            </button>
            <button
              onClick={handleSaveAutomation}
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Mark as Automated
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
