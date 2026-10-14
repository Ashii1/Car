import React, { useState } from 'react';
import {
  X,
  Check,
  Lock,
  Volume2,
  Compass,
  Zap,
  Gauge,
  CornerDownRight,
  Sliders,
  Scale,
  Sparkles,
  Layers,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { OpenCityBike, PlayerOpenCityProfile, BikeCategory } from '../types/openCity';
import { calculateEffectiveStats } from '../data/openCityCatalog';
import { cityAudio } from '../audio/CityAudioEngine';
import { BikeRadarChart, getBikeRadarMetrics } from './BikeRadarChart';

interface BikeDealerModalProps {
  bikes: OpenCityBike[];
  playerProfile: PlayerOpenCityProfile;
  onSelectBike: (bikeId: string) => void;
  onBuyBike: (bikeId: string) => void;
  onClose: () => void;
}

export const BikeDealerModal: React.FC<BikeDealerModalProps> = ({
  bikes,
  playerProfile,
  onSelectBike,
  onBuyBike,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'telemetry'>('grid');
  const [selectedBikeId, setSelectedBikeId] = useState<string>(
    playerProfile.currentBikeId || bikes[0]?.id || ''
  );
  const [showComparison, setShowComparison] = useState<boolean>(true);

  const currentEquippedBike = bikes.find((b) => b.id === playerProfile.currentBikeId) || bikes[0];
  const inspectedBike = bikes.find((b) => b.id === selectedBikeId) || bikes[0];

  const categories = ['ALL', 'Beginner', 'Sport', 'Superbike', 'Cruiser', 'Off-road', 'Electric', 'Classic'];

  const filteredBikes = bikes.filter((bike) => {
    if (selectedCategory === 'ALL') return true;
    return bike.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md select-none">
      <div className="max-w-6xl w-full max-h-[92vh] glass-panel p-5 md:p-6 rounded-3xl border border-white/20 shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-4 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.25)]">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-race font-black text-xl md:text-2xl text-white tracking-wide">
                  MOTORCYCLE SHOWROOM & HANDLING RADAR
                </h2>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-mono text-emerald-300 uppercase tracking-widest hidden sm:inline-block">
                  PBR KINEMATICS
                </span>
              </div>
              <span className="text-xs font-mono text-zinc-400">
                COMPARE ACCELERATION CURVES, TURNING RADII, & CHASSIS AGILITY WITH RADAR TELEMETRY
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Cash on Hand */}
            <div className="glass-panel px-4 py-1.5 rounded-xl border border-white/10 text-right bg-black/40">
              <div className="text-[9px] font-mono uppercase text-zinc-400">CASH ON HAND</div>
              <div className="font-mono-num font-bold text-amber-300 text-sm md:text-base">
                ${playerProfile.cash.toLocaleString()}
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl glass-panel border border-white/10 hover:border-red-500 text-zinc-300 hover:text-white cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters, Controls & Comparison Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 pb-2 border-b border-white/5">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none max-w-full">
            {categories.map((cat) => {
              const count = cat === 'ALL' ? bikes.length : bikes.filter((b) => b.category.toLowerCase() === cat.toLowerCase()).length;
              if (cat !== 'ALL' && count === 0) return null;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-race uppercase transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20 scale-102'
                      : 'glass-panel border border-white/10 text-zinc-400 hover:text-white hover:border-white/25'
                  }`}
                >
                  {cat} <span className="opacity-70 text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>

          {/* View Mode & Comparison Toggle */}
          <div className="flex items-center gap-2">
            {/* Compare vs Current Ride Toggle */}
            <button
              onClick={() => setShowComparison(!showComparison)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer border ${
                showComparison
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                  : 'glass-panel border-white/10 text-zinc-400 hover:text-zinc-200'
              }`}
              title="Overlay currently equipped bike on radar chart"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>COMPARE ACTIVE RIDE</span>
              {showComparison && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse ml-0.5" />
              )}
            </button>

            {/* Mode Switcher */}
            <div className="flex items-center bg-zinc-900/80 p-0.5 rounded-xl border border-white/10">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded-lg text-xs font-race uppercase transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-zinc-800 text-white font-bold shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                GRID VIEW
              </button>
              <button
                onClick={() => setViewMode('telemetry')}
                className={`px-3 py-1 rounded-lg text-xs font-race uppercase transition-all cursor-pointer ${
                  viewMode === 'telemetry'
                    ? 'bg-zinc-800 text-white font-bold shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                TELEMETRY STUDIO
              </button>
            </div>
          </div>
        </div>

        {/* Comparison Legend when active */}
        {showComparison && currentEquippedBike && (
          <div className="flex items-center gap-4 px-2 py-1 bg-white/5 rounded-xl border border-white/5 text-[11px] font-mono">
            <span className="text-zinc-400 uppercase text-[10px]">RADAR OVERLAY LEGEND:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500 border border-emerald-400" />
              <span className="text-emerald-300 font-bold">CANDIDATE MODEL</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm border border-amber-400 border-dashed bg-amber-500/20" />
              <span className="text-amber-300 font-bold">
                ACTIVE RIDE: {currentEquippedBike.name}
              </span>
            </div>
          </div>
        )}

        {/* Content Area */}
        {viewMode === 'grid' ? (
          /* ====================================================================
             1. GRID VIEW WITH EMBEDDED RADAR CHARTS
             ==================================================================== */
          <div className="flex-1 my-3 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-y-auto pr-1">
            {filteredBikes.map((bike) => {
              const stats = calculateEffectiveStats(bike);
              const handling = stats.handlingCharacteristics || bike.handlingCharacteristics;
              const isOwned = playerProfile.ownedBikeIds.includes(bike.id);
              const isActive = playerProfile.currentBikeId === bike.id;
              const canAfford = playerProfile.cash >= bike.price;

              return (
                <div
                  key={bike.id}
                  className={`glass-panel p-4 md:p-5 rounded-2xl border flex flex-col justify-between gap-3 transition-all ${
                    isActive
                      ? 'border-emerald-500 bg-emerald-950/20 shadow-[0_0_24px_rgba(16,185,129,0.2)]'
                      : 'border-white/10 hover:border-white/20 bg-zinc-950/40'
                  }`}
                >
                  {/* Top Bar: Category & Active Status */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-zinc-800 text-zinc-300 border border-white/5">
                          {bike.brand}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-blue-950/60 text-blue-300 border border-blue-500/30">
                          {bike.category}
                        </span>
                        {isActive && (
                          <span className="text-emerald-400 font-bold text-xs flex items-center gap-1 font-mono">
                            <Check className="w-3.5 h-3.5" /> CURRENT BIKE
                          </span>
                        )}
                      </div>
                      <h3 className="font-race font-bold text-lg md:text-xl text-white">{bike.name}</h3>
                      <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed">
                        {bike.description}
                      </p>
                    </div>
                  </div>

                  {/* Split Visual: Left = Radar Chart, Right = Unique Handling Badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-black/30 p-3 rounded-2xl border border-white/5">
                    {/* Left: Radar Chart */}
                    <div className="sm:col-span-5 flex flex-col items-center justify-center">
                      <div className="text-[10px] font-mono uppercase text-zinc-400 mb-1 flex items-center gap-1">
                        <Activity className="w-3 h-3 text-emerald-400" />
                        <span>HANDLING MATRIX</span>
                      </div>
                      <BikeRadarChart
                        bike={bike}
                        compareWithBike={showComparison && !isActive ? currentEquippedBike : null}
                        size="sm"
                        showLabels={true}
                        interactive={true}
                      />
                    </div>

                    {/* Right: Key Handling Characteristics Pills & Engineering Stats */}
                    <div className="sm:col-span-7 space-y-2 text-xs font-mono">
                      {/* Acceleration Curve Badge */}
                      <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-zinc-300">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-[10px] uppercase text-zinc-400">ACCEL CURVE</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[11px] border border-amber-500/30">
                          {handling.accelerationCurve}
                        </span>
                      </div>

                      {/* Turning Radius Badge */}
                      <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-zinc-300">
                          <Compass className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="text-[10px] uppercase text-zinc-400">TURNING RADIUS</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-[11px] border ${
                              handling.turningRadius <= 2.6
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : handling.turningRadius <= 3.4
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {handling.turningRadius} m
                          </span>
                          <span className="text-[9px] text-zinc-400">
                            {handling.turningRadius <= 2.6
                              ? '(Sharp Agile)'
                              : handling.turningRadius <= 3.4
                              ? '(Balanced)'
                              : '(Wide Arc)'}
                          </span>
                        </div>
                      </div>

                      {/* Lean Angle & Weight Balance */}
                      <div className="grid grid-cols-2 gap-1.5">
                        <div className="p-1.5 rounded-xl bg-white/5 border border-white/10">
                          <div className="text-[9px] text-zinc-400 uppercase flex items-center gap-1">
                            <CornerDownRight className="w-3 h-3 text-purple-400" />
                            <span>MAX LEAN</span>
                          </div>
                          <div className="text-white font-bold text-xs mt-0.5">
                            {handling.maxLeanAngle}° Apex
                          </div>
                        </div>

                        <div className="p-1.5 rounded-xl bg-white/5 border border-white/10">
                          <div className="text-[9px] text-zinc-400 uppercase flex items-center gap-1">
                            <Scale className="w-3 h-3 text-blue-400" />
                            <span>WEIGHT BIAS</span>
                          </div>
                          <div className="text-white font-bold text-xs mt-0.5">
                            {handling.weightDistribution}
                          </div>
                        </div>
                      </div>

                      {/* Linear Performance Stat Meters */}
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[10px] text-zinc-300">
                          <span>TOP SPEED</span>
                          <span className="font-bold text-white">{stats.topSpeed} KM/H</span>
                        </div>
                        <div className="h-1 bg-black/60 rounded-full overflow-hidden border border-white/5">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                            style={{ width: `${(stats.topSpeed / 340) * 100}%` }}
                          />
                        </div>

                        <div className="flex justify-between text-[10px] text-zinc-300">
                          <span>ACCELERATION</span>
                          <span className="font-bold text-white">{stats.acceleration}%</span>
                        </div>
                        <div className="h-1 bg-black/60 rounded-full overflow-hidden border border-white/5">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                            style={{ width: `${stats.acceleration}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2.5 pt-2 border-t border-white/10">
                    {/* Audio Preview */}
                    <button
                      onClick={() => {
                        cityAudio.startEngine(bike.soundType);
                        setTimeout(() => cityAudio.stopEngine(), 900);
                      }}
                      className="p-2.5 rounded-xl glass-panel border border-white/10 text-cyan-400 hover:text-white cursor-pointer transition-colors"
                      title="Preview Exhaust Sound"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>

                    {/* Inspect in Telemetry Studio */}
                    <button
                      onClick={() => {
                        setSelectedBikeId(bike.id);
                        setViewMode('telemetry');
                      }}
                      className="px-3 py-2 rounded-xl glass-panel border border-white/10 text-zinc-300 hover:text-white text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>TELEMETRY</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    {/* Select / Buy */}
                    {isOwned ? (
                      <button
                        onClick={() => onSelectBike(bike.id)}
                        disabled={isActive}
                        className={`flex-1 py-2.5 rounded-xl font-race font-bold text-xs uppercase transition-all cursor-pointer ${
                          isActive
                            ? 'bg-zinc-800 text-zinc-500 cursor-default'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20 active:scale-95'
                        }`}
                      >
                        {isActive ? 'ACTIVE RIDE' : 'SELECT BIKE'}
                      </button>
                    ) : (
                      <button
                        onClick={() => onBuyBike(bike.id)}
                        disabled={!canAfford}
                        className={`flex-1 py-2.5 rounded-xl font-race font-bold text-xs uppercase flex items-center justify-center gap-1.5 shadow-lg transition-all cursor-pointer ${
                          canAfford
                            ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white active:scale-95 shadow-orange-500/20'
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5'
                        }`}
                      >
                        <Lock className="w-3.5 h-3.5" /> BUY FOR ${bike.price.toLocaleString()}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ====================================================================
             2. TELEMETRY STUDIO VIEW: SIDE-BY-SIDE IN-DEPTH RADAR ANALYSIS
             ==================================================================== */
          <div className="flex-1 my-3 grid grid-cols-1 md:grid-cols-12 gap-4 overflow-y-auto pr-1">
            {/* Left Column: Bike Selector List (4 cols) */}
            <div className="md:col-span-4 space-y-2 overflow-y-auto max-h-[62vh] pr-1">
              <div className="text-[10px] font-mono uppercase text-zinc-400 mb-1 px-1">
                SELECT MODEL TO ANALYZE:
              </div>
              {filteredBikes.map((bike) => {
                const isCurrent = inspectedBike.id === bike.id;
                const isOwned = playerProfile.ownedBikeIds.includes(bike.id);
                const isActive = playerProfile.currentBikeId === bike.id;

                return (
                  <button
                    key={bike.id}
                    onClick={() => setSelectedBikeId(bike.id)}
                    className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isCurrent
                        ? 'bg-emerald-950/40 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                        : 'glass-panel border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono">
                        <span className="text-zinc-400">{bike.brand}</span>
                        <span className="text-blue-400 uppercase">({bike.category})</span>
                        {isActive && <span className="text-emerald-400 font-bold">• ACTIVE</span>}
                      </div>
                      <div className="font-race font-bold text-sm text-white">{bike.name}</div>
                      <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                        Radius: {bike.handlingCharacteristics.turningRadius}m | {bike.handlingCharacteristics.accelerationCurve}
                      </div>
                    </div>

                    <div className="text-right">
                      {isOwned ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          OWNED
                        </span>
                      ) : (
                        <span className="font-mono font-bold text-xs text-amber-300">
                          ${bike.price.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Column: In-Depth Radar Telemetry Studio (8 cols) */}
            <div className="md:col-span-8 glass-panel p-5 rounded-2xl border border-white/15 bg-black/40 flex flex-col justify-between gap-4 overflow-y-auto">
              {(() => {
                const stats = calculateEffectiveStats(inspectedBike);
                const handling = stats.handlingCharacteristics || inspectedBike.handlingCharacteristics;
                const activeStats = calculateEffectiveStats(currentEquippedBike);
                const activeHandling = activeStats.handlingCharacteristics || currentEquippedBike.handlingCharacteristics;
                const isOwned = playerProfile.ownedBikeIds.includes(inspectedBike.id);
                const isActive = playerProfile.currentBikeId === inspectedBike.id;
                const canAfford = playerProfile.cash >= inspectedBike.price;

                // Stat Deltas vs currently active bike
                const deltaSpeed = stats.topSpeed - activeStats.topSpeed;
                const deltaRadius = (handling.turningRadius - activeHandling.turningRadius).toFixed(2);
                const deltaLean = handling.maxLeanAngle - activeHandling.maxLeanAngle;

                return (
                  <>
                    {/* Header of Inspecting Bike */}
                    <div className="flex flex-wrap items-start justify-between border-b border-white/10 pb-3 gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-zinc-800 text-zinc-300 border border-white/10">
                            {inspectedBike.brand}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-blue-900/60 text-blue-300 border border-blue-500/30">
                            {inspectedBike.category}
                          </span>
                          {isActive && (
                            <span className="text-emerald-400 font-bold text-xs font-mono">
                              ✓ CURRENTLY EQUIPPED
                            </span>
                          )}
                        </div>
                        <h3 className="font-race font-bold text-2xl text-white mt-1">
                          {inspectedBike.name}
                        </h3>
                        <p className="text-xs text-zinc-300 mt-1 max-w-xl leading-relaxed">
                          {inspectedBike.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            cityAudio.startEngine(inspectedBike.soundType);
                            setTimeout(() => cityAudio.stopEngine(), 1000);
                          }}
                          className="px-3 py-2 rounded-xl glass-panel border border-white/10 text-cyan-400 hover:text-white text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                        >
                          <Volume2 className="w-4 h-4" />
                          <span>REV ENGINE</span>
                        </button>
                      </div>
                    </div>

                    {/* Middle Section: Large Radar Chart + Telemetry Matrix */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center my-1">
                      {/* Left: High-Res Radar Chart (5 cols) */}
                      <div className="sm:col-span-6 flex flex-col items-center justify-center p-3 rounded-2xl bg-black/40 border border-white/5">
                        <div className="text-[11px] font-mono uppercase text-emerald-400 font-bold mb-2 flex items-center gap-1.5">
                          <Activity className="w-4 h-4" />
                          <span>TELEMETRY RADAR CHART</span>
                        </div>
                        <BikeRadarChart
                          bike={inspectedBike}
                          compareWithBike={showComparison && !isActive ? currentEquippedBike : null}
                          size="md"
                          showLabels={true}
                          interactive={true}
                        />
                        <div className="text-[10px] font-mono text-zinc-400 mt-2 text-center">
                          Hover radar vertices to inspect metric telemetry
                        </div>
                      </div>

                      {/* Right: Detailed Handling Characteristics & Deltas (6 cols) */}
                      <div className="sm:col-span-6 space-y-2.5 font-mono text-xs">
                        {/* Comparison Delta Badges (if comparing) */}
                        {!isActive && showComparison && (
                          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
                            <div className="text-[10px] uppercase font-bold flex items-center gap-1 mb-1">
                              <Scale className="w-3.5 h-3.5" />
                              <span>VS. ACTIVE RIDE ({currentEquippedBike.name}):</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1 text-[11px] font-mono-num font-bold">
                              <div>
                                Speed: <span className={deltaSpeed >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                                  {deltaSpeed >= 0 ? `+${deltaSpeed}` : deltaSpeed} KM/H
                                </span>
                              </div>
                              <div>
                                Turn: <span className={Number(deltaRadius) <= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                                  {Number(deltaRadius) <= 0 ? `${deltaRadius}m` : `+${deltaRadius}m`}
                                </span>
                              </div>
                              <div>
                                Lean: <span className={deltaLean >= 0 ? 'text-emerald-400' : 'text-zinc-400'}>
                                  {deltaLean >= 0 ? `+${deltaLean}°` : `${deltaLean}°`}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Detailed Spec Cards */}
                        <div className="space-y-2">
                          {/* Acceleration Curve Spec */}
                          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                            <div>
                              <div className="text-[10px] uppercase text-zinc-400 flex items-center gap-1">
                                <Zap className="w-3.5 h-3.5 text-amber-400" />
                                <span>ACCELERATION CURVE</span>
                              </div>
                              <div className="text-white font-bold text-xs mt-0.5">
                                {handling.accelerationCurve}
                              </div>
                            </div>
                            <span className="text-[10px] text-zinc-400">
                              Exp: {handling.curveExponent}x
                            </span>
                          </div>

                          {/* Turning Radius Spec */}
                          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                            <div>
                              <div className="text-[10px] uppercase text-zinc-400 flex items-center gap-1">
                                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                                <span>MIN TURNING RADIUS</span>
                              </div>
                              <div className="text-white font-bold text-xs mt-0.5">
                                {handling.turningRadius} Meters
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px]">
                              {handling.turningRadius <= 2.6
                                ? 'Sharp Nimble'
                                : handling.turningRadius <= 3.3
                                ? 'Apex Balanced'
                                : 'Long Wheelbase'}
                            </span>
                          </div>

                          {/* Max Lean Angle */}
                          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                            <div>
                              <div className="text-[10px] uppercase text-zinc-400 flex items-center gap-1">
                                <CornerDownRight className="w-3.5 h-3.5 text-purple-400" />
                                <span>MAX LEAN ANGLE</span>
                              </div>
                              <div className="text-white font-bold text-xs mt-0.5">
                                {handling.maxLeanAngle}° Cornering Limit
                              </div>
                            </div>
                            <span className="text-[10px] text-purple-300">
                              {handling.maxLeanAngle >= 62 ? 'MotoGP Apex' : 'Standard Pegs'}
                            </span>
                          </div>

                          {/* Braking Bias & Weight Balance */}
                          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                            <div>
                              <div className="text-[10px] uppercase text-zinc-400 flex items-center gap-1">
                                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                                <span>BRAKING BIAS & BALANCE</span>
                              </div>
                              <div className="text-zinc-200 text-xs mt-0.5">
                                {handling.brakingBias}
                              </div>
                            </div>
                            <span className="text-[10px] text-zinc-400">
                              Weight: {stats.weight}kg ({handling.weightDistribution})
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                      <div className="text-xs font-mono">
                        <span className="text-zinc-400 uppercase">SHOWROOM PRICE: </span>
                        <span className="font-race font-bold text-lg text-amber-300">
                          {isOwned ? 'OWNED IN GARAGE' : `$${inspectedBike.price.toLocaleString()}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {isOwned ? (
                          <button
                            onClick={() => onSelectBike(inspectedBike.id)}
                            disabled={isActive}
                            className={`px-6 py-2.5 rounded-xl font-race font-bold text-xs uppercase transition-all cursor-pointer ${
                              isActive
                                ? 'bg-zinc-800 text-zinc-500 cursor-default'
                                : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20 active:scale-95'
                            }`}
                          >
                            {isActive ? 'CURRENT ACTIVE RIDE' : 'SELECT & DRIVE'}
                          </button>
                        ) : (
                          <button
                            onClick={() => onBuyBike(inspectedBike.id)}
                            disabled={!canAfford}
                            className={`px-6 py-2.5 rounded-xl font-race font-bold text-xs uppercase flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                              canAfford
                                ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white active:scale-95 shadow-orange-500/20'
                                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5'
                            }`}
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>PURCHASE FOR ${inspectedBike.price.toLocaleString()}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
