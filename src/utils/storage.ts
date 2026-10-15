import { UserProfile, StudySession, RevisionCard, SubjectItem, StreamType } from '../types';
import { DEFAULT_SUBJECTS } from '../data/streams';
import { 
  syncUserProfileToFirestore, 
  saveSessionToFirestore, 
  saveRevisionToFirestore,
  getUserSessionsFromFirestore 
} from '../firebase';
import { recordServerLogin, recordServerSession } from './serverTelemetry';

const STORAGE_KEYS = {
  CURRENT_USER_ID: 'focura_current_user_id',
  USERS: 'focura_users_db',
  USER_PREFIX: 'focura_user_',
  SESSIONS_PREFIX: 'focura_sessions_',
  REVISION_PREFIX: 'focura_revision_',
  SUBJECTS_PREFIX: 'focura_subjects_',
};

/**
 * Returns currently logged-in user, or null if no user is signed in.
 */
export function getCurrentUser(): UserProfile | null {
  try {
    const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    if (!currentId) return null;

    const raw = localStorage.getItem(`${STORAGE_KEYS.USER_PREFIX}${currentId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Saves or updates a user profile both locally and to Firestore
 */
export function saveUserProfile(user: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);
    localStorage.setItem(`${STORAGE_KEYS.USER_PREFIX}${user.id}`, JSON.stringify(user));

    // Register in users index
    const allUsers = getAllRegisteredUsers();
    if (!allUsers.find((u) => u.id === user.id)) {
      allUsers.push({ id: user.id, email: user.email, name: user.name, avatar: user.avatar });
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(allUsers));
    }

    // Persist to Cloud Firestore
    syncUserProfileToFirestore(user).catch(() => {});

    // Record login on backend server
    recordServerLogin(user).catch(() => {});
  } catch {
    // Storage quota
  }
}

/**
 * Signs out current user
 */
export function logoutUser(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
  } catch {
    //
  }
}

export function getAllRegisteredUsers(): Array<{ id: string; email: string; name: string; avatar: string }> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Get sessions for specific user. Brand new users will have [] (0 pre-existing data).
 */
export function getUserSessions(userId: string): StudySession[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.SESSIONS_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveUserSession(userId: string, session: StudySession): void {
  try {
    const sessions = getUserSessions(userId);
    sessions.unshift(session);
    localStorage.setItem(`${STORAGE_KEYS.SESSIONS_PREFIX}${userId}`, JSON.stringify(sessions));

    // Persist session to Cloud Firestore
    saveSessionToFirestore(userId, session).catch(() => {});

    // Record session & focus score on backend server
    recordServerSession(userId, session).catch(() => {});

    // Update user streak & active day
    const user = getCurrentUser();
    if (user && user.id === userId) {
      const today = new Date().toISOString().split('T')[0];
      if (user.lastActiveDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().split('T')[0];

        if (user.lastActiveDate === yStr) {
          user.streakDays = (user.streakDays || 0) + 1;
        } else {
          user.streakDays = 1; // Started new consecutive streak
        }
        user.lastActiveDate = today;
        saveUserProfile(user);
      }
    }
  } catch {
    //
  }
}

/**
 * Get revision cards for specific user
 */
export function getUserRevisionCards(userId: string): RevisionCard[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.REVISION_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveUserRevisionCard(userId: string, card: RevisionCard): void {
  try {
    const cards = getUserRevisionCards(userId);
    const existingIndex = cards.findIndex((c) => c.id === card.id);
    if (existingIndex >= 0) {
      cards[existingIndex] = card;
    } else {
      cards.unshift(card);
    }
    localStorage.setItem(`${STORAGE_KEYS.REVISION_PREFIX}${userId}`, JSON.stringify(cards));

    // Persist revision to Cloud Firestore
    saveRevisionToFirestore(userId, card).catch(() => {});
  } catch {
    //
  }
}

export const saveRevisionCard = (card: RevisionCard): void => {
  if (card && card.userId) {
    saveUserRevisionCard(card.userId, card);
  }
};

export function deleteUserRevisionCard(userId: string, cardId: string): void {
  try {
    const cards = getUserRevisionCards(userId).filter((c) => c.id !== cardId);
    localStorage.setItem(`${STORAGE_KEYS.REVISION_PREFIX}${userId}`, JSON.stringify(cards));
  } catch {
    //
  }
}

/**
 * Get subjects customized for this user (defaults combined with user additions)
 */
export function getUserSubjects(userId: string, stream: StreamType): SubjectItem[] {
  try {
    const defaultStreamSubjects = DEFAULT_SUBJECTS.filter((s) => s.stream === stream);
    const raw = localStorage.getItem(`${STORAGE_KEYS.SUBJECTS_PREFIX}${userId}`);
    if (!raw) return defaultStreamSubjects;

    const custom: SubjectItem[] = JSON.parse(raw);
    const customForStream = custom.filter((s) => s.stream === stream);

    return [...defaultStreamSubjects, ...customForStream];
  } catch {
    return DEFAULT_SUBJECTS.filter((s) => s.stream === stream);
  }
}

export function addCustomSubject(userId: string, subject: SubjectItem): void {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.SUBJECTS_PREFIX}${userId}`);
    const list: SubjectItem[] = raw ? JSON.parse(raw) : [];
    list.push(subject);
    localStorage.setItem(`${STORAGE_KEYS.SUBJECTS_PREFIX}${userId}`, JSON.stringify(list));
  } catch {
    //
  }
}

const STARRY_BG_KEY = 'focura_starry_bg_enabled';

export function getStarryBackgroundEnabled(): boolean {
  try {
    const stored = localStorage.getItem(STARRY_BG_KEY);
    if (stored === null) return true; // Default to true
    return stored === 'true';
  } catch {
    return true;
  }
}

export function setStarryBackgroundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STARRY_BG_KEY, String(enabled));
    window.dispatchEvent(new CustomEvent('focura_starry_bg_changed', { detail: { enabled } }));
  } catch {
    //
  }
}

