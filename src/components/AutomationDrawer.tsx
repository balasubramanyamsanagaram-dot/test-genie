import React, { useState } from 'react';
import { X, Play, Settings, Monitor, Laptop, Smartphone, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';
import { TestCase } from '../types';

interface AutomationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  testCase: TestCase | null;
  onStartAutomation: (
    startingUrl: string,
    deviceProfile: string,
    browser: string,
    isHeaded: boolean
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

  if (!isOpen || !testCase) return null;

  // Split steps by newlines or use an array if pre-defined
  const stepsList = testCase.testSteps
    ? testCase.testSteps.split(/\n+/).filter(line => line.trim().length > 0)
    : [];

  return (
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
              <Settings className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">No-code Automation</h3>
              <p className="text-[10px] text-slate-400 font-medium">Verify login or page actions autonomously</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Target App Details */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/50 space-y-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Test Case Library</span>
            <h4 className="text-xs font-extrabold text-slate-950 truncate">{testCase.name}</h4>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-[9px] font-mono font-bold bg-indigo-50 border border-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">
                {testCase.key}
              </span>
              <span className="text-[9px] text-slate-400 font-medium">{stepsList.length} Automation Steps</span>
            </div>
          </div>

          {/* Config options */}
          <div className="space-y-4">
            
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
                <div className="relative">
                  <select
                    value={deviceProfile}
                    onChange={e => setDeviceProfile(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-950 appearance-none focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Desktop">Desktop</option>
                    <option value="Tablet">Tablet</option>
                    <option value="Mobile">Mobile</option>
                  </select>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                    {deviceProfile === 'Desktop' ? <Laptop className="w-3.5 h-3.5" /> : deviceProfile === 'Tablet' ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>

              {/* Browser type */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-extrabold text-slate-400 uppercase tracking-wide">Target Browser</label>
                <select
                  value={browser}
                  onChange={e => setBrowser(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-950 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Google Chrome">Google Chrome</option>
                  <option value="Firefox">Mozilla Firefox</option>
                  <option value="Safari">Apple Safari</option>
                </select>
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
        <div className="p-5 border-t border-slate-100 bg-slate-50/40 space-y-4">
          <div className="flex items-start space-x-2 text-[9px] text-slate-400 leading-normal">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>
              By clicking "Run Test", the backend will automatically parse these manual steps, compile browser actions, and execute Playwright chromium binaries on your local workstation.
            </span>
          </div>

          <button
            onClick={() => onStartAutomation(startingUrl, deviceProfile, browser, isHeaded)}
            className="w-full inline-flex items-center justify-center py-3 rounded-2xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-98 transition-all"
          >
            <Play className="w-4 h-4 mr-2" />
            Run Test
          </button>
        </div>

      </div>
    </div>
  );
};
