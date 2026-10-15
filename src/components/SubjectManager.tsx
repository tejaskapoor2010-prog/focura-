/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  Layers, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  ArrowRight,
  GraduationCap
} from 'lucide-react';
import { UserProfile, SubjectItem, StreamType } from '../types';
import { getUserSubjects, addCustomSubject, getUserSessions } from '../utils/storage';
import { STREAMS_CONFIG } from '../data/streams';

interface SubjectManagerProps {
  user: UserProfile;
  onSelectSubjectForStudy: (subjectId: string) => void;
}

export const SubjectManager: React.FC<SubjectManagerProps> = ({
  user,
  onSelectSubjectForStudy,
}) => {
  const [activeStreamTab, setActiveStreamTab] = useState<StreamType>(user.stream);
  const [subjects, setSubjects] = useState<SubjectItem[]>(() => getUserSubjects(user.id, user.stream));
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newSubName, setNewSubName] = useState<string>('');
  const [newSubTopics, setNewSubTopics] = useState<string>('');

  const sessions = getUserSessions(user.id);
  const streamMeta = STREAMS_CONFIG[activeStreamTab];

  // Refresh subjects when tab changes
  const currentStreamSubjects = getUserSubjects(user.id, activeStreamTab);

  const handleAddSubjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;

    const newSubject: SubjectItem = {
      id: 'sub_' + Math.random().toString(36).substring(2, 8),
      name: newSubName.trim(),
      stream: activeStreamTab,
      color: '#FFFFFF',
      subTopics: newSubTopics
        ? newSubTopics.split(',').map((t) => t.trim()).filter(Boolean)
        : ['General Concepts', 'Problem Sets'],
    };

    addCustomSubject(user.id, newSubject);
    setSubjects(getUserSubjects(user.id, user.stream));
    setIsAddModalOpen(false);
    setNewSubName('');
    setNewSubTopics('');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-zinc-800 bg-zinc-950">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">
              FOCURA · SYLLABUS DIRECTORY
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white mt-1">
            Subject & Syllabus Directory
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Organized across 3 major academic streams: Science, Commerce, and Arts with chapter-wise modules.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Custom Subject</span>
        </button>
      </div>

      {/* Stream Tabs: Science, Commerce, Arts */}
      <div className="flex p-1 rounded-xl bg-zinc-900 border border-zinc-800 max-w-md">
        {(['science', 'commerce', 'arts'] as StreamType[]).map((st) => {
          const meta = STREAMS_CONFIG[st];
          const isSelected = activeStreamTab === st;
          return (
            <button
              key={st}
              onClick={() => setActiveStreamTab(st)}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                isSelected
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>{meta.title}</span>
              {user.stream === st && (
                <span className={`text-[9px] font-mono uppercase px-1 rounded ${
                  isSelected ? 'bg-black text-white' : 'bg-zinc-800 text-zinc-300'
                }`}>
                  Current
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Stream Overview Card */}
      <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">{streamMeta.title} Stream</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded border border-zinc-700 bg-zinc-900 text-zinc-300">
              {streamMeta.badge}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">{streamMeta.description}</p>
        </div>

        <div className="text-xs text-zinc-400 font-mono">
          Target Curriculum: <span className="text-zinc-200 font-semibold">{streamMeta.defaultExams.slice(0, 2).join(', ')}</span>
        </div>
      </div>

      {/* Subject Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {currentStreamSubjects.map((sub) => {
          // Calculate stats for this subject
          const subjectSessions = sessions.filter((s) => s.subject === sub.name);
          const totalSecs = subjectSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
          const avgScore = subjectSessions.length > 0
            ? Math.round(subjectSessions.reduce((acc, s) => acc + s.focusScore, 0) / subjectSessions.length)
            : null;

          return (
            <div
              key={sub.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl hover:border-zinc-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-xs text-white">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <h3 className="text-base font-bold text-white">{sub.name}</h3>
                  </div>
                  {avgScore !== null && (
                    <span className="text-xs font-mono font-bold text-white bg-zinc-900 px-2 py-0.5 rounded border border-zinc-700">
                      {avgScore}% Focus
                    </span>
                  )}
                </div>

                <div className="text-[11px] uppercase font-mono text-zinc-400 mb-2">
                  Syllabus Chapters ({sub.subTopics.length}):
                </div>

                <div className="space-y-1.5 mb-5">
                  {sub.subTopics.slice(0, 4).map((topic) => (
                    <div
                      key={topic}
                      className="text-xs text-zinc-300 bg-zinc-900/60 px-2.5 py-1.5 rounded-lg border border-zinc-850 truncate"
                    >
                      {topic}
                    </div>
                  ))}
                  {sub.subTopics.length > 4 && (
                    <div className="text-[11px] font-mono text-zinc-500 pl-1">
                      + {sub.subTopics.length - 4} more chapters
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-zinc-850 pt-3 flex items-center justify-between">
                <div className="text-[11px] font-mono text-zinc-400">
                  {totalSecs > 0 ? `${(totalSecs / 3600).toFixed(1)} hrs tracked` : '0 hrs logged'}
                </div>

                <button
                  onClick={() => onSelectSubjectForStudy(sub.id)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <span>Study Room</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Subject Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white">Add Subject to {streamMeta.title}</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubjectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  required
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  placeholder="e.g. Statistics, Biotechnology, Sociology"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Chapters / Sub-Topics (comma-separated)
                </label>
                <textarea
                  rows={3}
                  value={newSubTopics}
                  onChange={(e) => setNewSubTopics(e.target.value)}
                  placeholder="Chapter 1: Foundations, Chapter 2: Core Derivations, Chapter 3: Advanced Numerical Sets"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs shadow-md"
                >
                  Add Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
