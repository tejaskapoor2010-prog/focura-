import http from 'http';
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// ============================================================================
// SERVER-SIDE PRIVATE USER & FOCUS SCORE TRACKING ENGINE (OWNER ONLY)
// ============================================================================
const DATA_DIR = path.resolve(__dirname, 'server_data');
const TRACKING_FILE = path.resolve(DATA_DIR, 'tracked_users.json');
const OWNER_EMAIL = 'tejaskapoor2010@gmail.com';
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'focura-owner-2026';

interface TrackedSessionSummary {
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
}

interface ServerTrackedUser {
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
  sessions: TrackedSessionSummary[];
}

interface TrackingDatabase {
  users: Record<string, ServerTrackedUser>;
  lastUpdated: string;
}

// ============================================================================
// RAZORPAY PAYMENT & REVENUE PERSISTENCE ENGINE
// ============================================================================
const PAYMENTS_FILE = path.resolve(DATA_DIR, 'payments.json');

export interface PaymentRecord {
  id: string; // razorpay_payment_id
  orderId: string; // razorpay_order_id
  paymentId: string;
  signature?: string;
  userId: string;
  userName: string;
  userEmail: string;
  plan: string;
  amount: number; // in INR
  currency: string;
  status: 'captured' | 'failed' | 'pending';
  method: string;
  createdAt: string;
  verified: boolean;
  isSandbox: boolean;
}

export interface PaymentsDatabase {
  payments: PaymentRecord[];
  totalRevenueInr: number;
  lastUpdated: string;
}

function loadPaymentsDb(): PaymentsDatabase {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(PAYMENTS_FILE)) {
      const initial: PaymentsDatabase = { payments: [], totalRevenueInr: 0, lastUpdated: new Date().toISOString() };
      fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(initial, null, 2));
      return initial;
    }
    const raw = fs.readFileSync(PAYMENTS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load payments db:', err);
    return { payments: [], totalRevenueInr: 0, lastUpdated: new Date().toISOString() };
  }
}

function savePaymentsDb(db: PaymentsDatabase) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    db.lastUpdated = new Date().toISOString();
    db.totalRevenueInr = db.payments
      .filter((p) => p.status === 'captured')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('Failed to save payments db:', err);
  }
}

// Ensure server data directory and file exist
function loadTrackingDb(): TrackingDatabase {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(TRACKING_FILE)) {
      const initial: TrackingDatabase = { users: {}, lastUpdated: new Date().toISOString() };
      fs.writeFileSync(TRACKING_FILE, JSON.stringify(initial, null, 2));
      return initial;
    }
    const raw = fs.readFileSync(TRACKING_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load tracking db:', err);
    return { users: {}, lastUpdated: new Date().toISOString() };
  }
}

function saveTrackingDb(db: TrackingDatabase) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    db.lastUpdated = new Date().toISOString();
    fs.writeFileSync(TRACKING_FILE, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('Failed to save tracking db:', err);
  }
}

// Validate admin access (strictly private to the owner)
function isAuthorizedAdmin(req: express.Request): boolean {
  const adminKey = req.headers['x-admin-key'] || req.query.adminKey;
  const userEmail = (req.headers['x-user-email'] as string || req.query.userEmail as string || '').toLowerCase().trim();

  if (adminKey === ADMIN_SECRET_KEY) return true;
  if (userEmail === OWNER_EMAIL.toLowerCase()) return true;
  return false;
}

/**
 * 1. Track User Login (Server-Side)
 * Called every time a user logs in or initializes a session
 */
