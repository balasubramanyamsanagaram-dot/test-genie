export type TestExecutionStatus = 'PASSED' | 'FAILED' | 'BLOCKED' | 'UNEXECUTED';

export type UserRole = 'Admin' | 'QA Lead' | 'QA Engineer' | 'Developer' | 'Viewer' | 'Auditor';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  avatarColor: string;
}

export const REGISTERED_ENTERPRISE_USERS: UserProfile[] = [
  {
    id: 'user-admin',
    name: 'Suresh Kumar',
    email: 'suresh.admin@acmecorp.com',
    password: 'Admin@123',
    role: 'Admin',
    avatarColor: 'bg-rose-600'
  },
  {
    id: 'user-qa-lead',
    name: 'Priya Sharma',
    email: 'priya.qalead@acmecorp.com',
    password: 'Lead@123',
    role: 'QA Lead',
    avatarColor: 'bg-indigo-600'
  },
  {
    id: 'user-qa-eng',
    name: 'Anand V',
    email: 'anand.qa@acmecorp.com',
    password: 'QAEng@123',
    role: 'QA Engineer',
    avatarColor: 'bg-emerald-600'
  },
  {
    id: 'user-dev',
    name: 'Rahul Dev',
    email: 'rahul.dev@acmecorp.com',
    password: 'Dev@123',
    role: 'Developer',
    avatarColor: 'bg-purple-600'
  },
  {
    id: 'user-auditor',
    name: 'Kavita Singh',
    email: 'kavita.auditor@acmecorp.com',
    password: 'Audit@123',
    role: 'Auditor',
    avatarColor: 'bg-amber-600'
  }
];

export interface ProjectModule {
  id: string;
  name: string;
  frontendPath: string;
  backendPath: string;
  category: string;
  filesCount: number;
  astNodesCount: number;
  testCasesCount: number;
  positiveCount: number;
  negativeCount: number;
  coveragePercentage: number;
}

export interface EnterpriseProject {
  id: string;
  name: string;
  key: string; // e.g. "HRM", "MOB", "FIN"
  description: string;
  modules: ProjectModule[];
  createdAt?: string;
  createdBy?: string;
}

export const DEFAULT_ENTERPRISE_PROJECTS: EnterpriseProject[] = [
  {
    id: 'proj-hrm',
    name: 'HRM Genie V2',
    key: 'HRM',
    description: 'Enterprise Human Resource & Payroll Management Suite',
    createdAt: '2026-08-01',
    createdBy: 'Suresh Kumar',
    modules: [
      {
        id: 'mod-holidays',
        name: 'Holidays & Leave Management',
        frontendPath: 'apps/web/src/features/organization/holidays',
        backendPath: 'libs/holidays/src',
        category: 'HRM',
        filesCount: 12,
        astNodesCount: 142,
        testCasesCount: 106,
        positiveCount: 65,
        negativeCount: 41,
        coveragePercentage: 100
      },
      {
        id: 'mod-onboarding',
        name: 'Employee Onboarding & Verification',
        frontendPath: 'apps/web/src/features/onboarding',
        backendPath: 'libs/onboarding/src',
        category: 'HRM',
        filesCount: 18,
        astNodesCount: 185,
        testCasesCount: 88,
        positiveCount: 52,
        negativeCount: 36,
        coveragePercentage: 100
      },
      {
        id: 'mod-payroll',
        name: 'Payroll Engine & Compensation',
        frontendPath: 'apps/web/src/features/payroll',
        backendPath: 'libs/payroll/src',
        category: 'HRM',
        filesCount: 22,
        astNodesCount: 240,
        testCasesCount: 95,
        positiveCount: 60,
        negativeCount: 35,
        coveragePercentage: 100
      }
    ]
  }
];

export interface TestCase {
  key: string;
  folder: string;
  name: string;
  objective: string;
  precondition: string;
  testSteps: string; // Formatted with Step 1, Step 2, Step 3, Step 4
  testData: string;
  expectedResult: string;
  status: 'Draft' | 'Approved' | 'Ready for Review' | string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low' | 'Normal' | string;
  category: string;
  type: 'Positive' | 'Negative' | 'Boundary' | 'Security' | 'Permission' | string;
  sourceFile: string;
  backendTrace?: string;
  
  // User Attribution & Assignment Extensions
  createdBy?: string;
  createdAt?: string;
  assignedTo?: string;
}

export interface JiraBug {
  issueKey: string; // e.g. HRM-1042
  issueUrl: string;
  summary: string;
  description: string;
  severity: 'Blocker' | 'Critical' | 'Major' | 'Minor';
  projectKey: string; // e.g. HRM
  assignedDeveloper: string;
  raisedBy: string;
  raisedAt: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed' | 'Re-opened';
  
  // Re-open Audit Extensions
  reopenedBy?: string;
  reopenedAt?: string;
  reopenNotes?: string;

  // Visual Defect Evidence Extensions
  screenshotUrl?: string;
  videoUrl?: string;
  evidenceName?: string;
}

export interface TestCycleItem {
  id: string;
  testCase: TestCase;
  executionStatus: TestExecutionStatus;
  
  // Timestamps & User Attributions
  assignedTo?: string;
  assignedAt?: string;
  executedBy?: string;
  executedAt?: string;
  executionType?: 'Manual' | 'Automated';
  
  // Defect Tracking
  defectId?: string;
  bugNotes?: string;
  jiraBug?: JiraBug; // Primary bug
  jiraBugs?: JiraBug[]; // Multi-defect history array
}

export interface TestCycle {
  id: string;
  projectId?: string;
  name: string;
  version: string; // Release Version e.g. v2.4.0
  environment: 'Staging' | 'Production' | 'UAT' | 'QA-Dev' | 'Dev';
  moduleName: string;
  assignedTester: string;
  createdBy?: string;
  createdAt: string;
  items: TestCycleItem[];
}

export interface AuditCertificate {
  generatedAt: string;
  moduleName: string;
  totalAstNodes: number;
  mappedTestCases: number;
  coveragePercentage: number;
  unmappedNodesCount: number;
  isZeroGapCertified: boolean;
}

export interface ExecutionReportMetrics {
  totalCases: number;
  passedCount: number;
  failedCount: number;
  blockedCount: number;
  unexecutedCount: number;
  passRatePercentage: number;
  defectCount: number;
}

export interface CycleExecutionReport extends ExecutionReportMetrics {
  cycleId: string;
  cycleName: string;
  moduleName?: string;
  generatedAt: string;
}
