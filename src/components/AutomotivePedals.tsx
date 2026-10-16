import React, { useState } from 'react';
import { ArrowUp, ArrowDown, Zap, Flame, Footprints } from 'lucide-react';
import { soundEngine } from '../audio/SoundEngine';

interface AutomotivePedalsProps {
  throttleRatio: number; // 0.0 to 1.0
  brakeRatio: number; // 0.0 to 1.0
  isNitro: boolean;
  isHandbrake: boolean;
  nitroPercent?: number;
  currentGear?: string;
  onThrottleChange: (value: number) => void;
  onBrakeChange: (value: number, reverse?: boolean) => void;
  onNitroChange: (active: boolean) => void;
  onHandbrakeChange: (active: boolean) => void;
  onToggleReverse?: () => void;
  onShiftGear?: (gear: string) => void;
  onExitVehicle?: () => void;
  showQuickShifter?: boolean;
  className?: string;
}

export const AutomotivePedals: React.FC<AutomotivePedalsProps> = ({
  throttleRatio,
  brakeRatio,
  isNitro,
  isHandbrake,
  nitroPercent = 100,
  currentGear = 'D1',
  onThrottleChange,
  onBrakeChange,
  onNitroChange,
  onHandbrakeChange,
  onToggleReverse,
  onShiftGear,
  onExitVehicle,
  showQuickShifter = true,
  className = '',
}) => {
  const [localThrottleDown, setLocalThrottleDown] = useState(false);
  const [localBrakeDown, setLocalBrakeDown] = useState(false);

  const isPark = currentGear === 'P' || currentGear === '0';
  const isReverse = currentGear === 'R' || currentGear === 'REV' || currentGear === '-1';
  const isNeutral = currentGear === 'N';
  const isDrive = !isPark && !isReverse && !isNeutral;

  const isAccelerating = throttleRatio > 0 || localThrottleDown;
  const isBraking = brakeRatio > 0 || localBrakeDown;

  const prndSlots = [
    { id: 'P', label: 'P', color: 'text-red-400 border-red-500/80 bg-red-950/80' },
    { id: 'R', label: 'R', color: 'text-amber-400 border-amber-500/80 bg-amber-950/80' },
    { id: 'N', label: 'N', color: 'text-zinc-300 border-zinc-400/80 bg-zinc-800/80' },
    { id: 'D', label: 'D', color: 'text-cyan-300 border-cyan-400/80 bg-cyan-950/80' },
  ];

  return (
    <div
      className={`select-none touch-none flex flex-col items-stretch gap-2 p-2 sm:p-2.5 bg-[#090d15]/95 rounded-3xl border border-white/20 shadow-2xl ring-1 ring-white/10 w-[185px] sm:w-[210px] md:w-[230px] ${className}`}
      data-testid="automotive-pedals-system"
    >
      {/* 1. Quick Shifter Header (Shown on mobile & tablets to eliminate center button overlap) */}
      {showQuickShifter && onShiftGear && (
        <div className="flex items-center justify-between gap-1 w-full pb-1.5 border-b border-white/10">
          <div className="flex items-center gap-1 bg-zinc-950/90 p-0.5 rounded-xl border border-white/10">
            {prndSlots.map((slot) => {
              const active =
                (slot.id === 'P' && isPark) ||
                (slot.id === 'R' && isReverse) ||
                (slot.id === 'N' && isNeutral) ||
                (slot.id === 'D' && isDrive);

              return (
                <button
                  key={slot.id}
                  onClick={() => {
                    soundEngine.playUIClick();
                    const target = slot.id === 'D' ? (currentGear.startsWith('D') ? currentGear : 'D1') : slot.id;
                    onShiftGear(target);
                  }}
                  className={`w-6.5 sm:w-7 h-6 sm:h-6.5 rounded-lg font-mono font-black text-[10px] sm:text-xs flex items-center justify-center cursor-pointer transition-all active:scale-90 border ${
                    active
                      ? `${slot.color} shadow-md`
                      : 'border-transparent text-zinc-500 hover:text-zinc-300 bg-zinc-900/60'
                  }`}
                  title={`Shift to ${slot.id}`}
                >
                  {slot.label}
                </button>
              );
            })}
          </div>

          {/* Quick Exit Vehicle Button */}
          {onExitVehicle && (
            <button
              onClick={() => {
                soundEngine.playUIClick();
                onExitVehicle();
              }}
              className="h-6 sm:h-6.5 px-2 rounded-xl border border-amber-400/80 bg-amber-500/25 hover:bg-amber-500/40 text-amber-200 font-race font-black text-[8.5px] sm:text-[9px] flex items-center gap-1 cursor-pointer active:scale-95 transition-all shadow-sm shrink-0"
              title="Exit Sports Car (E or Q)"
            >
              <Footprints className="w-3 h-3 text-amber-300" />
              <span>EXIT</span>
            </button>
          )}
        </div>
      )}

      {/* 2. Drift Handbrake & Nitro Boost Row (Properly sized, zero text overlap) */}
      <div className="grid grid-cols-2 gap-1.5 w-full">
        {/* HYDRAULIC HANDBRAKE / DRIFT LEVER */}
        <button
          onPointerDown={() => onHandbrakeChange(true)}
          onPointerUp={() => onHandbrakeChange(false)}
          onPointerLeave={() => onHandbrakeChange(false)}
          onPointerCancel={() => onHandbrakeChange(false)}
          className={`h-9 sm:h-9.5 px-1.5 rounded-xl border flex items-center justify-center gap-1 font-race font-bold active:scale-95 transition-all shadow-md cursor-pointer ${
            isHandbrake
              ? 'border-amber-400 bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.9)]'
              : 'border-amber-500/60 bg-amber-950/80 text-amber-200 hover:bg-amber-900/80'
          }`}
          title="Hydraulic Handbrake / Drift (Hold SPACE or Z)"
        >
          <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
          <span className="text-[8.5px] sm:text-[9px] font-mono font-black uppercase tracking-tight truncate">DRIFT</span>
        </button>

        {/* NITROUS OXIDE BOOST TRIGGER */}
        <button
          onPointerDown={() => onNitroChange(true)}
          onPointerUp={() => onNitroChange(false)}
          onPointerLeave={() => onNitroChange(false)}
          onPointerCancel={() => onNitroChange(false)}
          className={`h-9 sm:h-9.5 px-1.5 rounded-xl border flex items-center justify-center gap-1 font-race font-bold active:scale-95 transition-all shadow-md cursor-pointer ${
            isNitro
              ? 'border-cyan-300 bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.9)] animate-pulse'
              : nitroPercent > 10
              ? 'border-cyan-500/60 bg-cyan-950/80 text-cyan-200 hover:bg-cyan-900/80'
              : 'border-zinc-800 bg-zinc-950 text-zinc-600'
          }`}
          title="Nitrous Oxide NOS Injection (Hold SHIFT)"
        >
          <Zap className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400 shrink-0" />
          <span className="text-[8.5px] sm:text-[9px] font-mono font-black uppercase tracking-tight">NOS</span>
          <span className="text-[7.5px] font-mono font-bold text-cyan-300">
            {Math.round(nitroPercent)}%
          </span>
        </button>
      </div>

      {/* 3. Main Floor-Mounted Racing Pedals (Thumb-friendly, spacious, no overlap) */}
      <div className="grid grid-cols-2 gap-2 w-full items-end">
        {/* BRAKE / REVERSE PEDAL */}
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            setLocalBrakeDown(true);
            onBrakeChange(1, true);
          }}
          onPointerUp={() => {
            setLocalBrakeDown(false);
            onBrakeChange(0, false);
          }}
          onPointerLeave={() => {
            setLocalBrakeDown(false);
            onBrakeChange(0, false);
          }}
          onPointerCancel={() => {
            setLocalBrakeDown(false);
            onBrakeChange(0, false);
          }}
          className={`w-full h-22 sm:h-25 md:h-27 rounded-2xl border-2 flex flex-col items-center justify-between p-2 font-race font-black active:scale-95 transition-all cursor-pointer relative overflow-hidden shadow-2xl ${
            isBraking
              ? 'border-red-400 bg-gradient-to-t from-red-600 via-red-700 to-red-500 text-white ring-2 ring-red-400 shadow-[0_0_30px_rgba(239,68,68,0.95)]'
              : 'border-red-500/60 bg-gradient-to-t from-zinc-950 via-red-950/60 to-red-900/30 text-red-200 hover:border-red-400'
          }`}
          style={{
            transform: isBraking ? 'translateY(4px) perspective(400px) rotateX(12deg)' : 'none',
          }}
          title="Brake / Reverse (Key S or Down Arrow)"
        >
          {/* Top Ribbed Rubber Vents */}
          <div className="w-full flex flex-col gap-1 items-center">
            <div className="w-3/4 h-1 bg-white/25 rounded-full" />
            <div className="w-3/4 h-1 bg-white/15 rounded-full" />
          </div>

          <div className="flex flex-col items-center my-0.5">
            <ArrowDown className={`w-5 sm:w-6 h-5 sm:h-6 ${isBraking ? 'text-white' : 'text-red-400'}`} />
            <span className="text-[11px] sm:text-xs font-black tracking-wider text-white">BRAKE</span>
            <span className="text-[7.5px] font-mono font-bold text-red-300">[S] REV</span>
          </div>

          {/* Bottom Pressure Meter Bar */}
          <div className="w-full h-1.5 bg-black/80 rounded-full overflow-hidden p-0.5 border border-red-500/40">
            <div
              className="h-full bg-red-500 rounded-full transition-all duration-75"
              style={{ width: `${Math.round(brakeRatio * 100 || (isBraking ? 100 : 0))}%` }}
            />
          </div>
        </button>

        {/* ACCELERATOR DRIVE PEDAL */}
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            setLocalThrottleDown(true);
            onThrottleChange(1);
          }}
          onPointerUp={() => {
            setLocalThrottleDown(false);
            onThrottleChange(0);
          }}
          onPointerLeave={() => {
            setLocalThrottleDown(false);
            onThrottleChange(0);
          }}
          onPointerCancel={() => {
            setLocalThrottleDown(false);
            onThrottleChange(0);
          }}
          className={`w-full h-25 sm:h-28 md:h-30 rounded-2xl border-2 flex flex-col items-center justify-between p-2 font-race font-black active:scale-95 transition-all cursor-pointer relative overflow-hidden shadow-2xl ${
            isReverse
              ? isAccelerating
                ? 'border-amber-300 bg-gradient-to-t from-amber-600 via-amber-700 to-amber-500 text-black ring-2 ring-amber-300 shadow-[0_0_35px_rgba(245,158,11,0.95)]'
                : 'border-amber-400/80 bg-gradient-to-t from-zinc-950 via-amber-950/70 to-amber-900/35 text-amber-200 hover:border-amber-300'
              : isAccelerating
              ? 'border-emerald-300 bg-gradient-to-t from-emerald-600 via-emerald-700 to-emerald-500 text-white ring-2 ring-emerald-300 shadow-[0_0_35px_rgba(16,185,129,0.95)]'
              : 'border-emerald-400/70 bg-gradient-to-t from-zinc-950 via-emerald-950/70 to-emerald-900/35 text-emerald-200 hover:border-emerald-300'
          }`}
          style={{
            transform: isAccelerating ? 'translateY(5px) perspective(400px) rotateX(15deg)' : 'none',
          }}
          title={isReverse ? 'Reverse Backward (Key W or Gas in Reverse)' : 'Drive Forward (Key W or Up Arrow)'}
        >
          {/* Drilled-Alloy Grip Pattern */}
          <div className="w-full grid grid-cols-2 gap-1 px-1 pt-0.5">
            <div className="w-2.5 h-2.5 rounded-full bg-black/60 border border-white/20 mx-auto" />
            <div className="w-2.5 h-2.5 rounded-full bg-black/60 border border-white/20 mx-auto" />
          </div>

          <div className="flex flex-col items-center my-0.5">
            {isReverse ? (
              <>
                <ArrowDown className={`w-5 sm:w-6 h-5 sm:h-6 ${isAccelerating ? 'text-black' : 'text-amber-300 animate-bounce'}`} />
                <span className="text-[11px] sm:text-xs font-black tracking-wider text-amber-100">REVERSE</span>
                <span className="text-[7.5px] font-mono font-bold text-amber-300">[W] REV</span>
              </>
            ) : (
              <>
                <ArrowUp className={`w-5 sm:w-6 h-5 sm:h-6 ${isAccelerating ? 'text-white' : 'text-emerald-300'}`} />
                <span className="text-[11px] sm:text-xs font-black tracking-wider text-white">DRIVE</span>
                <span className="text-[7.5px] font-mono font-bold text-emerald-300">[W] GAS</span>
              </>
            )}
          </div>

          {/* Live Throttle Percentage Meter Bar */}
          <div className="w-full h-1.5 bg-black/80 rounded-full overflow-hidden p-0.5 border border-white/20">
            <div
              className={`h-full rounded-full transition-all duration-75 ${
                isReverse ? 'bg-gradient-to-r from-amber-400 to-red-400' : 'bg-gradient-to-r from-emerald-400 to-cyan-300'
              }`}
              style={{ width: `${Math.round(throttleRatio * 100 || (isAccelerating ? 100 : 0))}%` }}
            />
          </div>
        </button>
      </div>
    </div>
  );
};
