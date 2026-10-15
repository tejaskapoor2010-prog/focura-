export type StreamType = 'science' | 'commerce' | 'arts';

export type PlanTier = 'free' | 'premium' | 'ultra_premium';

export interface UserSubscription {
  plan: PlanTier;
  status: 'active' | 'inactive';
  isDemo: boolean;
  activatedAt: string;
  expiresAt?: string | null;
  demoOrderId?: string;
  paymentMethod?: string;
  amountPaid?: number;
  utrNumber?: string;
  upiId?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
}

export interface SubjectItem {
  id: string;
  name: string;
  stream: StreamType;
  subTopics: string[];
  color: string;
  iconName?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  stream: StreamType;
  targetExam?: string;
  dailyGoalMinutes: number;
  streakDays: number;
  lastActiveDate: string;
  provider: 'google' | 'email';
  createdAt: string;
  subscription?: UserSubscription;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  stream: StreamType;
  focusMinutesToday: number;
  focusMinutesWeekly: number;
  focusScoreAverage: number;
  streakDays: number;
  tier: PlanTier;
  isCurrentUser?: boolean;
  rank?: number;
  badge?: string;
}

export type FocusState = 'focused' | 'looking_away' | 'phone_posture' | 'absent' | 'drowsy';

export interface DistractionEvent {
  id: string;
  timestamp: number; // millisecond in session
  type: FocusState;
  durationSeconds: number;
  label: string;
}

export interface FocusTimelinePoint {
  second: number;
  focusScore: number;
  state: FocusState;
}

export interface StudySession {
  id: string;
  userId: string;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  focusedSeconds: number;
  focusScore: number; // 0 - 100
  stream: StreamType;
  subject: string;
  subTopic?: string;
  distractionEvents: DistractionEvent[];
  timeline: FocusTimelinePoint[];
  notes?: string;
}

export interface RevisionCard {
  id: string;
  userId: string;
  stream: StreamType;
  subject: string;
  topic: string;
  question: string;
  answer: string;
  keyConcepts: string[];
  masteryLevel: 'learning' | 'reviewing' | 'mastered';
  nextReviewDate: string;
  lastReviewedDate?: string;
  repetitions: number;
}

export interface VisionDetectionResult {
  hasFace: boolean;
  state: FocusState;
  stateConfidence: number;
  yawAngle: number;   // Left/Right angle in degrees
  pitchAngle: number; // Up/Down angle in degrees
  rollAngle: number;  // Tilt angle
  eyeOpenness: number; // 0 to 1
  faceBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  landmarks?: { x: number; y: number }[];
  focusScoreRealtime: number; // 0 - 100
  distractionReason?: string;
}
