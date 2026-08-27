import React, { useState, useEffect, useRef } from 'react';
import { Contestant, MiniGameResult } from '../../types/game';
import { sound } from '../../utils/soundEngine';
import { Target, Zap, AlertOctagon } from 'lucide-react';

interface Props {
  activeContestants: Contestant[];
  eliminationCount: number;
  onFinish: (result: MiniGameResult) => void;
}

interface TargetItem {
  id: number;
  x: number; // %
  y: number; // %
  isHazard: boolean;
  spawnTime: number;
  size: number; // px
}

export const QuickTap: React.FC<Props> = ({
  activeContestants,
  eliminationCount,
  onFinish,
}) => {
  const [targetsHit, setTargetsHit] = useState<number>(0);
  const [requiredHits] = useState<number>(8);
  const [currentTarget, setCurrentTarget] = useState<TargetItem | null>(null);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [hasFailed, setHasFailed] = useState<boolean>(false);

  const targetCounterRef = useRef<number>(0);
  const hazardTimerRef = useRef<any>(null);

  const spawnNextTarget = () => {
    if (hazardTimerRef.current) {
      clearTimeout(hazardTimerRef.current);
      hazardTimerRef.current = null;
    }

    if (targetCounterRef.current >= requiredHits) {
      finishGame(reactionTimes, true);
      return;
    }

    const isHazard = Math.random() < 0.28;
    const x = Math.floor(Math.random() * 66) + 17;
    const y = Math.floor(Math.random() * 66) + 17;
    const size = Math.max(54, 75 - targetCounterRef.current * 2.5);

    const newTarget: TargetItem = {
      id: Date.now(),
      x,
      y,
      isHazard,
      spawnTime: Date.now(),
      size,
    };

    setCurrentTarget(newTarget);

    // If it's a hazard decoy, automatically despawn it after 750ms so it doesn't stay idle
    if (isHazard) {
      hazardTimerRef.current = setTimeout(() => {
        setCurrentTarget(null);
        sound.playCountdownTick(false);
        setTimeout(spawnNextTarget, 140);
      }, 750);
    }
  };

  useEffect(() => {
    spawnNextTarget();
    return () => {
      if (hazardTimerRef.current) {
        clearTimeout(hazardTimerRef.current);
      }
    };
  }, []);

  const handleTargetClick = (target: TargetItem) => {
    if (hasFailed) return;

    if (hazardTimerRef.current) {
      clearTimeout(hazardTimerRef.current);
      hazardTimerRef.current = null;
    }

    if (target.isHazard) {
      // Hit a fake skull hazard!
      sound.playBuzzer();
      setHasFailed(true);
      finishGame(reactionTimes, false);
      return;
    }

    const reactMs = Date.now() - target.spawnTime;
    sound.playTap();
    setReactionTimes((prev) => [...prev, reactMs]);
    setTargetsHit((h) => h + 1);
    targetCounterRef.current += 1;

    // Small delay before next target
    setCurrentTarget(null);
    setTimeout(spawnNextTarget, 120);
  };

  const finishGame = (recordedTimes: number[], success: boolean) => {
    const avgReaction =
      recordedTimes.length > 0
        ? Math.round(recordedTimes.reduce((a, b) => a + b, 0) / recordedTimes.length)
        : 500;

    // AI Bots reaction speed simulation
    const botRankings = activeContestants
      .filter((c) => !c.isPlayer)
      .map((bot) => {
        const speed = bot.stats.speed;
        const botReactTime = Math.max(160, 550 - speed * 3.5 + (Math.random() * 80 - 40));
        return {
          id: bot.id,
          reactionMs: botReactTime,
        };
      })
      .sort((a, b) => b.reactionMs - a.reactionMs); // slowest first

    const eliminatedBotIds: string[] = [];
    let i = 0;
    while (eliminatedBotIds.length < eliminationCount && i < botRankings.length) {
      eliminatedBotIds.push(botRankings[i].id);
      i++;
    }

    if (success) {
      sound.playSuccessChime();
    }

    setTimeout(() => {
      onFinish({
        gameId: 'quick-tap',
        playerWon: success,
        lostLife: !success,
        eliminatedBotIds,
        playerScore: targetsHit * 15,
        reactionTimeMs: avgReaction,
        accuracyPercent: success ? 100 : 50,
      });
    }, 600);
  };

  const avgSpeed =
    reactionTimes.length > 0
      ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
      : 0;

  return (
    <div
      id="minigame-quick-tap"
      className="w-full max-w-md mx-auto flex flex-col items-center justify-between p-3 select-none flex-1 min-h-[500px]"
    >
      {/* Top Banner */}
      <div className="w-full flex items-center justify-between bg-zinc-900/90 border border-zinc-800 rounded-2xl px-4 py-2.5 mb-3 shadow-md">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-amber-300 text-xs font-bold uppercase">
            TARGETS: {targetsHit}/{requiredHits}
          </span>
        </div>

        <div className="text-xs font-mono font-bold text-zinc-400">
          AVG REFLEX: <strong className="text-emerald-400">{avgSpeed} ms</strong>
        </div>
      </div>

      {/* Target Arena */}
      <div className="relative w-full aspect-square max-w-[340px] bg-zinc-950/90 border-2 border-zinc-800 rounded-3xl overflow-hidden shadow-2xl my-auto">
        {/* Arena grid aesthetics */}
        <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

        {currentTarget && (
          <button
            id="active-target-btn"
            onClick={() => handleTargetClick(currentTarget)}
            style={{
              left: `${currentTarget.x}%`,
              top: `${currentTarget.y}%`,
              width: `${currentTarget.size}px`,
              height: `${currentTarget.size}px`,
              transform: 'translate(-50%, -50%)',
            }}
            className={`absolute rounded-full border-2 flex items-center justify-center font-black transition-transform active:scale-90 shadow-xl ${
              currentTarget.isHazard
                ? 'bg-rose-600/90 border-rose-400 text-white animate-pulse shadow-rose-500/50'
                : 'bg-gradient-to-r from-amber-400 to-amber-500 border-amber-200 text-black shadow-amber-500/40 animate-bounce'
            }`}
          >
            {currentTarget.isHazard ? (
              <AlertOctagon className="w-6 h-6" />
            ) : (
              <Target className="w-7 h-7" />
            )}
          </button>
        )}
      </div>

      {/* Footer Instructions */}
      <div className="w-full text-center pt-3">
        <p className="text-zinc-400 text-xs font-medium">
          Tap GOLD targets instantly! Avoid RED hazard decoys.
        </p>
      </div>
    </div>
  );
};
