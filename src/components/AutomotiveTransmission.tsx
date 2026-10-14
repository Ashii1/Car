import React from 'react';
import { AutomotiveDriveMode } from '../3d/ModernCarBuilder';

interface AutomotiveTransmissionProps {
  currentGear: string; // 'P', 'R', 'N', 'D1', 'D2', etc.
  onShiftGear: (gear: string) => void;
  onPaddleShift?: (direction: 'UP' | 'DOWN') => void;
  driveMode?: AutomotiveDriveMode;
  onDriveModeChange?: (mode: AutomotiveDriveMode) => void;
  carStyle?: 'bmw_m' | 'benz_amg';
  speedKmh?: number;
  className?: string;
}

export const AutomotiveTransmission: React.FC<AutomotiveTransmissionProps> = ({
  currentGear,
  onShiftGear,
  onPaddleShift,
  driveMode = 'SPORT+',
  onDriveModeChange,
  carStyle = 'bmw_m',
  speedKmh = 0,
  className = '',
}) => {
  const isPark = currentGear === 'P' || currentGear === '0';
  const isReverse = currentGear === 'R' || currentGear === 'REV' || currentGear === '-1';
  const isNeutral = currentGear === 'N';
  const isDrive = !isPark && !isReverse && !isNeutral;

  const PRND_SLOTS = [
    { id: 'P', label: 'P', name: 'PARK', color: 'text-red-400 bg-red-950/80 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.7)]' },
    { id: 'R', label: 'R', name: 'REV', color: 'text-amber-400 bg-amber-950/80 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.7)]' },
    { id: 'N', label: 'N', name: 'NEU', color: 'text-zinc-300 bg-zinc-800/80 border-zinc-400 shadow-[0_0_12px_rgba(255,255,255,0.4)]' },
    { id: 'D', label: 'D', name: 'DRIVE', color: 'text-cyan-300 bg-cyan-950/80 border-cyan-400 shadow-[0_0_18px_rgba(6,182,212,0.8)]' },
  ];

  return (
    <div
      className={`select-none touch-none flex items-center gap-2 p-1.5 sm:p-2 bg-black/92 backdrop-blur-2xl rounded-2xl border border-white/20 shadow-[0_0_25px_rgba(0,0,0,0.85)] ring-1 ring-white/10 ${className}`}
      data-testid="automotive-transmission-selector"
    >
      {/* Electronic PRND Shifter Gate */}
      <div className="flex items-center gap-1 bg-zinc-950/90 p-1 rounded-xl border border-white/10">
        {PRND_SLOTS.map((slot) => {
          const isActive =
            (slot.id === 'P' && isPark) ||
            (slot.id === 'R' && isReverse) ||
            (slot.id === 'N' && isNeutral) ||
            (slot.id === 'D' && isDrive);

          return (
            <button
              key={slot.id}
              onClick={() => {
                const target = slot.id === 'D' ? (currentGear.startsWith('D') ? currentGear : 'D1') : slot.id;
                onShiftGear(target);
              }}
              className={`w-7 sm:w-8 h-8 rounded-lg flex flex-col items-center justify-center font-mono font-black text-xs transition-all cursor-pointer active:scale-95 border ${
                isActive
                  ? slot.color
                  : 'bg-zinc-900/60 hover:bg-zinc-800 border-white/5 text-zinc-500 hover:text-zinc-300'
              }`}
              title={`Shift into ${slot.name} (${slot.id})`}
            >
              <span className="leading-none">{slot.label}</span>
              <span className="text-[6px] tracking-tighter opacity-80">{slot.name}</span>
            </button>
          );
        })}
      </div>

      {/* Active Sequential Gear Badge & Manual Shift Stepper */}
      <div className="flex items-center gap-1.5 pl-1 border-l border-white/15">
        <div className="flex flex-col items-center min-w-[34px]">
          <span className="text-[7px] font-mono text-zinc-400 font-bold uppercase tracking-widest">
            GEAR
          </span>
          <span
            className={`font-race font-black text-base sm:text-lg leading-tight italic ${
              isPark
                ? 'text-red-400'
                : isReverse
                ? 'text-amber-400'
                : isNeutral
                ? 'text-zinc-300'
                : 'text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]'
            }`}
          >
            {currentGear}
          </span>
        </div>

        {/* Manual Paddle Shift Buttons (+ / -) */}
        {onPaddleShift && (
          <div className="flex flex-col gap-0.5">
            <button
              onClick={() => onPaddleShift('UP')}
              className="w-5 h-4 rounded bg-zinc-850 hover:bg-zinc-700 active:scale-90 border border-white/10 text-cyan-300 hover:text-white flex items-center justify-center font-mono font-black text-[9px] transition-all cursor-pointer"
              title="Upshift Paddle (Key X)"
            >
              +
            </button>
            <button
              onClick={() => onPaddleShift('DOWN')}
              className="w-5 h-4 rounded bg-zinc-850 hover:bg-zinc-700 active:scale-90 border border-white/10 text-amber-300 hover:text-white flex items-center justify-center font-mono font-black text-[9px] transition-all cursor-pointer"
              title="Downshift Paddle (Key Z)"
            >
              −
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
