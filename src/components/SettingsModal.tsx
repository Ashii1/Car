import React, { useState } from 'react';
import { X, Volume2, VolumeX, Monitor, Sliders, Zap, Car, Bike, Sparkles, Check, Gauge } from 'lucide-react';
import { GameSettings } from '../types/openCity';
import { soundEngine } from '../audio/SoundEngine';
import { cityAudio } from '../audio/CityAudioEngine';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onClose: () => void;
  currentVehicleId?: string;
  onSelectVehicle?: (vehicleId: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
  currentVehicleId = 'bmw_m8_comp',
  onSelectVehicle,
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(() => cityAudio.isMuted);

  const toggleMasterMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    cityAudio.setMuted(next);
    soundEngine.setMuted(next);
  };

  const handleChange = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    const updated = { ...settings, [key]: value };
    onUpdateSettings(updated);
    soundEngine.setVolumes(updated.engineVolume, updated.sfxVolume, updated.musicVolume);
    cityAudio.setVolumes(updated.engineVolume, updated.sfxVolume, updated.musicVolume);
  };

  const handleApplyFastMode = () => {
    soundEngine.playUIClick();
    const fastSettings: GameSettings = {
      ...settings,
      graphicsQuality: 'low',
      trafficDensity: 'low',
      motionBlur: false,
      cameraShake: false,
    };
    onUpdateSettings(fastSettings);
  };

  const isCar = currentVehicleId === 'bmw_m8_comp' || currentVehicleId === 'benz_amg_gt63';
  const isGlider = currentVehicleId === 'kid_cyber_glider';
  const isBike = !isCar && !isGlider;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/85 backdrop-blur-md select-none animate-fadeIn">
      <div className="max-w-2xl w-full glass-panel p-6 md:p-8 rounded-3xl border border-white/20 shadow-2xl flex flex-col gap-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-race font-black text-2xl text-white">GAME SETTINGS</h2>
              <span className="text-[10px] font-mono text-zinc-400">VEHICLE CHOICE, PERFORMANCE & AUDIO</span>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playUIClick();
              onClose();
            }}
            className="w-9 h-9 rounded-xl glass-panel border border-white/10 hover:border-orange-500 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. PRIMARY VEHICLE SELECTION (Car vs Bike vs Cyber-Glider) */}
        <div className="space-y-3 bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-purple-950/40 p-4 rounded-2xl border border-cyan-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-race uppercase text-cyan-300 font-bold flex items-center gap-1.5 tracking-wider">
              <Car className="w-4 h-4 text-cyan-400" /> ACTIVE VEHICLE TYPE (CAR vs BIKE)
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              SWITCH INSTANTLY
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* OPTION 1: MODERN SPORTS CAR */}
            <button
              onClick={() => {
                soundEngine.playUIClick();
                cityAudio.ensureContext();
                onSelectVehicle?.('bmw_m8_comp');
              }}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isCar
                  ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                  : 'bg-black/40 border-white/10 hover:border-white/30 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                  <Car className="w-5 h-5" />
                </div>
                {isCar && (
                  <span className="w-5 h-5 rounded-full bg-cyan-400 text-black flex items-center justify-center text-xs font-bold">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
              <div>
                <div className="font-race font-bold text-sm text-white">SPORTS CAR</div>
                <div className="text-[11px] font-mono text-cyan-200">Apex M8 / AMG Biturbo</div>
                <div className="text-[9px] font-mono text-zinc-400 mt-1">Twin-Turbo • Aero Spoilers</div>
              </div>
            </button>

            {/* OPTION 2: STREET MOTORCYCLE */}
            <button
              onClick={() => {
                soundEngine.playUIClick();
                cityAudio.ensureContext();
                onSelectVehicle?.('echo_300');
              }}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isBike
                  ? 'bg-orange-500/20 border-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.3)] ring-1 ring-orange-400'
                  : 'bg-black/40 border-white/10 hover:border-white/30 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-300 flex items-center justify-center">
                  <Bike className="w-5 h-5" />
                </div>
                {isBike && (
                  <span className="w-5 h-5 rounded-full bg-orange-400 text-black flex items-center justify-center text-xs font-bold">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
              <div>
                <div className="font-race font-bold text-sm text-white">MOTORCYCLE</div>
                <div className="text-[11px] font-mono text-orange-200">Echo 300 / Superbike</div>
                <div className="text-[9px] font-mono text-zinc-400 mt-1">Agile Leaning • Wheelies</div>
              </div>
            </button>

            {/* OPTION 3: CYBER-GLIDER (MODERN KIDS) */}
            <button
              onClick={() => {
                soundEngine.playUIClick();
                cityAudio.ensureContext();
                onSelectVehicle?.('kid_cyber_glider');
              }}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isGlider
                  ? 'bg-pink-500/20 border-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.3)] ring-1 ring-pink-400'
                  : 'bg-black/40 border-white/10 hover:border-white/30 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-300 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                {isGlider && (
                  <span className="w-5 h-5 rounded-full bg-pink-400 text-black flex items-center justify-center text-xs font-bold">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
              <div>
                <div className="font-race font-bold text-sm text-white">CYBER-GLIDER</div>
                <div className="text-[11px] font-mono text-pink-200">Apex Neo-Kid Hover</div>
                <div className="text-[9px] font-mono text-zinc-400 mt-1">Instant Torque • Stunts</div>
              </div>
            </button>
          </div>
        </div>

        {/* 2. GRAPHICS FIDELITY & SPEED OPTIMIZER */}
        <div className="space-y-3 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-race uppercase text-zinc-300 font-bold flex items-center gap-1.5">
              <Monitor className="w-4 h-4 text-cyan-400" /> GRAPHICS & PERFORMANCE SPEED
            </span>
            <button
              onClick={handleApplyFastMode}
              className="px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-md"
              title="Apply ultra-fast settings for maximum framerate and no lag"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>⚡ BOOST SPEED (FAST 60 FPS)</span>
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {(['low', 'medium', 'high', 'ultra'] as const).map((q) => {
              const labels: Record<string, string> = {
                low: 'LOW (MAX FPS)',
                medium: 'MED (SMOOTH)',
                high: 'HIGH (BALANCED)',
                ultra: 'ULTRA (HD)',
              };
              return (
                <button
                  key={q}
                  onClick={() => {
                    soundEngine.playUIClick();
                    handleChange('graphicsQuality', q);
                  }}
                  className={`py-2.5 px-2 rounded-xl text-[11px] font-mono font-bold uppercase transition-all cursor-pointer text-center ${
                    settings.graphicsQuality === q
                      ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20 font-black'
                      : 'bg-zinc-900 text-zinc-400 border border-white/10 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  {labels[q]}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] font-mono text-zinc-400">
            {settings.graphicsQuality === 'low'
              ? '⚡ Max performance: Shadows disabled for silky-smooth 60+ FPS on any computer or mobile browser.'
              : settings.graphicsQuality === 'medium'
              ? '⚡ Smooth performance: Optimized basic shadow filtering and native resolution.'
              : '🌟 High-definition filtered shadows and rich atmospheric lighting.'}
          </p>
        </div>

        {/* 2.5 CITY TRAFFIC DENSITY (AI VEHICLES) */}
        <div className="space-y-3 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-race uppercase text-zinc-300 font-bold flex items-center gap-1.5">
              <Car className="w-4 h-4 text-amber-400" /> CITY TRAFFIC DENSITY (AI VEHICLES)
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold">
              AI TRAFFIC FLOW
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'off', label: 'OFF (0 CARS)', desc: 'Max FPS • Empty Roads' },
              { id: 'low', label: 'LOW (10 CARS)', desc: 'Light Traffic • Fast' },
              { id: 'medium', label: 'MED (22 CARS)', desc: 'Balanced Flow • Default' },
              { id: 'high', label: 'HIGH (38 CARS)', desc: 'Bustling City Roads' },
            ].map((td) => {
              const active = (settings.trafficDensity || 'medium') === td.id;
              return (
                <button
                  key={td.id}
                  onClick={() => {
                    soundEngine.playUIClick();
                    handleChange('trafficDensity', td.id as any);
                  }}
                  className={`py-2 px-2.5 rounded-xl text-left transition-all cursor-pointer border flex flex-col justify-between ${
                    active
                      ? 'bg-amber-500/20 border-amber-400 text-white shadow-lg shadow-amber-500/10 ring-1 ring-amber-400'
                      : 'bg-zinc-900/80 text-zinc-400 border-white/10 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[11px] font-race font-bold tracking-tight">{td.label}</span>
                    {active && <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />}
                  </div>
                  <span className="text-[9px] font-mono text-zinc-400 mt-1">{td.desc}</span>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] font-mono text-zinc-400">
            {(settings.trafficDensity || 'medium') === 'off'
              ? '⚡ Maximum performance: All NPC traffic removed for wide-open streets, highest FPS, and time trial speed runs.'
              : (settings.trafficDensity || 'medium') === 'low'
              ? '⚡ Light ambient traffic with low CPU/GPU load for smooth driving on mobile and budget laptops.'
              : (settings.trafficDensity || 'medium') === 'medium'
              ? '🚗 Balanced urban traffic with buses, autos, delivery tempos, and bikes.'
              : '🔥 Dense, vibrant city traffic with active overtaking, state transport buses, and highway cruisers.'}
          </p>
        </div>

        {/* 3. Audio Mixer */}
        <div className="space-y-3 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-race uppercase text-zinc-400 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-orange-400" /> AUDIO VOLUME
            </span>
            <button
              onClick={toggleMasterMute}
              className={`px-3 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer border transition-all active:scale-95 ${
                isMuted
                  ? 'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30'
                  : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30'
              }`}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{isMuted ? 'ALL MUTED' : 'AUDIO ACTIVE'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Engine Volume */}
            <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-zinc-300">Engine Sound</span>
                <span className="text-white">{Math.round(settings.engineVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.engineVolume}
                onChange={(e) => handleChange('engineVolume', parseFloat(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer"
              />
            </div>

            {/* SFX Volume */}
            <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-zinc-300">SFX (Tires, Nitro)</span>
                <span className="text-white">{Math.round(settings.sfxVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.sfxVolume}
                onChange={(e) => handleChange('sfxVolume', parseFloat(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer"
              />
            </div>

            {/* Music Volume */}
            <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-zinc-300">Music OST</span>
                <span className="text-white">{Math.round(settings.musicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.musicVolume}
                onChange={(e) => handleChange('musicVolume', parseFloat(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 4. Controls & Driving Tweaks */}
        <div className="space-y-3 pt-2 border-t border-white/10">
          <span className="text-xs font-race uppercase text-zinc-400 flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-amber-400" /> DRIVING DYNAMICS
          </span>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            {/* Speed Unit */}
            <div className="bg-black/40 p-3 rounded-xl border border-white/5 flex items-center justify-between">
              <span className="text-zinc-300">Speedometer Unit</span>
              <div className="flex gap-1">
                {(['kmh', 'mph'] as const).map((u) => (
                  <button
                    key={u}
                    onClick={() => handleChange('speedUnit', u)}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase cursor-pointer ${
                      settings.speedUnit === u ? 'bg-orange-500 text-white' : 'text-zinc-500 bg-white/5'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            {/* Transmission */}
            <div className="bg-black/40 p-3 rounded-xl border border-white/5 flex items-center justify-between">
              <span className="text-zinc-300">Transmission</span>
              <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase bg-orange-500/20 text-orange-300 border border-orange-500/30">
                AUTO D1-D6 / R
              </span>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={() => {
            soundEngine.playUIClick();
            onClose();
          }}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-race font-bold text-sm tracking-wider shadow-lg active:scale-98 transition-all cursor-pointer mt-1"
        >
          SAVE & CONTINUE PLAYING
        </button>
      </div>
    </div>
  );
};
