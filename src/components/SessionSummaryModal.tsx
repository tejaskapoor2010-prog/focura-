import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  BrainCircuit, 
  ShieldAlert, 
  ArrowRight, 
  BookMarked,
  Flame,
  Award
} from 'lucide-react';
import { StudySession, RevisionCard } from '../types';
import { STREAMS_CONFIG } from '../data/streams';
import { saveUserRevisionCard } from '../utils/storage';

interface SessionSummaryModalProps {
  session: StudySession;
  onClose: () => void;
  onNavigateToRevision: () => void;
}

export const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({
  session,
  onClose,
  onNavigateToRevision,
}) => {
  const [addedNote, setAddedNote] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);

  useEffect(() => {
    if (session.focusScore >= 75) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#FFFFFF', '#D4D4D8', '#A1A1AA'],
        });
      } catch {
        // Confetti fallback
      }
    }
  }, [session.focusScore]);

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s > 0 ? `${s}s` : ''}`;
  };

  const streamMeta = STREAMS_CONFIG[session.stream] || STREAMS_CONFIG.science;

  // Distraction aggregates
  const lookingAwayEvents = session.distractionEvents.filter((d) => d.type === 'looking_away');
  const phonePostureEvents = session.distractionEvents.filter((d) => d.type === 'phone_posture');
  const absentEvents = session.distractionEvents.filter((d) => d.type === 'absent');

  // AI-generated insight based on metrics
  const getAIAnalysis = () => {
    if (session.focusScore >= 85) {
      return {
        title: 'Deep Flow State Achieved',
        verdict: 'Outstanding gaze stability and study posture continuity. Your head remained centered for over 90% of the session with virtually zero digital distraction.',
        action: 'Recommended Next Step: Review these core concepts tomorrow using 1-day spaced repetition.',
      };
    } else if (session.focusScore >= 70) {
      return {
        title: 'Solid Productive Session',
        verdict: `Good retention session. You logged ${formatSeconds(session.focusedSeconds)} of high-grade focus with minor gaze wander (${session.distractionEvents.length} brief interruptions).`,
        action: 'Recommended Next Step: Try shortening session interval to 25m or using binaural focus soundscapes.',
      };
    } else {
      return {
        title: 'Distraction Friction Detected',
        verdict: 'Computer Vision flagged frequent gaze deviations and prolonged disconnects. Distractions accumulated to impact flow state.',
        action: 'Action Plan: Activate Fullscreen Focus Shield and keep your phone in another room.',
      };
    }
  };

  const aiInsights = getAIAnalysis();

  const handleSaveQuickRecallCard = () => {
    if (!addedNote.trim()) return;

    const newCard: RevisionCard = {
      id: 'rev_' + Math.random().toString(36).substring(2, 8),
      userId: session.userId,
      stream: session.stream,
      subject: session.subject,
      topic: session.subTopic || session.subject,
      question: `Key Takeaways from ${session.subTopic || session.subject}`,
      answer: addedNote.trim(),
      keyConcepts: [session.subject, session.subTopic || ''],
      masteryLevel: 'learning',
      nextReviewDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // +1 day
      repetitions: 0,
    };

    saveUserRevisionCard(session.userId, newCard);
    setNoteSaved(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 my-8 text-white">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-black font-extrabold shadow-md">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">Session Analysis Complete</h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300">
                  {streamMeta.title}
                </span>
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">
                {session.subject} · {session.subTopic}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Core Metric Comparison: Traditional vs Focura */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
          {/* Traditional App metric */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60">
            <div className="text-[11px] font-mono uppercase text-zinc-400 mb-1">
              Standard Timer (Quantity)
            </div>
            <div className="text-3xl font-black font-mono text-zinc-200">
              {formatSeconds(session.durationSeconds)}
            </div>
            <div className="text-xs text-zinc-400 mt-1">
              Total elapsed clock time recorded
            </div>
          </div>

          {/* Focura CV AI Focus Score */}
          <div className="p-4 rounded-xl border border-zinc-700 bg-zinc-900/90 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-mono uppercase text-zinc-300 font-bold">
                Focura AI Focus Score (Quality)
              </div>
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black font-mono text-white">
                {session.focusScore}/100
              </span>
              <span className="text-xs font-mono text-zinc-300">
                ({formatSeconds(session.focusedSeconds)} focused · {Math.round((session.focusedSeconds / Math.max(1, session.durationSeconds)) * 100)}%)
              </span>
            </div>
            <div className="text-xs text-zinc-400 mt-1">
              Derived from computer vision gaze & posture stability
            </div>
          </div>
        </div>

        {/* Distraction Breakdown */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 mb-6">
          <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3">
            Computer Vision Distraction Telemetry
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-2.5 rounded-lg bg-black border border-zinc-800">
              <div className="text-[11px] text-zinc-400">Gaze Wander</div>
              <div className="text-lg font-bold font-mono text-zinc-200 mt-0.5">
                {lookingAwayEvents.length}
              </div>
              <div className="text-[10px] text-zinc-500">events</div>
            </div>

            <div className="p-2.5 rounded-lg bg-black border border-zinc-800">
              <div className="text-[11px] text-zinc-400">Head Down / Phone</div>
              <div className="text-lg font-bold font-mono text-zinc-200 mt-0.5">
                {phonePostureEvents.length}
              </div>
              <div className="text-[10px] text-zinc-500">posture flags</div>
            </div>

            <div className="p-2.5 rounded-lg bg-black border border-zinc-800">
              <div className="text-[11px] text-zinc-400">Desk Absence</div>
              <div className="text-lg font-bold font-mono text-zinc-200 mt-0.5">
                {absentEvents.length}
              </div>
              <div className="text-[10px] text-zinc-500">away events</div>
            </div>
          </div>
        </div>

        {/* AI Insight & Recommendations */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 mb-6">
          <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
            <BrainCircuit className="h-4 w-4" />
            <span>AI Focus Diagnosis: {aiInsights.title}</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed mb-2">
            {aiInsights.verdict}
          </p>
          <div className="text-xs font-mono text-zinc-200 bg-black px-2.5 py-1.5 rounded-lg border border-zinc-800">
            💡 {aiInsights.action}
          </div>
        </div>

        {/* Quick Recall / Revision Card Generator */}
        <div className="border-t border-zinc-800 pt-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-300">
              Save Active Recall Note for Revision
            </span>
            <span className="text-[10px] font-mono text-zinc-400">
              Spaced Repetition (Review in 24h)
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={addedNote}
              onChange={(e) => setAddedNote(e.target.value)}
              placeholder="e.g. Formula for torque: τ = r × F, or key definition..."
              className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-white focus:outline-none"
            />
            <button
              onClick={handleSaveQuickRecallCard}
              disabled={!addedNote.trim() || noteSaved}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                noteSaved
                  ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                  : 'bg-white hover:bg-zinc-200 text-black font-bold disabled:opacity-50'
              }`}
            >
              {noteSaved ? 'Saved to Recall!' : 'Save Card'}
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
          <button
            onClick={() => {
              onClose();
              onNavigateToRevision();
            }}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <BookMarked className="h-3.5 w-3.5" />
            <span>Open Revision Deck</span>
          </button>

          <button
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs shadow-lg transition-all"
          >
            Done & Save
          </button>
        </div>
      </div>
    </div>
  );
};
