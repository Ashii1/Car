import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Rewind,
  Camera,
  Save,
  FolderOpen,
  X,
  Volume2,
  Maximize2,
  Film,
  Sparkles,
  Gauge,
  Wind,
  Check,
  Trash2,
  ChevronRight,
  Clock,
  Layers,
} from 'lucide-react';
import { SavedReplayClip } from '../game/ReplayRecorder';

export type CinematicCameraAngle =
  | 'tv_broadcast'
  | 'wheel_apex'
  | 'flyby_orbit'
  | 'heli_drone'
  | 'cockpit_interior'
  | 'cinematic_chase';

interface ReplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  playbackSpeed: number;
  cameraAngle: CinematicCameraAngle;
  isLooping: boolean;
  onPlayPauseToggle: () => void;
  onSeek: (time: number) => void;
  onSpeedChange: (speed: number) => void;
  onCameraAngleChange: (angle: CinematicCameraAngle) => void;
  onLoopToggle: () => void;
  onSaveClip: (title?: string) => SavedReplayClip | null;
  savedClips: SavedReplayClip[];
  onLoadSavedClip: (id: string) => void;
  onDeleteSavedClip: (id: string) => void;
  telemetry?: {
    speed: number;
    gear: string;
    rpmRatio: number;
    aeroAngle: number;
    downforceKg: number;
    isAirbrake: boolean;
    carStyle: 'bmw_m' | 'benz_amg';
    driveMode: string;
  };
}

