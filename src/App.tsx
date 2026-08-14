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
import { ShieldCheck, FileCheck2, Upload, RotateCw, PlaySquare, Plus, FolderPlus, Layers, Building2 } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'matrix' | 'cycles' | 'execution'>('dashboard');
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

  // Active module object
  const activeModule = useMemo(() => {
    return activeProject.modules.find(m => m.id === selectedModuleId) || activeProject.modules[0];
  }, [activeProject, selectedModuleId]);

  // Handle adding new Project
  const handleAddProject = (newProject: EnterpriseProject) => {
    setProjects(prev => [newProject, ...prev]);
    setSelectedProjectId(newProject.id);
  };

  const handleTabChange = (tab: 'dashboard' | 'matrix' | 'cycles' | 'execution') => {
    setActiveTab(tab);
    setGlobalSearchQuery('');
  };

  // Requirement: Clicking any module ALWAYS opens the Test Case Repository tab immediately!
  const handleSelectModuleSmart = (id: string) => {
    setSelectedModuleId(id);
    setActiveTab('matrix');
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
        testCasesCount={testCases.length}
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
              {/* Tab 1: Dashboard Overview */}
              {activeTab === 'dashboard' && (
                <div className="space-y-8">
                  
                  {/* Clean Enterprise Light Theme Banner */}
                  <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/80">
                    <div className="max-w-2xl relative z-10">
                      <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full border border-indigo-200 inline-flex items-center">
                        <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                        Project [{activeProject.key}]: {activeProject.name} — Logged as {currentUser.name} ({currentUser.role})
                      </span>
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
                        Active Repository: <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">{activeModule.name}</span>
                      </h1>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed font-normal">
                        {activeProject.description}. Upload .csv / .xlsx reference files, execute live test cycles, and track Jira defect resolution telemetry.
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-3 mt-6">
                        {canManageCases && (
                          <button
                            onClick={() => setIsImporterOpen(true)}
                            className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all active:scale-95"
                          >
                            <Upload className="w-3.5 h-3.5 mr-1.5" />
                            Add / Upload Test Cases
                          </button>
                        )}

                        <button
                          onClick={() => handleTabChange('cycles')}
                          className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all active:scale-95"
                        >
                          <RotateCw className="w-3.5 h-3.5 mr-1.5" />
                          Test Execution Cycles
                        </button>

                        <button
                          onClick={() => handleTabChange('execution')}
                          className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all active:scale-95"
                        >
                          <PlaySquare className="w-3.5 h-3.5 mr-1.5" />
                          Live Execution Board
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Module Repositories Summary Cards Grid with Global Search Filter */}
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
                      handleTabChange('matrix');
                    }}
                    onEditModule={handleEditModule}
                    onDeleteModule={handleDeleteModule}
                  />

                </div>
              )}

              {/* Tab 2: Test Repository & Importer with Global Search Sync */}
              {activeTab === 'matrix' && (
                <div className="space-y-4">
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
