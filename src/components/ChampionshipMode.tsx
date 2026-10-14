import React from 'react';
import { ArrowLeft, Flag, Trophy, Play, CheckCircle, Award } from 'lucide-react';
import { RaceConfig } from '../types/game';
import { soundEngine } from '../audio/SoundEngine';

interface ChampionshipModeProps {
  onStartRace: (config: RaceConfig) => void;
  onBack: () => void;
}

export const ChampionshipMode: React.FC<ChampionshipModeProps> = ({
  onStartRace,
  onBack,
}) => {
  const rounds = [
    { round: 1, title: 'ROUND 1 — COASTAL RUN', trackId: 'coastal_highway', laps: 2, weather: 'sunny' as const, pts: 25 },
    { round: 2, title: 'ROUND 2 — MOUNTAIN PASS', trackId: 'mountain_pass', laps: 2, weather: 'fog' as const, pts: 18 },
    { round: 3, title: 'ROUND 3 — CITY NIGHT', trackId: 'city_circuit', laps: 3, weather: 'night' as const, pts: null },
    { round: 4, title: 'ROUND 4 — DESERT STRIKE', trackId: 'desert_highway', laps: 3, weather: 'sunset' as const, pts: null },
    { round: 5, title: 'ROUND 5 — FINAL CIRCUIT', trackId: 'night_rain_circuit', laps: 3, weather: 'rain' as const, pts: null },
  ];

  const standings = [
    { pos: 1, rider: 'Rider #99 (You)', bike: 'APEX / VELOCE', pts: 43 },
    { pos: 2, rider: 'Marco "Apex" Rossi', bike: 'Pantera V4', pts: 37 },
    { pos: 3, rider: 'Kenji Takahashi', bike: 'Thunder RR', pts: 33 },
    { pos: 4, rider: 'Elena Vance', bike: 'Ninja ZX-600', pts: 24 },
    { pos: 5, rider: 'Mateo Silva', bike: 'Phantom R-7', pts: 18 },
  ];

  const handleStartRound = (r: typeof rounds[0]) => {
    soundEngine.playUIClick();
    onStartRace({
      mode: 'championship',
      trackId: r.trackId,
      laps: r.laps,
      opponentsCount: 5,
      difficulty: 'hard',
      weather: r.weather,
      hasTraffic: r.trackId === 'coastal_highway' || r.trackId === 'desert_highway',
      championshipRound: r.round,
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
          <h2 className="font-race font-extrabold text-3xl text-white">WORLD GRAND PRIX CUP</h2>
          <p className="text-xs font-mono text-purple-400">5-ROUND STREET CHAMPIONSHIP</p>
        </div>

        <div className="glass-panel px-5 py-2 rounded-xl border border-white/10 text-right">
          <div className="text-[10px] font-mono uppercase text-zinc-400">YOUR STANDING</div>
          <div className="font-race font-bold text-lg text-amber-400">1ST PLACE (43 PTS)</div>
        </div>
      </div>

      {/* Main Championship Layout: Rounds on Left, Standings on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-auto">
        {/* Rounds List */}
        <div className="lg:col-span-7 space-y-3">
          <div className="text-xs font-race uppercase text-zinc-400 tracking-wider flex items-center gap-2">
            <Flag className="w-4 h-4 text-purple-400" /> CHAMPIONSHIP CALENDAR
          </div>

          {rounds.map((r) => {
            const isCompleted = r.pts !== null;
            const isNext = r.round === 3;

            return (
              <div
                key={r.round}
                className={`glass-panel p-4 rounded-xl border flex items-center justify-between gap-4 ${
                  isNext
                    ? 'border-purple-500 bg-purple-950/20 shadow-[0_0_20px_rgba(168,85,247,0.2)]'
                    : 'border-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center font-race font-bold text-sm ${
                      isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isNext
                        ? 'bg-purple-500 text-white'
                        : 'bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : r.round}
                  </div>
                  <div>
                    <div className="font-race font-bold text-sm text-white">{r.title}</div>
                    <div className="text-[10px] font-mono text-zinc-400 uppercase">
                      {r.laps} LAPS • {r.weather}
                    </div>
                  </div>
                </div>

                <div>
                  {isCompleted ? (
                    <span className="text-xs font-mono font-bold text-amber-400">
                      +{r.pts} PTS
                    </span>
                  ) : isNext ? (
                    <button
                      onClick={() => handleStartRound(r)}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-race font-bold text-xs uppercase flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" /> RACE NEXT ROUND
                    </button>
                  ) : (
                    <span className="text-xs font-mono text-zinc-600">UPCOMING</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Current Points Standings Table */}
        <div className="lg:col-span-5 glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div>
            <div className="text-xs font-race uppercase text-zinc-400 tracking-wider flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-amber-400" /> DRIVERS' CHAMPIONSHIP TABLE
            </div>

            <div className="space-y-2">
              {standings.map((s) => (
                <div
                  key={s.pos}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs font-mono ${
                    s.pos === 1
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : 'glass-panel border-white/5 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-race font-bold text-sm w-4">{s.pos}</span>
                    <div>
                      <div className="font-race font-bold text-white text-xs">{s.rider}</div>
                      <div className="text-[10px] text-zinc-400">{s.bike}</div>
                    </div>
                  </div>
                  <span className="font-mono-num font-bold text-sm">{s.pts} PTS</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[11px] font-mono text-zinc-500 mt-4 border-t border-white/10 pt-3">
            Points system: 1st (25), 2nd (18), 3rd (15), 4th (12), 5th (10). Champion wins 100,000 credits.
          </div>
        </div>
      </div>

      <div className="w-full text-center text-xs font-mono text-zinc-500">
        All 5 rounds feature diverse weather, circuit configurations, and fierce AI championship rivals.
      </div>
    </div>
  );
};
