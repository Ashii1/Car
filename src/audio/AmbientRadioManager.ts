// ============================================================================
// AMBIENT SYNTH-WAVE DYNAMIC RADIO STATION MANAGER
// Web Audio API procedural synthesis for dynamic in-car / in-ride radio tracks
// ============================================================================

export interface RadioStation {
  id: string;
  name: string;
  freq: string;
  genre: string;
  currentTrack: string;
  bpm: number;
  scale: number[]; // MIDI note frequencies
  bassNotes: number[];
  color: string;
}

export const RADIO_STATIONS: RadioStation[] = [
  {
    id: 'synthwave',
    name: 'Synthwave Express',
    freq: '98.4 FM',
    genre: 'Outrun / Darksynth',
    currentTrack: 'Neon Horizon',
    bpm: 124,
    scale: [220, 261.63, 293.66, 329.63, 392.0, 440, 523.25], // Am pentatonic/minor
    bassNotes: [55, 65.41, 73.42, 82.41],
    color: '#06b6d4',
  },
  {
    id: 'chillwave',
    name: 'Neon Highway',
    freq: '101.2 FM',
    genre: 'Retro Chillwave',
    currentTrack: 'Midnight Coast',
    bpm: 104,
    scale: [261.63, 293.66, 329.63, 392.0, 440, 523.25, 587.33], // C major / A minor
    bassNotes: [65.41, 82.41, 98.0, 110.0],
    color: '#ec4899',
  },
  {
    id: 'cyberpunk',
    name: 'Cyber City 2088',
    freq: '105.7 FM',
    genre: 'Electro Cyberpunk',
    currentTrack: 'Grid Runner',
    bpm: 134,
    scale: [196.0, 220.0, 233.08, 293.66, 329.63, 392.0], // G minor / Phrygian
    bassNotes: [48.99, 55.0, 58.27, 73.42],
    color: '#a855f7',
  },
  {
    id: 'tamil_beats',
    name: 'Tamil Road Beats',
    freq: '92.5 FM',
    genre: 'Carnatic Synth Fusion',
    currentTrack: 'ECR Highway Groove',
    bpm: 120,
    scale: [220, 246.94, 277.18, 329.63, 370.0, 440], // Fusion pentatonic
    bassNotes: [55, 61.74, 69.3, 82.41],
    color: '#f59e0b',
  },
  {
    id: 'off',
    name: 'Radio Off',
    freq: 'OFF',
    genre: 'Silence',
    currentTrack: 'Muted',
    bpm: 0,
    scale: [],
    bassNotes: [],
    color: '#71717a',
  },
];

class AmbientRadioManager {
  private ctx: AudioContext | null = null;
  private currentStationIndex = 0;
  private isPlaying = false;
  private isMuted = false;
  private radioGain: GainNode | null = null;
  private timerId: number | null = null;
  private step = 0;
  private callbacks: ((station: RadioStation) => void)[] = [];

  constructor() {
    try {
      const saved = localStorage.getItem('sr_radio_station');
      if (saved !== null) {
        const idx = parseInt(saved, 10);
        if (!isNaN(idx) && idx >= 0 && idx < RADIO_STATIONS.length) {
          this.currentStationIndex = idx;
        }
      }
    } catch {}
  }

