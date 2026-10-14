import React, { useState, useEffect } from 'react';
import { Users, Heart, Flame, Sparkles, Radio } from 'lucide-react';

interface StreamerLiveOverlayProps {
  isActive: boolean;
  playerSpeed: number;
  isStuntActive: boolean;
  stuntScore: number;
}

interface ChatComment {
  id: number;
  user: string;
  badge: string;
  badgeColor: string;
  text: string;
}

const SAMPLE_COMMENTS = [
  { user: 'CyberGamer99', badge: 'VIP', badgeColor: 'bg-amber-500', text: 'SHEEEESH THAT ACCELERATION!! 🔥' },
  { user: 'BobaBreeze', badge: 'SUB', badgeColor: 'bg-pink-500', text: 'Bro is driving at 250 km/h?! 🚀' },
  { user: 'KaiCenatFan', badge: 'MOD', badgeColor: 'bg-emerald-500', text: 'W DRIVER IN THE CHAT W W W' },
  { user: 'SpeedDemon_X', badge: 'SUB', badgeColor: 'bg-cyan-500', text: 'CLEANEST DRIFT EVER!! 💯' },
  { user: 'AeroGliderKid', badge: 'SUB', badgeColor: 'bg-purple-500', text: 'Bro is cooking fr fr! Look at that drone follow!' },
  { user: 'NeonVibes', badge: 'VIP', badgeColor: 'bg-amber-500', text: 'CLIP THAT RIGHT NOW OMG' },
  { user: 'PrimeEnergyFan', badge: 'SUB', badgeColor: 'bg-blue-500', text: 'Prime Nitro activated!! Hyperspeed!! ⚡' },
  { user: 'CityStunter01', badge: 'SUB', badgeColor: 'bg-pink-500', text: 'THAT JUMP WAS INSANE 10/10' },
  { user: 'HypeMaster', badge: 'MOD', badgeColor: 'bg-emerald-500', text: 'Hit the ramp on the bridge next!!' },
];

export const StreamerLiveOverlay: React.FC<StreamerLiveOverlayProps> = ({
  isActive,
  playerSpeed,
  isStuntActive,
  stuntScore,
}) => {
  if (!isActive) return null;

  const [comments, setComments] = useState<ChatComment[]>([]);
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string; left: number }[]>([]);
  
  // Base viewers calculate from player speed and stunt status
  const speedInt = Math.abs(Math.round(playerSpeed));
  const baseViewers = 35000 + speedInt * 420 + (isStuntActive ? 85000 : 0);
  const formattedViewers = (baseViewers / 1000).toFixed(1) + 'K';

  // Add simulated comments every 1.8 - 3.5 seconds
  useEffect(() => {
    let nextId = 0;
    const interval = setInterval(() => {
      const template = SAMPLE_COMMENTS[Math.floor(Math.random() * SAMPLE_COMMENTS.length)];
      setComments((prev) => {
        const next = [...prev, { ...template, id: nextId++ }];
        return next.slice(-4); // Keep last 4 comments
      });

      // Add floating emoji
      const emojis = ['🔥', '❤️', '🚀', '💯', '⚡', '✨'];
      const chosenEmoji = emojis[Math.floor(Math.random() * emojis.length)];
      setFloatingEmojis((prev) => [
        ...prev.slice(-8),
        { id: nextId++, emoji: chosenEmoji, left: 10 + Math.random() * 80 },
      ]);
    }, isStuntActive || speedInt > 180 ? 1200 : 2200);

    return () => clearInterval(interval);
  }, [isStuntActive, speedInt]);

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden select-none">
      {/* Top Left Live Streamer Ticker */}
      <div className="absolute top-20 left-4 md:left-8 flex flex-col gap-2">
        <div className="flex items-center gap-2 glass-panel bg-black/70 border border-red-500/40 px-3 py-1.5 rounded-full shadow-lg shadow-red-500/20">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <span className="font-race font-black text-xs text-red-400 tracking-wider">LIVE</span>
          <span className="w-px h-3 bg-white/20" />
          <div className="flex items-center gap-1.5 text-white font-mono text-xs font-bold">
            <Users className="w-3.5 h-3.5 text-zinc-400" />
            <span>{formattedViewers}</span>
          </div>
        </div>

        {/* Stunt Hype Surge Notice */}
        {isStuntActive && (
          <div className="flex items-center gap-1.5 glass-panel bg-gradient-to-r from-pink-500/40 to-cyan-500/40 border border-pink-400/60 px-3 py-1 rounded-xl animate-bounce">
            <Flame className="w-4 h-4 text-pink-300" />
            <span className="text-[11px] font-race font-bold text-white tracking-wide">
              HYPE SURGE! +{stuntScore} PTS
            </span>
          </div>
        )}
      </div>

      {/* Floating Reactions Emojis */}
      <div className="absolute bottom-36 right-8 w-20 h-44 overflow-hidden pointer-events-none">
        {floatingEmojis.map((e) => (
          <div
            key={e.id}
            className="absolute bottom-0 text-xl animate-floatUp"
            style={{ left: `${e.left}%` }}
          >
            {e.emoji}
          </div>
        ))}
      </div>

      {/* Lower Right Simulated Live Stream Chat Box */}
      <div className="absolute bottom-28 right-4 md:right-8 max-w-[260px] md:max-w-[300px] flex flex-col gap-1.5">
        <div className="text-[10px] font-mono uppercase text-zinc-400 flex items-center gap-1 px-1">
          <Radio className="w-3 h-3 text-pink-400 animate-pulse" />
          <span>VIRAL STREAM CHAT</span>
        </div>

        {comments.map((c) => (
          <div
            key={c.id}
            className="glass-panel bg-black/60 border border-white/10 px-2.5 py-1.5 rounded-xl text-xs flex flex-wrap items-center gap-1.5 animate-slideUp shadow-md"
          >
            <span className={`text-[9px] font-bold font-mono px-1 py-0.2 rounded text-black ${c.badgeColor}`}>
              {c.badge}
            </span>
            <span className="font-mono text-zinc-300 text-[11px] font-bold">{c.user}:</span>
            <span className="text-white text-[11px] leading-tight font-medium">{c.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
