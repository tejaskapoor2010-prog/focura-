import React, { useState } from 'react';
import { 
  Trophy, 
  Crown, 
  Flame, 
  Sparkles, 
  Lock, 
  Zap, 
  Filter, 
  TrendingUp, 
  Clock, 
  Award, 
  CheckCircle2, 
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { UserProfile, StreamType } from '../types';
import { getAugmentedLeaderboard } from '../data/mockLeaderboard';
import { getUserPlan } from '../utils/plans';

interface LeaderboardViewProps {
  user: UserProfile;
  onOpenPricing: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ user, onOpenPricing }) => {
  const currentPlan = getUserPlan(user);
  const isUltra = currentPlan === 'ultra_premium';

  const [streamFilter, setStreamFilter] = useState<StreamType | 'all'>('all');
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'alltime'>('today');

  const { list: leaderboardData, userRank, currentUserEntry } = getAugmentedLeaderboard(
    user,
    streamFilter,
    timeframe
  );

  const top3 = leaderboardData.slice(0, 3);
  const restList = leaderboardData.slice(3);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
                <span>Global Study Leaderboard</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  ULTRA EXCLUSIVE
                </span>
              </h1>
              <p className="text-xs text-zinc-400">
                Compete with dedicated students across Science, Commerce & Arts streams worldwide.
              </p>
            </div>
          </div>
        </div>

        {/* Current Plan Badge & Upgrade Action */}
        <div className="flex items-center gap-3">
          {isUltra ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-amber-400/30 bg-amber-500/10 text-amber-300 text-xs font-mono font-bold">
              <Crown className="h-4 w-4 text-amber-400" />
              <span>Ultra Member Active</span>
            </div>
          ) : (
            <button
              onClick={onOpenPricing}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 text-black font-extrabold text-xs hover:from-amber-300 hover:to-amber-200 transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/10"
            >
              <Crown className="h-3.5 w-3.5" />
              <span>Unlock Leaderboard with Demo Plan</span>
            </button>
          )}
        </div>
      </div>

      {/* If not Ultra: Show High-Craft Locked Experience with Blurred Backdrop */}
      {!isUltra && (
        <div className="relative rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-950/20 via-zinc-950/90 to-zinc-950 p-6 sm:p-10 shadow-2xl text-center overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-xl mx-auto space-y-4">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-xl">
              <Lock className="h-8 w-8" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Unlock the Global Study Leaderboard
            </h2>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              The Global Leaderboard & Stream Tournaments are exclusively available on the{' '}
              <span className="font-bold text-amber-300">Ultra Premium Tier</span>. 
              Track your rank among peers, maintain study streaks, and unlock champion recognition.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 py-2 text-left">
              <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/60 text-xs">
                <div className="font-mono text-zinc-400 text-[10px] uppercase">Free Plan</div>
                <div className="font-bold text-white mt-1">45 Min/Day</div>
                <div className="text-[11px] text-zinc-500">Leaderboard locked</div>
              </div>
              <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/60 text-xs">
                <div className="font-mono text-zinc-400 text-[10px] uppercase">Premium Plan</div>
                <div className="font-bold text-white mt-1">4 Hours/Day</div>
                <div className="text-[11px] text-zinc-500">Leaderboard locked</div>
              </div>
              <div className="p-3 rounded-xl border border-amber-400/40 bg-amber-500/10 text-xs ring-1 ring-amber-400/30">
                <div className="font-mono text-amber-300 text-[10px] uppercase font-bold flex items-center gap-1">
                  <Crown className="h-3 w-3" /> Ultra Master
                </div>
                <div className="font-bold text-amber-200 mt-1">UNLIMITED Focus</div>
                <div className="text-[11px] text-amber-300/80">✅ Full Leaderboard</div>
              </div>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onOpenPricing}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 text-black font-extrabold text-xs hover:from-amber-300 hover:to-amber-200 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <Crown className="h-4 w-4" />
                <span>Test Ultra Premium (Demo Checkout)</span>
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">
              ⚡ Instant 1-click sandbox authorization. No real money or card required.
            </p>
          </div>
        </div>
      )}

      {/* Filter Bars (Disabled or Preview if not Ultra, Active if Ultra) */}
      <div className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ${!isUltra ? 'opacity-40 pointer-events-none' : ''}`}>
        {/* Stream Filter */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl border border-zinc-800 bg-zinc-950 overflow-x-auto text-xs">
          <span className="text-[10px] font-mono text-zinc-500 px-2 uppercase font-bold">Stream:</span>
          {(['all', 'science', 'commerce', 'arts'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStreamFilter(s)}
              className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-all ${
                streamFilter === s
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              {s === 'all' ? 'All Streams' : s}
            </button>
          ))}
        </div>

        {/* Timeframe Filter */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl border border-zinc-800 bg-zinc-950 text-xs">
          {(['today', 'week', 'alltime'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                timeframe === t
                  ? 'bg-zinc-800 text-white font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t === 'today' ? 'Today' : t === 'week' ? 'This Week' : 'All-Time Streak'}
            </button>
          ))}
        </div>
      </div>

      {/* Podium for Top 3 Champions */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 ${!isUltra ? 'opacity-40 pointer-events-none' : ''}`}>
        {/* Rank 2 */}
        {top3[1] && (
          <div className="order-2 md:order-1 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 flex flex-col items-center text-center relative hover:border-zinc-700 transition-colors">
            <div className="absolute -top-3 px-2.5 py-0.5 rounded-full bg-zinc-300 text-zinc-900 font-mono font-extrabold text-[10px] shadow">
              #2 SILVER
            </div>
            <img
              src={top3[1].avatar}
              alt={top3[1].name}
              className="h-16 w-16 rounded-full border-2 border-zinc-400 object-cover mt-2 mb-3 bg-zinc-800"
            />
            <div className="font-bold text-white text-sm">{top3[1].name}</div>
            <div className="text-[11px] font-mono text-zinc-400 uppercase mt-0.5">{top3[1].stream}</div>
            <div className="text-xs text-amber-300 font-medium mt-1">{top3[1].badge}</div>

            <div className="mt-4 pt-3 border-t border-zinc-900 w-full grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <span className="text-[10px] text-zinc-500 block">Focus Today</span>
                <span className="font-bold text-white">{Math.floor(top3[1].focusMinutesToday / 60)}h {top3[1].focusMinutesToday % 60}m</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block">Streak</span>
                <span className="font-bold text-white flex items-center justify-center gap-1">
                  <Flame className="h-3 w-3 text-amber-400" /> {top3[1].streakDays}d
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Rank 1 - Champion */}
        {top3[0] && (
          <div className="order-1 md:order-2 rounded-2xl border-2 border-amber-400 bg-gradient-to-b from-amber-950/30 via-zinc-950 to-zinc-950 p-6 flex flex-col items-center text-center relative shadow-2xl shadow-amber-500/10">
            <div className="absolute -top-4 px-3 py-1 rounded-full bg-amber-400 text-black font-mono font-extrabold text-xs shadow-lg flex items-center gap-1">
              <Crown className="h-3.5 w-3.5" />
              <span>#1 CHAMPION</span>
            </div>
            <div className="relative mt-2 mb-3">
              <img
                src={top3[0].avatar}
                alt={top3[0].name}
                className="h-20 w-20 rounded-full border-4 border-amber-400 object-cover bg-zinc-800 shadow-xl"
              />
              <div className="absolute -bottom-1 -right-1 p-1 bg-black rounded-full border border-amber-400">
                <Crown className="h-4 w-4 text-amber-400" />
              </div>
            </div>
            <div className="font-extrabold text-white text-base">{top3[0].name}</div>
            <div className="text-xs font-mono text-amber-300 uppercase font-bold mt-0.5">{top3[0].stream} STREAM</div>
            <div className="text-xs text-amber-200 font-semibold mt-1">{top3[0].badge}</div>

            <div className="mt-5 pt-3 border-t border-amber-400/20 w-full grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-amber-400/10 p-2 rounded-xl border border-amber-400/20">
                <span className="text-[10px] text-amber-300 block uppercase">Today's Focus</span>
                <span className="font-extrabold text-white text-sm">
                  {Math.floor(top3[0].focusMinutesToday / 60)}h {top3[0].focusMinutesToday % 60}m
                </span>
              </div>
              <div className="bg-amber-400/10 p-2 rounded-xl border border-amber-400/20">
                <span className="text-[10px] text-amber-300 block uppercase">Consistency</span>
                <span className="font-extrabold text-white text-sm flex items-center justify-center gap-1">
                  <Flame className="h-4 w-4 text-amber-400" /> {top3[0].streakDays}d
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Rank 3 */}
        {top3[2] && (
          <div className="order-3 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 flex flex-col items-center text-center relative hover:border-zinc-700 transition-colors">
            <div className="absolute -top-3 px-2.5 py-0.5 rounded-full bg-amber-700 text-white font-mono font-extrabold text-[10px] shadow">
              #3 BRONZE
            </div>
            <img
              src={top3[2].avatar}
              alt={top3[2].name}
              className="h-16 w-16 rounded-full border-2 border-amber-700 object-cover mt-2 mb-3 bg-zinc-800"
            />
            <div className="font-bold text-white text-sm">{top3[2].name}</div>
            <div className="text-[11px] font-mono text-zinc-400 uppercase mt-0.5">{top3[2].stream}</div>
            <div className="text-xs text-amber-300 font-medium mt-1">{top3[2].badge}</div>

            <div className="mt-4 pt-3 border-t border-zinc-900 w-full grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <span className="text-[10px] text-zinc-500 block">Focus Today</span>
                <span className="font-bold text-white">{Math.floor(top3[2].focusMinutesToday / 60)}h {top3[2].focusMinutesToday % 60}m</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block">Streak</span>
                <span className="font-bold text-white flex items-center justify-center gap-1">
                  <Flame className="h-3 w-3 text-amber-400" /> {top3[2].streakDays}d
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Current User Fixed Position Row (When Ultra Active) */}
      {isUltra && (
        <div className="rounded-2xl border border-amber-400/40 bg-amber-950/20 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-400 text-black font-extrabold flex items-center justify-center font-mono text-base shadow">
              #{userRank || '—'}
            </div>
            <img
              src={user.avatar}
              alt={user.name}
              className="h-10 w-10 rounded-xl border border-amber-400 object-cover bg-zinc-800"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">{user.name}</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-400/30 text-amber-300 border border-amber-400/40">
                  YOU
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-zinc-800 text-zinc-300">
                  {user.stream}
                </span>
              </div>
              <div className="text-xs text-zinc-400">
                Today: <span className="font-mono text-white font-bold">{Math.floor(currentUserEntry.focusMinutesToday / 60)}h {currentUserEntry.focusMinutesToday % 60}m</span> focused
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="text-right">
              <span className="text-[10px] text-zinc-500 block">Daily Streak</span>
              <span className="font-bold text-amber-300 flex items-center gap-1">
                <Flame className="h-3.5 w-3.5" /> {user.streakDays || 1} Days
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-500 block">Tier Status</span>
              <span className="font-bold text-white flex items-center gap-1">
                <Crown className="h-3.5 w-3.5 text-amber-400" /> Ultra Master
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Rankings Table */}
      <div className={`rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden ${!isUltra ? 'opacity-40 pointer-events-none' : ''}`}>
        <div className="px-5 py-3 border-b border-zinc-800 bg-zinc-900/40 text-xs font-mono uppercase text-zinc-400 font-bold flex justify-between items-center">
          <span>Global Ranks (Ranks #4 and beyond)</span>
          <span className="text-[10px] text-zinc-500 font-normal">Realtime Focus Engine</span>
        </div>

        <div className="divide-y divide-zinc-900">
          {restList.map((entry) => {
            const isMe = entry.id === user.id;
            return (
              <div
                key={entry.id}
                className={`px-5 py-3.5 flex items-center justify-between gap-4 transition-colors ${
                  isMe
                    ? 'bg-amber-400/10 font-bold'
                    : 'hover:bg-zinc-900/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-zinc-400 w-7">
                    #{entry.rank}
                  </span>
                  <img
                    src={entry.avatar}
                    alt={entry.name}
                    className="h-9 w-9 rounded-xl border border-zinc-800 object-cover bg-zinc-800"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{entry.name}</span>
                      {isMe && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-400/30 text-amber-300">
                          YOU
                        </span>
                      )}
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-zinc-800 text-zinc-400">
                        {entry.stream}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400">{entry.badge}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-8 text-xs font-mono text-right">
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Today</span>
                    <span className="font-bold text-white">
                      {Math.floor(entry.focusMinutesToday / 60)}h {entry.focusMinutesToday % 60}m
                    </span>
                  </div>
                  <div className="hidden sm:block">
                    <span className="text-[10px] text-zinc-500 block">Weekly</span>
                    <span className="text-zinc-300">
                      {Math.floor(entry.focusMinutesWeekly / 60)}h
                    </span>
                  </div>
                  <div className="hidden sm:block">
                    <span className="text-[10px] text-zinc-500 block">Focus Score</span>
                    <span className="text-zinc-300">{entry.focusScoreAverage}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Streak</span>
                    <span className="font-bold text-amber-300 flex items-center justify-end gap-1">
                      <Flame className="h-3.5 w-3.5" />
                      {entry.streakDays}d
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
