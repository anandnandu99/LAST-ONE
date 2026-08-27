import React from 'react';
import { UserProfile, Achievement } from '../../types/game';
import { sound } from '../../utils/soundEngine';
import { Trophy, ArrowLeft, Award, Flame, Skull, Zap, CheckCircle2, Lock } from 'lucide-react';

interface Props {
  userProfile: UserProfile;
  onBack: () => void;
}

export const TrophyRoom: React.FC<Props> = ({ userProfile, onBack }) => {
  const winRate =
    userProfile.totalTournaments > 0
      ? Math.round((userProfile.tournamentsWon / userProfile.totalTournaments) * 100)
      : 0;

  return (
    <div
      id="trophy-room-view"
      className="w-full max-w-lg mx-auto flex flex-col justify-between p-4 select-none min-h-[600px] animate-in fade-in"
    >
      {/* Header */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-zinc-800">
        <button
          onClick={() => {
            sound.playTap();
            onBack();
          }}
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white flex items-center gap-1 text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK</span>
        </button>

        <h2 className="text-lg font-black text-white flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-amber-400" /> TROPHY ROOM & STATS
        </h2>

        <div className="w-8" />
      </div>

      {/* Career Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 my-3">
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3 flex flex-col items-center text-center shadow-md">
          <Trophy className="w-5 h-5 text-amber-400 mb-1" />
          <span className="text-xl font-black text-white">{userProfile.tournamentsWon}</span>
          <span className="text-[10px] text-zinc-400 font-bold uppercase">TOURNAMENTS WON</span>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3 flex flex-col items-center text-center shadow-md">
          <Flame className="w-5 h-5 text-rose-500 mb-1" />
          <span className="text-xl font-black text-white">{userProfile.winStreak}</span>
          <span className="text-[10px] text-zinc-400 font-bold uppercase">CURRENT STREAK</span>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3 flex flex-col items-center text-center shadow-md">
          <Skull className="w-5 h-5 text-red-400 mb-1" />
          <span className="text-xl font-black text-white">{userProfile.totalBotsEliminated}</span>
          <span className="text-[10px] text-zinc-400 font-bold uppercase">BOTS ELIMINATED</span>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3 flex flex-col items-center text-center shadow-md">
          <Award className="w-5 h-5 text-cyan-400 mb-1" />
          <span className="text-xl font-black text-white">{winRate}%</span>
          <span className="text-[10px] text-zinc-400 font-bold uppercase">WIN RATE</span>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3 flex flex-col items-center text-center shadow-md">
          <Zap className="w-5 h-5 text-yellow-400 mb-1" />
          <span className="text-xl font-black text-white">{userProfile.bestReactionTimeMs}ms</span>
          <span className="text-[10px] text-zinc-400 font-bold uppercase">BEST REFLEX</span>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3 flex flex-col items-center text-center shadow-md">
          <span className="text-xl mb-1">🎮</span>
          <span className="text-xl font-black text-white">{userProfile.totalTournaments}</span>
          <span className="text-[10px] text-zinc-400 font-bold uppercase">MATCHES PLAYED</span>
        </div>
      </div>

      {/* Achievements Section */}
      <div className="w-full bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 mb-4 flex-1">
        <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Award className="w-4 h-4" /> TOURNAMENT ACHIEVEMENTS
        </h3>

        <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
          {userProfile.achievements.map((ach) => (
            <div
              key={ach.id}
              className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                ach.unlocked
                  ? 'bg-zinc-900/90 border-amber-500/40 shadow-sm'
                  : 'bg-zinc-950/60 border-zinc-800/60 opacity-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{ach.icon}</div>
                <div>
                  <h4 className="text-xs font-black text-white">{ach.title}</h4>
                  <p className="text-[11px] text-zinc-400">{ach.desc}</p>
                </div>
              </div>

              {ach.unlocked ? (
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> UNLOCKED
                </span>
              ) : (
                <Lock className="w-4 h-4 text-zinc-600" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Back button */}
      <button
        onClick={() => {
          sound.playTap();
          onBack();
        }}
        className="w-full py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-black text-sm border border-zinc-800"
      >
        BACK TO MAIN MENU
      </button>
    </div>
  );
};
