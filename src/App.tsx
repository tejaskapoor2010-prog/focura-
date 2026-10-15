/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserProfile, StudySession, StreamType, PlanTier } from './types';
import { getCurrentUser, saveUserProfile, logoutUser, saveUserSession } from './utils/storage';
import { Header } from './components/Header';
import { LoginView } from './components/LoginView';
import { StudyRoom } from './components/StudyRoom';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { RevisionSupport } from './components/RevisionSupport';
import { SubjectManager } from './components/SubjectManager';
import { DistractionShield } from './components/DistractionShield';
import { SessionSummaryModal } from './components/SessionSummaryModal';
import { AICoachView } from './components/AICoachView';
import { AIQuizView } from './components/AIQuizView';
import { LeaderboardView } from './components/LeaderboardView';
import { PricingModal } from './components/PricingModal';
import { FocuraIntroView } from './components/FocuraIntroView';
import { FocuraLogo } from './components/FocuraLogo';
import { OfflineBanner } from './components/OfflineBanner';
import { StarryBackground } from './components/StarryBackground';
import { useStarryBackground } from './hooks/useStarryBackground';
import { recordServerLogin, recordServerSession } from './utils/serverTelemetry';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(() => getCurrentUser());
  const [currentTab, setCurrentTab] = useState<string>('intro');
  const [recentCompletedSession, setRecentCompletedSession] = useState<StudySession | null>(null);
  const [pricingModalOpen, setPricingModalOpen] = useState<boolean>(false);
  const [pricingDefaultTier, setPricingDefaultTier] = useState<PlanTier | undefined>(undefined);
  const { starsEnabled } = useStarryBackground();

  // Background server telemetry sync
  useEffect(() => {
    if (user) {
      recordServerLogin(user).catch(() => {});
    }
  }, [user]);

  const handleOpenPricing = (defaultTier?: PlanTier) => {
    setPricingDefaultTier(defaultTier);
    setPricingModalOpen(true);
  };

  // Handle Login & profile initialization - opens intro as Home
  const handleLogin = (newUser: UserProfile) => {
    saveUserProfile(newUser);
    setUser(newUser);
    setCurrentTab('intro');
    recordServerLogin(newUser).catch(() => {});
  };

  // Handle Logout
  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setCurrentTab('intro');
    setRecentCompletedSession(null);
  };

  // Handle stream update from header
  const handleUpdateStream = (newStream: StreamType) => {
    if (!user) return;
    const updatedUser: UserProfile = {
      ...user,
      stream: newStream,
    };
    saveUserProfile(updatedUser);
    setUser(updatedUser);
  };

  // Handle session finished
  const handleSessionComplete = (session: StudySession) => {
    if (user) {
      saveUserSession(user.id, session);
      recordServerSession(user.id, session).catch(() => {});
      const freshUser = getCurrentUser();
      if (freshUser) {
        setUser(freshUser);
      }
    }
    setRecentCompletedSession(session);
  };

  // If user is not signed in, show Auth / Onboarding portal
  if (!user) {
    return (
      <div className="relative min-h-screen bg-black">
        <StarryBackground enabled={starsEnabled} />
        <OfflineBanner />
        <LoginView onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col justify-between selection:bg-zinc-800 selection:text-white">
      {/* Minimalist Star Atmosphere Background */}
      <StarryBackground enabled={starsEnabled} />

      {/* Offline Connectivity Indicator */}
      <OfflineBanner />

      {/* Top Header */}
      <Header
        user={user}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onLogout={handleLogout}
        onUpdateStream={handleUpdateStream}
        onOpenPricing={handleOpenPricing}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-16">
        {currentTab === 'study' && (
          <StudyRoom
            user={user}
            onSessionComplete={handleSessionComplete}
            onOpenPricing={handleOpenPricing}
          />
        )}

        {currentTab === 'leaderboard' && (
          <LeaderboardView
            user={user}
            onOpenPricing={() => handleOpenPricing('ultra_premium')}
          />
        )}

        {currentTab === 'coach' && (
          <AICoachView user={user} />
        )}

        {currentTab === 'quiz' && (
          <AIQuizView user={user} />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsDashboard
            user={user}
            onStartSessionClick={() => setCurrentTab('study')}
          />
        )}

        {currentTab === 'revision' && (
          <RevisionSupport user={user} />
        )}

        {currentTab === 'subjects' && (
          <SubjectManager
            user={user}
            onSelectSubjectForStudy={(subId) => {
              setCurrentTab('study');
            }}
          />
        )}

        {currentTab === 'shield' && (
          <DistractionShield
            onLaunchStudySession={() => setCurrentTab('study')}
          />
        )}

        {currentTab === 'intro' && (
          <FocuraIntroView
            onStartStudying={() => setCurrentTab('study')}
            onOpenPricing={() => handleOpenPricing()}
          />
        )}
      </main>

      {/* Post-Session Summary & AI Diagnosis Modal */}
      {recentCompletedSession && (
        <SessionSummaryModal
          session={recentCompletedSession}
          onClose={() => setRecentCompletedSession(null)}
          onNavigateToRevision={() => {
            setRecentCompletedSession(null);
            setCurrentTab('revision');
          }}
        />
      )}

      {/* Pricing & Plan Demo Modal */}
      <PricingModal
        user={user}
        isOpen={pricingModalOpen}
        onClose={() => setPricingModalOpen(false)}
        onPlanUpdated={(updatedUser) => setUser(updatedUser)}
        defaultPlanSelection={pricingDefaultTier}
      />

      {/* Footer in Black & White */}
      <footer className="border-t border-zinc-900 bg-black py-5 px-4 sm:px-6 lg:px-8 text-xs text-zinc-500">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2.5">
            <FocuraLogo className="h-6 w-6" />
            <span className="font-extrabold text-white">FOCURA</span>
            <span>·</span>
            <span>AI-Powered Smart Study Platform</span>
            <span>·</span>
            <span className="font-mono text-zinc-400">"{user.name}" ({user.stream.toUpperCase()})</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-zinc-500 font-mono">
            <button
              onClick={() => setCurrentTab('intro')}
              className="hover:text-white transition-colors underline decoration-zinc-700 underline-offset-4"
            >
              Company & Team
            </button>
            <span>·</span>
            <span>“Don’t just track study time — understand your focus.”</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
