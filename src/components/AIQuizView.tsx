/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Sparkles, 
  ArrowRight, 
  BookOpen, 
  Award, 
  Check, 
  PlusCircle, 
  BrainCircuit,
  Dice5,
  GraduationCap,
  Layers,
  ChevronRight,
  HelpCircle,
  Clock,
  Target
} from 'lucide-react';
import { UserProfile, StreamType } from '../types';
import { getUserSubjects, saveRevisionCard } from '../utils/storage';
import { DEFAULT_SUBJECTS } from '../data/streams';
import confetti from 'canvas-confetti';

interface QuizQuestion {
  id: string;
  examTag?: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface QuizData {
  title: string;
  subject: string;
  topic: string;
  examPattern?: string;
  difficulty?: string;
  questions: QuizQuestion[];
}

interface AIQuizViewProps {
  user: UserProfile;
}

const EXAM_PATTERNS = [
  { id: 'JEE Main & Advanced', label: 'JEE Main & Advanced (PCM)', stream: 'science', badge: 'High Rigor' },
  { id: 'NEET UG', label: 'NEET UG (Medical PCB)', stream: 'science', badge: 'NCERT Focus' },
  { id: 'CBSE / State Boards', label: 'CBSE / State Boards', stream: 'all', badge: 'Syllabus Standard' },
  { id: 'CA Foundation & Commerce', label: 'CA Foundation & Commerce', stream: 'commerce', badge: 'Practical' },
  { id: 'UPSC & Civil Services', label: 'UPSC & Civil Services', stream: 'arts', badge: 'Analytical' },
  { id: 'General Competitive / STEM', label: 'General Competitive STEM', stream: 'all', badge: 'Concept' },
];

export const AIQuizView: React.FC<AIQuizViewProps> = ({ user }) => {
  const userSubjects = getUserSubjects(user.id, user.stream);
  
  // Choose sensible default exam pattern based on user stream / target exam
  const initialExamPattern = useMemo(() => {
    if (user.targetExam?.toLowerCase().includes('neet')) return 'NEET UG';
    if (user.stream === 'commerce') return 'CA Foundation & Commerce';
    if (user.stream === 'arts') return 'UPSC & Civil Services';
    return 'JEE Main & Advanced';
  }, [user.stream, user.targetExam]);

  const [examPattern, setExamPattern] = useState<string>(initialExamPattern);
  const [selectedSubject, setSelectedSubject] = useState<string>(userSubjects[0]?.name || 'Physics');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Active Quiz State
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);
  const [savedToRevision, setSavedToRevision] = useState<{ [qId: string]: boolean }>({});

  // Get available chapters for the currently selected subject
  const currentSubjectItem = useMemo(() => {
    return (
      userSubjects.find((s) => s.name.toLowerCase() === selectedSubject.toLowerCase()) ||
      DEFAULT_SUBJECTS.find((s) => s.name.toLowerCase() === selectedSubject.toLowerCase()) ||
      userSubjects[0] ||
      DEFAULT_SUBJECTS[0]
    );
  }, [selectedSubject, userSubjects]);

  const availableChapters = currentSubjectItem?.subTopics || [
    'Core Concepts',
    'Previous Year Questions',
    'Advanced Problem Applications',
  ];

  // Pick a random chapter from current subject
  const handlePickRandomChapter = () => {
    if (!availableChapters || availableChapters.length === 0) return;
    const randomIndex = Math.floor(Math.random() * availableChapters.length);
    const chosen = availableChapters[randomIndex];
    setCustomTopic(chosen);
  };

  // One-click generate with a random chapter
  const handleRandomChapterQuiz = async () => {
    if (!availableChapters || availableChapters.length === 0) return;
    const randomIndex = Math.floor(Math.random() * availableChapters.length);
    const chosen = availableChapters[randomIndex];
    setCustomTopic(chosen);
    await executeQuizGeneration(selectedSubject, chosen);
  };

  const executeQuizGeneration = async (subjectToUse: string, topicToUse: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subjectToUse,
          topic: topicToUse.trim() || 'Core Chapter Concepts',
          stream: user.stream,
          examPattern,
          difficulty,
          questionCount,
          randomSeed: Math.random().toString(36).substring(7),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate quiz');
      }

      const data: QuizData = await response.json();
      if (!data.questions || data.questions.length === 0) {
        throw new Error('Invalid quiz response received');
      }

