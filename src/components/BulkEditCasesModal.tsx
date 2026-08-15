import React, { useState } from 'react';
import { Layers, X, Save, CheckCircle2 } from 'lucide-react';
import { SearchableSelect } from './SearchableSelect';

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

  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] top-0 left-0 w-screen h-screen bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        
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
            <SearchableSelect
              options={[
                { value: 'NO_CHANGE', label: '-- Do Not Change --' },
                { value: 'Positive', label: 'Positive Scenario' },
                { value: 'Negative', label: 'Negative / Validation Scenario' }
              ]}
              value={updateType}
              onChange={setUpdateType}
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Bulk Update Priority Level</label>
            <SearchableSelect
              options={[
                { value: 'NO_CHANGE', label: '-- Do Not Change --' },
                { value: 'Critical', label: 'Critical (P0)' },
                { value: 'High', label: 'High (P1)' },
                { value: 'Medium', label: 'Medium (P2)' },
                { value: 'Low', label: 'Low (P3)' }
              ]}
              value={updatePriority}
              onChange={setUpdatePriority}
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Bulk Update Status</label>
            <SearchableSelect
              options={[
                { value: 'NO_CHANGE', label: '-- Do Not Change --' },
                { value: 'Approved', label: 'Approved' },
                { value: 'Ready for Review', label: 'Ready for Review' },
                { value: 'Draft', label: 'Draft' }
              ]}
              value={updateStatus}
              onChange={setUpdateStatus}
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
              Apply Bulk Edit
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
