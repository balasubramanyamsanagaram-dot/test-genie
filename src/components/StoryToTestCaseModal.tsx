import React, { useState } from 'react';
import { TestCase } from '../types';
import { X, Sparkles, Upload, FileText, CheckCircle2, Loader2, Plus, Zap } from 'lucide-react';

interface StoryToTestCaseModalProps {
  moduleName: string;
  onAddTestCases: (newCases: TestCase[]) => void;
  onClose: () => void;
}

export const StoryToTestCaseModal: React.FC<StoryToTestCaseModalProps> = ({
  moduleName,
  onAddTestCases,
  onClose
}) => {
  const [userStory, setUserStory] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCases, setGeneratedCases] = useState<TestCase[] | null>(null);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userStory.trim()) {
      alert('Please paste a Jira User Story or Acceptance Criteria text first.');
      return;
    }

    setIsGenerating(true);

    setTimeout(() => {
      const storyTitle = userStory.split('\n')[0].substring(0, 45).replace(/^(As a|Feature:|Story:)/i, '').trim() || moduleName;
      const baseKey = moduleName.substring(0, 3).toUpperCase();

      const aiCases: TestCase[] = [
        {
          key: `${baseKey}-AI-01`,
          name: `[AI Positive] Verify successful ${storyTitle}`,
          type: 'Positive',
          folder: moduleName,
          category: moduleName,
          objective: `Verify successful ${storyTitle}`,
          precondition: `User logged in with proper permissions`,
          testSteps: `Step 1: Log in to Enterprise Portal and navigate to [${moduleName}] module.\nStep 2: Fill out all required fields with valid input parameters according to acceptance criteria.\nStep 3: Click [Submit / Confirm] button.\nStep 4: Inspect response notification toast and DB transaction state.`,
          testData: `Valid input dataset`,
          expectedResult: `System processes transaction successfully and displays 'Operation completed successfully' toast alert.`,
          status: 'Approved',
          priority: 'High',
          sourceFile: 'AI Story Generator'
        },
        {
          key: `${baseKey}-AI-02`,
          name: `[AI Negative] Verify mandatory field omission validation for ${storyTitle}`,
          type: 'Negative',
          folder: moduleName,
          category: moduleName,
          objective: `Verify mandatory field omission validation`,
          precondition: `User on creation form`,
          testSteps: `Step 1: Log in to Enterprise Portal and navigate to [${moduleName}] module.\nStep 2: Leave mandatory fields blank and blur input fields.\nStep 3: Click [Submit / Confirm] button.\nStep 4: Inspect inline field error validation indicators.`,
          testData: `Blank input parameters`,
          expectedResult: `System blocks API submission and displays inline red error text 'This field is required'.`,
          status: 'Approved',
          priority: 'High',
          sourceFile: 'AI Story Generator'
        },
        {
          key: `${baseKey}-AI-03`,
          name: `[AI Boundary] Verify max character length constraint for ${storyTitle}`,
          type: 'Boundary',
          folder: moduleName,
          category: moduleName,
          objective: `Verify max length limit`,
          precondition: `User on text input field`,
          testSteps: `Step 1: Log in to Enterprise Portal and navigate to [${moduleName}] module.\nStep 2: Input text exceeding 255 character length constraint limit.\nStep 3: Attempt to blur input field or click [Submit].\nStep 4: Inspect input character counter and validation message.`,
          testData: `String exceeding 255 chars`,
          expectedResult: `System truncates input at 255 chars and displays inline red warning limit.`,
          status: 'Approved',
          priority: 'Medium',
          sourceFile: 'AI Story Generator'
        },
        {
          key: `${baseKey}-AI-04`,
          name: `[AI RBAC] Verify Developer / Auditor role restriction for ${storyTitle}`,
          type: 'Negative',
          folder: moduleName,
          category: moduleName,
          objective: `Verify role access control`,
          precondition: `Logged in as non-QA role`,
          testSteps: `Step 1: Log in as Developer or Auditor role.\nStep 2: Navigate to [${moduleName}] module repository.\nStep 3: Attempt to click [Create / Submit / Execute] action button.\nStep 4: Inspect UI action button state and access control indicator.`,
          testData: `Non-admin user session`,
          expectedResult: `Action buttons display as disabled lock icons or remain hidden for unauthorized roles.`,
          status: 'Approved',
          priority: 'High',
          sourceFile: 'AI Story Generator'
        }
      ];

      setGeneratedCases(aiCases);
      setIsGenerating(false);
    }, 1200);
  };

  const handleCommit = () => {
    if (generatedCases) {
      onAddTestCases(generatedCases);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn font-sans">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-6 text-white flex items-center justify-between border-b border-purple-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/30 border border-purple-400/40 flex items-center justify-center text-purple-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">AI Story-to-Test Case Generator</h2>
              <p className="text-xs text-purple-200">
                Paste Jira User Stories or Acceptance Criteria to auto-generate 4-step manual test cases.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-xl text-purple-300 hover:text-white hover:bg-purple-800/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {!generatedCases ? (
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Paste Jira User Story / Acceptance Criteria
                </label>
                <textarea
                  rows={6}
                  value={userStory}
                  onChange={e => setUserStory(e.target.value)}
                  placeholder={`As a HR Manager,\nI want to apply for employee holiday policies,\nSo that system validates overlapping date ranges and limits.`}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 font-sans font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md shadow-purple-600/30 flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-purple-200" />
                    <span>AI Extracting Acceptance Criteria...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate 4-Step Test Cases with AI</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                  ✨ Generated 4 Comprehensive Test Cases for {moduleName}
                </span>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {generatedCases.map((tc, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-indigo-600">{tc.key}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        tc.type === 'Positive' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {tc.type}
                      </span>
                    </div>
                    <div className="text-xs font-extrabold text-slate-900">{tc.name}</div>
                    <div className="text-[11px] text-slate-600 font-medium">Expected: {tc.expectedResult}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setGeneratedCases(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Back / Edit Prompt
                </button>
                <button
                  type="button"
                  onClick={handleCommit}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md shadow-purple-600/30 flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Commit to Repository</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
