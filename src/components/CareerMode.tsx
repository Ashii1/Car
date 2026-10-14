import React from 'react';
import { ArrowLeft, Trophy, Lock, CheckCircle2, Play, Award, Zap } from 'lucide-react';
import { PlayerProfile, RaceConfig } from '../types/game';
import { soundEngine } from '../audio/SoundEngine';

interface CareerModeProps {
  playerProfile: PlayerProfile;
  onStartRace: (config: RaceConfig) => void;
  onBack: () => void;
}

interface CareerEvent {
  id: string;
  tier: PlayerProfile['careerTier'];
  title: string;
  trackId: string;
  trackName: string;
  laps: number;
  opponents: number;
  difficulty: 'easy' | 'normal' | 'hard' | 'expert';
  rewardCoins: number;
  rewardXp: number;
  requiredLevel: number;
  completed: boolean;
}

export const CareerMode: React.FC<CareerModeProps> = ({
  playerProfile,
  onStartRace,
  onBack,
}) => {
  const events: CareerEvent[] = [
    {
      id: 'event_1',
      tier: 'Rookie',
      title: 'Coastal Intro Sprint',
      trackId: 'coastal_highway',
      trackName: 'Coastal Highway',
      laps: 2,
      opponents: 3,
      difficulty: 'easy',
      rewardCoins: 2500,
      rewardXp: 300,
      requiredLevel: 1,
      completed: true,
    },
    {
      id: 'event_2',
      tier: 'Rookie',
      title: 'Alpine Hairpin Touge',
      trackId: 'mountain_pass',
      trackName: 'Mountain Pass',
      laps: 2,
      opponents: 4,
      difficulty: 'normal',
      rewardCoins: 4000,
      rewardXp: 500,
      requiredLevel: 1,
      completed: false,
    },
    {
      id: 'event_3',
      tier: 'Street Racer',
      title: 'Neon Tokyo Underground',
      trackId: 'city_circuit',
      trackName: 'City Circuit',
      laps: 3,
      opponents: 5,
      difficulty: 'normal',
      rewardCoins: 7500,
      rewardXp: 800,
      requiredLevel: 2,
      completed: false,
    },
    {
      id: 'event_4',
      tier: 'Pro Rider',
      title: 'Mojave Heatwave Duel',
      trackId: 'desert_highway',
      trackName: 'Desert Highway',
      laps: 3,
      opponents: 5,
      difficulty: 'hard',
      rewardCoins: 12000,
      rewardXp: 1200,
      requiredLevel: 3,
      completed: false,
    },
    {
      id: 'event_5',
      tier: 'Elite Racer',
      title: 'Typhoon Midnight GP',
      trackId: 'night_rain_circuit',
      trackName: 'Night Rain Circuit',
      laps: 3,
      opponents: 6,
      difficulty: 'expert',
      rewardCoins: 20000,
      rewardXp: 2000,
      requiredLevel: 4,
      completed: false,
    },
  ];

  const handleLaunchEvent = (event: CareerEvent) => {
    soundEngine.playUIClick();
    onStartRace({
      mode: 'career',
      trackId: event.trackId,
      laps: event.laps,
      opponentsCount: event.opponents,
      difficulty: event.difficulty,
      weather: event.trackId === 'night_rain_circuit' ? 'rain' : 'sunny',
      hasTraffic: event.trackId === 'coastal_highway' || event.trackId === 'desert_highway',
    });
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between p-6 md:p-10 bg-[#06080d]/90 backdrop-blur-md select-none overflow-y-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="glass-panel px-4 py-2.5 rounded-xl border border-white/10 hover:border-orange-500 flex items-center gap-2 text-white font-race font-bold transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-orange-400" />
          BACK TO MENU
        </button>

        <div className="text-center">
          <h2 className="font-race font-extrabold text-3xl text-white">CAREER ROADMAP</h2>
          <p className="text-xs font-mono text-cyan-400">
            CURRENT STATUS: {playerProfile.careerTier.toUpperCase()}
          </p>
        </div>

        <div className="glass-panel px-5 py-2 rounded-xl border border-white/10 text-right">
          <div className="text-[10px] font-mono uppercase text-zinc-400">PLAYER LEVEL</div>
          <div className="font-race font-bold text-lg text-orange-400">
            LVL {playerProfile.level}
          </div>
        </div>
      </div>

      {/* Tier Roadmap Progress Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 my-4 flex items-center justify-between overflow-x-auto gap-4">
        {['Rookie', 'Street Racer', 'Pro Rider', 'Elite Racer', 'Champion'].map((tier, idx) => {
          const isCurrent = playerProfile.careerTier === tier;
          const isUnlocked = idx <= 1; // sample progression

          return (
            <div key={tier} className="flex items-center gap-3 flex-shrink-0">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-race font-bold text-sm border ${
                  isCurrent
                    ? 'border-orange-500 bg-orange-500/20 text-orange-400 shadow-[0_0_15px_#f97316]'
                    : isUnlocked
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                    : 'border-white/10 bg-zinc-800 text-zinc-500'
                }`}
              >
                {idx + 1}
              </div>
              <div>
                <div className="font-race font-bold text-xs text-white uppercase">{tier}</div>
                <div className="text-[10px] font-mono text-zinc-500">
                  {isCurrent ? 'ACTIVE TIER' : isUnlocked ? 'UNLOCKED' : 'LOCKED'}
                </div>
              </div>
              {idx < 4 && <div className="w-8 h-[1px] bg-white/10 ml-2" />}
            </div>
          );
        })}
      </div>

      {/* Career Events List */}
      <div className="space-y-3.5 my-auto max-h-[60vh] overflow-y-auto pr-1">
        {events.map((event) => {
          const isLocked = playerProfile.level < event.requiredLevel;

          return (
            <div
              key={event.id}
              className={`glass-panel p-5 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 transition-all ${
                isLocked
                  ? 'border-white/5 opacity-60'
                  : 'border-white/10 hover:border-orange-500/50'
              }`}
            >
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    event.completed
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : isLocked
                      ? 'bg-zinc-800 text-zinc-600'
                      : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  }`}
                >
                  {event.completed ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : isLocked ? (
                    <Lock className="w-6 h-6" />
                  ) : (
                    <Trophy className="w-6 h-6" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 uppercase">
                      {event.tier}
                    </span>
                    <span className="text-xs font-mono text-zinc-400 uppercase">
                      {event.trackName} • {event.laps} LAPS
                    </span>
                  </div>
                  <h3 className="font-race font-bold text-xl text-white mt-0.5">
                    {event.title}
                  </h3>
                </div>
              </div>

              {/* Rewards info */}
              <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="text-amber-400">
                    <span className="text-[10px] text-zinc-500 block">PRIZE</span>
                    +${event.rewardCoins.toLocaleString()}
                  </div>
                  <div className="text-cyan-400">
                    <span className="text-[10px] text-zinc-500 block">XP</span>
                    +{event.rewardXp} XP
                  </div>
                </div>

                {isLocked ? (
                  <span className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-500 font-race text-xs border border-white/10">
                    REQ LVL {event.requiredLevel}
                  </span>
                ) : (
                  <button
                    onClick={() => handleLaunchEvent(event)}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-race font-bold text-sm flex items-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    {event.completed ? 'RE-RACE' : 'ENTER RACE'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-xs font-mono text-zinc-500 text-center">
        Win races to climb the street ladder, unlock new motorcycles, performance parts and tracks.
      </div>
    </div>
  );
};
