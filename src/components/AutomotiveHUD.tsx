import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Thermometer,
  Zap,
  Activity,
  Sliders,
  Maximize2,
  Minimize2,
  Gauge,
  Flame,
  ShieldAlert,
  Car,
  Palette,
  Wind,
  Sparkles,
} from 'lucide-react';
import { GearIndicator } from './GearIndicator';
import { AutomotiveDriveMode, DRIVE_MODE_AMBIENT_COLORS } from '../3d/ModernCarBuilder';

export type { AutomotiveDriveMode };

export interface VehicleState {
  speed: number; // in km/h
  rpm?: number;
  gear?: number | string;
  rpmRatio?: number;
  nitroAmount?: number;
  isNitroActive?: boolean;
  isBraking?: boolean;
  isReversing?: boolean;
  isDrifting?: boolean;
  surfaceType?: string;
  surfaceFriction?: number;
  activeAeroAngle?: number;
  activeAeroDownforceKg?: number;
  isAirbrakeActive?: boolean;
}

export interface AutomotiveHUDProps {
  /** Live vehicle telemetry state */
  vehicleState: VehicleState;
  /** Speed measurement unit */
  speedUnit?: 'kmh' | 'mph';
  /** Callback when speed unit is clicked */
  onUnitToggle?: () => void;
  /** Active drive mode */
  driveMode?: AutomotiveDriveMode;
  /** Callback to change drive mode */
  onDriveModeChange?: (mode: AutomotiveDriveMode) => void;
  /** Docking alignment position */
  dockPosition?: 'top' | 'bottom';
  /** Callback to toggle dock position */
  onToggleDock?: () => void;
  /** Compact minimal mode toggle */
  compact?: boolean;
  /** Callback to toggle compact mode */
  onToggleCompact?: () => void;
  /** Additional styling class */
  className?: string;
  /** Active German car design style */
  carStyle?: 'bmw_m' | 'benz_amg';
  /** Callback to toggle between BMW and Benz */
  onToggleCarStyle?: () => void;
  /** Active internal ambient light color */
  ambientColor?: string;
  /** Callback when ambient light color changes */
  onAmbientColorChange?: (color: string) => void;
}

