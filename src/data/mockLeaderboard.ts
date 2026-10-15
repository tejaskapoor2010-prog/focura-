import { LeaderboardEntry, StreamType, UserProfile } from '../types';
import { getUserPlan } from '../utils/plans';
import { getTodayFocusSeconds } from '../utils/plans';

export const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: 'user_champ_1',
    name: 'Aarav Sharma',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80',
    stream: 'science',
    focusMinutesToday: 385,
    focusMinutesWeekly: 2460,
    focusScoreAverage: 96,
    streakDays: 42,
    tier: 'ultra_premium',
    badge: '🏆 Grandmaster of Focus',
  },
  {
    id: 'user_champ_2',
    name: 'Priya Iyer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80',
    stream: 'commerce',
    focusMinutesToday: 340,
    focusMinutesWeekly: 2190,
    focusScoreAverage: 94,
    streakDays: 31,
    tier: 'ultra_premium',
    badge: '⚡ Deep Work Specialist',
  },
  {
    id: 'user_champ_3',
    name: 'Kabir Verma',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&h=120&q=80',
    stream: 'arts',
    focusMinutesToday: 315,
    focusMinutesWeekly: 1980,
    focusScoreAverage: 92,
    streakDays: 27,
    tier: 'ultra_premium',
    badge: '🎯 Flow State Elite',
  },
  {
    id: 'user_champ_4',
    name: 'Ananya Deshmukh',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&h=120&q=80',
    stream: 'science',
    focusMinutesToday: 290,
    focusMinutesWeekly: 1820,
    focusScoreAverage: 91,
    streakDays: 19,
    tier: 'ultra_premium',
    badge: '🔥 Streak Warrior',
  },
  {
    id: 'user_champ_5',
    name: 'Rohan Mehra',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
    stream: 'commerce',
    focusMinutesToday: 265,
    focusMinutesWeekly: 1640,
    focusScoreAverage: 89,
    streakDays: 15,
    tier: 'ultra_premium',
    badge: '📚 CA Aspirant Focus',
  },
  {
    id: 'user_champ_6',
    name: 'Sneha Sen',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80',
    stream: 'arts',
    focusMinutesToday: 240,
    focusMinutesWeekly: 1510,
    focusScoreAverage: 90,
    streakDays: 22,
    tier: 'ultra_premium',
    badge: '✍️ Literature Titan',
  },
  {
    id: 'user_champ_7',
    name: 'Devansh Kulkarni',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80',
    stream: 'science',
    focusMinutesToday: 225,
    focusMinutesWeekly: 1420,
    focusScoreAverage: 88,
    streakDays: 14,
    tier: 'ultra_premium',
    badge: '🔬 Lab Sprint Master',
  },
  {
    id: 'user_champ_8',
    name: 'Meera Nambiar',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
    stream: 'commerce',
    focusMinutesToday: 210,
    focusMinutesWeekly: 1350,
    focusScoreAverage: 87,
    streakDays: 18,
    tier: 'ultra_premium',
    badge: '📊 Quant Ace',
  },
  {
    id: 'user_champ_9',
    name: 'Tanya Banerjee',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&h=120&q=80',
    stream: 'arts',
    focusMinutesToday: 195,
    focusMinutesWeekly: 1210,
    focusScoreAverage: 86,
    streakDays: 11,
    tier: 'ultra_premium',
    badge: '🎨 Creative Zenith',
  },
  {
    id: 'user_champ_10',
    name: 'Vikramaditya Roy',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&h=120&q=80',
    stream: 'science',
    focusMinutesToday: 180,
    focusMinutesWeekly: 1100,
    focusScoreAverage: 85,
    streakDays: 9,
    tier: 'ultra_premium',
    badge: '🚀 Physics Pathfinder',
  }
];

/**
 * Builds the complete leaderboard list, inserting or updating the current active user
 * with their real recorded today focus time and streak!
 */
export function getAugmentedLeaderboard(
  currentUser: UserProfile,
  streamFilter: StreamType | 'all' = 'all',
  timeframe: 'today' | 'week' | 'alltime' = 'today'
): { list: LeaderboardEntry[]; userRank: number | null; currentUserEntry: LeaderboardEntry } {
  const { totalMinutes } = getTodayFocusSeconds(currentUser.id);
  const plan = getUserPlan(currentUser);

  // Compute current user's entry based on their actual study stats
  const currentUserEntry: LeaderboardEntry = {
    id: currentUser.id,
    name: currentUser.name || 'You',
    avatar: currentUser.avatar,
    stream: currentUser.stream,
    focusMinutesToday: totalMinutes,
    focusMinutesWeekly: totalMinutes + 420, // baseline estimate from current stats
    focusScoreAverage: 92,
    streakDays: currentUser.streakDays || 1,
    tier: plan,
    isCurrentUser: true,
    badge: plan === 'ultra_premium' ? '👑 Ultra Champion' : plan === 'premium' ? '⚡ Focus Pro' : '🌱 Free Learner',
  };

  // Combine mock champions with current user
  let combined = [...INITIAL_LEADERBOARD];
  const existingIdx = combined.findIndex((u) => u.id === currentUser.id);
  if (existingIdx >= 0) {
    combined[existingIdx] = currentUserEntry;
  } else {
    combined.push(currentUserEntry);
  }

  // Filter by stream if selected
  if (streamFilter !== 'all') {
    combined = combined.filter((entry) => entry.stream === streamFilter);
  }

  // Sort based on timeframe metric
  combined.sort((a, b) => {
    if (timeframe === 'today') {
      return b.focusMinutesToday - a.focusMinutesToday;
    }
    if (timeframe === 'week') {
      return b.focusMinutesWeekly - a.focusMinutesWeekly;
    }
    // alltime: combination of streak and weekly
    return (b.focusMinutesWeekly + b.streakDays * 50) - (a.focusMinutesWeekly + a.streakDays * 50);
  });

  // Assign ranks
  const rankedList = combined.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));

  const userRank = rankedList.find((entry) => entry.id === currentUser.id)?.rank || null;

  return {
    list: rankedList,
    userRank,
    currentUserEntry: {
      ...currentUserEntry,
      rank: userRank || 1,
    }
  };
}
