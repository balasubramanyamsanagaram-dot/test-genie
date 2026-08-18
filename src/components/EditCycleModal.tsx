import React, { useState, useEffect } from 'react';
import { TestCycle } from '../types';
import { SearchableSelect } from './SearchableSelect';
import { X, Edit3, Save } from 'lucide-react';

interface EditCycleModalProps {
  cycle: TestCycle | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (cycleId: string, updates: { name: string; version: string; environment: TestCycle['environment']; assignedTester: string }) => void;
}

export const EditCycleModal: React.FC<EditCycleModalProps> = ({
  cycle,
  isOpen,
  onClose,
  onSave
}) => {
  const [name, setName] = useState('');
  const [version, setVersion] = useState('');
  const [environment, setEnvironment] = useState<TestCycle['environment']>('Staging');
  const [assignedTester, setAssignedTester] = useState('');

  useEffect(() => {
    if (cycle) {
      setName(cycle.name || '');
      setVersion(cycle.version || '');
      setEnvironment(cycle.environment || 'Staging');
      setAssignedTester(cycle.assignedTester || '');
    }
  }, [cycle]);

  if (!isOpen || !cycle) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !version.trim()) return;
    onSave(cycle.id, {
      name: name.trim(),
      version: version.trim(),
      environment,
      assignedTester: assignedTester.trim() || 'Unassigned'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Edit Execution Cycle</h3>
              <p className="text-xs text-slate-500 font-mono">ID: {cycle.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-extrabold text-slate-700 block mb-1">Cycle Title *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-extrabold text-slate-700 block mb-1">Release Version *</label>
              <input
                type="text"
                value={version}
                onChange={e => setVersion(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold"
              />
            </div>

            <div>
              <label className="font-extrabold text-slate-700 block mb-1">Target Environment</label>
              <SearchableSelect
                options={[
                  { value: 'Staging', label: 'Staging (QA-Staging)' },
                  { value: 'UAT', label: 'UAT (Client Sandbox)' },
                  { value: 'QA-Dev', label: 'QA-Dev (Integration)' },
                  { value: 'Production', label: 'Production (Sanity Check)' }
                ]}
                value={environment}
                onChange={val => setEnvironment(val as any)}
              />
            </div>
          </div>

          <div>
            <label className="font-extrabold text-slate-700 block mb-1">Assign QA Tester</label>
            <input
              type="text"
              value={assignedTester}
              onChange={e => setAssignedTester(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all active:scale-95"
            >
              <Save className="w-4 h-4 mr-1.5" />
              Save Cycle Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
