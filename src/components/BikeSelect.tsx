import React from 'react';
import { ArrowLeft, Check, Lock, Volume2, ShieldCheck, Zap } from 'lucide-react';
import { BikeData, PlayerProfile } from '../types/game';
import { calculateEffectiveStats } from '../data/bikesAndTracks';
import { soundEngine } from '../audio/SoundEngine';

interface BikeSelectProps {
  bikes: BikeData[];
  selectedBikeId: string;
  playerProfile: PlayerProfile;
  onSelectBike: (bikeId: string) => void;
  onBuyBike: (bikeId: string) => void;
  onBack: () => void;
}

export const BikeSelect: React.FC<BikeSelectProps> = ({
  bikes,
  selectedBikeId,
  playerProfile,
  onSelectBike,
  onBuyBike,
  onBack,
}) => {
  const currentBike = bikes.find((b) => b.id === selectedBikeId) || bikes[0];
  const stats = calculateEffectiveStats(currentBike);

  const handleTestRev = () => {
    soundEngine.playGearShift('up');
    soundEngine.startEngine(currentBike.soundType);
    soundEngine.updateEngine(0.85, 1.0, 140);
    setTimeout(() => {
      soundEngine.updateEngine(0.3, 0, 80);
      setTimeout(() => soundEngine.stopEngine(), 800);
    }, 700);
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6 md:p-10 select-none">
      {/* Top Header: Back button & Category */}
      <div className="flex items-center justify-between pointer-events-auto">
        <button
          onClick={onBack}
          className="glass-panel px-4 py-2.5 rounded-xl border border-white/10 hover:border-orange-500 flex items-center gap-2 text-white font-race font-bold transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-orange-400" />
          BACK TO MENU
        </button>

        <div className="glass-panel px-6 py-2 rounded-xl border border-white/10 text-right">
          <div className="text-[10px] font-mono uppercase text-zinc-400">CREDITS BALANCE</div>
          <div className="font-mono-num font-bold text-xl text-amber-300">
            ${playerProfile.coins.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Center Right: Detailed Bike Specs & Info Card */}
      <div className="self-end pointer-events-auto max-w-md w-full glass-panel p-6 rounded-2xl border border-white/10 shadow-2xl flex flex-col gap-4 my-auto">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 uppercase">
              {currentBike.category}
            </span>
            <span className="text-xs font-mono text-zinc-400">{currentBike.brand}</span>
          </div>

          <h2 className="text-3xl font-race font-extrabold text-white mt-1">
            {currentBike.name}
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed mt-1">
            {currentBike.description}
          </p>
        </div>

        {/* Performance Statistics Bars */}
        <div className="space-y-2.5 pt-2 border-t border-white/10">
          {/* Top Speed */}
          <div>
            <div className="flex justify-between text-xs font-race mb-1">
              <span className="text-zinc-400">TOP SPEED</span>
              <span className="font-mono-num font-bold text-white">{stats.topSpeed} KM/H</span>
            </div>
            <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                style={{ width: `${Math.min(100, (stats.topSpeed / 360) * 100)}%` }}
              />
            </div>
          </div>

          {/* Acceleration */}
          <div>
            <div className="flex justify-between text-xs font-race mb-1">
              <span className="text-zinc-400">ACCELERATION</span>
              <span className="font-mono-num font-bold text-white">{stats.acceleration}%</span>
            </div>
            <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                style={{ width: `${stats.acceleration}%` }}
              />
            </div>
          </div>

          {/* Handling */}
          <div>
            <div className="flex justify-between text-xs font-race mb-1">
              <span className="text-zinc-400">HANDLING</span>
              <span className="font-mono-num font-bold text-white">{stats.handling}%</span>
            </div>
            <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400"
                style={{ width: `${stats.handling}%` }}
              />
            </div>
          </div>

          {/* Braking */}
          <div>
            <div className="flex justify-between text-xs font-race mb-1">
              <span className="text-zinc-400">BRAKING</span>
              <span className="font-mono-num font-bold text-white">{stats.braking}%</span>
            </div>
            <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-500 to-red-400"
                style={{ width: `${stats.braking}%` }}
              />
            </div>
          </div>

          {/* Grip */}
          <div>
            <div className="flex justify-between text-xs font-race mb-1">
              <span className="text-zinc-400">TIRE GRIP</span>
              <span className="font-mono-num font-bold text-white">{stats.grip}%</span>
            </div>
            <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-400"
                style={{ width: `${stats.grip}%` }}
              />
            </div>
          </div>
        </div>

        {/* Sound Rev Preview & Purchase / Select Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleTestRev}
            className="glass-panel p-3 rounded-xl border border-white/10 hover:border-cyan-400 text-cyan-400 hover:text-white transition-all active:scale-95 cursor-pointer"
            title="Preview Engine Exhaust Tone"
          >
            <Volume2 className="w-5 h-5" />
          </button>

          {currentBike.unlocked ? (
            <button
              onClick={() => onSelectBike(currentBike.id)}
              disabled={playerProfile.currentBikeId === currentBike.id}
              className={`flex-1 py-3 px-4 rounded-xl font-race font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
                playerProfile.currentBikeId === currentBike.id
                  ? 'bg-emerald-600/30 border border-emerald-500 text-emerald-400 cursor-default'
                  : 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg hover:shadow-orange-500/30'
              }`}
            >
              {playerProfile.currentBikeId === currentBike.id ? (
                <>
                  <Check className="w-5 h-5" /> ACTIVE BIKE
                </>
              ) : (
                'SELECT FOR RACING'
              )}
            </button>
          ) : (
            <button
              onClick={() => onBuyBike(currentBike.id)}
              disabled={playerProfile.coins < currentBike.price}
              className={`flex-1 py-3 px-4 rounded-xl font-race font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
                playerProfile.coins >= currentBike.price
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg hover:shadow-amber-500/30'
                  : 'bg-zinc-800 text-zinc-500 border border-white/10 cursor-not-allowed'
              }`}
            >
              <Lock className="w-5 h-5" />
              BUY FOR ${currentBike.price.toLocaleString()}
            </button>
          )}
        </div>
      </div>

      {/* Bottom Horizontal Bike Selection Carousel */}
      <div className="pointer-events-auto flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
        {bikes.map((b) => {
          const isSelected = b.id === currentBike.id;
          const isActive = b.id === playerProfile.currentBikeId;

          return (
            <button
              key={b.id}
              onClick={() => {
                soundEngine.playUIClick();
                onSelectBike(b.id);
              }}
              className={`flex-shrink-0 px-4 py-3 rounded-2xl glass-panel border transition-all text-left min-w-[200px] cursor-pointer ${
                isSelected
                  ? 'border-orange-500 bg-orange-950/30 shadow-[0_0_20px_rgba(249,115,22,0.3)] scale-105'
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-1">
                <span>{b.category}</span>
                {isActive && (
                  <span className="text-emerald-400 flex items-center gap-0.5">
                    <Check className="w-3 h-3" /> ACTIVE
                  </span>
                )}
                {!b.unlocked && <Lock className="w-3 h-3 text-amber-400" />}
              </div>
              <div className="font-race font-bold text-sm text-white truncate">
                {b.name}
              </div>
              <div className="text-[11px] font-mono-num text-orange-400 mt-1">
                {b.baseStats.topSpeed} KM/H
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
