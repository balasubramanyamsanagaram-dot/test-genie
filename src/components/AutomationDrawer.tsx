import React, { useState } from 'react';
import { X, Play, Settings, Monitor, Laptop, Smartphone, AlertTriangle, ShieldCheck, HelpCircle, Code2 } from 'lucide-react';
import { TestCase } from '../types';
import { SearchableSelect } from './SearchableSelect';
import { PlaywrightCodeModal } from './PlaywrightCodeModal';

interface AutomationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  testCase: TestCase | null;
  onStartAutomation: (
    startingUrl: string,
    deviceProfile: string,
    browser: string,
    isHeaded: boolean,
    customScript?: string
  ) => void;
}

export const AutomationDrawer: React.FC<AutomationDrawerProps> = ({
  isOpen,
  onClose,
  testCase,
  onStartAutomation
}) => {
  const [startingUrl, setStartingUrl] = useState('https://qa.hrmgenie.outstrive.co/login');
  const [deviceProfile, setDeviceProfile] = useState('Desktop');
  const [browser, setBrowser] = useState('Google Chrome');
  const [isHeaded, setIsHeaded] = useState(true);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);

  if (!isOpen || !testCase) return null;

  // Split steps by newlines or use an array if pre-defined
  const stepsList = testCase.testSteps
    ? testCase.testSteps.split(/\n+/).filter(line => line.trim().length > 0)
    : [];

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end font-sans">
        {/* Dark backdrop */}
        <div 
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity duration-300 animate-fadeIn"
          onClick={onClose}
        />

        {/* Drawer Body panel */}
        <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-200/80 animate-slideLeft transform duration-300">
          
          {/* Header bar */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-mono font-extrabold uppercase text-indigo-600 tracking-wider">Automate Test Case</h3>
                <h2 className="text-sm font-bold text-slate-900 truncate max-w-xs">{testCase.key}: {testCase.name}</h2>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            
            {/* Starting URL */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-extrabold text-slate-400 uppercase tracking-wide">Starting URL</label>
              <input
                type="text"
                value={startingUrl}
                onChange={e => setStartingUrl(e.target.value)}
                placeholder="https://qa.hrmgenie.outstrive.co/login"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4.5 py-2.5 text-xs text-slate-950 focus:outline-none focus:border-indigo-500 font-sans"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Device Profile */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-extrabold text-slate-400 uppercase tracking-wide">Device Profile</label>
                <SearchableSelect
                  options={[
                    { value: 'Desktop', label: 'Desktop' },
                    { value: 'Tablet', label: 'Tablet' },
                    { value: 'Mobile', label: 'Mobile' }
                  ]}
                  value={deviceProfile}
                  onChange={setDeviceProfile}
                />
              </div>

              {/* Browser type */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-extrabold text-slate-400 uppercase tracking-wide">Target Browser</label>
                <SearchableSelect
                  options={[
                    { value: 'Google Chrome', label: 'Google Chrome' },
                    { value: 'Firefox', label: 'Mozilla Firefox' },
                    { value: 'Safari', label: 'Safari' },
                    { value: 'Microsoft Edge', label: 'Microsoft Edge' }
                  ]}
                  value={browser}
                  onChange={setBrowser}
                />
              </div>
            </div>

            {/* Run mode (Headed vs Headless toggle) */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Headed Execution Mode</span>
                <span className="text-[9px] text-slate-400 font-medium block">Opens visible browser window on your Mac screen</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isHeaded} 
                  onChange={e => setIsHeaded(e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Parsed Steps List */}
            <div className="space-y-3">
              <label className="text-[10px] font-mono font-extrabold text-slate-400 uppercase tracking-wide block">Parsed Instructions ({stepsList.length})</label>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {stepsList.map((step, idx) => (
                  <div key={idx} className="bg-slate-50/50 p-3 rounded-xl border border-slate-200/50 flex items-start space-x-2.5 text-xs">
                    <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-mono font-extrabold text-slate-400 text-[10px] flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-slate-700 font-medium leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Action footer */}
          <div className="p-5 border-t border-slate-100 bg-slate-50/40 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIsCodeModalOpen(true)}
                className="py-2.5 px-3 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <Code2 className="w-4 h-4 text-indigo-400" />
                <span>View Code</span>
              </button>

              <button
                onClick={() => onStartAutomation(startingUrl, deviceProfile, browser, isHeaded)}
                className="py-2.5 px-3 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Run Test</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      <PlaywrightCodeModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        testCaseKey={testCase.key}
        testCaseTitle={`${testCase.key}: ${testCase.name}`}
        startingUrl={startingUrl}
        steps={stepsList}
        onRunAutomation={(customScript) => onStartAutomation(startingUrl, deviceProfile, browser, isHeaded, customScript)}
      />
    </>
  );
};