app.post('/api/track/login', (req, res) => {
  try {
    const { id, name, email, stream, targetExam, provider, avatar } = req.body;
    if (!id || !email) {
      return res.status(400).json({ error: 'id and email are required' });
    }

    const db = loadTrackingDb();
    const cleanId = String(id).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const ip = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1').split(',')[0].trim();
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const now = new Date().toISOString();

    if (!db.users[cleanId]) {
      // First-time login registration
      db.users[cleanId] = {
        id: cleanId,
        name: name || 'Student',
        email: cleanEmail,
        stream: stream || 'science',
        targetExam: targetExam || '',
        provider: provider || 'email',
        avatar: avatar || '',
        firstLoginAt: now,
        lastLoginAt: now,
        totalLogins: 1,
        lastIp: ip,
        lastUserAgent: userAgent,
        totalFocusMinutes: 0,
        totalSessions: 0,
        averageFocusScore: 0,
        latestFocusScore: 0,
        highestFocusScore: 0,
        sessions: [],
      };
    } else {
      // Returning user login
      const existing = db.users[cleanId];
      existing.name = name || existing.name;
      existing.email = cleanEmail;
      existing.stream = stream || existing.stream;
      existing.targetExam = targetExam || existing.targetExam;
      existing.avatar = avatar || existing.avatar;
      existing.lastLoginAt = now;
      existing.totalLogins = (existing.totalLogins || 0) + 1;
      existing.lastIp = ip;
      existing.lastUserAgent = userAgent;
    }

    saveTrackingDb(db);
    res.json({ success: true, message: 'Login tracked on server', userId: cleanId });
  } catch (err: any) {
    console.error('Error tracking login:', err);
    res.status(500).json({ error: 'Internal server error tracking login' });
  }
});

/**
 * 2. Track Study Session & Focus Score (Server-Side)
 * Called every time a user completes a focus session
 */
app.post('/api/track/session', (req, res) => {
  try {
    const { userId, session } = req.body;
    if (!userId || !session || typeof session.focusScore !== 'number') {
      return res.status(400).json({ error: 'userId and valid session object with focusScore are required' });
    }

    const db = loadTrackingDb();
    const cleanId = String(userId).trim();
    const user = db.users[cleanId];

    if (!user) {
      return res.status(404).json({ error: 'User not found in server tracking database' });
    }

    const durationSec = Number(session.durationSeconds) || 0;
    const focusedSec = Number(session.focusedSeconds) || durationSec;
    const focusScore = Math.min(100, Math.max(0, Math.round(session.focusScore)));
    const distractionEvents = Array.isArray(session.distractionEvents) ? session.distractionEvents.length : 0;

    const summary: TrackedSessionSummary = {
      id: session.id || `ses_${Date.now()}`,
      startTime: session.startTime || Date.now(),
      durationSeconds: durationSec,
      focusedSeconds: focusedSec,
      focusScore,
      stream: session.stream || user.stream || 'science',
      subject: session.subject || 'General Study',
      subTopic: session.subTopic || '',
      distractionCount: distractionEvents,
      completedAt: new Date().toISOString(),
    };

    user.sessions = user.sessions || [];
    user.sessions.unshift(summary);

    // Limit kept session summaries per user to prevent unbounded storage
    if (user.sessions.length > 50) {
      user.sessions = user.sessions.slice(0, 50);
    }

    // Recalculate metrics
    user.totalSessions = user.sessions.length;
    user.totalFocusMinutes = Math.round(
      user.sessions.reduce((acc, s) => acc + (s.focusedSeconds || s.durationSeconds || 0), 0) / 60
    );

    const totalScores = user.sessions.reduce((acc, s) => acc + s.focusScore, 0);
    user.averageFocusScore = Math.round(totalScores / user.sessions.length);
    user.latestFocusScore = focusScore;
    user.highestFocusScore = Math.max(user.highestFocusScore || 0, focusScore);

    saveTrackingDb(db);
    res.json({
      success: true,
      message: 'Focus session recorded on server',
      averageFocusScore: user.averageFocusScore,
      totalSessions: user.totalSessions,
    });
  } catch (err: any) {
    console.error('Error tracking session:', err);
    res.status(500).json({ error: 'Internal server error tracking session' });
  }
});

/**
 * 3. Private Owner Admin Dashboard Data (STRICTLY FOR OWNER / NOT PUBLIC)
 * Returns all tracked students, their logins, and their exact focus scores
 */
