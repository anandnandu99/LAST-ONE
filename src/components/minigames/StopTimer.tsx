import React, { useState, useEffect, useRef } from 'react';
import { Contestant, MiniGameResult } from '../../types/game';
import { sound } from '../../utils/soundEngine';
import { Timer, Play, Pause, Award } from 'lucide-react';

interface Props {
  activeContestants: Contestant[];
  eliminationCount: number;
  onFinish: (result: MiniGameResult) => void;
}

interface ContestantScore {
  id: string;
  name: string;
  isPlayer: boolean;
  stoppedAt: number; // e.g. 5.02
  delta: number; // diff from target
}

export const StopTimer: React.FC<Props> = ({
  activeContestants,
  eliminationCount,
  onFinish,
}) => {
  const [targetTime] = useState<number>(5.0); // 5.00 seconds
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [hasStopped, setHasStopped] = useState<boolean>(false);
  const [leaderboard, setLeaderboard] = useState<ContestantScore[]>([]);

  const startTimestampRef = useRef<number>(Date.now());
  const timerIntervalRef = useRef<any>(null);

  useEffect(() => {
    startTimestampRef.current = Date.now();

    timerIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimestampRef.current) / 1000;
      setCurrentTime(elapsed);

      // Auto stop at 10s if player sleeps
      if (elapsed >= 10.0) {
        clearInterval(timerIntervalRef.current);
        handleStop(elapsed);
      }
    }, 15);

    return () => clearInterval(timerIntervalRef.current);
  }, []);

  const handleStop = (finalTime?: number) => {
    if (hasStopped) return;
    setHasStopped(true);
    setIsRunning(false);
    clearInterval(timerIntervalRef.current);

    sound.playTap();

    const playerStopTime = typeof finalTime === 'number' ? finalTime : (Date.now() - startTimestampRef.current) / 1000;
    const playerDelta = Math.abs(playerStopTime - targetTime);

    // Simulate AI bots stopping near target based on precision & timing
    const results: ContestantScore[] = activeContestants.map((c) => {
      if (c.isPlayer) {
        return {
          id: c.id,
          name: 'YOU',
          isPlayer: true,
          stoppedAt: playerStopTime,
          delta: playerDelta,
        };
      }

      // Bot precision
      const precisionFactor = c.stats.precision / 100;
      const spread = (1 - precisionFactor) * 2.2;
      const botDelta = Math.random() * spread;
      const botStop = targetTime + (Math.random() < 0.5 ? -botDelta : botDelta);

      return {
        id: c.id,
        name: c.name,
        isPlayer: false,
        stoppedAt: Math.max(0.5, botStop),
        delta: Math.abs(botStop - targetTime),
      };
    });

    results.sort((a, b) => a.delta - b.delta);
    setLeaderboard(results);

    // Determine bottom bots to eliminate
    const botRankings = results.filter((r) => !r.isPlayer);
    const eliminatedBotIds: string[] = [];

    let i = botRankings.length - 1;
    while (eliminatedBotIds.length < eliminationCount && i >= 0) {
      eliminatedBotIds.push(botRankings[i].id);
      i--;
    }

    const playerRank = results.findIndex((r) => r.isPlayer);
    const playerPassed = playerRank < results.length - eliminationCount;

    if (playerPassed) {
      sound.playSuccessChime();
    } else {
      sound.playBuzzer();
    }

    setTimeout(() => {
      onFinish({
        gameId: 'stop-timer',
        playerWon: playerPassed,
        lostLife: !playerPassed,
        eliminatedBotIds,
        playerScore: Math.max(0, Math.round(100 - playerDelta * 40)),
        reactionTimeMs: Math.round(playerDelta * 1000),
        accuracyPercent: Math.max(0, Math.round(100 - playerDelta * 20)),
      });
    }, 1800);
  };

  return (
    <div
      id="minigame-stop-timer"
      className="w-full max-w-md mx-auto flex flex-col items-center justify-between p-3 select-none flex-1 min-h-[500px]"
    >
      {/* Top Banner */}
      <div className="w-full flex items-center justify-between bg-zinc-900/90 border border-zinc-800 rounded-2xl px-4 py-2.5 mb-3 shadow-md">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-amber-400" />
          <span className="text-amber-300 text-xs font-bold uppercase">
            TARGET TIME: {targetTime.toFixed(2)}s
          </span>
        </div>

        <div className="text-xs font-mono font-bold text-zinc-400">
          STOP EXACTLY AT 5.00s
        </div>
      </div>

      {/* Giant Chronometer Display */}
      <div className="w-full bg-zinc-950/90 border-2 border-zinc-800 rounded-3xl p-6 flex flex-col items-center justify-center shadow-2xl my-auto">
        <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">
          CHRONOMETER
        </span>
        <div
          className={`font-mono font-black text-6xl tracking-wider ${
            hasStopped ? 'text-amber-400' : 'text-white'
          }`}
        >
          {currentTime.toFixed(2)}s
        </div>

        {hasStopped && (
          <div className="mt-3 bg-zinc-900 px-4 py-1.5 rounded-full border border-zinc-700 text-xs font-bold text-zinc-300">
            Error Delta: ±{Math.abs(currentTime - targetTime).toFixed(2)}s
          </div>
        )}
      </div>

      {/* Leaderboard Reveal */}
      {leaderboard.length > 0 && (
        <div className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3 mb-3 text-left">
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
            RANKINGS (CLOSEST SURVIVE)
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {leaderboard.slice(0, 4).map((entry, idx) => (
              <div
                key={entry.id}
                className={`p-1.5 rounded-lg border flex items-center justify-between ${
                  entry.isPlayer
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-black'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-300'
                }`}
              >
                <span>
                  #{idx + 1} {entry.name}
                </span>
                <span className="font-mono">{entry.stoppedAt.toFixed(2)}s</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Stop Button */}
      <div className="w-full pt-2">
        <button
          id="btn-stop-timer"
          disabled={hasStopped}
          onClick={() => handleStop()}
          className="w-full py-5 rounded-3xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 active:scale-95 disabled:opacity-50 text-white font-black text-xl tracking-wider shadow-xl shadow-rose-950/50 flex items-center justify-center gap-2"
        >
          <Pause className="w-6 h-6 fill-white" />
          <span>STOP CHRONOMETER!</span>
        </button>
      </div>
    </div>
  );
};