      setQuizData(data);
      setCurrentQuestionIndex(0);
      setSelectedAnswers(new Array(data.questions.length).fill(-1));
      setShowExplanation(false);
      setQuizCompleted(false);
      setSavedToRevision({});
    } catch (err: any) {
      console.error('Quiz generation error:', err);
      setError('Could not generate quiz right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    await executeQuizGeneration(selectedSubject, customTopic.trim() || availableChapters[0] || 'Core Concepts');
  };

  const handleSelectOption = (optionIndex: number) => {
    if (showExplanation || quizCompleted) return;

    const nextAnswers = [...selectedAnswers];
    nextAnswers[currentQuestionIndex] = optionIndex;
    setSelectedAnswers(nextAnswers);
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (!quizData) return;
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowExplanation(selectedAnswers[currentQuestionIndex + 1] !== -1);
    } else {
      setQuizCompleted(true);
      confetti({
        particleCount: 65,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFFFFF', '#A1A1AA', '#71717A', '#38BDF8'],
      });
    }
  };

  const handleAddQuestionToRevision = (q: QuizQuestion) => {
    if (!user) return;
    saveRevisionCard({
      id: 'rev_' + Math.random().toString(36).substring(2, 8),
      userId: user.id,
      stream: user.stream,
      subject: selectedSubject,
      topic: customTopic.trim() || 'Exam Concepts',
      question: q.question,
      answer: q.options[q.correctIndex] + '\n\n' + q.explanation,
      keyConcepts: [selectedSubject, examPattern, difficulty],
      masteryLevel: 'learning',
      nextReviewDate: new Date().toISOString(),
      repetitions: 0,
    });
    setSavedToRevision((prev) => ({ ...prev, [q.id]: true }));
  };

  const calculateScore = () => {
    if (!quizData) return { correct: 0, total: 0, percentage: 0 };
    let correct = 0;
    quizData.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        correct++;
      }
    });
    return {
      correct,
      total: quizData.questions.length,
      percentage: Math.round((correct / quizData.questions.length) * 100),
    };
  };

  const scoreStats = calculateScore();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header Banner */}
      <div className="border border-zinc-800 bg-zinc-950 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">
              FOCURA · ACTIVE RETRIEVAL ENGINE
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white text-black">
              GEMINI 3.8 FLASH
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white mt-1">
            Adaptive Exam Pattern Quiz
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Rigorous, randomized practice questions trained on JEE Main/Advanced, NEET, and Board standards.
          </p>
        </div>

        {quizData && (
          <button
            onClick={() => setQuizData(null)}
            className="px-3.5 py-2 text-xs font-medium border border-zinc-700 hover:border-white rounded-xl text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5 self-start md:self-auto"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Configure New Quiz</span>
          </button>
        )}
      </div>

      {/* Quiz Config Form (Shown when no quiz is currently active) */}
      {!quizData && (
        <div className="border border-zinc-800 bg-zinc-950 p-6 sm:p-8 rounded-2xl space-y-6">
          {/* 1. Exam Pattern Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-white" />
                <span>1. Select Target Exam Pattern</span>
              </label>
              <span className="text-[11px] font-mono text-zinc-500">
                Calibrates question rigor & syllabus depth
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {EXAM_PATTERNS.map((pattern) => {
                const isSelected = examPattern === pattern.id;
                return (
                  <button
                    key={pattern.id}
                    type="button"
                    onClick={() => setExamPattern(pattern.id)}
                    className={`p-3 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? 'border-white bg-white text-black font-bold shadow-md'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <div className="text-xs leading-snug">{pattern.label}</div>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold mt-1 inline-block ${
                        isSelected ? 'bg-black text-white' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {pattern.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
            {/* 2. Subject Selection */}
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-white" />
                <span>2. Select Subject</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {userSubjects.map((sub) => {
                  const isSelected = selectedSubject.toLowerCase() === sub.name.toLowerCase();
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => {
                        setSelectedSubject(sub.name);
                        setCustomTopic('');
                      }}
                      className={`p-3 rounded-xl border text-xs font-medium text-left transition-all ${
                        isSelected
                          ? 'border-white bg-white text-black font-bold shadow-md'
                          : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      {sub.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Chapter / Topic Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-white" />
                  <span>3. Choose Chapter or Topic</span>
                </label>
                <button
                  type="button"
                  onClick={handlePickRandomChapter}
                  className="text-[11px] font-mono text-zinc-300 hover:text-white flex items-center gap-1 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 transition-colors"
                  title="Pick a random chapter from this subject's syllabus"
                >
                  <Dice5 className="h-3 w-3" />
                  <span>Pick Random Chapter</span>
                </button>
              </div>

              {/* Quick Select Chapter Pills */}
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 border border-zinc-900 rounded-xl bg-zinc-900/30">
                {availableChapters.map((chap) => {
                  const isChosen = customTopic === chap;
                  return (
                    <button
                      key={chap}
                      type="button"
                      onClick={() => setCustomTopic(chap)}
                      className={`px-2.5 py-1 text-[11px] rounded-lg border transition-all text-left truncate max-w-full ${
                        isChosen
                          ? 'border-white bg-white text-black font-bold'
                          : 'border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                      }`}
                    >
                      {chap}
                    </button>
                  );
                })}
              </div>

              {/* Custom Topic Input */}
              <div className="space-y-1">
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="Or type specific subtopic (e.g. Carnot Engine, Markovnikov Rule)..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-colors"
                />
              </div>

              {/* Difficulty and Question Count */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-zinc-400">Difficulty</label>
                  <div className="flex rounded-lg border border-zinc-800 bg-zinc-900 p-1">
                    {(['easy', 'medium', 'hard'] as const).map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setDifficulty(diff)}
                        className={`flex-1 py-1 text-[11px] font-medium capitalize rounded-md transition-colors ${
                          difficulty === diff
                            ? 'bg-white text-black font-bold'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-zinc-400">Questions</label>
                  <div className="flex rounded-lg border border-zinc-800 bg-zinc-900 p-1">
                    {[3, 5, 8].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setQuestionCount(num)}
                        className={`flex-1 py-1 text-[11px] font-medium rounded-md transition-colors ${
                          questionCount === num
                            ? 'bg-white text-black font-bold'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {num} Qs
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl border border-zinc-700 bg-zinc-900 text-xs text-zinc-200">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleGenerateQuiz}
              disabled={loading}
              className="py-3.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-xl disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Generating AI Quiz...</span>
                </>
              ) : (
                <>
                  <BrainCircuit className="h-4 w-4" />
                  <span>Generate Quiz ({customTopic ? `Topic: ${customTopic}` : selectedSubject})</span>
                </>
              )}
            </button>

            <button
              onClick={handleRandomChapterQuiz}
              disabled={loading}
              className="py-3.5 px-4 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-850 hover:border-zinc-500 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              title="Automatically selects a random chapter from this subject and generates the quiz"
            >
              <Dice5 className="h-4 w-4 text-zinc-300" />
              <span>Test on Random Chapter Now</span>
            </button>
          </div>
        </div>
      )}

      {/* Active Quiz Question Screen */}
      {quizData && !quizCompleted && (
        <div className="border border-zinc-800 bg-zinc-950 p-6 sm:p-8 rounded-2xl space-y-6">
          {/* Progress bar & Tags */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-2">
                <span>
                  QUESTION {currentQuestionIndex + 1} OF {quizData.questions.length}
                </span>
                {quizData.questions[currentQuestionIndex]?.examTag && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {quizData.questions[currentQuestionIndex].examTag}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white uppercase">{quizData.subject}</span>
                <span>·</span>
                <span className="text-zinc-300">{quizData.topic}</span>
              </div>
            </div>

            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-300"
                style={{
                  width: `${((currentQuestionIndex + 1) / quizData.questions.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Question Text */}
          <div className="p-5 sm:p-6 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-2">
            <div className="text-xs font-mono uppercase text-zinc-400">
              Exam Pattern: <span className="text-zinc-200 font-bold">{quizData.examPattern || examPattern}</span>
            </div>
            <p className="text-base sm:text-lg font-semibold text-white leading-relaxed whitespace-pre-line">
              {quizData.questions[currentQuestionIndex]?.question}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {quizData.questions[currentQuestionIndex]?.options.map((option, optIdx) => {
              const currentQ = quizData.questions[currentQuestionIndex];
              const isSelected = selectedAnswers[currentQuestionIndex] === optIdx;
              const isCorrect = currentQ.correctIndex === optIdx;
              const isAnswered = selectedAnswers[currentQuestionIndex] !== -1;

              let buttonStyle = 'border-zinc-800 bg-zinc-900 text-zinc-200 hover:border-zinc-700 hover:bg-zinc-850';

              if (isAnswered) {
                if (isCorrect) {
                  buttonStyle = 'border-emerald-500 bg-emerald-950/40 text-emerald-100 font-semibold shadow-md';
                } else if (isSelected) {
                  buttonStyle = 'border-rose-500 bg-rose-950/40 text-rose-100 font-semibold';
                } else {
                  buttonStyle = 'border-zinc-900 bg-zinc-950 text-zinc-500 opacity-60';
                }
              }

              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleSelectOption(optIdx)}
                  disabled={isAnswered}
                  className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-center justify-between gap-3 ${buttonStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold border border-zinc-700 bg-zinc-800 text-zinc-300">
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span className="leading-snug">{option}</span>
                  </div>

                  {isAnswered && isCorrect && (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                  )}
                  {isAnswered && isSelected && !isCorrect && (
                    <XCircle className="h-5 w-5 text-rose-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Step-by-Step Educational Explanation & Revision Deck Action */}
          {showExplanation && (
            <div className="p-4 sm:p-5 rounded-xl border border-zinc-700 bg-zinc-900/90 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-white" />
                  <span className="text-xs font-mono uppercase font-bold text-white tracking-wider">
                    Diagnostic Solution & Core Principle
                  </span>
                </div>

                {/* Save to Revision Deck */}
                <button
                  type="button"
                  onClick={() => handleAddQuestionToRevision(quizData.questions[currentQuestionIndex])}
                  disabled={savedToRevision[quizData.questions[currentQuestionIndex].id]}
                  className="px-2.5 py-1 text-[11px] font-mono rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-300 hover:text-white flex items-center gap-1 transition-colors"
                >
                  {savedToRevision[quizData.questions[currentQuestionIndex].id] ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span>Added to Revision</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="h-3 w-3" />
                      <span>Save to Flashcards</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line bg-zinc-950 p-3.5 rounded-lg border border-zinc-800">
                {quizData.questions[currentQuestionIndex]?.explanation}
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-lg"
                >
                  <span>
                    {currentQuestionIndex < quizData.questions.length - 1
                      ? 'Next Question'
                      : 'Complete Quiz & View Score'}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quiz Completion & Performance Analysis */}
      {quizData && quizCompleted && (
        <div className="border border-zinc-800 bg-zinc-950 p-6 sm:p-8 rounded-2xl space-y-6 text-center animate-fadeIn">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-black shadow-xl">
            <Award className="h-8 w-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-extrabold tracking-tight text-white">
              Quiz Completed!
            </h2>
            <p className="text-xs text-zinc-400">
              Pattern: <span className="text-zinc-200 font-bold">{quizData.examPattern || examPattern}</span> · Subject: <span className="text-zinc-200 font-bold">{quizData.subject}</span> ({quizData.topic})
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 font-mono text-center">
            <div>
              <div className="text-[10px] uppercase text-zinc-500">Correct</div>
              <div className="text-xl font-bold text-emerald-400">{scoreStats.correct}</div>
            </div>
            <div className="border-x border-zinc-800">
              <div className="text-[10px] uppercase text-zinc-500">Total</div>
              <div className="text-xl font-bold text-white">{scoreStats.total}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-zinc-500">Accuracy</div>
              <div className="text-xl font-bold text-white">{scoreStats.percentage}%</div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 max-w-lg mx-auto text-xs text-zinc-300 text-left space-y-2">
            <div className="font-bold text-white font-mono text-[11px] uppercase flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-white" />
              <span>Exam Readiness Assessment:</span>
            </div>
            <p className="text-zinc-400 text-xs">
              {scoreStats.percentage >= 80
                ? 'Outstanding performance. High conceptual grasp in this chapter. Reinforce with timed previous year questions.'
                : scoreStats.percentage >= 50
                ? 'Solid baseline understanding. Review the derivations and explanations of missed questions and add them to your revision deck.'
                : 'Need revision on fundamental definitions and derivations for this topic before moving to advanced numericals.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <button
              onClick={handleRandomChapterQuiz}
              className="px-5 py-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-lg"
            >
              <Dice5 className="h-4 w-4" />
              <span>Test on Another Random Chapter</span>
            </button>

            <button
              onClick={() => {
                setQuizCompleted(false);
                setCurrentQuestionIndex(0);
                setSelectedAnswers(new Array(quizData.questions.length).fill(-1));
                setShowExplanation(false);
              }}
              className="px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-medium text-xs sm:text-sm transition-all"
            >
              Retry This Chapter
            </button>

            <button
              onClick={() => setQuizData(null)}
              className="px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white font-medium text-xs sm:text-sm transition-all"
            >
              Change Exam / Subject
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
