import React, { useEffect } from 'react';
import { UserProfile, Achievement } from '../../types/game';
import { sound } from '../../utils/soundEngine';
import { Trophy, Skull, Flame, ArrowRight, RotateCcw, Home, Sparkles, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  wonTournament: boolean;
  finalPosition: number;
  botsDefeated: number;
  roundsSurvived: number;
  coinsEarned: number;
  xpEarned: number;
  leveledUp: boolean;
  newAchievements: Achievement[];
  userProfile: UserProfile;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export const ResultsScreen: React.FC<Props> = ({
  wonTournament,
  finalPosition,
  botsDefeated,
  roundsSurvived,
  coinsEarned,
  xpEarned,
  leveledUp,
  newAchievements,
  userProfile,
  onPlayAgain,
  onMainMenu,
}) => {
  useEffect(() => {
    if (wonTournament) {
      sound.playVictoryFanfare();
      try {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.5 },
        });
      } catch {}
    } else {
      sound.playEliminationSound();
    }
  }, [wonTournament]);

  const xpProgressPercent = Math.min(
    100,
    Math.round((userProfile.xp / userProfile.xpToNextLevel) * 100)
  );

  return (
    <div
      id="results-screen"
      className="w-full max-w-lg mx-auto flex flex-col justify-between p-4 select-none min-h-[600px] animate-in fade-in"
    >
      {/* Top Banner Outcome */}
      <div className="w-full text-center pt-2 pb-3">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-zinc-950 border-2 border-zinc-800 shadow-2xl mb-3">
          <span className="text-4xl">{wonTournament ? '🏆' : '💀'}</span>
        </div>

        <h1
          className={`text-3xl sm:text-4xl font-black tracking-wider ${
            wonTournament
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 drop-shadow-[0_0_25px_rgba(251,191,36,0.4)]'
              : 'text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.4)]'
          }`}
        >
          {wonTournament ? 'THE LAST ONE!' : 'ELIMINATED!'}
        </h1>
        <p className="text-zinc-400 text-xs font-semibold mt-1">
          {wonTournament
            ? 'You outlasted all 7 AI contestants and won the championship!'
            : `Knocked out in Round ${roundsSurvived}. Better luck next tournament!`}
        </p>
      </div>

      {/* Stats Summary Card */}
      <div className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-4 my-auto">
        {/* Core Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-zinc-900/80 rounded-2xl p-2.5 border border-zinc-800">
            <span className="text-[10px] font-bold text-zinc-400 uppercase block">FINAL RANK</span>
            <span
              className={`font-mono font-black text-xl ${
                finalPosition === 1 ? 'text-amber-400' : 'text-zinc-200'
              }`}
            >
              #{finalPosition}
            </span>
          </div>

          <div className="bg-zinc-900/80 rounded-2xl p-2.5 border border-zinc-800">
            <span className="text-[10px] font-bold text-zinc-400 uppercase block">BOTS OUT</span>
            <span className="font-mono font-black text-xl text-red-400">
              {botsDefeated}
            </span>
          </div>

          <div className="bg-zinc-900/80 rounded-2xl p-2.5 border border-zinc-800">
            <span className="text-[10px] font-bold text-zinc-400 uppercase block">ROUNDS</span>
            <span className="font-mono font-black text-xl text-cyan-400">
              {roundsSurvived}/4
            </span>
          </div>
        </div>

        {/* Rewards Breakdown */}
        <div className="bg-zinc-900/90 rounded-2xl p-4 border border-zinc-800 flex items-center justify-around">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🪙</span>
            <div>
              <span className="text-amber-400 font-black text-lg">+{coinsEarned}</span>
              <span className="text-[10px] text-zinc-400 font-bold block">COINS REWARD</span>
            </div>
          </div>

          <div className="h-8 w-px bg-zinc-800" />

          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <div>
              <span className="text-cyan-400 font-black text-lg">+{xpEarned}</span>
              <span className="text-[10px] text-zinc-400 font-bold block">XP EARNED</span>
            </div>
          </div>
        </div>

        {/* XP Level Progress Bar */}
        <div className="bg-zinc-900/50 rounded-2xl p-3 border border-zinc-800/80">
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <span className="text-white flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> LEVEL {userProfile.level}
            </span>
            <span className="text-zinc-400 font-mono text-[11px]">
              {userProfile.xp} / {userProfile.xpToNextLevel} XP
            </span>
          </div>
          <div className="w-full bg-zinc-950 rounded-full h-2.5 border border-zinc-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
              style={{ width: `${xpProgressPercent}%` }}
            />
          </div>
          {leveledUp && (
            <span className="text-[11px] font-black text-emerald-400 block text-center mt-1.5 animate-bounce">
              🎉 LEVEL UP! YOU REACHED LEVEL {userProfile.level}!
            </span>
          )}
        </div>

        {/* New Achievements Popup */}
        {newAchievements.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-3 text-left">
            <div className="text-[11px] font-black text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> NEW ACHIEVEMENT UNLOCKED!
            </div>
            <div className="text-xs font-bold text-white">
              {newAchievements[0].icon} {newAchievements[0].title} — {newAchievements[0].desc}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="w-full space-y-2.5 pt-3">
        <button
          id="btn-results-playagain"
          onClick={() => {
            sound.playTap();
            onPlayAgain();
          }}
          className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-black font-black text-base rounded-2xl shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all"
        >
          <RotateCcw className="w-5 h-5" />
          <span>PLAY AGAIN</span>
        </button>

        <button
          id="btn-results-mainmenu"
          onClick={() => {
            sound.playTap();
            onMainMenu();
          }}
          className="w-full py-3.5 px-6 bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-zinc-300 font-bold text-sm rounded-2xl border border-zinc-800 flex items-center justify-center gap-2 transition-all"
        >
          <Home className="w-4 h-4" />
          <span>MAIN MENU</span>
        </button>
      </div>
    </div>
  );
};
