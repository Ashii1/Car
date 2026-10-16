import { AutomotiveDriveMode, CarDesignStyle } from '../3d/ModernCarBuilder';

export interface ReplayFrame {
  time: number; // recording timeline offset in seconds (0.0 to 30.0)
  x: number;
  y: number;
  z: number;
  heading: number;
  pitch: number;
  roll: number;
  speed: number;
  rpmRatio: number;
  steer: number;
  throttle: number;
  brake: number;
  isBraking: boolean;
  isNitro: boolean;
  gear: string;
  aeroAngle: number;
  downforceKg: number;
  isAirbrake: boolean;
  carStyle: CarDesignStyle;
  driveMode: AutomotiveDriveMode;
  ambientColor: string;
}

export interface SavedReplayClip {
  id: string;
  title: string;
  savedAt: number;
  duration: number;
  topSpeed: number;
  carStyle: CarDesignStyle;
  driveMode: AutomotiveDriveMode;
  frames: ReplayFrame[];
}

const MAX_RECORD_SECONDS = 30.0;
const STORAGE_KEY = 'open_city_saved_replays';

export class ReplayRecorder {
  private frames: ReplayFrame[] = [];
  private recordingElapsed = 0;
  private sampleInterval = 0.04; // 25 FPS capture rate (ultra-smooth replay with lerp interpolation)
  private timeSinceLastSample = 0;

  public recordFrame(
    state: {
      x: number;
      y: number;
      z: number;
      heading: number;
      pitchAngle?: number;
      leanAngle?: number;
      speed: number;
      rpmRatio: number;
      isBraking: boolean;
      isNitroActive?: boolean;
    },
    inputs: {
      steer: number;
      throttle: number;
      brake: number;
    },
    carInfo: {
      gear?: string;
      aeroAngle?: number;
      downforceKg?: number;
      isAirbrake?: boolean;
      carStyle?: CarDesignStyle;
      driveMode?: AutomotiveDriveMode;
      ambientColor?: string;
    },
    delta: number
  ) {
    this.recordingElapsed += Math.max(0.001, delta);
    this.timeSinceLastSample += delta;

    // Throttle to 25 FPS for zero main-thread lag while driving
    if (this.timeSinceLastSample < this.sampleInterval) {
      return;
    }
    this.timeSinceLastSample = 0;

    const frame: ReplayFrame = {
      time: this.recordingElapsed,
      x: state.x,
      y: state.y,
      z: state.z,
      heading: state.heading,
      pitch: state.pitchAngle ?? 0,
      roll: state.leanAngle ?? 0,
      speed: state.speed,
      rpmRatio: state.rpmRatio,
      steer: inputs.steer,
      throttle: inputs.throttle,
      brake: inputs.brake,
      isBraking: state.isBraking,
      isNitro: Boolean(state.isNitroActive),
      gear: carInfo.gear || (Math.abs(state.speed) < 1.0 ? 'P' : 'D1'),
      aeroAngle: carInfo.aeroAngle ?? 0,
      downforceKg: carInfo.downforceKg ?? 0,
      isAirbrake: Boolean(carInfo.isAirbrake),
      carStyle: carInfo.carStyle || 'bmw_m',
      driveMode: carInfo.driveMode || 'SPORT+',
      ambientColor: carInfo.ambientColor || '#ef4444',
    };

    this.frames.push(frame);

    // Fast bulk prune: count expired frames and slice/splice once instead of shifting per-frame
    const cutoffTime = this.recordingElapsed - MAX_RECORD_SECONDS;
    let pruneCount = 0;
    while (pruneCount < this.frames.length - 2 && this.frames[pruneCount].time < cutoffTime) {
      pruneCount++;
    }
    if (pruneCount > 0) {
      this.frames.splice(0, pruneCount);
    }
  }

  public getDuration(): number {
    if (this.frames.length < 2) return 0;
    return Math.min(
      MAX_RECORD_SECONDS,
      this.frames[this.frames.length - 1].time - this.frames[0].time
    );
  }

  public getFrames(): ReplayFrame[] {
    return [...this.frames];
  }

  public getRawFrames(): readonly ReplayFrame[] {
    return this.frames;
  }

