import React, { useState } from 'react';
import { ArrowLeft, Clock, Play, Timer, Sparkles } from 'lucide-react';
import { TrackData, RaceConfig } from '../types/game';
import { soundEngine } from '../audio/SoundEngine';

interface TimeTrialModeProps {
  tracks: TrackData[];
  onStartRace: (config: RaceConfig) => void;
  onBack: () => void;
}

export const TimeTrialMode: React.FC<TimeTrialModeProps> = ({
  tracks,
  onStartRace,
  onBack,
}) => {
  const [selectedTrackId, setSelectedTrackId] = useState<string>(tracks[0].id);
  const track = tracks.find((t) => t.id === selectedTrackId) || tracks[0];

  const formatLap = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs * 100) % 100);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    soundEngine.playUIClick();
    onStartRace({
      mode: 'timeTrial',
      trackId: track.id,
      laps: 3,
      opponentsCount: 0, // Solo hot-lap
      difficulty: 'normal',
      weather: track.defaultWeather,
      hasTraffic: false,
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
          <h2 className="font-race font-extrabold text-3xl text-white">SOLO TIME TRIAL</h2>
          <p className="text-xs font-mono text-rose-400">HOT LAP ATTACK & RECORD BREAKING</p>
        </div>

        <div className="w-28" />
      </div>

      {/* Center Layout */}
      <div className="max-w-2xl w-full mx-auto glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col gap-6 my-auto">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-zinc-400">ACTIVE TRACK</span>
              <h3 className="font-race font-bold text-2xl text-white">{track.name}</h3>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono uppercase text-zinc-400">WORLD RECORD</span>
            <div className="font-mono-num font-bold text-xl text-amber-400">
              {formatLap(track.recordTime || 145.0)}
            </div>
          </div>
        </div>

        {/* Track selector buttons */}
        <div>
          <span className="text-xs font-race uppercase text-zinc-400 mb-2 block">
            CHOOSE COURSE
          </span>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {tracks.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  soundEngine.playUIClick();
                  setSelectedTrackId(t.id);
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  t.id === track.id
                    ? 'border-rose-500 bg-rose-950/20 text-white'
                    : 'border-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="font-race font-bold text-xs truncate">{t.name}</div>
                <div className="text-[10px] font-mono text-zinc-500">{t.lengthKm} KM</div>
              </button>
            ))}
          </div>
        </div>

        {/* Time Attack Info */}
        <div className="bg-black/40 rounded-2xl p-4 border border-white/5 space-y-2 text-xs font-mono text-zinc-400">
          <div className="flex justify-between">
            <span>MODE:</span>
            <span className="text-white">Solo Clean Track (No Opponents / No Traffic)</span>
          </div>
          <div className="flex justify-between">
            <span>OPTIMAL LINE:</span>
            <span className="text-emerald-400">Apex markers & Brake distance boards</span>
          </div>
          <div className="flex justify-between">
            <span>BONUS:</span>
            <span className="text-amber-400">Earn 5,000 Credits per Personal Best broken</span>
          </div>
        </div>

        {/* Launch Button */}
        <button
          onClick={handleStart}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-white font-race font-bold text-lg flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all cursor-pointer"
        >
          <Play className="w-5 h-5 fill-white" /> START HOT LAP
        </button>
      </div>

      <div className="text-xs font-mono text-zinc-500 text-center">
        Perfect your braking markers and throttle timing without traffic or opponent interference.
      </div>
    </div>
  );
};
