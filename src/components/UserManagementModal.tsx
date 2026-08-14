import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types';
import { Users, UserPlus, X, Shield, Key, Mail, Trash2, Edit2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { ConfirmModal, ConfirmType } from './ConfirmModal';
import { SearchableSelect } from './SearchableSelect';

interface UserManagementModalProps {
  users: UserProfile[];
  currentUser: UserProfile;
  onAddUser: (newUser: UserProfile) => void;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onDeleteUser: (userId: string) => void;
  onClose: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  users,
  currentUser,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onClose
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Custom confirmation modal state
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: ConfirmType;
    confirmText: string;
    onConfirm: () => void;
  } | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('QA Engineer');

  const isAdmin = currentUser.role === 'Admin';

  const avatarColors = [
    'bg-indigo-600',
    'bg-rose-600',
    'bg-emerald-600',
    'bg-purple-600',
    'bg-amber-600',
    'bg-cyan-600'
  ];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Only Admin users can create new user accounts.');
      return;
    }
    if (!name.trim() || !email.trim() || !password.trim()) {
      alert('Validation Error: Name, Email, and Password are required.');
      return;
    }

    const emailExists = users.some(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (emailExists) {
      alert(`User with email '${email.trim()}' already exists.`);
      return;
    }

    const newUser: UserProfile = {
      id: `user-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim(),
      role,
      avatarColor: avatarColors[Math.floor(Math.random() * avatarColors.length)]
    };

    onAddUser(newUser);
    setName('');
    setEmail('');
    setPassword('');
    setIsAdding(false);
  };

  const handleStartEdit = (user: UserProfile) => {
    setEditingUserId(user.id);
    setName(user.name);
    setEmail(user.email);
    setPassword(user.password || '');
    setRole(user.role);
  };

  const handleSaveEdit = (user: UserProfile, e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...user,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim() || user.password,
      role
    };

    onUpdateUser(updated);
    setEditingUserId(null);
  };

  const handleDelete = (user: UserProfile) => {
    if (user.id === currentUser.id) {
      alert('Action Blocked: You cannot delete your own active logged-in Admin account.');
      return;
    }
    setConfirmConfig({
      isOpen: true,
      title: 'Delete User Account',
      message: `Are you sure you want to permanently delete the user account for "${user.name}" (${user.email})? They will lose all access to TestGenie. This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete User',
      onConfirm: () => {
        onDeleteUser(user.id);
        setConfirmConfig(null);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-rose-600 flex items-center justify-center text-white font-bold shadow-md">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">User Management & Role Assignments</h3>
              <p className="text-xs text-slate-500">Admin Control Panel — Create users, assign RBAC permissions, and manage credentials.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 text-slate-400 font-bold">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Actions Bar */}
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700">
            Registered Enterprise Accounts ({users.length})
          </span>

          {isAdmin && (
            <button
              onClick={() => {
                setName('');
                setEmail('');
                setPassword('');
                setRole('QA Engineer');
                setIsAdding(true);
              }}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-sm active:scale-95 transition-all inline-flex items-center"
            >
              <UserPlus className="w-3.5 h-3.5 mr-1.5" />
              + Create New User
            </button>
          )}
        </div>

        {/* Create User Drawer Form */}
        {isAdding && (
          <form onSubmit={handleCreateSubmit} className="p-5 bg-rose-50/50 border-b border-rose-100 space-y-3 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-rose-900 flex items-center">
                <UserPlus className="w-4 h-4 mr-1.5 text-rose-600" />
                Add New Enterprise User Account
              </span>
              <button type="button" onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Vikram Malhotra"
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 font-bold focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Corporate Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. vikram@acmecorp.com"
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 font-bold focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Password *</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="e.g. Pass@123"
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 font-bold focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Assigned RBAC Role *</label>
                <SearchableSelect
                  options={[
                    { value: 'Admin', label: 'Admin (Full Control)' },
                    { value: 'QA Lead', label: 'QA Lead (Full Operations)' },
                    { value: 'QA Engineer', label: 'QA Engineer (Full Operations)' },
                    { value: 'Developer', label: 'Developer (Failure Inspection)' },
                    { value: 'Auditor', label: 'Auditor (Read-Only)' }
                  ]}
                  value={role}
                  onChange={val => setRole(val as UserRole)}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-200 text-slate-700 font-bold hover:bg-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-sm active:scale-95 transition-all"
              >
                Save User Account
              </button>
            </div>
          </form>
        )}

        {/* User List */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          {users.map(user => {
            const isEditingThis = editingUserId === user.id;

            if (isEditingThis) {
              return (
                <form key={user.id} onSubmit={e => handleSaveEdit(user, e)} className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl space-y-3 text-xs">
                  <div className="flex items-center justify-between font-bold text-indigo-900">
                    <span>Editing User: {user.name}</span>
                    <button type="button" onClick={() => setEditingUserId(null)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">New Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Leave blank to keep same"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Role</label>
                      <SearchableSelect
                        options={[
                          { value: 'Admin', label: 'Admin' },
                          { value: 'QA Lead', label: 'QA Lead' },
                          { value: 'QA Engineer', label: 'QA Engineer' },
                          { value: 'Developer', label: 'Developer' },
                          { value: 'Auditor', label: 'Auditor' }
                        ]}
                        value={role}
                        onChange={val => setRole(val as UserRole)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-1">
                    <button type="button" onClick={() => setEditingUserId(null)} className="px-3 py-1 rounded-xl bg-slate-200 text-slate-700 font-bold">
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-1 rounded-xl bg-indigo-600 text-white font-extrabold shadow-sm">
                      Update Account
                    </button>
                  </div>
                </form>
              );
            }

            return (
              <div
                key={user.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between shadow-xs hover:border-slate-300 transition-all text-xs"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-2xl ${user.avatarColor} text-white font-extrabold flex items-center justify-center text-sm shadow-sm`}>
                    {user.name.charAt(0)}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-slate-900 text-sm">{user.name}</span>
                      {user.id === currentUser.id && (
                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Active Session (You)
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 font-mono text-[11px] mt-0.5">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    user.role === 'Admin' ? 'bg-rose-50 text-rose-800 border-rose-300' :
                    user.role === 'QA Lead' ? 'bg-indigo-50 text-indigo-800 border-indigo-300' :
                    user.role === 'QA Engineer' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                    user.role === 'Developer' ? 'bg-purple-50 text-purple-800 border-purple-300' :
                    'bg-amber-50 text-amber-800 border-amber-300'
                  }`}>
                    {user.role}
                  </span>

                  {isAdmin && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleStartEdit(user)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                        title="Edit User Role / Pass"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className={`p-1.5 rounded-xl text-slate-400 transition-all ${
                          user.id === currentUser.id ? 'opacity-30 cursor-not-allowed' : 'hover:text-rose-600 hover:bg-rose-50'
                        }`}
                        disabled={user.id === currentUser.id}
                        title={user.id === currentUser.id ? 'Cannot delete logged in Admin' : 'Delete User Account'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs font-mono text-slate-500">
          <span>Enterprise User Directory</span>
          <span>Logged as Admin: {currentUser.name}</span>
        </div>

      </div>

      {/* Reusable Confirm Modal */}
      {confirmConfig && (
        <ConfirmModal
          isOpen={confirmConfig.isOpen}
          title={confirmConfig.title}
          message={confirmConfig.message}
          type={confirmConfig.type}
          confirmText={confirmConfig.confirmText}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmConfig(null)}
        />
      )}

    </div>
  );
};
