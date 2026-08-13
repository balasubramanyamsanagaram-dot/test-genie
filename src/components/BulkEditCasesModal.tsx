import React, { useState } from 'react';
import { Layers, X, Save, CheckCircle2 } from 'lucide-react';

interface BulkEditCasesModalProps {
  selectedCount: number;
  onApplyBulkEdit: (updates: { priority?: string; type?: string; status?: string }) => void;
  onClose: () => void;
}

export const BulkEditCasesModal: React.FC<BulkEditCasesModalProps> = ({
  selectedCount,
  onApplyBulkEdit,
  onClose
}) => {
  const [updatePriority, setUpdatePriority] = useState<string>('NO_CHANGE');
  const [updateType, setUpdateType] = useState<string>('NO_CHANGE');
  const [updateStatus, setUpdateStatus] = useState<string>('NO_CHANGE');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updates: { priority?: string; type?: string; status?: string } = {};

    if (updatePriority !== 'NO_CHANGE') updates.priority = updatePriority;
    if (updateType !== 'NO_CHANGE') updates.type = updateType;
    if (updateStatus !== 'NO_CHANGE') updates.status = updateStatus;

    if (Object.keys(updates).length === 0) {
      alert('Please select at least one field attribute to bulk update.');
      return;
    }

    onApplyBulkEdit(updates);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Bulk Edit ({selectedCount} Cases)</h3>
              <p className="text-xs text-slate-500">Apply attributes across all selected test cases.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 text-slate-400 font-bold">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          <div>
            <label className="font-bold text-slate-700 block mb-1">Bulk Update Scenario Type</label>
            <select
              value={updateType}
              onChange={e => setUpdateType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold"
            >
              <option value="NO_CHANGE">-- Do Not Change --</option>
              <option value="Positive">Positive Scenario</option>
              <option value="Negative">Negative / Validation Scenario</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Bulk Update Priority Level</label>
            <select
              value={updatePriority}
              onChange={e => setUpdatePriority(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold"
            >
              <option value="NO_CHANGE">-- Do Not Change --</option>
              <option value="Critical">Critical (P0)</option>
              <option value="High">High (P1)</option>
              <option value="Medium">Medium (P2)</option>
              <option value="Low">Low (P3)</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Bulk Update Status</label>
            <select
              value={updateStatus}
              onChange={e => setUpdateStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold"
            >
              <option value="NO_CHANGE">-- Do Not Change --</option>
              <option value="Approved">Approved</option>
              <option value="Ready for Review">Ready for Review</option>
              <option value="Draft">Draft</option>
            </select>
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
              Apply Bulk Edit
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
