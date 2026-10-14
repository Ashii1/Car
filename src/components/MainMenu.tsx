import React from 'react';
import { Play, Trophy, Wrench, Shield, Flag, Clock, Settings, Coins, Award } from 'lucide-react';
import { PlayerProfile, BikeData } from '../types/game';
import { soundEngine } from '../audio/SoundEngine';

interface MainMenuProps {
  playerProfile: PlayerProfile;
  currentBike: BikeData;
  onNavigate: (view: 'play' | 'career' | 'garage' | 'bikes' | 'championship' | 'timeTrial' | 'settings') => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  playerProfile,
  currentBike,
  onNavigate,
}) => {
  const handleClick = (view: 'play' | 'career' | 'garage' | 'bikes' | 'championship' | 'timeTrial' | 'settings') => {
    soundEngine.playUIClick();
    onNavigate(view);
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6 md:p-10 select-none">
      {/* 1. Top Bar: Game Brand & Player Profile */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
        {/* Brand Logo & Title */}
        <div className="pointer-events-auto">
          <div className="flex items-center gap-3">
            <div className="w-3 h-9 bg-gradient-to-b from-orange-500 to-red-600 rounded-sm" />
            <div>
              <h1 className="font-race font-black italic tracking-wider text-4xl md:text-5xl text-white drop-shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                RIDE <span className="text-orange-500">X</span>
              </h1>
              <p className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase -mt-1">
                Real Street Racing — Next Gen
              </p>
            </div>
          </div>
        </div>

        {/* Player Profile Card */}
        <div className="pointer-events-auto glass-panel px-5 py-3 rounded-2xl border border-white/10 flex items-center gap-6 shadow-2xl">
          {/* Level & XP */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center font-race font-extrabold text-white text-lg shadow-lg">
              {playerProfile.level}
            </div>
            <div>
              <div className="font-race font-bold text-sm text-white flex items-center gap-1.5">
                {playerProfile.name}
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 uppercase">
                  {playerProfile.careerTier}
                </span>
              </div>
              {/* XP bar */}
              <div className="flex items-center gap-2 mt-1">
                <div className="w-24 h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-orange-400 to-amber-300"
                    style={{
                      width: `${Math.min(100, (playerProfile.xp / playerProfile.xpToNextLevel) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-[9px] font-mono-num text-zinc-400">
                  {playerProfile.xp}/{playerProfile.xpToNextLevel} XP
                </span>
              </div>
            </div>
          </div>

          <div className="w-[1px] h-8 bg-white/10" />

          {/* Credits / Coins */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase text-zinc-400">CREDITS</div>
              <div className="font-mono-num font-bold text-lg text-amber-300 leading-tight">
                ${playerProfile.coins.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="hidden lg:block w-[1px] h-8 bg-white/10" />

          {/* Current Machine */}
          <div className="hidden lg:block">
            <div className="text-[10px] font-mono uppercase text-zinc-400">CURRENT MACHINE</div>
            <div className="font-race font-bold text-sm text-cyan-400">
              {currentBike.name}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Left Menu Action Drawer */}
      <div className="pointer-events-auto flex flex-col gap-2.5 max-w-sm w-full my-auto py-4">
        {/* PLAY Button */}
        <button
          onClick={() => handleClick('play')}
          className="group relative overflow-hidden glass-panel-accent p-4 rounded-2xl border border-orange-500/60 hover:border-orange-400 text-left transition-all duration-200 active:scale-98 shadow-[0_0_30px_rgba(249,115,22,0.2)] hover:shadow-[0_0_40px_rgba(249,115,22,0.4)] cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
                <Play className="w-6 h-6 fill-white ml-0.5" />
              </div>
              <div>
                <div className="font-race font-black text-2xl text-white tracking-wider">
                  QUICK RACE
                </div>
                <div className="text-xs font-mono text-orange-200/80">
                  Instant Street Racing & Traffic Sprints
                </div>
              </div>
            </div>
            <span className="font-race text-xl text-orange-400 font-bold group-hover:translate-x-1 transition-transform">
              ▶
            </span>
          </div>
        </button>

        {/* CAREER */}
        <button
          onClick={() => handleClick('career')}
          className="group glass-panel p-3.5 rounded-xl border border-white/10 hover:border-cyan-400/50 hover:bg-cyan-950/20 text-left transition-all duration-200 active:scale-98 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-zinc-800/80 border border-white/10 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400/50">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <div className="font-race font-bold text-lg text-white tracking-wide">
                  CAREER MODE
                </div>
                <div className="text-[11px] font-mono text-zinc-400">
                  Rookie to Elite Underground Kingpin
                </div>
              </div>
            </div>
            <span className="text-xs font-mono text-cyan-400/60 group-hover:text-cyan-400">
              {playerProfile.careerProgress}%
            </span>
          </div>
        </button>

        {/* GARAGE */}
        <button
          onClick={() => handleClick('garage')}
          className="group glass-panel p-3.5 rounded-xl border border-white/10 hover:border-amber-400/50 hover:bg-amber-950/20 text-left transition-all duration-200 active:scale-98 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-zinc-800/80 border border-white/10 flex items-center justify-center text-amber-400 group-hover:border-amber-400/50">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <div className="font-race font-bold text-lg text-white tracking-wide">
                  GARAGE & TUNING
                </div>
                <div className="text-[11px] font-mono text-zinc-400">
                  Performance Parts, Paint & Neons
                </div>
              </div>
            </div>
          </div>
        </button>

        {/* BIKES */}
        <button
          onClick={() => handleClick('bikes')}
          className="group glass-panel p-3.5 rounded-xl border border-white/10 hover:border-emerald-400/50 hover:bg-emerald-950/20 text-left transition-all duration-200 active:scale-98 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-zinc-800/80 border border-white/10 flex items-center justify-center text-emerald-400 group-hover:border-emerald-400/50">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="font-race font-bold text-lg text-white tracking-wide">
                  MOTORCYCLE SHOWROOM
                </div>
                <div className="text-[11px] font-mono text-zinc-400">
                  Superbikes, Sportbikes & Hyper Racers
                </div>
              </div>
            </div>
          </div>
        </button>

        {/* CHAMPIONSHIP */}
        <button
          onClick={() => handleClick('championship')}
          className="group glass-panel p-3.5 rounded-xl border border-white/10 hover:border-purple-400/50 hover:bg-purple-950/20 text-left transition-all duration-200 active:scale-98 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-zinc-800/80 border border-white/10 flex items-center justify-center text-purple-400 group-hover:border-purple-400/50">
                <Flag className="w-5 h-5" />
              </div>
              <div>
                <div className="font-race font-bold text-lg text-white tracking-wide">
                  CHAMPIONSHIP
                </div>
                <div className="text-[11px] font-mono text-zinc-400">
                  Multi-Stage World Grand Prix Series
                </div>
              </div>
            </div>
          </div>
        </button>

        {/* TIME TRIAL */}
        <button
          onClick={() => handleClick('timeTrial')}
          className="group glass-panel p-3.5 rounded-xl border border-white/10 hover:border-rose-400/50 hover:bg-rose-950/20 text-left transition-all duration-200 active:scale-98 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-zinc-800/80 border border-white/10 flex items-center justify-center text-rose-400 group-hover:border-rose-400/50">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="font-race font-bold text-lg text-white tracking-wide">
                  TIME TRIAL
                </div>
                <div className="text-[11px] font-mono text-zinc-400">
                  Solo Hot-Laps & Personal Best Delts
                </div>
              </div>
            </div>
          </div>
        </button>

        {/* SETTINGS */}
        <button
          onClick={() => handleClick('settings')}
          className="group glass-panel p-3 rounded-xl border border-white/10 hover:border-zinc-400 text-left transition-all duration-200 active:scale-98 flex items-center gap-3 cursor-pointer"
        >
          <Settings className="w-5 h-5 text-zinc-400 group-hover:text-white group-hover:rotate-45 transition-transform" />
          <span className="font-race font-semibold text-sm text-zinc-300 group-hover:text-white">
            SETTINGS & AUDIO
          </span>
        </button>
      </div>

      {/* 3. Bottom Controls Hint & Camera Tip */}
      <div className="flex flex-col md:flex-row items-center justify-between text-xs font-mono text-zinc-500 gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 bg-zinc-800 border border-white/10 rounded text-zinc-300">W/A/S/D</kbd> or <kbd className="px-2 py-0.5 bg-zinc-800 border border-white/10 rounded text-zinc-300">Arrows</kbd> Drive
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 bg-zinc-800 border border-white/10 rounded text-zinc-300">Shift</kbd> Nitro
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 bg-zinc-800 border border-white/10 rounded text-zinc-300">Space</kbd> Brake
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 bg-zinc-800 border border-white/10 rounded text-zinc-300">C</kbd> Camera
          </span>
        </div>
        <div>Drag 360° to rotate motorcycle in garage</div>
      </div>
    </div>
  );
};
