/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Smartphone, 
  Monitor, 
  Volume2, 
  Maximize2, 
  CheckSquare, 
  Square, 
  Sparkles, 
  Play, 
  Activity, 
  RotateCcw
} from 'lucide-react';
import { soundscapes, AmbientSoundType } from '../utils/soundscapes';

interface DistractionShieldProps {
  onLaunchStudySession: () => void;
}

export const DistractionShield: React.FC<DistractionShieldProps> = ({
  onLaunchStudySession,
}) => {
  // Checklist items
  const [checklist, setChecklist] = useState<{ [key: string]: boolean }>({
    phoneOut: false,
    tabsClosed: false,
    waterReady: false,
    notesReady: false,
  });

  // 60-Second Box Breathing exercise
  const [breathingActive, setBreathingActive] = useState<boolean>(false);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Rest'>('Inhale');
  const [breathSeconds, setBreathSeconds] = useState<number>(60);

  // Ambient sound selection
  const [selectedAmbient, setSelectedAmbient] = useState<AmbientSoundType>(soundscapes.getCurrentAmbient());
  const [volume, setVolume] = useState<number>(Math.round(soundscapes.getVolume() * 100));

  useEffect(() => {
    let timer: any = null;
    let cycleTimer: any = null;

    if (breathingActive && breathSeconds > 0) {
      timer = setInterval(() => {
        setBreathSeconds((prev) => {
          if (prev <= 1) {
            setBreathingActive(false);
            return 60;
          }
          return prev - 1;
        });
      }, 1000);

      // 4-4-4-4 Box Breathing cycle
      const phases: ('Inhale' | 'Hold' | 'Exhale' | 'Rest')[] = ['Inhale', 'Hold', 'Exhale', 'Rest'];
      let phaseIdx = 0;
      cycleTimer = setInterval(() => {
        phaseIdx = (phaseIdx + 1) % 4;
        setBreathPhase(phases[phaseIdx]);
      }, 4000);
    }

    return () => {
      clearInterval(timer);
      clearInterval(cycleTimer);
    };
  }, [breathingActive, breathSeconds]);

  const toggleChecklist = (key: string) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectSound = (type: AmbientSoundType) => {
    setSelectedAmbient(type);
    soundscapes.playAmbient(type);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    soundscapes.setVolume(val / 100);
  };

  const allChecked = Object.values(checklist).every(Boolean);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-zinc-800 bg-zinc-950">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">
              FOCURA · ATTENTION PERIMETER
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white mt-1">
            Distraction-Control Shield
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Eliminate environmental interruptions and prime cognitive focus before starting your Computer Vision session.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Pre-Flight Study Checklist (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                Pre-Session Isolation Checklist
              </div>
              <span className="text-[11px] font-mono text-white bg-zinc-900 border border-zinc-700 px-2 py-0.5 rounded font-bold">
                {Object.values(checklist).filter(Boolean).length}/4 Complete
              </span>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: 'phoneOut',
                  title: 'Physical Phone Friction Barrier',
                  desc: 'Phone placed in another room or inside a drawer to stop reflex checking.',
                  icon: Smartphone,
                },
                {
                  id: 'tabsClosed',
                  title: 'Single-Tab Academic Isolation',
                  desc: 'Close social media feeds, messaging apps, and background entertainment.',
                  icon: Monitor,
                },
                {
                  id: 'waterReady',
                  title: 'Hydration & Clean Work Surface',
                  desc: 'Water at desk to prevent unnecessary breaks during high-focus sprints.',
                  icon: ShieldCheck,
                },
                {
                  id: 'notesReady',
                  title: 'Required Textbooks & Derivation Notebooks Open',
                  desc: 'Position study materials before starting the Computer Vision timer.',
                  icon: CheckSquare,
                },
              ].map((item) => {
                const isChecked = checklist[item.id];
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleChecklist(item.id)}
                    className={`w-full p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
                      isChecked
                        ? 'border-white bg-white text-black font-semibold shadow-md'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-white'
                    }`}
                  >
                    <div className="mt-0.5">
                      {isChecked ? (
                        <CheckSquare className="h-4 w-4 text-black shrink-0" />
                      ) : (
                        <Square className="h-4 w-4 text-zinc-600 shrink-0" />
                      )}
                    </div>
                    <div>
                      <div className={`text-xs font-bold ${isChecked ? 'text-black' : 'text-zinc-200'}`}>
                        {item.title}
                      </div>
                      <div className={`text-[11px] mt-0.5 leading-relaxed ${isChecked ? 'text-zinc-700' : 'text-zinc-400'}`}>
                        {item.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={onLaunchStudySession}
              className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${
                allChecked
                  ? 'bg-white hover:bg-zinc-200 text-black shadow-xl'
                  : 'border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white'
              }`}
            >
              <Play className={`h-3.5 w-3.5 ${allChecked ? 'fill-black' : 'fill-current'}`} />
              <span>{allChecked ? 'Launch Study Room (All Protocols Met)' : 'Launch Study Room'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: 60-Sec Mindful Reset & Acoustic Shields (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* 60-Second Box Breathing Reset */}
          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xl space-y-4 text-center">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 text-left">
              <div>
                <div className="text-xs font-bold text-white uppercase tracking-wider">
                  60-Second Attention Reset
                </div>
                <div className="text-[11px] text-zinc-400">Box Breathing (4-4-4-4) to settle pre-study anxiety</div>
              </div>
              <Activity className="h-4 w-4 text-white" />
            </div>

            <div className="py-4">
              <div
                className={`mx-auto h-28 w-28 rounded-full border-2 flex flex-col items-center justify-center transition-all duration-1000 ${
                  breathingActive
                    ? breathPhase === 'Inhale'
                      ? 'scale-110 border-white bg-zinc-900'
                      : breathPhase === 'Hold'
                      ? 'scale-110 border-zinc-400 bg-zinc-850'
                      : 'scale-90 border-zinc-600 bg-zinc-950'
                    : 'border-zinc-800 bg-zinc-900/60'
                }`}
              >
                <span className="text-xs font-mono font-bold text-white uppercase">
                  {breathingActive ? breathPhase : 'Ready'}
                </span>
                {breathingActive && (
                  <span className="text-lg font-black font-mono text-white">
                    {breathSeconds}s
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-center gap-3">
              {!breathingActive ? (
                <button
                  onClick={() => setBreathingActive(true)}
                  className="py-2 px-5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-colors shadow-md"
                >
                  Start 60s Breathing
                </button>
              ) : (
                <button
                  onClick={() => {
                    setBreathingActive(false);
                    setBreathSeconds(60);
                  }}
                  className="py-2 px-4 rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white text-xs font-mono"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Acoustic Focus Soundscapes */}
          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                Acoustic Frequency Masking
              </div>
              <Volume2 className="h-4 w-4 text-white" />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'binaural', label: 'Binaural Alpha', desc: '10Hz focus synchronization' },
                { id: 'rain', label: 'Soft Rainfall', desc: 'Pink-noise distraction barrier' },
                { id: 'library', label: 'Library Solitude', desc: 'Brownian soft ambience' },
                { id: 'whitenoise', label: 'White Noise', desc: 'Full spectrum acoustic cover' },
              ].map((s) => {
                const isActive = selectedAmbient === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSelectSound(s.id as AmbientSoundType)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'border-white bg-white text-black font-bold shadow-md'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold">{s.label}</div>
                    <div className={`text-[10px] mt-0.5 ${isActive ? 'text-zinc-700' : 'text-zinc-500'}`}>{s.desc}</div>
                  </button>
                );
              })}
            </div>

            {selectedAmbient !== 'none' && (
              <div className="pt-2 border-t border-zinc-800 space-y-1">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Sound Volume</span>
                  <span className="font-mono text-zinc-200">{volume}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
