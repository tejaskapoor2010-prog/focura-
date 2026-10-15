/**
 * Focus Streak Gamification Engine
 * Calculates consecutive daily study sessions, milestones, week activity,
 * and maintains streak state across local storage and sessions.
 */

import { StudySession, UserProfile } from '../types';
import { getUserSessions } from './storage';

export interface DayActivity {
  dateStr: string; // 'YYYY-MM-DD'
  dayName: string; // 'Mon', 'Tue', etc.
  dayShort: string; // 'M', 'T', 'W', etc.
  studied: boolean;
  minutes: number;
  isToday: boolean;
  isPast: boolean;
}

export interface StreakMilestone {
  id: string;
  name: string;
  tagline: string;
  daysRequired: number;
  iconName: string;
  unlocked: boolean;
  progressPercent: number;
  rewardBadge: string;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  hasStudiedToday: boolean;
  todayMinutes: number;
  hoursUntilMidnight: number;
  minutesUntilMidnight: number;
  levelTitle: string;
  levelColor: string;
  weekActivity: DayActivity[];
  nextMilestone: StreakMilestone | null;
  milestones: StreakMilestone[];
  isAtRisk: boolean;
}

// Format local date as YYYY-MM-DD
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const MILESTONES_CONFIG: Omit<StreakMilestone, 'unlocked' | 'progressPercent'>[] = [
  {
    id: 'm1',
    name: 'Spark Initiate',
    tagline: 'First step into daily deep work flow',
    daysRequired: 1,
    iconName: 'Zap',
    rewardBadge: 'Novice Glow',
  },
  {
    id: 'm3',
    name: 'Steady Flame',
    tagline: '3 consecutive days of disciplined focus',
    daysRequired: 3,
    iconName: 'Flame',
    rewardBadge: '3x Consistency',
  },
  {
    id: 'm7',
    name: 'Iron Will',
    tagline: 'A full 7-day uninterrupted study streak',
    daysRequired: 7,
    iconName: 'Shield',
    rewardBadge: 'Weekly Champion',
  },
  {
    id: 'm14',
    name: 'Deep Work Master',
    tagline: 'Two continuous weeks of supreme focus',
    daysRequired: 14,
    iconName: 'Crown',
    rewardBadge: 'Focus Alchemist',
  },
  {
    id: 'm30',
    name: 'Singularity Supernova',
    tagline: 'A full 30-day legendary mastery milestone',
    daysRequired: 30,
    iconName: 'Sparkles',
    rewardBadge: 'Supernova Rank',
  },
];

/**
 * Calculates complete focus streak analytics for a user based on session history
 */
