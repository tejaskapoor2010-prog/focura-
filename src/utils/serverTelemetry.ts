/**
 * Client-Side Telemetry & Private Server Oversight Service
 * Automatically sends user logins and study sessions to the server backend
 * Provides private fetch APIs for the site owner
 */

import { UserProfile, StudySession } from '../types';

export interface ServerTrackedUser {
  id: string;
  name: string;
  email: string;
  stream: string;
  targetExam?: string;
  provider?: string;
  avatar?: string;
  firstLoginAt: string;
  lastLoginAt: string;
  totalLogins: number;
  lastIp: string;
  lastUserAgent: string;
  totalFocusMinutes: number;
  totalSessions: number;
  averageFocusScore: number;
  latestFocusScore: number;
  highestFocusScore: number;
  sessions: Array<{
    id: string;
    startTime: number;
    durationSeconds: number;
    focusedSeconds: number;
    focusScore: number;
    stream: string;
    subject: string;
    subTopic?: string;
    distractionCount: number;
    completedAt: string;
  }>;
}

export interface AdminTrackingResponse {
  success: boolean;
  ownerEmail: string;
  summary: {
    totalUsers: number;
    totalSessions: number;
    totalFocusMinutes: number;
    totalFocusHours: number;
    platformAvgFocusScore: number;
    activeToday: number;
    lastUpdated: string;
  };
  users: ServerTrackedUser[];
}

export const OWNER_EMAIL = 'tejaskapoor2010@gmail.com';
export const DEFAULT_ADMIN_KEY = 'focura-owner-2026';

/**
 * Record user login on server
 */
export async function recordServerLogin(user: UserProfile): Promise<void> {
  try {
    await fetch('/api/track/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: user.id,
        name: user.name,
        email: user.email,
        stream: user.stream,
        targetExam: user.targetExam,
        provider: user.provider,
        avatar: user.avatar,
      }),
    });
  } catch (err) {
    // Non-blocking telemetry
    console.warn('[Telemetry] Login tracking ping failed:', err);
  }
}

/**
 * Record completed study session & focus score on server
 */
export async function recordServerSession(userId: string, session: StudySession): Promise<void> {
  try {
    await fetch('/api/track/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        session: {
          id: session.id,
          startTime: session.startTime,
          endTime: session.endTime,
          durationSeconds: session.durationSeconds,
          focusedSeconds: session.focusedSeconds,
          focusScore: session.focusScore,
          stream: session.stream,
          subject: session.subject,
          subTopic: session.subTopic,
          distractionEvents: session.distractionEvents,
        },
      }),
    });
  } catch (err) {
    console.warn('[Telemetry] Session tracking ping failed:', err);
  }
}

/**
 * Fetch all tracked users & their focus scores (PRIVATE TO OWNER)
 */
export async function fetchAdminTrackedUsers(auth: { adminKey?: string; userEmail?: string }): Promise<AdminTrackingResponse> {
  const headers: Record<string, string> = {};
  if (auth.adminKey) headers['x-admin-key'] = auth.adminKey;
  if (auth.userEmail) headers['x-user-email'] = auth.userEmail;

  const res = await fetch('/api/admin/tracked-users', {
    method: 'GET',
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed with status ${res.status}`);
  }

  return res.json();
}

/**
 * Fetch detailed sessions for a specific tracked user
 */
export async function fetchAdminUserSessions(userId: string, auth: { adminKey?: string; userEmail?: string }): Promise<any> {
  const headers: Record<string, string> = {};
  if (auth.adminKey) headers['x-admin-key'] = auth.adminKey;
  if (auth.userEmail) headers['x-user-email'] = auth.userEmail;

  const res = await fetch(`/api/admin/user/${encodeURIComponent(userId)}/sessions`, {
    method: 'GET',
    headers,
  });

  if (!res.ok) {
    throw new Error('Failed to fetch user sessions');
  }

  return res.json();
}
