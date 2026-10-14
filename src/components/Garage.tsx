import React, { useState } from 'react';
import { ArrowLeft, Cpu, Disc, CircleDot, Activity, Settings2, Wind, Palette, Sparkles, Check } from 'lucide-react';
import { BikeData, PlayerProfile } from '../types/game';
import { UPGRADE_CONFIG, calculateEffectiveStats } from '../data/bikesAndTracks';
import { soundEngine } from '../audio/SoundEngine';

interface GarageProps {
  currentBike: BikeData;
  playerProfile: PlayerProfile;
  onUpgrade: (part: keyof typeof UPGRADE_CONFIG) => void;
  onCustomize: (customization: BikeData['customization']) => void;
  onCameraPreset: (preset: 'menu' | 'garage' | 'inspect' | 'front' | 'rear') => void;
  onBack: () => void;
}

const BODY_COLORS = [
  { name: 'Racing Crimson', hex: '#dc2626' },
  { name: 'Kawasaki Lime', hex: '#10b981' },
  { name: 'Yamaha Deep Blue', hex: '#2563eb' },
  { name: 'Obsidian Matte', hex: '#18181b' },
  { name: 'Pure Alpine White', hex: '#f8fafc' },
  { name: 'Trophy Gold', hex: '#eab308' },
  { name: 'Cyberpunk Violet', hex: '#8b5cf6' },
  { name: 'Solar Flare Orange', hex: '#f97316' },
];

const RIM_COLORS = [
  { name: 'Alloy Silver', hex: '#94a3b8' },
  { name: 'Gold Forged', hex: '#eab308' },
  { name: 'Stealth Black', hex: '#0f172a' },
  { name: 'Electric Cyan', hex: '#06b6d4' },
  { name: 'Race Orange', hex: '#f97316' },
];

const NEON_COLORS = [
  { name: 'Cyan Glow', hex: '#00f2fe' },
  { name: 'Neon Purple', hex: '#a855f7' },
  { name: 'Acid Green', hex: '#10b981' },
  { name: 'Inferno Orange', hex: '#ff5500' },
  { name: 'Electric Red', hex: '#ef4444' },
];

