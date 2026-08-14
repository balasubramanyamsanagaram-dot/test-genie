import React, { useState } from 'react';
import { TestCase } from '../types';
import { Edit3, X, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { SearchableSelect } from './SearchableSelect';

interface EditTestCaseModalProps {
  testCase: TestCase;
  onSaveTestCase: (updatedCase: TestCase) => void;
  onClose: () => void;
}

export const EditTestCaseModal: React.FC<EditTestCaseModalProps> = ({
  testCase,
  onSaveTestCase,
  onClose
}) => {
  const [name, setName] = useState(testCase.name);
  const [objective, setObjective] = useState(testCase.objective);
  const [precondition, setPrecondition] = useState(testCase.precondition);
  const [testSteps, setTestSteps] = useState(testCase.testSteps);
  const [expectedResult, setExpectedResult] = useState(testCase.expectedResult);
  const [priority, setPriority] = useState(testCase.priority || 'High');
  const [type, setType] = useState<'Positive' | 'Negative'>(testCase.type === 'Negative' ? 'Negative' : 'Positive');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !expectedResult.trim() || !testSteps.trim()) {
      alert('Validation Error: Scenario Title, Instructions, and Expected Result are required.');
      return;
    }

    const updated: TestCase = {
      ...testCase,
      name: name.trim(),
      objective: objective.trim(),
      precondition: precondition.trim(),
      testSteps: testSteps.trim(),
      expectedResult: expectedResult.trim(),
      priority,
      type
    };

    onSaveTestCase(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Edit Test Case — <span className="font-mono text-indigo-600">{testCase.key}</span>
              </h3>
              <p className="text-xs text-slate-500">Update scenario details, 4-step instructions, and expected result.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 text-slate-400 font-bold">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Scenario Type</label>
              <SearchableSelect
                options={[
                  { value: 'Positive', label: 'Positive Scenario' },
                  { value: 'Negative', label: 'Negative / Validation Scenario' }
                ]}
                value={type}
                onChange={val => setType(val as any)}
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Priority Level</label>
              <SearchableSelect
                options={[
                  { value: 'Critical', label: 'Critical (P0)' },
                  { value: 'High', label: 'High (P1)' },
                  { value: 'Medium', label: 'Medium (P2)' },
                  { value: 'Low', label: 'Low (P3)' }
                ]}
                value={priority}
                onChange={val => setPriority(val)}
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Scenario Title *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Objective / Description</label>
            <input
              type="text"
              value={objective}
              onChange={e => setObjective(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Preconditions</label>
            <input
              type="text"
              value={precondition}
              onChange={e => setPrecondition(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Numbered 4-Step Instructions *</label>
            <textarea
              rows={4}
              value={testSteps}
              onChange={e => setTestSteps(e.target.value)}
              required
              className="w-full bg-slate-900 text-slate-100 rounded-xl px-3 py-2 font-mono text-[11px] leading-relaxed"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Expected Result *</label>
            <input
              type="text"
              value={expectedResult}
              onChange={e => setExpectedResult(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow-md inline-flex items-center"
            >
              <Save className="w-4 h-4 mr-1.5" />
              Save Changes
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
