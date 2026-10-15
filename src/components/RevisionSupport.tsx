/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  BookMarked, 
  Plus, 
  RotateCw, 
  CheckCircle2, 
  Calendar, 
  Layers, 
  Trash2, 
  BrainCircuit,
  Sparkles,
  Search,
  BookOpen
} from 'lucide-react';
import { UserProfile, RevisionCard } from '../types';
import { getUserRevisionCards, saveUserRevisionCard, deleteUserRevisionCard, getUserSubjects } from '../utils/storage';
import { STREAMS_CONFIG } from '../data/streams';

interface RevisionSupportProps {
  user: UserProfile;
}

export const RevisionSupport: React.FC<RevisionSupportProps> = ({ user }) => {
  const [cards, setCards] = useState<RevisionCard[]>(() => getUserRevisionCards(user.id));
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form states for creating a new card
  const subjects = getUserSubjects(user.id, user.stream);
  const [formSubject, setFormSubject] = useState(subjects[0]?.name || '');
  const [formTopic, setFormTopic] = useState('');
  const [formQuestion, setFormQuestion] = useState('');
  const [formAnswer, setFormAnswer] = useState('');
  const [formConcepts, setFormConcepts] = useState('');

  const streamMeta = STREAMS_CONFIG[user.stream] || STREAMS_CONFIG.science;

  // Filter cards
  const filteredCards = cards.filter((c) => {
    const matchesSubject = selectedFilter === 'all' || c.subject === selectedFilter;
    const matchesSearch =
      c.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.topic.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  const currentCard = filteredCards[activeCardIndex] || null;

  const handleNextCard = () => {
    setIsFlipped(false);
    setActiveCardIndex((prev) => (prev + 1) % filteredCards.length);
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setActiveCardIndex((prev) => (prev - 1 + filteredCards.length) % filteredCards.length);
  };

  const handleRating = (intervalDays: number, level: 'learning' | 'reviewing' | 'mastered') => {
    if (!currentCard) return;

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + intervalDays);

    const updated: RevisionCard = {
      ...currentCard,
      masteryLevel: level,
      nextReviewDate: nextDate.toISOString().split('T')[0],
      lastReviewedDate: new Date().toISOString().split('T')[0],
      repetitions: currentCard.repetitions + 1,
    };

    saveUserRevisionCard(user.id, updated);
    setCards(getUserRevisionCards(user.id));
    handleNextCard();
  };

  const handleDeleteCard = (cardId: string) => {
    deleteUserRevisionCard(user.id, cardId);
    const updated = getUserRevisionCards(user.id);
    setCards(updated);
    if (activeCardIndex >= updated.length) {
      setActiveCardIndex(Math.max(0, updated.length - 1));
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQuestion.trim() || !formAnswer.trim()) return;

    const newCard: RevisionCard = {
      id: 'rev_' + Math.random().toString(36).substring(2, 9),
      userId: user.id,
      stream: user.stream,
      subject: formSubject || subjects[0]?.name || 'General',
      topic: formTopic.trim() || 'General Concepts',
      question: formQuestion.trim(),
      answer: formAnswer.trim(),
      keyConcepts: formConcepts
        ? formConcepts.split(',').map((c) => c.trim()).filter(Boolean)
        : [],
      masteryLevel: 'learning',
      nextReviewDate: new Date().toISOString().split('T')[0],
      repetitions: 0,
    };

    saveUserRevisionCard(user.id, newCard);
    setCards(getUserRevisionCards(user.id));
    setIsCreateModalOpen(false);
    setFormTopic('');
    setFormQuestion('');
    setFormAnswer('');
    setFormConcepts('');
  };

  // Pre-seed starter cards if empty
  const handleSeedStarterCards = () => {
    const starterScience: RevisionCard[] = [
      {
        id: 'rev_s1',
        userId: user.id,
        stream: 'science',
        subject: 'Physics',
        topic: 'Electromagnetism',
        question: "State Faraday's Law of Electromagnetic Induction and its mathematical formulation.",
        answer: 'The induced electromotive force (EMF) in any closed circuit is directly proportional to the negative time rate of change of magnetic flux through the circuit: epsilon = -d(Phi_B)/dt, where Lenz\'s law dictates the negative polarity.',
        keyConcepts: ['Magnetic Flux', 'Induced EMF', 'Lenz Law'],
        masteryLevel: 'learning',
        nextReviewDate: new Date().toISOString().split('T')[0],
        repetitions: 1,
      },
      {
        id: 'rev_s2',
        userId: user.id,
        stream: 'science',
        subject: 'Chemistry',
        topic: 'Organic Reaction Mechanisms',
        question: 'Differentiate between SN1 and SN2 reaction mechanisms with stereochemical outcomes.',
        answer: 'SN1: Two-step mechanism proceeding via a planar carbocation intermediate. Kinetics: rate = k[R-X]. Leads to partial racemization. Favored by tertiary halides and polar protic solvents.\n\nSN2: One-step bimolecular concerted mechanism with backside attack. Kinetics: rate = k[R-X][Nu-]. Leads to complete inversion of configuration (Walden Inversion). Favored by primary halides and polar aprotic solvents.',
        keyConcepts: ['Carbocation', 'Walden Inversion', 'Solvent effects'],
        masteryLevel: 'reviewing',
        nextReviewDate: new Date().toISOString().split('T')[0],
        repetitions: 2,
      },
      {
        id: 'rev_s3',
        userId: user.id,
        stream: 'science',
        subject: 'Mathematics',
        topic: 'Calculus',
        question: 'What is the condition for a function f(x) to be continuous and differentiable at x = a?',
        answer: 'Continuity: lim_{x -> a^-} f(x) = lim_{x -> a^+} f(x) = f(a).\nDifferentiability: lim_{h -> 0} [f(a+h) - f(a)] / h exists and Left Hand Derivative equals Right Hand Derivative. Differentiability strictly implies continuity.',
        keyConcepts: ['Limits', 'LHD = RHD', 'Continuity'],
        masteryLevel: 'mastered',
        nextReviewDate: new Date().toISOString().split('T')[0],
        repetitions: 3,
      },
    ];

    const starterCommerce: RevisionCard[] = [
      {
        id: 'rev_c1',
        userId: user.id,
        stream: 'commerce',
        subject: 'Accountancy',
        topic: 'Cash Flow Statements (AS-3)',
        question: 'What are the three principal operating activity classifications under AS-3?',
        answer: '1. Operating Activities (principal revenue-producing activities)\n2. Investing Activities (acquisition and disposal of long-term assets)\n3. Financing Activities (changes in equity capital and borrowings).',
        keyConcepts: ['AS-3', 'Working Capital changes', 'Depreciation non-cash adjustment'],
        masteryLevel: 'learning',
        nextReviewDate: new Date().toISOString().split('T')[0],
        repetitions: 1,
      },
      {
        id: 'rev_c2',
        userId: user.id,
        stream: 'commerce',
        subject: 'Economics',
        topic: 'Macroeconomics: Monetary Policy',
        question: 'How does an increase in the Repo Rate control inflation in the economy?',
        answer: 'When the Central Bank raises the repo rate, borrowing costs for commercial banks increase. Commercial banks pass this hike to consumers and firms, discouraging consumption expenditure and capital investments. This curbs aggregate demand and stabilizes price levels.',
        keyConcepts: ['Repo Rate', 'Inflation', 'Credit Contraction'],
        masteryLevel: 'reviewing',
        nextReviewDate: new Date().toISOString().split('T')[0],
        repetitions: 2,
      },
    ];

    const starterArts: RevisionCard[] = [
      {
        id: 'rev_a1',
        userId: user.id,
        stream: 'arts',
        subject: 'Political Science',
        topic: 'Indian Constitution',
        question: 'What is the doctrine of Basic Structure established in Kesavananda Bharati (1973)?',
        answer: 'The Supreme Court ruled that while Parliament has extensive constituent powers under Article 368 to amend the Constitution, it cannot alter, destroy, or abrogate the basic structure or essential framework of the Constitution (e.g. secularism, judicial review, federalism, rule of law).',
        keyConcepts: ['Article 368', 'Judicial Review', 'Constitutionalism'],
        masteryLevel: 'learning',
        nextReviewDate: new Date().toISOString().split('T')[0],
        repetitions: 1,
      },
    ];

    const starters = user.stream === 'science' ? starterScience : user.stream === 'commerce' ? starterCommerce : starterArts;
    starters.forEach((c) => saveUserRevisionCard(user.id, c));
    setCards(getUserRevisionCards(user.id));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-zinc-800 bg-zinc-950">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">
              FOCURA · ACTIVE RETRIEVAL DECK
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold border border-zinc-700 bg-zinc-900 text-zinc-300">
              {streamMeta.title.toUpperCase()}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white mt-1">
            Revision & Active Recall
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Spaced repetition algorithm scheduling intervals (1d, 3d, 7d, 14d) to cement memory.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs shadow-md transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>New Revision Card</span>
        </button>
      </div>

      {/* Main Flashcard Review Area */}
      {cards.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-10 text-center max-w-xl mx-auto shadow-2xl space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-white">
            <BookMarked className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-white">Revision Deck is Empty</h2>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-md mx-auto">
            You have no active recall cards yet for your {streamMeta.title} stream. Create revision cards or import starter cards to review formulas, definitions, and derivations.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create First Card</span>
            </button>
            <button
              onClick={handleSeedStarterCards}
              className="w-full sm:w-auto py-2.5 px-4 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition-colors"
            >
              Add Starter {streamMeta.title} Cards
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Flashcard Viewer (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {currentCard ? (
              <div className="space-y-4">
                {/* Flashcard container with flip interaction */}
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="min-h-[320px] rounded-2xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 backdrop-blur-xl shadow-2xl cursor-pointer hover:border-zinc-700 transition-all flex flex-col justify-between relative group"
                >
                  {/* Top metadata */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-mono">
                        {currentCard.subject}
                      </span>
                      <span className="text-zinc-600">·</span>
                      <span className="text-zinc-400">{currentCard.topic}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded capitalize font-bold border ${
                          currentCard.masteryLevel === 'mastered'
                            ? 'bg-zinc-800 text-white border-zinc-600'
                            : currentCard.masteryLevel === 'reviewing'
                            ? 'bg-zinc-900 text-zinc-300 border-zinc-700'
                            : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                        }`}
                      >
                        {currentCard.masteryLevel}
                      </span>
                      <span className="text-zinc-500 text-[11px] font-mono">
                        {activeCardIndex + 1} / {filteredCards.length}
                      </span>
                    </div>
                  </div>

                  {/* Card Content (Question or Answer) */}
                  <div className="my-8 text-center sm:text-left space-y-2">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                      {isFlipped ? 'Answer & Derivation' : 'Active Retrieval Prompt'}
                    </div>
                    <div className="text-lg sm:text-xl font-semibold text-white leading-relaxed whitespace-pre-line">
                      {isFlipped ? currentCard.answer : currentCard.question}
                    </div>

                    {isFlipped && currentCard.keyConcepts.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-zinc-850 flex flex-wrap gap-1.5">
                        {currentCard.keyConcepts.map((k) => (
                          <span
                            key={k}
                            className="text-[10px] font-mono bg-zinc-900 text-zinc-300 px-2 py-0.5 rounded border border-zinc-800"
                          >
                            #{k}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bottom hint */}
                  <div className="flex items-center justify-between text-xs text-zinc-400 pt-3 border-t border-zinc-850">
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <RotateCw className="h-3 w-3 text-zinc-400" />
                      <span>Click card anywhere to flip</span>
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCard(currentCard.id);
                      }}
                      className="text-zinc-500 hover:text-white p-1 rounded transition-colors"
                      title="Delete card"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Spaced Repetition Response Buttons */}
                {isFlipped ? (
                  <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 space-y-2">
                    <div className="text-xs font-semibold text-zinc-300 text-center mb-2">
                      Rate Recall Difficulty (Calculates Next Review Interval)
                    </div>
                    <div className="grid grid-cols-4 gap-2 font-mono text-center">
                      <button
                        onClick={() => handleRating(1, 'learning')}
                        className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 hover:border-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
                      >
                        <div className="font-bold text-white">Again</div>
                        <div className="text-[10px] text-zinc-500">1 day</div>
                      </button>

                      <button
                        onClick={() => handleRating(3, 'learning')}
                        className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 hover:border-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
                      >
                        <div className="font-bold text-white">Hard</div>
                        <div className="text-[10px] text-zinc-500">3 days</div>
                      </button>

                      <button
                        onClick={() => handleRating(7, 'reviewing')}
                        className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 hover:border-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
                      >
                        <div className="font-bold text-white">Good</div>
                        <div className="text-[10px] text-zinc-500">7 days</div>
                      </button>

                      <button
                        onClick={() => handleRating(14, 'mastered')}
                        className="p-2.5 rounded-xl border border-zinc-700 bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-colors shadow-md"
                      >
                        <div>Mastered</div>
                        <div className="text-[10px] text-zinc-800 font-mono">14 days</div>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <button
                      onClick={handlePrevCard}
                      className="px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 text-xs font-medium hover:text-white hover:border-zinc-700 transition-colors"
                    >
                      ← Previous
                    </button>
                    <button
                      onClick={() => setIsFlipped(true)}
                      className="px-6 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-all shadow-md"
                    >
                      Reveal Answer
                    </button>
                    <button
                      onClick={handleNextCard}
                      className="px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 text-xs font-medium hover:text-white hover:border-zinc-700 transition-colors"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-zinc-400 border border-zinc-800 rounded-2xl bg-zinc-950">
                No cards match your filter or search query.
              </div>
            )}
          </div>

          {/* Right Column: Deck Overview & Stats (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Filter & Search */}
            <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950 space-y-3">
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                Deck Navigation
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search cards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                />
              </div>

              {/* Subject filter */}
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Filter Subject</label>
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-600 font-mono"
                >
                  <option value="all">All Subjects</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 border-t border-zinc-800 flex justify-between text-xs text-zinc-400">
                <span>Total Active Cards</span>
                <span className="font-mono text-white font-bold">{cards.length}</span>
              </div>
            </div>

            {/* Spaced Repetition Overview */}
            <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950 space-y-3">
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                Mastery Retention Status
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300">Mastered (14-day cycle)</span>
                  <span className="font-mono text-white font-bold">
                    {cards.filter((c) => c.masteryLevel === 'mastered').length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300">Reviewing (7-day cycle)</span>
                  <span className="font-mono text-zinc-300 font-bold">
                    {cards.filter((c) => c.masteryLevel === 'reviewing').length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300">Learning (1-3 day cycle)</span>
                  <span className="font-mono text-zinc-400 font-bold">
                    {cards.filter((c) => c.masteryLevel === 'learning').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Card Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white">Create Active Recall Card</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Subject</label>
                  <select
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-600"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Topic / Sub-Subject
                  </label>
                  <input
                    type="text"
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value)}
                    placeholder="e.g. Thermodynamics"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Recall Prompt / Question
                </label>
                <textarea
                  rows={2}
                  required
                  value={formQuestion}
                  onChange={(e) => setFormQuestion(e.target.value)}
                  placeholder="e.g. State Carnot Engine efficiency equation and conditions for maximum work..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Answer / Core Derivation
                </label>
                <textarea
                  rows={3}
                  required
                  value={formAnswer}
                  onChange={(e) => setFormAnswer(e.target.value)}
                  placeholder="e.g. eta = 1 - (T_C / T_H) = W / Q_H..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Key Concepts (comma-separated tags)
                </label>
                <input
                  type="text"
                  value={formConcepts}
                  onChange={(e) => setFormConcepts(e.target.value)}
                  placeholder="Carnot, Efficiency, Second Law"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs shadow-md"
                >
                  Save Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
