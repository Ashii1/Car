import React from 'react';
import { X, Trophy, Clock, Zap, Flag, Package, ShieldAlert, CheckCircle2, Lock, Play } from 'lucide-react';
import { CityMission, PlayerOpenCityProfile } from '../types/openCity';

interface MissionsModalProps {
  missions: CityMission[];
  playerProfile: PlayerOpenCityProfile;
  onAcceptMission: (mission: CityMission) => void;
  onClose: () => void;
}

export const MissionsModal: React.FC<MissionsModalProps> = ({
  missions,
  playerProfile,
  onAcceptMission,
  onClose,
}) => {
  const getIcon = (type: CityMission['type']) => {
    switch (type) {
      case 'delivery':
        return <Package className="w-5 h-5 text-amber-400" />;
      case 'race':
        return <Flag className="w-5 h-5 text-cyan-400" />;
      case 'mountain':
        return <Clock className="w-5 h-5 text-rose-400" />;
      case 'stunt':
        return <Zap className="w-5 h-5 text-orange-400" />;
      case 'escape':
        return <ShieldAlert className="w-5 h-5 text-red-500" />;
      default:
        return <Trophy className="w-5 h-5 text-yellow-400" />;
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/85 backdrop-blur-md select-none">
      <div className="max-w-2xl w-full max-h-[85vh] glass-panel p-6 rounded-3xl border border-white/20 shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-race font-black text-2xl text-white">CITY CONTRACTS & MISSIONS</h2>
              <span className="text-xs font-mono text-zinc-400">
                CHOOSE MISSIONS TO EARN CASH & UNLOCK NEW DISTRICTS
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl glass-panel border border-white/10 hover:border-red-500 text-zinc-300 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mission List */}
        <div className="flex-1 my-4 space-y-3 overflow-y-auto pr-1">
          {missions.map((m) => {
            const isLocked = playerProfile.level < m.requiredLevel;

            return (
              <div
                key={m.id}
                className={`glass-panel p-4 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  isLocked ? 'border-white/5 opacity-60' : 'border-white/10 hover:border-orange-500/40'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center">
                    {getIcon(m.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 uppercase">
                        {m.district}
                      </span>
                      {m.timeLimit && (
                        <span className="text-[10px] font-mono text-rose-400">
                          {m.timeLimit}s TIME LIMIT
                        </span>
                      )}
                    </div>
                    <h3 className="font-race font-bold text-lg text-white mt-0.5">{m.title}</h3>
                    <p className="text-xs text-zinc-400 max-w-md leading-snug">{m.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                  <div className="text-right text-xs font-mono">
                    <div className="text-amber-300 font-bold text-base leading-tight">
                      +${m.rewardCash.toLocaleString()}
                    </div>
                    <div className="text-cyan-400 text-[10px]">+{m.rewardXp} XP</div>
                  </div>

                  {isLocked ? (
                    <span className="px-3 py-2 rounded-xl bg-zinc-800 text-zinc-500 font-race text-xs flex items-center gap-1.5 border border-white/5">
                      <Lock className="w-3.5 h-3.5" /> LVL {m.requiredLevel}
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        onAcceptMission(m);
                        onClose();
                      }}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white font-race font-bold text-xs uppercase flex items-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" /> ACCEPT
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-xs font-mono text-zinc-500 text-center border-t border-white/10 pt-3">
          Complete street contracts to expand your criminal influence and afford high-end superbikes.
        </div>
      </div>
    </div>
  );
};
