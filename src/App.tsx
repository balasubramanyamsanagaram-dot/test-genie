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
import { DEFAULT_HOLIDAYS_TEST_CASES, DEFAULT_PRELOADED_TEST_CYCLES } from './engine/default-data';
import { AuditCertificate, TestCase, TestCycle, TestCycleItem, TestExecutionStatus, ProjectModule, JiraBug, UserProfile, REGISTERED_ENTERPRISE_USERS, EnterpriseProject, DEFAULT_ENTERPRISE_PROJECTS } from './types';
import { ShieldCheck, FileCheck2, Upload, RotateCw, PlaySquare, Plus, FolderPlus, Layers, Building2, Bug, Settings } from 'lucide-react';

import { UserManagementModal } from './components/UserManagementModal';
import { ConfirmModal } from './components/ConfirmModal';

const STORAGE_KEY_PROJECTS = 'test_genie_projects_v2';
const STORAGE_KEY_SEL_PROJECT = 'test_genie_selected_project_v2';
const STORAGE_KEY_SEL_MODULE = 'test_genie_selected_module_v2';
const STORAGE_KEY_CASES = 'test_genie_custom_cases_v2';
const STORAGE_KEY_CYCLES = 'test_genie_test_cycles_v2';
const STORAGE_KEY_USER = 'test_genie_authenticated_user_v1';
const STORAGE_KEY_USERS = 'registered_enterprise_users_v2';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'matrix' | 'repository' | 'cycles' | 'execution' | 'bugs' | 'settings'>('dashboard');
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');

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

  // Load Persisted Projects from localStorage (Auto-restoring default modules if deleted)
  const [projects, setProjects] = useState<EnterpriseProject[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROJECTS);
      if (saved) {
        let parsed: EnterpriseProject[] = JSON.parse(saved);
        parsed = parsed.filter(p => p.id !== 'proj-mobile' && p.id !== 'proj-fintech');
        
        // Auto-restore default modules for HRM project if empty
        parsed = parsed.map(p => {
          if (p.id === 'proj-hrm' && (!p.modules || p.modules.length === 0)) {
            return { ...p, modules: DEFAULT_ENTERPRISE_PROJECTS[0].modules };
          }
          return p;
        });

        if (parsed.length > 0) return parsed;
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
    try {
      const savedV2 = localStorage.getItem(STORAGE_KEY_CASES);
      if (savedV2) {
        casesMap = JSON.parse(savedV2);
      } else {
        const savedV1 = localStorage.getItem('test_genie_custom_cases_v1');
        if (savedV1) {
          casesMap = JSON.parse(savedV1);
        }
      }
    } catch (e) {}

    // Guarantee Holidays module always has master 100 test cases if empty
    if (!casesMap['mod-holidays'] || casesMap['mod-holidays'].length === 0) {
      casesMap['mod-holidays'] = DEFAULT_HOLIDAYS_TEST_CASES;
    }

    return casesMap;
  });

  // Load Persisted Test Cycles from localStorage (Backward Compatible)
  const [testCycles, setTestCycles] = useState<TestCycle[]>(() => {
    try {
      const savedV2 = localStorage.getItem(STORAGE_KEY_CYCLES);
      if (savedV2) {
        const parsed = JSON.parse(savedV2);
        if (parsed.length > 0) return parsed;
      }
      const savedV1 = localStorage.getItem('test_genie_test_cycles_v1');
      if (savedV1) {
        const parsedV1 = JSON.parse(savedV1);
        if (parsedV1.length > 0) return parsedV1;
      }
    } catch (e) {}
    return DEFAULT_PRELOADED_TEST_CYCLES;
  });

  const [activeCycleId, setActiveCycleId] = useState<string>('');
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isImporterOpen, setIsImporterOpen] = useState<boolean>(false);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);

  // Sync Custom Cases to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(customModuleCases));
    } catch (e) {}
  }, [customModuleCases]);

  // Sync Test Cycles to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CYCLES, JSON.stringify(testCycles));
    } catch (e) {}
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

    const totalDefects = projCycles.reduce((acc, c) => {
      const cycleItems = c.items || [];
      return acc + cycleItems.reduce((sum, item) => sum + (item.jiraBugs?.length || (item.defectId ? 1 : 0)), 0);
    }, 0);

    // Compute dynamic executions and pass rates
    const executedItems = projCycles.flatMap(c => c.items || []);
    const totalExecuted = executedItems.filter(item => item.executionStatus !== 'UNEXECUTED').length;
    const passedCount = executedItems.filter(item => item.executionStatus === 'PASSED').length;
    const failedCount = executedItems.filter(item => item.executionStatus === 'FAILED').length;
    const blockedCount = executedItems.filter(item => item.executionStatus === 'BLOCKED').length;
    
    const passRate = totalExecuted > 0 ? Math.round((passedCount / totalExecuted) * 100) : 0;
    const executionsToday = totalExecuted;

    // Defect priority distribution
    const allBugs = executedItems.flatMap(item => item.jiraBugs || (item.jiraBug ? [item.jiraBug] : []));
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
      recentRuns
    };
  }, [activeProject.modules, customModuleCases, testCycles, activeProject.id]);

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

  // Single Test Case Delete
  const handleDeleteTestCase = (key: string) => {
    // 1. Delete from customModuleCases
    setCustomModuleCases(prev => {
      const modCases = prev[selectedModuleId] || [];
      const updatedModCases = modCases.filter(c => c.key !== key);
      return { ...prev, [selectedModuleId]: updatedModCases };
    });

    // 2. Delete from test cycles
    setTestCycles(prev => prev.map(cycle => ({
      ...cycle,
      items: cycle.items.filter(item => item.testCase.key !== key)
    })));
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

  // Bulk Delete Test Cases
  const handleBulkDeleteTestCases = (keys: string[]) => {
    const keySet = new Set(keys);

    setCustomModuleCases(prev => {
      const modCases = prev[selectedModuleId] || [];
      const updatedModCases = modCases.filter(c => !keySet.has(c.key));
      return { ...prev, [selectedModuleId]: updatedModCases };
    });

    setTestCycles(prev => prev.map(cycle => ({
      ...cycle,
      items: cycle.items.filter(item => !keySet.has(item.testCase.key))
    })));
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

  // Handle Live Status Update
  const handleUpdateExecutionStatus = (
    cycleId: string,
    itemKey: string,
    status: TestExecutionStatus,
    jiraBug?: JiraBug,
    bugNotes?: string,
    defectId?: string
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
            }
            return b;
          });

          if (primaryBug && status === 'PASSED') {
            primaryBug = { ...primaryBug, status: 'Resolved' };
          }

          return {
            ...item,
            executionStatus: status,
            jiraBug: primaryBug,
            jiraBugs: existingBugs,
            bugNotes: bugNotes !== undefined ? bugNotes : item.bugNotes,
            defectId: primaryBug?.issueKey || item.defectId,
            executedBy: currentUser?.name || 'QA Tester',
            executedAt: new Date().toLocaleString()
          };
        })
      };
    }));
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
          onRestoreDefaultModules={handleRestoreDefaultModules}
          onLogout={handleLogout}
        />

        {/* Main Content Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Global Empty State: No Modules Created Yet */}
          {!activeModule ? (
            <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm text-center max-w-xl mx-auto my-12">
              <FolderPlus className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
              <h2 className="text-2xl font-extrabold text-slate-900">No Module Repositories Found</h2>
              <p className="text-xs text-slate-500 mt-2 mb-6 leading-relaxed">
                Create a new module repository or restore default repositories for <strong>{activeProject.name}</strong>.
              </p>
              <div className="flex items-center justify-center space-x-3">
                {canManageCases && (
                  <button
                    onClick={() => {
                      const name = prompt('Enter module name (e.g. Holidays & Leave Management):');
                      if (name) handleAddNewModule(name);
                    }}
                    className="inline-flex items-center px-5 py-2.5 rounded-2xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Repository
                  </button>
                )}

                <button
                  onClick={handleRestoreDefaultModules}
                  className="inline-flex items-center px-5 py-2.5 rounded-2xl text-xs font-extrabold bg-slate-900 hover:bg-slate-800 text-white shadow-md active:scale-95 transition-all"
                >
                  <RotateCw className="w-4 h-4 mr-2 text-indigo-400" />
                  Restore Default Modules
                </button>
              </div>
            </div>
          ) : (
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
                        <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mr-1.5 font-mono">▲ 5.2%</span>
                        <span className="text-slate-400 font-medium">vs last month</span>
                      </div>
                    </div>

                    {/* Metric 2 */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Executions Today</span>
                          <h3 className="text-2xl font-black text-slate-900 mt-1">{dashboardStats.executionsToday}</h3>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                          <PlaySquare className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex items-center mt-4 text-[10px] font-extrabold">
                        <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mr-1.5 font-mono">▲ 12.4%</span>
                        <span className="text-slate-400 font-medium">vs yesterday</span>
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
                        <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full mr-1.5 font-mono">▼ -0.2%</span>
                        <span className="text-slate-400 font-medium">vs average</span>
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
                        <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full mr-1.5 font-mono">▲ +3.1%</span>
                        <span className="text-slate-400 font-medium">vs last cycle</span>
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
                          <path d="M0,130 C40,90 70,110 130,70 C190,60 250,95 310,110 C370,60 400,50 400,50" fill="none" stroke="#0ea5e9" strokeWidth="3" strokeLinecap="round" />
                          <path d="M0,130 C40,90 70,110 130,70 C190,60 250,95 310,110 C370,60 400,50 400,50 L400,160 L0,160 Z" fill="url(#passGrad)" />
                          
                          {/* Failed Curve */}
                          <path d="M0,140 C40,130 70,120 130,135 C190,140 250,115 310,130 C370,125 400,130 400,130" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
                          
                          {/* Blocked Curve */}
                          <path d="M0,150 C40,145 70,148 130,140 C190,146 250,142 310,147 C370,145 400,148 400,148" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
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
                          onClick={() => {
                            const name = prompt('Enter new module repository name:');
                            if (name) handleAddNewModule(name);
                          }}
                          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all"
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
                  />
                </div>
              )}

              {/* Tab 2.5: Specific Module Repository Test Case Table (Active Repository View) */}
              {activeTab === 'repository' && (
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

                    <div className="flex items-center space-x-2">
                      {canManageCases && (
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
                        {canManageCases ? `Upload reference files (.csv, .xlsx, .json) or create manual test cases for ${activeModule.name}.` : `Only QA Engineer, QA Lead, or Admin roles can upload test cases.`}
                      </p>
                      {canManageCases && (
                        <button
                          onClick={() => setIsImporterOpen(true)}
                          className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
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
                      canManageCases={canManageCases}
                    />
                  )}
                </div>
              )}

              {/* Tab 3: Test Cycle Manager */}
              {activeTab === 'cycles' && (
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
                />
              )}

              {/* Tab 4: Live Execution Board with Active User Role Guarding */}
              {activeTab === 'execution' && (
                activeCycle ? (
                  <CycleExecutionBoard
                    cycle={activeCycle}
                    currentUser={currentUser}
                    allAvailableCases={Object.values(customModuleCases).flat()}
                    onUpdateStatus={handleUpdateExecutionStatus}
                    onAddCasesToCycle={handleAddCasesToCycle}
                    onReopenBug={(itemKey, bugKey, notes, screenshotUrl, videoUrl) => 
                      handleReopenJiraBug(activeCycle.id, itemKey, bugKey, notes, screenshotUrl, videoUrl)
                    }
                    onBackToCycles={() => handleTabChange('cycles')}
                  />
                ) : (
                  <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                    <RotateCw className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h4 className="text-base font-extrabold text-slate-900">No Active Test Cycles Found for {activeModule.name}</h4>
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
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-sans text-xs">
                          {/* Render default defect rows */}
                          <tr>
                            <td className="py-3 font-mono font-bold text-indigo-600">BUG-3412</td>
                            <td className="py-3 font-bold text-slate-950">Employee detail edit throws database timeout exception</td>
                            <td className="py-3">
                              <span className="bg-red-50 text-red-700 border border-red-200 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold glow-failed inline-block">Critical</span>
                            </td>
                            <td className="py-3">
                              <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[9px] font-bold">Open</span>
                            </td>
                            <td className="py-3 text-slate-400 font-medium">12 mins ago</td>
                          </tr>
                          <tr>
                            <td className="py-3 font-mono font-bold text-indigo-600">BUG-3408</td>
                            <td className="py-3 font-bold text-slate-950">Leave approval email notification shows empty username link</td>
                            <td className="py-3">
                              <span className="bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold glow-blocked inline-block">High</span>
                            </td>
                            <td className="py-3">
                              <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[9px] font-bold">Open</span>
                            </td>
                            <td className="py-3 text-slate-400 font-medium">1 hour ago</td>
                          </tr>
                          <tr>
                            <td className="py-3 font-mono font-bold text-indigo-600">BUG-3395</td>
                            <td className="py-3 font-bold text-slate-950">Salary slip PDF export breaks layout when name is long</td>
                            <td className="py-3">
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold glow-passed inline-block">Medium</span>
                            </td>
                            <td className="py-3">
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[9px] font-bold">Resolved</span>
                            </td>
                            <td className="py-3 text-slate-400 font-medium">1 day ago</td>
                          </tr>
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

                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                      <h3 className="text-sm font-extrabold text-slate-900 font-sans">Restore Factory Data</h3>
                      <p className="text-xs text-slate-500 font-medium">Reset default modules data to original factory specs.</p>
                      <button
                        onClick={handleRestoreDefaultModules}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all"
                      >
                        Restore Defaults
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

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

      </div>

    </div>
  );
};
