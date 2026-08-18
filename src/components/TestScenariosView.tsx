import React, { useState, useRef } from 'react';
import { TestCase, UserProfile } from '../types';
import { SearchableSelect } from './SearchableSelect';
import { TestCaseImporter } from './TestCaseImporter';
import { Plus, Search, Filter, Sparkles, Code2, CheckCircle2, AlertCircle, Bot, Monitor, ChevronRight, Layers, FileText, Upload } from 'lucide-react';
import Papa from 'papaparse';

interface TestScenariosViewProps {
  moduleName: string;
  testCases: TestCase[];
  currentUser: UserProfile;
  onAddTestCase?: (newCase: TestCase) => void;
  onAddTestCases?: (newCases: TestCase[]) => void;
  onSaveTestCase?: (updatedCase: TestCase) => void;
  onAutomateTestCase?: (testCase: TestCase) => void;
  onLaunchRemoteRecorder?: () => void;
}

export const TestScenariosView: React.FC<TestScenariosViewProps> = ({
  moduleName,
  testCases,
  currentUser,
  onAddTestCase,
  onAddTestCases,
  onSaveTestCase,
  onAutomateTestCase,
  onLaunchRemoteRecorder
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [isCreatingScenario, setIsCreatingScenario] = useState(false);
  const [isImporterOpen, setIsImporterOpen] = useState(false);

  const scenarioFileInputRef = useRef<HTMLInputElement>(null);

  // New Scenario Form State
  const [key, setKey] = useState('');
  const [title, setTitle] = useState('');
  const [objective, setObjective] = useState('');
  const [precondition, setPrecondition] = useState('');
  const [type, setType] = useState('Positive');
  const [priority, setPriority] = useState('High');

  // Filtered Scenarios
  const filteredScenarios = testCases.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q || c.key.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || (c.objective || '').toLowerCase().includes(q);
    const matchesType = selectedType === 'ALL' || c.type === selectedType;
    const matchesPriority = selectedPriority === 'ALL' || c.priority === selectedPriority;
    return matchesQuery && matchesType && matchesPriority;
  });

  const handleOpenCreateDrawer = () => {
    const nextNum = testCases.length + 1;
    const prefix = moduleName.substring(0, 3).toUpperCase();
    setKey(`${prefix}-SCN-${nextNum.toString().padStart(2, '0')}`);
    setTitle('');
    setObjective('');
    setPrecondition('User is authenticated in System');
    setType('Positive');
    setPriority('High');
    setIsCreatingScenario(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !key.trim()) return;

    const newScenario: TestCase = {
      key: key.trim().toUpperCase(),
      folder: `/Test Scenarios/${moduleName}`,
      name: title.trim(),
      objective: objective.trim() || title.trim(),
      precondition: precondition.trim() || 'User is logged in',
      testSteps: `Step 1: Navigate to ${moduleName} module.\nStep 2: Enter required input parameters.\nStep 3: Submit transaction and blur fields.\nStep 4: Verify expected response and UI state.`,
      testData: 'Valid payload',
      expectedResult: 'System performs action cleanly and updates database.',
      status: 'Approved',
      priority: priority as any,
      category: moduleName,
      type: type as any,
      sourceFile: `apps/web/src/features/${moduleName.toLowerCase()}`,
      createdAt: new Date().toISOString()
    };

    if (onAddTestCase) {
      onAddTestCase(newScenario);
    }
    setIsCreatingScenario(false);
  };

  const handleMarkAutomated = (caseKey: string, code: string) => {
    const existing = testCases.find(c => c.key === caseKey);
    if (existing && onSaveTestCase) {
      onSaveTestCase({
        ...existing,
        status: 'Approved (Automated)',
        backendTrace: 'Playwright Spec Generated'
      });
    }
  };

  const handleScenarioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (fileExt === '.json') {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          const cases: TestCase[] = Array.isArray(parsed) ? parsed : (parsed.items || parsed.testCases || []);
          if (cases.length > 0 && onAddTestCases) {
            onAddTestCases(cases);
          }
        } catch (err) {
          alert('Error parsing JSON scenario file.');
        }
      };
      reader.readAsText(file);
    } else {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rows = results.data as any[];
          const prefix = moduleName.substring(0, 3).toUpperCase();
          const newCases: TestCase[] = rows.map((row, idx) => {
            const scenarioNum = testCases.length + idx + 1;
            const scenarioTitle = row['Scenario Title'] || row['Title'] || row['Name'] || row['Test Case Title'] || `Test Scenario ${scenarioNum}`;
            const scenarioObj = row['Objective'] || row['Description'] || scenarioTitle;
            const scenarioType = (row['Type'] || row['Test Type'] || (scenarioTitle.toLowerCase().includes('negative') || scenarioTitle.toLowerCase().includes('error') ? 'Negative' : 'Positive'));
            
            return {
              key: row['Scenario Key'] || row['Key'] || `${prefix}-SCN-${scenarioNum.toString().padStart(2, '0')}`,
              folder: `/Test Scenarios/${moduleName}`,
              name: scenarioTitle,
              objective: scenarioObj,
              precondition: row['Precondition'] || 'User logged in',
              testSteps: row['Test Steps'] || row['Steps'] || `Step 1: Perform user action for ${scenarioTitle}`,
              testData: row['Test Data'] || 'Standard QA Payload',
              expectedResult: row['Expected Result'] || 'System performs action cleanly',
              status: 'Approved',
              priority: (row['Priority'] || 'High') as any,
              category: moduleName,
              type: scenarioType as any,
              sourceFile: file.name,
              createdAt: new Date().toISOString()
            };
          });

          if (newCases.length > 0 && onAddTestCases) {
            onAddTestCases(newCases);
          }
        }
      });
    }

    if (e.target) e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <input
        type="file"
        ref={scenarioFileInputRef}
        accept=".csv,.xlsx,.json"
        onChange={handleScenarioFileUpload}
        className="hidden"
      />
      
      {/* Top Action & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center">
            <Sparkles className="w-5 h-5 text-indigo-600 mr-2" />
            High-Level Test Scenarios & E2E Automation — {moduleName}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Define high-level user acceptance scenarios, upload scenario spreadsheet files, and instantly generate Playwright E2E tests.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsImporterOpen(true)}
            className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all active:scale-95 shrink-0"
          >
            <Upload className="w-4 h-4 mr-1.5" />
            Add / Import Test Scenarios
          </button>
        </div>
      </div>

      {/* Search & Type Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search test scenarios by ID, title, or objective..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <SearchableSelect
              options={[
                { value: 'ALL', label: 'All Test Case Types' },
                { value: 'Positive', label: 'Positive Test Cases' },
                { value: 'Negative', label: 'Negative / Validation Test Cases' },
                { value: 'Boundary', label: 'Boundary Test Cases' },
                { value: 'Permission', label: 'RBAC Permission Test Cases' }
              ]}
              value={selectedType}
              onChange={setSelectedType}
              className="w-56"
            />
          </div>

          <SearchableSelect
            options={[
              { value: 'ALL', label: 'All Priorities' },
              { value: 'Critical', label: 'Critical Priority' },
              { value: 'High', label: 'High Priority' },
              { value: 'Medium', label: 'Medium Priority' },
              { value: 'Low', label: 'Low Priority' }
            ]}
            value={selectedPriority}
            onChange={setSelectedPriority}
            className="w-44"
          />
        </div>
      </div>

      {/* Create New Scenario Form Drawer */}
      {isCreatingScenario && (
        <form onSubmit={handleCreateSubmit} className="bg-white rounded-3xl p-6 border border-indigo-200 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center">
              <Plus className="w-4 h-4 text-indigo-600 mr-2" />
              Add New High-Level Test Scenario
            </h3>
            <button
              type="button"
              onClick={() => setIsCreatingScenario(false)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Scenario Key *</label>
              <input
                type="text"
                value={key}
                onChange={e => setKey(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold"
              />
            </div>

            <div className="md:col-span-3">
              <label className="font-bold text-slate-700 block mb-1">Scenario Title *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Verify Overlapping Holiday Creation Blocked by API"
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="md:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">Objective / Description</label>
              <input
                type="text"
                value={objective}
                onChange={e => setObjective(e.target.value)}
                placeholder="Brief summary of what this scenario validates"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Precondition</label>
              <input
                type="text"
                value={precondition}
                onChange={e => setPrecondition(e.target.value)}
                placeholder="e.g. User with HR Admin permissions logged in"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Test Type</label>
              <SearchableSelect
                options={[
                  { value: 'Positive', label: 'Positive Scenario' },
                  { value: 'Negative', label: 'Negative / Validation' },
                  { value: 'Boundary', label: 'Boundary Limits' },
                  { value: 'Permission', label: 'RBAC Permission' }
                ]}
                value={type}
                onChange={val => setType(val)}
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Priority</label>
              <SearchableSelect
                options={[
                  { value: 'Critical', label: 'Critical' },
                  { value: 'High', label: 'High' },
                  { value: 'Medium', label: 'Medium' },
                  { value: 'Low', label: 'Low' }
                ]}
                value={priority}
                onChange={val => setPriority(val)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreatingScenario(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all active:scale-95"
            >
              Save Test Scenario
            </button>
          </div>
        </form>
      )}

      {/* Test Scenarios Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredScenarios.length === 0 ? (
          <div className="col-span-2 bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">No Test Scenarios Found</h3>
            <p className="text-xs text-slate-400">Click + Add Test Scenario above to define high-level test scenarios.</p>
          </div>
        ) : (
          filteredScenarios.map(sc => {
            const isAutomated = sc.status?.includes('Automated') || sc.backendTrace?.includes('Playwright');
            return (
              <div
                key={sc.key}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-extrabold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                          {sc.key}
                        </span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          sc.type === 'Positive' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {sc.type}
                        </span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          sc.priority === 'Critical' ? 'bg-rose-100 text-rose-800' :
                          sc.priority === 'High' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {sc.priority}
                        </span>
                      </div>
                      <h3 className="text-sm font-extrabold text-slate-900 leading-snug">{sc.name}</h3>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold shrink-0 border ${
                      isAutomated ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {isAutomated ? '⚡ Automated' : '📝 Manual'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <strong className="text-slate-800">Objective:</strong> {sc.objective || sc.name}
                  </p>

                  {sc.precondition && (
                    <p className="text-[11px] text-slate-500 font-mono">
                      <span>Precondition:</span> {sc.precondition}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Module: {sc.category}
                  </span>

                  <button
                    onClick={() => {
                      if (onAutomateTestCase) {
                        onAutomateTestCase(sc);
                      } else if (onLaunchRemoteRecorder) {
                        onLaunchRemoteRecorder();
                      }
                    }}
                    className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md transition-all active:scale-95"
                  >
                    <Code2 className="w-3.5 h-3.5 mr-1.5" />
                    🤖 Automate
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Import Test Scenarios Modal */}
      {isImporterOpen && (
        <TestCaseImporter
          moduleName={moduleName}
          currentUser={currentUser}
          existingCases={testCases}
          mode="scenarios"
          onImportCases={(newCases) => {
            if (onAddTestCases) onAddTestCases(newCases);
            setIsImporterOpen(false);
          }}
          onClose={() => setIsImporterOpen(false)}
        />
      )}

    </div>
  );
};
