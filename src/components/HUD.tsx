import React, { useEffect, useState, useRef } from 'react';
import { Camera, Pause, Play, Zap, Compass, ChevronLeft, ChevronRight, Gauge } from 'lucide-react';
import { CameraView, WeatherType } from '../types/game';
import { PlayerPhysicsState } from '../game/PhysicsEngine';
import { GearIndicator } from './GearIndicator';

interface MinimapData {
  trackPoints: { x: number; y: number }[];
  playerDistance: number;
  opponentsDistances: number[];
  totalLength: number;
}

interface HUDProps {
  physicsState: PlayerPhysicsState | null;
  minimapData?: MinimapData | null;
  playerRank: number;
  totalRacers: number;
  totalLaps: number;
  countdown: number; // 3, 2, 1, 0 (GO), -1 (hidden)
  weather: WeatherType;
  cameraView: CameraView;
  onCameraToggle: () => void;
  onPauseToggle: () => void;
  isPaused: boolean;
  onMobileInput: (inputs: { throttle: number; brake: number; steer: number; nitro: boolean }) => void;
  speedUnit: 'kmh' | 'mph';
}

export const HUD: React.FC<HUDProps> = ({
  physicsState,
  minimapData,
  playerRank,
  totalRacers,
  totalLaps,
  countdown,
  weather,
  cameraView,
  onCameraToggle,
  onPauseToggle,
  isPaused,
  onMobileInput,
  speedUnit,
}) => {
  // Mobile touch active state
  const [touchSteer, setTouchSteer] = useState<number>(0);
  const [touchThrottle, setTouchThrottle] = useState<number>(0);
  const [touchBrake, setTouchBrake] = useState<number>(0);
  const [touchNitro, setTouchNitro] = useState<boolean>(false);

  const minimapCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    onMobileInput({
      steer: touchSteer,
      throttle: touchThrottle,
      brake: touchBrake,
      nitro: touchNitro,
    });
  }, [touchSteer, touchThrottle, touchBrake, touchNitro, onMobileInput]);

  const speed = physicsState ? Math.round(physicsState.speed * (speedUnit === 'mph' ? 0.621371 : 1.0)) : 0;
  const rpm = physicsState ? Math.round(physicsState.rpm) : 1500;
  const rpmRatio = physicsState ? physicsState.rpmRatio : 0;
  const gear = physicsState ? physicsState.gear : 1;
  const nitro = physicsState ? Math.round(physicsState.nitroAmount) : 100;
  const lap = physicsState ? Math.min(totalLaps, physicsState.lap) : 1;
  const currentLapTime = physicsState ? physicsState.currentLapTime : 0;
  const bestLapTime = physicsState?.bestLapTime;
  const leanDeg = physicsState ? Math.round(Math.abs(physicsState.leanAngle * (180 / Math.PI))) : 0;
  const leanDir = physicsState ? (physicsState.leanAngle > 0.05 ? 'R' : physicsState.leanAngle < -0.05 ? 'L' : '') : '';

  // Shift Lights: 5 LEDs (2 Green, 2 Yellow, 1 Red)
  const shiftLight1 = rpmRatio > 0.68;
  const shiftLight2 = rpmRatio > 0.76;
  const shiftLight3 = rpmRatio > 0.84;
  const shiftLight4 = rpmRatio > 0.91;
  const isRedline = rpmRatio > 0.95;

  // Format mm:ss.xx
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs * 100) % 100);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Rank suffix
  const getRankSuffix = (r: number) => {
    if (r === 1) return 'ST';
    if (r === 2) return 'ND';
    if (r === 3) return 'RD';
    return 'TH';
  };

  // Draw 2D Vector Minimap
  useEffect(() => {
    const canvas = minimapCanvasRef.current;
    if (!canvas || !minimapData || minimapData.trackPoints.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Find bounding box of track points
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    minimapData.trackPoints.forEach((p) => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });

    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const padding = 16;
    const drawW = width - padding * 2;
    const drawH = height - padding * 2;
    const scale = Math.min(drawW / rangeX, drawH / rangeY);

    const toCanvasX = (x: number) => padding + (x - minX) * scale + (drawW - rangeX * scale) / 2;
    const toCanvasY = (y: number) => padding + (y - minY) * scale + (drawH - rangeY * scale) / 2;

    // Draw track circuit outline
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    minimapData.trackPoints.forEach((p, idx) => {
      const cx = toCanvasX(p.x);
      const cy = toCanvasY(p.y);
      if (idx === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.closePath();
    ctx.stroke();

    // Start / Finish Line marker
    const startP = minimapData.trackPoints[0];
    ctx.fillStyle = '#f97316';
    ctx.fillRect(toCanvasX(startP.x) - 3, toCanvasY(startP.y) - 3, 6, 6);

    // Draw AI rivals (Red / Amber dots)
    const ptsCount = minimapData.trackPoints.length;
    minimapData.opponentsDistances.forEach((dist) => {
      const u = (dist % minimapData.totalLength) / minimapData.totalLength;
      const idx = Math.floor(u * ptsCount) % ptsCount;
      const pt = minimapData.trackPoints[idx];
      if (pt) {
        ctx.beginPath();
        ctx.arc(toCanvasX(pt.x), toCanvasY(pt.y), 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
      }
    });

    // Draw Player (Cyan Dot with white ring)
    const playerU = (minimapData.playerDistance % minimapData.totalLength) / minimapData.totalLength;
    const pIdx = Math.floor(playerU * ptsCount) % ptsCount;
    const playerPt = minimapData.trackPoints[pIdx];
    if (playerPt) {
      const px = toCanvasX(playerPt.x);
      const py = toCanvasY(playerPt.y);

      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#06b6d4';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    }
  }, [minimapData]);

  // High Speed Motion Blur / Speed Lines Intensity
  const speedLinesOpacity = speed > 220 ? Math.min(0.65, (speed - 220) / 100) : 0;

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-20 flex flex-col justify-between p-4 md:p-6">
      {/* 1. High Speed Motion Lines Overlay */}
      {speedLinesOpacity > 0 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: speedLinesOpacity,
            background: 'radial-gradient(circle at center, transparent 35%, rgba(255,255,255,0.12) 100%)',
          }}
        />
      )}

      {/* 2. Wet Rain Vignette Overlay */}
      {(weather === 'rain' || weather === 'nightRain') && (
        <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-sky-950/20 to-black/60" />
      )}

      {/* 3. Countdown Overlay */}
      {countdown >= 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <div className="text-center animate-bounce">
            <span
              className={`font-race font-extrabold tracking-widest text-8xl md:text-9xl drop-shadow-[0_0_40px_rgba(255,60,0,0.8)] ${
                countdown === 0 ? 'text-emerald-400' : 'text-amber-500'
              }`}
            >
              {countdown === 0 ? 'GO!' : countdown}
            </span>
            <div className="text-xs uppercase tracking-widest font-mono text-zinc-400 mt-2">
              Full Throttle — Drop The Clutch
            </div>
          </div>
        </div>
      )}

      {/* 4. Top Header Bar: Position, Lap, Time, and Actions */}
      <div className="flex items-start justify-between w-full">
        {/* Left: Position & Lap Badge */}
        <div className="flex items-center gap-3">
          <div className="glass-panel px-4 py-2.5 rounded-2xl border border-white/10 flex items-baseline gap-1.5 shadow-2xl">
            <span className="text-[11px] font-race uppercase text-zinc-400 tracking-wider">POS</span>
            <span className="text-3xl md:text-4xl font-race font-black text-white ml-0.5">
              {playerRank}
            </span>
            <span className="text-sm font-race font-bold text-orange-400">
              {getRankSuffix(playerRank)}
            </span>
            <span className="text-xs text-zinc-500 font-mono-num ml-1">/ {totalRacers}</span>
          </div>

          <div className="glass-panel px-4 py-2.5 rounded-2xl border border-white/10 shadow-2xl">
            <div className="text-[10px] font-race uppercase text-zinc-400 tracking-widest">LAP</div>
            <div className="text-xl md:text-2xl font-mono-num font-bold text-cyan-400">
              {lap} <span className="text-xs text-zinc-500 font-normal">/ {totalLaps}</span>
            </div>
          </div>
        </div>

        {/* Center: Lap Timer & Delta */}
        <div className="glass-panel px-6 py-2.5 rounded-2xl border border-white/10 flex flex-col items-center shadow-2xl">
          <span className="text-[10px] font-mono uppercase text-zinc-400 tracking-widest">LAP TIME</span>
          <span className="text-2xl md:text-3xl font-mono-num font-bold text-white tracking-wider">
            {formatTime(currentLapTime)}
          </span>
          {bestLapTime && (
            <span className="text-[10px] font-mono-num text-emerald-400">
              BEST: {formatTime(bestLapTime)}
            </span>
          )}
        </div>

        {/* Right: Camera View & Pause Buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={onCameraToggle}
            className="glass-panel p-3 rounded-2xl border border-white/10 hover:border-cyan-400 text-zinc-300 hover:text-white transition-all active:scale-95 shadow-xl flex items-center gap-2 cursor-pointer"
            title="Switch Camera (C)"
          >
            <Camera className="w-5 h-5 text-cyan-400" />
            <span className="hidden md:inline text-xs font-race font-semibold uppercase">{cameraView}</span>
          </button>

          <button
            onClick={onPauseToggle}
            className="glass-panel p-3 rounded-2xl border border-white/10 hover:border-orange-500 text-zinc-300 hover:text-white transition-all active:scale-95 shadow-xl cursor-pointer"
            title="Pause (Esc)"
          >
            {isPaused ? <Play className="w-5 h-5 text-emerald-400" /> : <Pause className="w-5 h-5 text-orange-400" />}
          </button>
        </div>
      </div>

      {/* 5. Center Crash / Warning Notification */}
      {physicsState?.isCrashing && (
        <div className="self-center glass-panel px-6 py-2.5 rounded-2xl border border-red-500/60 text-red-400 font-race font-bold tracking-widest uppercase animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.4)]">
          CRASH RECOVERY... RE-ALIGNING BIKE
        </div>
      )}

      {/* 6. Bottom Cockpit: Minimap (Left) & Digital TFT Cluster (Right) */}
      <div className="flex flex-col md:flex-row items-end justify-between w-full gap-4">
        {/* Left Side: Real-time 2D Circuit Minimap & Nitro */}
        <div className="flex items-end gap-3">
          {/* Vector Minimap */}
          <div className="glass-panel p-2.5 rounded-2xl border border-white/10 shadow-2xl relative w-36 h-36 flex items-center justify-center">
            <canvas ref={minimapCanvasRef} width={130} height={130} className="w-full h-full" />
            <div className="absolute top-2 left-2 text-[9px] font-mono text-zinc-400 uppercase tracking-widest">
              GPS MAP
            </div>
          </div>

          {/* Nitro Reservoir */}
          <div className="glass-panel px-4 py-3 rounded-2xl border border-white/10 w-44 shadow-2xl">
            <div className="flex items-center justify-between text-xs font-race font-semibold mb-1.5">
              <span className="flex items-center gap-1.5 text-cyan-400 tracking-wider">
                <Zap className="w-3.5 h-3.5 fill-cyan-400" /> NITRO
              </span>
              <span className="font-mono-num text-white">{nitro}%</span>
            </div>
            <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  physicsState?.isNitroActive
                    ? 'bg-gradient-to-r from-cyan-400 to-white shadow-[0_0_15px_#00d4ff]'
                    : 'bg-gradient-to-r from-blue-600 to-cyan-400'
                }`}
                style={{ width: `${nitro}%` }}
              />
            </div>
            {/* Live Lean Angle */}
            <div className="flex items-center justify-between text-[10px] font-mono mt-2 text-zinc-400 pt-1.5 border-t border-white/10">
              <span>LEAN ANGLE</span>
              <span className="font-bold text-white">
                {leanDeg}° {leanDir}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Pro MotoGP / Superbike TFT Instrument Cluster */}
        <div className="glass-panel p-4 md:px-7 md:py-4 rounded-3xl border border-white/15 shadow-2xl flex flex-col gap-2 self-center md:self-auto">
          {/* Top Sequential Shift Lights Array */}
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className={`w-3 h-3 rounded-full ${shiftLight1 ? 'bg-emerald-400 shadow-[0_0_10px_#10b981]' : 'bg-zinc-800'}`} />
            <div className={`w-3 h-3 rounded-full ${shiftLight2 ? 'bg-emerald-400 shadow-[0_0_10px_#10b981]' : 'bg-zinc-800'}`} />
            <div className={`w-3 h-3 rounded-full ${shiftLight3 ? 'bg-amber-400 shadow-[0_0_10px_#f59e0b]' : 'bg-zinc-800'}`} />
            <div className={`w-3 h-3 rounded-full ${shiftLight4 ? 'bg-amber-400 shadow-[0_0_10px_#f59e0b]' : 'bg-zinc-800'}`} />
            <div className={`w-3.5 h-3.5 rounded-full ${isRedline ? 'bg-red-500 shadow-[0_0_15px_#ef4444] animate-ping' : 'bg-zinc-800'}`} />
          </div>

          <div className="flex items-center gap-6">
            {/* Gear Indicator Component */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-race text-zinc-400 uppercase tracking-widest mb-0.5">GEAR</span>
              <GearIndicator
                gear={gear}
                isNeutral={gear === 0}
                isRedline={isRedline}
                currentRpm={physicsState?.rpm}
                size="md"
              />
            </div>

            <div className="w-[1px] h-14 bg-white/10" />

            {/* Speedometer & Sweeping Tachometer */}
            <div className="flex flex-col items-baseline">
              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl md:text-6xl font-mono-num font-black tracking-tight text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                  {speed}
                </span>
                <span className="text-xs md:text-sm font-race font-bold uppercase text-zinc-400 tracking-wider">
                  {speedUnit.toUpperCase()}
                </span>
              </div>

              {/* Linear Sweeping Tachometer Bar */}
              <div className="w-48 md:w-60 mt-1">
                <div className="flex justify-between text-[9px] font-mono-num text-zinc-500 mb-0.5">
                  <span>0</span>
                  <span>4</span>
                  <span>8</span>
                  <span>12</span>
                  <span className="text-red-400">14</span>
                  <span className="text-red-500 font-bold">16K</span>
                </div>
                <div className="h-2.5 w-full bg-black/70 rounded-full overflow-hidden border border-white/10 p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-75 ${
                      isRedline
                        ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 animate-redline'
                        : 'bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-400'
                    }`}
                    style={{ width: `${Math.min(100, rpmRatio * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7. Mobile On-Screen Touch Controls */}
      <div className="md:hidden flex items-end justify-between w-full pt-4 pointer-events-auto">
        {/* Left: Steering Virtual Buttons */}
        <div className="flex items-center gap-3">
          <button
            onTouchStart={() => setTouchSteer(-1)}
            onTouchEnd={() => setTouchSteer(0)}
            onMouseDown={() => setTouchSteer(-1)}
            onMouseUp={() => setTouchSteer(0)}
            className="w-16 h-16 rounded-2xl glass-panel border border-white/20 active:bg-cyan-500/30 flex items-center justify-center text-white font-race font-bold text-2xl active:scale-95 transition-all shadow-xl"
          >
            ◀
          </button>
          <button
            onTouchStart={() => setTouchSteer(1)}
            onTouchEnd={() => setTouchSteer(0)}
            onMouseDown={() => setTouchSteer(1)}
            onMouseUp={() => setTouchSteer(0)}
            className="w-16 h-16 rounded-2xl glass-panel border border-white/20 active:bg-cyan-500/30 flex items-center justify-center text-white font-race font-bold text-2xl active:scale-95 transition-all shadow-xl"
          >
            ▶
          </button>
        </div>

        {/* Right: Brake, Nitro & Throttle Controls */}
        <div className="flex items-center gap-2">
          {/* Brake */}
          <button
            onTouchStart={() => setTouchBrake(1)}
            onTouchEnd={() => setTouchBrake(0)}
            onMouseDown={() => setTouchBrake(1)}
            onMouseUp={() => setTouchBrake(0)}
            className="w-14 h-14 rounded-2xl glass-panel border border-red-500/40 active:bg-red-500/40 flex items-center justify-center text-red-400 font-race font-bold text-xs uppercase tracking-wider active:scale-95 transition-all shadow-xl"
          >
            BRAKE
          </button>

          {/* Nitro */}
          <button
            onTouchStart={() => setTouchNitro(true)}
            onTouchEnd={() => setTouchNitro(false)}
            onMouseDown={() => setTouchNitro(true)}
            onMouseUp={() => setTouchNitro(false)}
            className="w-14 h-14 rounded-2xl glass-panel border border-cyan-400/40 active:bg-cyan-500/40 flex items-center justify-center text-cyan-400 font-race font-bold text-xs uppercase tracking-wider active:scale-95 transition-all shadow-xl"
          >
            NITRO
          </button>

          {/* Gas / Throttle */}
          <button
            onTouchStart={() => setTouchThrottle(1)}
            onTouchEnd={() => setTouchThrottle(0)}
            onMouseDown={() => setTouchThrottle(1)}
            onMouseUp={() => setTouchThrottle(0)}
            className="w-20 h-20 rounded-2xl glass-panel-accent border border-orange-500/60 active:bg-orange-500/50 flex flex-col items-center justify-center text-white font-race font-extrabold text-sm uppercase tracking-widest active:scale-95 transition-all shadow-2xl"
          >
            <Gauge className="w-5 h-5 mb-0.5 text-orange-400" />
            GAS
          </button>
        </div>
      </div>
    </div>
  );
};
