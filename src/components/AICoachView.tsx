/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Smartphone, 
  ShieldAlert, 
  Clock, 
  Flame, 
  Target, 
  ChevronRight, 
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  Brain,
  GraduationCap,
  RotateCcw
} from 'lucide-react';
import { UserProfile, StudySession } from '../types';
import { getUserSessions } from '../utils/storage';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

interface AICoachViewProps {
  user: UserProfile;
}

export const AICoachView: React.FC<AICoachViewProps> = ({ user }) => {
  const sessions = getUserSessions(user.id);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Compute actual study metrics for context
  const totalStudyMinutes = sessions.reduce((acc, s) => acc + (s.durationSeconds / 60), 0);
  const avgFocusScore = sessions.length > 0 
    ? Math.round(sessions.reduce((acc, s) => acc + s.focusScore, 0) / sessions.length) 
    : 88;
  const totalDistractions = sessions.reduce((acc, s) => acc + (s.distractionEvents?.length || 0), 0);
  const phoneDistractions = sessions.reduce((acc, s) => {
    return acc + (s.distractionEvents?.filter((d) => d.type === 'phone_posture').length || 0);
  }, 0);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content: `Hello ${user.name.split(' ')[0]}. I am your Focura AI Academic Coach & Universal Knowledge Mentor.\n\nI am configured to answer ANY question you have:\n- In-depth concept explanations, formulas, and derivations (Physics, Chemistry, Mathematics, Biology, Economics, etc.)\n- Step-by-step numerical and algebraic solutions\n- High-yield competitive exam strategies for ${user.targetExam || 'JEE, NEET, Boards, and competitive exams'}\n- Cognitive study schedules, error log audits, and distraction elimination\n\nWhat question, derivation, or problem can I solve for you right now?`,
      timestamp: Date.now(),
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'academic' | 'math' | 'exam' | 'schedule'>('all');

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const promptCategories = [
    { id: 'all', label: 'All Questions' },
    { id: 'academic', label: 'Academic Concepts & Derivations' },
    { id: 'math', label: 'Math & Numerical Solutions' },
    { id: 'exam', label: 'Exam Technique (JEE/NEET)' },
    { id: 'schedule', label: 'Study Routine & Focus' },
  ];

  const quickPromptsMap = {
    all: [
      'Derive the work-energy theorem with calculus',
      'Solve 2x^2 - 7x + 3 = 0 step by step',
      'Explain Lenz law and conservation of energy',
      `What is the optimal 3-round exam solving strategy for ${user.targetExam || 'JEE'}?`,
      'Design an optimal 4-hour evening deep study schedule',
    ],
    academic: [
      'Derive the work-energy theorem with calculus',
      'Explain Lenz law and conservation of energy with equations',
      'What is the difference between SN1 and SN2 reaction mechanisms?',
      'Explain Carnot engine efficiency and thermodynamic cycles',
    ],
    math: [
      'Solve 2x^2 - 7x + 3 = 0 step by step',
      'How to evaluate the integral of 1 / (x^2 + a^2) dx?',
      'Find the eigenvalues and eigenvectors of a 2x2 matrix',
      'How to solve first-order differential equations using separation of variables?',
    ],
    exam: [
      `What is the optimal 3-round mock solving method for ${user.targetExam || 'JEE'}?`,
      'How should I analyze my test errors to eliminate negative marking?',
      'Which high-yield chapters should I prioritize first?',
      'How to deconstruct multi-concept physics and chemistry problems systematically?',
    ],
    schedule: [
      'Design a 4-hour evening deep study schedule with ultradian breaks',
      'How do I implement physical phone friction to eliminate distraction?',
      'How to use spaced repetition for formulas and reaction mechanisms?',
    ],
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || inputPrompt).trim();
    if (!messageContent || loading) return;

    const userMessage: ChatMessage = {
      id: 'msg_' + Math.random().toString(36).substring(2, 8),
      role: 'user',
      content: messageContent,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userProfile: user,
          studyStats: {
            averageFocusScore: avgFocusScore,
            totalStudyMinutes,
            totalDistractions,
            phoneDistractions,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Coach API error');
      }

      const data = await response.json();
      const botMessage: ChatMessage = {
        id: 'msg_' + Math.random().toString(36).substring(2, 8),
        role: 'model',
        content: data.reply || 'I am ready to help you solve and understand any academic question.',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
      const fallbackMsg: ChatMessage = {
        id: 'msg_err_' + Date.now(),
        role: 'model',
        content: `I encountered a momentary connection interruption while generating your response. Please ensure your network is stable and send your question again.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header Banner */}
      <div className="border border-zinc-800 bg-zinc-950 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">
              FOCURA · ACADEMIC PERFORMANCE ADVISOR
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white text-black">
              GEMINI AI ENGINE
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white mt-1">
            AI Academic & Exam Coach
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Ask any question — academic concepts, derivations, formulas, step-by-step numerical solutions, or competitive entrance exam strategies.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 rounded-xl self-start md:self-auto">
          <div>
            <div className="text-zinc-500 uppercase text-[10px]">Avg Focus</div>
            <div className="text-white font-bold text-sm">{avgFocusScore}%</div>
          </div>
          <div className="h-6 w-px bg-zinc-800" />
          <div>
            <div className="text-zinc-500 uppercase text-[10px]">Target Exam</div>
            <div className="text-white font-bold text-xs truncate max-w-[100px]">{user.targetExam || user.stream.toUpperCase()}</div>
          </div>
          <div className="h-6 w-px bg-zinc-800" />
          <div>
            <div className="text-zinc-500 uppercase text-[10px]">Phone Alerts</div>
            <div className="text-white font-bold text-sm">{phoneDistractions}</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Diagnostics & Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Diagnostics & Playbooks (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Diagnostic Card */}
          <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950 space-y-3">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-white" />
              <span className="text-xs font-mono uppercase font-bold text-white tracking-wider">
                Telemetry Diagnostics
              </span>
            </div>
            <div className="space-y-2 text-xs text-zinc-300">
              <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/50 flex items-start gap-2.5">
                <Smartphone className="h-4 w-4 text-zinc-300 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white text-[11px]">Phone Posture Tracking</div>
                  <div className="text-zinc-400 text-[11px]">
                    {phoneDistractions === 0 
                      ? 'Optimal posture. Zero phone flags in recent study sessions.'
                      : `${phoneDistractions} phone flags recorded. Physical friction recommended.`}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/50 flex items-start gap-2.5">
                <Target className="h-4 w-4 text-zinc-300 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white text-[11px]">Targeted Exam Pattern</div>
                  <div className="text-zinc-400 text-[11px]">
                    Configured for <span className="text-white font-bold">{user.targetExam || 'Competitive Standards'}</span> in {user.stream.toUpperCase()}.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Playbooks */}
          <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950 space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-white" />
              <span className="text-xs font-mono uppercase font-bold text-white tracking-wider">
                Exam Playbooks
              </span>
            </div>
            <div className="space-y-2">
              {[
                {
                  title: 'The 3-Round Mock Protocol',
                  desc: 'Round 1: 45s direct questions. Round 2: 2-step numericals. Round 3: Multi-concept problems.',
                },
                {
                  title: '20-Second Phone Friction Rule',
                  desc: 'Place device in another room. Adding 20s of effort eliminates reflexive checking.',
                },
                {
                  title: 'Active Retrieval vs Highlighting',
                  desc: 'Writing out principles from memory yields 2.5x higher retention than passive rereading.',
                },
              ].map((p, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-zinc-800/80 bg-zinc-900/30 text-xs space-y-1"
                >
                  <div className="font-bold text-white">{p.title}</div>
                  <div className="text-zinc-400 text-[11px] leading-relaxed">{p.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Coach Chat (8 cols) */}
        <div className="lg:col-span-8 flex flex-col h-[640px] rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl">
          {/* Chat Header */}
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-white text-black flex items-center justify-center font-bold">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Focura AI Coach</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-zinc-700 bg-zinc-800 text-zinc-300">
                    {user.targetExam || user.stream.toUpperCase()}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-zinc-400 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Trained with Gemini 3.8 Flash · Online</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setMessages([messages[0]])}
              className="text-[11px] font-mono text-zinc-500 hover:text-white transition-colors flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Chat Messages scroll area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed space-y-2 ${
                      isUser
                        ? 'bg-zinc-900 border border-zinc-700 text-white shadow-md'
                        : 'bg-zinc-900/50 border border-zinc-800 text-zinc-200 shadow-md'
                    }`}
                  >
                    {!isUser && (
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider mb-1">
                        <Bot className="h-3 w-3 text-white" />
                        <span>FOCURA MASTER COACH</span>
                      </div>
                    )}
                    <div className="whitespace-pre-line prose-invert">
                      {m.content}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl p-4 border border-zinc-800 bg-zinc-900/40 text-xs text-zinc-400 flex items-center gap-2">
                  <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating in-depth answer...</span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Category Tabs & Quick Prompts Bar */}
          <div className="border-t border-zinc-800 bg-zinc-900/40 p-2.5 space-y-2">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-0.5">
              {promptCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as any)}
                  className={`px-2 py-0.5 text-[10px] font-mono rounded-md transition-colors shrink-0 ${
                    activeCategory === cat.id
                      ? 'bg-white text-black font-bold'
                      : 'bg-zinc-850 text-zinc-400 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto flex items-center gap-1.5 scrollbar-none">
              {(quickPromptsMap[activeCategory] || quickPromptsMap.all).map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(qp)}
                  disabled={loading}
                  className="px-2.5 py-1 rounded-lg border border-zinc-800 bg-zinc-900 text-[11px] text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors shrink-0 whitespace-nowrap"
                >
                  {qp}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 border-t border-zinc-800 bg-zinc-900/80 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask any question (e.g. Derive Lenz's law, Solve quadratic equation, JEE strategy...)"
              className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !inputPrompt.trim()}
              className="h-9 w-9 rounded-xl bg-white hover:bg-zinc-200 text-black flex items-center justify-center transition-all disabled:opacity-40 shrink-0 font-bold"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