app.get('/api/admin/tracked-users', (req, res) => {
  if (!isAuthorizedAdmin(req)) {
    return res.status(403).json({
      error: 'Access Denied: This server oversight portal is private and restricted to the site owner.',
    });
  }

  try {
    const db = loadTrackingDb();
    const usersList = Object.values(db.users);

    // Sort by last login (most recent first)
    usersList.sort((a, b) => new Date(b.lastLoginAt).getTime() - new Date(a.lastLoginAt).getTime());

    // Aggregate overview stats
    const totalUsers = usersList.length;
    const totalSessions = usersList.reduce((acc, u) => acc + (u.totalSessions || 0), 0);
    const totalFocusMinutes = usersList.reduce((acc, u) => acc + (u.totalFocusMinutes || 0), 0);
    
    // Calculate global average focus score across all users with at least 1 session
    const usersWithSessions = usersList.filter(u => (u.totalSessions || 0) > 0);
    const platformAvgFocusScore = usersWithSessions.length > 0
      ? Math.round(usersWithSessions.reduce((acc, u) => acc + (u.averageFocusScore || 0), 0) / usersWithSessions.length)
      : 0;

    // Count active in last 24h
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const activeToday = usersList.filter(u => new Date(u.lastLoginAt).getTime() > oneDayAgo).length;

    res.json({
      success: true,
      ownerEmail: OWNER_EMAIL,
      summary: {
        totalUsers,
        totalSessions,
        totalFocusMinutes,
        totalFocusHours: Math.round(totalFocusMinutes / 60),
        platformAvgFocusScore,
        activeToday,
        lastUpdated: db.lastUpdated,
      },
      users: usersList,
    });
  } catch (err: any) {
    console.error('Error in /api/admin/tracked-users:', err);
    res.status(500).json({ error: 'Internal server error fetching tracked users' });
  }
});

/**
 * 4. Private User Session Deep Dive
 */
app.get('/api/admin/user/:userId/sessions', (req, res) => {
  if (!isAuthorizedAdmin(req)) {
    return res.status(403).json({ error: 'Access Denied: Private owner endpoint.' });
  }

  try {
    const db = loadTrackingDb();
    const user = db.users[req.params.userId];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        stream: user.stream,
        averageFocusScore: user.averageFocusScore,
        totalFocusMinutes: user.totalFocusMinutes,
      },
      sessions: user.sessions || [],
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Internal error' });
  }
});

/**
 * 5. Export Tracking Data as JSON / CSV
 */
