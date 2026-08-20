import React, { useState } from 'react';
import { EnterpriseProject, UserProfile } from '../types';
import { FolderPlus, X, Pencil, Plus } from 'lucide-react';

interface NewProjectModalProps {
  currentUser: UserProfile;
  projectToEdit?: EnterpriseProject | null;
  onAddProject: (newProject: EnterpriseProject) => void;
  onUpdateProject?: (updatedProject: EnterpriseProject) => void;
  onClose: () => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  currentUser,
  projectToEdit,
  onAddProject,
  onUpdateProject,
  onClose
}) => {
  const [name, setName] = useState(projectToEdit ? projectToEdit.name : '');
  const [key, setKey] = useState(projectToEdit ? projectToEdit.key : '');
  const [description, setDescription] = useState(projectToEdit ? projectToEdit.description || '' : '');

  const canManage = currentUser.role === 'Admin' || currentUser.role === 'QA Lead' || currentUser.role === 'QA Engineer';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      alert(`Role Restriction: User role '${currentUser.role}' cannot create or edit projects.`);
      return;
    }
    if (!name.trim() || !key.trim()) {
      return alert('Validation Error: Project Name and Project Key are required.');
    }

    const cleanKey = key.trim().toUpperCase().slice(0, 5);

    if (projectToEdit && onUpdateProject) {
      const updated: EnterpriseProject = {
        ...projectToEdit,
        name: name.trim(),
        key: cleanKey,
        description: description.trim() || `${name.trim()} Enterprise Quality Suite`
      };
      onUpdateProject(updated);
    } else {
      const newProject: EnterpriseProject = {
        id: `proj-${Date.now().toString().slice(-4)}`,
        name: name.trim(),
        key: cleanKey,
        description: description.trim() || `${name.trim()} Enterprise Quality Suite`,
        createdAt: new Date().toLocaleDateString(),
        createdBy: currentUser.name,
        modules: []
      };
      onAddProject(newProject);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
              {projectToEdit ? <Pencil className="w-4 h-4" /> : <FolderPlus className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                {projectToEdit ? `Edit Project — [${projectToEdit.key}] ${projectToEdit.name}` : 'Create New Project'}
              </h3>
              <p className="text-xs text-slate-500">
                {projectToEdit ? 'Modify project workspace details & Jira key.' : 'Add an enterprise project repository container.'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 text-slate-400 font-bold">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          <div>
            <label className="font-bold text-slate-700 block mb-1">Project Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => {
                setName(e.target.value);
                if (!projectToEdit && !key) {
                  const autoKey = e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase();
                  setKey(autoKey);
                }
              }}
              placeholder="e.g. Outstrive Mobile App"
              required
              autoFocus
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Jira / Project Key * (Max 5 Characters)</label>
            <input
              type="text"
              value={key}
              onChange={e => setKey(e.target.value.toUpperCase())}
              placeholder="e.g. MOB"
              maxLength={5}
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Project Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Customer self-service portal for iOS and Android..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 font-medium focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow-md active:scale-95 transition-all inline-flex items-center"
            >
              {projectToEdit ? (
                <>
                  <Pencil className="w-4 h-4 mr-1.5" />
                  Save Project Changes
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Create Project
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
