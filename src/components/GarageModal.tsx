import React, { useState } from 'react';
import {
  X,
  Cpu,
  Disc,
  Activity,
  CircleDot,
  Settings2,
  Zap,
  Palette,
  Sparkles,
  Check,
  Wrench,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { OpenCityBike, PlayerOpenCityProfile, BikeDamageState } from '../types/openCity';
import { UPGRADE_PRICING, calculateEffectiveStats } from '../data/openCityCatalog';
import { cityAudio } from '../audio/CityAudioEngine';

interface GarageModalProps {
  currentBike: OpenCityBike;
  playerProfile: PlayerOpenCityProfile;
  onUpgrade: (part: keyof typeof UPGRADE_PRICING) => void;
  onCustomize: (customization: OpenCityBike['customization']) => void;
  onRepair: (cost: number) => void;
  onClose: () => void;
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

export const GarageModal: React.FC<GarageModalProps> = ({
  currentBike,
  playerProfile,
  onUpgrade,
  onCustomize,
  onRepair,
  onClose,
}) => {
  const [tab, setTab] = useState<'tuning' | 'paint' | 'repair'>('tuning');
  const stats = calculateEffectiveStats(currentBike);
  const damage: BikeDamageState = currentBike.damage || {
    fairingScratches: 0,
    fairingCracks: 0,
    leftMirrorMissing: false,
    rightMirrorMissing: false,
    headlightCracked: false,
    overallDamage: 0,
  };

  const hasDamage =
    damage.overallDamage > 0 ||
    damage.leftMirrorMissing ||
    damage.rightMirrorMissing ||
    damage.fairingCracks > 0.05 ||
    damage.fairingScratches > 0.05;

  // Calculate repair cost based on visual damage severity
  const mirrorCost = (damage.leftMirrorMissing ? 140 : 0) + (damage.rightMirrorMissing ? 140 : 0);
  const crackCost = Math.round(damage.fairingCracks * 480);
  const scratchCost = Math.round(damage.fairingScratches * 260);
  const headlightCost = damage.headlightCracked ? 180 : 0;
  const totalRepairCost = hasDamage ? Math.max(80, mirrorCost + crackCost + scratchCost + headlightCost) : 0;
  const canAffordRepair = playerProfile.cash >= totalRepairCost;

  const upgradeIcons = {
    engine: <Cpu className="w-5 h-5" />,
    brakes: <Disc className="w-5 h-5" />,
    suspension: <Activity className="w-5 h-5" />,
    tires: <CircleDot className="w-5 h-5" />,
    transmission: <Settings2 className="w-5 h-5" />,
    nitro: <Zap className="w-5 h-5" />,
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/85 backdrop-blur-md select-none">
      <div className="max-w-2xl w-full max-h-[88vh] glass-panel p-6 rounded-3xl border border-white/20 shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="font-race font-black text-2xl text-white">{currentBike.name}</h2>
            <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-xs font-mono text-cyan-400">
              <span>{stats.topSpeed} KM/H</span>
              <span>•</span>
              <span>{stats.handlingCharacteristics?.turningRadius ?? 3.2}m TURN RADIUS</span>
              <span>•</span>
              <span>{stats.handlingCharacteristics?.maxLeanAngle ?? 55}° LEAN</span>
              <span>•</span>
              <span className="text-amber-300 font-bold">{stats.handlingCharacteristics?.accelerationCurve}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="glass-panel px-4 py-1.5 rounded-xl border border-white/10 text-right">
              <div className="text-[9px] font-mono uppercase text-zinc-400">CASH WALLET</div>
              <div className="font-mono-num font-bold text-amber-300">${playerProfile.cash.toLocaleString()}</div>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl glass-panel border border-white/10 hover:border-red-500 text-zinc-300 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 my-3">
          <button
            onClick={() => setTab('tuning')}
            className={`px-4 py-2 rounded-xl font-race font-bold text-xs uppercase cursor-pointer transition-all ${
              tab === 'tuning' ? 'bg-orange-500 text-white shadow-lg' : 'glass-panel text-zinc-400 hover:text-white'
            }`}
          >
            PERFORMANCE TUNING
          </button>
          <button
            onClick={() => setTab('paint')}
            className={`px-4 py-2 rounded-xl font-race font-bold text-xs uppercase cursor-pointer transition-all ${
              tab === 'paint' ? 'bg-orange-500 text-white shadow-lg' : 'glass-panel text-zinc-400 hover:text-white'
            }`}
          >
            PAINT & CUSTOM
          </button>
          <button
            onClick={() => setTab('repair')}
            className={`px-4 py-2 rounded-xl font-race font-bold text-xs uppercase cursor-pointer transition-all flex items-center gap-2 ${
              tab === 'repair'
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                : hasDamage
                ? 'glass-panel text-amber-400 border border-amber-500/40 animate-pulse'
                : 'glass-panel text-zinc-400 hover:text-white'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>REPAIR & SERVICE</span>
            {hasDamage && (
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping inline-block" />
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1">
          {tab === 'tuning' && (
            <div className="space-y-3">
              {(Object.keys(UPGRADE_PRICING) as Array<keyof typeof UPGRADE_PRICING>).map((part) => {
                const cfg = UPGRADE_PRICING[part];
                const level = currentBike.upgrades[part];
                const isMax = level >= 5;
                const nextCost = isMax ? 0 : cfg.costs[level];
                const canAfford = playerProfile.cash >= nextCost;

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
                          <span className="text-[10px] font-mono text-amber-400">STAGE {level}/5</span>
                        </div>
                        {/* Pips */}
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

                    <div>
                      {isMax ? (
                        <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-race font-bold text-xs border border-emerald-500/30">
                          MAX LEVEL
                        </span>
                      ) : (
                        <button
                          onClick={() => onUpgrade(part)}
                          disabled={!canAfford}
                          className={`px-3.5 py-2 rounded-xl font-race font-bold text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer ${
                            canAfford
                              ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg'
                              : 'bg-zinc-800 text-zinc-500 border border-white/5 cursor-not-allowed'
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
          )}

          {tab === 'paint' && (
            <div className="space-y-4">
              {/* Fairing Color */}
              <div>
                <span className="text-xs font-race uppercase text-zinc-400 mb-2 block">
                  BODY FAIRING COLOR
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {BODY_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => onCustomize({ ...currentBike.customization, bodyColor: c.hex })}
                      className={`h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                        currentBike.customization.bodyColor === c.hex
                          ? 'border-white ring-2 ring-orange-500 scale-105'
                          : 'border-white/10'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {currentBike.customization.bodyColor === c.hex && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rim Color */}
              <div>
                <span className="text-xs font-race uppercase text-zinc-400 mb-2 block">
                  WHEEL & RIM FINISH
                </span>
                <div className="grid grid-cols-5 gap-2">
                  {RIM_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => onCustomize({ ...currentBike.customization, rimColor: c.hex })}
                      className={`h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                        currentBike.customization.rimColor === c.hex
                          ? 'border-white ring-2 ring-cyan-400 scale-105'
                          : 'border-white/10'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {currentBike.customization.rimColor === c.hex && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Neon Underglow Toggle */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs font-race uppercase text-zinc-400">
                  NEON UNDERGLOW SYSTEM
                </span>
                <button
                  onClick={() =>
                    onCustomize({ ...currentBike.customization, hasNeon: !currentBike.customization.hasNeon })
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer ${
                    currentBike.customization.hasNeon ? 'bg-cyan-500 text-black' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {currentBike.customization.hasNeon ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>
            </div>
          )}

          {tab === 'repair' && (
            <div className="space-y-4">
              {/* Overall Status Card */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  hasDamage
                    ? 'bg-red-950/30 border-red-500/40 shadow-lg shadow-red-950/20'
                    : 'bg-emerald-950/20 border-emerald-500/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      hasDamage ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {hasDamage ? <AlertTriangle className="w-6 h-6" /> : <Check className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="font-race font-black text-lg text-white">
                      {hasDamage ? 'DAMAGE REPAIRS REQUIRED' : 'SHOWROOM PRISTINE CONDITION'}
                    </div>
                    <div className="text-xs font-mono text-zinc-400">
                      {hasDamage
                        ? `Motorcycle has sustained ${damage.overallDamage}% structural and cosmetic wear from collisions`
                        : 'All fairings, mirrors, and paint are in factory-new condition'}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-mono text-zinc-400 uppercase">DAMAGE LEVEL</div>
                  <div
                    className={`font-mono-num font-black text-2xl ${
                      hasDamage ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    {damage.overallDamage}%
                  </div>
                </div>
              </div>

              {/* Diagnostic Breakdown */}
              <div className="space-y-2.5">
                <span className="text-xs font-race uppercase text-zinc-400 block tracking-wider">
                  VISUAL COMPONENT DIAGNOSTICS
                </span>

                {/* Fairing Cracks */}
                <div className="glass-panel p-3 rounded-xl border border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-race font-bold text-white block">AERODYNAMIC FAIRINGS & WINDSHIELD</span>
                    <span className="text-[11px] font-mono text-zinc-400">Structural fiberglass shell integrity</span>
                  </div>
                  <div className="font-mono font-bold text-right">
                    {damage.fairingCracks > 0.05 ? (
                      <span className="text-red-400">
                        CRACKED & FRACTURED ({Math.round(damage.fairingCracks * 100)}%)
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 inline" /> INTACT
                      </span>
                    )}
                  </div>
                </div>

                {/* Body Scratches */}
                <div className="glass-panel p-3 rounded-xl border border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-race font-bold text-white block">PAINT FINISH & SURFACE ABRASION</span>
                    <span className="text-[11px] font-mono text-zinc-400">Asphalt gouges and road scrape marks</span>
                  </div>
                  <div className="font-mono font-bold text-right">
                    {damage.fairingScratches > 0.05 ? (
                      <span className="text-amber-400">
                        HEAVY SCRATCHES ({Math.round(damage.fairingScratches * 100)}%)
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 inline" /> HIGH GLOSS
                      </span>
                    )}
                  </div>
                </div>

                {/* Mirrors */}
                <div className="glass-panel p-3 rounded-xl border border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-race font-bold text-white block">REARVIEW MIRRORS</span>
                    <span className="text-[11px] font-mono text-zinc-400">Billet stalks & aerodynamic mirror heads</span>
                  </div>
                  <div className="font-mono font-bold text-right space-y-0.5">
                    <div>
                      Left Mirror:{' '}
                      {damage.leftMirrorMissing ? (
                        <span className="text-red-400 font-bold">KNOCKED OFF / MISSING</span>
                      ) : (
                        <span className="text-emerald-400">INTACT</span>
                      )}
                    </div>
                    <div>
                      Right Mirror:{' '}
                      {damage.rightMirrorMissing ? (
                        <span className="text-red-400 font-bold">KNOCKED OFF / MISSING</span>
                      ) : (
                        <span className="text-emerald-400">INTACT</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Headlight */}
                <div className="glass-panel p-3 rounded-xl border border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-race font-bold text-white block">TWIN PROJECTOR HEADLIGHT</span>
                    <span className="text-[11px] font-mono text-zinc-400">High-intensity optical lens glass</span>
                  </div>
                  <div className="font-mono font-bold text-right">
                    {damage.headlightCracked ? (
                      <span className="text-red-400">CRACKED LENS GLASS</span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 inline" /> PRISTINE
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Repair Button */}
              {hasDamage ? (
                <div className="pt-2">
                  <button
                    onClick={() => onRepair(totalRepairCost)}
                    disabled={!canAffordRepair}
                    className={`w-full py-3.5 px-4 rounded-2xl font-race font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-98 shadow-xl cursor-pointer ${
                      canAffordRepair
                        ? 'bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-orange-500/25'
                        : 'bg-zinc-800 text-zinc-500 border border-white/5 cursor-not-allowed'
                    }`}
                  >
                    <Wrench className="w-4 h-4" />
                    <span>RESTORE & REPAIR MOTORCYCLE</span>
                    <span className="font-mono ml-2">(${totalRepairCost.toLocaleString()})</span>
                  </button>
                  {!canAffordRepair && (
                    <div className="text-center text-xs font-mono text-red-400 mt-2">
                      INSUFFICIENT FUNDS IN CASH WALLET
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center font-race font-bold text-xs text-emerald-400 flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />
                  NO WORKSHOP REPAIRS REQUIRED
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