app.get('/api/admin/export', (req, res) => {
  if (!isAuthorizedAdmin(req)) {
    return res.status(403).json({ error: 'Access Denied' });
  }

  const format = req.query.format === 'csv' ? 'csv' : 'json';
  const db = loadTrackingDb();
  const users = Object.values(db.users);

  if (format === 'csv') {
    const headers = ['ID', 'Name', 'Email', 'Stream', 'TargetExam', 'FirstLogin', 'LastLogin', 'TotalLogins', 'AvgFocusScore', 'LatestFocusScore', 'TotalSessions', 'TotalFocusMins'];
    const rows = users.map(u => [
      `"${u.id}"`,
      `"${u.name.replace(/"/g, '""')}"`,
      `"${u.email}"`,
      `"${u.stream}"`,
      `"${(u.targetExam || '').replace(/"/g, '""')}"`,
      `"${u.firstLoginAt}"`,
      `"${u.lastLoginAt}"`,
      u.totalLogins,
      u.averageFocusScore,
      u.latestFocusScore,
      u.totalSessions,
      u.totalFocusMinutes,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="focura_user_tracking.csv"');
    return res.send(csvContent);
  }

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="focura_user_tracking.json"');
  res.json(db);
});

// ============================================================================
// RAZORPAY INTEGRATION & AUTO-ACTIVATION ENDPOINTS
// ============================================================================

/**
 * 6. Get Razorpay Public Config
 * Used by frontend to determine whether live Razorpay checkout is configured
 */
app.get('/api/razorpay/config', (req, res) => {
  const keyId = process.env.RAZORPAY_KEY_ID || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
  const isConfigured = Boolean(keyId.trim() && keySecret.trim());
  const isLive = keyId.startsWith('rzp_live_');

  res.json({
    isConfigured,
    isLive,
    keyId: keyId || null,
    businessName: 'Focura Smart Study',
    description: 'AI Focus Platform & Study Mastery',
    themeColor: '#f59e0b',
    settlementOwner: OWNER_EMAIL,
    currency: 'INR',
  });
});

/**
 * 7. Create Razorpay Order
 * Calls official Razorpay Orders API if keys are provided,
 * or generates simulated test order so user can test immediate plan activation!
 */
app.post('/api/razorpay/create-order', async (req, res) => {
  try {
    const { plan, amount, currency = 'INR', userId, userEmail, userName } = req.body;
    if (!plan || !amount) {
      return res.status(400).json({ error: 'plan and amount are required' });
    }

    const keyId = process.env.RAZORPAY_KEY_ID?.trim();
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
    const amountInPaise = Math.round(Number(amount) * 100);

    // If live/test Razorpay API credentials exist in environment
    if (keyId && keySecret) {
      const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${basicAuth}`,
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: (currency || 'INR').toUpperCase(),
          receipt: `rcpt_${Date.now().toString(36)}`,
          notes: {
            userId: userId || 'student',
            userEmail: userEmail || '',
            userName: userName || 'Student',
            plan,
            platform: 'Focura',
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Razorpay Order API error:', errorText);
        return res.status(response.status).json({
          error: 'Razorpay failed to create order',
          details: errorText,
        });
      }

      const orderData = await response.json();
      return res.json({
        success: true,
        orderId: orderData.id,
        amount: orderData.amount,
        currency: orderData.currency,
        keyId,
        isLive: keyId.startsWith('rzp_live_'),
        isSandbox: false,
      });
    }

    // Interactive Demo / Sandbox Mode (Key Pending)
    // Allows testing plan activation immediately while waiting for keys
    const mockOrderId = `order_test_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    return res.json({
      success: true,
      orderId: mockOrderId,
      amount: amountInPaise,
      currency: 'INR',
      keyId: 'rzp_test_placeholder',
      isSandbox: true,
      message: 'Running in simulated Razorpay test mode. Provide RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET in .env to receive real payments in your bank account.',
    });
  } catch (err: any) {
    console.error('Error creating Razorpay order:', err);
    res.status(500).json({ error: 'Internal server error creating Razorpay order' });
  }
});

/**
 * 8. Verify Payment & Automatically Activate Plan
 * Validates HMAC SHA-256 signature and activates the student's subscription
 */
app.post('/api/razorpay/verify-payment', (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan,
      amount,
      userId,
      userEmail,
      userName,
    } = req.body;

    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
    let isSignatureValid = false;

    if (keySecret && razorpay_signature && razorpay_order_id && razorpay_payment_id) {
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      isSignatureValid = expectedSignature === razorpay_signature;

      if (!isSignatureValid) {
        return res.status(400).json({
          error: 'Invalid payment signature. Verification failed.',
        });
      }
    } else {
      // In sandbox/test mode
      isSignatureValid = true;
    }

    const cleanAmount = Number(amount) || (plan === 'ultra_premium' ? 599 : 299);
    const paymentId = razorpay_payment_id || `pay_test_${Date.now().toString(36)}`;
    const orderId = razorpay_order_id || `order_test_${Date.now().toString(36)}`;
    const now = new Date().toISOString();
    const isSandbox = !Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

    // 1. Record payment in server payments database
    const paymentsDb = loadPaymentsDb();
    const paymentRecord: PaymentRecord = {
      id: paymentId,
      orderId,
      paymentId,
      signature: razorpay_signature || 'test_signature',
      userId: userId || 'student',
      userName: userName || 'Student',
      userEmail: (userEmail || '').toLowerCase(),
      plan: plan || 'premium',
      amount: cleanAmount,
      currency: 'INR',
      status: 'captured',
      method: 'Razorpay UPI / Cards / NetBanking',
      createdAt: now,
      verified: isSignatureValid,
      isSandbox,
    };
    paymentsDb.payments.unshift(paymentRecord);
    savePaymentsDb(paymentsDb);

    // 2. Automatically update user subscription on backend server tracking
    const trackingDb = loadTrackingDb();
    if (userId && trackingDb.users[userId]) {
      const user = trackingDb.users[userId];
      (user as any).subscription = {
        plan,
        status: 'active',
        isDemo: isSandbox,
        activatedAt: now,
        demoOrderId: orderId,
        paymentMethod: `Razorpay (${paymentId})`,
        amountPaid: cleanAmount,
        razorpayPaymentId: paymentId,
        razorpayOrderId: orderId,
      };
      saveTrackingDb(trackingDb);
    }

    res.json({
      success: true,
      verified: true,
      message: `Payment successful! ${plan === 'ultra_premium' ? 'Ultra Master' : 'Focus Pro'} plan is now active.`,
      plan,
      paymentId,
      orderId,
      amount: cleanAmount,
      activatedAt: now,
      isSandbox,
    });
  } catch (err: any) {
    console.error('Error verifying Razorpay payment:', err);
    res.status(500).json({ error: 'Internal server error verifying payment' });
  }
});

/**
 * 9. Private Owner Earnings & Payment History (Server Portal Only)
 */
app.get('/api/admin/payments', (req, res) => {
  if (!isAuthorizedAdmin(req)) {
    return res.status(403).json({
      error: 'Access Denied: Private owner revenue portal.',
    });
  }

  try {
    const db = loadPaymentsDb();
    const keyId = process.env.RAZORPAY_KEY_ID?.trim();
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
    const isConfigured = Boolean(keyId && keySecret);

    res.json({
      success: true,
      isConfigured,
      isLive: Boolean(keyId && keyId.startsWith('rzp_live_')),
      keyIdPreview: keyId ? `${keyId.substring(0, 8)}...` : null,
      totalRevenueInr: db.totalRevenueInr,
      totalPaymentsCount: db.payments.length,
      payments: db.payments,
      lastUpdated: db.lastUpdated,
    });
  } catch (err: any) {
    console.error('Error in /api/admin/payments:', err);
    res.status(500).json({ error: 'Internal server error fetching payments' });
  }
});

/**
 * 10. Standalone Server Website Route
 * Serves the completely separate owner telemetry portal at /server and /admin
 * Completely isolated from the student website
 */
app.get(['/server', '/server/*', '/admin', '/admin/*'], (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'server-dashboard.html'));
});

