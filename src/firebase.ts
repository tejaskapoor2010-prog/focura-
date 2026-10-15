import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  getDocFromServer,
  query,
  orderBy
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { UserProfile, StudySession, RevisionCard } from './types';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with custom databaseId if configured
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Error logger conformant to guideline
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.warn('Firestore Error Logged: ', JSON.stringify(errInfo));
}

// Test connection on boot
export async function validateFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline / check configuration');
    }
  }
}
validateFirestoreConnection();

/**
 * Sign in using Google Popup (real Google account of user)
 */
export async function signInWithGooglePopup(): Promise<FirebaseUser | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

/**
 * Sign out
 */
export async function signOutFirebase(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign Out Error:', error);
  }
}

/**
 * Sync / Save user profile to Firestore
 */
export async function syncUserProfileToFirestore(profile: UserProfile): Promise<void> {
  try {
    const userRef = doc(db, 'users', profile.id);
    await setDoc(userRef, profile, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${profile.id}`);
  }
}

/**
 * Fetch user profile from Firestore
 */
export async function getUserProfileFromFirestore(userId: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${userId}`);
    return null;
  }
}

/**
 * Save study session to Firestore
 */
export async function saveSessionToFirestore(userId: string, session: StudySession): Promise<void> {
  try {
    const sessionRef = doc(db, 'users', userId, 'sessions', session.id);
    await setDoc(sessionRef, session);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/sessions/${session.id}`);
  }
}

/**
 * Fetch all sessions for a user from Firestore
 */
export async function getUserSessionsFromFirestore(userId: string): Promise<StudySession[]> {
  try {
    const colRef = collection(db, 'users', userId, 'sessions');
    const q = query(colRef, orderBy('startTime', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as StudySession);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `users/${userId}/sessions`);
    return [];
  }
}

/**
 * Save Revision Card to Firestore
 */
export async function saveRevisionToFirestore(userId: string, card: RevisionCard): Promise<void> {
  try {
    const cardRef = doc(db, 'users', userId, 'revisions', card.id);
    await setDoc(cardRef, card);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/revisions/${card.id}`);
  }
}
