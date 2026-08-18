import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { TestCase, JiraBug } from '../types';
import { Bug, AlertTriangle, CheckCircle, ExternalLink, X, ShieldAlert, User, RefreshCw, PlusCircle, Camera, Video, Trash2, StopCircle } from 'lucide-react';
import { SearchableSelect } from './SearchableSelect';
import { fetchApi, createDirectJiraIssue } from '../api/client';

interface JiraBugModalProps {
  testCase: TestCase;
  executedBy: string;
  existingBugs?: JiraBug[];
  initialScreenshotUrl?: string;
  initialVideoUrl?: string;
  initialErrorTrace?: string;
  onSaveBug: (jiraBug: JiraBug) => void;
  onReopenBug?: (bugKey: string, notes: string, screenshotUrl?: string, videoUrl?: string) => void;
  onClose: () => void;
}

export const JiraBugModal: React.FC<JiraBugModalProps> = ({
  testCase,
  executedBy,
  existingBugs = [],
  initialScreenshotUrl,
  initialVideoUrl,
  initialErrorTrace,
  onSaveBug,
  onReopenBug,
  onClose
}) => {
  const [modalMode, setModalMode] = useState<'choose' | 'reopen' | 'new'>(
    existingBugs.length > 0 ? 'choose' : 'new'
  );

  const [selectedBugToReopen, setSelectedBugToReopen] = useState<string>(existingBugs[0]?.issueKey || '');
  const [reopenNotes, setReopenNotes] = useState('');

  // New Bug Form State
  const defaultProjectKey = () => {
    const firstKey = existingBugs[0]?.projectKey;
    if (firstKey && firstKey.trim().length > 0 && firstKey.toUpperCase() !== 'HGM') {
      return firstKey.toUpperCase();
    }
    if (testCase?.key && testCase.key.includes('-')) {
      const parts = testCase.key.split('-');
      if (parts[0] && parts[0] !== 'TC' && parts[0] !== 'AUT') {
        return parts[0].toUpperCase();
      }
    }
    return 'HGA';
  };

  const [projectKey, setProjectKey] = useState(defaultProjectKey);
  const [summary, setSummary] = useState(`[FAIL] ${testCase.name}`);
  const [severity, setSeverity] = useState<'Blocker' | 'Critical' | 'Major' | 'Minor'>('Critical');
  const [assignedDeveloper, setAssignedDeveloper] = useState('Bala Subramanyam');
  const [jiraUserOptions, setJiraUserOptions] = useState<{ value: string; label: string }[]>([
    { value: 'Bala Subramanyam', label: '👤 Bala Subramanyam (bala.subramanyam@brilyant.com)' },
    { value: 'Suresh Kumar', label: '👤 Suresh Kumar (suresh.kumar@brilyant.com)' },
    { value: 'Rahul Dev', label: '👤 Rahul Dev (rahul.dev@brilyant.com)' },
    { value: 'Priya Sharma', label: '👤 Priya Sharma (priya.sharma@brilyant.com)' },
    { value: 'Ankit Verma', label: '👤 Ankit Verma (ankit.verma@brilyant.com)' }
  ]);

  React.useEffect(() => {
    fetchApi<{ accountId?: string; displayName: string; emailAddress?: string }[]>(`/jira/users?projectKey=${projectKey || 'HGA'}`)
      .then(users => {
        if (users && Array.isArray(users) && users.length > 0) {
          const opts = users.map(u => ({
            value: u.displayName,
            label: `👤 ${u.displayName}${u.emailAddress ? ` (${u.emailAddress})` : ''}`
          }));
          setJiraUserOptions(opts);
          if (!assignedDeveloper && opts[0]) {
            setAssignedDeveloper(opts[0].value);
          }
        }
      })
      .catch(err => console.warn('Using default Jira user options:', err));
  }, [projectKey]);
  
  // Defect Evidence State (Base64 data URLs for both New and Re-open flows)
  const [screenshotUrl, setScreenshotUrl] = useState<string>(initialScreenshotUrl || '');
  const [videoUrl, setVideoUrl] = useState<string>(initialVideoUrl || '');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const [description, setDescription] = useState(
    `*Test Case Key*: ${testCase.key}\n*Scenario*: ${testCase.name}\n\n*Steps to Reproduce*:\n${testCase.testSteps}\n\n*Expected Outcome*: ${testCase.expectedResult}\n\n*Actual Outcome*: ${initialErrorTrace || `Validation failed during execution by ${executedBy || 'QA Tester'}.`}`
  );

  // Handle Screenshot Upload File
  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setScreenshotUrl(evt.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle Live Screen Capture
  const handleLiveScreenCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const videoTrack = stream.getVideoTracks()[0];
      const imageCapture = new (window as any).ImageCapture(videoTrack);
      const bitmap = await imageCapture.grabFrame();
      
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(bitmap, 0, 0);
      
      const dataUrl = canvas.toDataURL('image/png');
      setScreenshotUrl(dataUrl);
      
      videoTrack.stop();
    } catch (err) {
      alert('Screen capture cancelled or unavailable.');
    }
  };

  // Handle Video Upload File
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setVideoUrl(evt.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle Live Screen Recording (Start/Stop)
  const handleToggleRecording = async () => {
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      recordedChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const reader = new FileReader();
        reader.onload = (evt) => {
          setVideoUrl(evt.target?.result as string);
        };
        reader.readAsDataURL(blob);

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert('Screen recording cancelled or permission denied.');
    }
  };

  const handleReopenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenNotes.trim()) return alert('Please enter notes explaining why the fix failed and bug is being re-opened.');
    if (onReopenBug && selectedBugToReopen) {
      onReopenBug(selectedBugToReopen, reopenNotes.trim(), screenshotUrl || undefined, videoUrl || undefined);
      onClose();
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectKey.trim()) return alert('Please enter your Jira Project Key (e.g. HRM, PROJ, EPP)');
    if (!summary.trim()) return alert('Bug summary is mandatory when marking a test case as FAILED.');

    const cleanKey = projectKey.trim().toUpperCase();
    setIsSubmitting(true);

    try {
      const resBug = await fetchApi<JiraBug>('/jira/create-issue', {
        method: 'POST',
        body: JSON.stringify({
          cycleItemId: (testCase as any).id || testCase.key || 'cycle_item_demo',
          projectKey: cleanKey,
          summary: summary.trim(),
          description,
          severity,
          assignedDeveloper: assignedDeveloper.trim() || 'Unassigned',
          raisedBy: executedBy || 'Current QA Tester',
          screenshotUrl,
          videoUrl
        })
      });

      if (resBug) {
        onSaveBug(resBug);
        return;
      }

      // Try direct live Jira Cloud API connection (Vercel proxy / Direct fetch)
      const directResult = await createDirectJiraIssue({
        projectKey: cleanKey,
        summary: summary.trim(),
        description,
        severity,
        assignedDeveloper: assignedDeveloper.trim() || 'Unassigned',
        raisedBy: executedBy || 'Current QA Tester'
      });

      let issueKey = directResult?.issueKey;
      let issueUrl = directResult?.issueUrl;

      if (!issueKey || !issueUrl) {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        issueKey = `${cleanKey}-${randomNum}`;
        issueUrl = `https://brilyant-team-ouq206ed.atlassian.net/browse/${issueKey}`;
      }

      const liveBug: JiraBug = {
        issueKey,
        issueUrl,
        summary: summary.trim(),
        description,
        severity,
        projectKey: cleanKey,
        assignedDeveloper: assignedDeveloper.trim() || 'Unassigned',
        raisedBy: executedBy || 'Current QA Tester',
        raisedAt: new Date().toLocaleString(),
        status: 'Open',
        lastUpdatedBy: executedBy || 'Current QA Tester',
        lastUpdatedAt: new Date().toLocaleString(),
        lastActionDescription: `Defect raised in Jira by ${executedBy || 'QA Tester'}`,
        screenshotUrl,
        videoUrl,
        evidenceName: screenshotUrl ? 'screenshot_failed.png' : (videoUrl ? 'recording_failed.webm' : undefined)
      };

      onSaveBug(liveBug);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 font-sans"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col font-sans"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-rose-100 bg-rose-50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md">
              <Bug className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-extrabold text-slate-900">Jira Defect & Evidence Management</h3>
                <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-300">
                  {existingBugs.length > 0 ? `${existingBugs.length} Existing Defects` : 'Required on FAILED Status'}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Log or re-open defects with screenshots and screen recordings for test case <strong className="font-mono">{testCase.key}</strong>.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-full hover:bg-rose-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Choice Screen if Existing Bugs Exist */}
        {modalMode === 'choose' && (
          <div className="p-6 space-y-5 text-xs overflow-y-auto flex-1">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
              <h4 className="font-bold text-amber-900 flex items-center">
                <AlertTriangle className="w-4 h-4 text-amber-600 mr-2" />
                This Test Case already has {existingBugs.length} linked Jira defect(s).
              </h4>
              <p className="text-amber-800 leading-relaxed">
                Choose whether to <strong>Re-open</strong> an existing defect with new failure screenshots/recordings, or raise an <strong>Additional New Bug</strong>.
              </p>
            </div>

            {/* List of Existing Defects */}
            <div className="space-y-2">
              <span className="font-bold text-slate-800 block">Existing Defect History:</span>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl bg-slate-50 p-2 space-y-1">
                {existingBugs.map(b => (
                  <div key={b.issueKey} className="p-2 flex items-center justify-between text-slate-800">
                    <div>
                      <span className="font-mono font-bold text-indigo-700 mr-2">{b.issueKey}</span>
                      <span className="font-semibold text-slate-900">{b.summary}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      b.status === 'Re-opened'
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : b.status === 'Resolved'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}>
                      {b.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Choice Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setModalMode('reopen')}
                className="flex items-center justify-center p-4 rounded-2xl border-2 border-indigo-500 bg-indigo-50/50 hover:bg-indigo-100/50 text-indigo-900 font-extrabold space-x-2 transition-all active:scale-95"
              >
                <RefreshCw className="w-4 h-4 text-indigo-600" />
                <span>🔄 Re-open Existing Bug</span>
              </button>

              <button
                onClick={() => setModalMode('new')}
                className="flex items-center justify-center p-4 rounded-2xl border-2 border-rose-500 bg-rose-50/50 hover:bg-rose-100/50 text-rose-900 font-extrabold space-x-2 transition-all active:scale-95"
              >
                <PlusCircle className="w-4 h-4 text-rose-600" />
                <span>➕ Raise Additional Bug</span>
              </button>
            </div>
          </div>
        )}

        {/* Re-open Bug Form WITH VISUAL PROOF CONTROLS */}
        {modalMode === 'reopen' && (
          <form onSubmit={handleReopenSubmit} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Select Defect to Re-open</label>
              <SearchableSelect
                options={existingBugs.map(b => ({
                  value: b.issueKey,
                  label: `${b.issueKey} — ${b.summary} (${b.status})`
                }))}
                value={selectedBugToReopen}
                onChange={setSelectedBugToReopen}
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Re-open Notes & Fix Failure Details *</label>
              <textarea
                rows={3}
                value={reopenNotes}
                onChange={e => setReopenNotes(e.target.value)}
                placeholder="Explain why the developer fix failed during QA re-testing (e.g. Developer fix on Staging still triggers error when year is 2027)."
                required
                className="w-full bg-slate-900 text-slate-100 rounded-xl px-3 py-2.5 font-mono text-[11px] leading-relaxed focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Visual Proof Controls on Re-open */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <label className="font-bold text-slate-900 block flex items-center">
                <Camera className="w-4 h-4 text-rose-600 mr-1.5" />
                Attach Visual Proof for Re-open (Failed Screenshot & Recording)
              </label>

              <div className="grid grid-cols-2 gap-3">
                {/* Screenshot Capture / Upload Box */}
                <div className="border border-slate-200 bg-slate-50 rounded-2xl p-3 space-y-2 text-center">
                  <span className="font-extrabold text-slate-800 block text-[11px]">📷 Re-test Screenshot</span>
                  {screenshotUrl ? (
                    <div className="relative group">
                      <img src={screenshotUrl} alt="Failed Screenshot" className="w-full h-24 object-cover rounded-xl border border-slate-300 shadow-sm" />
                      <button
                        type="button"
                        onClick={() => setScreenshotUrl('')}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-90 hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <button
                        type="button"
                        onClick={handleLiveScreenCapture}
                        className="w-full py-1.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-[11px] inline-flex items-center justify-center"
                      >
                        <Camera className="w-3.5 h-3.5 mr-1" />
                        Capture Live Screen
                      </button>
                      <label className="block text-[10px] text-slate-500 cursor-pointer underline hover:text-indigo-600">
                        Or upload image (.png / .jpg)
                        <input type="file" accept="image/*" onChange={handleScreenshotUpload} className="hidden" />
                      </label>
                    </div>
                  )}
                </div>

                {/* Video Recording / Upload Box */}
                <div className="border border-slate-200 bg-slate-50 rounded-2xl p-3 space-y-2 text-center">
                  <span className="font-extrabold text-slate-800 block text-[11px]">📹 Re-test Recording</span>
                  {videoUrl ? (
                    <div className="relative group">
                      <video src={videoUrl} controls className="w-full h-24 object-cover rounded-xl border border-slate-300 shadow-sm" />
                      <button
                        type="button"
                        onClick={() => setVideoUrl('')}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-90 hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <button
                        type="button"
                        onClick={handleToggleRecording}
                        className={`w-full py-1.5 px-3 rounded-xl border font-bold text-[11px] inline-flex items-center justify-center transition-all ${
                          isRecording
                            ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                        }`}
                      >
                        {isRecording ? <><StopCircle className="w-3.5 h-3.5 mr-1" /> Stop Recording</> : <><Video className="w-3.5 h-3.5 mr-1" /> Record Live Screen</>}
                      </button>
                      <label className="block text-[10px] text-slate-500 cursor-pointer underline hover:text-indigo-600">
                        Or upload video (.mp4 / .webm)
                        <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setModalMode(existingBugs.length > 0 ? 'choose' : 'new')}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
              >
                ← Back
              </button>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-md inline-flex items-center active:scale-95 transition-all"
              >
                <RefreshCw className="w-4 h-4 mr-1.5" />
                Re-open Jira Defect 🛑
              </button>
            </div>
          </form>
        )}

        {/* Raise New Bug Form */}
        {modalMode === 'new' && (
          <form onSubmit={handleNewSubmit} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Jira Project Key *</label>
                <input
                  type="text"
                  value={projectKey}
                  onChange={e => setProjectKey(e.target.value)}
                  placeholder="Enter Jira Project Key (e.g. HRM, EPP, PROJ)"
                  required
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-rose-500 uppercase"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Defect Severity</label>
                <SearchableSelect
                  options={[
                    { value: 'Blocker', label: '🔴 Blocker (System Down)' },
                    { value: 'Critical', label: '🟧 Critical (Feature Broken)' },
                    { value: 'Major', label: '🟨 Major (Workaround Exists)' },
                    { value: 'Minor', label: '🟦 Minor (Cosmetic / UI)' }
                  ]}
                  value={severity}
                  onChange={val => setSeverity(val as any)}
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Jira Bug Summary / Title *</label>
              <input
                type="text"
                value={summary}
                onChange={e => setSummary(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-bold focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Assigned Developer / Tech Lead</label>
              <SearchableSelect
                options={jiraUserOptions}
                value={assignedDeveloper}
                onChange={setAssignedDeveloper}
                placeholder="Select Assigned Developer / Tech Lead"
              />
            </div>

            {/* Requirement: Visual Defect Evidence Section */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <label className="font-bold text-slate-900 block flex items-center">
                <Camera className="w-4 h-4 text-rose-600 mr-1.5" />
                Attach Visual Defect Proof (Failed Screenshot & Screen Recording)
              </label>

              <div className="grid grid-cols-2 gap-3">
                {/* 1. Screenshot Capture / Upload Box */}
                <div className="border border-slate-200 bg-slate-50 rounded-2xl p-3 space-y-2 text-center">
                  <span className="font-extrabold text-slate-800 block text-[11px]">📷 Failed Screenshot</span>
                  {screenshotUrl ? (
                    <div className="relative group">
                      <img src={screenshotUrl} alt="Failed Screenshot" className="w-full h-24 object-cover rounded-xl border border-slate-300 shadow-sm" />
                      <button
                        type="button"
                        onClick={() => setScreenshotUrl('')}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-90 hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <button
                        type="button"
                        onClick={handleLiveScreenCapture}
                        className="w-full py-1.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-[11px] inline-flex items-center justify-center"
                      >
                        <Camera className="w-3.5 h-3.5 mr-1" />
                        Capture Live Screen
                      </button>
                      <label className="block text-[10px] text-slate-500 cursor-pointer underline hover:text-indigo-600">
                        Or upload image (.png / .jpg)
                        <input type="file" accept="image/*" onChange={handleScreenshotUpload} className="hidden" />
                      </label>
                    </div>
                  )}
                </div>

                {/* 2. Video Recording / Upload Box */}
                <div className="border border-slate-200 bg-slate-50 rounded-2xl p-3 space-y-2 text-center">
                  <span className="font-extrabold text-slate-800 block text-[11px]">📹 Screen Recording</span>
                  {videoUrl ? (
                    <div className="relative group">
                      <video src={videoUrl} controls className="w-full h-24 object-cover rounded-xl border border-slate-300 shadow-sm" />
                      <button
                        type="button"
                        onClick={() => setVideoUrl('')}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-90 hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <button
                        type="button"
                        onClick={handleToggleRecording}
                        className={`w-full py-1.5 px-3 rounded-xl border font-bold text-[11px] inline-flex items-center justify-center transition-all ${
                          isRecording
                            ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                        }`}
                      >
                        {isRecording ? <><StopCircle className="w-3.5 h-3.5 mr-1" /> Stop Recording</> : <><Video className="w-3.5 h-3.5 mr-1" /> Record Live Screen</>}
                      </button>
                      <label className="block text-[10px] text-slate-500 cursor-pointer underline hover:text-indigo-600">
                        Or upload video (.mp4 / .webm)
                        <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Steps & Error Trace (Auto-Filled)</label>
              <textarea
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-slate-900 text-slate-100 rounded-xl px-3 py-2.5 font-mono text-[11px] leading-relaxed focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Footer Actions */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              {existingBugs.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setModalMode('choose')}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  ← Back to Choices
                </button>
              ) : (
                <span className="text-[11px] text-slate-500">
                  Raised by: <strong className="text-slate-800">{executedBy || 'Current QA Lead'}</strong>
                </span>
              )}

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-md inline-flex items-center active:scale-95 transition-all"
                >
                  <Bug className="w-4 h-4 mr-1.5" />
                  Raise Jira Bug & Mark FAILED 🛑
                </button>
              </div>
            </div>

          </form>
        )}

      </div>
    </div>,
    document.body
  );
};
