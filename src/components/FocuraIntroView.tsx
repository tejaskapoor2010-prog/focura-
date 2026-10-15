import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Crown, 
  ArrowRight, 
  ShieldCheck, 
  BrainCircuit, 
  Timer, 
  Eye, 
  EyeOff, 
  Camera, 
  Upload, 
  X, 
  Check, 
  Zap, 
  Lock, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Target, 
  BarChart3, 
  BookOpen, 
  Layers, 
  School, 
  GraduationCap, 
  Laptop, 
  Building2, 
  ChevronRight,
  TrendingUp,
  Cpu,
  Shield,
  HelpCircle,
  Lightbulb
} from 'lucide-react';
import BlackHole from '@/components/ui/black-hole';

interface FocuraIntroViewProps {
  onStartStudying: () => void;
  onOpenPricing?: () => void;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  title: string;
  bio: string;
  initials: string;
}

const STORAGE_KEY_TEAM_PHOTOS = 'focura_custom_team_photos';

export const FocuraIntroView: React.FC<FocuraIntroViewProps> = ({
  onStartStudying,
  onOpenPricing,
}) => {
  // Photo style option: 'black' (pure black placeholder - default) vs 'custom' (photos provided)
  const [photoStyle, setPhotoStyle] = useState<'black' | 'custom'>('black');
  const [activeBackground, setActiveBackground] = useState<boolean>(true);
  
  // Custom photos storage (for when user provides photos later)
  const [customPhotos, setCustomPhotos] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TEAM_PHOTOS);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Modal for providing / updating photo later
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [photoUrlInput, setPhotoUrlInput] = useState<string>('');
  const [photoFilePreview, setPhotoFilePreview] = useState<string | null>(null);

  // Active step in "How It Works"
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<number>(2);

  const team: TeamMember[] = [
    {
      id: 'tejas',
      name: 'Tejas Kapoor',
      role: 'CEO',
      title: 'Chief Executive Officer',
      initials: 'TK',
      bio: 'Leading Edge Computer Vision intelligence, client-side neural tracking, and the mathematical modeling of human focus.',
    },
    {
      id: 'sparsh',
      name: 'Sparsh Jain',
      role: 'CEO',
      title: 'Chief Executive Officer',
      initials: 'SJ',
      bio: 'Architecting product ergonomics, zero-distraction flow state systems, and intuitive cross-stream study workflows.',
    },
    {
      id: 'bakul',
      name: 'Bakul Arora',
      role: 'CFO',
      title: 'Chief Financial Officer',
      initials: 'BA',
      bio: 'Spearheading capital allocation, sustainable unit economics, student plan accessibility, and frictionless UPI payments.',
    },
  ];

  // Persist custom photos
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TEAM_PHOTOS, JSON.stringify(customPhotos));
    } catch {
      // Storage quota or disabled
    }
  }, [customPhotos]);

  const handleOpenPhotoModal = (member: TeamMember) => {
    setEditingMember(member);
    setPhotoUrlInput(customPhotos[member.id] || '');
    setPhotoFilePreview(null);
  };

  const handleSavePhoto = () => {
    if (!editingMember) return;
    const finalPhoto = photoFilePreview || photoUrlInput.trim();
    if (finalPhoto) {
      setCustomPhotos(prev => ({ ...prev, [editingMember.id]: finalPhoto }));
      setPhotoStyle('custom');
    } else {
      setCustomPhotos(prev => {
        const next = { ...prev };
        delete next[editingMember.id];
        return next;
      });
    }
    setEditingMember(null);
    setPhotoUrlInput('');
    setPhotoFilePreview(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoFilePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Workflow steps (Section 4)
  const workflowSteps = [
    {
      num: 1,
      title: 'Start Session',
      desc: 'Select your subject, set your target duration (Pomodoro or Custom Countdown), and grant one-click local camera permission.',
      tag: 'Step 01',
    },
    {
      num: 2,
      title: 'Focus Mode',
      desc: 'The study room activates full-screen dark atmosphere with ambient binaural soundscapes to silence digital noise.',
      tag: 'Step 02',
    },
    {
      num: 3,
      title: 'CV Analysis',
      desc: 'Proprietary Computer Vision monitors gaze orientation, reading alignment, and prolonged absences entirely in-browser.',
      tag: 'Core USP',
    },
    {
      num: 4,
      title: 'Focus Score',
      desc: 'Real-time mathematical synthesis generates an objective Focus Score reflecting actual time engaged vs. distracted.',
      tag: 'AI Metric',
    },
    {
      num: 5,
      title: 'Analytics',
      desc: 'Post-session diagnostic charts map your attention peaks, fatigue dips, and distraction triggers across subjects.',
      tag: 'Insights',
    },
    {
      num: 6,
      title: 'Improve',
      desc: 'Adaptive spaced repetition flashcards and AI coach suggestions recalibrate study intervals for compounding mastery.',
      tag: 'Result',
    },
  ];

  // 7 Key Features (Section 5)
  const keyFeatures = [
    {
      icon: Eye,
      title: 'Computer Vision Focus Detection',
      desc: 'Webcam-assisted gaze, head posture, and presence tracking running 100% locally with absolute privacy.',
      badge: '⭐ CORE USP',
      badgeColor: 'bg-amber-400/20 text-amber-300 border-amber-400/30',
    },
    {
      icon: TrendingUp,
      title: 'AI-Assisted Focus Score',
      desc: 'Dynamic quality metric synthesizing attention consistency rather than just measuring passive clock time.',
      badge: 'SCORING',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      icon: ShieldCheck,
      title: 'Distraction-Control Mode',
      desc: 'Integrated smartphone shields, audio soundscapes, and full-screen enforcement to preserve flow state.',
      badge: 'SHIELD',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    },
    {
      icon: BarChart3,
      title: 'Personal Productivity Analytics',
      desc: 'Granular focus timelines, daily streak calculations, and hourly distribution graphs for continuous self-audit.',
      badge: 'METRICS',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    },
    {
      icon: Layers,
      title: 'Subject-Wise Study Tracking',
      desc: 'Stream-specific curriculum organization for Science (JEE/NEET), Commerce, and Arts with custom units.',
      badge: 'SYLLABUS',
      badgeColor: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    },
    {
      icon: BookOpen,
      title: 'Revision Support',
      desc: 'Spaced repetition flashcard engines designed according to the Ebbinghaus forgetting curve for exam retention.',
      badge: 'RECALL',
      badgeColor: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    },
    {
      icon: Target,
      title: 'Personal Study Goals',
      desc: 'Daily minute targets, stream quotas, and streak milestones that transform raw effort into tangible results.',
      badge: 'GOALS',
      badgeColor: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    },
  ];

  // Target Users (Section 6)
  const targetUsers = [
    {
      icon: GraduationCap,
      title: 'School Students',
      target: 'Class 9–12 (CBSE / ICSE / State)',
      benefit: 'Eliminate smartphone interruptions, organize multi-subject homework, and build disciplined study habits early.',
    },
    {
      icon: Zap,
      title: 'Competitive Exam Aspirants',
      target: 'JEE Main & Adv / NEET / UPSC / CA',
      benefit: 'Sustain 8–10 hour deep work regimens with precise fatigue diagnostics and targeted revision cycles.',
    },
    {
      icon: Laptop,
      title: 'Online Learners',
      target: 'Self-Paced / Certifications / Coders',
      benefit: 'Prevent tab-switching fatigue and measure genuine engagement during video lectures and project coding.',
    },
    {
      icon: Building2,
      title: 'Schools & Coaching Institutes',
      target: 'Institutional Batches',
      benefit: 'Gain verified engagement metrics, student performance heatmaps, and aggregate batch attendance tracking.',
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full overflow-hidden bg-black text-white selection:bg-zinc-800 selection:text-white">
      {/* ========================================================= */}
      {/* Interactive Black Hole Cosmic Background */}
      {/* ========================================================= */}
      {activeBackground && (
        <div className="absolute inset-0 z-0 h-full w-full pointer-events-auto opacity-75">
          <BlackHole />
          {/* Subtle gradient vignette to keep text readable */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-radial from-transparent via-black/40 to-black pointer-events-none" />
        </div>
      )}

      {/* Main Content Container */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-20">
        
        {/* Top Floating Control Pill */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-800 bg-black/80 backdrop-blur-md text-zinc-300 font-mono">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-semibold">Focura Singularity Engine</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Background Canvas Toggle */}
            <button
              onClick={() => setActiveBackground(!activeBackground)}
              className="px-2.5 py-1.5 rounded-xl border border-zinc-800 bg-black/80 backdrop-blur-md text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 font-mono text-[11px]"
              title="Toggle Black Hole Visualizer"
            >
              {activeBackground ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              <span>{activeBackground ? 'Cosmos ON' : 'Cosmos OFF'}</span>
            </button>

            {/* Quick Get Started Button */}
            <button
              onClick={onStartStudying}
              className="px-4 py-1.5 rounded-xl bg-white text-black font-extrabold hover:bg-zinc-200 transition-all flex items-center gap-1.5 text-xs shadow-md active:scale-95 group"
            >
              <Timer className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
              <span>Get Started</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* HERO SECTION */}
        {/* ========================================================= */}
        <div className="text-center max-w-4xl mx-auto space-y-6 pt-2 sm:pt-6">
          {/* FOCURA in Capital Wordmark */}
          <div className="inline-flex items-center justify-center px-7 sm:px-10 py-3 sm:py-4 rounded-2xl border border-zinc-800 bg-black/90 backdrop-blur-md shadow-2xl mb-2 hover:border-zinc-700 transition-all">
            <span className="font-black text-3xl sm:text-4xl lg:text-5xl tracking-[0.25em] text-white selection:bg-white selection:text-black">
              FOCURA
            </span>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-zinc-800 bg-zinc-950/80 backdrop-blur-md text-xs font-mono text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-white">FOCURA</span>
            <span>·</span>
            <span>AI-Powered Smart Study & Focus Platform</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            “Don’t just track study time — <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              understand your focus.”
            </span>
          </h1>

          {/* One-Line Pitch */}
          <p className="text-sm sm:text-lg text-zinc-300 font-light leading-relaxed max-w-2xl mx-auto">
            Focura is an AI-powered study companion that uses Computer Vision to estimate focus during study sessions and help students <span className="text-white font-semibold underline decoration-zinc-600 underline-offset-4">study smarter, not just longer</span>.
          </p>

          {/* Primary Action Buttons */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3.5">
            <button
              onClick={onStartStudying}
              className="px-7 py-4 rounded-xl bg-white text-black font-black text-sm sm:text-base hover:bg-zinc-200 transition-all flex items-center gap-2.5 shadow-2xl shadow-white/10 active:scale-95 group"
            >
              <Timer className="h-5 w-5 transition-transform group-hover:scale-110" />
              <span>Get Started — Enter Study Room</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>

            {onOpenPricing && (
              <button
                onClick={onOpenPricing}
                className="px-5 py-4 rounded-xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-md hover:bg-zinc-900 text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-lg hover:border-zinc-700"
              >
                <Crown className="h-4 w-4 text-amber-400" />
                <span>View Plans & FamPay Demo</span>
              </button>
            )}
          </div>

          {/* Quick Metrics Bar */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 max-w-2xl mx-auto gap-3 text-center font-mono">
            <div className="p-3 rounded-xl border border-zinc-800/80 bg-black/60 backdrop-blur-md">
              <div className="text-xs sm:text-sm font-bold text-white">Edge CV</div>
              <div className="text-[10px] text-zinc-400">100% In-Browser Privacy</div>
            </div>
            <div className="p-3 rounded-xl border border-zinc-800/80 bg-black/60 backdrop-blur-md">
              <div className="text-xs sm:text-sm font-bold text-white">Focus Score</div>
              <div className="text-[10px] text-zinc-400">Dynamic AI Attention Metric</div>
            </div>
            <div className="p-3 rounded-xl border border-zinc-800/80 bg-black/60 backdrop-blur-md">
              <div className="text-xs sm:text-sm font-bold text-white">Zero Cloud</div>
              <div className="text-[10px] text-zinc-400">Camera Stays On Your Device</div>
            </div>
            <div className="p-3 rounded-xl border border-zinc-800/80 bg-black/60 backdrop-blur-md">
              <div className="text-xs sm:text-sm font-bold text-white">Adaptive</div>
              <div className="text-[10px] text-zinc-400">Spaced Repetition & Quiz</div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* ⭐ SECTION 3 & 10: CORE USP COMPARISON — MORE THAN A STUDY TIMER */}
        {/* ========================================================= */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/85 backdrop-blur-md p-6 sm:p-10 space-y-8 shadow-2xl relative overflow-hidden">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-300 font-mono text-[11px] font-bold">
              <Sparkles className="h-3 w-3" />
              <span>⭐ OUR CORE USP</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              FOCURA IS MORE THAN A STUDY TIMER.
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              “Most apps tell you how long you studied. Focura aims to help you understand how effectively you studied.”
            </p>
          </div>

          {/* Side-by-Side Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Traditional App Card */}
            <div className="rounded-2xl border border-zinc-800/80 bg-black/60 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                    <Clock className="h-4 w-4" />
                  </div>
                  <h3 className="font-bold text-sm text-zinc-300">Traditional Study Apps</h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-500 border border-zinc-800">
                  Time Only
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-950/80 font-mono text-xs text-zinc-400">
                <span className="text-zinc-500">Output: </span>
                <span className="text-zinc-200">“You studied for 2 hours.”</span>
              </div>

              <ul className="space-y-2.5 text-xs text-zinc-400">
                <li className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-zinc-600 shrink-0 mt-0.5" />
                  <span>Cannot verify whether the student was actually looking at the book or daydreaming.</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-zinc-600 shrink-0 mt-0.5" />
                  <span>No detection if the user walked away or was secretly scrolling on their phone.</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-zinc-600 shrink-0 mt-0.5" />
                  <span>Treats 2 hours of distracted browsing the same as 2 hours of deep focus.</span>
                </li>
              </ul>
            </div>

            {/* Focura Smart Focus Card */}
            <div className="rounded-2xl border-2 border-white/20 bg-gradient-to-b from-zinc-900/90 to-black p-6 space-y-4 relative shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-white text-black flex items-center justify-center shadow-md">
                    <Eye className="h-4 w-4" />
                  </div>
                  <h3 className="font-extrabold text-sm text-white">Focura Focus Engine</h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold">
                  Quality + Consistency
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-zinc-700 bg-black/80 font-mono text-xs text-white shadow-inner">
                <span className="text-amber-400 font-bold">Output: </span>
                <span>“You completed a 2-hour session, and your focus pattern was analysed to provide a Focus Score and useful insights.”</span>
              </div>

              <ul className="space-y-2.5 text-xs text-zinc-200">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Analyses whether the student is facing the study area and engaged in reading.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Identifies if they have moved away for a prolonged period or picked up their phone.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Distinguishes high-yield flow state from fatigue and provides actionable diagnostic graphs.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-2 text-center">
            <button
              onClick={onStartStudying}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black font-extrabold text-xs hover:bg-zinc-200 transition-all shadow-lg active:scale-95"
            >
              <span>Test Computer Vision In Study Room</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTIONS 1 & 2: THE PROBLEM & OUR SOLUTION */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. The Problem */}
          <div className="rounded-2xl border border-zinc-800 bg-black/75 backdrop-blur-md p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              <span>1. The Problem</span>
            </div>
            
            <h3 className="text-xl sm:text-2xl font-black text-white">
              The Illusion of Study Hours
            </h3>

            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Students spend hours studying on laptops and phones, but digital notifications, multitasking, and passive scrolling drastically erode their actual productivity.
            </p>

            <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-950 text-xs text-zinc-300 space-y-2">
              <div className="font-semibold text-white">The Unanswered Question:</div>
              <p className="text-zinc-400 italic">
                “Most study apps only track time spent studying or block distracting websites. They cannot effectively answer: <span className="text-white font-medium">Was the student actually focused during that time?</span>”
              </p>
            </div>
          </div>

          {/* 2. Our Solution */}
          <div className="rounded-2xl border border-zinc-800 bg-black/75 backdrop-blur-md p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>2. Our Solution</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white">
              AI-Powered Focus Mastery
            </h3>

            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Focura is an AI-powered study platform that helps students improve the genuine quality and consistency of their study sessions through six integrated pillars:
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-950/60 text-zinc-300 flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>CV Focus Detection</span>
              </div>
              <div className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-950/60 text-zinc-300 flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>AI Focus Score</span>
              </div>
              <div className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-950/60 text-zinc-300 flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Distraction Control</span>
              </div>
              <div className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-950/60 text-zinc-300 flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Study Analytics</span>
              </div>
              <div className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-950/60 text-zinc-300 flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Subject Tracking</span>
              </div>
              <div className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-950/60 text-zinc-300 flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Revision Support</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 4: HOW IT WORKS — 6-STEP WORKFLOW PIPELINE */}
        {/* ========================================================= */}
        <div className="space-y-6 pt-4">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
              4. System Architecture
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              How Focura Works
            </h2>
            <p className="text-xs text-zinc-400">
              Start Session → Focus Mode → Computer Vision Analysis → Focus Score → Analytics → Improve
            </p>
          </div>

          {/* Workflow Stepper Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-2">
            {workflowSteps.map((step, idx) => (
              <div
                key={step.num}
                onClick={() => setActiveWorkflowStep(step.num)}
                className={`cursor-pointer rounded-2xl border p-4 transition-all duration-300 flex flex-col justify-between ${
                  activeWorkflowStep === step.num
                    ? 'border-white bg-zinc-900 shadow-xl'
                    : 'border-zinc-800/80 bg-zinc-950/70 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mb-3">
                    <span className="font-bold text-white">0{step.num}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] ${
                      step.tag === 'Core USP' ? 'bg-amber-400/20 text-amber-300 font-bold' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {step.tag}
                    </span>
                  </div>
                  <h4 className="text-sm font-extrabold text-white mb-1.5">
                    {step.title}
                  </h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="mt-4 pt-2 border-t border-zinc-900 flex items-center text-[10px] font-mono text-zinc-500">
                  {idx < workflowSteps.length - 1 ? (
                    <span className="flex items-center gap-1">Next: Step 0{idx + 2} <ChevronRight className="h-3 w-3" /></span>
                  ) : (
                    <span className="text-emerald-400 font-bold">Compounding Mastery</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-2">
            <span className="text-xs text-zinc-400 font-mono">
              Students use their verified session data to understand study habits and systematically eliminate distraction leaks.
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 5: 7 KEY FEATURES */}
        {/* ========================================================= */}
        <div className="space-y-6 pt-4">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
              5. Comprehensive Suite
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              7 Pillars of Focura
            </h2>
            <p className="text-xs text-zinc-400">
              Engineered from the ground up for high-output students and serious competitive aspirants.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {keyFeatures.map((feat, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md p-6 space-y-3 hover:border-zinc-600 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
                      <feat.icon className="h-5 w-5" />
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${feat.badgeColor}`}>
                      {feat.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-zinc-900/80 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                  <span>Engineered for Focus</span>
                  <span className="text-zinc-300">Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 6: TARGET USERS */}
        {/* ========================================================= */}
        <div className="space-y-6 pt-4">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
              6. Who Benefits
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Built for Serious Learners
            </h2>
            <p className="text-xs text-zinc-400">
              Tailored workflows for school curricula, cut-throat entrance exams, and self-directed scholars.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {targetUsers.map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-zinc-800 bg-black/70 backdrop-blur-md p-5 space-y-3 hover:border-zinc-700 transition-colors"
              >
                <div className="h-9 w-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
                  <item.icon className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white">
                    {item.title}
                  </h4>
                  <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                    {item.target}
                  </div>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed border-t border-zinc-900 pt-2.5">
                  {item.benefit}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 7, 8 & 9: BUSINESS MODEL, TECHNICAL FEASIBILITY & FUTURE SCOPE */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
          {/* 7. Business Model */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase">
                <Crown className="h-3.5 w-3.5 text-amber-400" />
                <span>7. Business Model</span>
              </div>
              <h3 className="text-lg font-extrabold text-white">
                Freemium & Institutional
              </h3>
              <ul className="space-y-2 text-xs text-zinc-400">
                <li className="flex items-start gap-1.5">
                  <span className="text-white font-bold">Free:</span> Basic study sessions, timer, and daily analytics (45m quota).
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-300 font-bold">Premium:</span> Advanced CV tracking, detailed focus trends, personalized insights, and unlimited focus.
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-sky-300 font-bold">Institutions:</span> Dedicated dashboard version for schools & coaching centers.
                </li>
              </ul>
            </div>

            {onOpenPricing && (
              <button
                onClick={onOpenPricing}
                className="w-full mt-4 py-2.5 px-3 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>Explore Plans & FamPay Demo</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* 8. Technical Feasibility */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase">
              <Cpu className="h-3.5 w-3.5 text-white" />
              <span>8. Technical Feasibility</span>
            </div>
            <h3 className="text-lg font-extrabold text-white">
              Lightweight & Practical
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Developed with high-efficiency edge architectures:
            </p>
            <div className="p-3 rounded-xl border border-zinc-800/80 bg-black/60 font-mono text-[11px] text-zinc-300 space-y-1">
              <div>• WebAssembly + Client-Side CV Engine</div>
              <div>• Real-Time Gaze & Posture Vectors</div>
              <div>• Zero Server Video Streaming (100% Private)</div>
              <div>• Cloud Firestore + Local IndexedDB Caching</div>
            </div>
            <p className="text-[11px] text-zinc-400">
              Focuses on a limited set of clearly defined visual signals, making the concept robust, scalable, and instant.
            </p>
          </div>

          {/* 9. Future Scope */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase">
              <Lightbulb className="h-3.5 w-3.5 text-amber-300" />
              <span>9. Future Scope</span>
            </div>
            <h3 className="text-lg font-extrabold text-white">
              AI Study Companion Evolution
            </h3>
            <ul className="space-y-1.5 text-xs text-zinc-400">
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                <span>Personalized AI Study Coach</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                <span>Smart automated revision scheduling</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                <span>Adaptive real-time study intervals</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                <span>Long-term multi-month focus analytics</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                <span>School & coaching batch API integration</span>
              </li>
            </ul>
          </div>
        </div>

        {/* ========================================================= */}
        {/* LEADERSHIP TEAM SECTION (WITH BLACK PHOTO OPTION) */}
        {/* ========================================================= */}
        <div className="pt-8 space-y-8 border-t border-zinc-900">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
                Company & Leadership
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                The Minds Behind Focura
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Passionate creators engineering the next generation of digital focus infrastructure.
              </p>
            </div>

            {/* Photo Option Switcher: Black Placeholder (Default) vs Provided Photos */}
            <div className="flex items-center gap-2 p-1 rounded-xl border border-zinc-800 bg-zinc-950 font-mono text-[11px]">
              <button
                onClick={() => setPhotoStyle('black')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  photoStyle === 'black'
                    ? 'bg-white text-black font-extrabold shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Black photo placeholder (Photos to be provided later)"
              >
                <div className="h-2 w-2 rounded-full bg-black border border-zinc-400" />
                <span>Black Option (Default)</span>
              </button>

              <button
                onClick={() => setPhotoStyle('custom')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  photoStyle === 'custom'
                    ? 'bg-white text-black font-extrabold shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Provided Photos"
              >
                <Camera className="h-3 w-3" />
                <span>Photos ({Object.keys(customPhotos).length})</span>
              </button>
            </div>
          </div>

          {/* 3 Founders Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {team.map((member) => {
              const customPhoto = customPhotos[member.id];
              const showCustom = photoStyle === 'custom' && !!customPhoto;

              return (
                <div
                  key={member.id}
                  className="group relative rounded-2xl border border-zinc-800/90 bg-zinc-950/85 backdrop-blur-md p-6 flex flex-col justify-between transition-all duration-300 hover:border-zinc-600 hover:shadow-2xl"
                >
                  <div>
                    {/* Photo Container: Black Placeholder by default */}
                    <div className="relative mb-6 flex flex-col items-center justify-center">
                      {showCustom ? (
                        /* Custom Photo Display (when provided later) */
                        <div className="relative h-36 w-36 rounded-2xl overflow-hidden border-2 border-zinc-700 bg-black shadow-2xl group-hover:border-white transition-colors">
                          <img
                            src={customPhoto}
                            alt={member.name}
                            className="h-full w-full object-cover grayscale contrast-125 transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                        </div>
                      ) : (
                        /* Sleek Pure Black Aesthetic Photo Placeholder (Default) */
                        <div className="relative h-36 w-36 rounded-2xl border-2 border-zinc-800 bg-black flex flex-col items-center justify-center shadow-2xl group-hover:border-zinc-500 transition-all p-3 text-center">
                          {/* Inner subtle rim gradient */}
                          <div className="absolute inset-1 rounded-xl bg-zinc-950/80 border border-zinc-900 flex flex-col items-center justify-center">
                            <span className="font-mono text-3xl font-black text-white tracking-widest">
                              {member.initials}
                            </span>
                            <div className="mt-2 flex items-center gap-1 text-[10px] font-mono text-zinc-500 uppercase">
                              <Camera className="h-3 w-3 text-zinc-600" />
                              <span>Photo Later</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Role Pill Badge */}
                      <div className="absolute -bottom-3 px-3.5 py-0.5 rounded-full bg-white text-black font-mono font-black text-[11px] tracking-wider uppercase shadow-lg border border-zinc-200">
                        {member.role}
                      </div>
                    </div>

                    {/* Member Name and Designation */}
                    <div className="text-center pt-2">
                      <h3 className="text-lg font-black text-white group-hover:text-zinc-100 transition-colors">
                        {member.name}
                      </h3>
                      <div className="text-xs font-mono text-zinc-400 mt-0.5">
                        {member.title}
                      </div>
                    </div>

                    {/* Bio */}
                    <p className="text-xs text-zinc-400 leading-relaxed text-center mt-4 border-t border-zinc-900 pt-3">
                      {member.bio}
                    </p>
                  </div>

                  {/* Card Bottom: Photo Option Management */}
                  <div className="mt-6 pt-3 border-t border-zinc-900/80 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                    <span className="text-zinc-500">Photo Option:</span>
                    <button
                      onClick={() => handleOpenPhotoModal(member)}
                      className="inline-flex items-center gap-1 text-zinc-300 hover:text-white underline decoration-zinc-700 underline-offset-4 transition-colors font-medium"
                    >
                      {customPhoto ? 'Update Photo' : '+ Provide Photo'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3.5 rounded-xl border border-zinc-900 bg-zinc-950/60 text-center font-mono text-[11px] text-zinc-400 max-w-xl mx-auto flex items-center justify-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
            <span>Team photo frames set to black monochrome placeholders by default. Photos can be added anytime.</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* BOTTOM FINAL GET STARTED BANNER */}
        {/* ========================================================= */}
        <div className="rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-950 to-black p-8 sm:p-14 text-center max-w-4xl mx-auto space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-radial from-zinc-800/20 via-transparent to-transparent pointer-events-none" />
          
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-black/60 text-[11px] font-mono text-zinc-300">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span>Focura Focus Engine</span>
            </div>

            <h3 className="text-3xl sm:text-4xl font-black text-white">
              “Don’t just track study time — understand your focus.”
            </h3>
            
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
              Step directly into the Focura study room to experience real-time computer vision focus tracking with camera posture analysis, countdown timers, and distraction defense.
            </p>

            <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={onStartStudying}
                className="px-8 py-4 rounded-xl bg-white text-black font-extrabold text-sm hover:bg-zinc-200 transition-all inline-flex items-center gap-2.5 shadow-2xl active:scale-95 group"
              >
                <Timer className="h-4 w-4 transition-transform group-hover:scale-110" />
                <span>Get Started — Enter Study Room</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* MODAL: PROVIDE / UPDATE PHOTO LATER */}
      {/* ========================================================= */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl text-white space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-white">
                  Provide Photo for {editingMember.name}
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  {editingMember.role} · Focura Leadership
                </p>
              </div>
              <button
                onClick={() => setEditingMember(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Photo Preview */}
            <div className="flex flex-col items-center justify-center py-2">
              <div className="relative h-28 w-28 rounded-2xl overflow-hidden border-2 border-zinc-700 bg-black flex items-center justify-center shadow-lg">
                {photoFilePreview || photoUrlInput ? (
                  <img
                    src={photoFilePreview || photoUrlInput}
                    alt="Preview"
                    className="h-full w-full object-cover grayscale contrast-125"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '';
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-zinc-500 font-mono text-xs">
                    <Camera className="h-6 w-6 mb-1 text-zinc-600" />
                    <span>Black Frame</span>
                  </div>
                )}
              </div>
              <span className="text-[10px] font-mono text-zinc-500 mt-2">
                Monochrome preview
              </span>
            </div>

            {/* Option 1: File Upload */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-zinc-300 block">
                Option 1: Upload from Device
              </label>
              <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-zinc-800 hover:border-zinc-600 bg-zinc-900/50 cursor-pointer transition-colors text-xs text-zinc-300">
                <Upload className="h-4 w-4 text-zinc-400" />
                <span>Choose Image File</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Option 2: Image URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-zinc-300 block">
                Option 2: Paste Image URL
              </label>
              <input
                type="url"
                value={photoUrlInput}
                onChange={(e) => {
                  setPhotoUrlInput(e.target.value);
                  setPhotoFilePreview(null);
                }}
                placeholder="https://example.com/photo.jpg"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/80 text-white text-xs font-mono focus:border-white focus:outline-none placeholder-zinc-600"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-900">
              <button
                type="button"
                onClick={() => {
                  setCustomPhotos(prev => {
                    const next = { ...prev };
                    delete next[editingMember.id];
                    return next;
                  });
                  setEditingMember(null);
                }}
                className="px-3 py-2 rounded-xl text-xs font-mono text-zinc-400 hover:text-white transition-colors"
              >
                Keep Black (Blank)
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-3.5 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePhoto}
                  className="px-4 py-2 rounded-xl bg-white text-black font-extrabold text-xs hover:bg-zinc-200 transition-colors flex items-center gap-1.5 shadow-md"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Save Photo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
