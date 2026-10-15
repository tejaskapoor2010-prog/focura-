import { PlanTier, UserProfile, UserSubscription, StudySession } from '../types';
import { getUserSessions } from './storage';

export interface PlanConfig {
  id: PlanTier;
  name: string;
  badge: string;
  tagline: string;
  dailyFocusMinutes: number; // 45 for free, 240 for premium, Infinity for ultra
  priceInr: number;
  priceUsd: number;
  billingPeriod: string;
  popular?: boolean;
  accentColor: string;
  features: string[];
  limitations: string[];
}

export const PLAN_CONFIGS: Record<PlanTier, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free Starter',
    badge: 'FREE',
    tagline: 'Essential focus tracking for casual study',
    dailyFocusMinutes: 45,
    priceInr: 0,
    priceUsd: 0,
    billingPeriod: 'Forever free',
    accentColor: 'border-zinc-700 text-zinc-300',
    features: [
      '45 Minutes/day AI Focus Timer detection',
      'Smart Pomodoro & Stopwatch modes',
      'Basic Head Tilt & Gaze distraction alerts',
      '5 AI Study Coach / Quiz queries per day',
      '7-day focus analytics & streak tracking',
      'Standard ambient soundscapes'
    ],
    limitations: [
      'Daily focus detection locks after 45 minutes',
      'Global Leaderboard is locked',
      'No multi-angle phone detection',
      'Limited AI queries'
    ]
  },
  premium: {
    id: 'premium',
    name: 'Focus Pro',
    badge: 'PREMIUM',
    tagline: 'For committed students who study in deep blocks',
    dailyFocusMinutes: 240, // 4 hours
    priceInr: 299,
    priceUsd: 3.99,
    billingPeriod: 'per month (Demo)',
    popular: true,
    accentColor: 'border-white text-white',
    features: [
      '4 Hours (240 min)/day AI Focus Timer detection',
      'Smart adaptive intervals & custom timer lengths',
      'High-precision posture, phone & gaze tracking',
      '50 AI Study Coach & Quiz questions per day',
      '30-day analytics history & subject breakdowns',
      'All binaural beats & ambient soundscapes',
      'Distraction Shield sound customizer'
    ],
    limitations: [
      'Daily focus detection locks after 4 hours',
      'Global Leaderboard reserved for Ultra Premium'
    ]
  },
  ultra_premium: {
    id: 'ultra_premium',
    name: 'Ultra Master',
    badge: 'ULTRA PREMIUM',
    tagline: 'Unlimited power, AI mastery & Global Leaderboards',
    dailyFocusMinutes: Infinity, // Unlimited
    priceInr: 599,
    priceUsd: 7.99,
    billingPeriod: 'per month (Demo)',
    popular: false,
    accentColor: 'border-amber-400 text-amber-300',
    features: [
      '✨ UNLIMITED Daily Focus Timer Detection (No daily cap)',
      '🏆 Full Access to Global Leaderboard & Stream Rankings',
      'Unlimited high-speed AI Coach queries & quiz generator',
      'Lifetime deep analytics & printable study reports',
      'Golden Crown Ultra badge & stream championship spotlight',
      'Deep drowsiness, blink-rate & fatigue detection AI',
      'Priority customer support & early feature access'
    ],
    limitations: []
  }
};

/**
 * Returns the user's active plan, defaulting to 'free'.
 */
export function getUserPlan(user: UserProfile | null | undefined): PlanTier {
  if (!user || !user.subscription) return 'free';
  if (user.subscription.status !== 'active') return 'free';
  return user.subscription.plan || 'free';
}

/**
 * Checks if user has ultra premium tier
 */
export function isUltraUser(user: UserProfile | null | undefined): boolean {
  return getUserPlan(user) === 'ultra_premium';
}

/**
 * Checks if user has at least premium (or ultra)
 */
export function isPaidUser(user: UserProfile | null | undefined): boolean {
  const plan = getUserPlan(user);
  return plan === 'premium' || plan === 'ultra_premium';
}

/**
 * Calculates total focus seconds recorded today for a user,
 * plus any live session duration currently running.
 */
