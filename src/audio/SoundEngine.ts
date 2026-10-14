class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private engineGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  // Engine sound nodes
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private isEngineRunning: boolean = false;

  // Wind noise nodes
  private windNode: AudioNode | null = null;
  private windGain: GainNode | null = null;

  // Music synth sequencer
  private isMusicPlaying: boolean = false;
  private musicInterval: number | null = null;
  private musicStep: number = 0;

  // Nitro node
  private nitroGain: GainNode | null = null;

  constructor() {
    try {
      this.isMuted = localStorage.getItem('street_riders_muted') === 'true';
    } catch {}
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    try {
      localStorage.setItem('street_riders_muted', muted ? 'true' : 'false');
    } catch {}
    this.ensureContext();
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(muted ? 0 : 1.0, this.ctx.currentTime);
    }
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Category Gains
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.engineGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.65, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.initWindNoise();
    } catch {
      // AudioContext may be restricted until first gesture
    }
  }

  public ensureContext() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolumes(engineVol: number, sfxVol: number, musicVol: number) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.engineGain) this.engineGain.gain.setTargetAtTime(engineVol, now, 0.05);
    if (this.sfxGain) this.sfxGain.gain.setTargetAtTime(sfxVol, now, 0.05);
    if (this.musicGain) this.musicGain.gain.setTargetAtTime(musicVol, now, 0.05);
  }

  public startEngine(soundType: 'inline4' | 'v4' | 'twin' | 'turbo' = 'inline4') {
    this.ensureContext();
    if (!this.ctx || this.isEngineRunning || !this.engineGain) return;

    try {
      const now = this.ctx.currentTime;

      // Filter for engine body
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(450, now);
      this.engineFilter.Q.setValueAtTime(soundType === 'inline4' ? 3.0 : 2.0, now);

      // Osc 1 - Main piston buzz
      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = soundType === 'twin' ? 'sawtooth' : 'triangle';
      this.osc1.frequency.setValueAtTime(55, now);

      // Osc 2 - High cylinder harmonic
      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = 'sawtooth';
      this.osc2.frequency.setValueAtTime(110, now);

      // Sub Osc - Low-end exhaust rumble
      this.subOsc = this.ctx.createOscillator();
      this.subOsc.type = 'sine';
      this.subOsc.frequency.setValueAtTime(27.5, now);

      const oscGain1 = this.ctx.createGain();
      oscGain1.gain.setValueAtTime(0.4, now);
      this.osc1.connect(oscGain1);
      oscGain1.connect(this.engineFilter);

      const oscGain2 = this.ctx.createGain();
      oscGain2.gain.setValueAtTime(soundType === 'inline4' ? 0.35 : 0.2, now);
      this.osc2.connect(oscGain2);
      oscGain2.connect(this.engineFilter);

      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0.6, now);
      this.subOsc.connect(subGain);
      subGain.connect(this.engineFilter);

      this.engineFilter.connect(this.engineGain);

      this.osc1.start();
      this.osc2.start();
      this.subOsc.start();

      this.isEngineRunning = true;
    } catch {
      // Audio start error
    }
  }

  public updateEngine(rpmRatio: number, throttle: number, speedKmh: number) {
    if (!this.ctx || !this.isEngineRunning || !this.osc1 || !this.osc2 || !this.subOsc || !this.engineFilter) return;

    const now = this.ctx.currentTime;
    // Base frequency spans from 45Hz idle to 380Hz screaming redline
    const baseFreq = 42 + Math.pow(Math.max(0, Math.min(1, rpmRatio)), 1.25) * 320;

    this.osc1.frequency.setTargetAtTime(baseFreq, now, 0.04);
    this.osc2.frequency.setTargetAtTime(baseFreq * 2.01, now, 0.04);
    this.subOsc.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.04);

    // Filter opens up as throttle is applied
    const cutoff = 380 + rpmRatio * 1800 + (throttle > 0.1 ? 900 : 0);
    this.engineFilter.frequency.setTargetAtTime(cutoff, now, 0.06);

    // Update wind noise based on speed
    if (this.windGain) {
      const windTarget = Math.pow(Math.min(1, speedKmh / 280), 2) * 0.45;
      this.windGain.gain.setTargetAtTime(windTarget, now, 0.1);
    }
  }

  public stopEngine() {
    if (!this.isEngineRunning) return;
    try {
      this.osc1?.stop();
      this.osc2?.stop();
      this.subOsc?.stop();
      this.osc1?.disconnect();
      this.osc2?.disconnect();
      this.subOsc?.disconnect();
      this.engineFilter?.disconnect();
    } catch {}
    this.isEngineRunning = false;
    this.osc1 = null;
    this.osc2 = null;
    this.subOsc = null;
    this.engineFilter = null;
  }

  private initWindNoise() {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(600, this.ctx.currentTime);
      filter.Q.setValueAtTime(1.0, this.ctx.currentTime);

      this.windGain = this.ctx.createGain();
      this.windGain.gain.setValueAtTime(0, this.ctx.currentTime);

      noise.connect(filter);
      filter.connect(this.windGain);
      this.windGain.connect(this.sfxGain);

      noise.start();
      this.windNode = noise;
    } catch {}
  }

  public playGearShift(direction: 'up' | 'down' = 'up') {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      // Mechanical clutch clunk
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(direction === 'up' ? 180 : 130, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.09);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.1);

      // Exhaust pop on upshift
      if (direction === 'up' && Math.random() > 0.3) {
        this.playExhaustPop();
      }
    } catch {}
  }

  public playExhaustPop() {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(20, now + 0.06);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.07);
    } catch {}
  }

  public playBrakeSqueal() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2400 + Math.random() * 400, now);
      osc.frequency.linearRampToValueAtTime(2000, now + 0.2);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.26);
    } catch {}
  }

  public setNitro(active: boolean) {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;
    if (active) {
      if (!this.nitroGain) {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);

        this.nitroGain = this.ctx.createGain();
        this.nitroGain.gain.setValueAtTime(0.3, now);

        osc.connect(this.nitroGain);
        this.nitroGain.connect(this.sfxGain);
        osc.start();
      }
    } else {
      if (this.nitroGain) {
        this.nitroGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
        setTimeout(() => {
          this.nitroGain?.disconnect();
          this.nitroGain = null;
        }, 100);
      }
    }
  }

  public playCountdown(num: number) {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      if (num > 0) {
        // 3, 2, 1 tone
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.3);
      } else {
        // GO! tone
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
        osc.start(now);
        osc.stop(now + 0.75);
      }

      osc.connect(gain);
      gain.connect(this.sfxGain);
    } catch {}
  }

  public playCrash() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      // Low impact crunch
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);

      gain.gain.setValueAtTime(0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.5);
    } catch {}
  }

  public playUIClick() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch {}
  }

  public playVictory() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const notes = [440, 554, 659, 880];
      const now = this.ctx.currentTime;
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.3, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.12 + 0.35);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.4);
      });
    } catch {}
  }

  public startMusic() {
    this.ensureContext();
    if (!this.ctx || this.isMusicPlaying || !this.musicGain) return;
    this.isMusicPlaying = true;
    this.musicStep = 0;

    // 130 BPM Electro Synthwave Sequencer
    const stepTimeMs = (60 / 130 / 4) * 1000; // 16th notes
    const bassNotes = [36.7, 36.7, 36.7, 43.6, 36.7, 36.7, 49.0, 43.6]; // D1, F1, G1
    const leadNotes = [293.66, 329.63, 349.23, 440.0, 392.0, 349.23, 329.63, 293.66]; // D4, E4, F4, A4...

    this.musicInterval = window.setInterval(() => {
      if (!this.ctx || !this.isMusicPlaying || !this.musicGain) return;
      const now = this.ctx.currentTime;
      const step = this.musicStep % 16;

      // Kick on 0, 4, 8, 12
      if (step % 4 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.frequency.setValueAtTime(140, now);
        kickOsc.frequency.exponentialRampToValueAtTime(35, now + 0.08);
        kickGain.gain.setValueAtTime(0.5, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        kickOsc.connect(kickGain);
        kickGain.connect(this.musicGain);
        kickOsc.start(now);
        kickOsc.stop(now + 0.14);
      }

      // Snare / clap on 4 and 12
      if (step === 4 || step === 12) {
        const snareOsc = this.ctx.createOscillator();
        const snareGain = this.ctx.createGain();
        snareOsc.type = 'triangle';
        snareOsc.frequency.setValueAtTime(220, now);
        snareGain.gain.setValueAtTime(0.25, now);
        snareGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        snareOsc.connect(snareGain);
        snareGain.connect(this.musicGain);
        snareOsc.start(now);
        snareOsc.stop(now + 0.16);
      }

      // Bassline on 8th notes
      if (step % 2 === 0) {
        const noteIdx = Math.floor(this.musicStep / 4) % bassNotes.length;
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(bassNotes[noteIdx], now);
        bassGain.gain.setValueAtTime(0.2, now);
        bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        bassOsc.connect(bassGain);
        bassGain.connect(this.musicGain);
        bassOsc.start(now);
        bassOsc.stop(now + 0.14);
      }

      // Arpeggiated synth lead
      if (step % 2 === 1 && (Math.floor(this.musicStep / 16) % 2 === 1)) {
        const leadIdx = (step * 3) % leadNotes.length;
        const leadOsc = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();
        leadOsc.type = 'square';
        leadOsc.frequency.setValueAtTime(leadNotes[leadIdx], now);
        leadGain.gain.setValueAtTime(0.07, now);
        leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        leadOsc.connect(leadGain);
        leadGain.connect(this.musicGain);
        leadOsc.start(now);
        leadOsc.stop(now + 0.12);
      }

      this.musicStep++;
    }, stepTimeMs);
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const soundEngine = new SoundEngine();