  private initContext() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.radioGain = this.ctx.createGain();
      this.radioGain.gain.setValueAtTime(0.45, this.ctx.currentTime);
      this.radioGain.connect(this.ctx.destination);
    } catch {}
  }

  public ensureContext() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public subscribe(cb: (station: RadioStation) => void): () => void {
    this.callbacks.push(cb);
    cb(this.getCurrentStation());
    return () => {
      this.callbacks = this.callbacks.filter((c) => c !== cb);
    };
  }

  private notify() {
    const station = this.getCurrentStation();
    this.callbacks.forEach((cb) => cb(station));
  }

  public getCurrentStation(): RadioStation {
    return RADIO_STATIONS[this.currentStationIndex];
  }

  public getStationIndex(): number {
    return this.currentStationIndex;
  }

  public nextStation(): RadioStation {
    this.playTunerStatic();
    this.currentStationIndex = (this.currentStationIndex + 1) % RADIO_STATIONS.length;
    try {
      localStorage.setItem('sr_radio_station', this.currentStationIndex.toString());
    } catch {}
    this.restartPlayback();
    this.notify();
    return this.getCurrentStation();
  }

  public prevStation(): RadioStation {
    this.playTunerStatic();
    this.currentStationIndex =
      (this.currentStationIndex - 1 + RADIO_STATIONS.length) % RADIO_STATIONS.length;
    try {
      localStorage.setItem('sr_radio_station', this.currentStationIndex.toString());
    } catch {}
    this.restartPlayback();
    this.notify();
    return this.getCurrentStation();
  }

  public setStation(index: number): RadioStation {
    if (index >= 0 && index < RADIO_STATIONS.length) {
      this.playTunerStatic();
      this.currentStationIndex = index;
      try {
        localStorage.setItem('sr_radio_station', this.currentStationIndex.toString());
      } catch {}
      this.restartPlayback();
      this.notify();
    }
    return this.getCurrentStation();
  }

  public playTunerStatic() {
    this.ensureContext();
    if (!this.ctx || !this.radioGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      // White noise burst mimicking radio tuning between stations
      const bufferSize = this.ctx.sampleRate * 0.16;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.45;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.Q.setValueAtTime(1.8, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.radioGain);

      noise.start(now);
      noise.stop(now + 0.16);
    } catch {}
  }

  public start() {
    this.ensureContext();
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.step = 0;
    this.scheduleNextBeat();
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  private restartPlayback() {
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.step = 0;
    if (this.isPlaying) {
      this.scheduleNextBeat();
    }
  }

  private scheduleNextBeat() {
    if (!this.isPlaying) return;
    const station = this.getCurrentStation();
    if (station.id === 'off' || station.bpm <= 0) {
      this.timerId = window.setTimeout(() => this.scheduleNextBeat(), 500);
      return;
    }

    const interval = (60 / station.bpm / 4) * 1000; // 16th note interval in ms
    this.playStep(station, this.step);
    this.step = (this.step + 1) % 64;

    this.timerId = window.setTimeout(() => this.scheduleNextBeat(), interval);
  }

  private playStep(station: RadioStation, step: number) {
    if (!this.ctx || !this.radioGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // 1. Kick Drum on beats 0, 4, 8, 12... (Quarter notes)
    if (step % 4 === 0) {
      const kickOsc = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(140, now);
      kickOsc.frequency.exponentialRampToValueAtTime(38, now + 0.08);

      kickGain.gain.setValueAtTime(0.5, now);
      kickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      kickOsc.connect(kickGain);
      kickGain.connect(this.radioGain);
      kickOsc.start(now);
      kickOsc.stop(now + 0.13);
    }

    // 2. Snare / Clapped Noise on beats 4, 12 (2 and 4 in 4/4)
    if (step % 8 === 4) {
      const snareOsc = this.ctx.createOscillator();
      const snareGain = this.ctx.createGain();
      snareOsc.type = 'triangle';
      snareOsc.frequency.setValueAtTime(220, now);

      snareGain.gain.setValueAtTime(0.25, now);
      snareGain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);

      snareOsc.connect(snareGain);
      snareGain.connect(this.radioGain);
      snareOsc.start(now);
      snareOsc.stop(now + 0.1);
    }

    // 3. Rolling 16th-note Arpeggiated Synth Bassline
    const bassIdx = Math.floor(step / 16) % station.bassNotes.length;
    const baseFreq = station.bassNotes[bassIdx] || 55;
    const oct = step % 2 === 0 ? 1 : 2;

    const bassOsc = this.ctx.createOscillator();
    const bassFilter = this.ctx.createBiquadFilter();
    const bassGain = this.ctx.createGain();

    bassOsc.type = 'sawtooth';
    bassOsc.frequency.setValueAtTime(baseFreq * oct, now);

    bassFilter.type = 'lowpass';
    bassFilter.frequency.setValueAtTime(step % 4 === 0 ? 950 : 650, now);
    bassFilter.Q.setValueAtTime(4, now);

    bassGain.gain.setValueAtTime(0.22, now);
    bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    bassOsc.connect(bassFilter);
    bassFilter.connect(bassGain);
    bassGain.connect(this.radioGain);
    bassOsc.start(now);
    bassOsc.stop(now + 0.13);

    // 4. Melodic Arp / Pad Lead Chords on 16th notes
    if (step % 2 === 0 && station.scale.length > 0) {
      const arpIdx = (step * 3) % station.scale.length;
      const leadFreq = station.scale[arpIdx];

      const leadOsc = this.ctx.createOscillator();
      const leadGain = this.ctx.createGain();

      leadOsc.type = 'triangle';
      leadOsc.frequency.setValueAtTime(leadFreq, now);

      leadGain.gain.setValueAtTime(0.14, now);
      leadGain.gain.exponentialRampToValueAtTime(0.005, now + 0.22);

      leadOsc.connect(leadGain);
      leadGain.connect(this.radioGain);
      leadOsc.start(now);
      leadOsc.stop(now + 0.23);
    }
  }

  public setVolume(vol: number) {
    if (!this.ctx || !this.radioGain) return;
    this.radioGain.gain.setTargetAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime, 0.05);
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.radioGain && this.ctx) {
      this.radioGain.gain.setValueAtTime(muted ? 0 : 0.45, this.ctx.currentTime);
    }
  }
}

export const ambientRadio = new AmbientRadioManager();
