import React, { useState } from 'react';
import { UserProfile, REGISTERED_ENTERPRISE_USERS } from '../types';
import { ShieldCheck, Lock, Mail, Key, Eye, EyeOff, AlertCircle, ArrowRight, CheckCircle2, Building2 } from 'lucide-react';

interface LoginGatewayProps {
  registeredUsers: UserProfile[];
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginGateway: React.FC<LoginGatewayProps> = ({
  registeredUsers,
  onLoginSuccess
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = email.trim().toLowerCase();
    const foundUser = registeredUsers.find(
      u => u.email.toLowerCase() === cleanEmail && u.password === password
    );

    if (foundUser) {
      onLoginSuccess(foundUser);
    } else {
      setErrorMessage('Invalid credentials. Please verify your email and password.');
    }
  };

  const handleQuickDemoLogin = (user: UserProfile) => {
    setEmail(user.email);
    setPassword(user.password || '');
    onLoginSuccess(user);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
        
        {/* Left Side: Brand Hero Panel (5 Cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-6 relative z-10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/40">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight">TestGenie QA</h1>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                  v4.2 Enterprise
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <h2 className="text-2xl font-extrabold text-white leading-tight">
                Secure Quality Assurance Gateway
              </h2>
              <p className="text-xs text-indigo-200/80 leading-relaxed">
                Log in with your enterprise credentials to access test case repositories, live execution cycles, and Jira defect telemetry.
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-8 text-[11px] text-indigo-300/70 border-t border-indigo-900/60 relative z-10 font-mono">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Role-Based Access Control (RBAC)</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Session Encryption & Audit Logged</span>
            </div>
          </div>
        </div>

        {/* Right Side: Password Login Form & Quick Demo Sign-In (7 Cols) */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between space-y-6">
          
          <div>
            <div className="mb-6">
              <h3 className="text-xl font-extrabold text-slate-900">Sign in to your account</h3>
              <p className="text-xs text-slate-500 mt-1">Enter your email address and password to continue.</p>
            </div>

            {errorMessage && (
              <div className="mb-4 bg-rose-50 border border-rose-200 rounded-2xl p-3 flex items-center space-x-3 text-xs text-rose-800 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    autoFocus
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 font-bold focus:outline-none focus:border-indigo-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Password</label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-10 py-2.5 text-slate-900 font-bold focus:outline-none focus:border-indigo-600 focus:bg-white transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow-md shadow-indigo-600/20 inline-flex items-center justify-center active:scale-95 transition-all text-xs"
              >
                Sign In to TestGenie
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </form>
          </div>

          {/* Quick Demo Sign-In Credentials */}
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              Registered Demo Credentials (1-Click Login)
            </span>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {registeredUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleQuickDemoLogin(user)}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 text-left transition-all group flex items-center justify-between"
                >
                  <div className="min-w-0 pr-1">
                    <span className="font-bold text-slate-900 block truncate group-hover:text-indigo-700">{user.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono block truncate">{user.role}</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all">
                    Login
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
