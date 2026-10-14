import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Map,
  Trophy,
  Volume2,
  VolumeX,
  Pause,
  Bike,
  Car,
  Shield,
  Zap,
  Wrench,
  Flame,
  Radio,
  Footprints,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Menu,
  X,
  Sliders,
  Sparkles,
  Palette,
  Wind,
  Film,
} from 'lucide-react';
import { OpenCityPlayerState } from '../game/OpenWorldPhysics';
import { AutomotiveDriveMode, DRIVE_MODE_AMBIENT_COLORS } from '../3d/ModernCarBuilder';
import {
  WantedState,
  CityMission,
  DistrictType,
  CameraView,
  BikeDamageState,
} from '../types/openCity';
import { cityAudio } from '../audio/CityAudioEngine';
import { soundEngine } from '../audio/SoundEngine';
import { AutomotiveHUD } from './AutomotiveHUD';
import { GearIndicator } from './GearIndicator';
import { InteractiveSteeringWheel } from './InteractiveSteeringWheel';
import { AutomotiveTransmission } from './AutomotiveTransmission';
import { AutomotivePedals } from './AutomotivePedals';

export interface CityHUDProps {
  playerState: OpenCityPlayerState;
  wantedState: WantedState | null;
  radioChatter: string | null;
  activeMission: CityMission | null;
  missionTimeRemaining: number | null;
  currentDistrict: DistrictType;
  cash: number;
  cameraView: CameraView;
  bikeDamage?: BikeDamageState;
  onCameraToggle: () => void;
  onSelectCameraView?: (view: CameraView) => void;
  onOpenPhotoMode: () => void;
  onOpenMap: () => void;
  onOpenMissions: () => void;
  onOpenGarage: () => void;
  onOpenDealer?: () => void;
  onMountToggle: () => void;
  mountTransition?: { state: 'NONE' | 'MOUNTING' | 'DISMOUNTING'; progress: number };
  onHorn: () => void;
  onPause?: () => void;
  onMobileInput: (inputs: {
    throttle: number;
    brake: number;
    steer: number;
    nitro: boolean;
    wheelie: boolean;
    reverse: boolean;
  }) => void;
  speedUnit: 'kmh' | 'mph';
  currentDressingStyle?: string;
  onDressingChange?: (style: any) => void;
  isHelmetOn?: boolean;
  onToggleHelmet?: () => void;
  carStyle?: 'bmw_m' | 'benz_amg';
  onSwitchCarStyle?: (style: 'bmw_m' | 'benz_amg') => void;
  driveMode?: AutomotiveDriveMode;
  onDriveModeChange?: (mode: AutomotiveDriveMode) => void;
  ambientColor?: string;
  onAmbientColorChange?: (color: string) => void;
  onManualShift?: (direction: 'UP' | 'DOWN') => void;
  onShiftGear?: (gear: string) => void;
  currentGear?: string;
  onOpenReplay?: () => void;
  onOpenDailyChallenges?: () => void;
}

