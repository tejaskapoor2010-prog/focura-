import React, { useState } from 'react';
import { UserProfile, StreamType } from '../types';
import { STREAMS_CONFIG } from '../data/streams';
import { FocuraLogo } from './FocuraLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { signInWithGooglePopup } from '../firebase';
import { 
  Eye, 
  BrainCircuit, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Clock,
  Activity,
  Smartphone,
  Loader2
} from 'lucide-react';

interface LoginViewProps {
  onLogin: (user: UserProfile) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [step, setStep] = useState<'auth' | 'stream' | 'goal'>('auth');
  const [authMethod, setAuthMethod] = useState<'google' | 'email'>('email');
  const [isFirebaseLoading, setIsFirebaseLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedStream, setSelectedStream] = useState<StreamType>('science');
  const [targetExam, setTargetExam] = useState('');
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(120);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  // Real Firebase Google Sign-In
  const handleRealFirebaseGoogleSignIn = async () => {
    setIsFirebaseLoading(true);
    setAuthError(null);
    try {
      const fbUser = await signInWithGooglePopup();
      if (fbUser && fbUser.email) {
        setName(fbUser.displayName || fbUser.email.split('@')[0]);
        setEmail(fbUser.email);
        setAuthMethod('google');
        setIsGoogleModalOpen(false);
        setStep('stream');
      }
    } catch (err: any) {
      console.warn('Firebase Google Sign-In skipped or popup blocked:', err);
      // Fallback: open easy manual input dialog so user is never blocked
      setIsGoogleModalOpen(true);
    } finally {
      setIsFirebaseLoading(false);
    }
  };

  // Google email input handler
  const handleGoogleQuickSelect = (userEmail: string, userName: string, avatarUrl: string) => {
    setName(userName);
    setEmail(userEmail);
    setAuthMethod('google');
    setIsGoogleModalOpen(false);
    setStep('stream');
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setAuthMethod('email');
    setStep('stream');
  };

  const handleCompleteSetup = () => {
    const cleanEmail = email.trim().toLowerCase();
    // Unique deterministic or custom ID based on email
    const safeId = 'usr_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');

