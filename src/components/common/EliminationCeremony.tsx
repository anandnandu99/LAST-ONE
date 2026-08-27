import React, { useEffect, useState } from 'react';
import { Contestant } from '../../types/game';
import { ContestantAvatar } from './ContestantAvatar';
import { sound } from '../../utils/soundEngine';
import { Skull, Trophy, ArrowRight, ShieldCheck, MessageSquare } from 'lucide-react';

interface Props {
  roundNumber?: number;
  allContestants?: Contestant[];
  eliminatedContestants?: Contestant[];
  remainingContestants?: Contestant[];
  eliminatedThisRoundIds?: string[];
  playerSurviving?: boolean;
  isGameOver?: boolean;
  onProceed?: () => void;
  onContinue?: () => void;
}

export const EliminationCeremony: React.FC<Props> = ({
  roundNumber = 1,
  allContestants = [],
  eliminatedContestants = [],
  remainingContestants = [],
  eliminatedThisRoundIds = [],
  playerSurviving = true,
  isGameOver = false,
  onProceed,
  onContinue,
}) => {
  const [stampActive, setStampActive] = useState<boolean>(false);

  useEffect(() => {
    sound.playEliminationSound();
    const timer = setTimeout(() => {
      setStampActive(true);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  const handleNext = onContinue || onProceed || (() => {});

  // Compute eliminated bots
  const eliminatedBots: Contestant[] =
    eliminatedContestants.length > 0
      ? eliminatedContestants
      : allContestants.filter((c) => eliminatedThisRoundIds.includes(c.id));

  // Compute active survivors
  const activeSurvivors: Contestant[] =
    remainingContestants.length > 0
      ? remainingContestants
      : allContestants.filter((c) => c.isAlive);

  // Consolidated all contestants list for roster grid
  const fullRoster: Contestant[] =
    allContestants.length > 0
      ? allContestants
      : [...remainingContestants, ...eliminatedContestants];

  const userSurvived = !isGameOver && playerSurviving;

  return (
    <div
      id="elimination-ceremony-screen"
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none animate-in fade-in duration-300 overflow-y-auto"
    >
      <div className="w-full max-w-lg bg-zinc-950 border-2 border-red-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-red-950/60 flex flex-col items-center text-center my-auto">
        {/* Header Badge */}
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-red-950/80 text-red-400 border border-red-500/50 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
            <Skull className="w-3.5 h-3.5" /> ROUND {roundNumber} ELIMINATIONS
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide mb-1">
          {eliminatedBots.length > 0 ? (
            <span className="text-red-400">{eliminatedBots.length} CONTESTANTS OUT</span>
          ) : (
            <span className="text-emerald-400">ALL SURVIVED!</span>
          )}
        </h2>
        <p className="text-zinc-400 text-xs font-medium mb-5">
          {activeSurvivors.length} contestants advance to the next stage
        </p>

        {/* Eliminated Highlight Card */}
        {eliminatedBots.length > 0 && (
          <div className="w-full bg-red-950/20 border border-red-500/30 rounded-2xl p-3.5 mb-4 text-left">
            <div className="text-[11px] font-black text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>🔻</span> ELIMINATED THIS ROUND
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {eliminatedBots.map((bot) => {
                const quotesList = bot.quotes?.onLose || [];
                const quote =
                  quotesList.length > 0
                    ? quotesList[Math.floor(Math.random() * quotesList.length)]
                    : 'Nooo! Eliminated!';
                return (
                  <div
                    key={bot.id}
                    className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-2.5 flex items-center gap-3 relative overflow-hidden"
                  >
                    <ContestantAvatar contestant={bot} size="sm" showJerseyNumber={false} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-bold text-xs truncate">{bot.name}</span>
                        <span className="text-red-400 font-mono text-[10px]">#{bot.jerseyNumber}</span>
                      </div>
                      <p className="text-zinc-400 text-[11px] italic truncate mt-0.5">
                        "{quote}"
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Remaining Roster Grid */}
        <div className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl p-3.5 mb-5 text-left">
          <div className="text-[11px] font-black text-emerald-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> ACTIVE SURVIVORS ({activeSurvivors.length})
            </span>
            {roundNumber === 3 && <span className="text-amber-400 text-[10px]">FINAL 2 QUALIFIED!</span>}
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 place-items-center">
            {fullRoster.map((contestant) => {
              const isEliminated = !contestant.isAlive || eliminatedBots.some((e) => e.id === contestant.id);
              return (
                <div
                  key={contestant.id}
                  className={`flex flex-col items-center p-1.5 rounded-xl border w-full text-center transition-all ${
                    isEliminated
                      ? 'border-zinc-800/60 bg-zinc-950/40 opacity-40 grayscale'
                      : contestant.isPlayer
                      ? 'border-amber-500/50 bg-amber-500/10 shadow-sm shadow-amber-500/20'
                      : 'border-zinc-700 bg-zinc-900/80'
                  }`}
                >
                  <ContestantAvatar contestant={contestant} size="sm" showJerseyNumber={false} />
                  <span className="text-[10px] font-bold text-white truncate w-full mt-1">
                    {contestant.isPlayer ? 'YOU' : contestant.name}
                  </span>
                  <span
                    className={`text-[9px] font-mono font-bold ${
                      isEliminated ? 'text-red-500' : 'text-emerald-400'
                    }`}
                  >
                    {isEliminated ? 'OUT' : 'SAFE'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <button
          id="btn-elimination-proceed"
          onClick={() => {
            sound.playTap();
            handleNext();
          }}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-black font-black text-base rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
        >
          <span>{userSurvived ? (roundNumber === 3 ? 'PROCEED TO GRAND FINAL' : 'NEXT ROUND') : 'VIEW RESULTS'}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
