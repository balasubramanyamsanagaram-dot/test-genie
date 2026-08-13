import React, { useState } from 'react';
import { TestCycle, TestCase, TestCycleItem } from '../types';
import { X, Plus, CheckCircle2, Search, Filter, Layers, CheckSquare, Square } from 'lucide-react';

interface AddCasesToCycleModalProps {
  cycle: TestCycle;
  availableCases: TestCase[];
  onAddCasesToCycle: (cycleId: string, newCases: TestCase[]) => void;
  onClose: () => void;
}

export const AddCasesToCycleModal: React.FC<AddCasesToCycleModalProps> = ({
  cycle,
  availableCases,
  onAddCasesToCycle,
  onClose
}) => {
  // Existing case keys in cycle
  const existingKeys = new Set([
    ...cycle.items.map(i => i.testCase.key?.trim().toUpperCase()).filter(Boolean),
    ...cycle.items.map(i => i.testCase.name?.trim().toLowerCase()).filter(Boolean)
  ]);

  // Cases that are NOT in the cycle yet
  const unassignedCases = availableCases.filter(tc => 
    !existingKeys.has(tc.key?.trim().toUpperCase()) &&
    !existingKeys.has(tc.name?.trim().toLowerCase())
  );

  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const filteredCases = unassignedCases.filter(tc => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      tc.key.toLowerCase().includes(q) ||
      tc.name.toLowerCase().includes(q) ||
      tc.objective.toLowerCase().includes(q);

    const matchesType = typeFilter === 'ALL' || tc.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleToggleCase = (key: string) => {
    setSelectedKeys(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredKeys = filteredCases.map(c => c.key);
    const allSelected = filteredKeys.every(k => selectedKeys.includes(k));

    if (allSelected) {
      setSelectedKeys(prev => prev.filter(k => !filteredKeys.includes(k)));
    } else {
      setSelectedKeys(prev => Array.from(new Set([...prev, ...filteredKeys])));
    }
  };

  const handleConfirmAdd = () => {
    if (selectedKeys.length === 0) {
      alert('Please select at least 1 test case to add to this cycle.');
      return;
    }

    const selectedCasesList = unassignedCases.filter(c => selectedKeys.includes(c.key));
    onAddCasesToCycle(cycle.id, selectedCasesList);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Add New Cases to Cycle — <span className="text-indigo-600">{cycle.name}</span>
              </h3>
              <p className="text-xs text-slate-500">
                Currently has {cycle.items.length} cases. {unassignedCases.length} unassigned repository cases available.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 text-slate-400 font-bold">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search newly uploaded cases by Key or Title..."
              className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-slate-800 font-sans focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-800 font-bold focus:outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="Positive">Positive</option>
              <option value="Negative">Negative</option>
            </select>

            <button
              onClick={handleSelectAllFiltered}
              className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-all"
            >
              {filteredCases.length > 0 && filteredCases.every(c => selectedKeys.includes(c.key)) ? 'Deselect All' : 'Select All Filtered'}
            </button>
          </div>
        </div>

        {/* Unassigned Case List */}
        <div className="p-4 flex-1 overflow-y-auto space-y-2">
          {unassignedCases.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              All repository test cases for this module are already included in this cycle!
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No unassigned test cases matched your search filter.
            </div>
          ) : (
            filteredCases.map(tc => {
              const isSelected = selectedKeys.includes(tc.key);
              return (
                <div
                  key={tc.key}
                  onClick={() => handleToggleCase(tc.key)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3 text-xs ${
                    isSelected
                      ? 'bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="pt-0.5 text-indigo-600">
                    {isSelected ? <CheckSquare className="w-4 h-4 fill-indigo-600 text-white" /> : <Square className="w-4 h-4 text-slate-400" />}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-indigo-700">{tc.key}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tc.type === 'Positive' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}>
                          {tc.type}
                        </span>
                        {tc.sourceFile && (
                          <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-mono">
                            Source: {tc.sourceFile}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">Added: {tc.createdAt || 'Recently'}</span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-xs">{tc.name}</h4>
                    <p className="text-slate-500 text-[11px] line-clamp-1">{tc.objective}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700">
            {selectedKeys.length} new test cases selected to add
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 font-bold hover:bg-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmAdd}
              disabled={selectedKeys.length === 0}
              className={`px-5 py-2 rounded-xl text-white font-extrabold shadow-md transition-all ${
                selectedKeys.length > 0 ? 'bg-indigo-600 hover:bg-indigo-700 active:scale-95' : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              Add {selectedKeys.length} Cases to Cycle
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
