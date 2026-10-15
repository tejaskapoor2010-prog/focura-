// Web Audio API ambient sound generator & focus distraction alerts

export type AmbientSoundType = 'none' | 'binaural' | 'rain' | 'whitenoise' | 'library';

class SoundscapeManager {
  private ctx: AudioContext | null = null;
  private currentAmbient: AmbientSoundType = 'none';
  private masterGain: GainNode | null = null;
  private ambientNodes: { [key: string]: any } = {};
  private volume: number = 0.5;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  /**
   * Gentle, non-jarring chime when distracted for prolonged time
   */
  public playDistractionChime() {
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Soft harmonic bell tone (E5: ~659Hz)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.25 * this.volume, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.25);
    } catch {
      // Audio context restricted or muted
    }
  }

  /**
   * Distinct soft double-tap alert when smartphone usage is detected
   */
  public playPhoneAlertChime() {
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      [0, 0.14].forEach((delay, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(i === 0 ? 520 : 660, now + delay);

        gain.gain.setValueAtTime(0, now + delay);
        gain.gain.linearRampToValueAtTime(0.3 * this.volume, now + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + delay);
        osc.stop(now + delay + 0.36);
      });
    } catch {
      // Audio context restricted
    }
  }

  /**
   * Celebration chime when session finishes
   */
  public playSessionSuccess() {
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const startTime = now + idx * 0.12;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.2 * this.volume, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.7);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.75);
      });
    } catch {
      // Audio context error
    }
  }

  /**
   * Ambient generative soundscapes
   */
  public playAmbient(type: AmbientSoundType) {
    this.stopAmbient();
    this.currentAmbient = type;

    if (type === 'none') return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    if (type === 'binaural') {
      // Alpha wave binaural generator (432Hz left, 442Hz right = 10Hz alpha focus state)
      const oscL = this.ctx.createOscillator();
      const oscR = this.ctx.createOscillator();
      const pannerL = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
      const pannerR = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
      const gain = this.ctx.createGain();

      oscL.type = 'sine';
      oscL.frequency.setValueAtTime(216, this.ctx.currentTime); // Low fundamental
      oscR.type = 'sine';
      oscR.frequency.setValueAtTime(226, this.ctx.currentTime); // 10Hz delta for calm focus

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);

      if (pannerL && pannerR) {
        pannerL.pan.setValueAtTime(-0.8, this.ctx.currentTime);
        pannerR.pan.setValueAtTime(0.8, this.ctx.currentTime);
        oscL.connect(pannerL);
        pannerL.connect(gain);
        oscR.connect(pannerR);
        pannerR.connect(gain);
      } else {
        oscL.connect(gain);
        oscR.connect(gain);
      }

      gain.connect(this.masterGain);
      oscL.start();
      oscR.start();

      this.ambientNodes = { oscL, oscR, gain };
    } else if (type === 'rain' || type === 'whitenoise' || type === 'library') {
      // Generative filtered buffer noise
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (type === 'rain') {
          // Pink-ish noise with gentle drops
          lastOut = (lastOut + 0.02 * white) / 1.02;
          data[i] = lastOut * 3.5;
        } else if (type === 'library') {
          // Soft brown noise
          lastOut = (lastOut + 0.01 * white) / 1.01;
          data[i] = lastOut * 4.0;
        } else {
          // Smooth white noise
          data[i] = white * 0.15;
        }
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      // Filter for soothing acoustic ambiance
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(type === 'rain' ? 850 : type === 'library' ? 380 : 1200, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(type === 'rain' ? 0.15 : 0.08, this.ctx.currentTime);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start();
      this.ambientNodes = { noise, filter, gain };
    }
  }

  public stopAmbient() {
    try {
      if (this.ambientNodes) {
        Object.values(this.ambientNodes).forEach((node) => {
          if (node && typeof node.stop === 'function') {
            node.stop();
          }
          if (node && typeof node.disconnect === 'function') {
            node.disconnect();
          }
        });
        this.ambientNodes = {};
      }
      this.currentAmbient = 'none';
    } catch {
      // Ignored
    }
  }

  public getCurrentAmbient(): AmbientSoundType {
    return this.currentAmbient;
  }
}

export const soundscapes = new SoundscapeManager();
