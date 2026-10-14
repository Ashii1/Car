import React, { useState } from 'react';
import { ArrowLeft, Play, Sun, CloudRain, Cloud, Sunset, Moon, Compass, Gauge, AlertTriangle, Car } from 'lucide-react';
import { TrackData, WeatherType, Difficulty, RaceConfig } from '../types/game';
import { soundEngine } from '../audio/SoundEngine';

interface TrackSelectProps {
  tracks: TrackData[];
  onStartRace: (config: RaceConfig) => void;
  onBack: () => void;
}

export const TrackSelect: React.FC<TrackSelectProps> = ({
  tracks,
  onStartRace,
  onBack,
}) => {
  const [selectedTrackId, setSelectedTrackId] = useState<string>(tracks[0].id);
  const selectedTrack = tracks.find((t) => t.id === selectedTrackId) || tracks[0];

  const [weather, setWeather] = useState<WeatherType>(selectedTrack.defaultWeather);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [laps, setLaps] = useState<number>(2);
  const [hasTraffic, setHasTraffic] = useState<boolean>(selectedTrack.trafficEnabled);

  const handleSelectTrack = (track: TrackData) => {
    soundEngine.playUIClick();
    setSelectedTrackId(track.id);
    setWeather(track.defaultWeather);
    setHasTraffic(track.trafficEnabled);
  };

  const handleStart = () => {
    soundEngine.playUIClick();
    onStartRace({
      mode: 'quickRace',
      trackId: selectedTrack.id,
      laps,
      opponentsCount: 5,
      difficulty,
      weather,
      hasTraffic: selectedTrack.trafficEnabled && hasTraffic,
    });
  };

  const weatherOptions: { type: WeatherType; label: string; icon: React.ReactNode }[] = [
    { type: 'sunny', label: 'Clear Sun', icon: <Sun className="w-4 h-4 text-amber-400" /> },
    { type: 'sunset', label: 'Golden Sunset', icon: <Sunset className="w-4 h-4 text-orange-400" /> },
    { type: 'night', label: 'Tokyo Night', icon: <Moon className="w-4 h-4 text-cyan-400" /> },
    { type: 'rain', label: 'Heavy Storm', icon: <CloudRain className="w-4 h-4 text-blue-400" /> },
    { type: 'fog', label: 'Alpine Mist', icon: <Cloud className="w-4 h-4 text-zinc-400" /> },
  ];

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between p-6 md:p-10 bg-[#06080d]/90 backdrop-blur-md select-none overflow-y-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="glass-panel px-4 py-2.5 rounded-xl border border-white/10 hover:border-orange-500 flex items-center gap-2 text-white font-race font-bold transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-orange-400" />
          BACK TO MENU
        </button>

        <div className="text-center">
          <h2 className="font-race font-extrabold text-2xl md:text-3xl text-white">
            SELECT CIRCUIT
          </h2>
          <p className="text-xs font-mono text-zinc-400">CHOOSE YOUR STAGE & CONDITIONS</p>
        </div>

        <div className="w-28" />
      </div>

      {/* Main Track Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 my-6">
        {tracks.map((track) => {
          const isSelected = track.id === selectedTrack.id;
          return (
            <button
              key={track.id}
              onClick={() => handleSelectTrack(track)}
              className={`group relative overflow-hidden rounded-2xl glass-panel border p-5 flex flex-col justify-between text-left transition-all duration-200 cursor-pointer min-h-[220px] ${
                isSelected
                  ? 'border-orange-500 bg-gradient-to-b from-orange-500/20 to-black/80 shadow-[0_0_25px_rgba(249,115,22,0.3)] scale-[1.02]'
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-2">
                  <span className="uppercase">{track.environment}</span>
                  <span
                    className={`font-bold ${
                      track.difficulty === 'Extreme'
                        ? 'text-red-400'
                        : track.difficulty === 'Hard'
                        ? 'text-orange-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {track.difficulty}
                  </span>
                </div>
                <h3 className="font-race font-bold text-lg text-white group-hover:text-orange-400 transition-colors">
                  {track.name}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">{track.subtitle}</p>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono text-zinc-400">
                <span>{track.lengthKm} KM</span>
                <span>{track.turns} TURNS</span>
                {track.trafficEnabled && (
                  <span className="text-amber-400 flex items-center gap-1" title="Highway civilian traffic enabled">
                    <Car className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Setup Options Drawer: Weather, Difficulty, Laps, Traffic, and Launch Button */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Weather Conditions */}
        <div>
          <div className="text-xs font-race uppercase text-zinc-400 mb-2 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-orange-400" /> WEATHER & TIME
          </div>
          <div className="flex flex-wrap gap-2">
            {weatherOptions.map((opt) => (
              <button
                key={opt.type}
                onClick={() => {
                  soundEngine.playUIClick();
                  setWeather(opt.type);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-race font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
                  weather === opt.type
                    ? 'border-orange-500 bg-orange-500/20 text-white shadow-lg'
                    : 'border-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <div className="text-xs font-race uppercase text-zinc-400 mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-yellow-400" /> AI DIFFICULTY
          </div>
          <div className="flex gap-1.5">
            {(['easy', 'normal', 'hard', 'expert'] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => {
                  soundEngine.playUIClick();
                  setDifficulty(d);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                  difficulty === d
                    ? 'bg-orange-500 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Laps */}
        <div>
          <div className="text-xs font-race uppercase text-zinc-400 mb-2 flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-cyan-400" /> LAPS
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 5].map((l) => (
              <button
                key={l}
                onClick={() => {
                  soundEngine.playUIClick();
                  setLaps(l);
                }}
                className={`w-9 h-9 rounded-lg font-mono-num font-bold text-sm transition-all cursor-pointer ${
                  laps === l
                    ? 'bg-cyan-500 text-black shadow-md'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Civilian Highway Traffic Toggle (if available) */}
        {selectedTrack.trafficEnabled && (
          <div>
            <div className="text-xs font-race uppercase text-zinc-400 mb-2 flex items-center gap-1.5">
              <Car className="w-4 h-4 text-amber-400" /> CIVILIAN TRAFFIC
            </div>
            <button
              onClick={() => {
                soundEngine.playUIClick();
                setHasTraffic(!hasTraffic);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-race font-bold cursor-pointer transition-all ${
                hasTraffic ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400 border border-white/10'
              }`}
            >
              {hasTraffic ? 'TRAFFIC ACTIVE' : 'NO TRAFFIC'}
            </button>
          </div>
        )}

        {/* Launch Race CTA */}
        <button
          onClick={handleStart}
          className="w-full md:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 via-red-600 to-amber-500 hover:from-orange-400 hover:to-red-500 text-white font-race font-black text-xl tracking-wider flex items-center justify-center gap-3 shadow-[0_0_35px_rgba(249,115,22,0.4)] active:scale-95 transition-all cursor-pointer"
        >
          <Play className="w-6 h-6 fill-white" />
          START RACE
        </button>
      </div>
    </div>
  );
};