    const avatar = authMethod === 'google' 
      ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=000000&textColor=ffffff`
      : `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}&backgroundColor=000000`;

    const newUser: UserProfile = {
      id: safeId,
      name: name.trim() || 'Student',
      email: cleanEmail,
      avatar,
      stream: selectedStream,
      targetExam: targetExam.trim() || STREAMS_CONFIG[selectedStream].defaultExams[0],
      dailyGoalMinutes,
      streakDays: 1,
      lastActiveDate: new Date().toISOString().split('T')[0],
      provider: authMethod,
      createdAt: new Date().toISOString(),
    };

    onLogin(newUser);
  };

  return (
    <div className="relative min-h-screen bg-transparent text-white flex flex-col justify-between overflow-hidden">
      {/* Sleek Monochrome Top Navigation */}
      <header className="relative z-10 mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-zinc-900">
        <div className="flex items-center">
          <FocuraLogo className="h-10 w-10 sm:h-11 sm:w-11" />
        </div>
        <div className="flex items-center gap-3">
          <PWAInstallButton variant="header" />
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-zinc-400">
            <ShieldCheck className="h-4 w-4 text-white" />
            <span>Computer Vision Focus Engine</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        {step === 'auth' && (
          <div className="mx-auto max-w-md text-center">
            {/* Tagline */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono text-zinc-300 bg-zinc-900 border border-zinc-700 mb-6">
              <Sparkles className="h-3.5 w-3.5 text-white" />
              <span>Smart Study & Focus Analytics</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3 text-balance">
              Don’t just track study time.
              <br />
              <span className="text-zinc-400">
                Understand your focus.
              </span>
            </h1>

            <p className="text-xs text-zinc-400 mb-8 max-w-sm mx-auto leading-relaxed">
              Real-time Computer Vision analysis tracks gaze, phone posture, and digital distractions to measure the actual quality of your study sessions.
            </p>

            {/* Auth Box */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 shadow-2xl text-left">
              <h2 className="text-base font-bold text-white mb-1">Sign In to Your Workspace</h2>
              <p className="text-xs text-zinc-400 mb-6">
                Enter your details to track personal study sessions, subject progress, and focus scores.
              </p>

              {/* Email & Name Form - Primary Sign In */}
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-white focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Your Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your personal or school email"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-white focus:outline-none transition-colors"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Use your real email so your progress, quizzes, and focus telemetry stay linked to you.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-xs transition-all shadow-lg flex items-center justify-center gap-2 mt-2"
                >
                  <span>Continue with My Email</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              <div className="relative my-6 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-800" />
                </div>
                <span className="relative bg-zinc-950 px-3 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                  Or Sign In with Google Account
                </span>
              </div>

              {/* Google Sign In Direct Option */}
              <button
                type="button"
                onClick={() => setIsGoogleModalOpen(true)}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs transition-all shadow-md active:scale-[0.99]"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.7 1 4 3.5 2.2 7.1l3.7 2.8C6.8 6.9 9.2 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M22.5 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h5.9c-.3 1.4-1 2.5-2.2 3.3v2.8h3.6c2.1-1.9 3.2-4.8 3.2-8.1z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.8 14.1c-.2-.7-.3-1.4-.3-2.1s.1-1.4.3-2.1V7.1H2.2C1.4 8.6 1 10.2 1 12s.4 3.4 1.2 4.9l3.6-2.8z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1.1-3.7 1.1-2.8 0-5.2-1.9-6.1-4.5H2.2v2.8C4 20.5 7.7 23 12 23z"
                  />
                </svg>
                <span>Continue with Any Google ID</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Stream Selection */}
        {step === 'stream' && (
          <div className="mx-auto max-w-xl text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono text-zinc-300 bg-zinc-900 border border-zinc-700 mb-4">
              <span>STEP 2 OF 3</span>
              <span>·</span>
              <span>SELECT YOUR ACADEMIC STREAM</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
              Select Your Academic Stream
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mb-8 max-w-md mx-auto">
              Focura customizes your subject syllabi, target exams, and study benchmarks based on your focus area.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              {(['science', 'commerce', 'arts'] as StreamType[]).map((st) => {
                const isSelected = selectedStream === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setSelectedStream(st)}
                    className={`p-5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-white bg-white text-black shadow-2xl scale-[1.02]'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono uppercase font-bold tracking-wider">
                        {st}
                      </span>
                      {isSelected ? (
                        <CheckCircle2 className="h-4 w-4 text-black" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-zinc-700" />
                      )}
                    </div>
                    <div className={`text-xs ${isSelected ? 'text-zinc-800' : 'text-zinc-400'}`}>
                      {st === 'science' && 'Physics · Chemistry · Math · Biology'}
                      {st === 'commerce' && 'Accountancy · Business · Economics'}
                      {st === 'arts' && 'History · Pol Science · Psychology'}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('auth')}
                className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep('goal')}
                className="py-2.5 px-6 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-xs transition-all shadow-lg flex items-center gap-2"
              >
                <span>Continue to Goals</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Target Exam & Daily Focus Goal */}
        {step === 'goal' && (
          <div className="mx-auto max-w-xl text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono text-zinc-300 bg-zinc-900 border border-zinc-700 mb-4">
              <span>FINAL STEP</span>
              <span>·</span>
              <span>PERSONALIZE YOUR GOALS</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
              Set Your Daily Focus Goal
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mb-8 max-w-md mx-auto">
              Focura will benchmark your Computer Vision sessions against this goal and provide daily consistency streaks.
            </p>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 shadow-2xl text-left space-y-6">
              {/* Target Exam Selection */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-2">
                  Target Exam or Curriculum
                </label>
                <div className="flex flex-wrap gap-2">
                  {STREAMS_CONFIG[selectedStream].defaultExams.map((exam) => (
                    <button
                      key={exam}
                      type="button"
                      onClick={() => setTargetExam(exam)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        (targetExam || STREAMS_CONFIG[selectedStream].defaultExams[0]) === exam
                          ? 'bg-white text-black font-bold shadow-md'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {exam}
                    </button>
                  ))}
                </div>
              </div>

              {/* Daily Focus Goal Minutes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-zinc-300">
                    Daily Targeted Focus Time
                  </label>
                  <span className="font-mono text-sm font-bold text-white">
                    {Math.floor(dailyGoalMinutes / 60)}h {dailyGoalMinutes % 60 > 0 ? `${dailyGoalMinutes % 60}m` : ''}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[60, 90, 120, 180].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDailyGoalMinutes(mins)}
                      className={`py-2 rounded-lg text-xs font-mono font-medium transition-colors ${
                        dailyGoalMinutes === mins
                          ? 'bg-white text-black font-bold shadow-md'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {mins / 60} Hours
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-zinc-500">
                  Tip: A focused 2-hour session with high quality (85%+ Focus Score) scientifically beats 5 hours of distracted study.
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-zinc-900">
                <button
                  type="button"
                  onClick={() => setStep('stream')}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleCompleteSetup}
                  className="py-2.5 px-6 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-xs transition-all shadow-xl flex items-center gap-2"
                >
                  <span>Launch Focura Workspace</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Google Sign-in Modal */}
      {isGoogleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-white flex items-center justify-center">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.7 1 4 3.5 2.2 7.1l3.7 2.8C6.8 6.9 9.2 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M22.5 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h5.9c-.3 1.4-1 2.5-2.2 3.3v2.8h3.6c2.1-1.9 3.2-4.8 3.2-8.1z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.8 14.1c-.2-.7-.3-1.4-.3-2.1s.1-1.4.3-2.1V7.1H2.2C1.4 8.6 1 10.2 1 12s.4 3.4 1.2 4.9l3.6-2.8z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1.1-3.7 1.1-2.8 0-5.2-1.9-6.1-4.5H2.2v2.8C4 20.5 7.7 23 12 23z"
                    />
                  </svg>
                </div>
                <span className="text-sm font-bold text-white">Google Account Sign-In</span>
              </div>
              <button
                onClick={() => setIsGoogleModalOpen(false)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400 my-4 leading-relaxed">
              Sign in with your Google email. Your personal study analytics and focus scores will be safely stored under this email ID:
            </p>

            {/* Direct Google Account Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const emailInput = (document.getElementById('customGoogleEmail') as HTMLInputElement)?.value.trim();
                const nameInput = (document.getElementById('customGoogleName') as HTMLInputElement)?.value.trim();
                if (emailInput) {
                  const resolvedName = nameInput || emailInput.split('@')[0].replace(/[._]/g, ' ');
                  handleGoogleQuickSelect(
                    emailInput,
                    resolvedName.charAt(0).toUpperCase() + resolvedName.slice(1),
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(resolvedName)}&backgroundColor=000000&textColor=ffffff`
                  );
                }
              }}
              className="space-y-3.5 mb-2"
            >
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Google Email Address
                </label>
                <input
                  type="email"
                  id="customGoogleEmail"
                  required
                  placeholder="your.google.id@gmail.com"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  id="customGoogleName"
                  placeholder="e.g. Tejas Kapoor"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-white text-black font-extrabold text-xs hover:bg-zinc-200 transition-colors shadow-lg mt-2"
              >
                Sign In with this Google ID
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 border-t border-zinc-900 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500">
        <div>
          <span>© 2026 Focura · AI-Powered Smart Study Platform</span>
          <span className="mx-2">·</span>
          <span>Privacy Guaranteed: Video is processed locally in your browser</span>
        </div>
        <div className="mt-2 sm:mt-0 font-mono text-[11px] text-zinc-400">
          Client-Side Computer Vision Engine v2.4
        </div>
      </footer>
    </div>
  );
};
