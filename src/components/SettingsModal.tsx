import React, { useState } from 'react';
import { X, Volume2, VolumeX, Monitor, Sliders, Shield, Zap } from 'lucide-react';
import { GameSettings } from '../types/game';
import { soundEngine } from '../audio/SoundEngine';
import { cityAudio } from '../audio/CityAudioEngine';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
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

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md select-none">
      <div className="max-w-xl w-full glass-panel p-6 md:p-8 rounded-3xl border border-white/20 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-race font-black text-2xl text-white">GAME SETTINGS</h2>
              <span className="text-[10px] font-mono text-zinc-400">AUDIO, GRAPHICS & DRIVING CONTROLS</span>
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

        {/* Audio Sliders */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-race uppercase text-zinc-400 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-orange-400" /> AUDIO MIXER
            </span>
            <button
              onClick={toggleMasterMute}
              className={`px-3 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer border transition-all active:scale-95 ${
                isMuted
                  ? 'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30'
                  : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30'
              }`}
              title="Toggle Master Sound Mute"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{isMuted ? 'ALL AUDIO MUTED' : 'AUDIO ACTIVE'}</span>
            </button>
          </div>

          {/* Engine Volume */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-zinc-300">Motorcycle Engine</span>
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

          {/* SFX / Tires / Nitro Volume */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-zinc-300">Sound Effects (Tires, Nitro, Wind)</span>
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
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-zinc-300">Electronic Racing OST</span>
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

        {/* Graphics Preset */}
        <div className="space-y-3 pt-3 border-t border-white/10">
          <span className="text-xs font-race uppercase text-zinc-400 flex items-center gap-1.5">
            <Monitor className="w-4 h-4 text-cyan-400" /> GRAPHICS FIDELITY
          </span>
          <div className="grid grid-cols-4 gap-2">
            {(['low', 'medium', 'high', 'ultra'] as const).map((q) => (
              <button
                key={q}
                onClick={() => {
                  soundEngine.playUIClick();
                  handleChange('graphicsQuality', q);
                }}
                className={`py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                  settings.graphicsQuality === q
                    ? 'bg-cyan-500 text-black shadow-md'
                    : 'bg-zinc-800 text-zinc-400 border border-white/10 hover:text-white'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Driving Dynamics & Toggles */}
        <div className="space-y-3 pt-3 border-t border-white/10">
          <span className="text-xs font-race uppercase text-zinc-400 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-400" /> GAMEPLAY & CAMERA
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
                    className={`px-2 py-1 rounded text-[10px] font-bold uppercase cursor-pointer ${
                      settings.speedUnit === u ? 'bg-orange-500 text-white' : 'text-zinc-500'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            {/* Motion Blur */}
            <div className="bg-black/40 p-3 rounded-xl border border-white/5 flex items-center justify-between">
              <span className="text-zinc-300">High-Speed FX</span>
              <button
                onClick={() => handleChange('motionBlur', !settings.motionBlur)}
                className={`px-2 py-1 rounded text-[10px] font-bold uppercase cursor-pointer ${
                  settings.motionBlur ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {settings.motionBlur ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Camera Shake */}
            <div className="bg-black/40 p-3 rounded-xl border border-white/5 flex items-center justify-between">
              <span className="text-zinc-300">Camera Vibration</span>
              <button
                onClick={() => handleChange('cameraShake', !settings.cameraShake)}
                className={`px-2 py-1 rounded text-[10px] font-bold uppercase cursor-pointer ${
                  settings.cameraShake ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {settings.cameraShake ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Auto Transmission */}
            <div className="bg-black/40 p-3 rounded-xl border border-white/5 flex items-center justify-between">
              <span className="text-zinc-300">Transmission</span>
              <button
                onClick={() => handleChange('autoGear', !settings.autoGear)}
                className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-orange-500 text-white"
              >
                AUTO (6-SPD)
              </button>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={() => {
            soundEngine.playUIClick();
            onClose();
          }}
          className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-race font-bold text-sm tracking-wider shadow-lg active:scale-95 transition-all cursor-pointer"
        >
          SAVE & CLOSE
        </button>
      </div>
    </div>
  );
};
