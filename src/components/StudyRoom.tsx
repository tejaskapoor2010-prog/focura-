import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  CameraOff, 
  Play, 
  Pause, 
  Square, 
  Maximize2, 
  Minimize2, 
  Bell, 
  BellOff, 
  ShieldAlert, 
  CheckCircle2, 
  Sparkles, 
  RotateCcw, 
  Clock, 
  BookOpen, 
  Layers, 
  SlidersHorizontal,
  Flame,
  Volume2,
  Smartphone,
  Crosshair,
  Timer,
  Laptop,
  Crown,
  Zap,
  Lock,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { 
  UserProfile, 
  StudySession, 
  VisionDetectionResult, 
  DistractionEvent, 
  FocusTimelinePoint,
  FocusState,
  SubjectItem,
  PlanTier
} from '../types';
import { FocusCVEngine } from '../utils/cvEngine';
import { soundscapes } from '../utils/soundscapes';
import { getUserSubjects } from '../utils/storage';
import { STREAMS_CONFIG } from '../data/streams';
import { checkDailyFocusLimit, getUserPlan } from '../utils/plans';

interface StudyRoomProps {
  user: UserProfile;
  onSessionComplete: (session: StudySession) => void;
  onOpenPricing?: (defaultTier?: PlanTier) => void;
}

