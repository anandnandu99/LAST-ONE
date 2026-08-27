import React, { useState, useEffect, useRef } from 'react';
import { Contestant, MiniGameResult } from '../../types/game';
import { ContestantAvatar } from '../common/ContestantAvatar';
import { sound } from '../../utils/soundEngine';
import { Eye, ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';

interface Props {
  activeContestants: Contestant[];
  eliminationCount: number;
  onFinish: (result: MiniGameResult) => void;
}

type MoveAction = 'LEFT' | 'RIGHT' | 'JUMP' | 'CROUCH';

const MOVE_DEFS: { action: MoveAction; label: string; icon: string; bgClass: string }[] = [
  { action: 'LEFT', label: 'LEFT', icon: '⬅️', bgClass: 'from-blue-600 to-cyan-600' },
  { action: 'RIGHT', label: 'RIGHT', icon: '➡️', bgClass: 'from-cyan-600 to-teal-600' },
  { action: 'JUMP', label: 'JUMP', icon: '⬆️', bgClass: 'from-amber-500 to-amber-600' },
  { action: 'CROUCH', label: 'CROUCH', icon: '⬇️', bgClass: 'from-purple-600 to-indigo-600' },
];

export const FollowLeader: React.FC<Props> = ({
  activeContestants,
  eliminationCount,
  onFinish,
}) => {
  const [leaderBot, setLeaderBot] = useState<Contestant>(activeContestants.find((c) => !c.isPlayer) || activeContestants[1]);
  const [sequence, setSequence] = useState<MoveAction[]>([]);
  const [playerTaps, setPlayerTaps] = useState<MoveAction[]>([]);
  const [activeDemonstrationIndex, setActiveDemonstrationIndex] = useState<number | null>(null);
  const [phase, setPhase] = useState<'DEMO' | 'PLAYER_TURN' | 'SUCCESS' | 'FAILED'>('DEMO');
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [totalRounds] = useState<number>(4);

  // Append new action to sequence
  const extendAndPlaySequence = (currentSeq: MoveAction[]) => {
    const actions: MoveAction[] = ['LEFT', 'RIGHT', 'JUMP', 'CROUCH'];
    const nextAction = actions[Math.floor(Math.random() * actions.length)];
    const newSeq = [...currentSeq, nextAction];
    setSequence(newSeq);
    setPlayerTaps([]);
    setPhase('DEMO');

    // Play demo step by step
    let step = 0;
    const interval = setInterval(() => {
      if (step < newSeq.length) {
        setActiveDemonstrationIndex(step);
        sound.playTap();
        step++;
      } else {
        clearInterval(interval);
        setActiveDemonstrationIndex(null);
        setPhase('PLAYER_TURN');
      }
    }, 600);
  };

  useEffect(() => {
    extendAndPlaySequence([]);
  }, []);

  const handlePlayerAction = (action: MoveAction) => {
    if (phase !== 'PLAYER_TURN') return;

    sound.playTap();
    const nextIndex = playerTaps.length;
    const expected = sequence[nextIndex];

    if (action === expected) {
      const nextTaps = [...playerTaps, action];
      setPlayerTaps(nextTaps);

      if (nextTaps.length === sequence.length) {
        // Completed sequence!
        sound.playSuccessChime();

        if (currentRound >= totalRounds) {
          concludeGame(true);
        } else {
          setCurrentRound((r) => r + 1);
          setTimeout(() => {
            extendAndPlaySequence(sequence);
          }, 800);
        }
      }
    } else {
      // Wrong move!
      sound.playBuzzer();
      setPhase('FAILED');
      concludeGame(false);
    }
  };

  const concludeGame = (passed: boolean) => {
    // Evaluate bots memory/imitation
    const botScores = activeContestants
      .filter((c) => !c.isPlayer)
      .map((bot) => {
        const memorySkill = bot.stats.memory;
        const failed = Math.random() * 100 > memorySkill + 10;
        return {
          id: bot.id,
          failed,
          score: memorySkill + (Math.random() * 20 - 10),
        };
      })
      .sort((a, b) => a.score - b.score);

    const eliminatedBotIds: string[] = [];
    botScores.forEach((b) => {
      if (b.failed && eliminatedBotIds.length < eliminationCount) {
        eliminatedBotIds.push(b.id);
      }
    });

    let i = 0;
    while (eliminatedBotIds.length < eliminationCount && i < botScores.length) {
      if (!eliminatedBotIds.includes(botScores[i].id)) {
        eliminatedBotIds.push(botScores[i].id);
      }
      i++;
    }

    setTimeout(() => {
      onFinish({
        gameId: 'follow-leader',
        playerWon: passed,
        lostLife: !passed,
        eliminatedBotIds,
        playerScore: currentRound * 25,
        accuracyPercent: passed ? 100 : Math.round((currentRound / totalRounds) * 100),
      });
    }, 1000);
  };

  return (
    <div
      id="minigame-follow-leader"
      className="w-full max-w-md mx-auto flex flex-col items-center justify-between p-3 select-none flex-1 min-h-[500px]"
    >
      {/* Top Banner */}
      <div className="w-full flex items-center justify-between bg-zinc-900/90 border border-zinc-800 rounded-2xl px-4 py-2.5 mb-3 shadow-md">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-cyan-400" />
          <span className="text-cyan-300 text-xs font-bold uppercase">
            ROUND {currentRound}/{totalRounds}
          </span>
        </div>

        <div className="text-xs font-mono font-bold text-amber-400">
          {phase === 'DEMO' ? 'WATCH THE LEADER...' : `YOUR TURN (${playerTaps.length}/${sequence.length})`}
        </div>
      </div>

      {/* Leader Showcase Stage */}
      <div className="w-full bg-zinc-950/90 border-2 border-zinc-800 rounded-3xl p-5 flex flex-col items-center justify-center shadow-2xl my-auto">
        <ContestantAvatar contestant={leaderBot} size="md" />
        <span className="text-white font-bold text-xs mt-1">LEADER: {leaderBot.name}</span>

        {/* Action Callout Bubble */}
        <div className="mt-4 h-16 flex items-center justify-center">
          {activeDemonstrationIndex !== null ? (
            <div className="bg-amber-500/20 border-2 border-amber-400 text-amber-300 px-6 py-2 rounded-2xl font-black text-xl flex items-center gap-2 animate-bounce">
              <span>{MOVE_DEFS.find((m) => m.action === sequence[activeDemonstrationIndex])?.icon}</span>
              <span>{sequence[activeDemonstrationIndex]}</span>
            </div>
          ) : (
            <div className="text-zinc-500 text-xs font-semibold">
              {phase === 'PLAYER_TURN' ? 'Repeat the dance sequence now!' : 'Observing...'}
            </div>
          )}
        </div>

        {/* Sequence Progress Dots */}
        <div className="flex items-center gap-2 mt-2">
          {sequence.map((_, idx) => (
            <div
              key={idx}
              className={`w-3 h-3 rounded-full border transition-all ${
                idx < playerTaps.length
                  ? 'bg-emerald-400 border-emerald-300 scale-110 shadow-[0_0_8px_#34d399]'
                  : 'bg-zinc-800 border-zinc-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 4 Action Controller Buttons */}
      <div className="w-full grid grid-cols-2 gap-3 pt-3">
        {MOVE_DEFS.map((move) => (
          <button
            key={move.action}
            id={`btn-move-${move.action.toLowerCase()}`}
            disabled={phase !== 'PLAYER_TURN'}
            onClick={() => handlePlayerAction(move.action)}
            className={`py-4 px-4 rounded-2xl bg-gradient-to-r ${move.bgClass} hover:opacity-90 active:scale-95 disabled:opacity-40 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg`}
          >
            <span className="text-lg">{move.icon}</span>
            <span>{move.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
