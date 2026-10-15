/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  BrainCircuit, 
  Sparkles, 
  AlertCircle, 
  Play, 
  BookOpen, 
  Calendar,
  Flame,
  ArrowUpRight,
  Filter,
  Lightbulb
} from 'lucide-react';
import { UserProfile, StudySession } from '../types';
import { getUserSessions, saveUserSession } from '../utils/storage';
import { STREAMS_CONFIG } from '../data/streams';

interface AnalyticsDashboardProps {
  user: UserProfile;
  onStartSessionClick: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  user,
  onStartSessionClick,
}) => {
  const [sessions, setSessions] = useState<StudySession[]>(() => getUserSessions(user.id));
  const [filterSubject, setFilterSubject] = useState<string>('all');

  // Keep sessions in sync whenever user navigates to Analytics tab or when window focuses
  useEffect(() => {
    const refreshSessions = () => {
      setSessions(getUserSessions(user.id));
    };
    refreshSessions();
    window.addEventListener('focus', refreshSessions);
    return () => window.removeEventListener('focus', refreshSessions);
  }, [user.id]);

  const streamMeta = STREAMS_CONFIG[user.stream] || STREAMS_CONFIG.science;

  // Filter sessions
  const filteredSessions = filterSubject === 'all'
    ? sessions
    : sessions.filter((s) => s.subject === filterSubject);

  // Compute key stats
  const totalDurationSecs = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const totalFocusedSecs = sessions.reduce((acc, s) => acc + s.focusedSeconds, 0);
  const avgFocusScore = sessions.length > 0
    ? Math.round(sessions.reduce((acc, s) => acc + s.focusScore, 0) / sessions.length)
    : 0;

  const totalDistractions = sessions.reduce((acc, s) => acc + s.distractionEvents.length, 0);

  // Subject-wise grouping
  const subjectMap: Record<string, { duration: number; focused: number; count: number; totalScore: number }> = {};
  sessions.forEach((s) => {
    if (!subjectMap[s.subject]) {
      subjectMap[s.subject] = { duration: 0, focused: 0, count: 0, totalScore: 0 };
    }
    subjectMap[s.subject].duration += s.durationSeconds;
    subjectMap[s.subject].focused += s.focusedSeconds;
    subjectMap[s.subject].count += 1;
    subjectMap[s.subject].totalScore += s.focusScore;
  });

  const subjectStats = Object.keys(subjectMap).map((name) => {
    const data = subjectMap[name];
    return {
      name,
      totalHours: (data.duration / 3600).toFixed(1),
      avgScore: Math.round(data.totalScore / data.count),
      count: data.count,
    };
  });

  const formatSecs = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };

  // Helper to seed a sample session if student wants to test graphs
  const handleSeedSample = () => {
    const subjectsList = user.stream === 'science' 
      ? ['Physics', 'Chemistry', 'Mathematics'] 
      : user.stream === 'commerce' 
      ? ['Accountancy', 'Economics', 'Business Studies']
      : ['History', 'Political Science', 'Psychology'];

    const newSample: StudySession = {
      id: 'sess_' + Math.random().toString(36).substring(2, 9),
      userId: user.id,
      startTime: Date.now() - 2700 * 1000,
      endTime: Date.now(),
      durationSeconds: 2700, // 45m
      focusedSeconds: 2430, // ~90%
      focusScore: 92,
      stream: user.stream,
      subject: subjectsList[Math.floor(Math.random() * subjectsList.length)],
      subTopic: 'Exam Numerical Set 1',
      distractionEvents: [
        {
          id: 'dist_sample_1',
          timestamp: 900000,
          type: 'looking_away',
          durationSeconds: 8,
          label: 'Gaze wandered from screen',
        },
      ],
      timeline: [
        { second: 0, focusScore: 95, state: 'focused' },
        { second: 900, focusScore: 82, state: 'looking_away' },
        { second: 1800, focusScore: 94, state: 'focused' },
        { second: 2700, focusScore: 92, state: 'focused' },
      ],
      notes: 'Initial test calibration session',
    };

    saveUserSession(user.id, newSample);
    setSessions(getUserSessions(user.id));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-zinc-800 bg-zinc-950">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">
              FOCURA · FOCUS TELEMETRY
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold border border-zinc-700 bg-zinc-900 text-zinc-300">
              {streamMeta.title.toUpperCase()}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white mt-1">
            Personal Focus Analytics
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Measured via Computer Vision face tracking, screen orientation, and posture stability.
          </p>
        </div>

        {sessions.length > 0 && (
          <button
            onClick={onStartSessionClick}
            className="py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Play className="h-3.5 w-3.5 fill-black" />
            <span>New Focus Session</span>
          </button>
        )}
      </div>

      {/* Empty State when zero sessions */}
      {sessions.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-10 text-center max-w-xl mx-auto shadow-2xl space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-white">
            <BarChart3 className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-white">No Study Sessions Yet</h2>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-md mx-auto">
            Welcome to Focura, {user.name}. Start your first session in the Study Room with Computer Vision enabled to begin recording deep work analytics and distraction triggers.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onStartSessionClick}
              className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Play className="h-3.5 w-3.5 fill-black" />
              <span>Launch First Study Session</span>
            </button>

            <button
              onClick={handleSeedSample}
              className="w-full sm:w-auto py-2.5 px-4 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition-colors"
            >
              Preview with Sample Session
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Key Metric Tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950 shadow-lg">
              <div className="text-[11px] font-mono uppercase text-zinc-400 mb-1 flex items-center justify-between">
                <span>Total Study Time</span>
                <Clock className="h-4 w-4 text-zinc-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white tabular-nums">
                {formatSecs(totalDurationSecs)}
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">
                {sessions.length} session(s) logged
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950 shadow-lg">
              <div className="text-[11px] font-mono uppercase text-zinc-400 mb-1 flex items-center justify-between">
                <span>Active Focused Time</span>
                <BrainCircuit className="h-4 w-4 text-white" />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white tabular-nums">
                {formatSecs(totalFocusedSecs)}
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">
                {totalDurationSecs > 0 ? Math.round((totalFocusedSecs / totalDurationSecs) * 100) : 100}% focus efficiency
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-zinc-700 bg-zinc-900/70 shadow-lg">
              <div className="text-[11px] font-mono uppercase text-zinc-300 mb-1 flex items-center justify-between">
                <span>Avg Focus Score</span>
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white tabular-nums">
                {avgFocusScore}/100
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">
                CV Stability index
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950 shadow-lg">
              <div className="text-[11px] font-mono uppercase text-zinc-400 mb-1 flex items-center justify-between">
                <span>Current Streak</span>
                <Flame className="h-4 w-4 text-zinc-300" />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white tabular-nums">
                {user.streakDays || 1} Days
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">
                Target: {user.dailyGoalMinutes}m daily
              </div>
            </div>
          </div>

          {/* Subject-wise Focus Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Subject Mastery Bar Chart (7 cols) */}
            <div className="lg:col-span-7 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="text-xs font-bold text-white uppercase tracking-wider">
                  Subject-Wise Focus Performance
                </div>
                <div className="text-[11px] font-mono text-zinc-400">
                  {user.stream.toUpperCase()} STREAM
                </div>
              </div>

              {subjectStats.length === 0 ? (
                <div className="text-xs text-zinc-400 py-6 text-center">
                  No subject data recorded yet.
                </div>
              ) : (
                <div className="space-y-3.5 pt-2">
                  {subjectStats.map((stat) => (
                    <div key={stat.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-200">{stat.name}</span>
                        <div className="flex items-center gap-3 font-mono text-xs">
                          <span className="text-zinc-400">{stat.totalHours} hrs</span>
                          <span className="text-white font-bold">{stat.avgScore}% Focus</span>
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-white transition-all duration-500"
                          style={{ width: `${stat.avgScore}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Distraction Root Cause breakdown (5 cols) */}
            <div className="lg:col-span-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="text-xs font-bold text-white uppercase tracking-wider">
                  Distraction Telemetry
                </div>
                <div className="text-[11px] font-mono text-zinc-400">
                  {totalDistractions} Total Triggers
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-zinc-200">Gaze Wander / Looking Away</div>
                    <div className="text-[10px] text-zinc-400">Head turned &gt;20° from study screen</div>
                  </div>
                  <span className="text-xs font-mono font-bold text-white">
                    {sessions.reduce((acc, s) => acc + (s.distractionEvents || []).filter(d => d.type === 'looking_away').length, 0)}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-zinc-200">Phone Posture / Head Down</div>
                    <div className="text-[10px] text-zinc-400">Downward pitch / phone detected</div>
                  </div>
                  <span className="text-xs font-mono font-bold text-white">
                    {sessions.reduce((acc, s) => acc + (s.distractionEvents || []).filter(d => d.type === 'phone_posture').length, 0)}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-zinc-200">Desk Absence</div>
                    <div className="text-[10px] text-zinc-400">Empty study chair flagged</div>
                  </div>
                  <span className="text-xs font-mono font-bold text-white">
                    {sessions.reduce((acc, s) => acc + (s.distractionEvents || []).filter(d => d.type === 'absent').length, 0)}
                  </span>
                </div>

                {sessions.some(s => (s.distractionEvents || []).some(d => d.type === 'drowsy')) && (
                  <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-zinc-200">Drowsiness / Fatigue</div>
                      <div className="text-[10px] text-zinc-400">Prolonged eye closure detected</div>
                    </div>
                    <span className="text-xs font-mono font-bold text-white">
                      {sessions.reduce((acc, s) => acc + (s.distractionEvents || []).filter(d => d.type === 'drowsy').length, 0)}
                    </span>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-zinc-400 border-t border-zinc-800 pt-3 leading-relaxed flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-zinc-300 shrink-0 mt-0.5" />
                <div>
                  <span className="text-zinc-200 font-bold">Actionable Insight:</span> Physical phone barriers and 50-minute ultradian study cycles systematically eliminate reflex interruptions.
                </div>
              </div>
            </div>
          </div>

          {/* Session History Table */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                Study Session History
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-zinc-400" />
                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-white focus:outline-none focus:border-zinc-600 font-mono"
                >
                  <option value="all">All Subjects</option>
                  {Object.keys(subjectMap).map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="border-b border-zinc-800 text-[11px] uppercase font-mono text-zinc-400">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Subject & Topic</th>
                    <th className="py-2.5 px-3">Total Time</th>
                    <th className="py-2.5 px-3">Focused Time</th>
                    <th className="py-2.5 px-3">Distractions</th>
                    <th className="py-2.5 px-3 text-right">AI Focus Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850 font-mono">
                  {filteredSessions.map((s) => {
                    const dateStr = new Date(s.startTime).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    });
                    const timeStr = new Date(s.startTime).toLocaleTimeString(undefined, {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <tr key={s.id} className="hover:bg-zinc-900/50 transition-colors">
                        <td className="py-3 px-3 text-zinc-400">
                          {dateStr} <span className="text-[10px] text-zinc-500">({timeStr})</span>
                        </td>
                        <td className="py-3 px-3 font-sans">
                          <span className="font-semibold text-white">{s.subject}</span>
                          {s.subTopic && (
                            <span className="text-zinc-400 text-xs block truncate max-w-xs">
                              {s.subTopic}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-zinc-300 tabular-nums">
                          {formatSecs(s.durationSeconds)}
                        </td>
                        <td className="py-3 px-3 text-white tabular-nums font-bold">
                          {formatSecs(s.focusedSeconds)}
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-zinc-400">{s.distractionEvents.length} trigger(s)</span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded font-bold text-xs ${
                              s.focusScore >= 80
                                ? 'bg-zinc-800 text-white border border-zinc-600'
                                : s.focusScore >= 60
                                ? 'bg-zinc-900 text-zinc-300 border border-zinc-700'
                                : 'bg-zinc-950 text-zinc-500 border border-zinc-800'
                            }`}
                          >
                            {s.focusScore}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