export const StudyRoom: React.FC<StudyRoomProps> = ({ user, onSessionComplete, onOpenPricing }) => {
  // Video and Canvas refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const engineRef = useRef<FocusCVEngine | null>(null);

  // Study Mode: 'screen' (looking at computer screen) vs 'book' (reading physical book/notes on desk)
  const [studyMode, setStudyMode] = useState<'screen' | 'book'>('screen');
  const studyModeRef = useRef<'screen' | 'book'>('screen');

  // Camera & Detection state
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [detectionResult, setDetectionResult] = useState<VisionDetectionResult | null>(null);
  const [cvSensitivity, setCvSensitivity] = useState<'low' | 'normal' | 'high'>('normal');
  const [phoneShieldActive, setPhoneShieldActive] = useState<boolean>(true);
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);

  // Dedicated refs to prevent interval re-renders/teardown
  const sessionDurationRef = useRef<number>(0);
  const focusedSecondsRef = useRef<number>(0);
  const timerModeRef = useRef<'countdown' | 'stopwatch'>('countdown');
  const timerTargetMinutesRef = useRef<number>(25);
  const detectionResultRef = useRef<VisionDetectionResult | null>(null);
  const cameraActiveRef = useRef<boolean>(false);
  const isSessionActiveRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(false);
  const distractionAlertsEnabledRef = useRef<boolean>(true);
  const currentDistractionStartRef = useRef<number | null>(null);
  const cvSensitivityRef = useRef<'low' | 'normal' | 'high'>('normal');
  const distractionEventsRef = useRef<DistractionEvent[]>([]);
  const lastDistractionStateRef = useRef<FocusState>('focused');
  const lastDistractionReasonRef = useRef<string>('');
  const handleCVResultRef = useRef<(res: VisionDetectionResult) => void>(() => {});

  // Session state
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [sessionDurationSeconds, setSessionDurationSeconds] = useState<number>(0);
  const [focusedSeconds, setFocusedSeconds] = useState<number>(0);
  const [timerTargetMinutes, setTimerTargetMinutes] = useState<number>(25);
  const [customMinutesInput, setCustomMinutesInput] = useState<string>('30');
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [timerMode, setTimerMode] = useState<'countdown' | 'stopwatch'>('countdown');

  // Study Context
  const subjects = getUserSubjects(user.id, user.stream);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [selectedTopic, setSelectedTopic] = useState<string>(subjects[0]?.subTopics[0] || '');
  const [customTopic, setCustomTopic] = useState<string>('');

  // Distraction & Analytics State
  const [distractionAlertsEnabled, setDistractionAlertsEnabled] = useState<boolean>(true);
  const [distractionEvents, setDistractionEvents] = useState<DistractionEvent[]>([]);
  const [currentDistractionStart, setCurrentDistractionStart] = useState<number | null>(null);
  const [timelinePoints, setTimelinePoints] = useState<FocusTimelinePoint[]>([]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [distractionWarningPrompt, setDistractionWarningPrompt] = useState<string | null>(null);
  const [showDailyLimitModal, setShowDailyLimitModal] = useState<boolean>(false);

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];
  const streamMeta = STREAMS_CONFIG[user.stream] || STREAMS_CONFIG.science;

  // Switch study mode between 'screen' and 'book'
  const handleSetStudyMode = (mode: 'screen' | 'book') => {
    setStudyMode(mode);
    studyModeRef.current = mode;
    if (engineRef.current) {
      engineRef.current.setStudyMode(mode);
    }
    setDistractionWarningPrompt(null);
    currentDistractionStartRef.current = null;
    setCurrentDistractionStart(null);
  };

  // Keep handleCVResultRef up to date with latest closure
  useEffect(() => {
    handleCVResultRef.current = handleCVResult;
  });

  // Initialize and clean up CV engine
  useEffect(() => {
    engineRef.current = new FocusCVEngine({
      onResult: (res) => {
        handleCVResultRef.current(res);
      },
      targetFps: 20,
      sensitivity: cvSensitivity,
      phoneDetectionEnabled: phoneShieldActive,
      studyMode: studyMode,
    });

    return () => {
      stopCamera();
      if (engineRef.current) {
        engineRef.current.stop();
      }
    };
  }, []);

  // Sync options with CV engine
  useEffect(() => {
    cvSensitivityRef.current = cvSensitivity;
    if (engineRef.current) {
      engineRef.current.setSensitivity(cvSensitivity);
      engineRef.current.setPhoneDetectionEnabled(phoneShieldActive);
      engineRef.current.setStudyMode(studyMode);
    }
  }, [cvSensitivity, phoneShieldActive, studyMode]);

  // Keep refs in sync with state
  useEffect(() => {
    timerModeRef.current = timerMode;
  }, [timerMode]);

  useEffect(() => {
    timerTargetMinutesRef.current = timerTargetMinutes;
  }, [timerTargetMinutes]);

  useEffect(() => {
    cameraActiveRef.current = cameraActive;
  }, [cameraActive]);

  useEffect(() => {
    distractionAlertsEnabledRef.current = distractionAlertsEnabled;
  }, [distractionAlertsEnabled]);

  // Calibrate user neutral sitting posture
  const handleCalibratePosture = () => {
    if (engineRef.current) {
      engineRef.current.calibrate();
      setIsCalibrating(true);
      setTimeout(() => setIsCalibrating(false), 1600);
    }
  };

  // Sync selected subject topics
  useEffect(() => {
    if (selectedSubject && selectedSubject.subTopics.length > 0) {
      setSelectedTopic(selectedSubject.subTopics[0]);
    }
  }, [selectedSubjectId]);

  // Bulletproof 1-second interval timer (cleans up ONLY on session start/pause/stop)
  useEffect(() => {
    isSessionActiveRef.current = isSessionActive;
    isPausedRef.current = isPaused;

    if (!isSessionActive || isPaused) return;

    const interval = setInterval(() => {
      // 1. Advance session time
      sessionDurationRef.current += 1;
      const curTotalSec = sessionDurationRef.current;
      setSessionDurationSeconds(curTotalSec);

      // Check daily focus limit (45 min for free, 4 hours for premium, unlimited for ultra)
      const currentLimit = checkDailyFocusLimit(user, curTotalSec);
      if (currentLimit.isLimitReached) {
        handleCompleteSession();
        setShowDailyLimitModal(true);
        return;
      }

      // Check countdown completion target
      if (timerModeRef.current === 'countdown' && curTotalSec >= timerTargetMinutesRef.current * 60) {
        handleCompleteSession();
        soundscapes.playSessionSuccess();
        return;
      }

      // 2. Evaluate focus status for this exact second
      const isCam = cameraActiveRef.current;
      const currentRes = detectionResultRef.current;
      const isCurrentlyFocused = !isCam || (currentRes?.state === 'focused');

      if (isCurrentlyFocused) {
        focusedSecondsRef.current += 1;
        setFocusedSeconds(focusedSecondsRef.current);
      }

      // 3. Sample timeline points every 5 seconds for smooth, reliable scoring
      if (curTotalSec > 0 && curTotalSec % 5 === 0) {
        const scoreSample = isCam ? (currentRes?.focusScoreRealtime ?? 95) : 95;
        const stateSample = isCam ? (currentRes?.state ?? 'focused') : 'focused';
        setTimelinePoints((prev) => [
          ...prev,
          {
            second: curTotalSec,
            focusScore: scoreSample,
            state: stateSample,
          },
        ]);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isSessionActive, isPaused]);

  // Start Camera and feed to CV engine
  const startCamera = async () => {
    setCameraError(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraActive(true);
      cameraActiveRef.current = true;

      if (engineRef.current && videoRef.current && canvasRef.current) {
        engineRef.current.start(videoRef.current, canvasRef.current);
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      let msg = 'Could not access webcam. Please check browser permissions.';
      if (err.name === 'NotAllowedError') {
        msg = 'Camera permission was denied. Please allow camera access in browser settings.';
      } else if (err.name === 'NotFoundError') {
        msg = 'No camera device found on your computer.';
      }
      setCameraError(msg);
      setCameraActive(false);
      cameraActiveRef.current = false;
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (engineRef.current) {
      engineRef.current.stop();
    }
    setCameraActive(false);
    cameraActiveRef.current = false;
    setDetectionResult(null);
    detectionResultRef.current = null;
  };

  // Handle detection updates from CV Engine
  const handleCVResult = (res: VisionDetectionResult) => {
    setDetectionResult(res);
    detectionResultRef.current = res;

    if (!isSessionActiveRef.current || isPausedRef.current) return;

    // Distraction tracking & gentle audio alerts
    if (res.state !== 'focused') {
      lastDistractionStateRef.current = res.state;
      if (res.distractionReason) {
        lastDistractionReasonRef.current = res.distractionReason;
      }

      // In book mode, downward pitch is NOT a distraction (cvEngine flags as focused).
      // Only genuine distractions (absent, looking away sideways, phone at ear) enter here.
      if (currentDistractionStartRef.current === null) {
        currentDistractionStartRef.current = Date.now();
        setCurrentDistractionStart(Date.now());
      } else {
        const distractionDuration = (Date.now() - currentDistractionStartRef.current) / 1000;
        
        // Fast trigger for phone detection in screen mode:
        const alertThreshold = res.state === 'phone_posture'
          ? (cvSensitivityRef.current === 'high' ? 1.4 : cvSensitivityRef.current === 'low' ? 3.5 : 2.2)
          : (cvSensitivityRef.current === 'high' ? 4.5 : cvSensitivityRef.current === 'low' ? 9 : 6);

        if (distractionDuration >= alertThreshold && distractionAlertsEnabledRef.current && !distractionWarningPrompt) {
          if (res.state === 'phone_posture') {
            soundscapes.playPhoneAlertChime();
          } else {
            soundscapes.playDistractionChime();
          }

          const reasonMsg =
            res.state === 'phone_posture'
              ? (res.distractionReason || '📱 Smartphone detected — Keep your phone aside')
              : res.state === 'absent'
              ? 'Study desk is empty — Return to your study seat'
              : 'Gaze wandered away — Refocus on your study material';

          setDistractionWarningPrompt(reasonMsg);

          // Auto-clear prompt after 4s
          setTimeout(() => setDistractionWarningPrompt(null), 4000);
        }
      }
    } else {
      // Returned to focus!
      if (currentDistractionStartRef.current !== null) {
        const durationSec = Math.max(1, Math.round((Date.now() - currentDistractionStartRef.current) / 1000));
        // Log distractions that lasted at least 2 seconds (or any phone detection)
        const recordedType = lastDistractionStateRef.current !== 'focused' ? lastDistractionStateRef.current : 'looking_away';
        if (durationSec >= 2 || recordedType === 'phone_posture') {
          const newEvent: DistractionEvent = {
            id: 'dist_' + Math.random().toString(36).substring(2, 7),
            timestamp: sessionDurationRef.current * 1000,
            type: recordedType,
            durationSeconds: durationSec,
            label: lastDistractionReasonRef.current || res.distractionReason || (recordedType === 'phone_posture' ? 'Smartphone detected' : recordedType === 'absent' ? 'Desk absent' : 'Gaze wandered'),
          };
          distractionEventsRef.current.push(newEvent);
          setDistractionEvents((prev) => [...prev, newEvent]);
        }
        currentDistractionStartRef.current = null;
        setCurrentDistractionStart(null);
        lastDistractionStateRef.current = 'focused';
        lastDistractionReasonRef.current = '';
      }
      setDistractionWarningPrompt(null);
    }
  };

  const handleStartSession = async () => {
    // Check if daily focus limit has already been reached for today
    const preCheck = checkDailyFocusLimit(user, 0);
    if (preCheck.isLimitReached) {
      setShowDailyLimitModal(true);
      return;
    }

    if (!cameraActive) {
      await startCamera();
    }
    sessionDurationRef.current = 0;
    focusedSecondsRef.current = 0;
    distractionEventsRef.current = [];
    setSessionDurationSeconds(0);
    setFocusedSeconds(0);
    setDistractionEvents([]);
    setTimelinePoints([]);
    currentDistractionStartRef.current = null;
    setCurrentDistractionStart(null);
    lastDistractionStateRef.current = 'focused';
    lastDistractionReasonRef.current = '';
    isSessionActiveRef.current = true;
    setIsSessionActive(true);
    isPausedRef.current = false;
    setIsPaused(false);
  };

  const handlePauseResume = () => {
    setIsPaused((prev) => {
      const next = !prev;
      isPausedRef.current = next;
      return next;
    });
  };

  const handleResetSession = () => {
    isSessionActiveRef.current = false;
    setIsSessionActive(false);
    isPausedRef.current = false;
    setIsPaused(false);
    sessionDurationRef.current = 0;
    focusedSecondsRef.current = 0;
    distractionEventsRef.current = [];
    setSessionDurationSeconds(0);
    setFocusedSeconds(0);
    setDistractionEvents([]);
    setTimelinePoints([]);
    currentDistractionStartRef.current = null;
    setCurrentDistractionStart(null);
    lastDistractionStateRef.current = 'focused';
    lastDistractionReasonRef.current = '';
    setDistractionWarningPrompt(null);
  };

  const handleCompleteSession = () => {
    isSessionActiveRef.current = false;
    setIsSessionActive(false);
    isPausedRef.current = false;
    setIsPaused(false);

    // If an ongoing distraction was active right when clicking "End & Score", record it!
    if (currentDistractionStartRef.current !== null) {
      const durationSec = Math.max(1, Math.round((Date.now() - currentDistractionStartRef.current) / 1000));
      const recordedType = lastDistractionStateRef.current !== 'focused' ? lastDistractionStateRef.current : 'looking_away';
      if (durationSec >= 2 || recordedType === 'phone_posture') {
        const finalDistEvent: DistractionEvent = {
          id: 'dist_' + Math.random().toString(36).substring(2, 7),
          timestamp: sessionDurationRef.current * 1000,
          type: recordedType,
          durationSeconds: durationSec,
          label: lastDistractionReasonRef.current || (recordedType === 'phone_posture' ? 'Smartphone detected' : recordedType === 'absent' ? 'Desk absent' : 'Gaze wandered'),
        };
        distractionEventsRef.current.push(finalDistEvent);
        setDistractionEvents([...distractionEventsRef.current]);
      }
      currentDistractionStartRef.current = null;
      setCurrentDistractionStart(null);
    }

    const currentDistractionEvents = [...distractionEventsRef.current];
    const totalSecs = Math.max(1, sessionDurationRef.current);
    const focusedSecs = Math.min(totalSecs, focusedSecondsRef.current);

    // Accurate focus percentage (time focused / total study time)
    const focusRatioPct = Math.round((focusedSecs / totalSecs) * 100);

    // Average real-time posture stability score
    let avgQuality = 95;
    if (timelinePoints.length > 0) {
      avgQuality = Math.round(
        timelinePoints.reduce((sum, pt) => sum + pt.focusScore, 0) / timelinePoints.length
      );
    } else if (detectionResultRef.current) {
      avgQuality = detectionResultRef.current.focusScoreRealtime;
    }

    // Final score:
    // If camera was on: 70% time ratio + 30% CV posture quality
    // If camera was off: 100% time ratio
    let finalFocusScore: number;
    if (cameraActiveRef.current) {
      finalFocusScore = Math.round(0.7 * focusRatioPct + 0.3 * avgQuality);

      // Minor penalty ONLY if explicit phone distractions happened in Screen Mode
      if (studyModeRef.current === 'screen') {
        const phoneCount = currentDistractionEvents.filter((d) => d.type === 'phone_posture').length;
        if (phoneCount > 0) {
          const phonePenalty = Math.min(8, phoneCount * 2);
          finalFocusScore = Math.max(20, finalFocusScore - phonePenalty);
        }
      }
    } else {
      finalFocusScore = focusRatioPct;
    }

    finalFocusScore = Math.max(20, Math.min(100, finalFocusScore));

    const finalSession: StudySession = {
      id: 'sess_' + Math.random().toString(36).substring(2, 9),
      userId: user.id,
      startTime: Date.now() - totalSecs * 1000,
      endTime: Date.now(),
      durationSeconds: totalSecs,
      focusedSeconds: focusedSecs,
      focusScore: finalFocusScore,
      stream: user.stream,
      subject: selectedSubject.name,
      subTopic: selectedTopic === '__custom' ? (customTopic || 'General Study') : selectedTopic,
      distractionEvents: currentDistractionEvents,
      timeline: timelinePoints,
    };

    onSessionComplete(finalSession);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const remainingSeconds = Math.max(0, timerTargetMinutes * 60 - sessionDurationSeconds);
  const displayTimer = timerMode === 'countdown' ? formatTime(remainingSeconds) : formatTime(sessionDurationSeconds);

  // Circular progress calculation
  const totalTargetSeconds = timerTargetMinutes * 60;
  const progressRatio = timerMode === 'countdown' 
    ? Math.min(1, sessionDurationSeconds / Math.max(1, totalTargetSeconds))
    : Math.min(1, (sessionDurationSeconds % 3600) / 3600);
  const strokeDashoffset = 440 - 440 * progressRatio;

  const dailyLimitInfo = checkDailyFocusLimit(user, sessionDurationSeconds);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Daily Focus Quota Banner */}
      <div className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg transition-all ${
        dailyLimitInfo.plan === 'ultra_premium'
          ? 'border-amber-400/30 bg-gradient-to-r from-amber-950/20 via-zinc-950 to-zinc-950'
          : dailyLimitInfo.isLimitReached
          ? 'border-red-500/40 bg-red-950/20'
          : dailyLimitInfo.plan === 'premium'
          ? 'border-zinc-700 bg-zinc-950'
          : 'border-zinc-800 bg-zinc-950'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border ${
            dailyLimitInfo.plan === 'ultra_premium'
              ? 'bg-amber-400/20 border-amber-400/30 text-amber-300'
              : dailyLimitInfo.isLimitReached
              ? 'bg-red-500/20 border-red-500/30 text-red-400'
              : 'bg-zinc-900 border-zinc-800 text-zinc-300'
          }`}>
            {dailyLimitInfo.plan === 'ultra_premium' ? (
              <Crown className="h-4 w-4" />
            ) : dailyLimitInfo.isLimitReached ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <Clock className="h-4 w-4" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">
                {dailyLimitInfo.plan === 'ultra_premium' ? (
                  <span className="text-amber-300">Ultra Master: Unlimited Daily Focus Active</span>
                ) : dailyLimitInfo.plan === 'premium' ? (
                  <span>Focus Pro Daily Quota: 4 Hours / Day</span>
                ) : (
                  <span>Free Starter Daily Quota: 45 Mins / Day</span>
                )}
              </span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                dailyLimitInfo.plan === 'ultra_premium'
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                  : dailyLimitInfo.plan === 'premium'
                  ? 'bg-white text-black'
                  : 'bg-zinc-800 text-zinc-400'
              }`}>
                {dailyLimitInfo.plan.replace('_', ' ')}
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">
              {dailyLimitInfo.plan === 'ultra_premium' ? (
                <span>No daily timer caps or tracking restrictions. {dailyLimitInfo.usedMinutes}m focused today.</span>
              ) : dailyLimitInfo.isLimitReached ? (
                <span className="text-red-400 font-bold">
                  Daily focus limit reached ({dailyLimitInfo.usedMinutes}m / {dailyLimitInfo.maxMinutes}m). Upgrade to continue tracking.
                </span>
              ) : (
                <span>
                  {dailyLimitInfo.usedMinutes}m used today · <span className="font-mono text-white font-bold">{dailyLimitInfo.remainingMinutes}m remaining</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {dailyLimitInfo.plan === 'ultra_premium' ? (
            <button
              onClick={() => onOpenPricing?.()}
              className="px-3 py-1.5 rounded-lg border border-amber-400/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
            >
              <Crown className="h-3.5 w-3.5" />
              <span>Ultra Active</span>
            </button>
          ) : (
            <button
              onClick={() => onOpenPricing?.(dailyLimitInfo.plan === 'free' ? 'premium' : 'ultra_premium')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md ${
                dailyLimitInfo.isLimitReached
                  ? 'bg-white text-black hover:bg-zinc-200 animate-pulse'
                  : 'bg-white text-black hover:bg-zinc-200'
              }`}
            >
              <span>{dailyLimitInfo.plan === 'free' ? 'Upgrade to 4h or Unlimited' : 'Go Unlimited + Leaderboard'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      {/* Top Banner / Stream Info in High-Contrast Black & White */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-zinc-800 bg-zinc-950 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black font-extrabold shadow-md">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">{streamMeta.title} Focus Room</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md border border-zinc-700 bg-zinc-900 text-zinc-300">
                {streamMeta.badge}
              </span>
            </div>
            <div className="text-xs text-zinc-400">
              Target Exam: <span className="text-zinc-200 font-bold">{user.targetExam || 'General'}</span> · Daily Goal: <span className="font-mono text-white font-bold">{user.dailyGoalMinutes}m</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Phone Shield Toggle */}
          <button
            onClick={() => setPhoneShieldActive(!phoneShieldActive)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              phoneShieldActive
                ? 'border-white bg-white text-black font-bold'
                : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
            title="Actively detects smartphone usage and phone calls"
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Phone Shield</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${phoneShieldActive ? 'bg-black text-white' : 'bg-zinc-800 text-zinc-400'}`}>
              {phoneShieldActive ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* CV Sensitivity selector */}
          <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded-lg border border-zinc-800 bg-zinc-900/90 text-xs">
            <span className="text-[11px] text-zinc-400 mr-1">Sens:</span>
            {(['high', 'normal', 'low'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setCvSensitivity(s)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  cvSensitivity === s
                    ? 'bg-white text-black font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {s === 'high' ? 'High (1.4s)' : s === 'normal' ? 'Normal' : 'Low'}
              </button>
            ))}
          </div>

          {/* Audio Alert Toggle */}
          <button
            onClick={() => setDistractionAlertsEnabled(!distractionAlertsEnabled)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              distractionAlertsEnabled
                ? 'border-zinc-600 bg-zinc-800 text-white font-bold'
                : 'border-zinc-800 bg-zinc-900 text-zinc-400'
            }`}
            title="Alert bell when distracted"
          >
            {distractionAlertsEnabled ? <Bell className="h-3.5 w-3.5 text-white" /> : <BellOff className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">Alerts</span>
          </button>

          {/* Fullscreen Focus Toggle */}
          <button
            onClick={toggleFullscreen}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5"
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit Focus Shield' : 'Focus Shield'}</span>
          </button>
        </div>
      </div>

      {/* Study Mode Selector Banner: Screen Study vs Book Reading */}
      <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-950 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-black font-extrabold shadow-sm shrink-0">
            {studyMode === 'screen' ? <Laptop className="h-6 w-6" /> : <BookOpen className="h-6 w-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono tracking-wider uppercase text-zinc-400">STUDY TARGET MODE:</span>
              <span className="text-xs font-bold text-white uppercase px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700">
                {studyMode === 'screen' ? '💻 Screen / Digital Study' : '📖 Physical Book / Notes Reading'}
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${studyMode === 'book' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-300'}`}>
                {studyMode === 'book' ? 'Downward Gaze = Focused' : 'Looking Down = Phone Alert'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 leading-snug">
              {studyMode === 'screen'
                ? 'Active Computer Vision tracks screen alignment. Looking down away from the screen flags smartphone distraction.'
                : 'Reading from a textbook, notebook, or writing on paper. Looking down at your desk is detected as 100% focused study; phone alerts for downward gaze are disabled.'}
            </p>
          </div>
        </div>

        {/* Toggle Mode Buttons */}
        <div className="inline-flex p-1 rounded-xl bg-zinc-900 border border-zinc-800 shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={() => handleSetStudyMode('screen')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              studyMode === 'screen'
                ? 'bg-white text-black font-bold shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Laptop className="h-4 w-4" />
            <span>Screen Mode</span>
          </button>
          <button
            type="button"
            onClick={() => handleSetStudyMode('book')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              studyMode === 'book'
                ? 'bg-white text-black font-bold shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Book Reading</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left = Video CV HUD / Right = Timer & Study Config */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Computer Vision Webcam & Overlay (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-video w-full rounded-2xl border border-zinc-800 bg-black overflow-hidden shadow-2xl flex items-center justify-center">
            {/* The Video Element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full object-cover transform -scale-x-100 ${
                cameraActive ? 'block' : 'hidden'
              }`}
            />

            {/* The Transparent Overlay Canvas for Face Landmarks & HUD */}
            <canvas
              ref={canvasRef}
              className={`absolute inset-0 h-full w-full pointer-events-none ${
                cameraActive ? 'block' : 'hidden'
              }`}
            />

            {/* Inactive Camera State */}
            {!cameraActive && (
              <div className="p-6 text-center max-w-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-white mb-4 shadow-lg">
                  <Camera className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">
                  Computer Vision Focus Detection
                </h3>
                <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
                  Focura tracks your screen alignment, phone usage, and gaze via local client-side computer vision. Your camera video never leaves your device.
                </p>
                <button
                  onClick={startCamera}
                  className="py-2.5 px-5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs shadow-xl transition-all inline-flex items-center gap-2"
                >
                  <Camera className="h-4 w-4" />
                  <span>Enable Webcam Vision</span>
                </button>
              </div>
            )}

            {/* Camera Error Message */}
            {cameraError && (
              <div className="absolute inset-x-4 bottom-4 p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 text-white" />
                <span>{cameraError}</span>
              </div>
            )}

            {/* Live Distraction Alert Prompt Overlay */}
            {distractionWarningPrompt && (
              <div className="absolute top-4 inset-x-4 mx-auto max-w-md p-3.5 rounded-xl bg-white text-black shadow-2xl backdrop-blur-md font-bold text-xs flex items-center justify-between border border-zinc-300 animate-bounce">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <span>{distractionWarningPrompt}</span>
                </div>
                <button
                  onClick={() => setDistractionWarningPrompt(null)}
                  className="text-black hover:text-zinc-600 font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Active CV Telemetry Overlay (Top Left) */}
            {cameraActive && detectionResult && (
              <div className="absolute top-3 left-3 bg-black/90 backdrop-blur-md border border-zinc-800 rounded-xl px-3 py-2 text-[11px] font-mono space-y-1 shadow-lg">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      detectionResult.state === 'focused'
                        ? 'bg-white animate-ping'
                        : detectionResult.state === 'phone_posture'
                        ? 'bg-white animate-pulse'
                        : 'bg-zinc-500'
                    }`}
                  />
                  <span className="font-bold text-white uppercase">
                    {detectionResult.state === 'focused'
                      ? (studyMode === 'book' ? '📖 Book Reading Active' : '● Screen Focus Optimal')
                      : detectionResult.state === 'phone_posture'
                      ? '📱 Phone Detected'
                      : detectionResult.state.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-zinc-400 flex items-center justify-between gap-3">
                  <span>Study Mode:</span>
                  <span className="text-white font-bold">{studyMode === 'book' ? '📖 Book Reading' : '💻 Screen Study'}</span>
                </div>
                <div className="text-zinc-400 flex items-center justify-between gap-3">
                  <span>Vision Stability:</span>
                  <span className="text-white font-bold">{detectionResult.focusScoreRealtime}%</span>
                </div>
              </div>
            )}

            {/* Live Phone Warning Bottom Bar */}
            {cameraActive && detectionResult?.state === 'phone_posture' && (
              <div className="absolute bottom-4 inset-x-4 mx-auto max-w-sm px-4 py-2.5 rounded-xl bg-black text-white shadow-2xl backdrop-blur-md font-semibold text-xs flex items-center gap-2.5 border border-white animate-pulse">
                <span className="text-base">📱</span>
                <div>
                  <div className="font-bold text-white">Phone Usage Detected!</div>
                  <div className="text-[10px] text-zinc-300 font-normal">
                    {detectionResult.distractionReason || 'Keep your phone away from desk'}
                  </div>
                </div>
              </div>
            )}

            {/* Camera Controls when active (Top Right) */}
            {cameraActive && (
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  onClick={handleCalibratePosture}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-white border border-zinc-700 backdrop-blur-sm transition-all text-xs font-medium flex items-center gap-1.5 shadow-md"
                  title="Calibrate your neutral sitting posture to prevent false alerts"
                >
                  <RotateCcw className={`h-3.5 w-3.5 ${isCalibrating ? 'animate-spin text-white' : ''}`} />
                  <span>{isCalibrating ? 'Calibrating...' : 'Calibrate Posture'}</span>
                </button>
                <button
                  onClick={stopCamera}
                  className="p-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 backdrop-blur-sm transition-colors text-xs"
                  title="Turn off webcam"
                >
                  <CameraOff className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Real-time Focus Score Metric bar in Monochrome */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950">
              <div className="text-[10px] font-mono uppercase text-zinc-400 mb-1">
                Real-Time Quality
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-extrabold font-mono text-white">
                  {detectionResult?.focusScoreRealtime || 95}%
                </span>
                <span className="text-[10px] text-zinc-500">Live</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950">
              <div className="text-[10px] font-mono uppercase text-zinc-400 mb-1">
                Distractions
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-extrabold font-mono text-white">
                  {distractionEvents.length}
                </span>
                <span className="text-[10px] text-zinc-500">logged</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950">
              <div className="text-[10px] font-mono uppercase text-zinc-400 mb-1">
                Focus Consistency
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-extrabold font-mono text-white">
                  {sessionDurationSeconds > 0
                    ? Math.round((focusedSeconds / sessionDurationSeconds) * 100)
                    : 100}%
                </span>
                <span className="text-[10px] text-zinc-500">ratio</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Timer, Session Controls & Subject Selection (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Timer Display Card */}
          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl text-center space-y-5">
            {/* Mode Selector Tabs */}
            <div className="inline-flex p-1 rounded-xl bg-zinc-900 border border-zinc-800">
              {[
                { id: 'countdown', label: 'Pomodoro Target' },
                { id: 'stopwatch', label: 'Free Flow Stopwatch' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => !isSessionActive && setTimerMode(m.id as any)}
                  disabled={isSessionActive}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    timerMode === m.id
                      ? 'bg-white text-black font-bold shadow-sm'
                      : 'text-zinc-400 hover:text-white disabled:opacity-50'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Target Duration Selector (Countdown mode only) */}
            {timerMode === 'countdown' && !isSessionActive && (
              <div className="flex flex-wrap justify-center gap-1.5">
                {[15, 25, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => setTimerTargetMinutes(mins)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                      timerTargetMinutes === mins
                        ? 'bg-white text-black font-bold shadow-md'
                        : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
                <button
                  onClick={() => setShowCustomModal(true)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                    ![15, 25, 45, 60].includes(timerTargetMinutes)
                      ? 'bg-white text-black font-bold shadow-md'
                      : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
                  }`}
                >
                  {![15, 25, 45, 60].includes(timerTargetMinutes) ? `${timerTargetMinutes}m` : 'Custom'}
                </button>
              </div>
            )}

            {/* Circular Progress & Giant Digital Tabular Timer */}
            <div className="relative flex items-center justify-center my-3">
              <svg className="w-52 h-52 transform -rotate-90">
                <circle
                  cx="104"
                  cy="104"
                  r="70"
                  stroke="#27272A"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="104"
                  cy="104"
                  r="70"
                  stroke="#FFFFFF"
                  strokeWidth="6"
                  strokeDasharray="440"
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-4xl sm:text-5xl font-black tracking-tight text-white tabular-nums drop-shadow-md">
                  {displayTimer}
                </span>
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mt-1">
                  {isSessionActive 
                    ? (isPaused ? 'PAUSED' : 'FOCUSING') 
                    : (timerMode === 'countdown' ? `${timerTargetMinutes} MIN TARGET` : 'STOPWATCH')}
                </span>
              </div>
            </div>

            <div className="text-xs font-mono text-zinc-400">
              {isSessionActive ? (
                isPaused ? (
                  <span className="text-zinc-300 font-bold">⏸ SESSION PAUSED</span>
                ) : (
                  <span className="text-white font-bold flex items-center justify-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                    <span>AI COMPUTER VISION ACTIVE</span>
                  </span>
                )
              ) : (
                <span>Ready to start focus session</span>
              )}
            </div>

            {/* Main Action Buttons */}
            <div className="flex items-center justify-center gap-2 pt-2">
              {!isSessionActive ? (
                <button
                  onClick={handleStartSession}
                  className="w-full py-3.5 px-6 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-sm transition-all shadow-xl flex items-center justify-center gap-2"
                >
                  <Play className="h-4 w-4 fill-black" />
                  <span>Start Focus Session</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handlePauseResume}
                    className="flex-1 py-3 px-4 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    {isPaused ? <Play className="h-4 w-4 fill-white" /> : <Pause className="h-4 w-4" />}
                    <span>{isPaused ? 'Resume' : 'Pause'}</span>
                  </button>

                  <button
                    onClick={handleResetSession}
                    className="p-3 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
                    title="Reset Session"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>

                  <button
                    onClick={handleCompleteSession}
                    className="flex-1 py-3 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-xs transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <Square className="h-4 w-4 fill-black" />
                    <span>End & Score</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Subject & Topic Selector Card */}
          <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Current Study Topic
              </span>
              <span className="text-[10px] font-mono text-zinc-400 border border-zinc-800 px-2 py-0.5 rounded">
                {user.stream.toUpperCase()} STREAM
              </span>
            </div>

            {/* Subject Selector */}
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1.5">Subject</label>
              <select
                value={selectedSubjectId}
                disabled={isSessionActive}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs text-white focus:border-white focus:outline-none disabled:opacity-60"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sub-Topic Selection */}
            {selectedSubject && selectedSubject.subTopics.length > 0 && (
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1.5">Topic / Chapter</label>
                <select
                  value={selectedTopic}
                  disabled={isSessionActive}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs text-white focus:border-white focus:outline-none disabled:opacity-60"
                >
                  {selectedSubject.subTopics.map((top) => (
                    <option key={top} value={top}>
                      {top}
                    </option>
                  ))}
                  <option value="__custom">-- Enter Custom Sub-Topic --</option>
                </select>
              </div>
            )}

            {/* Custom Sub-topic input */}
            {(selectedTopic === '__custom' || !selectedSubject?.subTopics?.length) && (
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1.5">Custom Topic</label>
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="e.g. Thermodynamics Practice Problems"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-white focus:border-white focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Minutes Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white">Set Custom Study Duration</h3>
            <p className="text-xs text-zinc-400">
              Enter the duration in minutes for this focused session:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="240"
                value={customMinutesInput}
                onChange={(e) => setCustomMinutesInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-sm font-mono text-white focus:outline-none focus:border-white"
                placeholder="e.g. 50"
              />
              <span className="text-xs font-mono text-zinc-400">min</span>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCustomModal(false)}
                className="px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const val = parseInt(customMinutesInput, 10);
                  if (val > 0 && val <= 300) {
                    setTimerTargetMinutes(val);
                  }
                  setShowCustomModal(false);
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-white text-black hover:bg-zinc-200 transition-colors"
              >
                Save Target
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Daily Focus Limit Reached Modal */}
      {showDailyLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-950 p-6 shadow-2xl text-center space-y-4">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xl">
              <Clock className="h-7 w-7" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-white">
                Daily Focus Limit Reached
              </h3>
              <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
                {dailyLimitInfo.plan === 'free' ? (
                  <>
                    You have reached the <span className="font-bold text-white">45-minute daily focus detection limit</span> on the Free Starter plan for today.
                  </>
                ) : (
                  <>
                    You have reached the <span className="font-bold text-white">4-hour daily focus detection limit</span> on the Focus Pro plan for today.
                  </>
                )}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-400">Current Plan:</span>
                <span className="font-bold text-white uppercase">{dailyLimitInfo.plan.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Today's Focus Tracked:</span>
                <span className="font-mono font-bold text-amber-300">{dailyLimitInfo.usedMinutes} minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Daily Quota Resets In:</span>
                <span className="font-mono text-zinc-300">Midnight (00:00)</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  setShowDailyLimitModal(false);
                  onOpenPricing?.(dailyLimitInfo.plan === 'free' ? 'premium' : 'ultra_premium');
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 text-black font-extrabold text-xs hover:from-amber-300 hover:to-amber-200 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <Crown className="h-4 w-4" />
                <span>
                  {dailyLimitInfo.plan === 'free'
                    ? 'Upgrade to 4 Hours or Unlimited (Demo)'
                    : 'Upgrade to Ultra Unlimited (Demo)'}
                </span>
              </button>

              <button
                onClick={() => setShowDailyLimitModal(false)}
                className="w-full py-2.5 rounded-xl border border-zinc-800 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
              >
                Close & Review Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
