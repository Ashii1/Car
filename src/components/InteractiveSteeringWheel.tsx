import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Volume2, Camera, Gauge, Sparkles, ArrowLeft, ArrowRight } from 'lucide-react';

interface InteractiveSteeringWheelProps {
  steerRatio: number; // -1.0 (full left) to +1.0 (full right)
  onSteerChange: (ratio: number) => void;
  carStyle?: 'bmw_m' | 'benz_amg';
  onHorn?: () => void;
  onCameraToggle?: () => void;
  onPaddleShift?: (direction: 'UP' | 'DOWN') => void;
  onToggleCarStyle?: () => void;
  driveMode?: string;
  className?: string;
}

export const InteractiveSteeringWheel: React.FC<InteractiveSteeringWheelProps> = ({
  steerRatio,
  onSteerChange,
  carStyle = 'bmw_m',
  onHorn,
  onCameraToggle,
  onPaddleShift,
  onToggleCarStyle,
  driveMode = 'SPORT+',
  className = '',
}) => {
  const wheelRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startAngleRef = useRef(0);
  const currentAngleRef = useRef(0);
  const [isPressedLeftPaddle, setIsPressedLeftPaddle] = useState(false);
  const [isPressedRightPaddle, setIsPressedRightPaddle] = useState(false);

  // Maximum physical wheel rotation angle in degrees (-140 to +140)
  const maxWheelDegrees = 140;
  const currentDegrees = steerRatio * maxWheelDegrees;

  // Mouse / Touch Drag Steering Logic (supports both horizontal swipe & circular trace)
  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const rect = wheelRef.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    startXRef.current = e.clientX;
    startAngleRef.current = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    currentAngleRef.current = currentDegrees;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // 1. Angular circular rotation
    const currentAngleRad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    let deltaRad = currentAngleRad - startAngleRef.current;
    while (deltaRad > Math.PI) deltaRad -= Math.PI * 2;
    while (deltaRad < -Math.PI) deltaRad += Math.PI * 2;
    const deltaAngularDeg = (deltaRad * 180) / Math.PI;

    // 2. Horizontal swipe offset for intuitive mobile/mouse dragging
    const deltaX = e.clientX - startXRef.current;
    const deltaSwipeDeg = (deltaX / (rect.width * 0.45)) * maxWheelDegrees;

    // Blend: if moving primarily horizontally, use swipe; otherwise combine smoothly
    const combinedDeg = Math.abs(deltaX) > 15
      ? currentAngleRef.current + deltaSwipeDeg
      : currentAngleRef.current + deltaAngularDeg;

    const clampedDeg = Math.max(-maxWheelDegrees, Math.min(maxWheelDegrees, combinedDeg));
    onSteerChange(clampedDeg / maxWheelDegrees);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    // Auto-centering back to straight
    onSteerChange(0);
  };

  const isBmw = carStyle === 'bmw_m';

  return (
    <div className={`relative select-none touch-none flex flex-col items-center ${className}`}>
      {/* Paddle Shifters attached directly behind the steering wheel rim */}
      <div className="absolute -top-3.5 inset-x-0 flex items-center justify-between px-2 z-10 pointer-events-auto">
        {/* Left Paddle: Downshift (-) */}
        <button
          onPointerDown={() => {
            setIsPressedLeftPaddle(true);
            onPaddleShift?.('DOWN');
          }}
          onPointerUp={() => setIsPressedLeftPaddle(false)}
          onPointerLeave={() => setIsPressedLeftPaddle(false)}
          className={`h-11 px-2.5 rounded-xl border flex flex-col items-center justify-center font-mono font-black text-xs transition-all shadow-xl active:scale-90 cursor-pointer ${
            isPressedLeftPaddle
              ? 'bg-amber-500 border-amber-300 text-black shadow-[0_0_15px_rgba(245,158,11,0.9)]'
              : 'bg-zinc-950/90 hover:bg-zinc-900 border-white/20 text-amber-300 hover:border-amber-400/60'
          }`}
          title="Downshift Paddle (Key Z) • Click to Shift"
        >
          <span className="text-sm font-black leading-none">−</span>
          <span className="text-[7.5px] font-bold text-zinc-400 uppercase tracking-tighter">DOWN</span>
        </button>

        {/* Right Paddle: Upshift (+) */}
        <button
          onPointerDown={() => {
            setIsPressedRightPaddle(true);
            onPaddleShift?.('UP');
          }}
          onPointerUp={() => setIsPressedRightPaddle(false)}
          onPointerLeave={() => setIsPressedRightPaddle(false)}
          className={`h-11 px-2.5 rounded-xl border flex flex-col items-center justify-center font-mono font-black text-xs transition-all shadow-xl active:scale-90 cursor-pointer ${
            isPressedRightPaddle
              ? 'bg-cyan-500 border-cyan-300 text-black shadow-[0_0_15px_rgba(6,182,212,0.9)]'
              : 'bg-zinc-950/90 hover:bg-zinc-900 border-white/20 text-cyan-300 hover:border-cyan-400/60'
          }`}
          title="Upshift Paddle (Key X) • Click to Shift"
        >
          <span className="text-sm font-black leading-none">+</span>
          <span className="text-[7.5px] font-bold text-zinc-400 uppercase tracking-tighter">UP</span>
        </button>
      </div>

      {/* Main Steering Wheel Container */}
      <div
        ref={wheelRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-32 h-32 sm:w-38 sm:h-38 md:w-42 md:h-42 rounded-full relative cursor-grab active:cursor-grabbing transition-transform ease-out duration-75 shadow-[0_0_30px_rgba(0,0,0,0.9)] ring-1 ring-white/15"
        style={{
          transform: `rotate(${currentDegrees}deg)`,
          touchAction: 'none',
        }}
      >
        {/* Outer Wheel Rim (Perforated Leather & Carbon Fiber) */}
        <div className="absolute inset-0 rounded-full border-[10px] sm:border-[12px] border-zinc-900 bg-gradient-to-b from-zinc-950 via-zinc-900 to-black shadow-inner flex items-center justify-center">
          {/* Top 12 O'Clock Center Alignment Racing Stripe (Red) */}
          <div className="absolute top-0 w-3 h-2.5 sm:w-3.5 sm:h-3 bg-red-600 rounded-sm shadow-[0_0_8px_#ef4444]" />

          {/* Left / Right Perforated Leather Grip Inlays */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2.5 h-14 bg-zinc-800/80 rounded-r-md border-r border-white/10" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-14 bg-zinc-800/80 rounded-l-md border-l border-white/10" />

          {/* 3 Brushed Spokes (Left, Right, Bottom) */}
          {/* Left Horizontal Spoke with Multifunction Buttons */}
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-12 sm:w-16 h-8 sm:h-9 bg-gradient-to-r from-zinc-800 to-zinc-900 rounded-md border border-white/15 flex items-center justify-around px-1 z-20 pointer-events-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleCarStyle?.();
              }}
              className="p-1 rounded bg-black/60 hover:bg-black text-[7.5px] font-mono font-bold text-zinc-300 hover:text-white border border-white/10 active:scale-90 transition-all cursor-pointer"
              title="Toggle Brand: BMW M / AMG"
            >
              <span>{isBmw ? 'M' : 'AMG'}</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCameraToggle?.();
              }}
              className="p-1 rounded bg-black/60 hover:bg-black text-cyan-300 hover:text-cyan-100 border border-white/10 active:scale-90 transition-all cursor-pointer"
              title="Camera View (Key C)"
            >
              <Camera className="w-3 h-3" />
            </button>
          </div>

          {/* Right Horizontal Spoke with Drive Mode & Cruise Controls */}
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-12 sm:w-16 h-8 sm:h-9 bg-gradient-to-l from-zinc-800 to-zinc-900 rounded-md border border-white/15 flex items-center justify-around px-1 z-20 pointer-events-auto">
            <div className="flex flex-col items-center">
              <span className="text-[6.5px] font-mono text-zinc-400 font-bold">MODE</span>
              <span className="text-[7.5px] font-race font-bold text-red-400 truncate max-w-[36px]">
                {driveMode}
              </span>
            </div>
          </div>

          {/* Bottom Vertical Spoke */}
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-7 sm:w-8 h-10 sm:h-12 bg-gradient-to-t from-zinc-800 to-zinc-900 rounded-md border border-white/15 flex flex-col items-center justify-end pb-1">
            <span className="text-[6px] font-mono text-zinc-400 font-bold uppercase tracking-widest">
              {isBmw ? 'xDRIVE' : '4MATIC'}
            </span>
          </div>

          {/* Center Hub & Horn Button with Authentic Brand Emblem */}
          <div className="relative z-30 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-zinc-800 via-zinc-900 to-black border-2 border-white/20 shadow-2xl flex flex-col items-center justify-center p-1 pointer-events-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onHorn?.();
              }}
              className="w-full h-full rounded-full flex flex-col items-center justify-center bg-black/40 hover:bg-black/60 active:scale-95 transition-all cursor-pointer group"
              title="Honk Car Horn (Key H)"
            >
              {/* Brand Logo Insignia */}
              {isBmw ? (
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-white/40 bg-zinc-950 flex items-center justify-center relative overflow-hidden shadow-md">
                    {/* BMW Roundel Quadrants */}
                    <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                      <div className="bg-sky-500" />
                      <div className="bg-white" />
                      <div className="bg-white" />
                      <div className="bg-sky-500" />
                    </div>
                    <div className="relative z-10 w-2.5 h-2.5 rounded-full bg-black border border-white/60" />
                  </div>
                  <span className="text-[6.5px] sm:text-[7px] font-race font-black text-white tracking-widest mt-0.5">
                    ///M
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-zinc-400 bg-zinc-950 flex items-center justify-center relative shadow-md">
                    {/* Mercedes-AMG Three-Pointed Star */}
                    <div className="w-5 h-5 flex items-center justify-center relative">
                      <div className="w-0.5 h-4 bg-zinc-200 absolute top-0.5" />
                      <div className="w-3.5 h-0.5 bg-zinc-200 absolute top-2.5 -rotate-30" />
                      <div className="w-3.5 h-0.5 bg-zinc-200 absolute top-2.5 rotate-30" />
                    </div>
                  </div>
                  <span className="text-[6.5px] sm:text-[7px] font-race font-black text-zinc-300 tracking-wider mt-0.5">
                    AMG
                  </span>
                </div>
              )}
              <Volume2 className="w-2.5 h-2.5 text-zinc-500 group-hover:text-cyan-400 transition-colors mt-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Steering Controls Bar: Left Turn [A], Live Degree Telemetry, Right Turn [D] */}
      <div className="mt-1.5 flex items-center gap-1.5 pointer-events-auto">
        {/* Left Turn Button */}
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            onSteerChange(-1);
          }}
          onPointerUp={() => onSteerChange(0)}
          onPointerLeave={() => onSteerChange(0)}
          className={`h-7 px-2 sm:px-2.5 rounded-lg border flex items-center gap-1 font-race font-bold active:scale-95 transition-all cursor-pointer ${
            steerRatio < -0.1
              ? 'bg-cyan-500 border-cyan-300 text-black shadow-[0_0_12px_rgba(6,182,212,0.85)]'
              : 'bg-black/85 hover:bg-zinc-800 border-white/20 text-cyan-300'
          }`}
          title="Turn Left (Key A or Left Arrow)"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="text-[7.5px] font-mono font-black">LEFT [A]</span>
        </button>

        {/* Live Steering Angle Telemetry */}
        <div className="px-2 py-1 rounded-lg bg-black/90 border border-white/10 text-[7.5px] font-mono text-zinc-300 flex items-center gap-1">
          <span className="text-zinc-500">STEER:</span>
          <span className={`font-bold ${Math.abs(steerRatio) > 0.05 ? 'text-cyan-300' : 'text-zinc-400'}`}>
            {Math.round(currentDegrees)}°
          </span>
        </div>

        {/* Right Turn Button */}
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            onSteerChange(1);
          }}
          onPointerUp={() => onSteerChange(0)}
          onPointerLeave={() => onSteerChange(0)}
          className={`h-7 px-2 sm:px-2.5 rounded-lg border flex items-center gap-1 font-race font-bold active:scale-95 transition-all cursor-pointer ${
            steerRatio > 0.1
              ? 'bg-cyan-500 border-cyan-300 text-black shadow-[0_0_12px_rgba(6,182,212,0.85)]'
              : 'bg-black/85 hover:bg-zinc-800 border-white/20 text-cyan-300'
          }`}
          title="Turn Right (Key D or Right Arrow)"
        >
          <span className="text-[7.5px] font-mono font-black">RIGHT [D]</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
