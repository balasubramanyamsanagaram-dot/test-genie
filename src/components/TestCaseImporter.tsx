import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { TestCase, UserProfile } from '../types';
import { Upload, Plus, FileText, CheckCircle, AlertCircle, X, User, AlertTriangle, ShieldAlert } from 'lucide-react';
import Papa from 'papaparse';
import { SearchableSelect } from './SearchableSelect';
import { cleanTestCaseTitle } from '../engine/default-data';

interface TestCaseImporterProps {
  moduleName: string;
  currentUser: UserProfile;
  existingCases?: TestCase[];
  mode?: 'cases' | 'scenarios';
  onImportCases: (newCases: TestCase[]) => void;
  onClose: () => void;
}

export function generateNextTcId(moduleName: string, existingCases: TestCase[] = []): string {
  let prefix = '';
  let maxNumber = 0;
  const existingKeySet = new Set(existingCases.map(c => c.key?.trim().toUpperCase()).filter(Boolean));

  if (existingCases && existingCases.length > 0) {
    existingCases.forEach(c => {
      if (!c.key) return;
      const keyStr = c.key.trim();
      
      const match = keyStr.match(/^([A-Z]+-[A-Z]?)(\d+)/i);
      if (match) {
        prefix = match[1].toUpperCase();
        if (!prefix.endsWith('-')) prefix += '-';
        const num = parseInt(match[2], 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      } else {
        const numMatch = keyStr.match(/\d+/);
        if (numMatch) {
          const num = parseInt(numMatch[0], 10);
          if (!isNaN(num) && num > maxNumber) {
            maxNumber = num;
          }
        }
      }
    });
  }

  if (!prefix || prefix === 'TC-') {
    const modPrefixMap: Record<string, string> = {
      holidays: 'HOL-T',
      leaves: 'LEV-T',
      payroll: 'PAY-T',
      performance: 'PRF-T',
      attendance: 'ATT-T',
      employees: 'EMP-T',
      organization: 'ORG-T',
      resignation: 'RSG-T'
    };
    const modKey = moduleName.toLowerCase().replace(/[^a-z]/g, '');
    const foundPrefix = Object.keys(modPrefixMap).find(k => modKey.includes(k));
    if (foundPrefix) {
      prefix = modPrefixMap[foundPrefix];
    } else {
      prefix = `${moduleName.substring(0, 3).toUpperCase()}-T`;
    }
  }

  let nextNum = maxNumber > 0 ? maxNumber + 1 : (existingCases.length + 1);
  let candidateKey = `${prefix}${nextNum < 10 ? `0${nextNum}` : nextNum}`;

  // Collision Guard: Ensure candidateKey is not already in existingKeySet
  while (existingKeySet.has(candidateKey.toUpperCase())) {
    nextNum++;
    candidateKey = `${prefix}${nextNum < 10 ? `0${nextNum}` : nextNum}`;
  }

  return candidateKey;
}

export interface FileValidationError {
  title: string;
  problem: string;
  fileName?: string;
  fileSize?: string;
  suggestedFix: string;
}

export const TestCaseImporter: React.FC<TestCaseImporterProps> = ({
  moduleName,
  currentUser,
  existingCases = [],
  mode = 'cases',
  onImportCases,
  onClose
}) => {
  const [activeMode, setActiveMode] = useState<'upload' | 'manual'>('upload');
  
  // User Attribution & Assignment Fields (Pre-filled with logged-in user name)
  const [createdBy, setCreatedBy] = useState(currentUser.name);
  const [assignedTo, setAssignedTo] = useState('');

  // Diagnostic Error State
  const [diagnosticError, setDiagnosticError] = useState<FileValidationError | null>(null);

  // Manual Form Fields with Dynamic Next TC - ID
  const [key, setKey] = useState(() => generateNextTcId(moduleName, existingCases));
  const [name, setName] = useState('');
  const [objective, setObjective] = useState('');
  const [precondition, setPrecondition] = useState('');
  const [testSteps, setTestSteps] = useState('Step 1: Open page.\nStep 2: Enter test values.\nStep 3: Click Submit.\nStep 4: Inspect outcome.');
  const [expectedResult, setExpectedResult] = useState('');
  const [type, setType] = useState<'Positive' | 'Negative'>('Positive');

  const canManageCases = currentUser.role === 'Admin' || currentUser.role === 'QA Lead' || currentUser.role === 'QA Engineer';

  // Handle Manual Case Submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageCases) {
      alert(`Role Restriction: User role '${currentUser.role}' cannot add manual test cases. Only Admin or QA Lead roles can save test cases.`);
      return;
    }
    if (!createdBy.trim() || !assignedTo.trim()) {
      return alert('Validation Error: "Author / Added By" and "Assign Default Tester" are required fields.');
    }
    if (!name.trim() || !expectedResult.trim()) {
      return alert('Validation Error: Please fill in Scenario Name and Expected Result.');
    }

    const newCase: TestCase = {
      key: key.trim().toUpperCase(),
      folder: `/${moduleName}`,
      name: name.trim(),
      objective: objective.trim() || `Verify ${name.trim()} behavior in ${moduleName}`,
      precondition: precondition.trim() || 'User is logged into application portal.',
      testSteps: testSteps.trim(),
      testData: 'Standard QA Payload',
      expectedResult: expectedResult.trim(),
      status: 'Approved',
      priority: 'High',
      category: moduleName,
      type,
      sourceFile: 'Manual Entry',
      createdBy: createdBy.trim(),
      createdAt: new Date().toLocaleString(),
      assignedTo: assignedTo.trim()
    };

    onImportCases([newCase]);
    onClose();
  };

  // Handle File Upload Inspection
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDiagnosticError(null);
    if (!canManageCases) {
      alert(`Role Restriction: User role '${currentUser.role}' cannot upload test case reference files. Only Admin or QA Lead roles can upload test suites.`);
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    if (!createdBy.trim() || !assignedTo.trim()) {
      alert('Validation Error: Please specify "Author / Added By" and "Assign Default Tester" before selecting a file.');
      e.target.value = '';
      return;
    }

    const fileName = file.name;
    const fileSizeMB = file.size / (1024 * 1024);

    // Rule 1: Reject unsupported file extensions (.pdf, .png, .docx, .zip)
    const validExtensions = ['.csv', '.xlsx', '.json'];
    const fileExt = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(fileExt)) {
      setDiagnosticError({
        title: 'Unsupported File Extension Detected',
        problem: `Uploaded file '${fileName}' is an invalid ${fileExt.toUpperCase()} document. TestGenie only accepts structured QA spreadsheets (.csv, .xlsx) or JSON definitions.`,
        fileName,
        fileSize: `${fileSizeMB.toFixed(2)} MB`,
        suggestedFix: 'Please convert your test suite document into a standard .csv or .xlsx spreadsheet file with columns: Scenario Title, Test Steps, Expected Result.'
      });
      e.target.value = '';
      return;
    }

    // Rule 2: Reject files > 5MB
    if (fileSizeMB > 5) {
      setDiagnosticError({
        title: 'File Size Exceeds 5MB Safety Limit',
        problem: `File '${fileName}' size is ${fileSizeMB.toFixed(2)} MB, which exceeds the maximum allowable 5MB payload limit.`,
        fileName,
        fileSize: `${fileSizeMB.toFixed(2)} MB`,
        suggestedFix: 'Please split your large test matrix file into smaller module-wise CSV/XLSX files under 5MB.'
      });
      e.target.value = '';
      return;
    }

    // Parse CSV file content
    if (fileExt === '.csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors && results.errors.length > 0) {
            setDiagnosticError({
              title: 'CSV Parsing Error & Syntax Corruption',
              problem: `Corrupted CSV syntax detected on line ${results.errors[0].row}: ${results.errors[0].message}`,
              fileName,
              fileSize: `${fileSizeMB.toFixed(2)} MB`,
              suggestedFix: 'Open the CSV file in Excel or VS Code, verify quotes are closed properly, and save as UTF-8 CSV.'
            });
            return;
          }

          const parsedRows: any[] = results.data;
          if (parsedRows.length === 0) {
            setDiagnosticError({
              title: 'Empty Test File (0 Rows Found)',
              problem: `Uploaded CSV file '${fileName}' contains 0 data rows.`,
              fileName,
              fileSize: `${fileSizeMB.toFixed(2)} MB`,
              suggestedFix: 'Ensure your CSV spreadsheet contains at least 1 test case scenario row below column headers.'
            });
            return;
          }

          const accumulatedInBatch: TestCase[] = [];
          const importedCases: TestCase[] = parsedRows.map((row, idx) => {
            const rawTitle = row['Test Case Name'] || row['Test Case'] || row['Scenario Title'] || row['Scenario'] || row['Title'] || row['Name'] || `Test Scenario ${idx + 1}`;
            const cleanName = cleanTestCaseTitle(rawTitle);

            // Extract Key from title [HOL-T01] or Key columns
            let rawKey = row['Key'] || row['Issue Key'] || row['Test Case Key'] || row['Scenario ID'] || row['ID'];
            const matchInTitle = String(rawTitle).match(/^\[([A-Z0-9]+-[A-Z0-9]+)\]/i);
            if (matchInTitle && matchInTitle[1]) {
              rawKey = matchInTitle[1].toUpperCase();
            }

            // Smart Upsert Check: Match against existing cases by Key OR by Clean Title
            const existingMatch = [...existingCases, ...accumulatedInBatch].find(c =>
              (rawKey && c.key?.trim().toLowerCase() === String(rawKey).trim().toLowerCase()) ||
              (c.name?.trim().toLowerCase() === cleanName.trim().toLowerCase())
            );

            if (existingMatch) {
              rawKey = existingMatch.key;
            } else if (!rawKey) {
              rawKey = generateNextTcId(moduleName, [...existingCases, ...accumulatedInBatch]);
            }

            const caseObj: TestCase = {
              key: String(rawKey).trim().toUpperCase(),
              folder: row['Folder Path'] || row['Folder'] || `/${moduleName}`,
              name: cleanName,
              objective: cleanTestCaseTitle(row['Objective'] || row['Scenario Description'] || row['Description'] || row['Preconditions']) || cleanName,
              precondition: String(row['Precondition'] || row['Preconditions'] || row['Prerequisite'] || 'User logged into HR portal.').trim(),
              testSteps: String(row['Step Description'] || row['Step description'] || row['Step'] || row['Test Steps (High Level)'] || row['Test Steps'] || row['Test step'] || row['Test Step'] || row['Steps'] || row['Instructions'] || row['Action'] || 'Step 1: Perform action.\nStep 2: Inspect outcome.').trim(),
              testData: String(row['Test Data'] || row['Data'] || 'Standard QA Payload').trim(),
              expectedResult: String(row['Expected Result'] || row['Expected result'] || row['Expected'] || row['Expected Outcome'] || 'Verified successfully.').trim(),
              status: row['Status'] || 'Approved',
              priority: row['Priority'] || 'High',
              category: moduleName,
              type: (row['Type'] || (cleanName.toLowerCase().includes('negative') || cleanName.toLowerCase().includes('reject') || cleanName.toLowerCase().includes('invalid') ? 'Negative' : 'Positive')) as 'Positive' | 'Negative',
              sourceFile: fileName,
              createdBy: createdBy.trim(),
              createdAt: new Date().toLocaleString(),
              assignedTo: assignedTo.trim()
            };

            accumulatedInBatch.push(caseObj);
            return caseObj;
          });

          onImportCases(importedCases);
          onClose();
        }
      });
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              {mode === 'scenarios' ? `Add / Upload Test Scenarios — ${moduleName}` : `Add / Upload Test Cases — ${moduleName}`}
            </h3>
            <p className="text-xs text-slate-500">
              {mode === 'scenarios' ? `Upload CSV/XLSX reference files or add manual test scenarios.` : `Upload CSV/XLSX reference files or add manual test cases.`}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 text-slate-400 font-bold">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diagnostic Error Banner */}
        {diagnosticError && (
          <div className="p-4 bg-rose-50 border-b border-rose-200 space-y-2 text-xs">
            <div className="flex items-center space-x-2 text-rose-900 font-extrabold">
              <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span>{diagnosticError.title}</span>
            </div>
            <p className="text-rose-800 leading-relaxed font-medium pl-7">{diagnosticError.problem}</p>
            <div className="bg-white/80 p-2.5 rounded-xl border border-rose-200 text-rose-900 font-mono text-[11px] ml-7">
              💡 <strong>Suggested Fix:</strong> {diagnosticError.suggestedFix}
            </div>
          </div>
        )}

        {/* Mandatory User Attribution Fields */}
        <div className="p-4 bg-indigo-50/50 border-b border-indigo-100 grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Author / Added By *</label>
            <input
              type="text"
              value={createdBy}
              onChange={e => setCreatedBy(e.target.value)}
              placeholder="e.g. Suresh QA Lead"
              required
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Assign Default Tester *</label>
            <input
              type="text"
              value={assignedTo}
              onChange={e => setAssignedTo(e.target.value)}
              placeholder="e.g. Anand QA Engineer"
              required
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
            />
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center space-x-2">
          <button
            onClick={() => setActiveMode('upload')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeMode === 'upload'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            📁 Upload Reference File (.csv, .xlsx)
          </button>
          <button
            onClick={() => setActiveMode('manual')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeMode === 'manual'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            {mode === 'scenarios' ? `✍️ Add Manual Test Scenario` : `✍️ Add Manual Test Case`}
          </button>
        </div>

        {/* Content Body */}
        {activeMode === 'upload' ? (
          <div className="p-8 text-center space-y-4 flex-1 flex flex-col justify-center">
            <div className="border-2 border-dashed border-indigo-200 bg-indigo-50/30 rounded-3xl p-8 hover:border-indigo-400 transition-all cursor-pointer">
              <Upload className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
              <h4 className="text-base font-extrabold text-slate-900">Choose Reference File to Import</h4>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Supports .csv, .xlsx, or .json test suite files (Max 5MB payload limit).
              </p>
              
              <label className="inline-flex items-center px-5 py-2.5 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md cursor-pointer transition-all active:scale-95">
                Browse CSV/XLSX File
                <input type="file" accept=".csv,.xlsx,.json" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} className="p-6 space-y-3 text-xs overflow-y-auto flex-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">TC - ID *</label>
                <input
                  type="text"
                  value={key}
                  onChange={e => setKey(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold"
                />
              </div>

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
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {mode === 'scenarios' ? 'Scenario Title *' : 'Manual Test Cases *'}
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Verify Contact Email format validation"
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Preconditions</label>
              <input
                type="text"
                value={precondition}
                onChange={e => setPrecondition(e.target.value)}
                placeholder="e.g. User logged into portal and on Step 1 Branding"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Test Steps *</label>
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
                placeholder="e.g. Displays inline validation error 'Invalid email'."
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
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow-md"
              >
                {mode === 'scenarios' ? 'Save Manual Test Scenario' : 'Save Manual Test Case'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>,
    document.body
  );
};
