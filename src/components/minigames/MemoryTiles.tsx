import React, { useState, useEffect } from 'react';
import { Contestant, MiniGameResult } from '../../types/game';
import { sound } from '../../utils/soundEngine';
import { Brain, Eye, Check, AlertCircle } from 'lucide-react';

interface Props {
  activeContestants: Contestant[];
  eliminationCount: number;
  onFinish: (result: MiniGameResult) => void;
}

export const MemoryTiles: React.FC<Props> = ({
  activeContestants,
  eliminationCount,
  onFinish,
}) => {
  const gridSize = 4; // 4x4 = 16 tiles
  const [safePattern, setSafePattern] = useState<number[]>([]);
  const [phase, setPhase] = useState<'MEMORIZE' | 'RECALL' | 'FAILED' | 'SUCCESS'>('MEMORIZE');
  const [revealCountdown, setRevealCountdown] = useState<number>(3);
  const [userTaps, setUserTaps] = useState<number[]>([]);
  const [wrongTile, setWrongTile] = useState<number | null>(null);

  // Generate safe path sequence (5-6 tiles)
  useEffect(() => {
    const patternCount = 5;
    const tiles: number[] = [];
    while (tiles.length < patternCount) {
      const rand = Math.floor(Math.random() * (gridSize * gridSize));
      if (!tiles.includes(rand)) {
        tiles.push(rand);
      }
    }
    setSafePattern(tiles);
    setPhase('MEMORIZE');

    // Memorization countdown
    let remaining = 3;
    const interval = setInterval(() => {
      remaining -= 1;
      setRevealCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        setPhase('RECALL');
        sound.playTap();
      } else {
        sound.playCountdownTick();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleTileClick = (tileIndex: number) => {
    if (phase !== 'RECALL') return;
    if (userTaps.includes(tileIndex)) return;

    sound.playTap();
    const nextExpectedIndex = safePattern[userTaps.length];

    if (tileIndex === nextExpectedIndex) {
      const nextTaps = [...userTaps, tileIndex];
      setUserTaps(nextTaps);

      if (nextTaps.length === safePattern.length) {
        // Complete!
        setPhase('SUCCESS');
        sound.playSuccessChime();
        concludeRound(true);
      }
    } else {
      // Wrong tile stepped on!
      setWrongTile(tileIndex);
      setPhase('FAILED');
      sound.playBuzzer();
      concludeRound(false);
    }
  };

  const concludeRound = (playerPassed: boolean) => {
    // Evaluate AI bot performance based on memory stat
    const botOutcomes = activeContestants
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
    botOutcomes.forEach((b) => {
      if (b.failed && eliminatedBotIds.length < eliminationCount) {
        eliminatedBotIds.push(b.id);
      }
    });

    let idx = 0;
    while (eliminatedBotIds.length < eliminationCount && idx < botOutcomes.length) {
      if (!eliminatedBotIds.includes(botOutcomes[idx].id)) {
        eliminatedBotIds.push(botOutcomes[idx].id);
      }
      idx++;
    }

    setTimeout(() => {
      onFinish({
        gameId: 'memory-tiles',
        playerWon: playerPassed,
        lostLife: !playerPassed,
        eliminatedBotIds,
        playerScore: userTaps.length * 20,
        accuracyPercent: playerPassed ? 100 : Math.round((userTaps.length / safePattern.length) * 100),
      });
    }, 1000);
  };

  return (
    <div
      id="minigame-memory-tiles"
      className="w-full max-w-md mx-auto flex flex-col items-center justify-between p-3 select-none flex-1 min-h-[500px]"
    >
      {/* Top Phase Banner */}
      <div className="w-full flex items-center justify-between bg-zinc-900/90 border border-zinc-800 rounded-2xl px-4 py-2.5 mb-3 shadow-md">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-cyan-400" />
          <span className="text-cyan-300 text-xs font-bold uppercase">
            {phase === 'MEMORIZE' ? 'MEMORIZE THE SAFE TILES' : 'TAP IN ORDER'}
          </span>
        </div>

        <div className="text-xs font-mono font-black">
          {phase === 'MEMORIZE' ? (
            <span className="text-amber-400">HIDING IN {revealCountdown}s</span>
          ) : (
            <span className="text-emerald-400">
              {userTaps.length}/{safePattern.length} TILES
            </span>
          )}
        </div>
      </div>

      {/* 4x4 Tile Matrix */}
      <div className="w-full aspect-square max-w-[340px] grid grid-cols-4 gap-2.5 p-3 bg-zinc-950/90 border-2 border-zinc-800 rounded-3xl shadow-2xl">
        {Array.from({ length: gridSize * gridSize }).map((_, index) => {
          const isSafe = safePattern.includes(index);
          const isTapped = userTaps.includes(index);
          const isWrong = wrongTile === index;
          const orderNum = safePattern.indexOf(index) + 1;

          let tileStyle = 'bg-zinc-900 border-zinc-800 text-zinc-600';

          if (phase === 'MEMORIZE') {
            if (isSafe) {
              tileStyle =
                'bg-emerald-500/30 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.5)] scale-105';
            }
          } else if (phase === 'RECALL' || phase === 'SUCCESS' || phase === 'FAILED') {
            if (isTapped) {
              tileStyle = 'bg-emerald-600 border-emerald-400 text-white shadow-lg';
            } else if (isWrong) {
              tileStyle = 'bg-red-600 border-red-400 text-white animate-shake shadow-lg';
            } else if (phase === 'FAILED' && isSafe) {
              tileStyle = 'bg-emerald-950/40 border-emerald-600/40 text-emerald-500/50';
            }
          }

          return (
            <button
              key={index}
              id={`tile-${index}`}
              disabled={phase !== 'RECALL'}
              onClick={() => handleTileClick(index)}
              className={`rounded-2xl border-2 flex flex-col items-center justify-center font-black text-sm sm:text-base transition-all duration-200 active:scale-90 ${tileStyle}`}
            >
              {phase === 'MEMORIZE' && isSafe && <span>#{orderNum}</span>}
              {isTapped && <Check className="w-5 h-5" />}
              {isWrong && <span className="text-xl">💥</span>}
            </button>
          );
        })}
      </div>

      {/* Footer Instructions */}
      <div className="w-full text-center pt-3">
        <p className="text-zinc-400 text-xs font-medium">
          {phase === 'MEMORIZE'
            ? 'Commit the green sequence to memory before the veil closes!'
            : 'Tap the green safe tiles in the correct chronological sequence.'}
        </p>
      </div>
    </div>
  );
};
