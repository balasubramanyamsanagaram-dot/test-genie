import React from 'react';
import { TestCase, AuditCertificate } from '../types';
import { X, FileSpreadsheet, Code, FileText, Download } from 'lucide-react';
import { exportToZephyrCSV, exportToPlaywrightScript, exportCoverageCertificate } from '../engine/exporters';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  testCases: TestCase[];
  certificate: AuditCertificate;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  testCases,
  certificate
}) => {
  if (!isOpen) return null;

  const handleExportZephyr = () => {
    exportToZephyrCSV(testCases, `${certificate.moduleName}_Zephyr_Scale_Test_Cases.csv`);
  };

  const handleExportPlaywright = () => {
    exportToPlaywrightScript(testCases, `${certificate.moduleName}_Playwright_E2E_Suite.spec.ts`);
  };

  const handleExportCertificate = () => {
    exportCoverageCertificate(certificate, testCases, `${certificate.moduleName}_AST_Coverage_Certificate.md`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-xl rounded-3xl p-6 border border-slate-200 shadow-2xl relative glow-indigo">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center">
            <Download className="w-5 h-5 text-indigo-600 mr-2" />
            Export Test Genie Artifacts
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Download production-ready QA artifacts for {certificate.moduleName}.
          </p>
        </div>

        <div className="space-y-3">
          
          {/* Zephyr Scale CSV Export */}
          <button
            onClick={handleExportZephyr}
            className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-indigo-50/50 hover:border-indigo-300 transition-all text-left group flex items-start space-x-4"
          >
            <div className="p-3 rounded-xl bg-indigo-100 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Zephyr Scale Jira CSV
                </span>
                <span className="text-[10px] font-mono font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                  .CSV
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Import 100% formatted test cases with 4-step instructions, priorities, and status into Jira Zephyr Scale.
              </p>
            </div>
          </button>

          {/* Playwright E2E Script Export */}
          <button
            onClick={handleExportPlaywright}
            className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-purple-50/50 hover:border-purple-300 transition-all text-left group flex items-start space-x-4"
          >
            <div className="p-3 rounded-xl bg-purple-100 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition-all">
              <Code className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-slate-900 group-hover:text-purple-600 transition-colors">
                  Playwright E2E Automation Suite
                </span>
                <span className="text-[10px] font-mono font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                  .TS
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Export stubbed Playwright TypeScript test cases with numbered 4-step action hooks for automated test execution.
              </p>
            </div>
          </button>

          {/* Audit Certificate Markdown Export */}
          <button
            onClick={handleExportCertificate}
            className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-emerald-50/50 hover:border-emerald-300 transition-all text-left group flex items-start space-x-4"
          >
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <FileText className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-600 transition-colors">
                  QA Audit Certificate Report
                </span>
                <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                  .MD
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Download a clean Markdown audit certificate documenting mapped test cases, positive/negative breakdown, and compliance status.
              </p>
            </div>
          </button>

        </div>

      </div>
    </div>
  );
};
