import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Award, Coins, RotateCcw, Wrench, ChevronRight, Home } from 'lucide-react';
import { RaceResultData } from '../types/game';
import { soundEngine } from '../audio/SoundEngine';

interface RaceResultsProps {
  results: RaceResultData;
  onNextRace: () => void;
  onRetry: () => void;
  onGarage: () => void;
  onMainMenu: () => void;
}

export const RaceResults: React.FC<RaceResultsProps> = ({
  results,
  onNextRace,
  onRetry,
  onGarage,
  onMainMenu,
}) => {
  const isPodium = results.position <= 3;
  const isWinner = results.position === 1;

  useEffect(() => {
    if (isWinner) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isWinner]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs * 100) % 100);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const getRankSuffix = (r: number) => {
    if (r === 1) return 'ST';
    if (r === 2) return 'ND';
    if (r === 3) return 'RD';
    return 'TH';
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md select-none">
      <div className="max-w-lg w-full glass-panel p-8 rounded-3xl border border-white/20 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
        {/* Trophy / Position Badge */}
        <div
          className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-4 shadow-2xl ${
            isWinner
              ? 'bg-gradient-to-tr from-amber-500 to-yellow-300 text-black shadow-amber-500/40'
              : isPodium
              ? 'bg-gradient-to-tr from-cyan-500 to-blue-400 text-white shadow-cyan-500/40'
              : 'bg-zinc-800 text-zinc-400 border border-white/10'
          }`}
        >
          <Trophy className="w-12 h-12" />
        </div>

        <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">
          RACE COMPLETE
        </span>
        <h2 className="font-race font-black text-4xl text-white mt-1">
          {results.position}
          <span className="text-2xl text-orange-400">
            {getRankSuffix(results.position)}
          </span>{' '}
          PLACE
        </h2>

        {/* Timings */}
        <div className="grid grid-cols-2 gap-3 w-full my-6">
          <div className="bg-black/50 p-3.5 rounded-xl border border-white/5">
            <span className="text-[10px] font-mono uppercase text-zinc-400 block">TOTAL TIME</span>
            <span className="font-mono-num font-bold text-xl text-white">
              {formatTime(results.totalTime)}
            </span>
          </div>

          <div className="bg-black/50 p-3.5 rounded-xl border border-white/5">
            <span className="text-[10px] font-mono uppercase text-zinc-400 block">BEST LAP</span>
            <span className="font-mono-num font-bold text-xl text-cyan-400">
              {formatTime(results.bestLapTime)}
            </span>
          </div>
        </div>

        {/* Rewards Earned */}
        <div className="w-full bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-red-500/10 p-4 rounded-2xl border border-orange-500/30 flex items-center justify-around mb-6">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="text-[10px] font-mono text-zinc-400 block">CREDITS</span>
              <span className="font-mono-num font-bold text-lg text-amber-300">
                +${results.coinsEarned.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="w-[1px] h-8 bg-white/10" />

          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="text-[10px] font-mono text-zinc-400 block">XP REWARD</span>
              <span className="font-mono-num font-bold text-lg text-cyan-300">
                +{results.xpEarned} XP
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 w-full">
          <button
            onClick={() => {
              soundEngine.playUIClick();
              onRetry();
            }}
            className="py-3 px-4 rounded-xl glass-panel border border-white/10 hover:border-white/40 text-white font-race font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-orange-400" /> RETRY
          </button>

          <button
            onClick={() => {
              soundEngine.playUIClick();
              onGarage();
            }}
            className="py-3 px-4 rounded-xl glass-panel border border-white/10 hover:border-amber-400 text-white font-race font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <Wrench className="w-4 h-4 text-amber-400" /> GARAGE
          </button>

          <button
            onClick={() => {
              soundEngine.playUIClick();
              onMainMenu();
            }}
            className="py-3 px-4 rounded-xl glass-panel border border-white/10 hover:border-zinc-400 text-white font-race font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4 text-zinc-400" /> MAIN MENU
          </button>

          <button
            onClick={() => {
              soundEngine.playUIClick();
              onNextRace();
            }}
            className="py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-race font-bold text-sm flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            NEXT RACE <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