export function getTodayFocusSeconds(
  userId: string, 
  activeSessionDurationSec: number = 0
): { totalSeconds: number; totalMinutes: number } {
  try {
    const sessions = getUserSessions(userId);
    const todayStr = new Date().toISOString().split('T')[0];

    const todaySessions = sessions.filter((s) => {
      // Check session start date
      const sDate = new Date(s.startTime).toISOString().split('T')[0];
      return sDate === todayStr;
    });

    const completedSeconds = todaySessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
    const totalSeconds = completedSeconds + Math.max(0, activeSessionDurationSec);
    const totalMinutes = Math.floor(totalSeconds / 60);

    return { totalSeconds, totalMinutes };
  } catch {
    return { 
      totalSeconds: Math.max(0, activeSessionDurationSec), 
      totalMinutes: Math.floor(Math.max(0, activeSessionDurationSec) / 60) 
    };
  }
}

/**
 * Checks whether user has exceeded their daily focus timer detection limit.
 */
export function checkDailyFocusLimit(
  user: UserProfile | null | undefined, 
  activeSessionDurationSec: number = 0
): {
  isLimitReached: boolean;
  plan: PlanTier;
  maxMinutes: number;
  usedMinutes: number;
  usedSeconds: number;
  remainingSeconds: number;
  remainingMinutes: number;
  percentUsed: number;
} {
  const plan = getUserPlan(user);
  const planConfig = PLAN_CONFIGS[plan];
  const maxMinutes = planConfig.dailyFocusMinutes;

  if (maxMinutes === Infinity) {
    const { totalSeconds, totalMinutes } = user 
      ? getTodayFocusSeconds(user.id, activeSessionDurationSec)
      : { totalSeconds: activeSessionDurationSec, totalMinutes: Math.floor(activeSessionDurationSec / 60) };

    return {
      isLimitReached: false,
      plan,
      maxMinutes: Infinity,
      usedMinutes: totalMinutes,
      usedSeconds: totalSeconds,
      remainingSeconds: Infinity,
      remainingMinutes: Infinity,
      percentUsed: 0
    };
  }

  const { totalSeconds, totalMinutes } = user 
    ? getTodayFocusSeconds(user.id, activeSessionDurationSec)
    : { totalSeconds: activeSessionDurationSec, totalMinutes: Math.floor(activeSessionDurationSec / 60) };

  const maxSeconds = maxMinutes * 60;
  const remainingSeconds = Math.max(0, maxSeconds - totalSeconds);
  const remainingMinutes = Math.ceil(remainingSeconds / 60);
  const isLimitReached = totalSeconds >= maxSeconds;
  const percentUsed = Math.min(100, Math.round((totalSeconds / maxSeconds) * 100));

  return {
    isLimitReached,
    plan,
    maxMinutes,
    usedMinutes: totalMinutes,
    usedSeconds: totalSeconds,
    remainingSeconds,
    remainingMinutes,
    percentUsed
  };
}

export const FAMPAY_UPI_ID = '8595237192@fam';

/**
 * Creates a subscription object with payment or demo
 */
export function createSubscriptionWithPayment(
  plan: PlanTier,
  amount: number,
  paymentMethod: string = 'FamPay UPI (8595237192@fam)',
  utrNumber?: string
): UserSubscription {
  return {
    plan,
    status: 'active',
    isDemo: paymentMethod.toLowerCase().includes('demo') || amount === 0,
    activatedAt: new Date().toISOString(),
    demoOrderId: `ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
    paymentMethod,
    amountPaid: amount,
    utrNumber: utrNumber || undefined,
    upiId: FAMPAY_UPI_ID,
    expiresAt: null
  };
}

/**
 * Creates a subscription activated via Razorpay
 */
export function createSubscriptionWithRazorpay(
  plan: PlanTier,
  amount: number,
  paymentId: string,
  orderId?: string,
  signature?: string
): UserSubscription {
  return {
    plan,
    status: 'active',
    isDemo: paymentId.startsWith('pay_test_') || paymentId.startsWith('pay_sim_'),
    activatedAt: new Date().toISOString(),
    demoOrderId: orderId || `ORD-${paymentId}`,
    paymentMethod: `Razorpay (${paymentId})`,
    amountPaid: amount,
    razorpayPaymentId: paymentId,
    razorpayOrderId: orderId,
    razorpaySignature: signature,
    expiresAt: null
  };
}

/**
 * Creates a demo subscription object
 */
export function createDemoSubscription(plan: PlanTier, paymentMethod: string = 'Demo 1-Click Sandbox'): UserSubscription {
  return {
    plan,
    status: 'active',
    isDemo: true,
    activatedAt: new Date().toISOString(),
    demoOrderId: `DEMO-ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
    paymentMethod,
    amountPaid: 0,
    upiId: FAMPAY_UPI_ID,
    expiresAt: null // Active demo
  };
}
