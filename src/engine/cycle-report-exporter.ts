import { TestCycle, CycleExecutionReport } from '../types';

export function calculateCycleReport(cycle: TestCycle): CycleExecutionReport {
  const total = cycle.items.length;
  const passed = cycle.items.filter(i => i.executionStatus === 'PASSED').length;
  const failed = cycle.items.filter(i => i.executionStatus === 'FAILED').length;
  const blocked = cycle.items.filter(i => i.executionStatus === 'BLOCKED').length;
  const unexecuted = cycle.items.filter(i => i.executionStatus === 'UNEXECUTED').length;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
  const defects = cycle.items.filter(i => i.defectId || i.bugNotes).length;

  return {
    cycleId: cycle.id,
    cycleName: cycle.name,
    generatedAt: new Date().toISOString(),
    totalCases: total,
    passedCount: passed,
    failedCount: failed,
    blockedCount: blocked,
    unexecutedCount: unexecuted,
    passRatePercentage: passRate,
    defectCount: defects
  };
}

export function generateCycleCSVReport(cycle: TestCycle): string {
  const headers = [
    'Test Cycle ID',
    'Test Cycle Name',
    'Target Module',
    'Test Case Key',
    'Test Case Name',
    'Folder Path',
    'Category',
    'Priority',
    'Execution Status',
    'Tester',
    'Executed At',
    'Defect ID',
    'Bug Notes / Observations'
  ];

  const rows = cycle.items.map(item => [
    `"${cycle.id}"`,
    `"${cycle.name}"`,
    `"${cycle.moduleName}"`,
    `"${item.testCase.key}"`,
    `"${item.testCase.name.replace(/"/g, '""')}"`,
    `"${item.testCase.folder}"`,
    `"${item.testCase.category}"`,
    `"${item.testCase.priority}"`,
    `"${item.executionStatus}"`,
    `"${item.executedBy || cycle.assignedTester}"`,
    `"${item.executedAt || 'N/A'}"`,
    `"${item.defectId || ''}"`,
    `"${(item.bugNotes || '').replace(/"/g, '""')}"`
  ]);

  return '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function generateCycleMarkdownReport(cycle: TestCycle): string {
  const report = calculateCycleReport(cycle);

  return `# 📊 Executive Test Cycle Execution Report: ${cycle.name}

**Cycle ID**: \`${cycle.id}\`  
**Target Module**: ${cycle.moduleName}  
**Environment**: ${cycle.environment} | **Version**: ${cycle.version}  
**Assigned Lead**: ${cycle.assignedTester}  
**Report Generated**: ${new Date().toLocaleString()}  

---

## 📈 Execution Progress & Metrics Summary

| Metric Dimension | Value | Percentage / Status |
| :--- | :---: | :---: |
| 🎯 **Total Test Cases** | **${report.totalCases}** | **100%** |
| ✅ **Passed Test Cases** | **${report.passedCount}** | **${report.passRatePercentage}% Pass Rate** |
| 🛑 **Failed Test Cases** | **${report.failedCount}** | **${Math.round((report.failedCount / Math.max(1, report.totalCases)) * 100)}% Defect Rate** |
| ⚠️ **Blocked Test Cases** | **${report.blockedCount}** | **${Math.round((report.blockedCount / Math.max(1, report.totalCases)) * 100)}% Blocked** |
| ⏳ **Unexecuted Remaining** | **${report.unexecutedCount}** | **${Math.round((report.unexecutedCount / Math.max(1, report.totalCases)) * 100)}% Remaining** |
| 🐞 **Total Defects Logged** | **${report.defectCount}** | **Action Required** |

---

## 🛑 Failed & Blocked Defect Log

${cycle.items.filter(i => i.executionStatus === 'FAILED' || i.executionStatus === 'BLOCKED').length === 0 ? '*Zero failed or blocked test cases in this cycle!*' : ''}

${cycle.items.filter(i => i.executionStatus === 'FAILED' || i.executionStatus === 'BLOCKED').map(item => `
### [${item.executionStatus}] ${item.testCase.key} — ${item.testCase.name}
- **Folder**: \`${item.testCase.folder}\` | **Priority**: \`${item.testCase.priority}\`
- **Defect ID**: \`${item.defectId || 'DEFECT-PENDING'}\`
- **Bug Notes / Observations**: ${item.bugNotes || 'No notes attached.'}
- **Execution Step**:
\`\`\`
${item.testCase.testSteps}
\`\`\`
- **Expected Outcome**: ${item.testCase.expectedResult}
`).join('\n---\n')}

---

## 📋 Full Test Case Execution Log

${cycle.items.map(item => `
* [${item.executionStatus === 'PASSED' ? '✅ PASS' : item.executionStatus === 'FAILED' ? '🛑 FAIL' : item.executionStatus === 'BLOCKED' ? '⚠️ BLOCK' : '⏳ UNEXEC'}] **${item.testCase.key}**: ${item.testCase.name}
`).join('\n')}
`;
}
