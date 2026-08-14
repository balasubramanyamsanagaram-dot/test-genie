import React, { useState } from 'react';
import { TestCase } from '../types';
import { Search, Filter, CheckCircle2, AlertCircle, Edit3, Trash2, CheckSquare, Square, Layers } from 'lucide-react';
import { EditTestCaseModal } from './EditTestCaseModal';
import { BulkEditCasesModal } from './BulkEditCasesModal';
import { ConfirmModal, ConfirmType } from './ConfirmModal';

interface TestCaseTableProps {
  testCases: TestCase[];
  externalSearchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSaveTestCase?: (updatedCase: TestCase) => void;
  onDeleteTestCase?: (key: string) => void;
  onBulkEditTestCases?: (keys: string[], updates: { priority?: string; type?: string; status?: string }) => void;
  onBulkDeleteTestCases?: (keys: string[]) => void;
  canManageCases?: boolean;
}

export const TestCaseTable: React.FC<TestCaseTableProps> = ({
  testCases,
  externalSearchQuery = '',
  onSearchChange,
  onSaveTestCase,
  onDeleteTestCase,
  onBulkEditTestCases,
  onBulkDeleteTestCases,
  canManageCases = true
}) => {
  const [internalSearch, setInternalSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  // Checkbox Selection State
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  // Custom confirmation modal state
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: ConfirmType;
    confirmText: string;
    onConfirm: () => void;
  } | null>(null);

  // Modal States
  const [editingCase, setEditingCase] = useState<TestCase | null>(null);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);

  const activeSearch = externalSearchQuery || internalSearch;

  const handleInputChange = (val: string) => {
    setInternalSearch(val);
    if (onSearchChange) {
      onSearchChange(val);
    }
  };

  const filteredCases = testCases.filter(tc => {
    const query = activeSearch.toLowerCase().trim();
    const matchesSearch =
      !query ||
      tc.key.toLowerCase().includes(query) ||
      tc.name.toLowerCase().includes(query) ||
      tc.objective.toLowerCase().includes(query) ||
      tc.testSteps.toLowerCase().includes(query) ||
      tc.expectedResult.toLowerCase().includes(query) ||
      (tc.createdBy && tc.createdBy.toLowerCase().includes(query));

    const matchesType = selectedType === 'ALL' || tc.type === selectedType;

    return matchesSearch && matchesType;
  });

  // Checkbox Handlers
  const handleToggleCase = (key: string) => {
    setSelectedKeys(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleSelectAll = () => {
    const filteredKeys = filteredCases.map(c => c.key);
    const allSelected = filteredKeys.every(k => selectedKeys.includes(k));

    if (allSelected) {
      setSelectedKeys(prev => prev.filter(k => !filteredKeys.includes(k)));
    } else {
      setSelectedKeys(prev => Array.from(new Set([...prev, ...filteredKeys])));
    }
  };

  // Single Delete Handler
  const handleDeleteClick = (tc: TestCase) => {
    if (!canManageCases) return;
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Test Case',
      message: `Are you sure you want to permanently delete test case "${tc.key}: ${tc.name}"? This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete Case',
      onConfirm: () => {
        if (onDeleteTestCase) onDeleteTestCase(tc.key);
        setSelectedKeys(prev => prev.filter(k => k !== tc.key));
        setConfirmConfig(null);
      }
    });
  };

  // Bulk Delete Handler
  const handleBulkDelete = () => {
    if (!canManageCases || selectedKeys.length === 0) return;
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Selected Test Cases',
      message: `Are you sure you want to permanently delete all ${selectedKeys.length} selected test cases? This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete Selected',
      onConfirm: () => {
        if (onBulkDeleteTestCases) onBulkDeleteTestCases(selectedKeys);
        setSelectedKeys([]);
        setConfirmConfig(null);
      }
    });
  };

  // Bulk Edit Handler
  const handleApplyBulkEdit = (updates: { priority?: string; type?: string; status?: string }) => {
    if (onBulkEditTestCases) {
      onBulkEditTestCases(selectedKeys, updates);
    }
    setSelectedKeys([]);
  };

  const isAllFilteredSelected = filteredCases.length > 0 && filteredCases.every(c => selectedKeys.includes(c.key));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm relative">
      
      {/* Top Header: Search Input & Category Filter Bar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={activeSearch}
            onChange={e => handleInputChange(e.target.value)}
            placeholder="Search by Key, Scenario Name, or Instructions..."
            className="w-full bg-white text-slate-800 text-xs rounded-xl pl-10 pr-4 py-2.5 border border-slate-300 focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-400 shadow-sm"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="bg-white text-slate-800 text-xs font-medium rounded-xl px-3 py-2 border border-slate-300 focus:outline-none focus:border-indigo-500 shadow-sm cursor-pointer"
          >
            <option value="ALL">All Scenarios (Positive + Negative)</option>
            <option value="Positive">Positive Scenarios</option>
            <option value="Negative">Negative / Validation Scenarios</option>
            <option value="Boundary">Boundary Scenarios</option>
            <option value="Permission">RBAC Permission Scenarios</option>
          </select>
        </div>

      </div>

      {/* Floating Bulk Action Bar */}
      {selectedKeys.length > 0 && canManageCases && (
        <div className="bg-indigo-900 text-white p-3 px-6 border-b border-indigo-800 flex items-center justify-between shadow-md animate-in slide-in-from-top-2 duration-150">
          <span className="text-xs font-extrabold flex items-center">
            <CheckSquare className="w-4 h-4 mr-2 text-indigo-300" />
            {selectedKeys.length} Test Cases Selected
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsBulkEditOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs transition-all shadow-sm flex items-center"
            >
              <Layers className="w-3.5 h-3.5 mr-1.5" />
              Bulk Edit ({selectedKeys.length})
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs transition-all shadow-sm flex items-center"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Bulk Delete ({selectedKeys.length})
            </button>
            <button
              onClick={() => setSelectedKeys([])}
              className="px-3 py-1.5 rounded-xl bg-indigo-950 text-indigo-200 hover:text-white text-xs font-bold"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-100 text-slate-600 uppercase font-mono text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              {canManageCases && (
                <th className="py-3.5 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllFilteredSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
              )}
              <th className="py-3.5 px-4 w-28">Key</th>
              <th className="py-3.5 px-4 max-w-xs">Manual Test Scenario</th>
              <th className="py-3.5 px-4 w-32">Type</th>
              <th className="py-3.5 px-4">Numbered 4-Step Instructions</th>
              <th className="py-3.5 px-4 max-w-xs">Expected Result</th>
              {canManageCases && <th className="py-3.5 px-4 w-20 text-center">Actions</th>}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 font-sans">
            {filteredCases.length === 0 ? (
              <tr>
                <td colSpan={canManageCases ? 7 : 5} className="py-12 text-center text-slate-400">
                  No matching test cases found for "{activeSearch}".
                </td>
              </tr>
            ) : (
              filteredCases.map(tc => {
                const isSelected = selectedKeys.includes(tc.key);
                return (
                  <tr
                    key={tc.key}
                    className={`transition-colors ${isSelected ? 'bg-indigo-50/60' : 'hover:bg-slate-50/80'}`}
                  >
                    
                    {/* Checkbox Column */}
                    {canManageCases && (
                      <td className="py-4 px-4 align-top text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleCase(tc.key)}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                    )}

                    {/* Key */}
                    <td className="py-4 px-4 font-mono font-bold text-indigo-700 align-top">
                      {tc.key}
                    </td>

                    {/* Scenario Name & Objective */}
                    <td className="py-4 px-4 align-top max-w-xs space-y-1">
                      <span className="font-extrabold text-slate-900 block">{tc.name}</span>
                      <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-2">{tc.objective}</p>
                      {tc.createdBy && (
                        <span className="inline-block text-[10px] text-slate-400 font-medium">
                          Added by: {tc.createdBy}
                        </span>
                      )}
                    </td>

                    {/* Scenario Type Badge */}
                    <td className="py-4 px-4 align-top">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          tc.type === 'Positive'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}
                      >
                        {tc.type === 'Positive' ? (
                          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                        ) : (
                          <AlertCircle className="w-3 h-3 mr-1 text-rose-600" />
                        )}
                        {tc.type}
                      </span>
                    </td>

                    {/* Numbered 4-Step Instructions */}
                    <td className="py-4 px-4 align-top font-mono text-[11px] text-slate-800 whitespace-pre-line leading-relaxed">
                      {tc.testSteps}
                    </td>

                    {/* Expected Result */}
                    <td className="py-4 px-4 align-top text-slate-800 font-medium leading-relaxed max-w-xs">
                      {tc.expectedResult}
                    </td>

                    {/* Single Actions Column (Edit & Delete) */}
                    {canManageCases && (
                      <td className="py-4 px-4 align-top text-center space-x-1">
                        <button
                          onClick={() => setEditingCase(tc)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                          title="Edit Test Case"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(tc)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                          title="Delete Test Case"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-slate-50 border-t border-slate-200 text-slate-500 text-[11px] flex justify-between font-mono">
        <span>Showing {filteredCases.length} of {testCases.length} Scenarios</span>
        <span>Zephyr Scale & Jira Ready</span>
      </div>

      {/* Edit Test Case Modal */}
      {editingCase && (
        <EditTestCaseModal
          testCase={editingCase}
          onSaveTestCase={(updated) => {
            if (onSaveTestCase) onSaveTestCase(updated);
            setEditingCase(null);
          }}
          onClose={() => setEditingCase(null)}
        />
      )}

      {/* Bulk Edit Cases Modal */}
      {isBulkEditOpen && (
        <BulkEditCasesModal
          selectedCount={selectedKeys.length}
          onApplyBulkEdit={handleApplyBulkEdit}
          onClose={() => setIsBulkEditOpen(false)}
        />
      )}

      {/* Reusable Premium Confirm Modal */}
      {confirmConfig && (
        <ConfirmModal
          isOpen={confirmConfig.isOpen}
          title={confirmConfig.title}
          message={confirmConfig.message}
          type={confirmConfig.type}
          confirmText={confirmConfig.confirmText}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmConfig(null)}
        />
      )}

    </div>
  );
};