export const Garage: React.FC<GarageProps> = ({
  currentBike,
  playerProfile,
  onUpgrade,
  onCustomize,
  onCameraPreset,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'tuning' | 'paint'>('tuning');

  const stats = calculateEffectiveStats(currentBike);

  const upgradeIcons = {
    engine: <Cpu className="w-5 h-5" />,
    brakes: <Disc className="w-5 h-5" />,
    tires: <CircleDot className="w-5 h-5" />,
    suspension: <Activity className="w-5 h-5" />,
    transmission: <Settings2 className="w-5 h-5" />,
    aerodynamics: <Wind className="w-5 h-5" />,
  };

  const handleUpgradeClick = (part: keyof typeof UPGRADE_CONFIG) => {
    soundEngine.playUIClick();
    onUpgrade(part);
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6 md:p-10 select-none">
      {/* Top Bar: Back, Tabs, and Credits */}
      <div className="flex items-center justify-between pointer-events-auto">
        <button
          onClick={onBack}
          className="glass-panel px-4 py-2.5 rounded-xl border border-white/10 hover:border-orange-500 flex items-center gap-2 text-white font-race font-bold transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-orange-400" />
          BACK TO MENU
        </button>

        {/* Tab Switcher */}
        <div className="glass-panel p-1 rounded-xl border border-white/10 flex items-center gap-1">
          <button
            onClick={() => {
              setActiveTab('tuning');
              onCameraPreset('inspect');
            }}
            className={`px-5 py-2 rounded-lg font-race font-bold text-xs uppercase transition-all cursor-pointer ${
              activeTab === 'tuning'
                ? 'bg-orange-500 text-white shadow-lg'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            PERFORMANCE TUNING
          </button>
          <button
            onClick={() => {
              setActiveTab('paint');
              onCameraPreset('garage');
            }}
            className={`px-5 py-2 rounded-lg font-race font-bold text-xs uppercase transition-all cursor-pointer ${
              activeTab === 'paint'
                ? 'bg-orange-500 text-white shadow-lg'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            PAINT & CUSTOM
          </button>
        </div>

        {/* Credits */}
        <div className="glass-panel px-6 py-2 rounded-xl border border-white/10 text-right">
          <div className="text-[10px] font-mono uppercase text-zinc-400">CREDITS BALANCE</div>
          <div className="font-mono-num font-bold text-xl text-amber-300">
            ${playerProfile.coins.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Main Tuning / Paint Drawer (Right side) */}
      <div className="self-end pointer-events-auto max-w-lg w-full glass-panel p-6 rounded-2xl border border-white/10 shadow-2xl flex flex-col gap-4 my-auto max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h2 className="text-2xl font-race font-black text-white">{currentBike.name}</h2>
            <div className="text-xs font-mono text-cyan-400">
              {stats.topSpeed} KM/H • ACCEL {stats.acceleration}% • GRIP {stats.grip}%
            </div>
          </div>
          {/* Camera angles */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onCameraPreset('front')}
              className="px-2 py-1 bg-zinc-800/80 rounded border border-white/10 text-[10px] font-mono text-zinc-300 hover:text-white"
            >
              FRONT
            </button>
            <button
              onClick={() => onCameraPreset('rear')}
              className="px-2 py-1 bg-zinc-800/80 rounded border border-white/10 text-[10px] font-mono text-zinc-300 hover:text-white"
            >
              REAR
            </button>
            <button
              onClick={() => onCameraPreset('garage')}
              className="px-2 py-1 bg-zinc-800/80 rounded border border-white/10 text-[10px] font-mono text-zinc-300 hover:text-white"
            >
              SIDE
            </button>
          </div>
        </div>

        {activeTab === 'tuning' ? (
          /* Upgrades Grid */
          <div className="space-y-3">
            {(Object.keys(UPGRADE_CONFIG) as Array<keyof typeof UPGRADE_CONFIG>).map((part) => {
              const cfg = UPGRADE_CONFIG[part];
              const level = currentBike.upgrades[part];
              const isMax = level >= 5;
              const nextCost = isMax ? 0 : cfg.costs[level];
              const canAfford = playerProfile.coins >= nextCost;

              return (
                <div
                  key={part}
                  className="glass-panel p-3.5 rounded-xl border border-white/10 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                      {upgradeIcons[part]}
                    </div>
                    <div>
                      <div className="font-race font-bold text-sm text-white flex items-center gap-2">
                        {cfg.name}
                        <span className="text-[10px] font-mono text-amber-400">
                          STAGE {level}/5
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 leading-snug">
                        {cfg.description}
                      </div>

                      {/* Level Pips */}
                      <div className="flex items-center gap-1.5 mt-1.5">
                        {[1, 2, 3, 4, 5].map((p) => (
                          <div
                            key={p}
                            className={`w-4 h-1.5 rounded-sm ${
                              p <= level ? 'bg-orange-500 shadow-[0_0_8px_#f97316]' : 'bg-zinc-800'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Upgrade Button */}
                  <div>
                    {isMax ? (
                      <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-race font-bold text-xs border border-emerald-500/30">
                        MAX LEVEL
                      </span>
                    ) : (
                      <button
                        onClick={() => handleUpgradeClick(part)}
                        disabled={!canAfford}
                        className={`px-3.5 py-2 rounded-xl font-race font-bold text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer ${
                          canAfford
                            ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg hover:shadow-orange-500/30'
                            : 'bg-zinc-800 text-zinc-500 border border-white/10 cursor-not-allowed'
                        }`}
                      >
                        UPGRADE ${nextCost.toLocaleString()}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Paint & Visual Customization */
          <div className="space-y-4">
            {/* Body Paint */}
            <div>
              <div className="text-xs font-race uppercase text-zinc-400 mb-2 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-orange-400" /> BODY FAIRING COLOR
              </div>
              <div className="grid grid-cols-4 gap-2">
                {BODY_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => {
                      soundEngine.playUIClick();
                      onCustomize({ ...currentBike.customization, bodyColor: c.hex });
                    }}
                    className={`h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                      currentBike.customization.bodyColor === c.hex
                        ? 'border-white ring-2 ring-orange-500 scale-105'
                        : 'border-white/10 hover:border-white/40'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  >
                    {currentBike.customization.bodyColor === c.hex && (
                      <Check className="w-4 h-4 text-white drop-shadow" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Rim Color */}
            <div>
              <div className="text-xs font-race uppercase text-zinc-400 mb-2 flex items-center gap-1.5">
                <CircleDot className="w-4 h-4 text-cyan-400" /> WHEEL & RIM COLOR
              </div>
              <div className="grid grid-cols-5 gap-2">
                {RIM_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => {
                      soundEngine.playUIClick();
                      onCustomize({ ...currentBike.customization, rimColor: c.hex });
                    }}
                    className={`h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                      currentBike.customization.rimColor === c.hex
                        ? 'border-white ring-2 ring-cyan-400 scale-105'
                        : 'border-white/10 hover:border-white/40'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  >
                    {currentBike.customization.rimColor === c.hex && (
                      <Check className="w-4 h-4 text-white drop-shadow" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Neon Underglow */}
            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-race uppercase text-zinc-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" /> NEON UNDERGLOW SYSTEM
                </span>
                <button
                  onClick={() => {
                    soundEngine.playUIClick();
                    onCustomize({
                      ...currentBike.customization,
                      hasNeon: !currentBike.customization.hasNeon,
                    });
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer ${
                    currentBike.customization.hasNeon
                      ? 'bg-cyan-500 text-black'
                      : 'bg-zinc-800 text-zinc-400 border border-white/10'
                  }`}
                >
                  {currentBike.customization.hasNeon ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

              {currentBike.customization.hasNeon && (
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {NEON_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => {
                        soundEngine.playUIClick();
                        onCustomize({ ...currentBike.customization, neonColor: c.hex });
                      }}
                      className={`h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                        currentBike.customization.neonColor === c.hex
                          ? 'border-white ring-2 ring-cyan-400 scale-105'
                          : 'border-white/10 hover:border-white/40'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    >
                      {currentBike.customization.neonColor === c.hex && (
                        <Check className="w-4 h-4 text-white drop-shadow" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Hint */}
      <div className="text-xs font-mono text-zinc-500">
        All upgrades and paint changes are applied in real-time to your 3D motorcycle.
      </div>
    </div>
  );
};
