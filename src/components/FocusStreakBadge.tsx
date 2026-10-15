import React, { useState, useRef, useEffect } from 'react';
import { 
  Flame, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Award, 
  Zap, 
  Shield, 
  Crown, 
  ChevronRight, 
  ArrowRight,
  X,
  AlertTriangle,
  Calendar,
  Trophy
} from 'lucide-react';
import { UserProfile } from '../types';
import { calculateUserStreak, StreakData, DayActivity, StreakMilestone } from '../utils/streak';

interface FocusStreakBadgeProps {
  user: UserProfile;
  onNavigateToStudy: () => void;
}

export const FocusStreakBadge: React.FC<FocusStreakBadgeProps> = ({
  user,
  onNavigateToStudy,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate real-time streak data
  const streakData: StreakData = calculateUserStreak(user);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Icon mapping for milestones
  const renderMilestoneIcon = (iconName: string, unlocked: boolean) => {
    const className = `h-4 w-4 ${unlocked ? 'text-amber-400' : 'text-zinc-600'}`;
    switch (iconName) {
      case 'Zap':
        return <Zap className={className} />;
      case 'Flame':
        return <Flame className={className} />;
      case 'Shield':
        return <Shield className={className} />;
      case 'Crown':
        return <Crown className={className} />;
      case 'Sparkles':
      default:
        return <Sparkles className={className} />;
    }
  };

  const isFire = streakData.currentStreak > 0;

  return (
    <div className="relative" ref={containerRef}>
      {/* ========================================================= */}
      {/* Header Visual Badge Trigger Button */}
      {/* ========================================================= */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all shadow-sm active:scale-95 focus:outline-none ${
          streakData.hasStudiedToday
            ? 'border-amber-500/50 bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/10 text-amber-200 hover:border-amber-400 shadow-amber-500/10'
            : streakData.isAtRisk
            ? 'border-orange-500/60 bg-gradient-to-r from-orange-500/20 to-red-500/15 text-orange-200 hover:border-orange-400 animate-pulse'
            : 'border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:border-zinc-700 hover:text-white'
        }`}
        title="Focus Streak Gamification Hub · Click to view streak progress"
        aria-label="Focus Streak counter"
      >
        {/* Animated Flame Icon */}
        <div className="relative flex items-center justify-center">
          <Flame 
            className={`h-4 w-4 transition-transform duration-300 group-hover:scale-125 ${
              streakData.hasStudiedToday
                ? 'text-amber-400 fill-amber-400/30 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.6)] animate-pulse'
                : streakData.isAtRisk
                ? 'text-orange-400 fill-orange-400/20 filter drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]'
                : 'text-zinc-500'
            }`} 
          />
          {streakData.hasStudiedToday && (
            <span className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
          )}
        </div>

        {/* Days Count */}
        <span className="font-extrabold tracking-tight">
          {streakData.currentStreak}
          <span className="text-[11px] font-medium text-zinc-400 ml-0.5">d</span>
        </span>

        {/* Status Indicator Label */}
        {streakData.hasStudiedToday ? (
          <span className="hidden lg:inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded-md bg-amber-400/20 text-amber-300 font-extrabold border border-amber-400/30">
            <CheckCircle2 className="h-2.5 w-2.5" />
            <span>ACTIVE</span>
          </span>
        ) : streakData.isAtRisk ? (
          <span className="hidden lg:inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded-md bg-orange-500/25 text-orange-200 font-extrabold border border-orange-500/40">
            <span>AT RISK</span>
          </span>
        ) : (
          <span className="hidden xl:inline-block text-[10px] text-zinc-500 font-normal">
            STREAK
          </span>
        )}
      </button>

      {/* ========================================================= */}
      {/* Gamification Hub Dropdown Modal */}
      {/* ========================================================= */}
      {isOpen && (
        <div className="absolute right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 mt-2.5 w-[340px] sm:w-[380px] rounded-3xl border border-zinc-800 bg-zinc-950/95 backdrop-blur-2xl p-5 shadow-2xl z-50 space-y-4 animate-fadeIn text-white">
          
          {/* Top Bar with Title & Close */}
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg border border-amber-400/30 bg-amber-400/10 flex items-center justify-center text-amber-400">
                <Flame className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-white">
                  Focus Streak Hub
                </h3>
                <p className="text-[10px] text-zinc-400 font-mono">
                  Consecutive Daily Study Gamification
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Hero Streak Card */}
          <div className="relative rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-black to-zinc-950 p-4 text-center overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-32 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-1.5">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto shadow-inner">
                <Flame className="h-7 w-7 fill-amber-400/20 filter drop-shadow-[0_0_10px_rgba(251,191,36,0.5)] animate-pulse" />
              </div>

              <div className="text-3xl font-black tracking-tight text-white font-mono flex items-center justify-center gap-1.5">
                <span>{streakData.currentStreak}</span>
                <span className="text-lg font-bold text-zinc-400">Days</span>
              </div>

              <div className={`text-xs font-mono font-extrabold ${streakData.levelColor}`}>
                Rank: {streakData.levelTitle}
              </div>

              {/* Status Alert Banner */}
              <div className="pt-2">
                {streakData.hasStudiedToday ? (
                  <div className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[11px] font-mono flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    <span>Streak safe for today! ({streakData.todayMinutes}m studied)</span>
                  </div>
                ) : streakData.isAtRisk ? (
                  <div className="p-2.5 rounded-xl border border-orange-500/40 bg-orange-500/15 text-orange-200 text-[11px] font-mono flex items-center justify-center gap-1.5 text-center">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-orange-400" />
                    <span>
                      At Risk! Study in the next {streakData.hoursUntilMidnight}h {streakData.minutesUntilMidnight}m to preserve streak!
                    </span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-400 text-[11px] font-mono flex items-center justify-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                    <span>Complete your 1st session today to ignite your streak!</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 7-Day Current Week Calendar Visualizer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 px-1">
              <span>This Week's Activity</span>
              <span className="text-[10px] text-zinc-500">Mon – Sun</span>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center font-mono">
              {streakData.weekActivity.map((day, idx) => (
                <div 
                  key={idx}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-between transition-all ${
                    day.isToday
                      ? 'border-white bg-zinc-900 text-white shadow-md'
                      : day.studied
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                      : 'border-zinc-850 bg-zinc-950/60 text-zinc-600'
                  }`}
                  title={`${day.dayName} (${day.dateStr}): ${day.minutes} mins studied`}
                >
                  <span className="text-[10px] font-semibold text-zinc-400">
                    {day.dayShort}
                  </span>

                  <div className="my-1.5">
                    {day.studied ? (
                      <Flame className="h-4 w-4 text-amber-400 fill-amber-400/30 filter drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]" />
                    ) : (
                      <div className={`h-2 w-2 rounded-full ${day.isToday ? 'bg-amber-400 animate-pulse' : 'bg-zinc-800'}`} />
                    )}
                  </div>

                  <span className="text-[9px] text-zinc-500">
                    {day.minutes > 0 ? `${day.minutes}m` : '-'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Next Milestone Progress Bar */}
          {streakData.nextMilestone && (
            <div className="p-3 rounded-2xl border border-zinc-850 bg-zinc-900/40 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-amber-400" />
                  <span>Next: {streakData.nextMilestone.name}</span>
                </span>
                <span className="font-bold text-white">
                  {streakData.currentStreak} / {streakData.nextMilestone.daysRequired}d
                </span>
              </div>

              {/* Progress Bar Track */}
              <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
                  style={{ width: `${streakData.nextMilestone.progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                <span>{streakData.nextMilestone.daysRequired - streakData.currentStreak} days to unlock</span>
                <span className="text-amber-300 font-bold">{streakData.nextMilestone.rewardBadge}</span>
              </div>
            </div>
          )}

          {/* Gamification Milestones Badges Row */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block px-1">
              Streak Milestones
            </span>
            <div className="grid grid-cols-5 gap-1.5">
              {streakData.milestones.map((m) => (
                <div
                  key={m.id}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-colors ${
                    m.unlocked
                      ? 'border-amber-400/40 bg-amber-400/10 text-amber-300'
                      : 'border-zinc-850 bg-zinc-900/30 text-zinc-600 opacity-60'
                  }`}
                  title={`${m.name}: ${m.tagline} (${m.daysRequired} days)`}
                >
                  {renderMilestoneIcon(m.iconName, m.unlocked)}
                  <span className="text-[9px] font-mono font-bold mt-1 text-zinc-300">
                    {m.daysRequired}d
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Best Record & Stats Footer */}
          <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono pt-1">
            <div className="p-2.5 rounded-xl border border-zinc-850 bg-zinc-900/30">
              <span className="text-[10px] text-zinc-500 block">Longest Record</span>
              <span className="font-bold text-white text-sm">
                🏆 {streakData.longestStreak} Days
              </span>
            </div>
            <div className="p-2.5 rounded-xl border border-zinc-850 bg-zinc-900/30">
              <span className="text-[10px] text-zinc-500 block">Today Studied</span>
              <span className="font-bold text-amber-300 text-sm">
                ⏱️ {streakData.todayMinutes} mins
              </span>
            </div>
          </div>

          {/* Action CTA to Enter Study Room */}
          <button
            onClick={() => {
              setIsOpen(false);
              onNavigateToStudy();
            }}
            className={`w-full py-3 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 ${
              streakData.hasStudiedToday
                ? 'bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700'
                : 'bg-white hover:bg-zinc-200 text-black shadow-white/10'
            }`}
          >
            <Flame className="h-4 w-4" />
            <span>
              {streakData.hasStudiedToday
                ? 'Continue Studying in Study Room'
                : 'Start Focus Session (+1 Day Streak)'}
            </span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>

        </div>
      )}
    </div>
  );
};