export const AutomotiveHUD: React.FC<AutomotiveHUDProps> = ({
  vehicleState,
  speedUnit = 'kmh',
  onUnitToggle,
  driveMode: externalDriveMode,
  onDriveModeChange,
  dockPosition = 'bottom',
  onToggleDock,
  compact: externalCompact,
  onToggleCompact,
  className = '',
  carStyle = 'bmw_m',
  onToggleCarStyle,
  ambientColor: externalAmbientColor,
  onAmbientColorChange,
}) => {
  // Internal drive mode state if not controlled externally
  const [internalMode, setInternalMode] = useState<AutomotiveDriveMode>('SPORT+');
  const currentMode = externalDriveMode ?? internalMode;

  // Internal compact state if not controlled externally
  const [internalCompact, setInternalCompact] = useState<boolean>(false);
  const isCompact = externalCompact ?? internalCompact;

  // Dynamic Engine Temperature Simulation (°C)
  // Baseline 89°C optimal. Climbs with high speed, throttle, and nitro boost.
  const [engineTempC, setEngineTempC] = useState<number>(89);
  const topSpeedRecordedRef = useRef<number>(0);
  const [topSpeedRecorded, setTopSpeedRecorded] = useState<number>(0);

  // Speed math
  const rawSpeedKmh = Math.abs(vehicleState.speed || 0);
  const displaySpeed = Math.round(speedUnit === 'mph' ? rawSpeedKmh * 0.621371 : rawSpeedKmh);

  useEffect(() => {
    if (displaySpeed > topSpeedRecordedRef.current) {
      topSpeedRecordedRef.current = displaySpeed;
      setTopSpeedRecorded(displaySpeed);
    }
  }, [displaySpeed]);

  // Derived Gear (Neutral, Reverse, Park, 1-6)
  const isReverse = Boolean(vehicleState.isReversing);
  const isNeutral = !isReverse && rawSpeedKmh < 0.8 && !vehicleState.rpmRatio;
  const isPark = !isReverse && rawSpeedKmh < 0.2;

  const currentGear = useMemo(() => {
    if (isReverse) return 'R';
    if (isPark) return 'P';
    if (isNeutral) return 'N';
    if (vehicleState.gear) return vehicleState.gear;
    if (rawSpeedKmh < 45) return 1;
    if (rawSpeedKmh < 85) return 2;
    if (rawSpeedKmh < 135) return 3;
    if (rawSpeedKmh < 185) return 4;
    if (rawSpeedKmh < 240) return 5;
    return 6;
  }, [isReverse, isPark, isNeutral, vehicleState.gear, rawSpeedKmh]);

  // RPM math (idle ~920 RPM, redline 8,200 - 9,000 RPM)
  const rpmRatio = Math.max(0, Math.min(1.0, vehicleState.rpmRatio ?? rawSpeedKmh / 280));
  const currentRpm = useMemo(() => {
    if (rawSpeedKmh < 0.5) {
      // Gentle idle fluctuation
      return Math.round(920 + Math.sin(Date.now() * 0.006) * 35);
    }
    return Math.min(9000, Math.round(950 + rpmRatio * 7900));
  }, [rawSpeedKmh, rpmRatio]);

  const redlineThreshold = 8200;
  const isRedline = currentRpm >= redlineThreshold;
  const isRevLimiter = currentRpm >= 8750;

  // Real-time Engine Temperature Update Loop (uses refs so interval is stable and never recreates continuously)
  const vehicleStateRef = useRef(vehicleState);
  vehicleStateRef.current = vehicleState;
  const rawSpeedRef = useRef(rawSpeedKmh);
  rawSpeedRef.current = rawSpeedKmh;

  useEffect(() => {
    const interval = setInterval(() => {
      setEngineTempC((prev) => {
        let targetTemp = 90; // Golden optimal temp
        const vs = vehicleStateRef.current;
        const spd = rawSpeedRef.current;
        if (vs.isNitroActive) {
          targetTemp = 104; // Nitro thermal load
        } else if (spd > 190) {
          targetTemp = 99; // High-speed autobahn load
        } else if (spd > 110) {
          targetTemp = 93;
        } else if (spd < 5) {
          targetTemp = 88; // Low-load idle
        }

        const delta = targetTemp - prev;
        const rate = delta > 0 ? 0.35 : -0.22;
        return Math.max(68, Math.min(125, Number((prev + rate * 0.4).toFixed(1))));
      });
    }, 450);

    return () => clearInterval(interval);
  }, []);

  // Temperature unit conversion
  const isFahrenheit = speedUnit === 'mph';
  const displayTemp = isFahrenheit ? Math.round(engineTempC * 1.8 + 32) : Math.round(engineTempC);
  const tempUnit = isFahrenheit ? '°F' : '°C';

  // Engine temperature status
  const tempStatus = useMemo(() => {
    if (engineTempC > 108) return { label: 'HOT / WARNING', color: 'text-red-500', alert: true };
    if (engineTempC > 98) return { label: 'WARM', color: 'text-amber-400', alert: false };
    if (engineTempC < 75) return { label: 'COLD', color: 'text-sky-400', alert: false };
    return { label: 'OPTIMAL', color: 'text-emerald-400', alert: false };
  }, [engineTempC]);

  // Temperature bar fill percentage (50°C to 125°C)
  const tempBarPercent = Math.max(0, Math.min(100, ((engineTempC - 50) / (125 - 50)) * 100));

  // Turbo Boost in BAR (-0.4 to +2.4 BAR)
  const boostBar = useMemo(() => {
    if (rawSpeedKmh < 1) return -0.4;
    const throttleRatio = Math.min(1.0, rpmRatio * 1.15);
    const nitroBoost = vehicleState.isNitroActive ? 0.65 : 0;
    return Number((-0.2 + throttleRatio * 1.8 + nitroBoost).toFixed(2));
  }, [rawSpeedKmh, rpmRatio, vehicleState.isNitroActive]);

  // Nitrous level %
  const nitroPercent = Math.round(vehicleState.nitroAmount ?? 100);

  // Sequential shift lights (12 LEDs across top)
  const shiftLights = useMemo(() => {
    const ratio = currentRpm / 9000;
    const items = [];
    for (let i = 0; i < 12; i++) {
      const threshold = 0.35 + (i / 12) * 0.6;
      const active = ratio >= threshold;
      let color = 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]';
      if (i >= 4 && i < 8) {
        color = 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]';
      } else if (i >= 8) {
        color = 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,1)]';
      }
      items.push({ id: i, active, color });
    }
    return items;
  }, [currentRpm]);

  // Ambient Lighting & Drive Mode state
  const [showAmbientMenu, setShowAmbientMenu] = useState(false);
  const activeAmbientHex = externalAmbientColor || DRIVE_MODE_AMBIENT_COLORS[currentMode] || '#ef4444';

  const aeroAngle = vehicleState.activeAeroAngle ?? 0;
  const aeroDownforce = vehicleState.activeAeroDownforceKg ?? 0;
  const isAirbrake = vehicleState.isAirbrakeActive ?? false;

  const ALL_MODES: AutomotiveDriveMode[] = ['SPORT+', 'COMFORT', 'CORSA', 'ECO', 'INDIVIDUAL'];
  const AMBIENT_PALETTE = [
    { name: 'Red', hex: '#ef4444' },
    { name: 'Sky Blue', hex: '#0ea5e9' },
    { name: 'Orange', hex: '#f97316' },
    { name: 'Mint', hex: '#10b981' },
    { name: 'Violet', hex: '#a855f7' },
    { name: 'Gold', hex: '#f59e0b' },
    { name: 'Ice', hex: '#f1f5f9' },
  ];

  // Theme configuration
  const theme = useMemo(() => {
    switch (currentMode) {
      case 'SPORT+':
        return {
          border: 'border-red-500/50 shadow-[0_0_35px_rgba(239,68,68,0.3)]',
          badge: 'bg-red-950/80 border-red-500 text-red-200',
          accent: 'text-red-400',
          gearTheme: 'red' as const,
          dialGlow: '#ef4444',
          ambientName: 'CRIMSON SPORT',
        };
      case 'COMFORT':
        return {
          border: 'border-sky-500/50 shadow-[0_0_35px_rgba(14,165,233,0.3)]',
          badge: 'bg-sky-950/80 border-sky-400 text-sky-200',
          accent: 'text-sky-400',
          gearTheme: 'cyan' as const,
          dialGlow: '#0ea5e9',
          ambientName: 'ELECTRIC BLUE',
        };
      case 'CORSA':
        return {
          border: 'border-orange-500/50 shadow-[0_0_35px_rgba(249,115,22,0.3)]',
          badge: 'bg-orange-950/80 border-orange-400 text-orange-200',
          accent: 'text-orange-400',
          gearTheme: 'amber' as const,
          dialGlow: '#f97316',
          ambientName: 'TRACK SUNSET',
        };
      case 'ECO':
        return {
          border: 'border-emerald-500/50 shadow-[0_0_35px_rgba(16,185,129,0.3)]',
          badge: 'bg-emerald-950/80 border-emerald-400 text-emerald-200',
          accent: 'text-emerald-400',
          gearTheme: 'cyan' as const,
          dialGlow: '#10b981',
          ambientName: 'EMERALD MINT',
        };
      case 'INDIVIDUAL':
      default:
        return {
          border: 'border-purple-500/50 shadow-[0_0_35px_rgba(168,85,247,0.3)]',
          badge: 'bg-purple-950/80 border-purple-400 text-purple-200',
          accent: 'text-purple-400',
          gearTheme: 'cyan' as const,
          dialGlow: '#a855f7',
          ambientName: 'AMETHYST VIOLET',
        };
    }
  }, [currentMode]);

  const handleToggleMode = () => {
    const next = ALL_MODES[(ALL_MODES.indexOf(currentMode) + 1) % ALL_MODES.length];
    if (onDriveModeChange) onDriveModeChange(next);
    else setInternalMode(next);
  };

  const handleSelectMode = (mode: AutomotiveDriveMode) => {
    if (onDriveModeChange) onDriveModeChange(mode);
    else setInternalMode(mode);
  };

  const handleSelectColor = (hex: string) => {
    if (onAmbientColorChange) onAmbientColorChange(hex);
  };

  const handleToggleCompact = () => {
    if (onToggleCompact) onToggleCompact();
    else setInternalCompact(!isCompact);
  };

  // Tachometer geometry:
  const tachArcLength = 308.5;
  const tachFilledLength = (currentRpm / 9000) * tachArcLength;

  return (
    <div
      className={`pointer-events-auto select-none transition-all duration-200 ${className}`}
      data-testid="automotive-hud"
    >
      {/* COCKPIT DASHBOARD BINNACLE SHELL */}
      <div
        className={`relative rounded-3xl border bg-[#0a0e18]/95 p-2.5 sm:p-3.5 flex flex-col gap-2 transition-all duration-300 shadow-2xl ${
          theme.border
        } ${isCompact ? 'max-w-[280px]' : 'w-full max-w-[530px]'}`}
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.07) 0%, transparent 70%)',
        }}
      >
        {/* =========================================================
            TOP ROW: SHIFT LIGHT BAR, DRIVE MODE & DOCK TOGGLE
            ========================================================= */}
        <div className="flex items-center justify-between gap-2 pb-1 border-b border-white/10">
          {/* Drive Mode & German Car Model Badge */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToggleMode}
              className={`px-2 py-0.5 rounded-lg border text-[9px] font-race font-black tracking-wider uppercase cursor-pointer active:scale-95 transition-all flex items-center gap-1 ${theme.badge}`}
              title="Click to Switch Drive Mode (Changes Engine Tuning & Ambient Lighting)"
            >
              <Sliders className="w-2.5 h-2.5" />
              <span>{currentMode}</span>
            </button>

            {/* Ambient Lighting Quick Control Toggle */}
            <button
              onClick={() => setShowAmbientMenu(!showAmbientMenu)}
              className="px-1.5 py-0.5 rounded-lg border border-white/15 bg-zinc-900/90 text-[8px] font-race font-bold transition-all flex items-center gap-1 cursor-pointer hover:border-white/40"
              title="Internal Ambient Lighting Controls"
            >
              <span
                className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]"
                style={{ backgroundColor: activeAmbientHex, color: activeAmbientHex }}
              />
              <span className="hidden sm:inline text-zinc-300">AMBIENT</span>
            </button>

            {onToggleCarStyle ? (
              <button
                onClick={onToggleCarStyle}
                className={`px-2 py-0.5 rounded-lg border text-[8.5px] font-race font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                  carStyle === 'bmw_m'
                    ? 'border-blue-500/60 bg-blue-950/80 text-blue-200 hover:border-blue-400 shadow-[0_0_10px_rgba(37,99,235,0.4)]'
                    : 'border-cyan-500/60 bg-zinc-900/90 text-cyan-200 hover:border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                }`}
                title="Toggle between BMW i5 M60 Sports Sedan and Mercedes-AMG GT Coupe"
              >
                <span>{carStyle === 'bmw_m' ? '🏎️ BMW i5 M60' : '🏎️ AMG GT'}</span>
              </button>
            ) : (
              <div
                className={`px-2 py-0.5 rounded-lg border text-[8.5px] font-race font-bold flex items-center gap-1 ${
                  carStyle === 'bmw_m'
                    ? 'border-blue-500/40 bg-blue-950/60 text-blue-300'
                    : 'border-cyan-500/40 bg-zinc-900/80 text-cyan-300'
                }`}
              >
                <span>{carStyle === 'bmw_m' ? '🏎️ BMW i5 M60' : '🏎️ AMG GT'}</span>
              </div>
            )}
          </div>

          {/* Active Aerodynamic Spoiler Telemetry Badge */}
          <div
            className={`px-1.5 py-0.5 rounded-md border text-[8px] font-mono font-bold flex items-center gap-1 transition-all ${
              isAirbrake
                ? 'border-red-500 bg-red-950/90 text-red-200 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]'
                : aeroAngle > 10
                ? 'border-cyan-500/50 bg-cyan-950/60 text-cyan-200 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                : 'border-white/10 bg-zinc-900/70 text-zinc-400'
            }`}
            title={`Active Aero Spoiler: ${aeroAngle}° angle with ${aeroDownforce} kg downforce`}
          >
            <Wind className={`w-2.5 h-2.5 ${isAirbrake ? 'text-red-400' : 'text-cyan-400'}`} />
            <span>
              {isAirbrake
                ? `AIRBRAKE 52°`
                : aeroAngle > 10
                ? `AERO ${aeroAngle}° [${aeroDownforce}KG]`
                : aeroAngle > 0
                ? `AERO ${aeroAngle}°`
                : 'FLUSH'}
            </span>
          </div>

          {/* Sequential Formula / GT3 Shift Lights Strip */}
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

          {/* Docking & Compact View Controls */}
          <div className="flex items-center gap-1">
            {onToggleDock && (
              <button
                onClick={onToggleDock}
                className="px-1.5 py-0.5 rounded-md text-[8px] font-mono font-bold text-cyan-300 hover:text-white bg-cyan-950/60 border border-cyan-500/30 hover:border-cyan-400 transition-all cursor-pointer"
                title={dockPosition === 'bottom' ? 'Dock at Top-Left' : 'Dock at Bottom-Center'}
              >
                <span>{dockPosition === 'bottom' ? '▲ TOP' : '▼ BTM'}</span>
              </button>
            )}
            <button
              onClick={handleToggleCompact}
              className="p-1 rounded-md text-zinc-400 hover:text-white bg-zinc-900 border border-white/10 hover:border-white/30 transition-all cursor-pointer"
              title={isCompact ? 'Expand Full Cockpit' : 'Compact HUD'}
            >
              {isCompact ? <Maximize2 className="w-2.5 h-2.5" /> : <Minimize2 className="w-2.5 h-2.5" />}
            </button>
          </div>
        </div>

        {/* =========================================================
            INTERNAL AMBIENT LIGHTING & DRIVE MODE CONTROL PANEL (EXPANDABLE)
            ========================================================= */}
        {showAmbientMenu && (
          <div className="bg-zinc-950/95 border border-white/15 rounded-2xl p-2 flex flex-col gap-2 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-[8px] font-race font-bold">
              <span className="flex items-center gap-1 text-zinc-300">
                <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                <span>SUV COCKPIT AMBIENT LIGHTING & DRIVE MODES</span>
              </span>
              <span className="font-mono text-zinc-400">ACTIVE: {theme.ambientName}</span>
            </div>

            {/* Drive Modes Bar */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
              {ALL_MODES.map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleSelectMode(mode)}
                  className={`px-2 py-1 rounded-lg text-[8px] font-race font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                    currentMode === mode
                      ? 'bg-white text-zinc-950 shadow-md scale-102 font-black'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-white/5'
                  }`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: DRIVE_MODE_AMBIENT_COLORS[mode] }}
                  />
                  <span>{mode}</span>
                </button>
              ))}
            </div>

            {/* Ambient Lighting Color Swatches */}
            <div className="flex items-center justify-between gap-1 pt-1 border-t border-white/10">
              <span className="text-[7.5px] font-mono text-zinc-400">MANUAL HUE:</span>
              <div className="flex items-center gap-1.5">
                {AMBIENT_PALETTE.map((pal) => (
                  <button
                    key={pal.hex}
                    onClick={() => handleSelectColor(pal.hex)}
                    className={`w-4 h-4 rounded-full transition-transform cursor-pointer relative ${
                      activeAmbientHex === pal.hex ? 'scale-125 ring-2 ring-white shadow-lg' : 'hover:scale-110 opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: pal.hex }}
                    title={`Set Ambient Light to ${pal.name}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            MAIN CLUSTER BODY:
            - Left: Real-time Engine Temperature Bar & Thermal Pod
            - Center: Circular Tachometer, Digital Speedometer & GearIndicator
            - Right: Turbo Boost & Nitrous Telemetry Pod
            ========================================================= */}
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          {/* =====================================================
              1. REAL-TIME ENGINE TEMPERATURE BAR (LEFT WING)
              ===================================================== */}
          {!isCompact && (
            <div className="flex-1 flex flex-col justify-between h-[122px] p-2 rounded-2xl bg-zinc-950/70 border border-white/10 shadow-inner relative overflow-hidden">
              {/* Thermometer Pod Header */}
              <div className="flex items-center justify-between text-[8px] font-mono font-bold text-zinc-400">
                <span className="flex items-center gap-1 text-cyan-300">
                  <Thermometer className="w-3 h-3 text-cyan-400" />
                  <span>COOLANT TEMP</span>
                </span>
                <span className={`font-mono-num font-bold ${tempStatus.color}`}>
                  {tempStatus.label}
                </span>
              </div>

              {/* Live Temperature Numeric Readout */}
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
                  OPT: {isFahrenheit ? '194°F' : '90°C'}
                </span>
              </div>

              {/* REAL-TIME ENGINE TEMPERATURE BAR GAUGE (C to H) */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[7px] font-mono font-bold text-zinc-400 px-0.5">
                  <span className="text-sky-400">C (COLD)</span>
                  <span className="text-emerald-400">◆ 90° OPTIMAL</span>
                  <span className="text-red-400">H (HOT)</span>
                </div>
                {/* Temperature Bar */}
                <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-white/15">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      engineTempC > 105
                        ? 'bg-gradient-to-r from-amber-500 via-red-500 to-red-600 shadow-[0_0_14px_#ef4444]'
                        : 'bg-gradient-to-r from-sky-400 via-emerald-400 to-amber-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                    }`}
                    style={{ width: `${tempBarPercent}%` }}
                  />
                </div>
              </div>

              {/* Oil Pressure Telemetry */}
              <div className="flex items-center justify-between text-[7.5px] font-mono text-zinc-400 pt-1 border-t border-white/5">
                <span>OIL: 5.2 BAR</span>
                <span className="text-cyan-400">RAD FAN: AUTO</span>
              </div>
            </div>
          )}

          {/* =====================================================
              2. CIRCULAR TACHOMETER, DIGITAL SPEEDOMETER & GEARINDICATOR
              ===================================================== */}
          <div className="relative flex flex-col items-center justify-center min-w-[150px] sm:min-w-[190px]">
            {/* Circular Gauge Dial Container */}
            <div className="relative w-36 h-36 sm:w-42 sm:h-42 flex items-center justify-center">
              {/* SVG Circular Tachometer */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                <defs>
                  {/* Dynamic RPM Arc Gradient */}
                  <linearGradient id="autoTachGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="60%" stopColor="#06b6d4" />
                    <stop offset="85%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                  {/* Tachometer Glow Filter */}
                  <filter id="autoDialGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={theme.dialGlow} />
                  </filter>
                </defs>

                {/* Circular Track Background */}
                <circle
                  cx="80"
                  cy="80"
                  r="68"
                  fill="none"
                  stroke="#27272a"
                  strokeWidth="7"
                  strokeDasharray="308.5 427"
                  strokeLinecap="round"
                  transform="rotate(140 80 80)"
                />

                {/* Redline Sector (8,000 to 9,000 RPM) */}
                <circle
                  cx="80"
                  cy="80"
                  r="68"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="8"
                  strokeDasharray="42 427"
                  strokeDashoffset="-266"
                  strokeLinecap="round"
                  opacity={isRedline ? '1' : '0.6'}
                  className={isRedline ? 'animate-pulse' : ''}
                  transform="rotate(140 80 80)"
                />

                {/* Dynamic Illuminated Circular Tachometer Arc */}
                <circle
                  cx="80"
                  cy="80"
                  r="68"
                  fill="none"
                  stroke="url(#autoTachGrad)"
                  strokeWidth="7"
                  strokeDasharray={`${tachFilledLength} 427`}
                  strokeLinecap="round"
                  filter="url(#autoDialGlow)"
                  className="transition-all duration-75"
                  transform="rotate(140 80 80)"
                />
              </svg>

              {/* Radial Numeral Tick Labels (0 to 9 x1000 RPM) */}
              <div className="absolute inset-0 pointer-events-none">
                {[0, 2, 4, 6, 8, 9].map((val) => {
                  const angle = -130 + (val / 9) * 260;
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

              {/* CENTER HUB: DIGITAL SPEEDOMETER + GEAR INDICATOR */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                {/* DIGITAL SPEEDOMETER */}
                <div className="flex items-baseline justify-center gap-1 -mt-2">
                  <span className="text-3xl sm:text-4xl font-race font-black italic tracking-tighter text-white drop-shadow-[0_2px_14px_rgba(255,255,255,0.4)]">
                    {displaySpeed}
                  </span>
                </div>

                {/* Speed Unit Toggle Button */}
                <button
                  onClick={onUnitToggle}
                  className="text-[9px] font-race font-bold text-cyan-400 uppercase tracking-widest hover:text-white cursor-pointer active:scale-95 transition-all -mt-1 mb-1"
                  title="Click to toggle KM/H and MPH"
                >
                  {speedUnit.toUpperCase()}
                </button>

                {/* EMBEDDED GEAR INDICATOR COMPONENT */}
                <GearIndicator
                  gear={currentGear}
                  isNeutral={isNeutral}
                  isReverse={isReverse}
                  isPark={isPark}
                  currentRpm={currentRpm}
                  maxRpm={9000}
                  redlineThreshold={redlineThreshold}
                  isRedline={isRedline}
                  showShiftPrompt={true}
                  size="md"
                  theme={theme.gearTheme}
                />

                {/* Digital RPM Counter */}
                <span
                  className={`text-[8px] font-mono-num font-bold mt-1 ${
                    isRedline ? 'text-red-400 animate-pulse' : 'text-zinc-400'
                  }`}
                >
                  {currentRpm.toLocaleString()} RPM
                </span>
              </div>
            </div>
          </div>

          {/* =====================================================
              3. TURBO BOOST & NITROUS TELEMETRY POD (RIGHT WING)
              ===================================================== */}
          {!isCompact && (
            <div className="flex-1 flex flex-col justify-between h-[122px] p-2 rounded-2xl bg-zinc-950/70 border border-white/10 shadow-inner relative overflow-hidden">
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

              {/* Turbo Boost Gauge Bar */}
              <div className="flex flex-col gap-0.5 my-1">
                <div className="flex justify-between text-[7px] font-mono text-zinc-400">
                  <span>BOOST PRESSURE</span>
                  <span className="text-zinc-300">{Math.round(boostBar * 14.5)} PSI</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-400 rounded-full transition-all duration-75 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                    style={{
                      width: `${Math.max(5, Math.min(100, ((boostBar + 0.4) / 2.8) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* Nitrous Oxide Reservoir Level */}
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

              {/* Tire Surface Grip & Drift Telemetry */}
              <div className="flex items-center justify-between text-[7.5px] font-mono font-bold text-zinc-400 pt-1 border-t border-white/5">
                <span className="uppercase text-zinc-300 truncate max-w-[85px]">
                  {vehicleState.surfaceType === 'wet_asphalt' ? '🌧️ WET TARMAC' : '🏁 DRY TARMAC'}
                </span>
                <span className="text-cyan-400 font-mono-num">
                  {vehicleState.isDrifting ? 'DRIFT ⚡' : `${Math.round((vehicleState.surfaceFriction || 1.0) * 100)}% GRIP`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM METRICS FOOTER */}
        <div className="flex items-center justify-between text-[7.5px] font-mono text-zinc-500 pt-1 border-t border-white/10 px-1">
          <span>MOTORSPORT V8 TWIN-TURBO • 720 HP</span>
          <span>TOP RECORD: {topSpeedRecorded} {speedUnit.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
};
