import React from 'react';
import {
  X,
  Bot,
  Video,
  Sparkles,
  Zap,
  Radio,
  Tv,
  Heart,
  Flame,
  Award,
  Smartphone,
  Headphones,
  Coffee,
  Check,
  ShoppingBag,
} from 'lucide-react';
import { DroneSkinId, DRONE_SKINS } from '../3d/ModernKidCompanionDrone';
import { cityAudio } from '../audio/CityAudioEngine';

interface ModernKidGearModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDroneEnabled: boolean;
  onToggleDrone: (enabled: boolean) => void;
  currentDroneSkin: DroneSkinId;
  onSelectDroneSkin: (skin: DroneSkinId) => void;
  isStreamerMode: boolean;
  onToggleStreamerMode: (enabled: boolean) => void;
  isRainbowNitro: boolean;
  onToggleRainbowNitro: (enabled: boolean) => void;
  collectedItemsCount: number;
  playerCash: number;
  onSuperNitroBoost: () => void;
}

export const ModernKidGearModal: React.FC<ModernKidGearModalProps> = ({
  isOpen,
  onClose,
  isDroneEnabled,
  onToggleDrone,
  currentDroneSkin,
  onSelectDroneSkin,
  isStreamerMode,
  onToggleStreamerMode,
  isRainbowNitro,
  onToggleRainbowNitro,
  collectedItemsCount,
  playerCash,
  onSuperNitroBoost,
}) => {
  if (!isOpen) return null;

  const handleDroneToggle = () => {
    cityAudio.playDroneChirp();
    onToggleDrone(!isDroneEnabled);
  };

  const handleSkinSelect = (skin: DroneSkinId) => {
    cityAudio.playDroneChirp();
    onSelectDroneSkin(skin);
  };

  const handleStreamerToggle = () => {
    cityAudio.playCollectibleChime();
    onToggleStreamerMode(!isStreamerMode);
  };

  const handleRainbowNitroToggle = () => {
    cityAudio.playHypeNitro();
    onToggleRainbowNitro(!isRainbowNitro);
  };

  const handleInstantNitro = () => {
    cityAudio.playHypeNitro();
    onSuperNitroBoost();
  };

  // Determine kid hype title based on collectibles found
  const getKidHypeRank = (count: number) => {
    if (count >= 12) return { title: 'Legendary Cyber Prodigy', color: 'text-amber-400', badge: '👑 SSS' };
    if (count >= 8) return { title: 'Viral Street Trendsetter', color: 'text-pink-400', badge: '🔥 SS' };
    if (count >= 4) return { title: 'Hypebeast Stunter', color: 'text-cyan-400', badge: '⚡ S' };
    if (count >= 1) return { title: 'Rookie Kid Explorer', color: 'text-emerald-400', badge: '🛹 A' };
    return { title: 'Street Novice', color: 'text-zinc-400', badge: '⭐ B' };
  };

  const rank = getKidHypeRank(collectedItemsCount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/85 backdrop-blur-md select-none animate-fadeIn">
      <div className="max-w-2xl w-full max-h-[92vh] glass-panel bg-zinc-950/90 border border-cyan-500/30 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.18)] flex flex-col overflow-hidden">
        {/* Header with Cyber Badging */}
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-white/10 bg-gradient-to-r from-cyan-950/40 via-purple-950/30 to-pink-950/40">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-pink-500 p-0.5 shadow-lg shadow-cyan-500/30">
              <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
                <Bot className="w-6 h-6 text-cyan-300 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-black font-race text-white tracking-wide">
                  MODERN KID TECH GEAR
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-pink-500/20 text-pink-400 border border-pink-500/30 rounded-full">
                  GEN-Z EDITION
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Equip companion drones, viral creator livestreams, and secret city items!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 md:p-6 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Item 1: Companion FPV Drone */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-cyan-500/20 relative overflow-hidden">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-race font-bold text-base text-white">AeroBot Sky-Buddy 3000</h3>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                      3D COMPANION
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Personal autonomous FPV quadcopter! Follows your vehicle in real-time 3D, highlights jumps,
                    executes acrobatic barrel rolls during stunts, and beeps celebratory audio chirps!
                  </p>
                </div>
              </div>

              {/* Toggle switch */}
              <button
                onClick={handleDroneToggle}
                className={`px-4 py-2 rounded-xl text-xs font-race font-bold transition-all cursor-pointer shrink-0 ${
                  isDroneEnabled
                    ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30 active:scale-95'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {isDroneEnabled ? 'ACTIVE ON' : 'DISABLED'}
              </button>
            </div>

            {/* Drone Skins Selector */}
            {isDroneEnabled && (
              <div className="mt-4 pt-3 border-t border-white/10">
                <span className="text-[11px] font-mono uppercase text-zinc-400 block mb-2">
                  CUSTOM DRONE SKINS:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(DRONE_SKINS) as DroneSkinId[]).map((skinKey) => {
                    const skin = DRONE_SKINS[skinKey];
                    const isSelected = currentDroneSkin === skinKey;
                    return (
                      <button
                        key={skinKey}
                        onClick={() => handleSkinSelect(skinKey)}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-sm shadow-cyan-500/20'
                            : 'bg-zinc-900/60 border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
                        }`}
                      >
                        <div
                          className="w-4 h-4 rounded-full border border-white/30 shrink-0"
                          style={{
                            backgroundColor: `#${skin.neonColor.toString(16).padStart(6, '0')}`,
                            boxShadow: `0 0 8px #${skin.neonColor.toString(16).padStart(6, '0')}`,
                          }}
                        />
                        <span className="text-xs font-mono font-medium truncate">{skin.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 ml-auto shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Item 2: TikTok / Twitch Viral Live Streamer Rig */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-pink-500/20 relative overflow-hidden">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400 shrink-0">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-race font-bold text-base text-white">Viral Livestreamer Creator Mode</h3>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300">
                      TIKTOK / TWITCH LIVE
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Mount an 8K livestreaming smartphone with simulated real-time viewers (surging over 200,000+
                    when pulling high-speed drifts), floating emoji fire & heart reactions, and viral chat comments!
                  </p>
                </div>
              </div>

              <button
                onClick={handleStreamerToggle}
                className={`px-4 py-2 rounded-xl text-xs font-race font-bold transition-all cursor-pointer shrink-0 ${
                  isStreamerMode
                    ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/30 active:scale-95'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {isStreamerMode ? 'STREAM LIVE' : 'OFFLINE'}
              </button>
            </div>
          </div>

          {/* Item 3: Rainbow Hyperspeed Stunt Nitro */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-amber-500/20 relative overflow-hidden">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-race font-bold text-base text-white">Rainbow RGB Stunt Nitro FX</h3>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      RGB OVERDRIVE
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Transforms vehicle nitro exhaust flames into a dynamic color-cycling rainbow particle surge
                    with high-frequency turbo sound synthesis!
                  </p>
                </div>
              </div>

              <button
                onClick={handleRainbowNitroToggle}
                className={`px-4 py-2 rounded-xl text-xs font-race font-bold transition-all cursor-pointer shrink-0 ${
                  isRainbowNitro
                    ? 'bg-gradient-to-r from-pink-500 via-amber-500 to-cyan-500 text-black font-extrabold shadow-lg active:scale-95'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {isRainbowNitro ? 'RAINBOW ON' : 'STANDARD'}
              </button>
            </div>
          </div>

          {/* Item 4: Modern Kid Collectibles Vault */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-zinc-900/90 to-zinc-950 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-zinc-400 tracking-wider">
                  CITY EXPLORATION VAULT
                </span>
                <h4 className="font-race font-black text-lg text-white">Modern Kid Collectibles</h4>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-zinc-400 uppercase">HYPE STATUS</span>
                <div className={`font-race font-bold text-sm ${rank.color} flex items-center gap-1.5 justify-end`}>
                  <span>{rank.badge}</span>
                  <span>{rank.title}</span>
                </div>
              </div>
            </div>

            {/* 4 Interactive Collectible Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 flex flex-col items-center text-center">
                <Coffee className="w-5 h-5 text-pink-400 mb-1" />
                <span className="text-xs font-race font-bold text-white">Boba Blast</span>
                <span className="text-[10px] text-zinc-400">Sweet tapioca pearls</span>
              </div>
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex flex-col items-center text-center">
                <Zap className="w-5 h-5 text-cyan-400 mb-1" />
                <span className="text-xs font-race font-bold text-white">Prime Surge</span>
                <span className="text-[10px] text-zinc-400">Electrolyte fuel</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center text-center">
                <Sparkles className="w-5 h-5 text-amber-400 mb-1" />
                <span className="text-xs font-race font-bold text-white">24K Hover-Deck</span>
                <span className="text-[10px] text-zinc-400">Gold pop-tail</span>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 flex flex-col items-center text-center">
                <Headphones className="w-5 h-5 text-purple-400 mb-1" />
                <span className="text-xs font-race font-bold text-white">Cat-Ear Audio</span>
                <span className="text-[10px] text-zinc-400">RGB visualizer</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <span className="text-xs font-mono text-zinc-400">
                Items Collected: <strong className="text-cyan-300">{collectedItemsCount}</strong> / 12 locations
              </span>

              <button
                onClick={handleInstantNitro}
                disabled={playerCash < 500}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-race text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
              >
                <Zap className="w-3.5 h-3.5" />
                REFILL PRIME NITRO ($500)
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 md:p-5 border-t border-white/10 bg-zinc-950 flex items-center justify-between">
          <span className="text-xs font-mono text-zinc-400">
            Hype Cash Balance: <strong className="text-amber-400">${playerCash.toLocaleString()}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-race font-black text-sm tracking-wider shadow-lg shadow-cyan-500/25 transition-all active:scale-95 cursor-pointer"
          >
            CONFIRM & RIDE
          </button>
        </div>
      </div>
    </div>
  );
};