export function calculateUserStreak(user: UserProfile | null): StreakData {
  const now = new Date();
  const todayStr = getLocalDateString(now);

  // Time remaining until midnight
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diffMs = Math.max(0, midnight.getTime() - now.getTime());
  const hoursUntilMidnight = Math.floor(diffMs / (1000 * 60 * 60));
  const minutesUntilMidnight = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (!user) {
    return createDefaultStreakData(todayStr, hoursUntilMidnight, minutesUntilMidnight);
  }

  const sessions = getUserSessions(user.id);

  // Group focus minutes by calendar date (YYYY-MM-DD)
  const minutesByDate: Record<string, number> = {};
  for (const session of sessions) {
    const sDate = new Date(session.startTime);
    const dateKey = getLocalDateString(sDate);
    const focusMins = Math.round((session.focusedSeconds || session.durationSeconds || 0) / 60);
    minutesByDate[dateKey] = (minutesByDate[dateKey] || 0) + focusMins;
  }

  const todayMinutes = minutesByDate[todayStr] || 0;
  const hasStudiedToday = todayMinutes > 0;

  // Calculate consecutive days
  // We check backwards day-by-day starting from today or yesterday
  let streak = 0;
  let checkDate = new Date(now);

  if (hasStudiedToday) {
    // Today is active, count today and go backwards
    streak = 1;
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    // Today not yet completed: check if yesterday was active to keep streak alive
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = getLocalDateString(yesterday);
    if ((minutesByDate[yStr] || 0) > 0) {
      // Streak is active from yesterday, but at risk today!
      streak = 0; // base before loop
      checkDate = yesterday;
    } else {
      // Neither today nor yesterday studied -> streak broken
      checkDate = null as any;
    }
  }

  if (checkDate) {
    while (true) {
      const dStr = getLocalDateString(checkDate);
      if ((minutesByDate[dStr] || 0) > 0) {
        if (!hasStudiedToday && streak === 0) {
          streak = 1;
        } else if (hasStudiedToday) {
          streak += 1;
        } else {
          streak += 1;
        }
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Use highest of calculated streak or user profile baseline if valid
  const effectiveStreak = Math.max(streak, (hasStudiedToday ? (user.streakDays || 1) : (user.streakDays || 0)));

  // Calculate longest streak from sessions
  let longestStreak = Math.max(effectiveStreak, user.streakDays || 1);
  const sortedDates = Object.keys(minutesByDate).sort();
  if (sortedDates.length > 0) {
    let currentRun = 0;
    let prevD: Date | null = null;
    for (const dStr of sortedDates) {
      const parts = dStr.split('-').map(Number);
      const currD = new Date(parts[0], parts[1] - 1, parts[2]);
      if (prevD) {
        const diffDays = Math.round((currD.getTime() - prevD.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentRun += 1;
        } else if (diffDays > 1) {
          currentRun = 1;
        }
      } else {
        currentRun = 1;
      }
      prevD = currD;
      if (currentRun > longestStreak) {
        longestStreak = currentRun;
      }
    }
  }

  // Generate 7-day current week activity (Monday to Sunday)
  const weekActivity = generateCurrentWeekActivity(now, minutesByDate, todayStr);

  // Gamification Level Title & Color
  const { levelTitle, levelColor } = getStreakLevel(effectiveStreak);

  // Milestones Progress
  const milestones: StreakMilestone[] = MILESTONES_CONFIG.map((m) => {
    const unlocked = effectiveStreak >= m.daysRequired;
    const progressPercent = Math.min(100, Math.round((effectiveStreak / m.daysRequired) * 100));
    return {
      ...m,
      unlocked,
      progressPercent,
    };
  });

  const nextMilestone = milestones.find((m) => !m.unlocked) || null;
  const isAtRisk = !hasStudiedToday && effectiveStreak > 0;

  return {
    currentStreak: effectiveStreak,
    longestStreak,
    hasStudiedToday,
    todayMinutes,
    hoursUntilMidnight,
    minutesUntilMidnight,
    levelTitle,
    levelColor,
    weekActivity,
    nextMilestone,
    milestones,
    isAtRisk,
  };
}

function getStreakLevel(streak: number): { levelTitle: string; levelColor: string } {
  if (streak >= 30) {
    return { levelTitle: 'Singularity Supernova', levelColor: 'text-amber-300' };
  }
  if (streak >= 14) {
    return { levelTitle: 'Deep Work Master', levelColor: 'text-orange-400' };
  }
  if (streak >= 7) {
    return { levelTitle: 'Iron Will Scholar', levelColor: 'text-amber-400' };
  }
  if (streak >= 3) {
    return { levelTitle: 'Steady Flame', levelColor: 'text-yellow-400' };
  }
  if (streak >= 1) {
    return { levelTitle: 'Spark Initiate', levelColor: 'text-zinc-200' };
  }
  return { levelTitle: 'Ignite Your Streak', levelColor: 'text-zinc-400' };
}

function generateCurrentWeekActivity(now: Date, minutesByDate: Record<string, number>, todayStr: string): DayActivity[] {
  // Find Monday of this week
  const curr = new Date(now);
  const dayOfWeek = curr.getDay(); // 0 is Sun, 1 is Mon...
  const distanceToMonday = (dayOfWeek + 6) % 7;
  const monday = new Date(curr);
  monday.setDate(curr.getDate() - distanceToMonday);

  const days: DayActivity[] = [];
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayShorts = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dStr = getLocalDateString(d);
    const isToday = dStr === todayStr;
    const isPast = d < now && !isToday;
    const minutes = minutesByDate[dStr] || 0;

    days.push({
      dateStr: dStr,
      dayName: dayNames[i],
      dayShort: dayShorts[i],
      studied: minutes > 0,
      minutes,
      isToday,
      isPast,
    });
  }

  return days;
}

function createDefaultStreakData(todayStr: string, hoursUntilMidnight: number, minutesUntilMidnight: number): StreakData {
  const days: DayActivity[] = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((short, i) => ({
    dateStr: todayStr,
    dayName: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    dayShort: short,
    studied: false,
    minutes: 0,
    isToday: i === 0,
    isPast: false,
  }));

  const milestones = MILESTONES_CONFIG.map((m) => ({
    ...m,
    unlocked: false,
    progressPercent: 0,
  }));

  return {
    currentStreak: 0,
    longestStreak: 0,
    hasStudiedToday: false,
    todayMinutes: 0,
    hoursUntilMidnight,
    minutesUntilMidnight,
    levelTitle: 'Ignite Your Streak',
    levelColor: 'text-zinc-400',
    weekActivity: days,
    nextMilestone: milestones[0],
    milestones,
    isAtRisk: false,
  };
}
