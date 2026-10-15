import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu,
  X,
  Sparkles, 
  Flame, 
  LogOut, 
  ChevronDown, 
  Volume2, 
  VolumeX, 
  Bot,
  BrainCircuit,
  Crown,
  Trophy,
  Zap,
  Timer,
  BarChart3,
  BookOpen,
  Layers,
  Shield,
  Clock,
  ArrowRight
} from 'lucide-react';
import { UserProfile, StreamType, PlanTier } from '../types';
import { STREAMS_CONFIG } from '../data/streams';
import { soundscapes, AmbientSoundType } from '../utils/soundscapes';
import { FocuraLogo } from './FocuraLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { useStarryBackground } from '../hooks/useStarryBackground';
import { getUserPlan, checkDailyFocusLimit } from '../utils/plans';
import { FocusStreakBadge } from './FocusStreakBadge';

interface HeaderProps {
  user: UserProfile;
  currentTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  onUpdateStream: (stream: StreamType) => void;
  onOpenPricing?: (defaultTier?: PlanTier) => void;
}

interface NavCategory {
  category: string;
  items: {
    id: string;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeStyle?: string;
  }[];
}

export const Header: React.FC<HeaderProps> = ({
  user,
  currentTab,
  onTabChange,
  onLogout,
  onUpdateStream,
  onOpenPricing,
}) => {
  const currentPlan = getUserPlan(user);
  const { starsEnabled, toggleStars } = useStarryBackground();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [streamMenuOpen, setStreamMenuOpen] = useState(false);
  const [soundMenuOpen, setSoundMenuOpen] = useState(false);
  const [activeSound, setActiveSound] = useState<AmbientSoundType>('none');
  const [soundVolume, setSoundVolume] = useState<number>(50);

  const profileRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<HTMLDivElement>(null);
  const soundRef = useRef<HTMLDivElement>(null);

  const activeStreamMeta = STREAMS_CONFIG[user.stream] || STREAMS_CONFIG.science;
  const quotaInfo = checkDailyFocusLimit(user, 0);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (streamRef.current && !streamRef.current.contains(e.target as Node)) {
        setStreamMenuOpen(false);
      }
      if (soundRef.current && !soundRef.current.contains(e.target as Node)) {
        setSoundMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close drawer on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setDrawerOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSoundSelect = (type: AmbientSoundType) => {
    setActiveSound(type);
    soundscapes.playAmbient(type);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setSoundVolume(val);
    soundscapes.setVolume(val / 100);
  };

  const navCategories: NavCategory[] = [
    {
      category: 'Overview & Focus',
      items: [
        {
          id: 'intro',
          label: 'Home & Intro',
          description: 'Singularity black hole visualizer, company info & team',
          icon: Sparkles,
          badge: 'HOME',
          badgeStyle: 'bg-white text-black font-extrabold',
        },
        {
          id: 'study',
          label: 'Study Room',
          description: 'AI Camera CV tracking & Pomodoro timer',
          icon: Timer,
          badge: 'LIVE',
          badgeStyle: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
        },
        {
          id: 'leaderboard',
          label: 'Global Leaderboard',
          description: 'Top students podium & stream champions',
          icon: Trophy,
          badge: 'ULTRA',
          badgeStyle: 'bg-amber-400 text-black font-extrabold',
        },
      ],
    },
    {
      category: 'AI Study Intelligence',
      items: [
        {
          id: 'coach',
          label: 'AI Coach',
          description: 'Personal AI tutor for doubts & syllabus roadmap',
          icon: Bot,
          badge: 'AI',
          badgeStyle: 'bg-white text-black font-bold',
        },
        {
          id: 'quiz',
          label: 'AI Quiz',
          description: 'Adaptive exam practice tests & questions',
          icon: BrainCircuit,
          badge: 'NEW',
          badgeStyle: 'bg-zinc-800 text-white font-bold',
        },
      ],
    },
    {
      category: 'Study Management',
      items: [
        {
          id: 'analytics',
          label: 'Analytics',
          description: 'Focus curves, daily breakdown & consistency stats',
          icon: BarChart3,
        },
        {
          id: 'revision',
          label: 'Revision Support',
          description: 'Spaced repetition flashcards & rapid reviews',
          icon: BookOpen,
        },
        {
          id: 'subjects',
          label: 'Subjects & Topics',
          description: 'Custom curriculum, chapters & stream units',
          icon: Layers,
        },
        {
          id: 'shield',
          label: 'Distraction Shield',
          description: 'Website blocking, study audio & white noise',
          icon: Shield,
        },
      ],
    },
  ];

  // Helper to find label of current active tab
  const activeNavItem = navCategories
    .flatMap((c) => c.items)
    .find((i) => i.id === currentTab);

  return (
    <>
      {/* Sleek, Clean Top Header Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-black/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
          
          {/* Left Section: Features Drawer Button & Logo */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Features Drawer Toggle Button */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-all text-xs font-medium focus:outline-none shadow-sm active:scale-95"
              title="Open Features Drawer"
              aria-label="Open Features Menu"
            >
              <Menu className="h-4 w-4" />
              <span className="hidden sm:inline font-mono text-[11px] font-bold tracking-wide">
                Features
              </span>
            </button>

            {/* Brand Logo & Name (Links to Home / Intro) */}
            <button 
              onClick={() => onTabChange('intro')}
              className="flex items-center gap-2 text-left group focus:outline-none transition-transform active:scale-95 p-0.5"
              title="Focura - Home"
            >
              <FocuraLogo className="h-8 w-8 sm:h-9 sm:w-9" />
              <span className="font-extrabold text-sm sm:text-base tracking-wider text-white hidden xs:inline">
                FOCURA
              </span>
            </button>

            {/* Active Tab Breadcrumb / Pill */}
            {activeNavItem && (
              <div className="hidden md:flex items-center gap-2 pl-2 border-l border-zinc-800">
                <span className="text-[11px] font-mono text-zinc-500 uppercase">/</span>
                <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                  <activeNavItem.icon className="h-3.5 w-3.5 text-zinc-400" />
                  <span>{activeNavItem.label}</span>
                </span>
                {activeNavItem.badge && (
                  <span className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
                    activeNavItem.badge === 'ULTRA'
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}>
                    {activeNavItem.badge}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right Section: Clean Utility Controls (Get Started, Sound, Stream, Streak, Plan, Profile) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Quick Get Started Button (Visible when not in Study Room) */}
            {currentTab !== 'study' && (
              <button
                onClick={() => onTabChange('study')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-black font-extrabold text-xs hover:bg-zinc-200 transition-all shadow-md active:scale-95 group"
                title="Continue towards Study Room"
              >
                <Timer className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                <span className="font-semibold text-[11px] sm:text-xs">Get Started</span>
                <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            )}

            {/* PWA Install Button */}
            <PWAInstallButton variant="header" />

            {/* Ambient Soundscape Toggle */}
            <div className="relative" ref={soundRef}>
              <button
                onClick={() => setSoundMenuOpen(!soundMenuOpen)}
                className={`p-2 rounded-xl text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                  activeSound !== 'none'
                    ? 'border-white bg-white text-black font-bold shadow-sm'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
                title="Ambient Focus Audio"
              >
                {activeSound !== 'none' ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                <span className="hidden xl:inline text-[11px] capitalize">
                  {activeSound === 'none' ? 'Audio' : activeSound}
                </span>
              </button>

              {/* Sound Dropdown Menu */}
              {soundMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-zinc-800 bg-zinc-950 p-3 shadow-2xl z-50 space-y-3 animate-fadeIn">
                  <div className="text-[11px] font-mono uppercase text-zinc-400 font-bold">
                    Ambient Audio Engine
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'none', label: 'Mute' },
                      { id: 'binaural', label: 'Alpha 10Hz' },
                      { id: 'rain', label: 'Rain' },
                      { id: 'library', label: 'Library' },
                      { id: 'whitenoise', label: 'White Noise' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleSoundSelect(s.id as AmbientSoundType)}
                        className={`px-2.5 py-1.5 text-xs rounded-lg text-left transition-colors font-medium ${
                          activeSound === s.id
                            ? 'bg-white text-black font-bold'
                            : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>

                  {activeSound !== 'none' && (
                    <div className="pt-2 border-t border-zinc-800 space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                        <span>Volume</span>
                        <span>{soundVolume}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={soundVolume}
                        onChange={handleVolumeChange}
                        className="w-full accent-white h-1 bg-zinc-800 rounded-lg cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Stream Selector */}
            <div className="relative" ref={streamRef}>
              <button
                onClick={() => setStreamMenuOpen(!streamMenuOpen)}
                className="px-2.5 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
                title="Current Stream"
              >
                <span className="font-mono text-[11px] uppercase text-zinc-400">
                  {user.stream}
                </span>
                <ChevronDown className="h-3 w-3 text-zinc-500" />
              </button>

              {streamMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-zinc-800 bg-zinc-950 p-1.5 shadow-2xl z-50 space-y-1 animate-fadeIn">
                  <div className="px-2.5 py-1 text-[10px] font-mono uppercase text-zinc-500">
                    Switch Stream
                  </div>
                  {(['science', 'commerce', 'arts'] as StreamType[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        onUpdateStream(st);
                        setStreamMenuOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 text-xs text-left rounded-lg capitalize transition-colors flex items-center justify-between ${
                        user.stream === st
                          ? 'bg-white text-black font-bold'
                          : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                      }`}
                    >
                      <span>{st}</span>
                      {user.stream === st && <span className="text-[10px] font-mono font-bold">Active</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Gamified Focus Streak Counter & Hub */}
            <FocusStreakBadge
              user={user}
              onNavigateToStudy={() => onTabChange('study')}
            />

            {/* Plan Tier Badge / Upgrade Action */}
            <button
              onClick={() => onOpenPricing?.()}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                currentPlan === 'ultra_premium'
                  ? 'border border-amber-400/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                  : currentPlan === 'premium'
                  ? 'border border-zinc-600 bg-zinc-800 text-white hover:bg-zinc-700'
                  : 'border border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:text-white hover:border-zinc-700'
              }`}
              title="Click to view subscription tiers or activate Demo plan"
            >
              {currentPlan === 'ultra_premium' ? (
                <>
                  <Crown className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-[10px] tracking-wide">ULTRA</span>
                </>
              ) : currentPlan === 'premium' ? (
                <>
                  <Zap className="h-3.5 w-3.5 text-white" />
                  <span className="text-[10px] tracking-wide">4H PRO</span>
                </>
              ) : (
                <>
                  <span className="text-[10px] tracking-wide">45M FREE</span>
                  <span className="hidden sm:inline text-[9px] px-1 py-0.2 rounded bg-zinc-800 text-zinc-300">
                    UPGRADE
                  </span>
                </>
              )}
            </button>

            {/* Profile Avatar & Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-zinc-900 transition-colors focus:outline-none"
                aria-label="User Profile Menu"
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-8 w-8 rounded-xl border border-zinc-700 object-cover bg-zinc-800 shadow"
                />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-zinc-800 bg-zinc-950 p-2 shadow-2xl z-50 space-y-2 animate-fadeIn">
                  <div className="px-2.5 py-2 border-b border-zinc-800">
                    <div className="text-xs font-bold text-white truncate">{user.name}</div>
                    <div className="text-[10px] font-mono text-zinc-500 truncate">{user.email}</div>
                    <div className="text-[10px] text-zinc-400 mt-1 flex justify-between items-center">
                      <span>Plan:</span>
                      <span className={`font-mono font-bold uppercase text-[10px] px-1.5 py-0.2 rounded ${
                        currentPlan === 'ultra_premium'
                          ? 'bg-amber-400/20 text-amber-300'
                          : currentPlan === 'premium'
                          ? 'bg-white text-black'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {currentPlan === 'ultra_premium' ? 'Ultra (Unlimited)' : currentPlan === 'premium' ? 'Pro (4h/day)' : 'Free (45m/day)'}
                      </span>
                    </div>
                  </div>

                  {/* Manage Plans Button */}
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      onOpenPricing?.();
                    }}
                    className="w-full px-2.5 py-1.5 text-xs text-left rounded-lg text-amber-300 hover:bg-zinc-900 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 font-medium">
                      <Crown className="h-3.5 w-3.5 text-amber-400" />
                      <span>Manage Plans & Demo</span>
                    </div>
                    <span className="text-[9px] font-mono bg-amber-400/20 px-1 py-0.2 rounded font-bold">
                      DEMO
                    </span>
                  </button>

                  <button
                    onClick={onLogout}
                    className="w-full px-2.5 py-1.5 text-xs text-left rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors flex items-center gap-2"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* FEATURES LEFT DRAWER (Slide-Over Mode) */}
      {/* ========================================================= */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          {/* Dimmed Backdrop */}
          <div 
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm animate-fade-in transition-opacity"
            aria-hidden="true"
          />

          {/* Drawer Sidebar Panel */}
          <div className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-zinc-950 border-r border-zinc-850 shadow-2xl flex flex-col justify-between animate-slide-in-left">
            {/* Drawer Header */}
            <div className="p-4 border-b border-zinc-850 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FocuraLogo className="h-9 w-9" />
                <div>
                  <div className="font-extrabold text-sm text-white tracking-wider flex items-center gap-1.5">
                    <span>FOCURA</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-850 text-zinc-400 font-normal">
                      v2.4
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-500 font-mono">
                    AI Study & Focus Suite
                  </div>
                </div>
              </div>

              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                title="Close drawer"
                aria-label="Close features drawer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Drawer Body - Categorized Features List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-5">
              {navCategories.map((group, groupIdx) => (
                <div key={groupIdx} className="space-y-1.5">
                  <div className="px-3 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
                    {group.category}
                  </div>

                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const isActive = currentTab === item.id;
                      const IconComponent = item.icon;

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onTabChange(item.id);
                            setDrawerOpen(false);
                          }}
                          className={`w-full p-2.5 rounded-xl text-left transition-all flex items-start justify-between group ${
                            isActive
                              ? 'bg-white text-black font-bold shadow-lg'
                              : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-1.5 rounded-lg mt-0.5 transition-colors ${
                              isActive
                                ? 'bg-black text-white'
                                : 'bg-zinc-900 text-zinc-400 group-hover:text-white group-hover:bg-zinc-800'
                            }`}>
                              <IconComponent className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-xs font-semibold leading-tight flex items-center gap-1.5">
                                <span>{item.label}</span>
                                {item.badge && (
                                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                                    item.badgeStyle || (isActive ? 'bg-black text-white' : 'bg-zinc-800 text-zinc-300')
                                  }`}>
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <div className={`text-[11px] mt-0.5 line-clamp-1 leading-snug ${
                                isActive ? 'text-zinc-600 font-normal' : 'text-zinc-500'
                              }`}>
                                {item.description}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Drawer Footer: Plan Summary & Quick Settings */}
            <div className="p-3.5 border-t border-zinc-850 bg-zinc-950/90 space-y-3">
              {/* Focus Streak Status Card */}
              <div className="p-3 rounded-xl border border-zinc-800 bg-gradient-to-r from-zinc-900 via-black to-zinc-950 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <Flame className="h-4 w-4 text-amber-400 fill-amber-400/20 animate-pulse" />
                    <span>Focus Streak</span>
                  </div>
                  <span className="font-mono font-black text-amber-300 text-xs bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg">
                    {user.streakDays || 1} Days
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                  <span>Daily Gamification</span>
                  <button
                    onClick={() => {
                      setDrawerOpen(false);
                      onTabChange('study');
                    }}
                    className="text-white hover:text-amber-300 font-bold underline decoration-zinc-700 underline-offset-2 transition-colors"
                  >
                    Study Room →
                  </button>
                </div>
              </div>

              {/* Plan Card */}
              <div className={`p-3 rounded-xl border text-xs ${
                currentPlan === 'ultra_premium'
                  ? 'border-amber-400/40 bg-amber-500/10 text-amber-200'
                  : currentPlan === 'premium'
                  ? 'border-zinc-700 bg-zinc-900/60 text-zinc-200'
                  : 'border-zinc-800 bg-zinc-900/40 text-zinc-300'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 font-bold">
                    {currentPlan === 'ultra_premium' ? (
                      <Crown className="h-3.5 w-3.5 text-amber-400" />
                    ) : (
                      <Clock className="h-3.5 w-3.5 text-zinc-400" />
                    )}
                    <span className="capitalize">{currentPlan.replace('_', ' ')} Plan</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase text-zinc-400">
                    {currentPlan === 'ultra_premium' ? 'Unlimited' : currentPlan === 'premium' ? '4h / day' : '45m / day'}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    onOpenPricing?.(currentPlan === 'free' ? 'premium' : 'ultra_premium');
                  }}
                  className={`w-full py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                    currentPlan === 'ultra_premium'
                      ? 'bg-amber-400 text-black hover:bg-amber-300'
                      : 'bg-white text-black hover:bg-zinc-200'
                  }`}
                >
                  <span>{currentPlan === 'ultra_premium' ? 'Manage Subscription' : 'Upgrade Plan (Demo)'}</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              {/* Starry Atmosphere Toggle inside Drawer */}
              <div className="flex items-center justify-between p-2 rounded-xl border border-zinc-800 bg-zinc-900/50 text-xs text-zinc-300">
                <div className="flex items-center gap-2 font-medium">
                  <Sparkles className={`h-3.5 w-3.5 ${starsEnabled ? 'text-white' : 'text-zinc-500'}`} />
                  <span className="text-[11px]">Atmosphere Stars</span>
                </div>
                <button
                  onClick={toggleStars}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors ${
                    starsEnabled
                      ? 'bg-white text-black border-white'
                      : 'bg-zinc-850 text-zinc-400 border-zinc-700'
                  }`}
                >
                  {starsEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