  /**
   * Samples / interpolates the replay buffer at a given relative time (0 to duration).
   */
  public interpolateFrame(relativeTime: number): ReplayFrame | null {
    if (this.frames.length === 0) return null;
    if (this.frames.length === 1) return this.frames[0];

    const startTime = this.frames[0].time;
    const targetAbsTime = startTime + Math.max(0, relativeTime);

    if (targetAbsTime <= this.frames[0].time) return this.frames[0];
    if (targetAbsTime >= this.frames[this.frames.length - 1].time) {
      return this.frames[this.frames.length - 1];
    }

    // Binary search for surrounding frames
    let low = 0;
    let high = this.frames.length - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (this.frames[mid].time === targetAbsTime) return this.frames[mid];
      if (this.frames[mid].time < targetAbsTime) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    const idx0 = Math.max(0, high);
    const idx1 = Math.min(this.frames.length - 1, idx0 + 1);
    const f0 = this.frames[idx0];
    const f1 = this.frames[idx1];

    const span = Math.max(0.0001, f1.time - f0.time);
    const t = Math.max(0, Math.min(1, (targetAbsTime - f0.time) / span));

    // Linear / angular interpolation
    const lerp = (a: number, b: number) => a + (b - a) * t;

    // Angle interpolation for heading
    let dHeading = f1.heading - f0.heading;
    while (dHeading > Math.PI) dHeading -= Math.PI * 2;
    while (dHeading < -Math.PI) dHeading += Math.PI * 2;
    const heading = f0.heading + dHeading * t;

    return {
      time: targetAbsTime - startTime,
      x: lerp(f0.x, f1.x),
      y: lerp(f0.y, f1.y),
      z: lerp(f0.z, f1.z),
      heading,
      pitch: lerp(f0.pitch, f1.pitch),
      roll: lerp(f0.roll, f1.roll),
      speed: lerp(f0.speed, f1.speed),
      rpmRatio: lerp(f0.rpmRatio, f1.rpmRatio),
      steer: lerp(f0.steer, f1.steer),
      throttle: lerp(f0.throttle, f1.throttle),
      brake: lerp(f0.brake, f1.brake),
      isBraking: t < 0.5 ? f0.isBraking : f1.isBraking,
      isNitro: t < 0.5 ? f0.isNitro : f1.isNitro,
      gear: t < 0.5 ? f0.gear : f1.gear,
      aeroAngle: lerp(f0.aeroAngle, f1.aeroAngle),
      downforceKg: Math.round(lerp(f0.downforceKg, f1.downforceKg)),
      isAirbrake: t < 0.5 ? f0.isAirbrake : f1.isAirbrake,
      carStyle: t < 0.5 ? f0.carStyle : f1.carStyle,
      driveMode: t < 0.5 ? f0.driveMode : f1.driveMode,
      ambientColor: t < 0.5 ? f0.ambientColor : f1.ambientColor,
    };
  }

  public saveClip(title?: string): SavedReplayClip | null {
    if (this.frames.length < 5) return null;

    const duration = this.getDuration();
    const baseTime = this.frames[0].time;
    // Normalize timestamps relative to start (0.0 to duration)
    const normalizedFrames: ReplayFrame[] = this.frames.map((f) => ({
      ...f,
      time: Math.round((f.time - baseTime) * 1000) / 1000,
    }));

    const maxSpeed = Math.round(
      Math.max(...this.frames.map((f) => Math.abs(f.speed)))
    );

    const latestFrame = this.frames[this.frames.length - 1];

    const clip: SavedReplayClip = {
      id: `replay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title:
        title ||
        `${latestFrame.carStyle === 'bmw_m' ? 'BMW i5 M60' : 'Mercedes-AMG GT'} ${maxSpeed} KM/H RUN`,
      savedAt: Date.now(),
      duration: Math.round(duration * 10) / 10,
      topSpeed: maxSpeed,
      carStyle: latestFrame.carStyle,
      driveMode: latestFrame.driveMode,
      frames: normalizedFrames,
    };

    try {
      const saved = this.getSavedClips();
      // Keep up to 8 saved clips
      const updated = [clip, ...saved].slice(0, 8);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not persist replay to localStorage', e);
    }

    return clip;
  }

  public getSavedClips(): SavedReplayClip[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch {}
    return [];
  }

  public deleteSavedClip(id: string): void {
    try {
      const saved = this.getSavedClips().filter((c) => c.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch {}
  }

  public loadClip(clip: SavedReplayClip): void {
    this.frames = clip.frames.map((f) => ({ ...f }));
    this.recordingElapsed = clip.duration;
  }

  public clear(): void {
    this.frames = [];
    this.recordingElapsed = 0;
  }
}

export const globalReplayRecorder = new ReplayRecorder();
