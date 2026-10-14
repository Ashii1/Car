class CityAudioEngine {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private engineGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  // Engine synth nodes
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private isEngineRunning = false;

  // Police Siren
  private sirenOsc: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private sirenLfo: OscillatorNode | null = null;
  private isSirenActive = false;
  private currentSirenMode: 'wail' | 'yelp' = 'wail';

  // Music loop
  private isMusicPlaying = false;
  private musicInterval: number | null = null;
  private musicStep = 0;

  constructor() {
    try {
      this.isMuted = localStorage.getItem('street_riders_muted') === 'true';
    } catch {}
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.engineGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.65, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);
    } catch {}
  }

  public ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  public setVolumes(engineVol: number, sfxVol: number, musicVol: number) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.engineGain?.gain.setTargetAtTime(engineVol, now, 0.05);
    this.sfxGain?.gain.setTargetAtTime(sfxVol, now, 0.05);
    this.musicGain?.gain.setTargetAtTime(musicVol, now, 0.05);
  }

  public startEngine(soundType: 'twin' | 'inline4' | 'v4' | 'turbo' | 'cruiser' = 'inline4') {
    this.ensureContext();
    if (!this.ctx || this.isEngineRunning || !this.engineGain) return;

    try {
      const now = this.ctx.currentTime;

      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(450, now);
      this.engineFilter.Q.setValueAtTime(soundType === 'inline4' ? 3.2 : 1.8, now);

      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = soundType === 'cruiser' ? 'sawtooth' : (soundType === 'twin' ? 'sawtooth' : 'triangle');
      this.osc1.frequency.setValueAtTime(soundType === 'cruiser' ? 32 : 55, now);

      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = 'sawtooth';
      this.osc2.frequency.setValueAtTime(110, now);

      this.subOsc = this.ctx.createOscillator();
      this.subOsc.type = 'sine';
      this.subOsc.frequency.setValueAtTime(28, now);

      const g1 = this.ctx.createGain();
      g1.gain.setValueAtTime(0.45, now);
      this.osc1.connect(g1);
      g1.connect(this.engineFilter);

      const g2 = this.ctx.createGain();
      g2.gain.setValueAtTime(soundType === 'inline4' ? 0.35 : 0.2, now);
      this.osc2.connect(g2);
      g2.connect(this.engineFilter);

      const subG = this.ctx.createGain();
      subG.gain.setValueAtTime(0.6, now);
      this.subOsc.connect(subG);
      subG.connect(this.engineFilter);

      this.engineFilter.connect(this.engineGain);

      this.osc1.start();
      this.osc2.start();
      this.subOsc.start();
      this.isEngineRunning = true;
    } catch {}
  }

  public updateEngine(rpmRatio: number, throttle: number, speedKmh: number) {
    if (!this.ctx || !this.isEngineRunning || !this.osc1 || !this.osc2 || !this.subOsc || !this.engineFilter) return;

    const now = this.ctx.currentTime;
    const baseFreq = 42 + Math.pow(Math.max(0, Math.min(1, rpmRatio)), 1.25) * 310;

    this.osc1.frequency.setTargetAtTime(baseFreq, now, 0.04);
    this.osc2.frequency.setTargetAtTime(baseFreq * 2.02, now, 0.04);
    this.subOsc.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.04);

    const cutoff = 360 + rpmRatio * 1800 + (throttle > 0.1 ? 850 : 0);
    this.engineFilter.frequency.setTargetAtTime(cutoff, now, 0.06);
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

  public playHorn() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      // High-pitched dual-tone Indian motorcycle/car horn (440Hz + 520Hz)
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(523.25, now);

      gain.gain.setValueAtTime(0.48, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.32);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.sfxGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } catch {}
  }

  // Distant ambient Indian traffic horns (peep-peep, truck dual-tone, auto-rickshaw horn)
  public playIndianTrafficHorn() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const hornType = Math.floor(Math.random() * 3);

      if (hornType === 0) {
        // Double quick chirp "peep-peep" (Commuter bike / Auto horn)
        [0, 0.12].forEach((offset) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(480, now + offset);
          gain.gain.setValueAtTime(0.12, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.005, now + offset + 0.08);
          osc.connect(gain);
          gain.connect(this.sfxGain!);
          osc.start(now + offset);
          osc.stop(now + offset + 0.09);
        });
      } else if (hornType === 1) {
        // Melodic dual-tone truck horn ("paan-poorn")
        const f1 = 349.23; // F4
        const f2 = 440.0;  // A4
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc1.type = 'sawtooth';
        osc2.type = 'sawtooth';
        osc1.frequency.setValueAtTime(f1, now);
        osc2.frequency.setValueAtTime(f2, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.sfxGain);
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.48);
        osc2.stop(now + 0.48);
      } else {
        // Car sharp single beep
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(415, now);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.008, now + 0.22);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.24);
      }
    } catch {}
  }

  // Visceral tire skid/screech when vehicles brake hard or swerve aggressively
  public playTireScreech(intensity = 0.5) {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const duration = 0.35 + Math.random() * 0.2;

      // Friction noise buffer
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.frequency.linearRampToValueAtTime(1850, now + duration * 0.4);
      filter.frequency.exponentialRampToValueAtTime(750, now + duration);
      filter.Q.setValueAtTime(4.5, now);

      // Squeal pitch oscillator
      const squealOsc = this.ctx.createOscillator();
      squealOsc.type = 'sawtooth';
      squealOsc.frequency.setValueAtTime(820, now);
      squealOsc.frequency.linearRampToValueAtTime(1200, now + duration * 0.3);
      squealOsc.frequency.exponentialRampToValueAtTime(580, now + duration);

      const gain = this.ctx.createGain();
      const vol = Math.max(0.08, Math.min(0.40, intensity * 0.28));
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      squealOsc.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(now);
      squealOsc.start(now);
      noise.stop(now + duration);
      squealOsc.stop(now + duration);
    } catch {}
  }

  // Rapid aggressive driver road-rage horn
  public playAggressiveHorn() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      [0, 0.15].forEach((offset) => {
        const osc1 = this.ctx!.createOscillator();
        const osc2 = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc1.type = 'sawtooth';
        osc2.type = 'sawtooth';
        osc1.frequency.setValueAtTime(466.16, now + offset);
        osc2.frequency.setValueAtTime(587.33, now + offset);
        gain.gain.setValueAtTime(0.24, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.12);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.sfxGain!);
        osc1.start(now + offset);
        osc2.start(now + offset);
        osc1.stop(now + offset + 0.13);
        osc2.stop(now + offset + 0.13);
      });
    } catch {}
  }

  // Heavy Tata / Ashok Leyland dual-tone air horn
  public playTruckAirHorn() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(220, now);
      osc2.frequency.setValueAtTime(277.18, now);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.65);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.sfxGain);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.7);
      osc2.stop(now + 0.7);
    } catch {}
  }

  // Dynamic Doppler whoosh when threading the needle past traffic at high speed
  public playNearMissWhoosh() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const duration = 0.28;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + duration);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.frequency.exponentialRampToValueAtTime(300, now + duration);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + duration);
    } catch {}
  }

  public setPoliceSiren(active: boolean, mode: 'wail' | 'yelp' = 'wail') {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    if (active && (!this.isSirenActive || this.currentSirenMode !== mode)) {
      if (this.isSirenActive) {
        try {
          this.sirenOsc?.stop();
          this.sirenLfo?.stop();
          this.sirenOsc?.disconnect();
          this.sirenLfo?.disconnect();
        } catch {}
      }

      try {
        const now = this.ctx.currentTime;
        this.currentSirenMode = mode;
        this.sirenOsc = this.ctx.createOscillator();
        this.sirenGain = this.ctx.createGain();
        this.sirenOsc.type = 'sawtooth';
        this.sirenGain.gain.setValueAtTime(0.2, now);

        const sirenFilter = this.ctx.createBiquadFilter();
        sirenFilter.type = 'bandpass';
        sirenFilter.frequency.setValueAtTime(850, now);
        sirenFilter.Q.setValueAtTime(3.5, now);

        this.sirenOsc.connect(sirenFilter);
        sirenFilter.connect(this.sirenGain);
        this.sirenGain.connect(this.sfxGain);

        // Modulate siren pitch: wail = slow sweeping 0.4Hz, yelp = rapid 2.8Hz
        this.sirenLfo = this.ctx.createOscillator();
        this.sirenLfo.frequency.setValueAtTime(mode === 'yelp' ? 2.8 : 0.45, now);
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.setValueAtTime(mode === 'yelp' ? 320 : 380, now);
        this.sirenLfo.connect(lfoGain);
        lfoGain.connect(this.sirenOsc.frequency);
        this.sirenOsc.frequency.setValueAtTime(mode === 'yelp' ? 850 : 650, now);

        this.sirenLfo.start();
        this.sirenOsc.start();
        this.isSirenActive = true;
      } catch {}
    } else if (!active && this.isSirenActive) {
      try {
        this.sirenOsc?.stop();
        this.sirenLfo?.stop();
        this.sirenOsc?.disconnect();
        this.sirenLfo?.disconnect();
        this.sirenGain?.disconnect();
      } catch {}
      this.isSirenActive = false;
      this.sirenOsc = null;
      this.sirenLfo = null;
      this.sirenGain = null;
    }
  }

  public playPoliceRadioChatter() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      // High-frequency mic squelch click
      const clickOsc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(1600, now);
      clickOsc.frequency.exponentialRampToValueAtTime(800, now + 0.04);
      clickGain.gain.setValueAtTime(0.35, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      clickOsc.connect(clickGain);
      clickGain.connect(this.sfxGain);
      clickOsc.start(now);
      clickOsc.stop(now + 0.06);

      // Low-bitrate noisy voice squelch simulation
      const noiseBuffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.22), this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseBuffer.length; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.sin((i / 80) * Math.PI);
      }
      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1100, now + 0.05);
      bandpass.Q.setValueAtTime(4.0, now + 0.05);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.2, now + 0.05);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.27);

      noiseSource.connect(bandpass);
      bandpass.connect(noiseGain);
      noiseGain.connect(this.sfxGain);
      noiseSource.start(now + 0.05);
      noiseSource.stop(now + 0.28);
    } catch {}
  }

  public playCashSound() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.35, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.3);
      });
    } catch {}
  }

  public playStuntChime() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.15);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch {}
  }

  public startMusic() {
    this.ensureContext();
    if (!this.ctx || this.isMusicPlaying || !this.musicGain) return;
    this.isMusicPlaying = true;
    this.musicStep = 0;

    // 124 BPM Open City Groove
    const stepTimeMs = (60 / 124 / 4) * 1000;
    const bassline = [43.65, 43.65, 51.91, 58.27, 43.65, 38.89, 43.65, 49.0];

    this.musicInterval = window.setInterval(() => {
      if (!this.ctx || !this.isMusicPlaying || !this.musicGain) return;
      const now = this.ctx.currentTime;
      const step = this.musicStep % 16;

      // Kick drum
      if (step % 4 === 0) {
        const kOsc = this.ctx.createOscillator();
        const kGain = this.ctx.createGain();
        kOsc.frequency.setValueAtTime(130, now);
        kOsc.frequency.exponentialRampToValueAtTime(32, now + 0.09);
        kGain.gain.setValueAtTime(0.45, now);
        kGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        kOsc.connect(kGain);
        kGain.connect(this.musicGain);
        kOsc.start(now);
        kOsc.stop(now + 0.14);
      }

      // Snare on 4 and 12
      if (step === 4 || step === 12) {
        const sOsc = this.ctx.createOscillator();
        const sGain = this.ctx.createGain();
        sOsc.type = 'triangle';
        sOsc.frequency.setValueAtTime(210, now);
        sGain.gain.setValueAtTime(0.2, now);
        sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        sOsc.connect(sGain);
        sGain.connect(this.musicGain);
        sOsc.start(now);
        sOsc.stop(now + 0.15);
      }

      // Bassline
      if (step % 2 === 0) {
        const bIdx = Math.floor(this.musicStep / 4) % bassline.length;
        const bOsc = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        bOsc.type = 'sawtooth';
        bOsc.frequency.setValueAtTime(bassline[bIdx], now);
        bGain.gain.setValueAtTime(0.18, now);
        bGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        bOsc.connect(bGain);
        bGain.connect(this.musicGain);
        bOsc.start(now);
        bOsc.stop(now + 0.14);
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

  public playPotholeThud() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.18);
      gain.gain.setValueAtTime(0.65, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.24);

      const metalOsc = this.ctx.createOscillator();
      const metalGain = this.ctx.createGain();
      metalOsc.type = 'triangle';
      metalOsc.frequency.setValueAtTime(320, now);
      metalOsc.frequency.exponentialRampToValueAtTime(140, now + 0.12);
      metalGain.gain.setValueAtTime(0.35, now);
      metalGain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
      metalOsc.connect(metalGain);
      metalGain.connect(this.sfxGain);
      metalOsc.start(now);
      metalOsc.stop(now + 0.15);
    } catch {}
  }

  public playTollBeep() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1480, now);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch {}
  }

  public playGearShiftClick(isDownshift = false) {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      // Mechanical tactile shifter click (dual-clutch actuator)
      const clickOsc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(isDownshift ? 640 : 880, now);
      clickOsc.frequency.exponentialRampToValueAtTime(isDownshift ? 220 : 360, now + 0.05);
      clickGain.gain.setValueAtTime(0.55, now);
      clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
      clickOsc.connect(clickGain);
      clickGain.connect(this.sfxGain);
      clickOsc.start(now);
      clickOsc.stop(now + 0.07);

      // Metallic shift gate snick
      const snickOsc = this.ctx.createOscillator();
      const snickGain = this.ctx.createGain();
      snickOsc.type = 'sine';
      snickOsc.frequency.setValueAtTime(1420, now + 0.01);
      snickOsc.frequency.exponentialRampToValueAtTime(420, now + 0.05);
      snickGain.gain.setValueAtTime(0.3, now + 0.01);
      snickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);
      snickOsc.connect(snickGain);
      snickGain.connect(this.sfxGain);
      snickOsc.start(now + 0.01);
      snickOsc.stop(now + 0.08);
    } catch {}
  }

  public playReverseChime() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1046.5, now);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc1.connect(gain1);
      gain1.connect(this.sfxGain);
      osc1.start(now);
      osc1.stop(now + 0.16);

      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.5, now + 0.08);
      gain2.gain.setValueAtTime(0.25, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc2.connect(gain2);
      gain2.connect(this.sfxGain);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.26);
    } catch {}
  }

  public playCrash(intensity: 'light' | 'heavy' = 'light') {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      // Low impact crunch thud
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(intensity === 'heavy' ? 140 : 180, now);
      bassOsc.frequency.exponentialRampToValueAtTime(24, now + 0.35);
      bassGain.gain.setValueAtTime(intensity === 'heavy' ? 0.85 : 0.55, now);
      bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      bassOsc.connect(bassGain);
      bassGain.connect(this.sfxGain);
      bassOsc.start(now);
      bassOsc.stop(now + 0.42);

      // Metal / fairing scrape noise
      const scrapeOsc = this.ctx.createOscillator();
      const scrapeGain = this.ctx.createGain();
      scrapeOsc.type = 'square';
      scrapeOsc.frequency.setValueAtTime(intensity === 'heavy' ? 620 : 480, now);
      scrapeOsc.frequency.exponentialRampToValueAtTime(110, now + 0.28);
      scrapeGain.gain.setValueAtTime(intensity === 'heavy' ? 0.6 : 0.35, now);
      scrapeGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      scrapeOsc.connect(scrapeGain);
      scrapeGain.connect(this.sfxGain);
      scrapeOsc.start(now);
      scrapeOsc.stop(now + 0.32);
    } catch {}
  }

  public playRepair() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      // Wrench ratchet / pneumatic tool sound
      [0, 0.08, 0.16, 0.24, 0.32].forEach((t, i) => {
        const rOsc = this.ctx!.createOscillator();
        const rGain = this.ctx!.createGain();
        rOsc.type = 'triangle';
        rOsc.frequency.setValueAtTime(450 + i * 90, now + t);
        rGain.gain.setValueAtTime(0.35, now + t);
        rGain.gain.exponentialRampToValueAtTime(0.01, now + t + 0.06);
        rOsc.connect(rGain);
        rGain.connect(this.sfxGain!);
        rOsc.start(now + t);
        rOsc.stop(now + t + 0.07);
      });

      // Finish chime
      const cOsc = this.ctx.createOscillator();
      const cGain = this.ctx.createGain();
      cOsc.type = 'sine';
      cOsc.frequency.setValueAtTime(880, now + 0.42);
      cOsc.frequency.exponentialRampToValueAtTime(1320, now + 0.65);
      cGain.gain.setValueAtTime(0.4, now + 0.42);
      cGain.gain.exponentialRampToValueAtTime(0.01, now + 0.85);
      cOsc.connect(cGain);
      cGain.connect(this.sfxGain);
      cOsc.start(now + 0.42);
      cOsc.stop(now + 0.9);
    } catch {}
  }

  public playWaterSplash(volume = 0.5) {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(85, now + 0.22);
      gain.gain.setValueAtTime(Math.min(0.7, volume), now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.26);
    } catch {}
  }

  public playBusAirBrake() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      // Pneumatic high-pressure air hiss
      const bufferSize = this.ctx.sampleRate * 0.35;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2200, now);
      filter.frequency.exponentialRampToValueAtTime(800, now + 0.32);
      filter.Q.setValueAtTime(2.5, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.55, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(now);
      noise.stop(now + 0.36);

      // Mechanical valve clack at start
      const clack = this.ctx.createOscillator();
      const clackGain = this.ctx.createGain();
      clack.type = 'triangle';
      clack.frequency.setValueAtTime(420, now);
      clack.frequency.exponentialRampToValueAtTime(110, now + 0.05);
      clackGain.gain.setValueAtTime(0.6, now);
      clackGain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
      clack.connect(clackGain);
      clackGain.connect(this.sfxGain);
      clack.start(now);
      clack.stop(now + 0.07);
    } catch {}
  }

  public playTempleBell() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      // Resonant bronze/brass temple bell with rich bell harmonics (587Hz, 1174Hz, 1761Hz)
      const freqs = [587.33, 1174.66, 1761.99, 2349.32];
      const amps = [0.55, 0.35, 0.22, 0.12];

      freqs.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        // Long lingering spiritual bell ring decay
        gain.gain.setValueAtTime(amps[idx], now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.4 - idx * 0.3);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(now);
        osc.stop(now + 2.5);
      });
    } catch {}
  }

  public playFootstep(isSprint = false) {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      // Soft asphalt leather boot thud & scuff
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isSprint ? 95 : 75, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.08);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isSprint ? 450 : 320, now);

      gain.gain.setValueAtTime(isSprint ? 0.22 : 0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.10);
    } catch {}
  }

  public playMountDismountChime(isMount: boolean) {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const f1 = isMount ? 330 : 520;
      const f2 = isMount ? 440 : 392;
      const f3 = isMount ? 660 : 330;

      [f1, f2, f3].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.18, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.22);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.24);
      });
    } catch {}
  }

  public playAutoRickshawHorn() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      // Iconic twin chirp "pip-pip" horn
      [0, 0.12].forEach((offset) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(820, now + offset);
        gain.gain.setValueAtTime(0.4, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.08);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(now + offset);
        osc.stop(now + offset + 0.09);
      });
    } catch {}
  }

  public playDroneChirp() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      // High-tech sci-fi cute robot chirp
      const notes = [1200, 1600, 2100];
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.2, now + idx * 0.05 + 0.04);
        gain.gain.setValueAtTime(0.12, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.08);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.09);
      });
    } catch {}
  }

  public playCollectibleChime() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      // Vibrant sparkling arpeggio for modern kid item pickups
      const arpeggio = [523.25, 659.25, 783.99, 1046.5, 1318.51];
      arpeggio.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.25, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.35);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.38);
      });
    } catch {}
  }

  public playHypeNitro() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.4);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now);
      osc.stop(now + 0.46);
    } catch {}
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
}

export const cityAudio = new CityAudioEngine();