// Initialize GoogleGenAI client with resilient key detection
function getAIClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
  if (!key) return null;
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Helper to generate content with resilient fallback across verified active Gemini models
async function generateContentWithFallback(
  aiClient: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
  }
) {
  // Try gemini-3.8-flash first, then fast high-capacity gemini-3.1-flash-lite, then gemini-3.1-pro-preview
  const models = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-3.1-pro-preview'];
  let lastErr: any = null;

  for (const model of models) {
    try {
      const response = await aiClient.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      return response;
    } catch (err: any) {
      console.warn(`[Gemini Engine] Model ${model} failed, attempting next available model. Error:`, err?.message || err);
      lastErr = err;
    }
  }
  throw lastErr;
}

/**
 * AI Study Coach API Endpoint - Answers ANY Academic, Conceptual, or Exam Question
 */
app.post('/api/ai/coach', async (req, res) => {
  try {
    const { messages, userProfile, studyStats } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const aiClient = getAIClient();

    const systemPrompt = `You are "Focura AI Academic Coach & Universal Knowledge Mentor" — an elite educator, polymath, and competitive entrance exam specialist.

PRIME DIRECTIVE:
You MUST answer ANY question the student asks directly, thoroughly, and with academic rigor.
Whether the student asks:
- A STEM problem, derivation, equation, or concept (Physics, Chemistry, Mathematics, Biology, Computer Science, Engineering)
- A Commerce / Humanities question (Economics, Accountancy, Business, Law, History, Political Science, Philosophy, Literature)
- A Competitive Entrance Exam question or problem (JEE Main & Advanced, NEET UG, CBSE, CA Foundation, UPSC, etc.)
- A homework question, numerical calculation, formula derivation, or logic puzzle
- A study schedule, revision routine, or cognitive focus advice
- Any general inquiry or discussion

HOW TO ANSWER:
1. ANSWER THE EXACT QUESTION DIRECTLY:
   - Provide the answer immediately in the first paragraph.
   - If the student asks an academic concept or question (e.g. "What is momentum?", "Explain Carnot cycle", "Derive E=mc^2", "How does photosynthesis work?", "What is GDP?", "Solve 3x + 5 = 20"), explain it accurately from first principles. NEVER deflect, give vague self-help evasions, or convert an academic question into an irrelevant lecture about phone habits.
2. ACCURATE EQUATIONS AND MATHEMATICAL RIGOR:
   - Make all equations, formulas, chemical reactions, and dimensional units strictly accurate.
   - Use clean, standard notation (e.g., F = m * a, p = m * v, Delta G = Delta H - T * Delta S, int_a^b f(x) dx, tau = I * alpha).
   - If solving a numerical problem, show every step of algebraic manipulation, calculation, and correct SI units.
3. STRICT ZERO EMOJI POLICY:
   - Absolutely NO emojis under any circumstances (no stars, rockets, books, smileys, symbols, etc.). Maintain a clean, sophisticated, intellectual, and professional academic tone.
4. STUDENT CONTEXT (USE ONLY WHEN RELEVANT):
   - Student Name: ${userProfile?.name || 'Student'}
   - Academic Stream: ${userProfile?.stream?.toUpperCase() || 'SCIENCE'}
   - Target Examination: ${userProfile?.targetExam || 'Competitive Exam'}
   - Only reference their target exam or focus statistics if the student is explicitly asking for personalized study advice, exam strategy, or schedule optimization.`;

    if (!aiClient) {
      // Intelligent offline fallback response if API key is absent
      const lastUserMsg = messages[messages.length - 1]?.content || '';
      return res.json({
        reply: `### Academic Solution & Guidance\n\nRegarding: "${lastUserMsg}"\n\nTo address this with precision:\n1. Core Scientific & Conceptual Principle: Identify the governing physical or mathematical laws and establish boundary conditions.\n2. Mathematical Precision: Ensure all terms, constants, and algebraic signs are balanced.\n3. Application to ${userProfile?.targetExam || 'Competitive Examinations'}: Solve standard textbook cases first before transitioning to multi-step numericals.\n\nPlease configure your Gemini API key in the environment to unlock full real-time AI derivations and universal question answering.`,
      });
    }

    // Format chat contents for Gemini API:
    // Gemini multi-turn conversation must begin with a user turn and alternate.
    const contents: any[] = [];
    let startedWithUser = false;

    for (const msg of messages) {
      if (!startedWithUser && msg.role !== 'user') {
        continue; // skip leading model greeting
      }
      startedWithUser = true;
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      });
    }

    // Ensure at least one user content is present
    if (contents.length === 0) {
      const fallbackPrompt = messages[messages.length - 1]?.content || 'Hello';
      contents.push({
        role: 'user',
        parts: [{ text: fallbackPrompt }],
      });
    }

    const response = await generateContentWithFallback(aiClient, {
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.6,
      },
    });

    // Strip any residual emojis just in case
    let replyText = response.text || 'I am ready to help you solve and understand any academic question.';
    replyText = replyText.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
    res.json({ reply: replyText });
  } catch (error: any) {
    console.error('Error in /api/ai/coach:', error);
    res.status(500).json({
      error: 'Failed to generate coaching response',
      details: error.message,
    });
  }
});

