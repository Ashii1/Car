import React, { useEffect, useState, useRef } from 'react';
import { Gauge, Sparkles } from 'lucide-react';
import { TrackData } from '../types/game';

interface LoadingScreenProps {
  track: TrackData;
  onLoaded: () => void;
}

const RACING_TIPS = [
  'Brake before the corner, not during it, to maintain maximum front tire grip.',
  'Upgrade your slick tires in the garage to unlock extreme lean angles without sliding.',
  'Slipstream behind competitors to cut aerodynamic drag and trigger high-speed slingshots.',
  'Deploy Nitro coming out of hairpins onto long straights for explosive gear acceleration.',
  'Watch your tachometer needle: shift up right before the redline cut-off for maximum torque.',
  'In wet rain conditions, braking distance increases by 35%—trail brake smoothly into apexes.',
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ track, onLoaded }) => {
  const [progress, setProgress] = useState(0);
  const [tip] = useState(() => RACING_TIPS[Math.floor(Math.random() * RACING_TIPS.length)]);
  const onLoadedRef = useRef(onLoaded);
  onLoadedRef.current = onLoaded;

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => onLoadedRef.current(), 300);
          return 100;
        }
        return prev + 15;
      });
    }, 70);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-between p-8 md:p-14 bg-gradient-to-b from-[#06080d] via-[#090d14] to-[#040508] select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-8 bg-orange-500 rounded-sm" />
          <span className="font-race font-black italic text-3xl text-white">
            RIDE <span className="text-orange-500">X</span>
          </span>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-mono uppercase text-zinc-500">TRACK DESTINATION</span>
          <div className="font-race font-bold text-xl text-white">{track.name}</div>
        </div>
      </div>

      {/* Center Cinematic Feature */}
      <div className="max-w-xl mx-auto text-center flex flex-col items-center">
        <div className="w-20 h-20 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 mb-6 shadow-[0_0_40px_rgba(249,115,22,0.3)] animate-pulse">
          <Gauge className="w-10 h-10" />
        </div>

        <h3 className="font-race font-extrabold text-3xl md:text-4xl text-white tracking-wide mb-2">
          {track.subtitle}
        </h3>
        <p className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-6">
          CIRCUIT LENGTH: {track.lengthKm} KM • {track.turns} TURNS
        </p>

        {/* Tip Box */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 max-w-md w-full">
          <div className="flex items-center gap-2 text-xs font-race text-amber-400 mb-1 justify-center">
            <Sparkles className="w-3.5 h-3.5" /> PRO RIDER TIP
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed font-mono">
            "{tip}"
          </p>
        </div>
      </div>

      {/* Bottom Progress Bar */}
      <div className="w-full max-w-2xl mx-auto">
        <div className="flex justify-between text-xs font-mono mb-2">
          <span className="text-zinc-400">WARMING UP SLICK TIRES & ECU MAPS...</span>
          <span className="text-orange-400 font-bold">{progress}%</span>
        </div>
        <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-cyan-400 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
