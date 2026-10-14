import React, { useState, useEffect } from 'react';
import { X, Trophy, CheckCircle, Clock, Zap, Flame, ShieldAlert, Map, Compass, Award } from 'lucide-react';
import { dailyChallenges, DailyChallenge } from '../game/DailyChallengesManager';
import { cityAudio } from '../audio/CityAudioEngine';

interface DailyChallengesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaimReward: (cash: number, xp: number) => void;
}

export const DailyChallengesModal: React.FC<DailyChallengesModalProps> = ({
  isOpen,
  onClose,
  onClaimReward,
}) => {
  const [challenges, setChallenges] = useState<DailyChallenge[]>(() =>
    dailyChallenges.getChallenges()
  );
  const [timeLeft, setTimeLeft] = useState<number>(() =>
    dailyChallenges.getTimeRemainingSeconds()
  );

  useEffect(() => {
    if (!isOpen) return;
    const unsub = dailyChallenges.subscribe(() => {
      setChallenges([...dailyChallenges.getChallenges()]);
    });

    const timer = setInterval(() => {
      setTimeLeft(dailyChallenges.getTimeRemainingSeconds());
    }, 1000);

    return () => {
      unsub();
      clearInterval(timer);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const formatCountdown = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Zap':
        return <Zap className="w-5 h-5 text-amber-400" />;
      case 'Flame':
        return <Flame className="w-5 h-5 text-orange-400" />;
      case 'Compass':
        return <Compass className="w-5 h-5 text-cyan-400" />;
      case 'ShieldAlert':
        return <ShieldAlert className="w-5 h-5 text-red-400" />;
      case 'Map':
        return <Map className="w-5 h-5 text-emerald-400" />;
      default:
        return <Trophy className="w-5 h-5 text-amber-400" />;
    }
  };

  const handleClaim = (ch: DailyChallenge) => {
    const reward = dailyChallenges.claimReward(ch.id);
    if (reward) {
      cityAudio.playCashSound();
      onClaimReward(reward.cash, reward.xp);
    }
  };

  const completedCount = challenges.filter((c) => c.completed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg glass-panel border border-amber-500/30 bg-zinc-950/90 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-race font-black text-white tracking-wide flex items-center gap-2">
                DAILY RACING CHALLENGES
              </h2>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Resets in:</span>
                <span className="font-mono-num font-bold text-amber-300">
                  {formatCountdown(timeLeft)}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Daily Progress summary */}
        <div className="my-4 p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-400">Today's Completion</div>
            <div className="text-sm font-race font-bold text-white">
              {completedCount} / 3 Objectives Finished
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  i < completedCount
                    ? 'bg-amber-400 text-black shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                    : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                ✓
              </div>
            ))}
          </div>
        </div>

        {/* Challenge Cards */}
        <div className="space-y-3">
          {challenges.map((ch) => {
            const pct = Math.min(100, Math.round((ch.current / ch.target) * 100));
            return (
              <div
                key={ch.id}
                className={`p-4 rounded-xl border transition-all ${
                  ch.claimed
                    ? 'bg-zinc-900/40 border-white/5 opacity-60'
                    : ch.completed
                    ? 'bg-amber-950/30 border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.15)]'
                    : 'bg-zinc-900/70 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center shrink-0">
                      {getIcon(ch.iconName)}
                    </div>
                    <div>
                      <div className="font-race font-bold text-sm text-white flex items-center gap-2">
                        {ch.title}
                        {ch.completed && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                            DONE
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-400">{ch.description}</div>
                    </div>
                  </div>

                  {/* Reward badges */}
                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono-num font-bold text-emerald-400">
                      +${ch.rewardCash.toLocaleString()}
                    </div>
                    <div className="text-[10px] font-mono-num font-bold text-cyan-400">
                      +{ch.rewardXP} XP
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] mb-1 font-mono-num">
                    <span className="text-zinc-400">
                      {ch.current} / {ch.target} {ch.unit}
                    </span>
                    <span className={ch.completed ? 'text-amber-400 font-bold' : 'text-zinc-500'}>
                      {pct}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        ch.completed
                          ? 'bg-gradient-to-r from-amber-400 to-yellow-300'
                          : 'bg-gradient-to-r from-cyan-500 to-blue-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Claim Button */}
                {ch.completed && !ch.claimed && (
                  <button
                    onClick={() => handleClaim(ch)}
                    className="mt-3 w-full py-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-race font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg active:scale-98 transition-all cursor-pointer"
                  >
                    <Award className="w-4 h-4" />
                    Claim Reward (${ch.rewardCash} • {ch.rewardXP} XP)
                  </button>
                )}

                {ch.claimed && (
                  <div className="mt-2 text-center text-xs font-race text-zinc-500 flex items-center justify-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    Reward Claimed
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-white/10 text-center text-[11px] text-zinc-500">
          New racing challenges generate automatically every 24 hours at midnight.
        </div>
      </div>
    </div>
  );
};
