import { TestCase, AuditCertificate } from '../types';

export function generateZephyrScaleCSV(testCases: TestCase[]): string {
  const headers = [
    'Key',
    'Folder',
    'Name',
    'Objective',
    'Precondition',
    'Test Steps',
    'Expected Result',
    'Status',
    'Priority',
    'Category',
    'Type',
    'Source File',
    'Added By'
  ];

  const rows = testCases.map(tc => [
    escapeCSV(tc.key),
    escapeCSV(tc.folder),
    escapeCSV(tc.name),
    escapeCSV(tc.objective),
    escapeCSV(tc.precondition),
    escapeCSV(tc.testSteps),
    escapeCSV(tc.expectedResult),
    escapeCSV(tc.status),
    escapeCSV(tc.priority),
    escapeCSV(tc.category),
    escapeCSV(tc.type),
    escapeCSV(tc.sourceFile),
    escapeCSV(tc.createdBy || 'QA Lead')
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function exportToZephyrCSV(testCases: TestCase[], filename = 'zephyr_test_cases.csv'): void {
  const csvContent = generateZephyrScaleCSV(testCases);
  triggerDownload(csvContent, filename, 'text/csv;charset=utf-8;');
}

export function exportCoverageCertificate(certificate: AuditCertificate, testCases: TestCase[], filename = 'qa_audit_certificate.md'): void {
  const mdContent = generateAuditCertificateMarkdown(certificate, testCases);
  triggerDownload(mdContent, filename, 'text/markdown;charset=utf-8;');
}

export function exportToPlaywrightScript(testCases: TestCase[], filename = 'e2e_tests.spec.ts'): void {
  const scriptContent = `// Auto-generated Playwright Test Suite
import { test, expect } from '@playwright/test';

${testCases.map(tc => `
test('${tc.key} - ${tc.name.replace(/'/g, "\\'")}', async ({ page }) => {
  // Objective: ${tc.objective}
  // ${tc.testSteps.replace(/\n/g, '\n  // ')}
});`).join('\n')}
`;
  triggerDownload(scriptContent, filename, 'text/plain;charset=utf-8;');
}

export function generateAuditCertificateMarkdown(
  certificate: AuditCertificate,
  testCases: TestCase[]
): string {
  return `# 🛡️ QA Audit Certificate — ${certificate.moduleName}

**Generated At**: ${new Date(certificate.generatedAt).toLocaleString()}  
**Module Name**: ${certificate.moduleName}  
**Total Mapped Scenarios**: ${certificate.mappedTestCases}  
**Compliance**: ${certificate.isZeroGapCertified ? '100% Certified' : 'In Progress'}

---

## Executive Summary

- **Total Test Cases**: ${testCases.length}
- **Positive Scenarios**: ${testCases.filter(c => c.type === 'Positive').length}
- **Negative / Validation Scenarios**: ${testCases.filter(c => c.type === 'Negative').length}

---

## Test Repository Overview

| Key | Title | Category | Type | Author |
| :--- | :--- | :--- | :--- | :--- |
${testCases.map(tc => `| \`${tc.key}\` | ${tc.name} | ${tc.category} | **${tc.type}** | ${tc.createdBy || 'QA Lead'} |`).join('\n')}

---
*Certified by TestGenie Enterprise QA Management Portal*
`;
}

export function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeCSV(field: string): string {
  if (field === null || field === undefined) return '""';
  const str = String(field);
  return `"${str.replace(/"/g, '""')}"`;
}