export const ReplayModal: React.FC<ReplayModalProps> = ({
  isOpen,
  onClose,
  currentTime,
  duration,
  isPlaying,
  playbackSpeed,
  cameraAngle,
  isLooping,
  onPlayPauseToggle,
  onSeek,
  onSpeedChange,
  onCameraAngleChange,
  onLoopToggle,
  onSaveClip,
  savedClips,
  onLoadSavedClip,
  onDeleteSavedClip,
  telemetry,
}) => {
  const [showSavedClipsDrawer, setShowSavedClipsDrawer] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [isLetterbox, setIsLetterbox] = useState(true);
  const [clipTitleInput, setClipTitleInput] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const scrubberRef = useRef<HTMLDivElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  // Keyboard navigation inside Replay Player (Space, 1-6, Left/Right)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        onPlayPauseToggle();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        onSeek(Math.max(0, currentTime - 3));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        onSeek(Math.min(duration, currentTime + 3));
      } else if (e.code === 'Digit1') {
        onCameraAngleChange('tv_broadcast');
      } else if (e.code === 'Digit2') {
        onCameraAngleChange('wheel_apex');
      } else if (e.code === 'Digit3') {
        onCameraAngleChange('flyby_orbit');
      } else if (e.code === 'Digit4') {
        onCameraAngleChange('heli_drone');
      } else if (e.code === 'Digit5') {
        onCameraAngleChange('cockpit_interior');
      } else if (e.code === 'Digit6') {
        onCameraAngleChange('cinematic_chase');
      } else if (e.code === 'KeyL') {
        onLoopToggle();
      } else if (e.code === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentTime, duration, onPlayPauseToggle, onSeek, onCameraAngleChange, onLoopToggle, onClose]);

  if (!isOpen) return null;

  const CAMERAS: { id: CinematicCameraAngle; key: string; name: string; icon: string; desc: string }[] = [
    { id: 'tv_broadcast', key: '1', name: 'BROADCAST', icon: '📺', desc: 'Trackside Telephoto Pan & Zoom' },
    { id: 'wheel_apex', key: '2', name: 'WHEEL APEX', icon: '🏎️', desc: 'Ground-Level Front Rim & Tarmac' },
    { id: 'flyby_orbit', key: '3', name: 'ORBIT DOLLY', icon: '🚁', desc: '360° Circular Dynamic Dolly' },
    { id: 'heli_drone', key: '4', name: 'HELI DRONE', icon: '🚁', desc: 'Overhead High-Angle Tracking Drone' },
    { id: 'cockpit_interior', key: '5', name: 'COCKPIT POV', icon: '👤', desc: 'Driver Steering & Gear Shifting' },
    { id: 'cinematic_chase', key: '6', name: 'CHASE ACTION', icon: '🎬', desc: 'Low-Slung Rear Aero & Exhaust' },
  ];

  const SPEED_OPTIONS = [0.25, 0.5, 1.0, 2.0];

  const formatSeconds = (sec: number) => {
    const s = Math.floor(sec);
    const ms = Math.floor((sec - s) * 10);
    return `00:${s.toString().padStart(2, '0')}.${ms}`;
  };

  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!scrubberRef.current || duration <= 0) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onSeek(ratio * duration);
  };

  const handleExecuteSave = () => {
    const defaultTitle = `${telemetry?.carStyle === 'benz_amg' ? 'Mercedes-AMG GT' : 'BMW i5 M60'} ${Math.round(telemetry?.speed || 0)} KM/H RUN`;
    const title = clipTitleInput.trim() || defaultTitle;
    const clip = onSaveClip(title);
    setShowSaveDialog(false);
    setClipTitleInput('');
    if (clip) {
      setSaveToast(`REPLAY SAVED: "${clip.title}"`);
      setTimeout(() => setSaveToast(null), 3200);
    }
  };

  const progressRatio = duration > 0 ? Math.max(0, Math.min(1, currentTime / duration)) : 0;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none select-none flex flex-col justify-between overflow-hidden animate-in fade-in duration-200">
      {/* Cinematic CinemaScope 2.39:1 Letterbox Bars (Optional Immersion) */}
      {isLetterbox && (
        <>
          <div className="w-full h-10 sm:h-14 bg-black/95 border-b border-white/10 z-10 pointer-events-none transition-all duration-300" />
          <div className="fixed inset-x-0 bottom-0 h-10 sm:h-14 bg-black/95 border-t border-white/10 z-10 pointer-events-none transition-all duration-300" />
        </>
      )}

      {/* =========================================================
          TOP BAR: REPLAY STATUS & CINEMATIC CAMERA SELECTOR
          ========================================================= */}
      <div className="w-full px-3 sm:px-6 pt-3 sm:pt-4 flex items-start justify-between pointer-events-auto z-20">
        {/* Left: Replay Mode Badge & Live Telemetry */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 bg-black/90 px-3 py-1.5 rounded-full border border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.5)] backdrop-blur-md">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
            <span className="text-[10px] sm:text-xs font-race font-black text-red-200 tracking-wider">
              30S REPLAY SYSTEM
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-[9.5px] font-mono font-bold text-zinc-300 font-mono-num">
              {formatSeconds(currentTime)} / {formatSeconds(duration)}
            </span>
          </div>

          {/* Quick Telemetry Strip */}
          {telemetry && (
            <div className="flex items-center gap-2 bg-black/85 px-3 py-1 rounded-xl border border-white/15 backdrop-blur-md text-[8.5px] font-mono text-zinc-300">
              <span className="font-bold text-cyan-300">{Math.round(telemetry.speed)} KM/H</span>
              <span className="text-zinc-600">|</span>
              <span className="font-black text-amber-300">{telemetry.gear}</span>
              <span className="text-zinc-600">|</span>
              <span className="text-red-400 font-bold">{telemetry.driveMode}</span>
              {telemetry.aeroAngle > 0 && (
                <>
                  <span className="text-zinc-600">|</span>
                  <span className="text-cyan-400 flex items-center gap-0.5">
                    <Wind className="w-2.5 h-2.5" />
                    {telemetry.isAirbrake ? 'AIRBRAKE 52°' : `AERO ${Math.round(telemetry.aeroAngle)}°`}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Center: Cinematic Camera Angle Pills */}
        <div className="hidden lg:flex items-center gap-1 bg-black/90 p-1 rounded-2xl border border-white/20 backdrop-blur-xl shadow-2xl">
          {CAMERAS.map((cam) => {
            const isSelected = cameraAngle === cam.id;
            return (
              <button
                key={cam.id}
                onClick={() => onCameraAngleChange(cam.id)}
                className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 font-race font-bold text-[9px] transition-all cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-500 to-sky-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.8)] border border-cyan-300'
                    : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/5'
                }`}
                title={`${cam.desc} (Key ${cam.key})`}
              >
                <span className="text-xs">{cam.icon}</span>
                <span>{cam.name}</span>
                <span className="text-[7.5px] font-mono opacity-70 px-1 py-0.2 rounded bg-black/50">
                  {cam.key}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Tools & Exit Replay Button */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsLetterbox((prev) => !prev)}
            className={`p-2 rounded-xl border backdrop-blur-md transition-all cursor-pointer ${
              isLetterbox ? 'border-cyan-400 bg-cyan-950/80 text-cyan-200' : 'border-white/20 bg-black/80 text-zinc-400 hover:text-white'
            }`}
            title="Toggle CinemaScope 2.39:1 Letterbox"
          >
            <Film className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowSavedClipsDrawer((prev) => !prev)}
            className="h-9 px-3 rounded-xl border border-white/20 bg-black/85 hover:bg-zinc-900 text-zinc-200 flex items-center gap-1.5 font-race font-bold text-[10px] active:scale-95 transition-all cursor-pointer"
            title="Open Saved Replays Library"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">LIBRARY</span>
            <span className="px-1.5 py-0.2 rounded-full bg-zinc-800 text-[8px] font-mono">
              {savedClips.length}
            </span>
          </button>

          <button
            onClick={onClose}
            className="h-9 px-3.5 rounded-xl border-2 border-emerald-400 bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 font-race font-black text-xs active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.7)] transition-all cursor-pointer"
            title="Exit Replay and Resume Driving (ESC)"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>RESUME [ESC]</span>
          </button>
        </div>
      </div>

      {/* Save Notification Toast */}
      {saveToast && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-emerald-950/95 border-2 border-emerald-400 text-emerald-200 font-race font-bold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Mobile/Tablet Camera Angle Switcher (when top pills are hidden) */}
      <div className="lg:hidden flex items-center justify-center gap-1 px-3 py-1 pointer-events-auto z-20">
        <div className="flex items-center gap-1 bg-black/90 p-1 rounded-2xl border border-white/20 overflow-x-auto max-w-[95vw]">
          {CAMERAS.map((cam) => {
            const isSelected = cameraAngle === cam.id;
            return (
              <button
                key={cam.id}
                onClick={() => onCameraAngleChange(cam.id)}
                className={`px-2 py-1 rounded-lg text-[8.5px] font-race font-bold flex items-center gap-1 whitespace-nowrap ${
                  isSelected ? 'bg-cyan-500 text-black font-black' : 'text-zinc-400 bg-zinc-900/60'
                }`}
              >
                <span>{cam.icon}</span>
                <span>{cam.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================
          BOTTOM CONTROL DECK: TIMELINE SCRUBBER & TRANSPORT
          ========================================================= */}
      <div className="w-full px-3 sm:px-6 pb-3 sm:pb-5 pointer-events-auto z-30 flex flex-col items-center gap-2">
        {/* Main Glass Deck Container */}
        <div className="w-full max-w-4xl bg-black/92 backdrop-blur-2xl rounded-3xl border border-white/20 p-2.5 sm:p-3.5 shadow-[0_0_35px_rgba(0,0,0,0.9)] flex flex-col gap-2 ring-1 ring-white/10">
          {/* 1. Precision Timeline Scrubber Bar */}
          <div className="flex items-center gap-2.5 w-full">
            <span className="text-[10px] font-mono font-bold text-cyan-300 min-w-[50px] font-mono-num">
              {formatSeconds(currentTime)}
            </span>

            {/* Draggable Progress Bar Container */}
            <div
              ref={scrubberRef}
              onClick={handleScrubberClick}
              className="relative flex-1 h-3.5 sm:h-4 bg-zinc-900 rounded-full cursor-pointer overflow-hidden border border-white/15 p-0.5 group"
              title="Click or Drag to Scrub Timeline"
            >
              {/* Background 30-Second Grid Hash Marks */}
              <div className="absolute inset-0 flex justify-between px-1 pointer-events-none opacity-20">
                {Array.from({ length: 11 }).map((_, i) => (
                  <div key={i} className="w-0.5 h-full bg-white" />
                ))}
              </div>

              {/* Glowing Progress Fill */}
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-emerald-400 rounded-full transition-all duration-75 relative shadow-[0_0_12px_rgba(6,182,212,0.9)]"
                style={{ width: `${progressRatio * 100}%` }}
              >
                {/* Thumb Head Indicator */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-cyan-500 shadow-md transform translate-x-1/2 scale-100 group-hover:scale-125 transition-transform" />
              </div>
            </div>

            <span className="text-[10px] font-mono font-bold text-zinc-400 min-w-[50px] text-right font-mono-num">
              {formatSeconds(duration)}
            </span>
          </div>

          {/* 2. Transport & Playback Control Buttons */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-white/10">
            {/* Left Deck: Speed Selector & Loop Toggle */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="text-[8px] font-mono text-zinc-400 font-bold hidden sm:inline">SPEED:</span>
              <div className="flex items-center gap-0.5 bg-zinc-900/90 p-0.5 rounded-xl border border-white/10">
                {SPEED_OPTIONS.map((spd) => (
                  <button
                    key={spd}
                    onClick={() => onSpeedChange(spd)}
                    className={`px-2 py-1 rounded-lg text-[8.5px] font-mono font-bold transition-all cursor-pointer ${
                      playbackSpeed === spd
                        ? 'bg-cyan-500 text-black font-black shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {spd === 0.25 ? '¼x SLOW' : spd === 0.5 ? '½x' : `${spd}x`}
                  </button>
                ))}
              </div>

              {/* Loop Toggle */}
              <button
                onClick={onLoopToggle}
                className={`h-7 px-2 rounded-xl border text-[8.5px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  isLooping
                    ? 'border-cyan-400 bg-cyan-950/80 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.6)]'
                    : 'border-white/10 bg-zinc-900/70 text-zinc-400 hover:text-white'
                }`}
                title="Toggle Continuous Loop (Key L)"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>LOOP</span>
              </button>
            </div>

            {/* Center Deck: Skip -3s, Play/Pause, Skip +3s */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSeek(Math.max(0, currentTime - 3))}
                className="p-2 rounded-2xl border border-white/15 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white active:scale-95 transition-all cursor-pointer"
                title="Step Backward 3 Seconds (←)"
              >
                <Rewind className="w-4 h-4" />
              </button>

              <button
                onClick={onPlayPauseToggle}
                className={`h-11 sm:h-12 px-6 rounded-2xl border-2 flex items-center justify-center gap-2 font-race font-black text-sm active:scale-95 transition-all cursor-pointer shadow-2xl ${
                  isPlaying
                    ? 'border-amber-400 bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-[0_0_20px_rgba(245,158,11,0.8)]'
                    : 'border-cyan-400 bg-gradient-to-r from-cyan-500 to-sky-600 text-white shadow-[0_0_25px_rgba(6,182,212,0.9)] animate-pulse'
                }`}
                title="Play / Pause Replay (SPACE)"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
              </button>

              <button
                onClick={() => onSeek(Math.min(duration, currentTime + 3))}
                className="p-2 rounded-2xl border border-white/15 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white active:scale-95 transition-all cursor-pointer"
                title="Step Forward 3 Seconds (→)"
              >
                <FastForward className="w-4 h-4" />
              </button>
            </div>

            {/* Right Deck: Save Replay Clip Button */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowSaveDialog(true)}
                className="h-8 sm:h-9 px-3 rounded-xl border border-amber-400/80 bg-amber-500/20 hover:bg-amber-500/40 text-amber-200 flex items-center gap-1.5 font-race font-bold text-[10px] active:scale-95 transition-all cursor-pointer shadow-md"
                title="Save This 30s Replay Clip to Library"
              >
                <Save className="w-3.5 h-3.5 text-amber-400" />
                <span>SAVE CLIP</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Clip Dialog Modal */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 pointer-events-auto">
          <div className="bg-zinc-950 border-2 border-amber-400 rounded-3xl p-5 w-full max-w-md shadow-2xl flex flex-col gap-3.5">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2 text-amber-300 font-race font-black text-sm">
                <Save className="w-4 h-4" />
                <span>SAVE 30-SECOND REPLAY CLIP</span>
              </div>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300">
              Save this driving moment to your local library. You can rewatch it anytime with full cinematic camera control!
            </p>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono text-zinc-400">CLIP TITLE:</label>
              <input
                type="text"
                value={clipTitleInput}
                onChange={(e) => setClipTitleInput(e.target.value)}
                placeholder={`${telemetry?.carStyle === 'benz_amg' ? 'Mercedes-AMG GT' : 'BMW i5 M60'} ${Math.round(telemetry?.speed || 0)} KM/H RUN`}
                className="px-3 py-2 rounded-xl bg-zinc-900 border border-white/20 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-3 py-1.5 rounded-xl border border-white/20 text-zinc-400 hover:text-white text-xs font-mono"
              >
                CANCEL
              </button>
              <button
                onClick={handleExecuteSave}
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-race font-black text-xs shadow-lg active:scale-95 transition-all"
              >
                SAVE CLIP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved Clips Library Drawer */}
      {showSavedClipsDrawer && (
        <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-zinc-950/95 border-l border-white/20 shadow-2xl z-50 p-4 flex flex-col justify-between pointer-events-auto backdrop-blur-2xl">
          <div className="flex flex-col gap-3 overflow-hidden flex-1">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2 text-cyan-300 font-race font-black text-sm">
                <FolderOpen className="w-4 h-4 text-amber-400" />
                <span>SAVED REPLAY CLIPS ({savedClips.length})</span>
              </div>
              <button
                onClick={() => setShowSavedClipsDrawer(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {savedClips.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-500 gap-2">
                <Film className="w-8 h-8 opacity-40 text-zinc-400" />
                <span className="text-xs font-mono">No saved replays yet.</span>
                <span className="text-[10px] text-zinc-600">
                  Click "SAVE CLIP" during any driving session to save your best runs!
                </span>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
                {savedClips.map((clip) => (
                  <div
                    key={clip.id}
                    className="p-2.5 rounded-2xl bg-zinc-900/90 border border-white/10 hover:border-cyan-400/50 flex flex-col gap-1.5 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col truncate">
                        <span className="text-xs font-race font-black text-white truncate">
                          {clip.title}
                        </span>
                        <div className="flex items-center gap-1.5 text-[8.5px] font-mono text-zinc-400">
                          <span className="text-cyan-300 font-bold">{clip.topSpeed} KM/H TOP</span>
                          <span>•</span>
                          <span>{clip.duration}s</span>
                          <span>•</span>
                          <span className="text-amber-300">{clip.driveMode}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => onDeleteSavedClip(clip.id)}
                        className="p-1 rounded-lg hover:bg-red-950/80 text-zinc-600 hover:text-red-400 transition-colors"
                        title="Delete Clip"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        onLoadSavedClip(clip.id);
                        setShowSavedClipsDrawer(false);
                      }}
                      className="w-full py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 font-race font-bold text-[10px] flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>LOAD & WATCH CLIP</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowSavedClipsDrawer(false)}
            className="w-full py-2 rounded-xl bg-zinc-900 border border-white/15 text-zinc-300 hover:text-white font-mono text-xs text-center"
          >
            CLOSE LIBRARY
          </button>
        </div>
      )}
    </div>
  );
};
