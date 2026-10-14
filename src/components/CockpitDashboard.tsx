import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Flame,
  Zap,
  Gauge,
  Thermometer,
  ShieldAlert,
  Activity,
  Sliders,
  Maximize2,
  Minimize2,
  Car,
  ChevronUp,
} from 'lucide-react';
import { OpenCityPlayerState } from '../game/OpenWorldPhysics';
import { BikeDamageState } from '../types/openCity';
import { soundEngine } from '../audio/SoundEngine';
import { GearIndicator } from './GearIndicator';

export type CockpitDriveMode = 'SPORT+' | 'CORSA' | 'GT_CRUISE';

export interface CockpitDashboardProps {
  playerState: OpenCityPlayerState;
  speedUnit: 'kmh' | 'mph';
  bikeDamage?: BikeDamageState;
  onUnitToggle?: () => void;
  className?: string;
  isCompactDefault?: boolean;
  dockPosition?: 'top' | 'bottom';
  onToggleDock?: () => void;
}

export const CockpitDashboard: React.FC<CockpitDashboardProps> = ({
  playerState,
  speedUnit,
  bikeDamage,
  onUnitToggle,
  className = '',
  isCompactDefault = false,
  dockPosition = 'bottom',
  onToggleDock,
}) => {
  const [driveMode, setDriveMode] = useState<CockpitDriveMode>('SPORT+');
  const [isCompact, setIsCompact] = useState<boolean>(isCompactDefault);
  const [engineTempC, setEngineTempC] = useState<number>(88); // nominal 88°C
  const maxSpeedRecordedRef = useRef<number>(0);
  const [maxSpeedRecorded, setMaxSpeedRecorded] = useState<number>(0);

  // Raw physics calculations
  const rawSpeedKmh = Math.abs(playerState.speed || 0);
  const displaySpeed = Math.round(speedUnit === 'mph' ? rawSpeedKmh * 0.621371 : rawSpeedKmh);

  // Track maximum speed
  useEffect(() => {
    if (displaySpeed > maxSpeedRecordedRef.current) {
      maxSpeedRecordedRef.current = displaySpeed;
      setMaxSpeedRecorded(displaySpeed);
    }
  }, [displaySpeed]);

  // Derived high-performance sports car gear
  const gear = useMemo(() => {
    if (playerState.isReversing) return 'R';
    if (rawSpeedKmh < 0.6) return 'P';
    if (playerState.gear) return `${playerState.gear}`;
    if (rawSpeedKmh < 45) return '1';
    if (rawSpeedKmh < 85) return '2';
    if (rawSpeedKmh < 135) return '3';
    if (rawSpeedKmh < 185) return '4';
    if (rawSpeedKmh < 240) return '5';
    return '6';
  }, [playerState.isReversing, rawSpeedKmh, playerState.gear]);

  // RPM computation: Idle 900 RPM up to 9,000 RPM redline
  const rpmRatio = Math.max(0, Math.min(1.0, playerState.rpmRatio ?? (rawSpeedKmh / 280)));
  const calculatedRpm = useMemo(() => {
    if (rawSpeedKmh < 0.5) {
      // Gentle idle vibration around 950 RPM
      return 920 + Math.sin(Date.now() * 0.005) * 45;
    }
    // High revving sports engine 900 -> 9,000 RPM
    return Math.min(9000, Math.round(950 + rpmRatio * 7900));
  }, [rawSpeedKmh, rpmRatio]);

  const rpmThousands = (calculatedRpm / 1000).toFixed(1);
  const isRedline = calculatedRpm >= 8200;
  const isRevLimiter = calculatedRpm >= 8750;

  // Realistic Turbo Boost calculation in BAR (-0.4 BAR idle vacuum up to +2.4 BAR full boost)
  const boostBar = useMemo(() => {
    if (rawSpeedKmh < 1) return -0.4;
    const throttleRatio = Math.min(1.0, rpmRatio * 1.1);
    const nitroBoost = playerState.isNitroActive ? 0.7 : 0.0;
    return Number((-0.2 + throttleRatio * 1.8 + nitroBoost).toFixed(2));
  }, [rawSpeedKmh, rpmRatio, playerState.isNitroActive]);

  // Engine Temperature simulation:
  // Baseline ~90°C. Heavy throttle, sustained speed, and nitro elevate heat up to 105°C - 110°C.
  // Cruising/coast allows ram-air cooling back toward 90°C.
  // Engine Temperature simulation (uses refs for stability)
  const playerStateRef = useRef(playerState);
  playerStateRef.current = playerState;
  const rawSpeedRef = useRef(rawSpeedKmh);
  rawSpeedRef.current = rawSpeedKmh;
  const bikeDamageRef = useRef(bikeDamage);
  bikeDamageRef.current = bikeDamage;

  useEffect(() => {
    const timer = setInterval(() => {
      setEngineTempC((prev) => {
        let target = 90; // Standard optimal
        const ps = playerStateRef.current;
        const spd = rawSpeedRef.current;
        const dmg = bikeDamageRef.current;
        if (ps.isNitroActive) {
          target = 104;
        } else if (spd > 180) {
          target = 98;
        } else if (spd > 100) {
          target = 93;
        } else if (spd < 5) {
          target = 88;
        }

        // Damage factor (radiator strain)
        if (dmg && dmg.overallDamage > 0.25) {
          target += dmg.overallDamage * 16;
        }

        // Smoothly interpolate towards target
        const diff = target - prev;
        const step = diff > 0 ? 0.35 : -0.25;
        return Math.max(70, Math.min(125, Number((prev + step * 0.4).toFixed(1))));
      });
    }, 400);

    return () => clearInterval(timer);
  }, []);

  // Temperature display (Celsius or Fahrenheit)
  const isFahrenheit = speedUnit === 'mph';
  const displayTemp = isFahrenheit ? Math.round(engineTempC * 1.8 + 32) : Math.round(engineTempC);
  const tempUnit = isFahrenheit ? '°F' : '°C';

  // Engine temperature status
  const tempStatus = useMemo(() => {
    if (engineTempC > 108) return { label: 'CRITICAL HOT', color: 'text-red-500', alert: true };
    if (engineTempC > 98) return { label: 'WARM', color: 'text-amber-400', alert: false };
    if (engineTempC < 75) return { label: 'COLD', color: 'text-sky-400', alert: false };
    return { label: 'OPTIMAL', color: 'text-emerald-400', alert: false };
  }, [engineTempC]);

  // Temperature gauge fill ratio (50°C to 125°C range)
  const tempGaugePercent = Math.max(0, Math.min(100, ((engineTempC - 50) / (125 - 50)) * 100));

  // Nitro Boost %
  const nitroPercent = Math.round(playerState.nitroAmount ?? 100);

  // Shift Light Array segments (12 LEDs)
  const shiftLights = useMemo(() => {
    // 0 to 1 ratio of calculatedRpm / 9000
    const ratio = calculatedRpm / 9000;
    const lights = [];
    for (let i = 0; i < 12; i++) {
      const threshold = 0.35 + (i / 12) * 0.6;
      const active = ratio >= threshold;
      let color = 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]';
      if (i >= 4 && i < 8) {
        color = 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]';
      } else if (i >= 8) {
        color = 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,1)]';
      }
      lights.push({ id: i, active, color });
    }
    return lights;
  }, [calculatedRpm]);

  // Mode Theme Accents
  const themeClasses = useMemo(() => {
    switch (driveMode) {
      case 'CORSA':
        return {
          border: 'border-red-500/40 shadow-[0_0_35px_rgba(239,68,68,0.25)]',
          accentText: 'text-red-400',
          accentBg: 'bg-red-500',
          gaugeGradient: 'from-amber-500 via-orange-500 to-red-600',
          dialGlow: '#ef4444',
          badge: 'bg-red-950/80 border-red-500 text-red-200',
        };
      case 'GT_CRUISE':
        return {
          border: 'border-amber-400/40 shadow-[0_0_35px_rgba(245,158,11,0.2)]',
          accentText: 'text-amber-300',
          accentBg: 'bg-amber-400',
          gaugeGradient: 'from-sky-400 via-emerald-400 to-amber-400',
          dialGlow: '#f59e0b',
          badge: 'bg-amber-950/80 border-amber-400 text-amber-200',
        };
      case 'SPORT+':
      default:
        return {
          border: 'border-cyan-500/40 shadow-[0_0_35px_rgba(6,182,212,0.25)]',
          accentText: 'text-cyan-400',
          accentBg: 'bg-cyan-400',
          gaugeGradient: 'from-blue-500 via-cyan-400 to-emerald-400',
          dialGlow: '#06b6d4',
          badge: 'bg-cyan-950/80 border-cyan-400 text-cyan-200',
        };
    }
  }, [driveMode]);

  // Cycle drive modes
  const handleToggleMode = () => {
    soundEngine.playUIClick();
    const modes: CockpitDriveMode[] = ['SPORT+', 'CORSA', 'GT_CRUISE'];
    const nextIdx = (modes.indexOf(driveMode) + 1) % modes.length;
    setDriveMode(modes[nextIdx]);
  };

  // Tachometer SVG needle rotation (-125° to +125° sweep)
  const tachometerAngle = -125 + (calculatedRpm / 9000) * 250;

  // Arc stroke dash for tachometer (circumference = 2 * PI * r)
  // Radius = 68, circumference ≈ 427.26
  // 250 degrees out of 360 = 250/360 * 427.26 ≈ 296.7
  const tachArcLength = 296.7;
  const tachFilledLength = (calculatedRpm / 9000) * tachArcLength;

  return (
    <div
      className={`pointer-events-auto transition-all duration-300 select-none ${className}`}
      data-testid="cockpit-dashboard"
    >
      {/* =========================================================
          COCKPIT CLUSTER SHELL (Smoked Glass + Carbon Fiber Bezel)
          ========================================================= */}
      <div
        className={`relative rounded-3xl border backdrop-blur-2xl bg-black/90 p-2.5 sm:p-3.5 flex flex-col gap-2 transition-all duration-300 ${
          themeClasses.border
        } ${isCompact ? 'max-w-[280px]' : 'w-full max-w-[540px]'}`}
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.06) 0%, transparent 75%)',
        }}
      >
        {/* TOP STATUS BAR: SHIFT LIGHT ARRAY & TELEMETRY BADGES */}
        <div className="flex items-center justify-between gap-1.5 pb-1 border-b border-white/10">
          {/* Mode Switcher Pill */}
          <button
            onClick={handleToggleMode}
            className={`px-2 py-0.5 rounded-lg border text-[9px] font-race font-black tracking-wider uppercase cursor-pointer active:scale-95 transition-all flex items-center gap-1 ${themeClasses.badge}`}
            title="Click to Switch Drive Mode (SPORT+ / CORSA / GT CRUISE)"
          >
            <Sliders className="w-2.5 h-2.5" />
            <span>{driveMode}</span>
          </button>

          {/* F1 / GT3 Sequential Shift Light Array */}
          <div className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 bg-zinc-950/90 rounded-full border border-white/10 shadow-inner">
            {shiftLights.map((light) => (
              <div
                key={light.id}
                className={`w-1.5 sm:w-2 h-2 sm:h-2.5 rounded-sm transition-all duration-75 ${
                  light.active
                    ? isRevLimiter
                      ? 'bg-red-500 animate-ping shadow-[0_0_12px_#ef4444]'
                      : light.color
                    : 'bg-zinc-800/80 border border-white/5'
                }`}
              />
            ))}
          </div>

          {/* System Flags, Dock Toggle & Compact Toggle */}
          <div className="flex items-center gap-1">
            <span className="hidden sm:inline-block text-[8px] font-mono font-bold text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-500/30">
              ABS • TCS
            </span>
            {onToggleDock && (
              <button
                onClick={onToggleDock}
                className="px-1.5 py-0.5 rounded-md text-[8px] font-mono font-bold text-cyan-300 hover:text-white bg-cyan-950/60 border border-cyan-500/30 hover:border-cyan-400 transition-all cursor-pointer flex items-center gap-0.5"
                title={dockPosition === 'bottom' ? 'Dock Cockpit at Top-Left' : 'Dock Cockpit at Bottom Center'}
              >
                <span>{dockPosition === 'bottom' ? '▲ TOP' : '▼ BTM'}</span>
              </button>
            )}
            <button
              onClick={() => setIsCompact(!isCompact)}
              className="p-1 rounded-md text-zinc-400 hover:text-white bg-zinc-900 border border-white/10 hover:border-white/30 transition-all cursor-pointer"
              title={isCompact ? 'Expand Full Cockpit Dashboard' : 'Compact Cluster'}
            >
              {isCompact ? <Maximize2 className="w-2.5 h-2.5" /> : <Minimize2 className="w-2.5 h-2.5" />}
            </button>
          </div>
        </div>

        {/* MAIN CLUSTER BODY: DUAL WINGS + CENTRAL TACHOMETER */}
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          {/* =====================================================
              LEFT WING: ENGINE TEMPERATURE & THERMAL TELEMETRY GAUGE
              ===================================================== */}
          {!isCompact && (
            <div className="flex-1 flex flex-col justify-between h-[120px] p-2 rounded-2xl bg-zinc-950/70 border border-white/10 shadow-inner relative overflow-hidden">
              {/* Thermal Header */}
              <div className="flex items-center justify-between text-[8px] font-mono font-bold text-zinc-400">
                <span className="flex items-center gap-1 text-cyan-300">
                  <Thermometer className="w-3 h-3 text-cyan-400" />
                  <span>COOLANT / OIL</span>
                </span>
                <span className={`font-mono-num font-bold ${tempStatus.color}`}>
                  {tempStatus.label}
                </span>
              </div>

              {/* Live Digital Temperature */}
              <div className="flex items-baseline gap-1 my-1">
                <span
                  className={`text-2xl font-race font-black italic tracking-tighter drop-shadow ${
                    tempStatus.alert ? 'text-red-400 animate-pulse' : 'text-white'
                  }`}
                >
                  {displayTemp}
                </span>
                <span className="text-[10px] font-race font-bold text-zinc-400">
                  {tempUnit}
                </span>
                <span className="text-[8px] font-mono text-zinc-500 ml-auto">
                  NORM: {isFahrenheit ? '194°F' : '90°C'}
                </span>
              </div>

              {/* Automotive Ladder Temperature Gauge (C to H) */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[7px] font-mono font-bold text-zinc-400 px-0.5">
                  <span className="text-sky-400">C (COLD)</span>
                  <span className="text-emerald-400">◆ OPT</span>
                  <span className="text-red-400">H (HOT)</span>
                </div>
                {/* Segmented / Gradient Temp Bar */}
                <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-white/15">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      engineTempC > 105
                        ? 'bg-gradient-to-r from-amber-500 via-red-500 to-red-600 shadow-[0_0_12px_#ef4444]'
                        : 'bg-gradient-to-r from-sky-400 via-emerald-400 to-amber-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                    }`}
                    style={{ width: `${tempGaugePercent}%` }}
                  />
                </div>
              </div>

              {/* Oil Pressure & Radiator Status */}
              <div className="flex items-center justify-between text-[7.5px] font-mono text-zinc-400 pt-1 border-t border-white/5">
                <span>OIL PRESS: 5.2 BAR</span>
                <span className="text-cyan-400">
                  {bikeDamage && bikeDamage.overallDamage > 0.3 ? '⚠️ RAD STRESS' : 'FAN AUTO'}
                </span>
              </div>
            </div>
          )}

          {/* =====================================================
              CENTER POD: DIGITAL SPEEDOMETER, GEAR DISPLAY & TACHOMETER
              ===================================================== */}
          <div className="relative flex flex-col items-center justify-center min-w-[150px] sm:min-w-[185px]">
            {/* SVG Precision Dial Arc */}
            <div className="relative w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                <defs>
                  {/* Gauge Gradient */}
                  <linearGradient id="tachGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="60%" stopColor="#06b6d4" />
                    <stop offset="85%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                  {/* Glow filter */}
                  <filter id="dialGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={themeClasses.dialGlow} />
                  </filter>
                </defs>

                {/* Track Background */}
                <circle
                  cx="80"
                  cy="80"
                  r="68"
                  fill="none"
                  stroke="#27272a"
                  strokeWidth="7"
                  strokeDasharray="296.7 427"
                  strokeLinecap="round"
                  transform="rotate(145 80 80)"
                />

                {/* Redline Warning Arc (8k to 9k RPM) */}
                <circle
                  cx="80"
                  cy="80"
                  r="68"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="8"
                  strokeDasharray="40 427"
                  strokeDashoffset="-256"
                  strokeLinecap="round"
                  opacity="0.6"
                  transform="rotate(145 80 80)"
                />

                {/* Active Dynamic RPM Progress Arc */}
                <circle
                  cx="80"
                  cy="80"
                  r="68"
                  fill="none"
                  stroke="url(#tachGrad)"
                  strokeWidth="7"
                  strokeDasharray={`${tachFilledLength} 427`}
                  strokeLinecap="round"
                  filter="url(#dialGlow)"
                  className="transition-all duration-75"
                  transform="rotate(145 80 80)"
                />
              </svg>

              {/* TACHOMETER RADIAL NUMERAL LABELS (0 to 9 x1000) */}
              <div className="absolute inset-0 pointer-events-none">
                {[0, 2, 4, 6, 8, 9].map((val) => {
                  const angle = -125 + (val / 9) * 250;
                  const rad = (angle - 90) * (Math.PI / 180);
                  const radius = 56;
                  const x = 80 + radius * Math.cos(rad);
                  const y = 80 + radius * Math.sin(rad);
                  return (
                    <span
                      key={val}
                      className={`absolute text-[8px] font-race font-bold -translate-x-1/2 -translate-y-1/2 ${
                        val >= 8 ? 'text-red-400 font-black' : 'text-zinc-500'
                      }`}
                      style={{
                        left: `${(x / 160) * 100}%`,
                        top: `${(y / 160) * 100}%`,
                      }}
                    >
                      {val}
                    </span>
                  );
                })}
              </div>

              {/* INNER COCKPIT HUB: SPEEDOMETER & GEAR DISPLAY */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                {/* Upshift Shift Prompt */}
                {isRedline && gear !== '6' && gear !== 'R' && (
                  <div className="absolute top-7 flex items-center gap-0.5 text-[8px] font-race font-black text-amber-300 bg-amber-950/90 px-1.5 py-0.2 rounded-full border border-amber-400 animate-bounce shadow-[0_0_10px_#f59e0b]">
                    <ChevronUp className="w-2.5 h-2.5" />
                    <span>SHIFT</span>
                  </div>
                )}

                {/* Large Bold Digital Speedometer */}
                <div className="flex items-baseline justify-center gap-1 -mt-1">
                  <span className="text-3xl sm:text-4xl font-race font-black italic tracking-tighter text-white drop-shadow-[0_2px_14px_rgba(255,255,255,0.4)]">
                    {displaySpeed}
                  </span>
                </div>

                {/* Speed Unit Toggle Button */}
                <button
                  onClick={onUnitToggle}
                  className="text-[9px] font-race font-bold text-cyan-400 uppercase tracking-widest hover:text-white cursor-pointer active:scale-95 transition-all -mt-1"
                  title="Click to toggle KM/H and MPH"
                >
                  {speedUnit.toUpperCase()}
                </button>

                {/* Embedded Gear Indicator Component */}
                <div className="mt-1 flex items-center justify-center">
                  <GearIndicator
                    gear={gear}
                    isNeutral={gear === 'N'}
                    isReverse={gear === 'R'}
                    isPark={gear === 'P'}
                    currentRpm={calculatedRpm}
                    maxRpm={9000}
                    redlineThreshold={8200}
                    isRedline={isRedline}
                    showShiftPrompt={true}
                    size="sm"
                    theme={driveMode === 'CORSA' ? 'red' : driveMode === 'GT_CRUISE' ? 'amber' : 'cyan'}
                  />
                </div>

                {/* Live RPM Digital Readout */}
                <span
                  className={`text-[8px] font-mono-num font-bold mt-0.5 ${
                    isRedline ? 'text-red-400 animate-redline' : 'text-zinc-400'
                  }`}
                >
                  {calculatedRpm.toLocaleString()} RPM
                </span>
              </div>
            </div>
          </div>

          {/* =====================================================
              RIGHT WING: TURBO BOOST, NITROUS & GRIP TELEMETRY
              ===================================================== */}
          {!isCompact && (
            <div className="flex-1 flex flex-col justify-between h-[120px] p-2 rounded-2xl bg-zinc-950/70 border border-white/10 shadow-inner relative overflow-hidden">
              {/* Telemetry Header */}
              <div className="flex items-center justify-between text-[8px] font-mono font-bold text-zinc-400">
                <span className="flex items-center gap-1 text-cyan-300">
                  <Activity className="w-3 h-3 text-cyan-400" />
                  <span>TWIN-TURBO BOOST</span>
                </span>
                <span className="font-mono-num font-bold text-cyan-300">
                  {boostBar > 0 ? `+${boostBar}` : boostBar} BAR
                </span>
              </div>

              {/* Dynamic Boost Gauge Ladder */}
              <div className="flex flex-col gap-0.5 my-1">
                <div className="flex justify-between text-[7px] font-mono text-zinc-400">
                  <span>SPOOL / PSI</span>
                  <span className="text-zinc-300">{Math.round(boostBar * 14.5)} PSI</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-400 rounded-full transition-all duration-75 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                    style={{ width: `${Math.max(5, Math.min(100, ((boostBar + 0.4) / 2.8) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Nitro Boost Level */}
              <div className="flex flex-col gap-0.5">
                <div className="flex justify-between text-[7px] font-mono text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 text-cyan-400 fill-cyan-400" />
                    <span>NOS INJECTION</span>
                  </span>
                  <span className="text-cyan-300 font-mono-num">{nitroPercent}%</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-400 rounded-full transition-all duration-75 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                    style={{ width: `${nitroPercent}%` }}
                  />
                </div>
              </div>

              {/* Surface Friction & Drift Telemetry */}
              <div className="flex items-center justify-between text-[7.5px] font-mono font-bold text-zinc-400 pt-1 border-t border-white/5">
                <span className="uppercase text-zinc-300 truncate max-w-[85px]">
                  {playerState.surfaceType === 'wet_asphalt' ? '🌧️ WET TARMAC' : '🏁 DRY TARMAC'}
                </span>
                <span className="text-cyan-400 font-mono-num">
                  {playerState.isDrifting ? 'DRIFT ⚡' : `${Math.round((playerState.surfaceFriction || 1.0) * 100)}% GRIP`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM TELEMETRY FOOTER */}
        <div className="flex items-center justify-between text-[7.5px] font-mono text-zinc-500 pt-1 border-t border-white/10 px-1">
          <span>HIGH-PERFORMANCE V8 TWIN-TURBO • 720 HP</span>
          <span>TOP SPEED: {maxSpeedRecorded} {speedUnit.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
};
