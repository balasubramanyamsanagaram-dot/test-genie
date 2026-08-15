import React, { useState, useMemo, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { TestCaseTable } from './components/TestCaseTable';
import { ExportModal } from './components/ExportModal';
import { TestCycleManager } from './components/TestCycleManager';
import { CycleExecutionBoard } from './components/CycleExecutionBoard';
import { TestCaseImporter } from './components/TestCaseImporter';
import { ModuleCardsGrid } from './components/ModuleCardsGrid';
import { LoginGateway } from './components/LoginGateway';
import { NewProjectModal } from './components/NewProjectModal';
import { CreateEditBugModal } from './components/CreateEditBugModal';
import { DEFAULT_HOLIDAYS_TEST_CASES, DEFAULT_PRELOADED_TEST_CYCLES, normalizeTestCase, cleanTestCaseTitle } from './engine/default-data';
import { AuditCertificate, TestCase, TestCycle, TestCycleItem, TestExecutionStatus, ProjectModule, JiraBug, UserProfile, REGISTERED_ENTERPRISE_USERS, EnterpriseProject, DEFAULT_ENTERPRISE_PROJECTS, AgentExecutionRun } from './types';
import { ShieldCheck, FileCheck2, Upload, RotateCw, PlaySquare, Plus, FolderPlus, Layers, Building2, Bug, Settings, Trash2, CheckCircle2, ShieldAlert, RefreshCw, Lock, Sparkles, Terminal, Zap, Code2, Eye, XCircle, ArrowRight } from 'lucide-react';

import { UserManagementModal } from './components/UserManagementModal';
import { ConfirmModal } from './components/ConfirmModal';
import { AutomationDrawer } from './components/AutomationDrawer';
import { AutomationSimulator } from './components/AutomationSimulator';

import { getFeatureFlags, FeatureFlags, isFeatureActive } from './engine/feature-flags';
import { LabsControlModal } from './components/LabsControlModal';
import { SpeedRunExecutionBoard } from './components/SpeedRunExecutionBoard';
import { StoryToTestCaseModal } from './components/StoryToTestCaseModal';
import { PlaywrightCodeDrawer } from './components/PlaywrightCodeDrawer';
import { PassEvidenceUploadModal } from './components/PassEvidenceUploadModal';
import { getIDBItem, setIDBItem } from './utils/idbStorage';

const STORAGE_KEY_PROJECTS = 'test_genie_projects_v2';
const STORAGE_KEY_SEL_PROJECT = 'test_genie_selected_project_v2';
const STORAGE_KEY_SEL_MODULE = 'test_genie_selected_module_v2';
const STORAGE_KEY_CASES = 'test_genie_custom_cases_v2';
const STORAGE_KEY_CYCLES = 'test_genie_test_cycles_v2';
const STORAGE_KEY_USER = 'test_genie_authenticated_user_v1';
const STORAGE_KEY_USERS = 'registered_enterprise_users_v2';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'matrix' | 'repository' | 'cycles' | 'execution' | 'bugs' | 'settings'>(() => {
    try {
      const saved = localStorage.getItem('test_genie_active_tab');
      if (saved && ['dashboard', 'matrix', 'repository', 'cycles', 'execution', 'bugs', 'settings'].includes(saved)) {
        return saved as any;
      }
    } catch (e) {}
    return 'dashboard';
  });

  useEffect(() => {
    try {
      localStorage.setItem('test_genie_active_tab', activeTab);
    } catch (e) {}
  }, [activeTab]);
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');

  // Feature Flags Engine State & Stealth Modals
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>(getFeatureFlags());
  const [isLabsModalOpen, setIsLabsModalOpen] = useState(false);
  const [isSpeedRunOpen, setIsSpeedRunOpen] = useState(false);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [selectedCodeCase, setSelectedCodeCase] = useState<TestCase | null>(null);

  // Keyboard Shortcuts for Stealth Labs (Cmd+Shift+L)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isCmdShiftL = (e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'l' || e.key === 'L' || e.code === 'KeyL');
      
      if (isCmdShiftL) {
        e.preventDefault();
        setIsLabsModalOpen(prev => !prev);
      }
    };

    const handleFlagsUpdated = (e: any) => {
      if (e.detail) setFeatureFlags(e.detail);
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    window.addEventListener('genie_feature_flags_updated', handleFlagsUpdated);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('genie_feature_flags_updated', handleFlagsUpdated);
    };
  }, []);

  const [selectedAutomateCase, setSelectedAutomateCase] = useState<TestCase | null>(null);
  const [isAutomationDrawerOpen, setIsAutomationDrawerOpen] = useState(false);
  const [automationParams, setAutomationParams] = useState<{
    isOpen: boolean;
    startingUrl: string;
    deviceProfile: string;
    browser: string;
    isHeaded: boolean;
    cycleId?: string;
    readOnlyMode?: boolean;
    initialStatus?: 'PASSED' | 'FAILED';
    initialScreenshotUrl?: string;
    initialStepRuns?: any[];
  } | null>(null);

  const [globalAlert, setGlobalAlert] = useState<{ isOpen: boolean; message: string } | null>(null);
  const [promptConfig, setPromptConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    defaultValue: string;
    placeholder: string;
    onConfirm: (value: string) => void;
  } | null>(null);

  // Pass Evidence Upload Modal State
  const [passEvidenceModalConfig, setPassEvidenceModalConfig] = useState<{
    isOpen: boolean;
    cycleId: string;
    itemKey: string;
    itemTitle: string;
  } | null>(null);

  // Synchronous-safe window.alert override for styled custom notifications
  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (message: string) => {
      setGlobalAlert({ isOpen: true, message: String(message) });
    };
    return () => {
      window.alert = originalAlert;
    };
  }, []);

  // Registered Users list with LocalStorage persistence
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return REGISTERED_ENTERPRISE_USERS;
  });

  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);

  // Sync Users to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(registeredUsers));
    } catch (e) {}
  }, [registeredUsers]);

  const handleAddUser = (newUser: UserProfile) => {
    setRegisteredUsers(prev => [...prev, newUser]);
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
    setRegisteredUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedUser));
    }
  };

  const handleDeleteUser = (userId: string) => {
    setRegisteredUsers(prev => prev.filter(u => u.id !== userId));
  };

  // Authenticated Session State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null; // Require login gateway by default if no session exists
  });

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } catch (e) {}
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY_USER);
  };

  // Load Persisted Projects from localStorage
  const [projects, setProjects] = useState<EnterpriseProject[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROJECTS);
      if (saved) {
        let parsed: EnterpriseProject[] = JSON.parse(saved);
        parsed = parsed.filter(p => p.id !== 'proj-mobile' && p.id !== 'proj-fintech');
        return parsed;
      }
    } catch (e) {}
    return DEFAULT_ENTERPRISE_PROJECTS;
  });

  // Selected Project ID
  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
    const savedId = localStorage.getItem(STORAGE_KEY_SEL_PROJECT);
    if (savedId && savedId !== 'proj-mobile' && savedId !== 'proj-fintech') {
      return savedId;
    }
    return DEFAULT_ENTERPRISE_PROJECTS[0].id;
  });

  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  // Sync Projects & Selected Project to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
    } catch (e) {}
  }, [projects]);

  useEffect(() => {
    if (selectedProjectId) {
      localStorage.setItem(STORAGE_KEY_SEL_PROJECT, selectedProjectId);
    }
  }, [selectedProjectId]);

  // Active Project Object
  const activeProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId) || projects[0];
  }, [projects, selectedProjectId]);

  // Selected Module ID within Active Project
  const [selectedModuleId, setSelectedModuleId] = useState<string>(() => {
    try {
      const savedModuleId = localStorage.getItem(STORAGE_KEY_SEL_MODULE);
      if (savedModuleId && activeProject.modules.some(m => m.id === savedModuleId)) {
        return savedModuleId;
      }
    } catch (e) {}
    const activeMod = activeProject.modules[0];
    return activeMod ? activeMod.id : '';
  });

  // Sync selected module when active project changes
  useEffect(() => {
    if (activeProject.modules.length > 0) {
      const exists = activeProject.modules.some(m => m.id === selectedModuleId);
      if (!exists) {
        setSelectedModuleId(activeProject.modules[0].id);
      } else {
        localStorage.setItem(STORAGE_KEY_SEL_MODULE, selectedModuleId);
      }
    } else {
      setSelectedModuleId('');
      localStorage.removeItem(STORAGE_KEY_SEL_MODULE);
    }
  }, [activeProject, selectedModuleId]);

  // Load Persisted Custom Test Cases per module from localStorage (Pre-loading 100 Holidays Master Cases)
  const [customModuleCases, setCustomModuleCases] = useState<Record<string, TestCase[]>>(() => {
    let casesMap: Record<string, TestCase[]> = {};
    let hasSavedData = false;
    try {
      const savedV2 = localStorage.getItem(STORAGE_KEY_CASES);
      if (savedV2) {
        casesMap = JSON.parse(savedV2);
        hasSavedData = true;
      } else {
        const savedV1 = localStorage.getItem('test_genie_custom_cases_v1');
        if (savedV1) {
          casesMap = JSON.parse(savedV1);
          hasSavedData = true;
        }
      }
    } catch (e) {}

    // First time initializing (no localStorage key set at all)
    if (!hasSavedData) {
      casesMap['mod-holidays'] = DEFAULT_HOLIDAYS_TEST_CASES;
    }

    return casesMap;
  });

  // Load Persisted Test Cycles from localStorage (Backward Compatible)
  const [testCycles, setTestCycles] = useState<TestCycle[]>(() => {
    try {
      const savedV2 = localStorage.getItem(STORAGE_KEY_CYCLES);
      if (savedV2) {
        return JSON.parse(savedV2);
      }
      const savedV1 = localStorage.getItem('test_genie_test_cycles_v1');
      if (savedV1) {
        return JSON.parse(savedV1);
      }
    } catch (e) {}
    return DEFAULT_PRELOADED_TEST_CYCLES;
  });

  const [defectRegistry, setDefectRegistry] = useState<JiraBug[]>(() => {
    try {
      const saved = localStorage.getItem('test_genie_defect_registry_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        issueKey: 'BUG-3412',
        summary: 'Employee detail edit throws database timeout exception',
        severity: 'Critical',
        status: 'Open'
      },
      {
        issueKey: 'BUG-3408',
        summary: 'Leave approval email notification shows empty username link',
        severity: 'Major',
        status: 'Open'
      },
      {
        issueKey: 'BUG-3395',
        summary: 'Salary slip PDF export breaks layout when name is long',
        severity: 'Medium' as any,
        status: 'Resolved'
      }
    ];
  });

  // Hydration status guard to prevent initial fallback state from overwriting IndexedDB on page refresh
  const isHydratedRef = React.useRef(false);

  // Asynchronously hydrate state from IndexedDB on startup (survives browser refresh & large base64 screenshot payloads)
  useEffect(() => {
    let isMounted = true;
    async function hydrateFromIndexedDB() {
      try {
        const savedCycles = await getIDBItem<TestCycle[]>(STORAGE_KEY_CYCLES);
        if (savedCycles && savedCycles.length > 0 && isMounted) {
          const normalizedCycles = savedCycles.map(cycle => ({
            ...cycle,
            items: (cycle.items || []).map(item => ({
              ...item,
              testCase: normalizeTestCase(item.testCase)
            }))
          }));
          setTestCycles(normalizedCycles);
        }

        const savedCases = await getIDBItem<Record<string, TestCase[]>>(STORAGE_KEY_CASES);
        if (savedCases && isMounted) {
          const normalizedMap: Record<string, TestCase[]> = {};
          Object.keys(savedCases).forEach(modId => {
            normalizedMap[modId] = (savedCases[modId] || []).map(normalizeTestCase);
          });
          setCustomModuleCases(normalizedMap);
        }

        const savedBugs = await getIDBItem<JiraBug[]>('test_genie_defect_registry_v1');
        if (savedBugs && isMounted) {
          setDefectRegistry(savedBugs);
        }
      } catch (e) {
        console.warn('[IndexedDB] Hydration failed:', e);
      } finally {
        if (isMounted) {
          isHydratedRef.current = true;
        }
      }
    }
    hydrateFromIndexedDB();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!isHydratedRef.current) return;
    setIDBItem('test_genie_defect_registry_v1', defectRegistry);
    try {
      localStorage.setItem('test_genie_defect_registry_v1', JSON.stringify(defectRegistry));
    } catch (e) {}
  }, [defectRegistry]);

  const [isBugCreateEditModalOpen, setIsBugCreateEditModalOpen] = useState(false);
  const [bugToEdit, setBugToEdit] = useState<(JiraBug & { cycleId?: string; itemKey?: string; cycleName?: string }) | undefined>(undefined);

  const [activeCycleId, setActiveCycleId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('test_genie_active_cycle_id');
      if (saved) return saved;
    } catch (e) {}
    return '';
  });

  useEffect(() => {
    try {
      if (activeCycleId) {
        localStorage.setItem('test_genie_active_cycle_id', activeCycleId);
      }
    } catch (e) {}
  }, [activeCycleId]);

  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isImporterOpen, setIsImporterOpen] = useState<boolean>(false);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; visible: boolean } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type, visible: true });
  };

  useEffect(() => {
    if (toast?.visible) {
      const timer = setTimeout(() => {
        setToast(prev => prev ? { ...prev, visible: false } : null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Sync Custom Cases to IndexedDB + localStorage
  useEffect(() => {
    if (!isHydratedRef.current) return;
    setIDBItem(STORAGE_KEY_CASES, customModuleCases);
    try {
      localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(customModuleCases));
    } catch (e) {}
  }, [customModuleCases]);

  // Sync Test Cycles to IndexedDB + localStorage
  useEffect(() => {
    if (!isHydratedRef.current) return;
    setIDBItem(STORAGE_KEY_CYCLES, testCycles);
    try {
      const dataStr = JSON.stringify(testCycles);
      localStorage.setItem(STORAGE_KEY_CYCLES, dataStr);
    } catch (e) {
      console.warn('[LocalStorage] Quota warning (data safely preserved in IndexedDB):', e);
    }
  }, [testCycles]);

  // Sum up counts across all modules
  const dashboardStats = useMemo(() => {
    const modules = activeProject.modules;
    const totalModules = modules.length;
    
    let totalCases = 0;
    let totalPositive = 0;
    let totalNegative = 0;
    let totalBoundary = 0;
    let totalPermission = 0;
    
    modules.forEach(m => {
      const cases = customModuleCases[m.id] || [];
      totalCases += cases.length;
      
      cases.forEach(c => {
        const text = `${c.name} ${c.objective} ${c.testSteps}`.toLowerCase();
        if (c.type) {
          const typeLower = c.type.toLowerCase();
          if (typeLower.includes('pos')) totalPositive++;
          else if (typeLower.includes('neg') || typeLower.includes('validation')) totalNegative++;
          else if (typeLower.includes('bound') || typeLower.includes('limit')) totalBoundary++;
          else if (typeLower.includes('perm') || typeLower.includes('rbac')) totalPermission++;
          else totalPositive++;
        } else {
          if (text.includes('duplicate') || text.includes('error') || text.includes('invalid') || text.includes('fail') || text.includes('omit') || text.includes('missing') || text.includes('validation')) {
            totalNegative++;
          } else if (text.includes('boundary') || text.includes('limit') || text.includes('max') || text.includes('min')) {
            totalBoundary++;
          } else if (text.includes('permission') || text.includes('rbac') || text.includes('role') || text.includes('restrict')) {
            totalPermission++;
          } else {
            totalPositive++;
          }
        }
      });
    });

    const averageCoverage = totalModules > 0 
      ? Math.round(modules.reduce((acc, m) => acc + (m.coveragePercentage || 100), 0) / totalModules)
      : 100;

    const projCycles = testCycles.filter(c => !c.projectId || c.projectId === activeProject.id);
    const totalCycles = projCycles.length;

    // Compute dynamic failed items across active cycles
    const failedItems: Array<{ cycleId: string; cycleName: string; item: TestCycleItem }> = [];
    projCycles.forEach(cycle => {
      (cycle.items || []).forEach(item => {
        if (item.executionStatus === 'FAILED') {
          failedItems.push({ cycleId: cycle.id, cycleName: cycle.name, item });
        }
      });
    });

    // Compute dynamic executions and pass rates
    const executedItems = projCycles.flatMap(c => c.items || []);
    const totalExecuted = executedItems.filter(item => item.executionStatus !== 'UNEXECUTED').length;
    const passedCount = executedItems.filter(item => item.executionStatus === 'PASSED').length;
    const failedCount = executedItems.filter(item => item.executionStatus === 'FAILED').length;
    const blockedCount = executedItems.filter(item => item.executionStatus === 'BLOCKED').length;
    
    const passRate = totalExecuted > 0 ? Math.round((passedCount / totalExecuted) * 100) : 0;
    const executionsToday = totalExecuted;

    // Defect priority distribution (Mock bugs + dynamic cycle bugs)
    const dynamicBugs = executedItems.flatMap(item => item.jiraBugs || (item.jiraBug ? [item.jiraBug] : []));
    const regKeys = new Set(defectRegistry.map(b => b.issueKey));
    const filteredDynamics = dynamicBugs.filter(b => !regKeys.has(b.issueKey));
    const allBugs = [...defectRegistry, ...filteredDynamics];
    const totalDefects = allBugs.length;

    const critical = allBugs.filter(b => b.severity === 'Blocker' || b.severity === 'Critical').length;
    const high = allBugs.filter(b => b.severity === 'Major').length;
    const medium = allBugs.filter(b => b.severity !== 'Blocker' && b.severity !== 'Critical' && b.severity !== 'Major' && b.severity !== 'Minor').length;
    const low = allBugs.filter(b => b.severity === 'Minor').length;

    // Dynamic recent runs
    const recentRuns = projCycles.flatMap(c => 
      (c.items || []).map(item => ({
        runId: item.testCase.key.replace(/\D/g, '') || '131011',
        title: item.testCase.name,
        status: item.executionStatus,
        executedBy: item.executedBy || 'Suresh Kumar',
        executedAt: item.executedAt ? new Date(item.executedAt).toLocaleDateString(undefined, {month: '2-digit', day: '2-digit'}) : '28/03',
        isAutomated: item.executionType === 'Automated'
      }))
    ).filter(r => r.status !== 'UNEXECUTED').slice(0, 4);

    return {
      totalModules,
      totalCases,
      totalPositive,
      totalNegative,
      totalBoundary,
      totalPermission,
      averageCoverage,
      totalCycles,
      totalDefects,
      passRate,
      executionsToday,
      critical,
      high,
      medium,
      low,
      recentRuns,
      failedItems
    };
  }, [activeProject.modules, customModuleCases, testCycles, activeProject.id]);

  const computedTrends = useMemo(() => {
    const totalCases = dashboardStats.totalCases;
    const executionsToday = dashboardStats.executionsToday;
    const passRate = dashboardStats.passRate;
    const totalDefects = dashboardStats.totalDefects;

    const casesTrendVal = totalCases > 0 ? Math.min(100, Math.max(0, (totalCases / 50) * 10)) : 0;
    const execTrendVal = executionsToday > 0 ? Math.min(100, Math.max(0, (executionsToday / 10) * 15)) : 0;
    const passRateTrendVal = passRate > 0 ? (passRate - 90) : 0;
    const defectsTrendVal = totalDefects > 0 ? Math.min(100, Math.max(0, (totalDefects / 5) * 12)) : 0;

    return {
      cases: {
        value: totalCases > 0 ? `▲ ${casesTrendVal.toFixed(1)}%` : '0.0%',
        colorClass: totalCases > 0 ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-50',
        label: totalCases > 0 ? 'vs last month' : 'no data available'
      },
      executions: {
        value: executionsToday > 0 ? `▲ ${execTrendVal.toFixed(1)}%` : '0.0%',
        colorClass: executionsToday > 0 ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-50',
        label: executionsToday > 0 ? 'vs yesterday' : 'no executions logged'
      },
      passRate: {
        value: passRate > 0 
          ? (passRateTrendVal >= 0 ? `▲ +${passRateTrendVal.toFixed(1)}%` : `▼ ${passRateTrendVal.toFixed(1)}%`)
          : '0.0%',
        colorClass: passRate > 0 
          ? (passRateTrendVal >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50')
          : 'text-slate-400 bg-slate-50',
        label: passRate > 0 ? 'vs target average (90%)' : 'no execution runs'
      },
      bugs: {
        value: totalDefects > 0 ? `▲ +${defectsTrendVal.toFixed(1)}%` : '0.0%',
        colorClass: totalDefects > 0 ? 'text-rose-600 bg-rose-50' : 'text-emerald-600 bg-emerald-50',
        label: totalDefects > 0 ? 'vs last cycle' : 'clean run / no bugs'
      }
    };
  }, [dashboardStats]);

  // Active module object
  const activeModule = useMemo(() => {
    return activeProject.modules.find(m => m.id === selectedModuleId) || activeProject.modules[0];
  }, [activeProject, selectedModuleId]);

  // Handle adding new Project
  const handleAddProject = (newProject: EnterpriseProject) => {
    setProjects(prev => [newProject, ...prev]);
    setSelectedProjectId(newProject.id);
  };

  const handleTabChange = (tab: 'dashboard' | 'matrix' | 'repository' | 'cycles' | 'execution' | 'bugs' | 'settings') => {
    setActiveTab(tab);
    setGlobalSearchQuery('');
  };

  // Requirement: Clicking any module ALWAYS opens the Test Case Repository tab immediately!
  const handleSelectModuleSmart = (id: string) => {
    setSelectedModuleId(id);
    setActiveTab('repository');
    setGlobalSearchQuery('');
  };

  // Add custom new module repository to active project
  const handleAddNewModule = (moduleName: string) => {
    if (!currentUser || (currentUser.role !== 'Admin' && currentUser.role !== 'QA Lead' && currentUser.role !== 'QA Engineer')) {
      alert(`Role Restriction: User role '${currentUser?.role}' cannot create module repositories.`);
      return;
    }
    const newId = `mod-${Date.now().toString().slice(-4)}`;
    const newModule: ProjectModule = {
      id: newId,
      name: moduleName,
      frontendPath: `repository/${moduleName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      backendPath: `repository/${moduleName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      category: activeProject.key,
      filesCount: 0,
      astNodesCount: 0,
      testCasesCount: 0,
      positiveCount: 0,
      negativeCount: 0,
      coveragePercentage: 100
    };

    setProjects(prev => prev.map(p => {
      if (p.id !== activeProject.id) return p;
      return {
        ...p,
        modules: [newModule, ...p.modules]
      };
    }));
    
    setSelectedModuleId(newId);
    handleTabChange('matrix');
    setIsImporterOpen(true);
  };

  // Custom Text Input Prompts to replace browser default prompt dialogs
  const triggerCreateModulePrompt = () => {
    if (!currentUser || (currentUser.role !== 'Admin' && currentUser.role !== 'QA Lead' && currentUser.role !== 'QA Engineer')) {
      alert(`Role Restriction: User role '${currentUser?.role}' cannot create module repositories.`);
      return;
    }
    setPromptConfig({
      isOpen: true,
      title: 'Create Module Repository',
      message: 'Enter a name for the new module repository (e.g. Payroll & Benefits Management):',
      defaultValue: '',
      placeholder: 'Module Name',
      onConfirm: (val) => {
        if (val.trim()) {
          handleAddNewModule(val.trim());
        }
      }
    });
  };

  const triggerRenameModulePrompt = (modId: string, currentName: string) => {
    if (!currentUser || (currentUser.role !== 'Admin' && currentUser.role !== 'QA Lead' && currentUser.role !== 'QA Engineer')) {
      alert(`Role Restriction: User role '${currentUser?.role}' cannot rename module repositories.`);
      return;
    }
    setPromptConfig({
      isOpen: true,
      title: 'Rename Module Repository',
      message: `Enter new name for module repository "${currentName}":`,
      defaultValue: currentName,
      placeholder: 'New Module Name',
      onConfirm: (val) => {
        if (val.trim()) {
          handleEditModule(modId, val.trim());
        }
      }
    });
  };

  const [automateCycleId, setAutomateCycleId] = useState<string | undefined>(undefined);

  const handleAutomateTestCase = (tc: TestCase, cycleId?: string) => {
    setSelectedAutomateCase(tc);
    setAutomateCycleId(cycleId);
    setIsAutomationDrawerOpen(true);
  };

  const handleStartAutomationRun = (startingUrl: string, deviceProfile: string, browser: string, isHeaded: boolean) => {
    setIsAutomationDrawerOpen(false);
    setAutomationParams({
      isOpen: true,
      startingUrl,
      deviceProfile,
      browser,
      isHeaded,
      cycleId: automateCycleId,
      readOnlyMode: false
    });
  };

  const handleOpenAgentConsoleTrace = (testCase: TestCase, status?: TestExecutionStatus, screenshotUrl?: string, stepRuns?: any[]) => {
    setSelectedAutomateCase(testCase);
    setAutomationParams({
      isOpen: true,
      startingUrl: 'https://qa.hrmgenie.outstrive.co/login',
      deviceProfile: 'Desktop',
      browser: 'Google Chrome',
      isHeaded: true,
      readOnlyMode: true,
      initialStatus: status === 'FAILED' ? 'FAILED' : 'PASSED',
      initialScreenshotUrl: screenshotUrl,
      initialStepRuns: stepRuns
    });
  };

  const handleSaveAutomationResultToCycle = (
    cycleId: string,
    status: 'PASSED' | 'FAILED',
    evidence?: { screenshotUrl?: string; videoUrl?: string; evidenceName?: string },
    stepRuns?: any[]
  ) => {
    const cycle = activeProjectCycles.find(c => c.id === cycleId) || activeProjectCycles[0];
    if (cycle && selectedAutomateCase) {
      const itemToUpdate = cycle.items.find(i => i.testCase.key === selectedAutomateCase.key);
      if (itemToUpdate) {
        handleUpdateExecutionStatus(
          cycle.id,
          itemToUpdate.testCase.key,
          status,
          undefined,
          undefined,
          undefined,
          evidence,
          stepRuns
        );
        showToast(`Automation execution (${status}): Stored evidence proof in cycle "${cycle.name}"!`, 'success');
      } else {
        const newItem: TestCycleItem = {
          id: `item-${Date.now().toString().slice(-4)}`,
          testCase: selectedAutomateCase,
          executionStatus: status,
          executedBy: currentUser?.name || 'QA Tester',
          executedAt: new Date().toISOString(),
          executionType: 'Automated',
          evidenceScreenshotUrl: evidence?.screenshotUrl,
          evidenceVideoUrl: evidence?.videoUrl,
          evidenceName: evidence?.evidenceName || `${selectedAutomateCase.key}_Automated_Proof`,
          stepRuns: stepRuns,
          attachments: (evidence?.screenshotUrl || evidence?.videoUrl) ? [{
            id: `att-${Date.now()}`,
            name: evidence?.evidenceName || `${selectedAutomateCase.key}_Proof`,
            url: (evidence.screenshotUrl || evidence.videoUrl)!,
            type: evidence.videoUrl ? 'video' : 'image',
            uploadedAt: new Date().toLocaleTimeString()
          }] : []
        };
        
        setTestCycles(prev => prev.map(c => {
          if (c.id !== cycle.id) return c;
          return {
            ...c,
            items: [newItem, ...c.items]
          };
        }));
        
        showToast(`Added test case ${selectedAutomateCase.key} to cycle "${cycle.name}" (${status}) with media proof!`, 'success');
      }
    }
  };

  const handleRaiseBugFromAutomation = (cycleId: string, failedStep: string, screenshotUrl?: string) => {
    const cycle = activeProjectCycles.find(c => c.id === cycleId) || activeProjectCycles[0];
    if (cycle && selectedAutomateCase) {
      const item = cycle.items.find(i => i.testCase.key === selectedAutomateCase.key);
      const existingBugs = item ? (item.jiraBugs || (item.jiraBug ? [item.jiraBug] : [])) : [];
      const activeBug = existingBugs.find(b => b.status === 'Open' || b.status === 'Re-opened');

      if (activeBug) {
        handleReopenJiraBug(
          cycle.id,
          selectedAutomateCase.key,
          activeBug.issueKey,
          `Automation re-test failed at step: ${failedStep}`,
          screenshotUrl
        );
      } else {
        setBugToEdit(undefined);
        setIsBugCreateEditModalOpen(true);
        showToast(`Automation failed at step: "${failedStep}". Opening Jira Bug creation drawer...`, "error");
      }
    }
  };

  const handleAddAIDemoCase = () => {
    if (!activeModule) return;
    const demoCase: TestCase = {
      key: `AUT-${Date.now().toString().slice(-4)}`,
      folder: "/AutomationDemo",
      name: "[DEMO] AI Playwright Login Verification",
      objective: "Verify successful user login using automated no-code Playwright browser trace compiler.",
      precondition: "Valid user credentials exist in the HRM Genie portal.",
      testSteps: "1. Navigate to https://qa.hrmgenie.outstrive.co/login\n2. Type 'hr@out-strive.com' in email field\n3. Type 'HR@dmin06' in password field\n4. Click Login\n5. Verify Organization is displayed",
      testData: "Email: hr@out-strive.com | Password: HR@dmin06",
      expectedResult: "Browser automatically enters credentials, logs in, and loads dashboard page.",
      status: "Approved",
      priority: "Critical",
      category: activeModule.name,
      type: "Positive",
      sourceFile: "AI_Demo_Case.csv"
    };

    setCustomModuleCases(prev => {
      const currentList = prev[activeModule.id] || [];
      const updated = [demoCase, ...currentList];
      const nextMap = { ...prev, [activeModule.id]: updated };
      localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(nextMap));
      return nextMap;
    });

    showToast("AI Playwright Login Demo test case added successfully! Click 'Automate' to run it.");
  };

  // Edit (Rename) Module Repository
  const handleEditModule = (moduleId: string, newName: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== activeProject.id) return p;
      return {
        ...p,
        modules: p.modules.map(m => m.id === moduleId ? { ...m, name: newName } : m)
      };
    }));
  };

  // Delete Module Repository
  const handleDeleteModule = (moduleId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== activeProject.id) return p;
      const updatedMods = p.modules.filter(m => m.id !== moduleId);
      return {
        ...p,
        modules: updatedMods
      };
    }));

    // Clean up custom cases for deleted module
    setCustomModuleCases(prev => {
      const copy = { ...prev };
      delete copy[moduleId];
      return copy;
    });

    // Select next remaining module if deleted module was active
    if (selectedModuleId === moduleId) {
      const remaining = activeProject.modules.filter(m => m.id !== moduleId);
      setSelectedModuleId(remaining.length > 0 ? remaining[0].id : '');
    }
  };

  // Active Test Cases array for selected module repository
  const testCases: TestCase[] = useMemo(() => {
    if (!selectedModuleId) return [];
    return customModuleCases[selectedModuleId] || [];
  }, [selectedModuleId, customModuleCases]);

  // Handle Importing new test cases into repository
  const handleImportCases = (newCases: TestCase[]) => {
    if (!selectedModuleId) return;
    setCustomModuleCases(prev => {
      const updated = {
        ...prev,
        [selectedModuleId]: [...(prev[selectedModuleId] || []), ...newCases]
      };
      return updated;
    });
    setImportSuccessCount(newCases.length);
  };

  // Handle Creating new Test Cycle
  const handleCreateCycle = (newCycle: TestCycle) => {
    const cycleWithProj = { ...newCycle, projectId: activeProject.id };
    setTestCycles(prev => [cycleWithProj, ...prev]);
    setActiveCycleId(newCycle.id);
    handleTabChange('execution');
    showToast(`Test cycle "${newCycle.name}" started successfully!`);
  };

  const handleDeleteCycle = (cycleId: string) => {
    setTestCycles(prev => prev.filter(c => c.id !== cycleId));
    showToast("Test cycle deleted successfully!");
  };

  const handleDeleteBug = (bugKey: string) => {
    if (confirm(`Are you sure you want to delete defect ticket "${bugKey}"?`)) {
      setDefectRegistry(prev => prev.filter(b => b.issueKey !== bugKey));
      
      setTestCycles(prev => prev.map(cycle => ({
        ...cycle,
        items: cycle.items.map(item => {
          let updatedBugs = item.jiraBugs || (item.jiraBug ? [item.jiraBug] : []);
          updatedBugs = updatedBugs.filter(b => b.issueKey !== bugKey);
          
          let primaryBug = item.jiraBug;
          if (primaryBug?.issueKey === bugKey) {
            primaryBug = updatedBugs[0] || undefined;
          }
          
          return {
            ...item,
            jiraBug: primaryBug,
            jiraBugs: updatedBugs,
            defectId: primaryBug?.issueKey || undefined,
            executionStatus: updatedBugs.length > 0 ? 'FAILED' : (item.executionStatus === 'FAILED' ? 'UNEXECUTED' : item.executionStatus)
          };
        })
      })));
      showToast(`Defect ticket "${bugKey}" deleted successfully!`);
    }
  };

  const handleCreateOrUpdateBugRegistry = (
    bug: JiraBug,
    options: { cycleId?: string; itemKey?: string; isEdit: boolean }
  ) => {
    if (options.isEdit) {
      // 1. Update in static defectRegistry
      setDefectRegistry(prev => prev.map(b => b.issueKey === bug.issueKey ? bug : b));
      
      // 2. Update inside cycles execution items
      setTestCycles(prev => prev.map(cycle => ({
        ...cycle,
        items: cycle.items.map(item => {
          let updatedBugs = item.jiraBugs || (item.jiraBug ? [item.jiraBug] : []);
          const exists = updatedBugs.some(b => b.issueKey === bug.issueKey);
          if (exists) {
            updatedBugs = updatedBugs.map(b => b.issueKey === bug.issueKey ? bug : b);
            let primaryBug = item.jiraBug;
            if (primaryBug?.issueKey === bug.issueKey) {
              primaryBug = bug;
            }
            return {
              ...item,
              jiraBug: primaryBug,
              jiraBugs: updatedBugs,
              defectId: primaryBug?.issueKey || item.defectId
            };
          }
          return item;
        })
      })));
      showToast(`Jira defect ticket ${bug.issueKey} updated successfully!`);
    } else {
      // Create Flow
      // 1. Add to defectRegistry
      setDefectRegistry(prev => [bug, ...prev]);

      // 2. If cycleId and itemKey are provided, link it and fail the case in that cycle
      if (options.cycleId && options.itemKey) {
        setTestCycles(prev => prev.map(cycle => {
          if (cycle.id !== options.cycleId) return cycle;
          return {
            ...cycle,
            items: cycle.items.map(item => {
              if (item.testCase.key !== options.itemKey) return item;

              let existingBugs = item.jiraBugs || (item.jiraBug ? [item.jiraBug] : []);
              const exists = existingBugs.some(b => b.issueKey === bug.issueKey);
              if (!exists) {
                existingBugs = [bug, ...existingBugs];
              }

              return {
                ...item,
                executionStatus: 'FAILED',
                jiraBug: bug,
                jiraBugs: existingBugs,
                defectId: bug.issueKey,
                executedBy: currentUser?.name || 'QA Tester',
                executedAt: new Date().toLocaleString()
              };
            })
          };
        }));
      }
      showToast(`Jira defect ticket ${bug.issueKey} created successfully!`);
    }
  };

  // Single Test Case Edit / Save
  const handleSaveTestCase = (updatedCase: TestCase) => {
    // 1. Update in customModuleCases
    setCustomModuleCases(prev => {
      const modCases = prev[selectedModuleId] || [];
      const updatedModCases = modCases.map(c => c.key === updatedCase.key ? updatedCase : c);
      return { ...prev, [selectedModuleId]: updatedModCases };
    });

    // 2. Update inside active test cycles
    setTestCycles(prev => prev.map(cycle => ({
      ...cycle,
      items: cycle.items.map(item => item.testCase.key === updatedCase.key ? { ...item, testCase: updatedCase } : item)
    })));
  };

  // Single Test Case Delete in Master Repository (Does NOT affect execution cycles)
  const handleDeleteTestCase = (key: string) => {
    setCustomModuleCases(prev => {
      const modCases = prev[selectedModuleId] || [];
      const updatedModCases = modCases.filter(c => c.key !== key);
      return { ...prev, [selectedModuleId]: updatedModCases };
    });
    showToast(`Deleted test case ${key} from Master Repository!`, 'success');
  };

  // Remove single item from cycle (Does NOT affect Master Repository)
  const handleDeleteCycleItem = (cycleId: string, itemKey: string) => {
    setTestCycles(prev => prev.map(c => {
      if (c.id !== cycleId) return c;
      return {
        ...c,
        items: c.items.filter(i => i.testCase.key !== itemKey)
      };
    }));
    showToast(`Removed test case ${itemKey} from execution cycle!`, 'info');
  };

  // Sync Edited Master Test Cases into Execution Cycle
  const handleSyncEditedCasesToCycle = (cycleId: string) => {
    const moduleCases = customModuleCases[selectedModuleId] || [];
    const masterCaseMap = new Map(moduleCases.map(c => [c.key, c]));

    let syncedCount = 0;
    setTestCycles(prev => prev.map(cycle => {
      if (cycle.id !== cycleId) return cycle;

      const updatedItems = cycle.items.map(item => {
        const master = masterCaseMap.get(item.testCase.key);
        if (master && (
          master.name !== item.testCase.name ||
          master.testSteps !== item.testCase.testSteps ||
          master.expectedResult !== item.testCase.expectedResult ||
          master.objective !== item.testCase.objective ||
          master.precondition !== item.testCase.precondition
        )) {
          syncedCount++;
          return {
            ...item,
            testCase: { ...master }
          };
        }
        return item;
      });

      return {
        ...cycle,
        items: updatedItems
      };
    }));

    showToast(`Successfully synced edited test cases into execution cycle!`, 'success');
  };

  // Bulk Edit Test Cases
  const handleBulkEditTestCases = (keys: string[], updates: { priority?: string; type?: string; status?: string }) => {
    const keySet = new Set(keys);

    setCustomModuleCases(prev => {
      const modCases = prev[selectedModuleId] || [];
      const updatedModCases = modCases.map(c => {
        if (!keySet.has(c.key)) return c;
        return {
          ...c,
          priority: updates.priority || c.priority,
          type: (updates.type as any) || c.type,
          status: updates.status || c.status
        };
      });
      return { ...prev, [selectedModuleId]: updatedModCases };
    });

    setTestCycles(prev => prev.map(cycle => ({
      ...cycle,
      items: cycle.items.map(item => {
        if (!keySet.has(item.testCase.key)) return item;
        return {
          ...item,
          testCase: {
            ...item.testCase,
            priority: updates.priority || item.testCase.priority,
            type: (updates.type as any) || item.testCase.type,
            status: updates.status || item.testCase.status
          }
        };
      })
    })));
  };

  // Bulk Delete Test Cases in Master Repository (Does NOT affect execution cycles)
  const handleBulkDeleteTestCases = (keys: string[]) => {
    const keySet = new Set(keys);

    setCustomModuleCases(prev => {
      const modCases = prev[selectedModuleId] || [];
      const updatedModCases = modCases.filter(c => !keySet.has(c.key));
      return { ...prev, [selectedModuleId]: updatedModCases };
    });

    showToast(`Bulk deleted ${keys.length} test cases from Master Repository!`, 'success');
  };

  // Bulk Remove items from a specific Execution Cycle
  const handleBulkDeleteCycleItems = (cycleId: string, itemKeys: string[]) => {
    const keySet = new Set(itemKeys);
    setTestCycles(prev => prev.map(c => {
      if (c.id !== cycleId) return c;
      return {
        ...c,
        items: c.items.filter(i => !keySet.has(i.testCase.key))
      };
    }));
    showToast(`Removed ${itemKeys.length} test cases from execution cycle!`, 'info');
  };

  // Bulk Edit items in a specific Execution Cycle
  const handleBulkEditCycleItems = (cycleId: string, itemKeys: string[], updates: { priority?: string; type?: string; status?: string }) => {
    const keySet = new Set(itemKeys);
    setTestCycles(prev => prev.map(c => {
      if (c.id !== cycleId) return c;
      return {
        ...c,
        items: c.items.map(i => {
          if (!keySet.has(i.testCase.key)) return i;
          return {
            ...i,
            testCase: {
              ...i.testCase,
              priority: updates.priority || i.testCase.priority,
              type: (updates.type as any) || i.testCase.type,
              status: updates.status || i.testCase.status
            }
          };
        })
      };
    }));
    showToast(`Updated ${itemKeys.length} test cases in execution cycle!`, 'success');
  };

  // Remove single item from cycle
  const handleRemoveCycleItem = (cycleId: string, itemKey: string) => {
    setTestCycles(prev => prev.map(cycle => {
      if (cycle.id !== cycleId) return cycle;
      return {
        ...cycle,
        items: cycle.items.filter(item => item.testCase.key !== itemKey)
      };
    }));
  };

  // Handle adding newly uploaded test cases to an existing test cycle
  const handleAddCasesToCycle = (cycleId: string, newCases: TestCase[]) => {
    setTestCycles(prev => prev.map(cycle => {
      if (cycle.id !== cycleId) return cycle;
      
      const existingKeys = new Set(cycle.items.map(i => i.testCase.key));
      const newItems: TestCycleItem[] = newCases
        .filter(c => !existingKeys.has(c.key))
        .map(c => ({
          id: `item-${c.key}-${Date.now()}`,
          testCase: c,
          executionStatus: 'UNEXECUTED',
          assignedTo: cycle.assignedTester
        }));

      return {
        ...cycle,
        items: [...cycle.items, ...newItems]
      };
    }));
  };

  // Filter cycles for active project
  const activeProjectCycles = useMemo(() => {
    return testCycles.filter(c => !c.projectId || c.projectId === activeProject.id);
  }, [testCycles, activeProject.id]);

  const allBugsCombined = useMemo(() => {
    const dynamicBugs = activeProjectCycles.flatMap(c => 
      (c.items || []).flatMap(item => item.jiraBugs || (item.jiraBug ? [item.jiraBug] : []))
    );
    const regKeys = new Set(defectRegistry.map(b => b.issueKey));
    const filteredDynamics = dynamicBugs.filter(b => !regKeys.has(b.issueKey));
    return [...defectRegistry, ...filteredDynamics];
  }, [defectRegistry, activeProjectCycles]);

  // Handle Live Status Update
  const handleUpdateExecutionStatus = (
    cycleId: string,
    itemKey: string,
    status: TestExecutionStatus,
    jiraBug?: JiraBug,
    bugNotes?: string,
    defectId?: string,
    evidence?: { screenshotUrl?: string; videoUrl?: string; evidenceName?: string },
    stepRuns?: any[]
  ) => {
    setTestCycles(prev => prev.map(cycle => {
      if (cycle.id !== cycleId) return cycle;
      return {
        ...cycle,
        items: cycle.items.map(item => {
          if (item.testCase.key !== itemKey) return item;

          let existingBugs = item.jiraBugs || (item.jiraBug ? [item.jiraBug] : []);
          let primaryBug = jiraBug || item.jiraBug;

          if (jiraBug) {
            const exists = existingBugs.some(b => b.issueKey === jiraBug.issueKey);
            if (!exists) {
              existingBugs = [jiraBug, ...existingBugs];
            }
          }

          existingBugs = existingBugs.map(b => {
            if (status === 'PASSED') {
              return { ...b, status: 'Resolved' };
            } else if (status === 'FAILED' && b.status === 'Resolved') {
              return { ...b, status: 'Re-opened' };
            }
            return b;
          });

          if (primaryBug) {
            if (status === 'PASSED') {
              primaryBug = { ...primaryBug, status: 'Resolved' };
            } else if (status === 'FAILED' && primaryBug.status === 'Resolved') {
              primaryBug = { ...primaryBug, status: 'Re-opened' };
            }
          }

          const existingAttachments = item.attachments || [];
          let updatedAttachments = [...existingAttachments];
          if (evidence?.screenshotUrl || evidence?.videoUrl) {
            updatedAttachments.unshift({
              id: `att-${Date.now()}`,
              name: evidence.evidenceName || `${itemKey}_Proof`,
              url: (evidence.screenshotUrl || evidence.videoUrl)!,
              type: evidence.videoUrl ? 'video' : 'image',
              uploadedAt: new Date().toLocaleTimeString()
            });
          }

          const existingHistory = item.executionHistory || [];
          const newExecutionRun: AgentExecutionRun = {
            id: `run-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            agentName: `BrowserAutomationAgent@${itemKey}`,
            testCaseKey: itemKey,
            executionStatus: status,
            executionType: evidence ? 'Automated' : 'Manual',
            executedBy: currentUser?.name ? `${currentUser.name} (${currentUser.role})` : 'Playwright Engine',
            executedAt: `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`,
            screenshotUrl: evidence?.screenshotUrl || item.evidenceScreenshotUrl,
            videoUrl: evidence?.videoUrl || item.evidenceVideoUrl,
            evidenceName: evidence?.evidenceName || item.evidenceName || `${itemKey}_Execution_Proof`,
            summaryLog: status === 'PASSED'
              ? `Automated Playwright browser assertion check passed. UI state verified with zero console errors.`
              : (bugNotes || `Step assertion check failed during DOM element evaluation. ${primaryBug ? `Linked Defect: ${primaryBug.issueKey}` : ''}`),
            jiraBugKey: primaryBug?.issueKey,
            stepRuns: stepRuns ? JSON.parse(JSON.stringify(stepRuns)) : item.stepRuns
          };

          return {
            ...item,
            executionStatus: status,
            jiraBug: primaryBug,
            jiraBugs: existingBugs,
            bugNotes: bugNotes !== undefined ? bugNotes : item.bugNotes,
            defectId: primaryBug?.issueKey || item.defectId,
            evidenceScreenshotUrl: evidence?.screenshotUrl || item.evidenceScreenshotUrl,
            evidenceVideoUrl: evidence?.videoUrl || item.evidenceVideoUrl,
            evidenceName: evidence?.evidenceName || item.evidenceName,
            attachments: updatedAttachments,
            executionHistory: [newExecutionRun, ...existingHistory],
            stepRuns: stepRuns ? JSON.parse(JSON.stringify(stepRuns)) : item.stepRuns,
            executedBy: currentUser?.name || 'QA Tester',
            executedAt: new Date().toLocaleString()
          };
        })
      };
    }));

    if (jiraBug && status === 'FAILED') {
      showToast(`Jira defect ticket ${jiraBug.issueKey} logged successfully!`);
    } else {
      showToast(`Execution status updated to ${status} for ${itemKey}!`);
    }
  };

  // Handle Re-opening an Existing Bug on FAILED Re-test
  const handleReopenJiraBug = (
    cycleId: string,
    itemKey: string,
    bugKey: string,
    notes: string,
    screenshotUrl?: string,
    videoUrl?: string
  ) => {
    const nowTimestamp = new Date().toLocaleString();
    setTestCycles(prev => prev.map(cycle => {
      if (cycle.id !== cycleId) return cycle;
      return {
        ...cycle,
        items: cycle.items.map(item => {
          if (item.testCase.key !== itemKey) return item;

          let existingBugs = item.jiraBugs || (item.jiraBug ? [item.jiraBug] : []);
          existingBugs = existingBugs.map(b => {
            if (b.issueKey === bugKey) {
              return {
                ...b,
                status: 'Re-opened',
                reopenedBy: currentUser?.name || 'QA Tester',
                reopenedAt: nowTimestamp,
                reopenNotes: notes,
                screenshotUrl: screenshotUrl || b.screenshotUrl,
                videoUrl: videoUrl || b.videoUrl
              };
            }
            return b;
          });

          const primaryBug = existingBugs.find(b => b.issueKey === bugKey) || item.jiraBug;

          return {
            ...item,
            executionStatus: 'FAILED',
            jiraBug: primaryBug,
            jiraBugs: existingBugs,
            bugNotes: `[RE-OPENED ${bugKey}] ${notes}`,
            defectId: bugKey,
            executedBy: currentUser?.name || 'QA Tester',
            executedAt: nowTimestamp
          };
        })
      };
    }));

    showToast(`Jira defect ticket ${bugKey} re-opened successfully!`);
  };

  // Active Cycle object for execution board
  const activeCycle = useMemo(() => {
    return activeProjectCycles.find(c => c.id === activeCycleId) || activeProjectCycles[0];
  }, [activeProjectCycles, activeCycleId]);

  // Restore default modules for active project
  const handleRestoreDefaultModules = () => {
    setProjects(prev => prev.map(p => {
      if (p.id !== activeProject.id) return p;
      return {
        ...p,
        modules: DEFAULT_ENTERPRISE_PROJECTS[0].modules
      };
    }));
    setSelectedModuleId(DEFAULT_ENTERPRISE_PROJECTS[0].modules[0].id);
  };

  // REQUIREMENT: Render Full-Screen Login Gateway if User is Not Authenticated!
  if (!currentUser) {
    return (
      <LoginGateway
        registeredUsers={registeredUsers}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  const canManageCases = currentUser.role === 'Admin' || currentUser.role === 'QA Lead' || currentUser.role === 'QA Engineer';
  const canImportExport = currentUser.role === 'Admin' || currentUser.role === 'QA Lead';

  const renderEmptyModuleState = () => (
    <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm text-center max-w-xl mx-auto my-12 animate-fadeIn">
      <FolderPlus className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
      <h2 className="text-2xl font-extrabold text-slate-900">No Module Repositories Found</h2>
      <p className="text-xs text-slate-500 mt-2 mb-6 leading-relaxed">
        Create a new module repository for <strong>{activeProject.name}</strong>.
      </p>
      <div className="flex items-center justify-center space-x-3">
        {canManageCases ? (
          <button
            onClick={triggerCreateModulePrompt}
            className="inline-flex items-center px-5 py-2.5 rounded-2xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Repository
          </button>
        ) : (
          <button
            disabled
            className="inline-flex items-center px-5 py-2.5 rounded-2xl text-xs font-extrabold bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed opacity-60 transition-all"
            title="Creating modules restricted for Developer/Auditor"
          >
            <Lock className="w-3.5 h-3.5 mr-2" />
            Create New Repository
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex selection:bg-indigo-500 selection:text-white font-sans antialiased">
      
      {/* Left Sidebar Navigation & Module Manager */}
      <Sidebar
        modules={activeProject.modules}
        selectedModuleId={selectedModuleId}
        currentUser={currentUser}
        activeProject={activeProject}
        onSelectModule={handleSelectModuleSmart}
        onAddNewModule={handleAddNewModule}
        onEditModule={handleEditModule}
        onDeleteModule={handleDeleteModule}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        testCasesCount={dashboardStats.totalCases}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Top Header with Multi-Project Dropdown, Session Info & Logout */}
        <Header
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          searchQuery={globalSearchQuery}
          onSearchChange={setGlobalSearchQuery}
          onExport={() => setIsExportModalOpen(true)}
          testCasesCount={testCases.length}
          currentUser={currentUser}
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
          onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
          onOpenUserManagementModal={() => setIsUserManagementOpen(true)}
          onLogout={handleLogout}
        />

        {/* Main Content Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          <>
              {/* Tab 1: Dashboard Overview (Mockup Layout 1-to-1) */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6 animate-fadeIn font-sans">
                  
                  {/* Top Row: Page Title & Active Project Selector */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight font-sans">Dashboard</h2>
                    
                    <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Active project:</span>
                      <span className="text-xs font-extrabold text-slate-900">{activeProject.name} v2.1</span>
                    </div>
                  </div>

                  {/* Key Metrics Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    
                    {/* Metric 1 */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Total Test Cases</span>
                          <h3 className="text-2xl font-black text-slate-900 mt-1">{dashboardStats.totalCases}</h3>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                          <Layers className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex items-center mt-4 text-[10px] font-extrabold">
                        <span className={`${computedTrends.cases.colorClass} px-2 py-0.5 rounded-full mr-1.5 font-mono`}>{computedTrends.cases.value}</span>
                        <span className="text-slate-400 font-medium">{computedTrends.cases.label}</span>
                      </div>
                    </div>

                    {/* Metric 2: Failed Test Cases */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all border-l-4 border-l-rose-500">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Failed Test Cases</span>
                          <h3 className="text-2xl font-black text-rose-600 mt-1">{dashboardStats.failedItems.length}</h3>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 font-bold">
                          <XCircle className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex items-center mt-4 text-[10px] font-extrabold">
                        <span className={`px-2 py-0.5 rounded-full mr-1.5 font-mono border ${
                          dashboardStats.failedItems.length > 0
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}>
                          {dashboardStats.failedItems.length > 0 ? `🛑 ${dashboardStats.failedItems.length} Failures` : '✅ 0 Failures'}
                        </span>
                        <span className="text-slate-400 font-medium">In active execution cycles</span>
                      </div>
                    </div>

                    {/* Metric 3 */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Passed Rate</span>
                          <h3 className="text-2xl font-black text-slate-900 mt-1">{dashboardStats.passRate}%</h3>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                          <FileCheck2 className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex items-center mt-4 text-[10px] font-extrabold">
                        <span className={`${computedTrends.passRate.colorClass} px-2 py-0.5 rounded-full mr-1.5 font-mono`}>{computedTrends.passRate.value}</span>
                        <span className="text-slate-400 font-medium">{computedTrends.passRate.label}</span>
                      </div>
                    </div>

                    {/* Metric 4 */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Active Bugs</span>
                          <h3 className="text-2xl font-black text-slate-900 mt-1">{dashboardStats.totalDefects}</h3>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                          <Bug className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex items-center mt-4 text-[10px] font-extrabold">
                        <span className={`${computedTrends.bugs.colorClass} px-2 py-0.5 rounded-full mr-1.5 font-mono`}>{computedTrends.bugs.value}</span>
                        <span className="text-slate-400 font-medium">{computedTrends.bugs.label}</span>
                      </div>
                    </div>

                  </div>

                  {/* Middle Row: Line Chart + Doughnut Chart */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Line Chart Panel */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm lg:col-span-2 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900 font-sans">Test Execution Overview</h3>
                        </div>
                        
                        <div className="flex items-center space-x-3 text-[10px] font-bold">
                          <div className="flex items-center space-x-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                            <span className="text-slate-500">Passed</span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                            <span className="text-slate-500">Failed</span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                            <span className="text-slate-500">Blocked</span>
                          </div>
                        </div>
                      </div>

                      {/* Line Chart Vector SVG */}
                      <div className="h-48 w-full relative pt-2">
                        <svg className="w-full h-full" viewBox="0 0 400 160" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="passGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.15" />
                              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>
                          
                          {/* Grid Lines */}
                          <line x1="0" y1="40" x2="400" y2="40" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                          <line x1="0" y1="80" x2="400" y2="80" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                          <line x1="0" y1="120" x2="400" y2="120" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                          
                          {/* Passed Curve */}
                          <path d={dashboardStats.executionsToday > 0 ? "M0,130 C40,90 70,110 130,70 C190,60 250,95 310,110 C370,60 400,50 400,50" : "M0,150 L400,150"} fill="none" stroke="#0ea5e9" strokeWidth="3" strokeLinecap="round" />
                          <path d={dashboardStats.executionsToday > 0 ? "M0,130 C40,90 70,110 130,70 C190,60 250,95 310,110 C370,60 400,50 400,50 L400,160 L0,160 Z" : "M0,150 L400,150 L400,160 L0,160 Z"} fill="url(#passGrad)" />
                          
                          {/* Failed Curve */}
                          <path d={dashboardStats.executionsToday > 0 ? "M0,140 C40,130 70,120 130,135 C190,140 250,115 310,130 C370,125 400,130 400,130" : "M0,150 L400,150"} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
                          
                          {/* Blocked Curve */}
                          <path d={dashboardStats.executionsToday > 0 ? "M0,150 C40,145 70,148 130,140 C190,146 250,142 310,147 C370,145 400,148 400,148" : "M0,150 L400,150"} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        
                        {/* X Axis Labels */}
                        <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-2">
                          <span>1</span>
                          <span>3</span>
                          <span>5</span>
                          <span>7</span>
                          <span>9</span>
                          <span>11</span>
                          <span>13</span>
                          <span>15</span>
                          <span>17</span>
                          <span>19</span>
                        </div>
                      </div>
                    </div>

                    {/* Donut Chart Panel */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                      <h3 className="text-sm font-extrabold text-slate-900 font-sans">Bug Priority Distribution</h3>
                      
                      <div className="flex flex-col items-center justify-center py-2">
                        <div className="relative w-32 h-32">
                          {(() => {
                            const totalBugs = dashboardStats.critical + dashboardStats.high + dashboardStats.medium + dashboardStats.low;
                            if (totalBugs === 0) {
                              return (
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#e2e8f0" strokeWidth="12" />
                                </svg>
                              );
                            }
                            const lowPct = (dashboardStats.low / totalBugs) * 251.2;
                            const medPct = (dashboardStats.medium / totalBugs) * 251.2;
                            const highPct = (dashboardStats.high / totalBugs) * 251.2;
                            return (
                              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                {/* Low - Green */}
                                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10b981" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={0} />
                                {/* Medium - Yellow */}
                                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f59e0b" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={lowPct} />
                                {/* High - Orange */}
                                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f97316" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={lowPct + medPct} />
                                {/* Critical - Red */}
                                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ef4444" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={lowPct + medPct + highPct} />
                              </svg>
                            );
                          })()}
                          
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className="text-xl font-black text-slate-900 leading-none">{dashboardStats.totalDefects}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">Active</span>
                          </div>
                        </div>

                        {/* Legend */}
                        <div className="grid grid-cols-2 gap-3 mt-6 text-[10px] font-bold w-full px-2">
                          <div className="flex items-center space-x-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                            <span className="text-slate-600">Critical ({dashboardStats.critical})</span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                            <span className="text-slate-600">High ({dashboardStats.high})</span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            <span className="text-slate-600">Medium ({dashboardStats.medium})</span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span className="text-slate-600">Low ({dashboardStats.low})</span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Failed Test Cases Breakdown Panel */}
                  {dashboardStats.failedItems.length > 0 && (
                    <div className="bg-white p-6 rounded-3xl border border-rose-200 shadow-xs space-y-4 bg-rose-50/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 font-bold">
                            <XCircle className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-extrabold text-slate-900">Failed Test Cases ({dashboardStats.failedItems.length})</h3>
                            <p className="text-xs text-slate-500">Failed scenarios requiring immediate QA review & re-execution.</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleTabChange('execution')}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center"
                        >
                          Open Execution Board <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </button>
                      </div>

                      <div className="divide-y divide-rose-100 bg-white rounded-2xl border border-rose-100 overflow-hidden shadow-2xs">
                        {dashboardStats.failedItems.map(({ cycleId, cycleName, item }) => (
                          <div key={`${cycleId}-${item.testCase.key}`} className="p-3.5 flex items-center justify-between hover:bg-rose-50/60 transition-colors">
                            <div className="flex items-center space-x-3">
                              <span className="font-mono text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-200">
                                {item.testCase.key}
                              </span>
                              <div>
                                <h4 className="text-xs font-bold text-slate-900">{cleanTestCaseTitle(item.testCase.name)}</h4>
                                <p className="text-[11px] text-slate-500">Cycle: {cycleName} • Priority: {item.testCase.priority}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setActiveCycleId(cycleId);
                                handleTabChange('execution');
                              }}
                              className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold shadow-2xs transition-all active:scale-95 flex items-center"
                            >
                              Inspect Failure
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bottom Row: Bar Chart + Recent Test Runs Table */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Vertical Bar Chart Panel */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-extrabold text-slate-900 font-sans">Test Case Coverage</h3>
                        <span className="text-[9px] font-mono text-slate-400">Class chart by modules</span>
                      </div>

                      <div className="flex items-end justify-between h-44 pt-4 px-2">
                        {activeProject.modules.slice(0, 5).map(mod => {
                          const coverage = mod.coveragePercentage || 100;
                          const heightPx = Math.round((coverage / 100) * 144);
                          return (
                            <div key={mod.id} className="flex flex-col items-center space-y-2 flex-grow min-w-0">
                              <div 
                                className="w-4 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-lg transition-all duration-500" 
                                style={{ height: `${heightPx}px` }}
                                title={`${mod.name}: ${coverage}% coverage`}
                              ></div>
                              <span className="text-[9px] font-mono text-slate-400 truncate w-12 text-center" title={mod.name}>
                                {mod.name.substring(0, 5)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Table Panel */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm lg:col-span-2 space-y-4">
                      <h3 className="text-sm font-extrabold text-slate-900 font-sans">Recent Test Runs</h3>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700">
                          <thead>
                            <tr className="border-b border-slate-100 text-[10px] uppercase font-mono font-bold text-slate-400 pb-2">
                              <th className="py-2 w-20">Run ID</th>
                              <th className="py-2">Title</th>
                              <th className="py-2 w-28">Status</th>
                              <th className="py-2 w-24">Tester</th>
                              <th className="py-2 w-28">Date/Time</th>
                              <th className="py-2 w-16 text-center">Auto</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-sans text-xs">
                            {dashboardStats.recentRuns.map((run, index) => (
                              <tr key={index}>
                                <td className="py-3 font-mono font-bold text-slate-500">{run.runId}</td>
                                <td className="py-3 font-bold text-slate-950 truncate max-w-[150px]" title={run.title}>{run.title}</td>
                                <td className="py-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border inline-block ${
                                    run.status === 'PASSED'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 glow-passed'
                                      : run.status === 'FAILED'
                                      ? 'bg-rose-50 text-rose-700 border-rose-200 glow-failed'
                                      : run.status === 'BLOCKED'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200 glow-blocked'
                                      : 'bg-slate-50 text-slate-600 border-slate-200 glow-unexecuted'
                                  }`}>
                                    {run.status === 'PASSED' ? 'Pass' : run.status === 'FAILED' ? 'Fail' : run.status === 'BLOCKED' ? 'Blocked' : 'Unexecuted'}
                                  </span>
                                </td>
                                <td className="py-3">
                                  <div className="flex items-center space-x-1.5">
                                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-[9px] text-white flex items-center justify-center font-bold">
                                      {run.executedBy.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                                    </div>
                                    <span className="text-slate-600 font-medium">{run.executedBy.split(' ')[0]}</span>
                                  </div>
                                </td>
                                <td className="py-3 text-slate-400 font-medium">{run.executedAt}</td>
                                <td className="py-3 text-center">
                                  <input type="checkbox" checked={run.isAutomated} readOnly className="rounded border-slate-300 text-indigo-600" />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* Tab 2: Module Repositories Selector Landing Page (Test Repositories) */}
              {activeTab === 'matrix' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        [{activeProject.key}] Module Repositories ({activeProject.modules.length})
                      </h2>
                      <p className="text-xs text-slate-500">
                        Create, delete, or browse individual module repositories below. Click any card to manage its test cases.
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      {canManageCases && (
                        <button
                          onClick={triggerCreateModulePrompt}
                          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all flex items-center"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1.5 inline" />
                          Create Module Repository
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Module Cards Grid with Navigation and Ingest Controls */}
                  <ModuleCardsGrid
                    modules={activeProject.modules}
                    customModuleCases={customModuleCases}
                    selectedModuleId={selectedModuleId}
                    currentUser={currentUser}
                    searchQuery={globalSearchQuery}
                    onSelectModule={handleSelectModuleSmart}
                    onOpenImporter={(modId) => {
                      if (!canManageCases) {
                        alert(`Role Restriction: User role '${currentUser.role}' cannot add or upload test cases.`);
                        return;
                      }
                      setSelectedModuleId(modId);
                      setIsImporterOpen(true);
                    }}
                    onNavigateToRepository={(modId) => {
                      setSelectedModuleId(modId);
                      handleTabChange('repository');
                    }}
                    onEditModule={handleEditModule}
                    onDeleteModule={handleDeleteModule}
                    onRenameModule={triggerRenameModulePrompt}
                  />
                </div>
              )}

              {/* Tab 2.5: Specific Module Repository Test Case Table (Active Repository View) */}
              {activeTab === 'repository' && (
                !activeModule ? (
                  renderEmptyModuleState()
                ) : (
                  <div className="space-y-4 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        [{activeProject.key}] {activeModule.name} ({testCases.length} Scenarios)
                      </h2>
                      <p className="text-xs text-slate-500">
                        Manual QA repository with 4-step instructions, positive/negative breakdown, and reference file importer.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center space-x-2">
                      {isFeatureActive(featureFlags, 'ai_story_generator') && (
                        <button
                          onClick={() => setIsStoryModalOpen(true)}
                          className="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md transition-all active:scale-95 flex items-center"
                        >
                          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                          AI Story Importer
                        </button>
                      )}

                      {isFeatureActive(featureFlags, 'speedrun_mode') && activeProjectCycles.length > 0 && (
                        <button
                          onClick={() => setIsSpeedRunOpen(true)}
                          className="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md transition-all active:scale-95 flex items-center"
                        >
                          <Zap className="w-3.5 h-3.5 mr-1.5" />
                          SpeedRun Mode
                        </button>
                      )}

                      {canManageCases && (
                        <button
                          onClick={handleAddAIDemoCase}
                          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/20 transition-all"
                        >
                          <PlaySquare className="w-3.5 h-3.5 mr-1.5 inline" />
                          Add AI Automation Demo
                        </button>
                      )}

                      {canImportExport && (
                        <button
                          onClick={() => setIsImporterOpen(true)}
                          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all"
                        >
                          <Upload className="w-3.5 h-3.5 mr-1.5 inline" />
                          Add / Import Test Cases
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {testCases.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                      <Upload className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
                      <h4 className="text-base font-extrabold text-slate-900">No Test Cases Stored Yet for {activeModule.name}</h4>
                      <p className="text-xs text-slate-500 mt-1 mb-4">
                        {canImportExport ? `Upload reference files (.csv, .xlsx, .json) or create manual test cases for ${activeModule.name}.` : `Only QA Lead or Admin roles can upload test cases.`}
                      </p>
                      {canImportExport && (
                        <button
                          onClick={() => setIsImporterOpen(true)}
                          className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md mx-auto block"
                        >
                          + Add / Upload Test Cases Now
                        </button>
                      )}
                    </div>
                  ) : (
                    <TestCaseTable
                      testCases={testCases}
                      externalSearchQuery={globalSearchQuery}
                      onSearchChange={setGlobalSearchQuery}
                      onSaveTestCase={handleSaveTestCase}
                      onDeleteTestCase={handleDeleteTestCase}
                      onBulkEditTestCases={handleBulkEditTestCases}
                      onBulkDeleteTestCases={handleBulkDeleteTestCases}
                      onAutomateTestCase={isFeatureActive(featureFlags, 'browser_automation_runner') ? handleAutomateTestCase : undefined}
                      onViewCodeSpec={isFeatureActive(featureFlags, 'playwright_drawer') ? (tc) => setSelectedCodeCase(tc) : undefined}
                      canManageCases={canManageCases}
                    />
                  )}
                </div>
                )
              )}

              {/* Tab 3: Test Cycle Manager */}
              {activeTab === 'cycles' && (
                !activeModule ? (
                  renderEmptyModuleState()
                ) : (
                  <TestCycleManager
                    moduleName={activeModule.name}
                    allModules={activeProject.modules}
                    allModuleCasesMap={customModuleCases}
                    currentModuleCases={testCases}
                    testCycles={activeProjectCycles}
                    currentUser={currentUser}
                    onCreateCycle={handleCreateCycle}
                    onAddCasesToCycle={handleAddCasesToCycle}
                    onSelectCycleToExecute={(cycleId) => {
                      setActiveCycleId(cycleId);
                      handleTabChange('execution');
                    }}
                    onDeleteCycle={handleDeleteCycle}
                    onSyncEditedCasesToCycle={handleSyncEditedCasesToCycle}
                  />
                )
              )}

              {/* Tab 4: Live Execution Board with Active User Role Guarding */}
              {activeTab === 'execution' && (
                !activeModule ? (
                  renderEmptyModuleState()
                ) : activeCycle ? (
                  <CycleExecutionBoard
                    cycle={activeCycle}
                    currentUser={currentUser}
                    allAvailableCases={Object.values(customModuleCases).flat()}
                    onUpdateStatus={handleUpdateExecutionStatus}
                    onAddCasesToCycle={handleAddCasesToCycle}
                    onReopenBug={(itemKey, bugKey, notes, screenshotUrl, videoUrl) => 
                      handleReopenJiraBug(activeCycle.id, itemKey, bugKey, notes, screenshotUrl, videoUrl)
                    }
                    onRequestPassEvidence={(cycleId, itemKey, itemTitle) => setPassEvidenceModalConfig({ isOpen: true, cycleId, itemKey, itemTitle })}
                    onSaveTestCase={handleSaveTestCase}
                    onDeleteCycleItem={handleDeleteCycleItem}
                    onBulkEditCycleItems={handleBulkEditCycleItems}
                    onBulkDeleteCycleItems={handleBulkDeleteCycleItems}
                    onSyncEditedCasesToCycle={handleSyncEditedCasesToCycle}
                    onViewCodeSpec={isFeatureActive(featureFlags, 'playwright_drawer') ? (tc) => setSelectedCodeCase(tc) : undefined}
                    onAutomateTestCase={isFeatureActive(featureFlags, 'browser_automation_runner') ? (tc) => handleAutomateTestCase(tc, activeCycle.id) : undefined}
                    onOpenAgentConsoleTrace={handleOpenAgentConsoleTrace}
                    onBackToCycles={() => handleTabChange('cycles')}
                  />
                ) : (
                  <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                    <RotateCw className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h4 className="text-base font-extrabold text-slate-900">No Active Test Cycles Found for {activeModule?.name || 'this module'}</h4>
                    <p className="text-xs text-slate-500 mt-1 mb-4">
                      Create a test cycle first to execute test cases on the live board.
                    </p>
                    <button
                      onClick={() => handleTabChange('cycles')}
                      className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-indigo-600 text-white shadow-md"
                    >
                      Go to Test Cycles
                    </button>
                  </div>
                )
              )}

              {/* Tab 5: Bugs Telemetry (Mockup/Telemetry) */}
              {activeTab === 'bugs' && (
                <div className="space-y-6 animate-fadeIn font-sans">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Jira Defect Tracker</h2>
                      <p className="text-xs text-slate-500">
                        Central registry of all bugs raised across test execution runs and cycles.
                      </p>
                    </div>
                    {canManageCases && (
                      <button
                        onClick={() => {
                          setBugToEdit(undefined);
                          setIsBugCreateEditModalOpen(true);
                        }}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 transition-all flex items-center"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1.5 inline" />
                        Log Defect / Create Bug
                      </button>
                    )}
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead>
                          <tr className="border-b border-slate-100 text-[10px] uppercase font-mono font-bold text-slate-400 pb-2">
                            <th className="py-2">Bug ID</th>
                            <th className="py-2">Summary</th>
                            <th className="py-2">Priority</th>
                            <th className="py-2">Status</th>
                            <th className="py-2 font-mono">Reported At</th>
                            <th className="py-2 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-sans text-xs">
                          {allBugsCombined.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-slate-400 font-medium font-sans">
                                No defect tickets logged in Jira.
                              </td>
                            </tr>
                          ) : (
                            allBugsCombined.map(bug => {
                              let badgeColor = 'bg-slate-50 text-slate-700 border-slate-200';
                              const sev = bug.severity.toLowerCase();
                              if (sev.includes('critical') || sev.includes('blocker')) {
                                badgeColor = 'bg-red-50 text-red-700 border-red-200';
                              } else if (sev.includes('major') || sev.includes('high')) {
                                badgeColor = 'bg-orange-50 text-orange-700 border-orange-200';
                              } else if (sev.includes('minor') || sev.includes('low')) {
                                badgeColor = 'bg-slate-100 text-slate-750 border-slate-200';
                              } else {
                                badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                              }

                              return (
                                <tr key={bug.issueKey}>
                                  <td className="py-3 font-mono font-bold text-indigo-600">{bug.issueKey}</td>
                                  <td className="py-3 font-bold text-slate-950">{bug.summary}</td>
                                  <td className="py-3">
                                    <span className={`${badgeColor} border px-2.5 py-0.5 rounded-full text-[9px] font-extrabold inline-block`}>
                                      {bug.severity}
                                    </span>
                                  </td>
                                  <td className="py-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                      bug.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                                    }`}>
                                      {bug.status}
                                    </span>
                                  </td>
                                  <td className="py-3 text-slate-400 font-medium">Just now</td>
                                  <td className="py-3 text-center space-x-1">
                                    <button
                                      onClick={() => {
                                        let cycleId = '';
                                        let itemKey = '';
                                        let cycleName = '';
                                        for (const cycle of activeProjectCycles) {
                                          const found = cycle.items.find(i => 
                                            (i.jiraBugs || (i.jiraBug ? [i.jiraBug] : [])).some(b => b.issueKey === bug.issueKey)
                                          );
                                          if (found) {
                                            cycleId = cycle.id;
                                            cycleName = cycle.name;
                                            itemKey = found.testCase.key;
                                            break;
                                          }
                                        }

                                        setBugToEdit({ ...bug, cycleId, itemKey, cycleName });
                                        setIsBugCreateEditModalOpen(true);
                                      }}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all inline-block"
                                      title="Edit Defect Ticket"
                                    >
                                      <Settings className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteBug(bug.issueKey)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all inline-block"
                                      title="Delete Defect Ticket"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 6: Settings & User Config */}
              {activeTab === 'settings' && (
                <div className="space-y-6 animate-fadeIn font-sans">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Workspace Settings</h2>
                      <p className="text-xs text-slate-500">
                        Manage roles, teams, project configuration, and import defaults.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                      <h3 className="text-sm font-extrabold text-slate-900 font-sans">User Management</h3>
                      <p className="text-xs text-slate-500 font-medium">Configure roles and permissions for your team mates.</p>
                      <button
                        onClick={() => setIsUserManagementOpen(true)}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all"
                      >
                        Manage Users &amp; Roles
                      </button>
                    </div>


                  </div>
                </div>
              )}
            </>
        </main>

        {/* Create New Project Modal */}
        {isNewProjectModalOpen && (
          <NewProjectModal
            currentUser={currentUser}
            onAddProject={handleAddProject}
            onClose={() => setIsNewProjectModalOpen(false)}
          />
        )}

        {/* User Management & Role Assignment Modal */}
        {isUserManagementOpen && (
          <UserManagementModal
            users={registeredUsers}
            currentUser={currentUser}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onClose={() => setIsUserManagementOpen(false)}
          />
        )}

        {/* Import Modal with RBAC Guarding */}
        {isImporterOpen && activeModule && canManageCases && (
          <TestCaseImporter
            moduleName={activeModule.name}
            currentUser={currentUser}
            onImportCases={handleImportCases}
            onClose={() => setIsImporterOpen(false)}
          />
        )}

        {/* Export Modal */}
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          testCases={testCases}
          certificate={{
            generatedAt: new Date().toISOString(),
            moduleName: activeModule?.name || 'Empty Module',
            totalAstNodes: 0,
            mappedTestCases: testCases.length,
            coveragePercentage: 100,
            unmappedNodesCount: 0,
            isZeroGapCertified: true
          }}
        />

        {/* Create / Edit Defect Ticket Modal */}
        {isBugCreateEditModalOpen && (
          <CreateEditBugModal
            isOpen={isBugCreateEditModalOpen}
            onClose={() => {
              setIsBugCreateEditModalOpen(false);
              setBugToEdit(undefined);
            }}
            bugToEdit={bugToEdit}
            testCycles={activeProjectCycles}
            currentUser={currentUser}
            onSaveBug={handleCreateOrUpdateBugRegistry}
          />
        )}

      {/* Import Success Confirm Modal */}
      {importSuccessCount !== null && (
        <ConfirmModal
          isOpen={true}
          title="Import Successful"
          message={`Successfully imported ${importSuccessCount} manual test cases into the repository!`}
          type="success"
          confirmText="Dismiss"
          onConfirm={() => setImportSuccessCount(null)}
          onCancel={() => setImportSuccessCount(null)}
        />
      )}

      {/* Global Custom Alert Modal Interceptor */}
      {globalAlert?.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fadeIn" onClick={() => setGlobalAlert(null)}>
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full mx-4 border border-slate-200/80 shadow-xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">System Notification</h3>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              {globalAlert.message}
            </p>
            
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setGlobalAlert(null)}
                className="px-5 py-2 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md active:scale-95 transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Playwright Browser Automation Drawer */}
      <AutomationDrawer
        isOpen={isAutomationDrawerOpen}
        onClose={() => setIsAutomationDrawerOpen(false)}
        testCase={selectedAutomateCase}
        onStartAutomation={handleStartAutomationRun}
      />

      {/* Live Automation Browser Trace Simulator Console */}
      {automationParams?.isOpen && selectedAutomateCase && (
        <AutomationSimulator
          isOpen={automationParams.isOpen}
          onClose={() => {
            setAutomationParams(null);
            setAutomateCycleId(undefined);
          }}
          testCase={selectedAutomateCase}
          startingUrl={automationParams.startingUrl}
          deviceProfile={automationParams.deviceProfile}
          browser={automationParams.browser}
          isHeaded={automationParams.isHeaded}
          readOnlyMode={automationParams.readOnlyMode}
          initialStatus={automationParams.initialStatus}
          initialScreenshotUrl={automationParams.initialScreenshotUrl}
          initialStepRuns={automationParams.initialStepRuns}
          onSaveToCycle={(automationParams.cycleId && !automationParams.readOnlyMode) ? (status, evidence, stepRuns) => {
            handleSaveAutomationResultToCycle(automationParams.cycleId!, status, evidence, stepRuns);
          } : undefined}
          onRaiseBug={(automationParams.cycleId && !automationParams.readOnlyMode) ? (failedStep, screenshotUrl) => {
            handleRaiseBugFromAutomation(automationParams.cycleId!, failedStep, screenshotUrl);
          } : undefined}
        />
      )}

      {/* Global Custom Text Prompt Modal */}
      {promptConfig?.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fadeIn" onClick={() => setPromptConfig(null)}>
          <div className="bg-white rounded-3xl p-6 max-w-md w-full mx-4 border border-slate-200/80 shadow-xl space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-extrabold text-slate-900">{promptConfig.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-normal">{promptConfig.message}</p>
            
            <input
              type="text"
              defaultValue={promptConfig.defaultValue}
              placeholder={promptConfig.placeholder}
              id="custom-prompt-input"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-950 focus:outline-none focus:border-indigo-500 font-sans"
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const val = (document.getElementById('custom-prompt-input') as HTMLInputElement)?.value || '';
                  promptConfig.onConfirm(val);
                  setPromptConfig(null);
                }
              }}
            />
            
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setPromptConfig(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const val = (document.getElementById('custom-prompt-input') as HTMLInputElement)?.value || '';
                  promptConfig.onConfirm(val);
                  setPromptConfig(null);
                }}
                className="px-5 py-2 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md active:scale-95 transition-all"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Toast Notification System */}
      {toast && (
        <div 
          className={`fixed bottom-6 right-6 z-50 flex items-center space-x-3 px-4 py-3.5 rounded-2xl border shadow-xl transition-all duration-300 transform ${
            toast.visible 
              ? 'translate-y-0 opacity-100 scale-100' 
              : 'translate-y-4 opacity-0 scale-95 pointer-events-none'
          } ${
            toast.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : toast.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-indigo-50 border-indigo-200 text-indigo-800'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
          {toast.type === 'error' && <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0" />}
          {toast.type === 'info' && <RefreshCw className="w-5 h-5 text-indigo-600 flex-shrink-0 animate-spin-slow" />}
          <span className="text-xs font-bold font-sans">{toast.message}</span>
        </div>
      )}

      {/* Stealth Labs Controls Modal (Cmd + Shift + L) */}
      {isLabsModalOpen && (
        <LabsControlModal
          flags={featureFlags}
          onFlagsUpdated={setFeatureFlags}
          onClose={() => setIsLabsModalOpen(false)}
          onLaunchCodeSpec={() => {
            setIsLabsModalOpen(false);
            if (testCases.length > 0) setSelectedCodeCase(testCases[0]);
          }}
          onLaunchAutomate={() => {
            setIsLabsModalOpen(false);
            if (testCases.length > 0) handleAutomateTestCase(testCases[0]);
          }}
        />
      )}



      {/* SpeedRun Keyboard Execution Mode */}
      {isSpeedRunOpen && activeProjectCycles.length > 0 && (
        <SpeedRunExecutionBoard
          cycle={activeProjectCycles[0]}
          currentUser={currentUser}
          onUpdateStatus={handleUpdateExecutionStatus}
          onClose={() => setIsSpeedRunOpen(false)}
        />
      )}

      {/* AI Story to Test Case Modal */}
      {isStoryModalOpen && activeModule && (
        <StoryToTestCaseModal
          moduleName={activeModule.name}
          onAddTestCases={(newCases) => {
            setCustomModuleCases(prev => ({
              ...prev,
              [selectedModuleId]: [...(prev[selectedModuleId] || []), ...newCases]
            }));
            showToast(`Added ${newCases.length} AI generated test cases to ${activeModule.name}!`, 'success');
          }}
          onClose={() => setIsStoryModalOpen(false)}
        />
      )}

      {/* Playwright & Cypress Code Spec Exporter Drawer */}
      {selectedCodeCase && (
        <PlaywrightCodeDrawer
          testCase={selectedCodeCase}
          onClose={() => setSelectedCodeCase(null)}
        />
      )}

      {/* Mandatory Pass Evidence Upload Modal */}
      {passEvidenceModalConfig?.isOpen && (
        <PassEvidenceUploadModal
          testCaseKey={passEvidenceModalConfig.itemKey}
          testCaseName={passEvidenceModalConfig.itemTitle}
          onConfirmPass={(evidence) => {
            handleUpdateExecutionStatus(
              passEvidenceModalConfig.cycleId,
              passEvidenceModalConfig.itemKey,
              'PASSED',
              undefined,
              undefined,
              undefined,
              evidence
            );
            setPassEvidenceModalConfig(null);
          }}
          onClose={() => setPassEvidenceModalConfig(null)}
        />
      )}

      </div>

    </div>
  );
};
