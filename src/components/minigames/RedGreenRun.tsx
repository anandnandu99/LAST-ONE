import React, { useState, useEffect, useRef } from 'react';
import { Contestant, MiniGameResult } from '../../types/game';
import { ContestantAvatar } from '../common/ContestantAvatar';
import { sound } from '../../utils/soundEngine';
import { Zap, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';

interface Props {
  activeContestants: Contestant[];
  eliminationCount: number;
  onFinish: (result: MiniGameResult) => void;
}

interface RunnerState {
  id: string;
  distance: number; // 0 to 100%
  isEliminated: boolean;
  finished: boolean;
  finishTime: number;
}

export const RedGreenRun: React.FC<Props> = ({
  activeContestants,
  eliminationCount,
  onFinish,
}) => {
  const [lightState, setLightState] = useState<'GREEN' | 'YELLOW_WARNING' | 'RED'>('GREEN');
  const [isHolding, setIsHolding] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(true);
  const [playerLostLife, setPlayerLostLife] = useState<boolean>(false);
  const [screenShake, setScreenShake] = useState<boolean>(false);
  const [signalWarningText, setSignalWarningText] = useState<string>('GREEN LIGHT - SPRINT!');

  // Track runners
  const [runners, setRunners] = useState<Record<string, RunnerState>>(() => {
    const initial: Record<string, RunnerState> = {};
    activeContestants.forEach((c) => {
      initial[c.id] = {
        id: c.id,
        distance: 0,
        isEliminated: false,
        finished: false,
        finishTime: 0,
      };
    });
    return initial;
  });

  const lightRef = useRef<'GREEN' | 'YELLOW_WARNING' | 'RED'>('GREEN');
  const isHoldingRef = useRef<boolean>(false);
  const startTimeRef = useRef<number>(Date.now());
  const intervalRef = useRef<any>(null);
  const redStartTimeRef = useRef<number>(0);

  // Sync refs
  useEffect(() => {
    lightRef.current = lightState;
  }, [lightState]);

  useEffect(() => {
    isHoldingRef.current = isHolding;
  }, [isHolding]);

  // Game Loop
  useEffect(() => {
    startTimeRef.current = Date.now();
    sound.playGreenSignal();

    let nextPhaseChange = Date.now() + 3000 + Math.random() * 1200;

    const runLoop = () => {
      const now = Date.now();

      // Handle Light changes with fairer pacing
      if (now >= nextPhaseChange) {
        if (lightRef.current === 'GREEN') {
          setLightState('YELLOW_WARNING');
          lightRef.current = 'YELLOW_WARNING';
          setSignalWarningText('⚠️ GET READY TO FREEZE!');
          sound.playCountdownTick(true);
          // Generous 1200ms warning window before red
          nextPhaseChange = now + 1200 + Math.random() * 300;
        } else if (lightRef.current === 'YELLOW_WARNING') {
          setLightState('RED');
          lightRef.current = 'RED';
          redStartTimeRef.current = now;
          setSignalWarningText('🛑 RED LIGHT - FREEZE!');
          sound.playRedAlarm();
          // Hold red light for 2000ms - 3000ms
          nextPhaseChange = now + 2000 + Math.random() * 1000;
        } else {
          // Switch back to GREEN
          setLightState('GREEN');
          lightRef.current = 'GREEN';
          setSignalWarningText('🟢 GREEN LIGHT - SPRINT!');
          sound.playGreenSignal();
          // Green light lasts 3000ms - 4500ms
          nextPhaseChange = now + 3000 + Math.random() * 1500;
        }
      }

      // Update positions
      setRunners((prev) => {
        const next = { ...prev };
        let anyEliminated = false;

        Object.keys(next).forEach((cId) => {
          const runner = next[cId];
          if (runner.finished || runner.isEliminated) return;

          const contestant = activeContestants.find((c) => c.id === cId);
          if (!contestant) return;

          if (contestant.isPlayer) {
            // Human player
            if (isHoldingRef.current) {
              // Only penalize if beyond 200ms grace window after turning red
              if (lightRef.current === 'RED' && (Date.now() - redStartTimeRef.current > 200)) {
                // Caught moving on red!
                runner.isEliminated = true;
                anyEliminated = true;
                setPlayerLostLife(true);
                setScreenShake(true);
                sound.playBuzzer();
              } else if (lightRef.current !== 'RED') {
                runner.distance = Math.min(100, runner.distance + 0.75);
                if (runner.distance >= 100) {
                  runner.finished = true;
                  runner.finishTime = Date.now() - startTimeRef.current;
                  sound.playSuccessChime();
                }
              }
            }
          } else {
            // AI Bot logic
            const speedFactor = (contestant.stats.speed / 100) * 0.6;
            const isCautious = contestant.personality === 'careful';

            if (lightRef.current === 'GREEN') {
              // Bots run
              runner.distance = Math.min(100, runner.distance + speedFactor * (0.8 + Math.random() * 0.4));
              if (runner.distance >= 100) {
                runner.finished = true;
                runner.finishTime = Date.now() - startTimeRef.current;
              }
            } else if (lightRef.current === 'YELLOW_WARNING') {
              // Careful bots stop early, others slow down
              if (!isCautious || Math.random() < 0.3) {
                runner.distance = Math.min(100, runner.distance + speedFactor * 0.3);
              }
            } else if (lightRef.current === 'RED') {
              // Bot mistake probability
              let mistakeChance = 0.004;
              if (contestant.personality === 'beginner') mistakeChance = 0.02;
              if (contestant.personality === 'aggressive') mistakeChance = 0.015;
              if (contestant.personality === 'careful') mistakeChance = 0.001;

              if (Math.random() < mistakeChance) {
                runner.isEliminated = true;
                sound.playBuzzer();
              }
            }
          }
        });

        // Check if round should conclude
        const runnerList: RunnerState[] = Object.values(next);
        const playerRunner = runnerList.find(
          (r: RunnerState) => activeContestants.find((c) => c.id === r.id)?.isPlayer
        );

        const finishedCount = runnerList.filter((r: RunnerState) => r.finished).length;
        const remainingBots = runnerList.filter((r: RunnerState) => !r.isEliminated);

        const targetSurvivors = activeContestants.length - eliminationCount;

        // Conclude when enough people finish or player eliminated or max time reached
        if (
          playerRunner?.isEliminated ||
          (finishedCount >= targetSurvivors && playerRunner?.finished) ||
          remainingBots.length <= targetSurvivors ||
          Date.now() - startTimeRef.current > 20000
        ) {
          clearInterval(intervalRef.current);

          setTimeout(() => {
            // Determine eliminated bots
            const sorted: RunnerState[] = [...runnerList].sort((a, b) => {
              if (a.isEliminated && !b.isEliminated) return 1;
              if (!a.isEliminated && b.isEliminated) return -1;
              if (a.finished && !b.finished) return -1;
              if (!a.finished && b.finished) return 1;
              return b.distance - a.distance;
            });

            // Bottom bots eliminated
            const eliminatedIds: string[] = [];
            const botRunners = sorted.filter(
              (r: RunnerState) => !activeContestants.find((c) => c.id === r.id)?.isPlayer
            );

            // Eliminate naturally failed bots first
            botRunners.forEach((r: RunnerState) => {
              if (r.isEliminated && !eliminatedIds.includes(r.id)) {
                eliminatedIds.push(r.id);
              }
            });

            // Fill up remaining required elimination quota if needed
            let idx = botRunners.length - 1;
            while (eliminatedIds.length < eliminationCount && idx >= 0) {
              const targetBot = botRunners[idx];
              if (!eliminatedIds.includes(targetBot.id)) {
                eliminatedIds.push(targetBot.id);
              }
              idx--;
            }

            const playerState = sorted.find(
              (r: RunnerState) => activeContestants.find((c) => c.id === r.id)?.isPlayer
            );

            onFinish({
              gameId: 'red-green',
              playerWon: !playerState?.isEliminated && (playerState?.distance ?? 0) >= 90,
              lostLife: !!playerState?.isEliminated || (playerState?.distance ?? 0) < 50,
              eliminatedBotIds: eliminatedIds,
              playerScore: Math.round(playerState?.distance || 0),
              reactionTimeMs: 250,
              accuracyPercent: 100,
            });
          }, 800);
        }

        return next;
      });
    };

    intervalRef.current = setInterval(runLoop, 40);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [activeContestants, eliminationCount, onFinish]);

  const playerRunner = runners[activeContestants.find((c) => c.isPlayer)?.id || ''];

  return (
    <div
      id="minigame-red-green"
      className={`w-full max-w-lg mx-auto flex flex-col items-center justify-between p-3 select-none flex-1 min-h-[500px] ${
        screenShake ? 'animate-bounce' : ''
      }`}
    >
      {/* Top Giant Signal Light */}
      <div className="w-full flex flex-col items-center mb-3">
        <div
          className={`w-full py-4 px-6 rounded-3xl border-4 transition-all duration-200 shadow-2xl flex flex-col items-center justify-center ${
            lightState === 'GREEN'
              ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300 shadow-emerald-500/40'
              : lightState === 'YELLOW_WARNING'
              ? 'bg-amber-950/90 border-amber-400 text-amber-300 shadow-amber-500/40 animate-pulse'
              : 'bg-rose-950/90 border-rose-500 text-rose-300 shadow-rose-600/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`w-6 h-6 rounded-full ${
                lightState === 'GREEN'
                  ? 'bg-emerald-400 shadow-[0_0_20px_#34d399]'
                  : lightState === 'YELLOW_WARNING'
                  ? 'bg-amber-400 shadow-[0_0_20px_#fbbf24]'
                  : 'bg-rose-500 shadow-[0_0_25px_#f43f5e]'
              }`}
            />
            <span className="text-xl sm:text-2xl font-black tracking-wider uppercase">
              {signalWarningText}
            </span>
          </div>
        </div>
      </div>

      {/* Race Track Canvas/Lane */}
      <div className="w-full bg-zinc-950/90 border-2 border-zinc-800 rounded-3xl p-3 shadow-inner space-y-2 flex-1 flex flex-col justify-center">
        {activeContestants.map((contestant) => {
          const runner = runners[contestant.id] || { distance: 0, isEliminated: false, finished: false };
          return (
            <div
              key={contestant.id}
              className={`relative h-10 rounded-xl px-2 flex items-center border transition-all ${
                contestant.isPlayer
                  ? 'bg-amber-500/10 border-amber-500/40 shadow-sm shadow-amber-500/20'
                  : 'bg-zinc-900/80 border-zinc-800'
              }`}
            >
              {/* Finish line flag at right */}
              <div className="absolute right-3 top-0 bottom-0 flex items-center justify-center text-xs font-mono text-zinc-600 border-l border-dashed border-zinc-700 pl-1">
                🏁
              </div>

              {/* Runner Icon traversing track */}
              <div
                className="absolute transition-all duration-75 flex items-center gap-1.5"
                style={{ left: `${Math.min(88, runner.distance * 0.85)}%` }}
              >
                <ContestantAvatar contestant={contestant} size="sm" showJerseyNumber={false} />
                <span className="text-[10px] font-black text-white px-1 py-0.5 rounded bg-zinc-950/80 border border-zinc-700">
                  {contestant.isPlayer ? 'YOU' : contestant.name}
                </span>
                {runner.finished && (
                  <span className="text-[10px] font-black text-emerald-400 bg-emerald-950 px-1 rounded border border-emerald-500/40">
                    FINISHED!
                  </span>
                )}
                {runner.isEliminated && (
                  <span className="text-[10px] font-black text-red-400 bg-red-950 px-1 rounded border border-red-500/40">
                    OUT!
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Touch/Hold Controller Area */}
      <div className="w-full pt-4">
        <button
          id="btn-run-hold"
          onPointerDown={(e) => {
            e.preventDefault();
            setIsHolding(true);
            sound.playTap();
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            setIsHolding(false);
          }}
          onPointerLeave={() => setIsHolding(false)}
          onKeyDown={(e) => {
            if (e.code === 'Space') {
              setIsHolding(true);
            }
          }}
          onKeyUp={(e) => {
            if (e.code === 'Space') {
              setIsHolding(false);
            }
          }}
          className={`w-full py-6 rounded-3xl font-black text-xl tracking-wider shadow-2xl flex flex-col items-center justify-center gap-1 transition-all select-none active:scale-[0.98] ${
            isHolding
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-emerald-500/40 ring-4 ring-emerald-400/50'
              : 'bg-gradient-to-r from-zinc-800 to-zinc-900 text-zinc-200 border-2 border-zinc-700 hover:border-emerald-500/50'
          }`}
        >
          <div className="flex items-center gap-2">
            <Zap className={`w-6 h-6 ${isHolding ? 'fill-black' : 'text-emerald-400'}`} />
            <span>{isHolding ? 'SPRINTING...' : 'HOLD TO SPRINT'}</span>
          </div>
          <span className="text-xs font-normal opacity-80">
            RELEASE instantly when RED LIGHT flashes!
          </span>
        </button>
      </div>
    </div>
  );
};