/**
 * AI Quiz Generator Endpoint - Trained on JEE, NEET, Boards, and Competitive Exam Patterns
 */
app.post('/api/ai/quiz', async (req, res) => {
  try {
    const {
      subject,
      topic,
      stream,
      examPattern = 'JEE Main & Advanced',
      difficulty = 'medium',
      questionCount = 5,
      randomSeed = Math.random().toString(36).substring(7),
    } = req.body;

    const count = Math.max(1, Math.min(10, Number(questionCount) || 5));
    const targetSubject = (subject || 'Physics').trim();
    const targetTopic = (topic || 'Core Chapter Concepts').trim();
    const targetPattern = (examPattern || 'JEE Main & Advanced').trim();
    const aiClient = getAIClient();

    if (!aiClient) {
      // Offline fallback quiz with real academic questions
      const fallbackQuestions = [
        {
          id: 'q1',
          examTag: `[${targetPattern}]`,
          question: `In ${targetSubject} (${targetTopic}), consider a uniform rigid body of mass M and radius R. What is the ratio of rotational kinetic energy to total kinetic energy for a solid sphere rolling without slipping on a horizontal surface?`,
          options: [
            '2/7',
            '5/7',
            '1/2',
            '2/5',
          ],
          correctIndex: 0,
          explanation: 'For a solid sphere, moment of inertia I = (2/5) M R^2. Total kinetic energy K_total = K_trans + K_rot = (1/2) M v^2 + (1/2) I omega^2. Since v = R omega, K_rot = (1/2)(2/5 M R^2)(v/R)^2 = (1/5) M v^2. Thus K_total = (1/2 + 1/5) M v^2 = (7/10) M v^2. The ratio K_rot / K_total = (1/5) / (7/10) = 2/7.',
        },
        {
          id: 'q2',
          examTag: `[${targetPattern}]`,
          question: `For a particle executing simple harmonic motion with amplitude A and angular frequency omega, at what displacement x from the mean position is the kinetic energy equal to three times the potential energy?`,
          options: [
            'x = A / 2',
            'x = A / sqrt(2)',
            'x = A / 4',
            'x = (A * sqrt(3)) / 2',
          ],
          correctIndex: 0,
          explanation: 'Potential energy U = (1/2) m omega^2 x^2. Kinetic energy K = (1/2) m omega^2 (A^2 - x^2). Setting K = 3U gives (1/2) m omega^2 (A^2 - x^2) = 3 * (1/2) m omega^2 x^2, leading to A^2 - x^2 = 3 x^2, or 4 x^2 = A^2. Hence, x = A / 2.',
        },
      ];

      return res.json({
        title: `${targetSubject} (${targetTopic}) - ${targetPattern} Practice Quiz`,
        subject: targetSubject,
        topic: targetTopic,
        examPattern: targetPattern,
        questions: fallbackQuestions.slice(0, count),
      });
    }

    const systemInstruction = `You are the Chief Academic Examination Architect and Question Paper Setter for premier competitive entrance exams:
- JEE Main & JEE Advanced (Physics, Chemistry, Mathematics)
- NEET UG (Biology, Chemistry, Physics)
- CBSE & State Board Standards (NCERT aligned)
- CA Foundation & Commerce Entrances (Accountancy, Economics, Mercantile Law)
- UPSC & Competitive General Examinations

CRITICAL MANDATORY RULES:
1. TEST ACTUAL CHAPTER CONTENT AND NUMERICALS, NOT STUDY STRATEGY:
   Every single question must directly test the academic subject matter, laws, equations, numerical problems, reactions, or theorems of the specific chapter "${targetTopic}" in "${targetSubject}".
   NEVER ask meta-questions about "how to study", "spaced repetition", "error notebooks", "revision technique", or "exam mindset". Questions must be genuine academic test problems found in real exam question papers.
2. ACCURATE EQUATIONS AND FORMULAS:
   Ensure all mathematical, physical, and chemical equations are strictly accurate. Use clean, clear mathematical text notation (e.g. I = (1/2) M R^2, tau = r x F = I alpha, Delta H = Delta U + P Delta V, integral_0^pi sin(x) dx = 2, k = (0.693 / t_{1/2})). Double check all algebraic steps and signs in options and explanations.
3. STRICT ZERO EMOJI POLICY:
   Do NOT include any emojis anywhere in questions, options, tags, or explanations.`;

    const examSpecificGuidance = targetPattern.includes('JEE')
      ? `JEE MAIN & ADVANCED GUIDELINES:
- Focus on conceptual rigor, mathematical formulation, graph analysis, numerical constraints, and multi-step derivations.
- Formulate realistic distractors based on common student calculation slips, sign mistakes, or wrong boundary values.
- Include an examTag like "[JEE Main Pattern]" or "[JEE Advanced]".`
      : targetPattern.includes('NEET')
      ? `NEET UG GUIDELINES:
- Deeply aligned with NCERT textbook concepts (line-by-line factual and conceptual precision in Physics, Chemistry, and Biology).
- Include biological pathways, physiological constants, or chemical reaction conditions.
- Include an examTag like "[NEET UG NCERT]" or "[NEET Assertion-Reason]".`
      : targetPattern.includes('Board')
      ? `BOARD EXAM GUIDELINES:
- Direct concept verification, definition application, derivation logic, and standard NCERT numericals.
- Include an examTag like "[Board Standard]".`
      : targetPattern.includes('CA') || targetPattern.includes('Commerce')
      ? `COMMERCE / CA GUIDELINES:
- Practical problems in accounting standards, journal debit/credit principles, economic elasticity, or contract laws.
- Include an examTag like "[CA Foundation Standard]".`
      : `COMPETITIVE EXAM GUIDELINES:
- Analytical problem solving, logical evaluation, and high-order academic thinking.
- Include an examTag like "[Competitive Exam Standard]".`;

    const userPrompt = `Generate an authentic academic practice test for the specific chapter "${targetTopic}" in "${targetSubject}":
- Target Subject: ${targetSubject}
- Specific Chapter / Topic: "${targetTopic}"
- Exam Pattern: ${targetPattern}
- Academic Stream: ${stream || 'Science'}
- Difficulty Level: ${difficulty}
- Total Questions: exactly ${count}
- Randomization Hash: ${randomSeed}

${examSpecificGuidance}

REQUIREMENTS:
1. Provide exactly ${count} questions testing the specific concepts/problems of "${targetTopic}".
2. For each question:
   - "id": a unique string (e.g. "q_1", "q_2")
   - "examTag": short badge string (e.g. "[JEE Main]", "[NEET UG]")
   - "question": clear, complete academic question statement with given numerical values or physical scenarios
   - "options": exactly 4 distinct, plausible options (array of 4 strings)
   - "correctIndex": integer 0, 1, 2, or 3 pointing to the correct option
   - "explanation": complete step-by-step mathematical derivation or scientific rationale showing all formulas, calculations, and units.
3. No emojis.

Output purely valid JSON conforming to this structure:
{
  "title": "${targetSubject} (${targetTopic}) - ${targetPattern} Practice Quiz",
  "subject": "${targetSubject}",
  "topic": "${targetTopic}",
  "examPattern": "${targetPattern}",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "id": "q_1",
      "examTag": "[JEE Main]",
      "question": "Question statement...",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "Step-by-step derivation..."
    }
  ]
}`;

    const response = await generateContentWithFallback(aiClient, {
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.75,
      },
    });

    let rawText = response.text || '';
    rawText = rawText.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
    rawText = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      const start = rawText.indexOf('{');
      const end = rawText.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        parsed = JSON.parse(rawText.substring(start, end + 1));
      } else {
        throw new Error('Failed to parse quiz response');
      }
    }

    if (!parsed || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      throw new Error('Invalid quiz format received');
    }

    // Sanitize and ensure format
    parsed.title = parsed.title || `${targetSubject} (${targetTopic}) - ${targetPattern} Practice Quiz`;
    parsed.subject = parsed.subject || targetSubject;
    parsed.topic = parsed.topic || targetTopic;
    parsed.examPattern = parsed.examPattern || targetPattern;
    parsed.difficulty = parsed.difficulty || difficulty;
    parsed.questions = parsed.questions.map((q: any, i: number) => ({
      id: q.id || `q_${i + 1}`,
      examTag: q.examTag || `[${targetPattern}]`,
      question: q.question || `Question ${i + 1}`,
      options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
      correctIndex: typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex < (q.options?.length || 4) ? q.correctIndex : 0,
      explanation: q.explanation || 'Review core chapter principles for complete derivation.',
    }));

    res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/ai/quiz:', error);

    const targetSubject = (req.body?.subject || 'Physics').trim();
    const targetTopic = (req.body?.topic || 'Core Chapter Concepts').trim();
    const targetPattern = (req.body?.examPattern || 'JEE Main & Advanced').trim();

    res.json({
      title: `${targetSubject} (${targetTopic}) - ${targetPattern} Practice Quiz`,
      subject: targetSubject,
      topic: targetTopic,
      examPattern: targetPattern,
      questions: [
        {
          id: 'fb_1',
          examTag: `[${targetPattern}]`,
          question: `In ${targetSubject} (${targetTopic}), consider a uniform solid cylinder of mass M and radius R rolling without slipping on a horizontal plane with velocity v. What is its total kinetic energy?`,
          options: [
            '(3/4) M v^2',
            '(1/2) M v^2',
            '(2/3) M v^2',
            'M v^2',
          ],
          correctIndex: 0,
          explanation: 'Moment of inertia of a solid cylinder about its central axis is I = (1/2) M R^2. Total kinetic energy K = K_trans + K_rot = (1/2) M v^2 + (1/2) I omega^2. Since omega = v/R, K_rot = (1/2)(1/2 M R^2)(v/R)^2 = (1/4) M v^2. Total K = (1/2 + 1/4) M v^2 = (3/4) M v^2.',
        },
        {
          id: 'fb_2',
          examTag: `[${targetPattern}]`,
          question: `For a thermodynamic system undergoing an isothermal expansion from volume V_1 to V_2 at absolute temperature T, what is the work done W by 1 mole of an ideal gas?`,
          options: [
            'W = R T ln(V_2 / V_1)',
            'W = R (T_2 - T_1) / (gamma - 1)',
            'W = P (V_2 - V_1)',
            'W = 0',
          ],
          correctIndex: 0,
          explanation: 'For an isothermal process, T is constant and P = RT / V. Work done W = integral_{V_1}^{V_2} P dV = integral_{V_1}^{V_2} (RT / V) dV = R T ln(V_2 / V_1).',
        },
      ],
    });
  }
});


// Mount Vite middleware in development or serve static in production
async function startServer() {
  const httpServer = http.createServer(app);

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Focura Fullstack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
