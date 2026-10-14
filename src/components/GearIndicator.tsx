import React from 'react';
import { ChevronUp, AlertTriangle } from 'lucide-react';

export interface GearIndicatorProps {
  /** Numeric gear (1-6) or character ('N', 'R', 'P') */
  gear: number | string;
  /** Explicit neutral override or state */
  isNeutral?: boolean;
  /** Explicit reverse override or state */
  isReverse?: boolean;
  /** Explicit park state */
  isPark?: boolean;
  /** Current engine RPM */
  currentRpm?: number;
  /** Maximum engine RPM (default: 9000) */
  maxRpm?: number;
  /** RPM at which redline flash triggers (default: 8200) */
  redlineThreshold?: number;
  /** Explicit redline override flag */
  isRedline?: boolean;
  /** Whether to show upshift arrow indicator at high RPM */
  showShiftPrompt?: boolean;
  /** Visual scale */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Optional container class */
  className?: string;
  /** Color theme for non-redline drive state */
  theme?: 'cyan' | 'red' | 'amber' | 'emerald';
}

export const GearIndicator: React.FC<GearIndicatorProps> = ({
  gear,
  isNeutral = false,
  isReverse = false,
  isPark = false,
  currentRpm,
  maxRpm = 9000,
  redlineThreshold = 8200,
  isRedline: explicitRedline,
  showShiftPrompt = true,
  size = 'md',
  className = '',
  theme = 'cyan',
}) => {
  // Determine displayed gear symbol
  let displaySymbol: string;
  if (isReverse || gear === 'R' || gear === -1) {
    displaySymbol = 'R';
  } else if (isPark || gear === 'P') {
    displaySymbol = 'P';
  } else if (isNeutral || gear === 'N' || gear === 0) {
    displaySymbol = 'N';
  } else {
    displaySymbol = String(gear);
  }

  // Calculate redline trigger
  const rpmExceeded = typeof currentRpm === 'number' && currentRpm >= redlineThreshold;
  const isCurrentlyRedlining = explicitRedline ?? rpmExceeded;
  const isNearRedline = typeof currentRpm === 'number' && currentRpm >= redlineThreshold - 600;

  // Size mappings
  const sizeClasses = {
    sm: {
      container: 'w-10 h-10',
      text: 'text-lg',
      label: 'text-[7px]',
      badge: 'text-[7px] -top-3 px-1',
    },
    md: {
      container: 'w-13 h-14',
      text: 'text-2xl',
      label: 'text-[8.5px]',
      badge: 'text-[8px] -top-4 px-1.5',
    },
    lg: {
      container: 'w-16 h-18',
      text: 'text-3xl sm:text-4xl',
      label: 'text-[10px]',
      badge: 'text-[9px] -top-5 px-2',
    },
    xl: {
      container: 'w-20 h-22',
      text: 'text-5xl',
      label: 'text-xs',
      badge: 'text-[10px] -top-6 px-2.5',
    },
  }[size];

  // Theme styling for normal drive state
  const themeAccent = {
    cyan: 'border-cyan-400/80 bg-cyan-950/70 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.4)]',
    red: 'border-red-500/80 bg-red-950/70 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.4)]',
    amber: 'border-amber-400/80 bg-amber-950/70 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.4)]',
    emerald: 'border-emerald-400/80 bg-emerald-950/70 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.4)]',
  }[theme];

  return (
    <div
      className={`relative flex flex-col items-center justify-center select-none ${className}`}
      data-testid="gear-indicator"
    >
      {/* SHIFT PROMPT / REDLINE BEACON */}
      {showShiftPrompt && isCurrentlyRedlining && displaySymbol !== 'R' && displaySymbol !== 'P' && displaySymbol !== 'N' && (
        <div
          className={`absolute ${sizeClasses.badge} py-0.5 rounded-full font-race font-black uppercase tracking-wider flex items-center gap-0.5 z-20 animate-bounce bg-red-600 text-white shadow-[0_0_15px_#ef4444] border border-white/50`}
        >
          <ChevronUp className="w-2.5 h-2.5 stroke-[3]" />
          <span>SHIFT</span>
        </div>
      )}

      {/* GEAR BINNACLE BOX */}
      <div
        className={`relative ${sizeClasses.container} rounded-2xl border-2 flex flex-col items-center justify-center font-race font-black transition-all duration-75 overflow-hidden backdrop-blur-xl ${
          // 1. REDLINE FLASH STATE (Highest Priority)
          isCurrentlyRedlining
            ? 'border-red-500 bg-red-600/30 text-white animate-pulse shadow-[0_0_30px_#ef4444,inset_0_0_20px_rgba(239,68,68,0.7)]'
            : // 2. REVERSE STATE
            displaySymbol === 'R'
            ? 'border-red-500/90 bg-red-950/80 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.6)]'
            : // 3. NEUTRAL STATE
            displaySymbol === 'N'
            ? 'border-emerald-400/90 bg-emerald-950/70 text-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.5)]'
            : // 4. PARK STATE
            displaySymbol === 'P'
            ? 'border-zinc-600 bg-zinc-900/80 text-zinc-400 shadow-md'
            : // 5. APPROACHING REDLINE
            isNearRedline
            ? 'border-amber-400 bg-amber-950/70 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.6)]'
            : // 6. NORMAL DRIVE GEAR (1-6)
              themeAccent
        }`}
      >
        {/* Redline Strobe Background Overlay */}
        {isCurrentlyRedlining && (
          <div className="absolute inset-0 bg-red-500/30 mix-blend-screen animate-ping pointer-events-none" />
        )}

        {/* Diagonal Carbon / Mesh lines texture */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 4px)',
          }}
        />

        {/* Current Gear Glyph */}
        <span
          className={`relative z-10 ${sizeClasses.text} tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] ${
            isCurrentlyRedlining ? 'scale-110 text-white drop-shadow-[0_0_12px_#ffffff]' : ''
          }`}
        >
          {displaySymbol}
        </span>

        {/* Small Sub-label */}
        <span
          className={`relative z-10 ${sizeClasses.label} font-mono font-bold tracking-widest uppercase -mt-0.5 opacity-80 ${
            isCurrentlyRedlining
              ? 'text-red-200'
              : displaySymbol === 'R'
              ? 'text-red-400'
              : displaySymbol === 'N'
              ? 'text-emerald-300'
              : 'text-zinc-400'
          }`}
        >
          {displaySymbol === 'R'
            ? 'REV'
            : displaySymbol === 'N'
            ? 'NEUT'
            : displaySymbol === 'P'
            ? 'PARK'
            : 'GEAR'}
        </span>
      </div>
    </div>
  );
};
