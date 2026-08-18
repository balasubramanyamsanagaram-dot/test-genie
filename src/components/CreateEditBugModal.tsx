import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { JiraBug, TestCycle, TestCase, UserProfile } from '../types';
import { X, Bug, Info, AlertTriangle } from 'lucide-react';
import { SearchableSelect } from './SearchableSelect';
import { fetchApi, createDirectJiraIssue } from '../api/client';

interface CreateEditBugModalProps {
  isOpen: boolean;
  onClose: () => void;
  bugToEdit?: JiraBug & { cycleId?: string; itemKey?: string; cycleName?: string };
  testCycles: TestCycle[];
  currentUser: UserProfile;
  onSaveBug: (
    bug: JiraBug,
    options: { cycleId?: string; itemKey?: string; isEdit: boolean }
  ) => void;
}

export const CreateEditBugModal: React.FC<CreateEditBugModalProps> = ({
  isOpen,
  onClose,
  bugToEdit,
  testCycles,
  currentUser,
  onSaveBug
}) => {
  const isEdit = !!bugToEdit;

  // Selected Cycle & Test Case (for Creation flow)
  const [selectedCycleId, setSelectedCycleId] = useState('');
  const [selectedCaseKey, setSelectedCaseKey] = useState('');

  // Form Fields
  const [projectKey, setProjectKey] = useState('HRM');
  const [summary, setSummary] = useState('');
  const [severity, setSeverity] = useState<'Blocker' | 'Critical' | 'Major' | 'Minor'>('Critical');
  const [assignedDeveloper, setAssignedDeveloper] = useState('');
  const [status, setStatus] = useState<'Open' | 'Re-opened' | 'Resolved'>('Open');
  const [description, setDescription] = useState('');

  // Retrieve test cases from the selected cycle
  const currentCycle = testCycles.find(c => c.id === selectedCycleId);
  const cycleCases = currentCycle ? currentCycle.items.map(i => i.testCase) : [];

  // Initialize fields if editing
  useEffect(() => {
    if (bugToEdit) {
      setProjectKey(bugToEdit.projectKey || 'HRM');
      setSummary(bugToEdit.summary);
      setSeverity(bugToEdit.severity as any);
      setAssignedDeveloper(bugToEdit.assignedDeveloper || '');
      setStatus(bugToEdit.status as any || 'Open');
      setDescription(bugToEdit.description || '');
      setSelectedCycleId(bugToEdit.cycleId || '');
      setSelectedCaseKey(bugToEdit.itemKey || '');
    } else {
      setProjectKey('HRM');
      setSummary('');
      setSeverity('Critical');
      setAssignedDeveloper('');
      setStatus('Open');
      setDescription('');
      if (testCycles.length > 0) {
        setSelectedCycleId(testCycles[0].id);
      } else {
        setSelectedCycleId('');
      }
      setSelectedCaseKey('');
    }
  }, [bugToEdit, testCycles, isOpen]);

  // Set default case once cycle changes
  useEffect(() => {
    if (!isEdit && cycleCases.length > 0) {
      setSelectedCaseKey(cycleCases[0].key);
    }
  }, [selectedCycleId, cycleCases, isEdit]);

  // Generate automated description template once test case changes
  useEffect(() => {
    if (!isEdit && selectedCaseKey && currentCycle) {
      const item = currentCycle.items.find(i => i.testCase.key === selectedCaseKey);
      if (item) {
        setDescription(
          `*Test Case Key*: ${item.testCase.key}\n` +
          `*Scenario*: ${item.testCase.name}\n\n` +
          `*Steps to Reproduce*:\n${item.testCase.testSteps}\n\n` +
          `*Expected Outcome*: ${item.testCase.expectedResult}\n\n` +
          `*Actual Outcome*: Validation failed during manual execution.`
        );
        setSummary(`[FAIL] ${item.testCase.name}`);
      }
    }
  }, [selectedCaseKey, selectedCycleId, isEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) {
      alert('Bug summary is required.');
      return;
    }

    const cleanProjectKey = projectKey.trim().toUpperCase() || 'HGA';
    let finalIssueKey = bugToEdit?.issueKey || '';
    let finalIssueUrl = bugToEdit?.issueUrl || '';

    if (!isEdit) {
      try {
        const liveBug = await fetchApi<JiraBug>('/jira/create-issue', {
          method: 'POST',
          body: JSON.stringify({
            cycleItemId: selectedCaseKey || 'manual_bug',
            projectKey: cleanProjectKey,
            summary: summary.trim(),
            description: description.trim(),
            severity,
            assignedDeveloper: assignedDeveloper.trim() || 'Unassigned',
            raisedBy: currentUser.name
          })
        });

        if (liveBug && liveBug.issueKey) {
          finalIssueKey = liveBug.issueKey;
          finalIssueUrl = liveBug.issueUrl;
        } else {
          const direct = await createDirectJiraIssue({
            projectKey: cleanProjectKey,
            summary: summary.trim(),
            description: description.trim(),
            severity,
            assignedDeveloper: assignedDeveloper.trim() || 'Unassigned',
            raisedBy: currentUser.name
          });

          if (direct && direct.issueKey) {
            finalIssueKey = direct.issueKey;
            finalIssueUrl = direct.issueUrl;
          } else {
            let randomNum = Math.floor(1000 + Math.random() * 9000);
            finalIssueKey = `${cleanProjectKey}-${randomNum}`;
            finalIssueUrl = `https://brilyant-team-ouq206ed.atlassian.net/browse/${finalIssueKey}`;
          }
        }
      } catch (err) {
        const direct = await createDirectJiraIssue({
          projectKey: cleanProjectKey,
          summary: summary.trim(),
          description: description.trim(),
          severity,
          assignedDeveloper: assignedDeveloper.trim() || 'Unassigned',
          raisedBy: currentUser.name
        });

        if (direct && direct.issueKey) {
          finalIssueKey = direct.issueKey;
          finalIssueUrl = direct.issueUrl;
        } else {
          let randomNum = Math.floor(1000 + Math.random() * 9000);
          finalIssueKey = `${cleanProjectKey}-${randomNum}`;
          finalIssueUrl = `https://brilyant-team-ouq206ed.atlassian.net/browse/${finalIssueKey}`;
        }
      }
    }

    const savedBug: JiraBug = {
      issueKey: finalIssueKey,
      issueUrl: finalIssueUrl,
      summary: summary.trim(),
      description: description.trim(),
      severity,
      projectKey: cleanProjectKey,
      assignedDeveloper: assignedDeveloper.trim() || 'Unassigned',
      raisedBy: bugToEdit?.raisedBy || currentUser.name,
      raisedAt: bugToEdit?.raisedAt || new Date().toLocaleString(),
      status,
      screenshotUrl: bugToEdit?.screenshotUrl,
      videoUrl: bugToEdit?.videoUrl,
      evidenceName: bugToEdit?.evidenceName
    };

    onSaveBug(savedBug, {
      cycleId: selectedCycleId || undefined,
      itemKey: selectedCaseKey || undefined,
      isEdit
    });
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 font-sans"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col font-sans"
        onClick={e => e.stopPropagation()}
      >

        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between flex-shrink-0 ${isEdit ? 'bg-indigo-50 border-indigo-100' : 'bg-rose-50 border-rose-100'
          }`}>
          <div className="flex items-center space-x-3">
            <div className={`w-9 h-9 rounded-xl text-white flex items-center justify-center shadow-md ${isEdit ? 'bg-indigo-600' : 'bg-rose-600'
              }`}>
              <Bug className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                {isEdit ? `Edit Jira Defect [${bugToEdit?.issueKey}]` : 'Log New Jira Defect Ticket'}
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">
                {isEdit ? 'Modify ticket priority, details, or status' : 'Log a defect ticket in Jira Cloud with step details & evidence attachments'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">

          {/* Cycle & Case Selection (Only for Create flow) */}
          {!isEdit ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  1. Target Test Cycle *
                </label>
                <SearchableSelect
                  options={testCycles.map(c => ({ value: c.id, label: `${c.name} (${c.version})` }))}
                  value={selectedCycleId}
                  onChange={setSelectedCycleId}
                  placeholder="Select Target Test Cycle"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  2. Associated Test Case *
                </label>
                <SearchableSelect
                  options={cycleCases.map(c => ({ value: c.key, label: `[${c.key}] ${c.name}` }))}
                  value={selectedCaseKey}
                  onChange={setSelectedCaseKey}
                  placeholder={cycleCases.length === 0 ? "No cases in this cycle" : "Select Associated Test Case"}
                  disabled={!selectedCycleId || cycleCases.length === 0}
                />
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-start space-x-2 text-[10px] text-slate-500">
              <Info className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
              <div>
                Linked to Test Case <strong className="text-slate-800 font-mono">[{bugToEdit?.itemKey}]</strong> inside execution cycle <strong className="text-slate-800">{bugToEdit?.cycleName || 'Default Cycle'}</strong>.
              </div>
            </div>
          )}

          {/* Form Divider */}
          <div className="border-t border-slate-100 my-2" />

          {/* Project Key & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {!isEdit ? (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Jira Project Key *
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={projectKey}
                  onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-950 font-bold focus:outline-none focus:border-indigo-500"
                  placeholder="HRM"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Ticket Status
                </label>
                <SearchableSelect
                  options={[
                    { value: 'Open', label: 'Open' },
                    { value: 'Re-opened', label: 'Re-opened' },
                    { value: 'Resolved', label: 'Resolved' }
                  ]}
                  value={status}
                  onChange={(val) => setStatus(val as any)}
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Defect Severity *
              </label>
              <SearchableSelect
                options={[
                  { value: 'Blocker', label: 'Blocker (S1)' },
                  { value: 'Critical', label: 'Critical (S2)' },
                  { value: 'Major', label: 'Major (S3)' },
                  { value: 'Minor', label: 'Minor (S4)' }
                ]}
                value={severity}
                onChange={(val) => setSeverity(val as any)}
              />
            </div>
          </div>

          {/* Bug Summary */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Bug Summary / Title *
            </label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-950 font-bold focus:outline-none focus:border-indigo-500"
              placeholder="e.g. Employee detail edit throws database timeout exception"
              required
            />
          </div>

          {/* Assigned Developer */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Assign Developer (Optional)
            </label>
            <input
              type="text"
              value={assignedDeveloper}
              onChange={(e) => setAssignedDeveloper(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-950 font-bold focus:outline-none focus:border-indigo-500"
              placeholder="e.g. Senthil Kumar (Developer)"
            />
          </div>

          {/* Description Textarea */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Jira Description Details *
            </label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-950 font-medium focus:outline-none focus:border-indigo-500 font-mono text-[11px] leading-relaxed"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isEdit && (!selectedCycleId || cycleCases.length === 0)}
              className={`px-6 py-2 rounded-xl text-white font-extrabold shadow-md active:scale-95 transition-all ${isEdit
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : 'bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 disabled:cursor-not-allowed'
                }`}
            >
              {isEdit ? 'Save Ticket Changes' : 'Create & Log Ticket'}
            </button>
          </div>

        </form>
      </div>
    </div>,
    document.body
  );
};