export const CityHUD: React.FC<CityHUDProps> = ({
  playerState,
  wantedState,
  radioChatter,
  activeMission,
  missionTimeRemaining,
  currentDistrict,
  cash,
  cameraView,
  bikeDamage,
  onCameraToggle,
  onSelectCameraView,
  onOpenPhotoMode,
  onOpenReplay,
  onOpenDailyChallenges,
  onOpenMap,
  onOpenMissions,
  onOpenGarage,
  onMountToggle,
  mountTransition,
  onHorn,
  onPause,
  onMobileInput,
  speedUnit,
  currentDressingStyle,
  onDressingChange,
  isHelmetOn,
  onToggleHelmet,
  carStyle = 'bmw_m',
  onSwitchCarStyle,
  driveMode = 'SPORT+',
  onDriveModeChange,
  ambientColor = '#ef4444',
  onAmbientColorChange,
  onManualShift,
  onShiftGear,
  currentGear,
}) => {
  const [showAmbientPicker, setShowAmbientPicker] = useState<boolean>(false);
  const [touchSteer, setTouchSteer] = useState<number>(0);
  const [touchThrottle, setTouchThrottle] = useState<number>(0);
  const [touchBrake, setTouchBrake] = useState<number>(0);
  const [touchNitro, setTouchNitro] = useState<boolean>(false);
  const [touchWheelie, setTouchWheelie] = useState<boolean>(false);
  const [touchReverse, setTouchReverse] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => cityAudio.isMuted);
  const [cameraToast, setCameraToast] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [cockpitDock, setCockpitDock] = useState<'top' | 'bottom'>('top');

  // Sync touch input state to game engine loop (stabilized with ref to prevent render loops)
  const onMobileInputRef = useRef(onMobileInput);
  onMobileInputRef.current = onMobileInput;

  useEffect(() => {
    onMobileInputRef.current({
      throttle: touchThrottle,
      brake: touchBrake,
      steer: touchSteer,
      nitro: touchNitro,
      wheelie: touchWheelie,
      reverse: touchReverse,
    });
  }, [touchThrottle, touchBrake, touchSteer, touchNitro, touchWheelie, touchReverse]);

  const OUTFIT_OPTIONS = [
    { id: 'biker_leather', name: 'GTA Biker Leather & Denim', icon: '🏍️', label: 'GTA Biker' },
    { id: 'asphalt_racer', name: 'Asphalt Track Racing Suit', icon: '🏁', label: 'Asphalt Racer' },
    { id: 'urban_streetwear', name: 'Urban Biker Jacket & Jeans', icon: '👕', label: 'Urban Casual' },
    { id: 'pant_shirt_casual', name: 'Sky-Blue Oxford & Chinos', icon: '👔', label: 'Oxford & Chinos' },
    { id: 'pant_shirt_black', name: 'Black Slim Shirt & Pants', icon: '👔', label: 'Black Shirt' },
    { id: 'traditional_tamil', name: 'White Silk Shirt & Veshti', icon: '🥻', label: 'Silk Veshti' },
  ];

  const handleCycleOutfit = () => {
    if (!onDressingChange) return;
    soundEngine.playUIClick();
    const currentIdx = OUTFIT_OPTIONS.findIndex((o) => o.id === currentDressingStyle);
    const nextIdx = (currentIdx + 1) % OUTFIT_OPTIONS.length;
    const nextOutfit = OUTFIT_OPTIONS[nextIdx];
    onDressingChange(nextOutfit.id);
    setCameraToast(`${nextOutfit.icon} ${nextOutfit.name.toUpperCase()}`);
    setTimeout(() => setCameraToast(null), 2200);
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    cityAudio.setMuted(next);
    soundEngine.setMuted(next);
  };

  const handleCameraToggleClick = () => {
    soundEngine.playUIClick();
    const views: CameraView[] = ['chase', 'helmetCam', 'drone', 'firstPerson', 'close'];
    const curIdx = views.indexOf(cameraView);
    const next = views[(curIdx + 1) % views.length];
    if (onSelectCameraView) {
      onSelectCameraView(next);
    } else {
      onCameraToggle();
    }
    const labels: Record<CameraView, string> = {
      chase: '🏎️ CAR CHASE VIEW',
      helmetCam: '🎯 HOOD / BUMPER CAM',
      firstPerson: '🏎️ COCKPIT DASHBOARD',
      close: '🎬 LOW-SLUNG ACTION',
      drone: '🚁 360° ORBIT',
    };
    setCameraToast(labels[next] || next.toUpperCase());
    setTimeout(() => setCameraToast(null), 2000);
  };

  const formatTimer = (seconds: number | null) => {
    if (seconds === null) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const rawSpeedKmh = Math.abs(playerState.speed);
  const speed = Math.round(speedUnit === 'mph' ? rawSpeedKmh * 0.621371 : rawSpeedKmh);
  const isCarReversing = playerState.isReversing || playerState.speed < -0.2 || currentGear === 'R';
  const autoGear = isCarReversing
    ? 'R'
    : rawSpeedKmh < 0.5
    ? 'P'
    : rawSpeedKmh < 1.5
    ? 'N'
    : rawSpeedKmh < 50
    ? 'D1'
    : rawSpeedKmh < 90
    ? 'D2'
    : rawSpeedKmh < 140
    ? 'D3'
    : rawSpeedKmh < 190
    ? 'D4'
    : rawSpeedKmh < 240
    ? 'D5'
    : 'D6';
  const effectiveGear = isCarReversing ? 'R' : (currentGear || autoGear);
  const gear = effectiveGear.replace('D', '');
  const nitro = Math.round(playerState.nitroAmount ?? 100);
  const overallDamage = bikeDamage ? Math.max(0, Math.min(100, bikeDamage.overallDamage)) : 0;
  const healthPercent = Math.max(0, 100 - Math.round(overallDamage));
  const damageRatio = overallDamage / 100;
  const pulseSpeed = Math.max(0.75, 2.4 - damageRatio * 1.5);

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 flex flex-col justify-between overflow-hidden">
      {/* =============================================================
          SUBTLE RED PULSATING DAMAGE BORDER WARNING EFFECT
          Intensifies intuitively as motorcycle / vehicle damage increases
          ============================================================= */}
      {overallDamage > 0 && (
        <div
          className="fixed inset-0 pointer-events-none z-50 transition-all duration-300 damage-warning-pulsing overflow-hidden"
          style={{
            boxShadow: `inset 0 0 ${16 + damageRatio * 64}px ${6 + damageRatio * 20}px rgba(239, 68, 68, ${0.18 + damageRatio * 0.45})`,
            border: `${Math.max(2, Math.round(1.5 + damageRatio * 4))}px solid rgba(239, 68, 68, ${0.25 + damageRatio * 0.6})`,
            ['--damage-min-op' as any]: `${0.2 + damageRatio * 0.25}`,
            ['--damage-max-op' as any]: `${0.6 + damageRatio * 0.35}`,
            ['--damage-speed' as any]: `${pulseSpeed}s`,
          }}
          aria-hidden="true"
        >
          {/* Subtle Corner Hazard Brackets for Medium to High Damage */}
          {overallDamage > 25 && (
            <>
              <div className="absolute top-2 left-2 w-6 sm:w-8 h-6 sm:h-8 border-t-2 border-l-2 border-red-500/80 pointer-events-none" />
              <div className="absolute top-2 right-2 w-6 sm:w-8 h-6 sm:h-8 border-t-2 border-r-2 border-red-500/80 pointer-events-none" />
              <div className="absolute bottom-2 left-2 w-6 sm:w-8 h-6 sm:h-8 border-b-2 border-l-2 border-red-500/80 pointer-events-none" />
              <div className="absolute bottom-2 right-2 w-6 sm:w-8 h-6 sm:h-8 border-b-2 border-r-2 border-red-500/80 pointer-events-none" />
            </>
          )}

          {/* Tactical damage status badge when critically damaged */}
          {overallDamage >= 60 && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-red-950/95 border border-red-500 text-red-200 text-[9px] font-mono font-black tracking-widest uppercase shadow-[0_0_15px_rgba(239,68,68,0.8)] backdrop-blur-md flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
              <span>CRITICAL VEHICLE DAMAGE: {Math.round(overallDamage)}%</span>
            </div>
          )}
        </div>
      )}
      {/* =============================================================
          1. TOP BAR: CLEAN & UNCLUTTERED STATUS + ERGONOMIC ACTIONS
          ============================================================= */}
      <div className="w-full px-3 sm:px-6 pt-3 sm:pt-4 flex items-start justify-between pointer-events-none">
        {/* TOP LEFT: PLAYER STATS & DASHBOARD */}
        <div className="flex flex-col gap-1.5 pointer-events-auto">
          {/* Status Capsule */}
          <div className="flex items-center gap-2 bg-black/85 px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-md shadow-xl">
            <span className="text-[10px] font-race font-bold text-cyan-300 uppercase tracking-widest">
              {currentDistrict}
            </span>
            <span className="text-zinc-600">•</span>
            {/* Health */}
            <div className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono-num font-bold text-xs text-emerald-300">
                {healthPercent}%
              </span>
            </div>
            {/* Wanted Stars */}
            {wantedState && wantedState.level > 0 && (
              <>
                <span className="text-zinc-600">•</span>
                <div className="flex items-center gap-0.5 animate-pulse">
                  {[1, 2, 3].map((star) => (
                    <span
                      key={star}
                      className={`text-xs ${
                        star <= wantedState.level ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'text-zinc-700'
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Modern Sports Car AutomotiveHUD (Shows when in car) */}
          {playerState.isOnBike ? (
            cockpitDock === 'top' ? (
              <AutomotiveHUD
                vehicleState={playerState}
                speedUnit={speedUnit}
                dockPosition="top"
                onToggleDock={() => setCockpitDock('bottom')}
                carStyle={carStyle}
                onToggleCarStyle={() => onSwitchCarStyle?.(carStyle === 'bmw_m' ? 'benz_amg' : 'bmw_m')}
                driveMode={driveMode}
                onDriveModeChange={onDriveModeChange}
                ambientColor={ambientColor}
                onAmbientColorChange={onAmbientColorChange}
                className="animate-in fade-in slide-in-from-top duration-150"
              />
            ) : (
              <div className="bg-black/90 p-2 sm:p-2.5 rounded-2xl border border-cyan-500/30 backdrop-blur-xl shadow-xl flex items-center justify-between gap-3 min-w-[170px]">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <GearIndicator
                      gear={gear}
                      isNeutral={gear === 'N'}
                      isReverse={gear === 'R'}
                      isPark={gear === 'P'}
                      currentRpm={playerState.rpm}
                      size="sm"
                    />
                    {onManualShift && (
                      <div className="flex flex-col gap-0.5 pointer-events-auto">
                        <button
                          onClick={() => {
                            soundEngine.playUIClick();
                            onManualShift('UP');
                          }}
                          className="px-1.5 py-0.5 rounded bg-zinc-800/90 hover:bg-zinc-700 text-cyan-300 hover:text-white text-[8px] font-mono font-black border border-white/10 active:scale-95 transition-all cursor-pointer"
                          title="Manual Upshift Paddle (Key X) - Watch 3D Driver Shift Gears"
                        >
                          +
                        </button>
                        <button
                          onClick={() => {
                            soundEngine.playUIClick();
                            onManualShift('DOWN');
                          }}
                          className="px-1.5 py-0.5 rounded bg-zinc-800/90 hover:bg-zinc-700 text-amber-300 hover:text-white text-[8px] font-mono font-black border border-white/10 active:scale-95 transition-all cursor-pointer"
                          title="Manual Downshift Paddle (Key Z) - Watch 3D Driver Shift Gears"
                        >
                          -
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-race font-black text-white italic tracking-tighter">
                        {speed}
                      </span>
                      <span className="text-[9px] font-race font-bold text-cyan-400 uppercase">
                        {speedUnit.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-[7.5px] font-mono text-zinc-400">VIRTUAL DASH AT BTM</span>
                  </div>
                </div>
                <button
                  onClick={() => setCockpitDock('top')}
                  className="text-[8px] font-mono font-bold text-cyan-300 hover:text-white bg-cyan-950/80 hover:bg-cyan-900 px-2 py-1 rounded-lg border border-cyan-500/40 cursor-pointer active:scale-95 transition-all"
                  title="Dock full digital cockpit instrument cluster at the top"
                >
                  DOCK TOP ▲
                </button>
              </div>
            )
          ) : (
            /* On-Foot Speed & Status Indicator */
            <div className="bg-emerald-950/85 px-3.5 py-1.5 rounded-2xl border border-emerald-400/60 backdrop-blur-md shadow-xl flex items-center gap-2">
              <Footprints className="w-4 h-4 text-emerald-300 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[9px] font-race font-bold text-emerald-200 uppercase tracking-wider">
                  WALKING ATHLETE
                </span>
                <span className="text-[8px] font-mono font-semibold text-emerald-400">
                  {Math.abs(Math.round(playerState.speed))} KM/H • SPRINT: [SHIFT]
                </span>
              </div>
            </div>
          )}

          {/* Active Mission Pill */}
          {activeMission && (
            <div className="px-3 py-1 rounded-full border border-orange-500/60 bg-black/85 backdrop-blur-md shadow-xl flex items-center gap-2">
              <span className="text-[10px] font-race font-bold text-orange-400 uppercase truncate max-w-[140px]">
                {activeMission.title}
              </span>
              {activeMission.timeLimit && (
                <span className="text-[9px] font-mono-num font-bold text-amber-300 bg-zinc-900 px-1.5 py-0.5 rounded border border-white/10">
                  {formatTimer(missionTimeRemaining)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* TOP RIGHT: CLEAN, UNCLUTTERED ACTION DOCK (NO CROWDED BUTTONS) */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <div className="flex items-center gap-1.5">
            {/* Cash Wallet */}
            <div className="px-3 py-1 rounded-full border border-emerald-400/40 bg-black/85 backdrop-blur-md shadow-lg flex items-center gap-1">
              <span className="text-[10px] font-race text-emerald-400 font-bold">$</span>
              <span className="font-mono-num font-bold text-xs sm:text-sm text-emerald-300 drop-shadow">
                {cash.toLocaleString()}
              </span>
            </div>

            {/* Essential Controls Capsule (Vehicle switcher, Drive mode, Camera, Replay, Menu) */}
            <div className="flex items-center gap-1 sm:gap-1.5 bg-black/90 p-1 sm:p-1.5 rounded-2xl border border-white/20 backdrop-blur-md shadow-2xl">
              {/* German Car Model Quick Toggle (BMW M60 ⇄ AMG GT) */}
              {playerState.isOnBike && onSwitchCarStyle && (
                <button
                  onClick={() => {
                    soundEngine.playUIClick();
                    const next = carStyle === 'bmw_m' ? 'benz_amg' : 'bmw_m';
                    onSwitchCarStyle(next);
                    setCameraToast(next === 'bmw_m' ? '🏎️ BMW i5 M60 LWB (SPORTS SEDAN)' : '🏎️ MERCEDES-AMG GT (V8 BITURBO)');
                    setTimeout(() => setCameraToast(null), 2500);
                  }}
                  className={`h-8 sm:h-8.5 px-2 sm:px-2.5 rounded-xl text-[9px] font-race font-bold transition-all flex items-center gap-1.5 cursor-pointer border shrink-0 ${
                    carStyle === 'bmw_m'
                      ? 'bg-blue-950/80 border-blue-500/70 text-blue-200 shadow-[0_0_12px_rgba(37,99,235,0.5)]'
                      : 'bg-zinc-900/90 border-cyan-500/70 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                  }`}
                  title="Click to Switch Vehicle (BMW i5 M60 ⇄ AMG GT)"
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${carStyle === 'bmw_m' ? 'bg-blue-400' : 'bg-cyan-400'}`} />
                  <span className="font-black whitespace-nowrap">{carStyle === 'bmw_m' ? 'BMW i5' : 'AMG GT'}</span>
                </button>
              )}

              {/* Drive Mode & Ambient Light Quick Controls */}
              {playerState.isOnBike && onDriveModeChange && (
                <div className="hidden sm:block relative shrink-0">
                  <div className="flex items-center gap-0.5 bg-zinc-950/90 p-0.5 rounded-xl border border-white/15 shadow-inner">
                    <button
                      onClick={() => {
                        soundEngine.playUIClick();
                        const modes: AutomotiveDriveMode[] = ['SPORT+', 'COMFORT', 'CORSA', 'ECO', 'INDIVIDUAL'];
                        const next = modes[(modes.indexOf(driveMode) + 1) % modes.length];
                        onDriveModeChange(next);
                        const color = DRIVE_MODE_AMBIENT_COLORS[next];
                        if (color && onAmbientColorChange) onAmbientColorChange(color);
                        setCameraToast(`🚙 DRIVE MODE: ${next}`);
                        setTimeout(() => setCameraToast(null), 2000);
                      }}
                      className="h-7 px-1.5 sm:px-2 rounded-lg text-[8px] sm:text-[8.5px] font-race font-bold transition-all flex items-center gap-1 cursor-pointer bg-zinc-900 border border-white/10 hover:border-white/30 text-white whitespace-nowrap"
                      title="Toggle Drive Mode (Changes Handling & Ambient Lighting)"
                    >
                      <span
                        className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full shadow-[0_0_8px_currentColor] shrink-0"
                        style={{ backgroundColor: ambientColor, color: ambientColor }}
                      />
                      <span>{driveMode}</span>
                    </button>

                    <button
                      onClick={() => setShowAmbientPicker(!showAmbientPicker)}
                      className={`h-7 px-1.5 rounded-lg text-[8px] font-race font-bold transition-all flex items-center justify-center cursor-pointer border ${
                        showAmbientPicker
                          ? 'bg-white text-zinc-950 border-white shadow-md'
                          : 'bg-zinc-900 text-zinc-300 border-white/10 hover:border-white/30'
                      }`}
                      title="Cockpit Ambient Light Palette"
                    >
                      <Palette className="w-3 h-3 text-cyan-400" />
                    </button>
                  </div>

                  {/* Floating Ambient Lighting Palette Popover */}
                  {showAmbientPicker && (
                    <div className="absolute right-0 top-9 z-50 p-2 rounded-2xl bg-zinc-950/95 border border-white/20 backdrop-blur-xl shadow-2xl flex flex-col gap-1.5 min-w-[200px] animate-in fade-in duration-100">
                      <div className="flex items-center justify-between text-[7.5px] font-race font-bold text-zinc-400 border-b border-white/10 pb-1">
                        <span className="flex items-center gap-1 text-cyan-300">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>COCKPIT AMBIENT LIGHTING</span>
                        </span>
                        <button
                          onClick={() => setShowAmbientPicker(false)}
                          className="text-zinc-400 hover:text-white cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Drive Modes */}
                      <div className="text-[7px] font-mono text-zinc-400">DRIVE MODE PRESETS:</div>
                      <div className="grid grid-cols-2 gap-1">
                        {(['SPORT+', 'COMFORT', 'CORSA', 'ECO', 'INDIVIDUAL'] as AutomotiveDriveMode[]).map((mode) => (
                          <button
                            key={mode}
                            onClick={() => {
                              soundEngine.playUIClick();
                              onDriveModeChange(mode);
                              const color = DRIVE_MODE_AMBIENT_COLORS[mode];
                              if (color && onAmbientColorChange) onAmbientColorChange(color);
                            }}
                            className={`px-1.5 py-1 rounded-lg text-[7.5px] font-race font-bold transition-all flex items-center gap-1 cursor-pointer ${
                              driveMode === mode
                                ? 'bg-white text-zinc-950 font-black shadow'
                                : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-850 border border-white/5'
                            }`}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: DRIVE_MODE_AMBIENT_COLORS[mode] }}
                            />
                            <span className="truncate">{mode}</span>
                          </button>
                        ))}
                      </div>

                      {/* Manual Hue Swatches */}
                      {onAmbientColorChange && (
                        <>
                          <div className="text-[7px] font-mono text-zinc-400 pt-1 border-t border-white/10">
                            MANUAL AMBIENT HUE:
                          </div>
                          <div className="flex items-center justify-between gap-1">
                            {[
                              { name: 'Red', hex: '#ef4444' },
                              { name: 'Blue', hex: '#0ea5e9' },
                              { name: 'Orange', hex: '#f97316' },
                              { name: 'Mint', hex: '#10b981' },
                              { name: 'Purple', hex: '#a855f7' },
                              { name: 'Gold', hex: '#f59e0b' },
                            ].map((c) => (
                              <button
                                key={c.hex}
                                onClick={() => {
                                  soundEngine.playUIClick();
                                  onAmbientColorChange(c.hex);
                                }}
                                className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                                  ambientColor === c.hex ? 'scale-125 ring-2 ring-white shadow-lg' : 'hover:scale-110 opacity-75 hover:opacity-100'
                                }`}
                                style={{ backgroundColor: c.hex }}
                                title={c.name}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Driver / Human Styling Toggle (On-Foot) */}
              {onToggleHelmet && !playerState.isOnBike && (
                <button
                  onClick={onToggleHelmet}
                  className={`h-8 sm:h-8.5 px-2 sm:px-2.5 rounded-xl border flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer font-race font-bold shrink-0 ${
                    isHelmetOn
                      ? 'border-cyan-400/60 bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-200'
                      : 'border-amber-400/80 bg-amber-950/80 hover:bg-amber-900/90 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                  }`}
                  title={isHelmetOn ? 'Switch to Real Human Face & Hair' : 'Put on Racing Helmet'}
                >
                  <span className="text-xs sm:text-sm">{isHelmetOn ? '🪖' : '👤'}</span>
                  <span className="text-[9px] sm:text-[10px] tracking-wide hidden sm:inline">
                    {isHelmetOn ? 'HELMET' : 'FACE'}
                  </span>
                </button>
              )}

              {/* Outfit Switcher (On-Foot) */}
              {onDressingChange && !playerState.isOnBike && (
                <button
                  onClick={handleCycleOutfit}
                  className="h-8 sm:h-8.5 px-2 sm:px-2.5 rounded-xl border border-sky-400/50 bg-sky-950/70 hover:bg-sky-900/80 text-sky-200 flex items-center gap-1 active:scale-95 transition-all cursor-pointer font-race font-bold shrink-0"
                  title="Change Driver / Athlete Outfit"
                >
                  <span className="text-xs sm:text-sm">👔</span>
                  <span className="text-[9px] sm:text-[10px] tracking-wide hidden sm:inline">OUTFIT</span>
                </button>
              )}

              {/* Camera Cycle */}
              <button
                onClick={handleCameraToggleClick}
                className="h-8 sm:h-8.5 px-2 sm:px-2.5 rounded-xl border border-white/20 hover:border-cyan-400 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 flex items-center gap-1 active:scale-95 transition-all cursor-pointer font-race font-bold shrink-0"
                title={`Cycle Camera Mode • Current: ${cameraView.toUpperCase()}`}
              >
                <Camera className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-[9px] sm:text-[10px] tracking-wide hidden sm:inline">
                  {cameraView === 'drone' ? '360°' : cameraView === 'helmetCam' ? 'HELM' : cameraView.toUpperCase()}
                </span>
              </button>

              {/* 30s Cinematic Replay Theater Button */}
              {onOpenReplay && (
                <button
                  onClick={() => {
                    soundEngine.playUIClick();
                    onOpenReplay();
                  }}
                  className="hidden md:flex h-8 sm:h-8.5 px-2 sm:px-2.5 rounded-xl border border-red-500/60 bg-gradient-to-r from-red-950/80 to-zinc-900/80 hover:border-red-400 text-red-200 items-center gap-1 active:scale-95 transition-all cursor-pointer font-race font-bold shadow-[0_0_12px_rgba(239,68,68,0.4)] shrink-0"
                  title="Watch & Save Last 30 Seconds Replay (Key R)"
                >
                  <Film className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span className="text-[9px] sm:text-[10px] tracking-wide hidden sm:inline">REPLAY</span>
                  <span className="text-[8px] font-mono text-red-400/80 hidden md:inline">[R]</span>
                </button>
              )}

              {/* Menu Drawer Toggle */}
              <button
                onClick={() => {
                  soundEngine.playUIClick();
                  setIsMenuOpen((prev) => !prev);
                }}
                className={`w-8 sm:w-8.5 h-8 sm:h-8.5 rounded-xl border flex items-center justify-center active:scale-95 transition-all cursor-pointer relative shrink-0 ${
                  isMenuOpen
                    ? 'border-cyan-400 bg-cyan-950/90 text-cyan-200 shadow-[0_0_14px_rgba(6,182,212,0.6)]'
                    : bikeDamage && bikeDamage.overallDamage > 0
                    ? 'border-red-500 bg-red-950/80 text-red-300 animate-pulse'
                    : 'border-white/20 hover:border-white text-zinc-300 hover:text-white bg-zinc-900/80'
                }`}
                title={isMenuOpen ? 'Close Menu' : 'Open Tools & Settings Menu'}
              >
                {isMenuOpen ? <X className="w-4 h-4 text-cyan-300" /> : <Menu className="w-4 h-4 text-white" />}
              </button>
            </div>
          </div>

          {/* Secondary Tools Dropdown Tray (Only shows when user taps MENU) */}
          {isMenuOpen && (
            <div className="bg-black/95 p-2 rounded-2xl border border-white/25 backdrop-blur-2xl shadow-2xl flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2 duration-150 min-w-[170px]">
              <span className="text-[8px] font-race font-bold text-zinc-400 uppercase tracking-widest px-2 py-0.5 border-b border-white/10">
                CITY TOOLS & SETTINGS
              </span>

              {/* City Map */}
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenMap();
                }}
                className="w-full px-2.5 py-1.5 rounded-xl border border-white/10 hover:border-cyan-400 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 flex items-center justify-between text-xs cursor-pointer active:scale-95 transition-all"
              >
                <div className="flex items-center gap-2">
                  <Map className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-race font-bold text-[10px]">CITY MAP</span>
                </div>
                <span className="text-[8px] font-mono text-zinc-500">[M]</span>
              </button>

              {/* Missions */}
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenMissions();
                }}
                className="w-full px-2.5 py-1.5 rounded-xl border border-white/10 hover:border-amber-400 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 flex items-center justify-between text-xs cursor-pointer active:scale-95 transition-all"
              >
                <div className="flex items-center gap-2">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-race font-bold text-[10px]">MISSIONS</span>
                </div>
                <span className="text-[8px] font-mono text-zinc-500">[T]</span>
              </button>

              {/* Daily Challenges */}
              {onOpenDailyChallenges && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenDailyChallenges();
                  }}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-amber-500/50 hover:border-amber-400 bg-amber-950/40 hover:bg-amber-900/50 text-amber-200 flex items-center justify-between text-xs cursor-pointer active:scale-95 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Trophy className="w-3.5 h-3.5 text-amber-300" />
                    <span className="font-race font-bold text-[10px]">DAILY CHALLENGES</span>
                  </div>
                  <span className="text-[8px] font-mono text-amber-400">3 TASKS</span>
                </button>
              )}

              {/* Garage & Repair */}
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenGarage();
                }}
                className={`w-full px-2.5 py-1.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer active:scale-95 transition-all ${
                  bikeDamage && bikeDamage.overallDamage > 0
                    ? 'border-red-500/80 bg-red-950/80 text-red-200'
                    : 'border-white/10 hover:border-orange-400 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Wrench className="w-3.5 h-3.5 text-orange-400" />
                  <span className="font-race font-bold text-[10px]">GARAGE / REPAIR</span>
                </div>
                <span className="text-[8px] font-mono text-zinc-500">[G]</span>
              </button>

              {/* Photo Studio */}
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenPhotoMode();
                }}
                className="w-full px-2.5 py-1.5 rounded-xl border border-white/10 hover:border-cyan-400 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 flex items-center justify-between text-xs cursor-pointer active:scale-95 transition-all"
              >
                <div className="flex items-center gap-2">
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-race font-bold text-[10px]">PHOTO STUDIO</span>
                </div>
                <span className="text-[8px] font-mono text-zinc-500">[P]</span>
              </button>

              {/* 30s Replay Theater */}
              {onOpenReplay && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenReplay();
                  }}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-red-500/50 hover:border-red-400 bg-red-950/40 hover:bg-red-950/80 text-red-200 flex items-center justify-between text-xs cursor-pointer active:scale-95 transition-all shadow-md"
                >
                  <div className="flex items-center gap-2">
                    <Film className="w-3.5 h-3.5 text-red-400" />
                    <span className="font-race font-bold text-[10px]">30s REPLAY THEATER</span>
                  </div>
                  <span className="text-[8px] font-mono text-red-400/80">[R]</span>
                </button>
              )}

              {/* Audio Mute */}
              <button
                onClick={toggleMute}
                className="w-full px-2.5 py-1.5 rounded-xl border border-white/10 hover:border-white bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 flex items-center justify-between text-xs cursor-pointer active:scale-95 transition-all"
              >
                <div className="flex items-center gap-2">
                  {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                  <span className="font-race font-bold text-[10px]">{isMuted ? 'AUDIO MUTED' : 'AUDIO ACTIVE'}</span>
                </div>
              </button>

              {/* Pause Game */}
              {onPause && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onPause();
                  }}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-white/10 hover:border-white bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 flex items-center justify-between text-xs cursor-pointer active:scale-95 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Pause className="w-3.5 h-3.5 text-zinc-300" />
                    <span className="font-race font-bold text-[10px]">PAUSE GAME</span>
                  </div>
                  <span className="text-[8px] font-mono text-zinc-500">[ESC]</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* =============================================================
          2. CENTER NOTIFICATIONS (Cam toast, Radio, Stunt, Mount Transition)
          ============================================================= */}
      <div className="absolute top-20 sm:top-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none z-30 max-w-md w-full px-4 text-center">
        {/* DEDICATED CAR ENTRY / EXIT STATE INDICATOR WITH PROGRESS BAR */}
        {mountTransition && mountTransition.state !== 'NONE' && (
          <div className="w-full bg-black/95 px-5 py-3 rounded-2xl border-2 border-cyan-400 backdrop-blur-2xl shadow-[0_0_35px_rgba(6,182,212,0.85)] flex flex-col items-center gap-2 animate-in fade-in zoom-in-95 duration-150 pointer-events-auto">
            {/* Header with state & pulse indicator */}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2.5">
                <span className="text-xl animate-bounce">
                  {mountTransition.state === 'DISMOUNTING' ? '🚶' : '🏎️'}
                </span>
                <div className="flex flex-col text-left">
                  <span className="text-[12px] font-race font-black tracking-wider text-cyan-200 uppercase drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">
                    {mountTransition.state === 'DISMOUNTING' ? 'EXITING SPORTS CAR' : 'ENTERING SPORTS CAR'}
                  </span>
                  <span className="text-[9px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                    {mountTransition.state === 'DISMOUNTING' ? 'Driver Door Opening • Stepping Out' : 'Opening Door • Sliding into Bucket Seat'}
                  </span>
                </div>
              </div>
              <span className="text-sm font-mono font-black text-cyan-300 font-mono-num bg-cyan-950/80 px-2 py-0.5 rounded-lg border border-cyan-500/50">
                {Math.round(mountTransition.progress * 100)}%
              </span>
            </div>

            {/* Glowing animated progress bar */}
            <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-cyan-500/50 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-amber-300 rounded-full transition-all duration-75 shadow-[0_0_16px_rgba(6,182,212,0.9)]"
                style={{ width: `${Math.round(mountTransition.progress * 100)}%` }}
              />
            </div>

            {/* Stage-by-stage indicator chips */}
            <div className="grid grid-cols-3 gap-1.5 w-full text-center pt-0.5">
              {[
                {
                  label: mountTransition.state === 'DISMOUNTING' ? '1. Unbuckle & Open Door' : '1. Approach Car Door',
                  active: mountTransition.progress < 0.35,
                  done: mountTransition.progress >= 0.35,
                },
                {
                  label: mountTransition.state === 'DISMOUNTING' ? '2. Step onto Asphalt' : '2. Slide into Cockpit',
                  active: mountTransition.progress >= 0.35 && mountTransition.progress < 0.75,
                  done: mountTransition.progress >= 0.75,
                },
                {
                  label: mountTransition.state === 'DISMOUNTING' ? '3. Close Door • On-Foot' : '3. Ignition & V8 Active',
                  active: mountTransition.progress >= 0.75,
                  done: false,
                },
              ].map((step, idx) => (
                <div
                  key={idx}
                  className={`px-1.5 py-1 rounded-md text-[8.5px] font-mono font-bold uppercase tracking-tight transition-all border ${
                    step.done
                      ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                      : step.active
                      ? 'bg-cyan-950/80 border-cyan-400 text-cyan-100 shadow-[0_0_10px_rgba(6,182,212,0.5)] animate-pulse'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-500'
                  }`}
                >
                  {step.done ? '✓ ' : ''}{step.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {cameraToast && (
          <div className="px-4 py-1.5 rounded-full border border-cyan-400/60 bg-black/90 shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top duration-150">
            <Camera className="w-4 h-4 text-cyan-400" />
            <span className="font-race font-bold text-xs text-white uppercase tracking-wider">
              {cameraToast}
            </span>
          </div>
        )}
        {radioChatter && (
          <div className="px-4 py-1.5 rounded-full border border-cyan-400/50 bg-black/85 shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top duration-200">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-[11px] font-mono text-cyan-200 font-semibold tracking-wide">
              {radioChatter}
            </span>
          </div>
        )}
        {playerState.currentStuntLabel && (
          <div className="px-4 py-1 rounded-full border border-amber-500/60 bg-black/85 shadow-xl flex items-center gap-1.5 text-amber-400 font-race font-bold text-xs tracking-wider animate-bounce">
            <Flame className="w-4 h-4 fill-amber-400" />
            {playerState.currentStuntLabel} (+{playerState.stuntScore})
          </div>
        )}
      </div>

      {/* =============================================================
          3. BOTTOM CONTROLS: CONTEXT-SENSITIVE, COMFORTABLE & ORGANIZED
          - Only displays buttons the user needs!
          - Clear, big FORWARD and BACKWARD buttons in both modes!
          - Always-accessible Mode Switcher!
          ============================================================= */}
      {/* =============================================================
          3. BOTTOM CONTROLS & ERGONOMIC RACING PEDAL POD
          - Guaranteed 100% visible on right end across all screen sizes!
          - Flex-shrink-0 isolates Left and Right controls from Center HUD
          - Compact 2-tier ergonomic pedal console for thumbs
          ============================================================= */}
      {/* =========================================================
          BOTTOM LEFT: STEERING / TURNING PEDALS (PINNED ANCHOR)
          - Pinned firmly to bottom-left with safe padding
          - Never collides with center or right controls
          ========================================================= */}
      <div className="fixed bottom-3 left-2.5 sm:bottom-5 sm:left-6 pointer-events-auto z-40">
        {playerState.isOnBike ? (
          /* REAL CAR STEERING WHEEL SYSTEM & TRANSMISSION PADDLES */
          <div className="flex flex-col items-center">
            <InteractiveSteeringWheel
              steerRatio={Math.abs(touchSteer) > 0.01 ? touchSteer : (playerState.steer ?? 0)}
              onSteerChange={(ratio) => setTouchSteer(ratio)}
              carStyle={carStyle}
              onHorn={onHorn}
              onCameraToggle={handleCameraToggleClick}
              onPaddleShift={onManualShift}
              onToggleCarStyle={() => onSwitchCarStyle?.(carStyle === 'bmw_m' ? 'benz_amg' : 'bmw_m')}
              driveMode={driveMode}
            />
          </div>
        ) : (
          /* ON-FOOT TURNING CONTROLS (TURN LEFT / TURN RIGHT) */
          <div className="flex items-center gap-1.5 sm:gap-2 bg-black/92 p-1.5 sm:p-2.5 rounded-3xl border border-emerald-400/40 backdrop-blur-2xl shadow-[0_0_25px_rgba(0,0,0,0.85)]">
            {/* Turn Left */}
            <button
              onTouchStart={() => setTouchSteer(-1)}
              onTouchEnd={() => setTouchSteer(0)}
              onMouseDown={() => setTouchSteer(-1)}
              onMouseUp={() => setTouchSteer(0)}
              className="w-13 sm:w-15 h-13 sm:h-15 rounded-2xl border-2 border-white/30 active:border-emerald-400 bg-black/80 active:bg-emerald-500/50 text-white font-race font-black flex flex-col items-center justify-center active:scale-95 transition-all shadow-xl cursor-pointer select-none touch-none"
              title="Turn Left (A / Left Arrow)"
            >
              <ArrowLeft className="w-6 sm:w-7 h-6 sm:h-7 text-emerald-300" />
              <span className="text-[7.5px] sm:text-[8px] font-mono font-bold text-emerald-200">TURN [A]</span>
            </button>

            {/* Turn Right */}
            <button
              onTouchStart={() => setTouchSteer(1)}
              onTouchEnd={() => setTouchSteer(0)}
              onMouseDown={() => setTouchSteer(1)}
              onMouseUp={() => setTouchSteer(0)}
              className="w-13 sm:w-15 h-13 sm:h-15 rounded-2xl border-2 border-white/30 active:border-emerald-400 bg-black/80 active:bg-emerald-500/50 text-white font-race font-black flex flex-col items-center justify-center active:scale-95 transition-all shadow-xl cursor-pointer select-none touch-none"
              title="Turn Right (D / Right Arrow)"
            >
              <ArrowRight className="w-6 sm:w-7 h-6 sm:h-7 text-emerald-300" />
              <span className="text-[7.5px] sm:text-[8px] font-mono font-bold text-emerald-200">TURN [D]</span>
            </button>
          </div>
        )}
      </div>

      {/* =========================================================
          BOTTOM CENTER: VEHICLE MODE SWITCHER / ENTRY-EXIT
          - Floating center alignment, isolated from Left and Right pods
          - Compact pill that never collides with side controls
          ========================================================= */}
      <div className="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 pointer-events-auto z-30 flex flex-col items-center gap-1.5">
        {/* Digital Cockpit Dashboard Binnacle (when docked at bottom - desktop only to prevent mobile overlap) */}
        {playerState.isOnBike && cockpitDock === 'bottom' && (
          <div className="mb-1 w-full max-w-[92vw] sm:max-w-[460px] hidden md:block">
            <AutomotiveHUD
              vehicleState={playerState}
              speedUnit={speedUnit}
              dockPosition="bottom"
              onToggleDock={() => setCockpitDock('top')}
              carStyle={carStyle}
              onToggleCarStyle={() => onSwitchCarStyle?.(carStyle === 'bmw_m' ? 'benz_amg' : 'bmw_m')}
              className="w-full animate-in fade-in slide-in-from-bottom duration-150"
            />
          </div>
        )}

        {mountTransition && mountTransition.state !== 'NONE' ? (
          /* Dedicated Cinematic Car Door Entry/Exit Indicator */
          <div className="bg-black/92 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-2xl border-2 border-cyan-400 backdrop-blur-xl shadow-[0_0_30px_rgba(6,182,212,0.65)] flex flex-col items-center gap-1 min-w-[180px] sm:min-w-[240px] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between w-full gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-base">{mountTransition.state === 'DISMOUNTING' ? '🚶' : '🏎️'}</span>
                <span className="text-[9px] sm:text-[11px] font-race font-black tracking-wider text-cyan-200 uppercase truncate">
                  {mountTransition.state === 'DISMOUNTING' ? 'EXITING CAR...' : 'ENTERING SPORTS CAR...'}
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-mono font-bold text-cyan-400 font-mono-num">
                {Math.round(mountTransition.progress * 100)}%
              </span>
            </div>
            {/* Glowing Animated Progress Bar */}
            <div className="w-full h-1.5 sm:h-2 bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-cyan-500/40">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-amber-300 rounded-full transition-all duration-75 shadow-[0_0_12px_rgba(6,182,212,0.8)]"
                style={{ width: `${Math.round(mountTransition.progress * 100)}%` }}
              />
            </div>
            <span className="text-[7px] sm:text-[8px] font-mono text-zinc-300 uppercase tracking-wide truncate max-w-full">
              {mountTransition.state === 'DISMOUNTING'
                ? mountTransition.progress < 0.35
                  ? '1. Engaging Park & Opening Gullwing Door'
                  : mountTransition.progress < 0.75
                  ? '2. Stepping Out onto Asphalt'
                  : '3. Closing Door • On-Foot'
                : mountTransition.progress < 0.35
                ? '1. Opening Driver Door'
                : mountTransition.progress < 0.75
                ? '2. Sliding into Bucket Seat'
                : '3. Starting Twin-Turbo Engine'}
            </span>
          </div>
        ) : playerState.isOnBike ? (
          /* REAL CAR GEAR SHIFTER & EXIT VEHICLE SYSTEM - Desktop only (>=1024px) */
          <div className="hidden lg:flex flex-col items-center gap-1.5">
            {/* Electronic PRND Gear Shifter with Sequential Stepper */}
            <AutomotiveTransmission
              currentGear={effectiveGear}
              onShiftGear={(newGear) => {
                if (onShiftGear) {
                  onShiftGear(newGear);
                } else if (onManualShift) {
                  const isDown = newGear === 'R' || newGear === 'P' || newGear < effectiveGear;
                  if (isDown) onManualShift('DOWN');
                  else onManualShift('UP');
                }
              }}
              onPaddleShift={onManualShift}
              driveMode={driveMode}
              carStyle={carStyle}
              speedKmh={rawSpeedKmh}
            />

            {/* Clear & comfortable Exit Car button */}
            <button
              onClick={() => {
                soundEngine.playUIClick();
                onMountToggle();
              }}
              className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-amber-400/80 bg-amber-500/30 hover:bg-amber-500/50 active:bg-amber-500/80 backdrop-blur-md text-amber-200 font-race font-black text-[10px] sm:text-[11px] flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.4)] active:scale-95 transition-all cursor-pointer select-none touch-none whitespace-nowrap"
              title="Exit Sports Car and Walk On Foot (E or Q)"
            >
              <Footprints className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>EXIT CAR [E]</span>
            </button>
          </div>
        ) : (
          /* Glowing Enter Sports Car button */
          <button
            onClick={() => {
              soundEngine.playUIClick();
              onMountToggle();
            }}
            className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border-2 border-emerald-400 bg-emerald-500/50 hover:bg-emerald-500/70 active:bg-emerald-500/90 backdrop-blur-md text-white font-race font-black text-[11px] sm:text-xs flex items-center gap-1.5 shadow-[0_0_25px_rgba(16,185,129,0.7)] active:scale-95 transition-all cursor-pointer animate-pulse select-none touch-none whitespace-nowrap"
            title="Enter Sports Car (E or Q)"
          >
            <Car className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-emerald-200 shrink-0" />
            <span>DRIVE SPORTS CAR [E]</span>
          </button>
        )}
      </div>

      {/* =========================================================
          BOTTOM RIGHT: REDESIGNED RIDING PEDALS CONSOLE
          - 100% VISIBLE ON RIGHT END ACROSS ALL SCREENS (NEVER HIDDEN)!
          - Pinned firmly to bottom-right with safe right inset
          - High-contrast M-Performance & AMG style racing pedals
          - Guaranteed no overlapping buttons or text clipping
          ========================================================= */}
      <div
        className="fixed bottom-3 right-2.5 sm:bottom-5 sm:right-5 md:right-7 pointer-events-auto z-40"
        data-testid="riding-pedals-console"
      >
        {playerState.isOnBike ? (
          /* REAL SPORTS CAR RACING PEDALS CONSOLE */
          <AutomotivePedals
            throttleRatio={touchThrottle}
            brakeRatio={touchBrake}
            isNitro={touchNitro}
            isHandbrake={touchWheelie}
            nitroPercent={nitro}
            currentGear={effectiveGear}
            onThrottleChange={(val) => setTouchThrottle(val)}
            onBrakeChange={(val, reverse) => {
              setTouchBrake(val);
              if (reverse !== undefined) setTouchReverse(reverse);
            }}
            onNitroChange={(active) => setTouchNitro(active)}
            onHandbrakeChange={(active) => setTouchWheelie(active)}
            onToggleReverse={() => {
              const target = effectiveGear === 'R' ? 'D1' : 'R';
              if (onShiftGear) onShiftGear(target);
            }}
            onShiftGear={onShiftGear}
            onExitVehicle={onMountToggle}
            showQuickShifter={true}
          />
        ) : (
          /* ON-FOOT MOVEMENT PEDALS POD */
          <div className="flex flex-col items-end gap-1.5 p-1.5 sm:p-2 bg-black/92 backdrop-blur-2xl rounded-3xl border border-emerald-400/40 shadow-2xl ring-1 ring-emerald-400/20">
            {/* Top Row: Sprint Button */}
            <button
              onTouchStart={() => setTouchNitro(true)}
              onTouchEnd={() => setTouchNitro(false)}
              onMouseDown={() => setTouchNitro(true)}
              onMouseUp={() => setTouchNitro(false)}
              className={`w-full h-8 sm:h-9 px-2 rounded-xl border backdrop-blur-sm flex items-center justify-center gap-1 font-race font-bold active:scale-95 transition-all shadow-md cursor-pointer select-none touch-none ${
                touchNitro
                  ? 'border-cyan-400 bg-cyan-500/70 text-white shadow-[0_0_15px_rgba(6,182,212,0.8)]'
                  : 'border-cyan-400/60 bg-cyan-950/70 text-cyan-200'
              }`}
              title="Hold to Sprint Fast (SHIFT)"
            >
              <Zap className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
              <span className="text-[8.5px] sm:text-[9px] font-black text-white whitespace-nowrap">SPRINT [SHIFT]</span>
            </button>

            {/* Bottom Row: Step Back & Walk Forward (Fully Inset & Visible) */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Step Back */}
              <button
                onTouchStart={() => {
                  setTouchReverse(true);
                  setTouchBrake(1);
                  setTouchThrottle(0);
                }}
                onTouchEnd={() => {
                  setTouchReverse(false);
                  setTouchBrake(0);
                }}
                onMouseDown={() => {
                  setTouchReverse(true);
                  setTouchBrake(1);
                  setTouchThrottle(0);
                }}
                onMouseUp={() => {
                  setTouchReverse(false);
                  setTouchBrake(0);
                }}
                className="w-13 sm:w-16 md:w-18 h-18 sm:h-22 md:h-24 rounded-2xl border-2 border-amber-400/80 bg-gradient-to-t from-amber-950/90 to-amber-600/35 hover:to-amber-600/55 active:to-amber-600/85 backdrop-blur-sm flex flex-col items-center justify-center font-race font-black text-amber-100 active:scale-95 transition-all shadow-xl cursor-pointer select-none touch-none shrink-0"
                title="Step Backward (S or Down Arrow)"
              >
                <ArrowDown className="w-4 sm:w-5 md:w-6 h-4 sm:h-5 md:h-6 text-amber-300 drop-shadow mb-0.5" />
                <span className="text-[10px] sm:text-xs md:text-sm font-black text-white drop-shadow">BACK</span>
                <span className="text-[7px] sm:text-[7.5px] md:text-[8px] text-amber-200 font-mono font-bold mt-0.5">[S] STEP</span>
              </button>

              {/* Walk Forward (Rightmost Button) */}
              <button
                onTouchStart={() => {
                  setTouchThrottle(1);
                  setTouchReverse(false);
                  setTouchBrake(0);
                }}
                onTouchEnd={() => setTouchThrottle(0)}
                onMouseDown={() => {
                  setTouchThrottle(1);
                  setTouchReverse(false);
                  setTouchBrake(0);
                }}
                onMouseUp={() => setTouchThrottle(0)}
                className="w-15 sm:w-18 md:w-21 h-18 sm:h-22 md:h-24 rounded-2xl border-2 border-emerald-400 bg-gradient-to-t from-emerald-950/90 to-emerald-500/40 hover:to-emerald-500/60 active:to-emerald-500/90 backdrop-blur-sm flex flex-col items-center justify-center font-race font-black text-emerald-100 active:scale-95 transition-all shadow-[0_0_25px_rgba(16,185,129,0.55)] cursor-pointer select-none touch-none shrink-0"
                title="Walk Forward (W or Up Arrow)"
              >
                <ArrowUp className="w-4.5 sm:w-5.5 md:w-6 h-4.5 sm:h-5.5 md:h-6 text-emerald-200 drop-shadow mb-0.5" />
                <span className="text-[11px] sm:text-sm md:text-base font-black tracking-wider text-white drop-shadow">WALK</span>
                <span className="text-[7.5px] sm:text-[8px] md:text-[8.5px] text-emerald-100 font-mono font-black mt-0.5">[W] RUN</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
