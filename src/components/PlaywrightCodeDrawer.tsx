import React, { useState } from 'react';
import { TestCase } from '../types';
import { X, Code2, Copy, Check, Terminal, Play } from 'lucide-react';

interface PlaywrightCodeDrawerProps {
  testCase: TestCase | null;
  onClose: () => void;
}

export const PlaywrightCodeDrawer: React.FC<PlaywrightCodeDrawerProps> = ({
  testCase,
  onClose
}) => {
  const [framework, setFramework] = useState<'playwright' | 'cypress'>('playwright');
  const [copied, setCopied] = useState(false);

  if (!testCase) return null;

  // Helper to split test steps
  const getStepsArray = (tc: TestCase): string[] => {
    if (!tc.testSteps) return ['Perform step 1 verification', 'Perform step 2 submission'];
    return tc.testSteps.split('\n').map(s => s.trim()).filter(Boolean);
  };

  // Generate Playwright Code snippet dynamically
  const generatePlaywrightCode = (tc: TestCase): string => {
    const steps = getStepsArray(tc);
    const stepsFormatted = steps.map((step, idx) => `  // ${step}\n  await page.locator('[data-testid="step-${idx + 1}-input"]').fill('sample_value');`).join('\n\n');

    return `import { test, expect } from '@playwright/test';

test.describe('${tc.folder || tc.category || 'QA Module'} - Automation Suite', () => {

  test('${tc.key}: ${tc.name.replace(/'/g, "\\'")}', async ({ page }) => {
    // Navigate to Module Target Endpoint
    await page.goto('/dashboard');
    await expect(page).toHaveTitle(/Enterprise QA Portal/);

    // Numbered Execution Steps
${stepsFormatted}

    // Verification Assertion
    // Expected: ${(tc.expectedResult || '').replace(/'/g, "\\'")}
    const notificationBanner = page.locator('[data-testid="notification-banner"]');
    await expect(notificationBanner).toBeVisible();
    await expect(notificationBanner).toContainText('${(tc.expectedResult || '').substring(0, 35)}');
  });

});
`;
  };

  // Generate Cypress Code snippet dynamically
  const generateCypressCode = (tc: TestCase): string => {
    const steps = getStepsArray(tc);
    const stepsFormatted = steps.map((step, idx) => `    // ${step}\n    cy.get('[data-testid="step-${idx + 1}-input"]').type('sample_value');`).join('\n\n');

    return `describe('${tc.folder || tc.category || 'QA Module'} - Cypress Test Suite', () => {

  it('${tc.key}: ${tc.name.replace(/'/g, "\\'")}', () => {
    // Navigate to Module Target Endpoint
    cy.visit('/dashboard');
    cy.title().should('include', 'Enterprise QA Portal');

    // Numbered Execution Steps
${stepsFormatted}

    // Verification Assertion
    cy.get('[data-testid="notification-banner"]')
      .should('be.visible')
      .and('contain', '${tc.expectedResult.substring(0, 35)}');
  });

});
`;
  };

  const codeContent = framework === 'playwright'
    ? generatePlaywrightCode(testCase)
    : generateCypressCode(testCase);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 max-w-xl w-full bg-slate-950 text-white shadow-2xl border-l border-slate-800 flex flex-col font-sans animate-in slide-in-from-right duration-200">
      
      {/* Drawer Header */}
      <div className="p-5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-extrabold text-white font-mono">{testCase.key} Spec Generator</h2>
              <span className="bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                Playwright / Cypress
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-xs">{testCase.name}</p>
          </div>
        </div>

        <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Framework Selector & Copy Bar */}
      <div className="bg-slate-900/60 px-5 py-3 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFramework('playwright')}
            className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
              framework === 'playwright'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Playwright TypeScript (.spec.ts)
          </button>
          <button
            onClick={() => setFramework('cypress')}
            className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
              framework === 'cypress'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Cypress JavaScript (.cy.js)
          </button>
        </div>

        <button
          onClick={handleCopy}
          className="inline-flex items-center px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-extrabold transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 mr-1 text-slate-400" />
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Snippet Editor View */}
      <div className="flex-1 p-5 overflow-y-auto font-mono text-xs leading-relaxed bg-slate-950 text-slate-200 selection:bg-emerald-500 selection:text-slate-950">
        <pre className="whitespace-pre-wrap">{codeContent}</pre>
      </div>

      {/* Footer Run Indicator */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <span className="font-mono text-[10px]">Auto-generated by Genie Code Engine</span>
        <button
          onClick={handleCopy}
          className="inline-flex items-center text-xs font-bold text-emerald-400 hover:text-emerald-300"
        >
          <Play className="w-3.5 h-3.5 mr-1" />
          <span>Copy to Automation Project</span>
        </button>
      </div>

    </div>
  );
};
