import React, { useState, useEffect, useRef } from 'react';
import { ProjectModule, TestCase, EnterpriseProject } from '../types';
import { Search, Layers, RotateCw, PlaySquare, Bug, Settings, FolderKanban, Upload, Download, Sparkles, ChevronRight, Command } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  modules: ProjectModule[];
  projects: EnterpriseProject[];
  testCases: TestCase[];
  onSelectTab: (tab: 'dashboard' | 'matrix' | 'repository' | 'cycles' | 'execution' | 'bugs' | 'settings') => void;
  onSelectModule: (moduleId: string) => void;
  onSelectProject: (projectId: string) => void;
  onTriggerImport: () => void;
  onTriggerExport: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Module Repositories' | 'Projects' | 'Test Cases' | 'Quick Actions';
  icon: React.ReactNode;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  modules,
  projects,
  testCases,
  onSelectTab,
  onSelectModule,
  onSelectProject,
  onTriggerImport,
  onTriggerExport
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Build items pool
  const allItems: CommandItem[] = [
    // Navigation
    { id: 'nav-dash', title: 'Go to Dashboard', category: 'Navigation', icon: <Layers className="w-4 h-4 text-indigo-600" />, action: () => { onSelectTab('dashboard'); onClose(); } },
    { id: 'nav-matrix', title: 'Go to Module Repositories (Matrix)', category: 'Navigation', icon: <FolderKanban className="w-4 h-4 text-indigo-600" />, action: () => { onSelectTab('matrix'); onClose(); } },
    { id: 'nav-repo', title: 'Go to Active Repository Table', category: 'Navigation', icon: <Layers className="w-4 h-4 text-indigo-600" />, action: () => { onSelectTab('repository'); onClose(); } },
    { id: 'nav-cycles', title: 'Go to Test Cycles Manager', category: 'Navigation', icon: <RotateCw className="w-4 h-4 text-indigo-600" />, action: () => { onSelectTab('cycles'); onClose(); } },
    { id: 'nav-execution', title: 'Go to Live Execution Board', category: 'Navigation', icon: <PlaySquare className="w-4 h-4 text-indigo-600" />, action: () => { onSelectTab('execution'); onClose(); } },
    { id: 'nav-bugs', title: 'Go to Jira Defects Tracker', category: 'Navigation', icon: <Bug className="w-4 h-4 text-indigo-600" />, action: () => { onSelectTab('bugs'); onClose(); } },

    // Quick Actions
    { id: 'act-import', title: 'Add / Import Test Cases File', category: 'Quick Actions', icon: <Upload className="w-4 h-4 text-emerald-600" />, action: () => { onTriggerImport(); onClose(); } },
    { id: 'act-export', title: 'Export Zephyr Scale CSV Suite', category: 'Quick Actions', icon: <Download className="w-4 h-4 text-purple-600" />, action: () => { onTriggerExport(); onClose(); } },

    // Modules
    ...modules.map(mod => ({
      id: `mod-${mod.id}`,
      title: `Module: ${mod.name}`,
      category: 'Module Repositories' as const,
      icon: <FolderKanban className="w-4 h-4 text-sky-600" />,
      action: () => { onSelectModule(mod.id); onSelectTab('repository'); onClose(); }
    })),

    // Projects
    ...projects.map(proj => ({
      id: `proj-${proj.id}`,
      title: `Switch Project: ${proj.name} [${proj.key}]`,
      category: 'Projects' as const,
      icon: <Layers className="w-4 h-4 text-amber-600" />,
      action: () => { onSelectProject(proj.id); onClose(); }
    })),

    // Test cases (first 20 matches)
    ...testCases.slice(0, 20).map(tc => ({
      id: `tc-${tc.key}`,
      title: `${tc.key}: ${tc.name}`,
      category: 'Test Cases' as const,
      icon: <Sparkles className="w-4 h-4 text-purple-500" />,
      action: () => { onSelectTab('repository'); onClose(); }
    }))
  ];

  // Filter items based on search query
  const filteredItems = query.trim() === ''
    ? allItems.slice(0, 12)
    : allItems.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 15);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn font-sans">
      <div
        className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-100"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center space-x-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-indigo-600 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, test key (e.g. HOL-T01), or search module..."
            className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-sans font-semibold"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-white text-slate-400 border border-slate-200 px-2 py-1 rounded-md shadow-2xs">
            <Command className="w-3 h-3" /> K
          </kbd>
        </div>

        {/* Items List */}
        <div className="p-2 overflow-y-auto max-h-[60vh] divide-y divide-slate-100">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-medium">
              No matching commands or test cases found for "{query}"
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`px-4 py-3 rounded-2xl flex items-center justify-between cursor-pointer transition-all ${
                    isSelected ? 'bg-indigo-50 border border-indigo-200/80 shadow-xs' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <div className={`p-2 rounded-xl ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      {item.icon}
                    </div>
                    <div className="truncate">
                      <div className={`text-xs font-bold truncate ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                        {item.title}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center text-[10px] font-bold text-slate-400">
                    {isSelected && <ChevronRight className="w-4 h-4 text-indigo-600" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Guidance */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] font-medium text-slate-400">
          <div className="flex items-center space-x-3">
            <span><kbd className="bg-white border px-1.5 py-0.5 rounded text-[9px]">↑</kbd> <kbd className="bg-white border px-1.5 py-0.5 rounded text-[9px]">↓</kbd> navigate</span>
            <span><kbd className="bg-white border px-1.5 py-0.5 rounded text-[9px]">↵</kbd> select</span>
            <span><kbd className="bg-white border px-1.5 py-0.5 rounded text-[9px]">ESC</kbd> dismiss</span>
          </div>
          <span className="font-mono text-[10px] text-indigo-600 font-bold">Genie Command Engine v5.0</span>
        </div>

      </div>
    </div>
  );
};
