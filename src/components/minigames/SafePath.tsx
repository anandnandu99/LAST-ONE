import React, { useState, useEffect } from 'react';
import { Contestant, MiniGameResult } from '../../types/game';
import { ContestantAvatar } from '../common/ContestantAvatar';
import { sound } from '../../utils/soundEngine';
import { Footprints, ArrowLeft, ArrowRight, ShieldCheck, Skull } from 'lucide-react';

interface Props {
  activeContestants: Contestant[];
  eliminationCount: number;
  onFinish: (result: MiniGameResult) => void;
}

interface StepChoice {
  row: number;
  safeSide: 'LEFT' | 'RIGHT';
  revealedSide?: 'LEFT' | 'RIGHT';
  shatteredSide?: 'LEFT' | 'RIGHT';
}

export const SafePath: React.FC<Props> = ({
  activeContestants,
  eliminationCount,
  onFinish,
}) => {
  const totalRows = 5;
  const [currentRow, setCurrentRow] = useState<number>(0);
  const [pathConfig, setPathConfig] = useState<StepChoice[]>([]);
  const [eliminatedBotIds, setEliminatedBotIds] = useState<string[]>([]);
  const [playerFell, setPlayerFell] = useState<boolean>(false);
  const [botTurnsLog, setBotTurnsLog] = useState<string[]>([]);

  // Generate safe path (LEFT vs RIGHT)
  useEffect(() => {
    const config: StepChoice[] = [];
    for (let r = 0; r < totalRows; r++) {
      config.push({
        row: r,
        safeSide: Math.random() < 0.5 ? 'LEFT' : 'RIGHT',
      });
    }
    setPathConfig(config);

    // Simulate leading bot actions on earlier steps
    const bots = activeContestants.filter((c) => !c.isPlayer);
    const logs: string[] = [];
    const deadBots: string[] = [];

    // Pre-simulate 1-2 bot attempts on step 0
    if (bots.length > 0) {
      const firstBot = bots[0];
      const botGuess = Math.random() < 0.5 ? 'LEFT' : 'RIGHT';
      const safe = config[0].safeSide;
      if (botGuess === safe) {
        config[0].revealedSide = safe;
        logs.push(`${firstBot.name} jumped ${botGuess} and SURVIVED!`);
      } else {
        config[0].shatteredSide = botGuess;
        config[0].revealedSide = safe; // player now knows the other side is safe!
        deadBots.push(firstBot.id);
        logs.push(`${firstBot.name} jumped ${botGuess} and FELL through the glass!`);
      }
    }

    setBotTurnsLog(logs);
    setEliminatedBotIds(deadBots);
  }, [activeContestants, totalRows]);

  const handleStep = (side: 'LEFT' | 'RIGHT') => {
    if (currentRow >= totalRows || playerFell) return;

    sound.playTap();
    const currentStep = pathConfig[currentRow];
    const isSafe = side === currentStep.safeSide;

    const updated = [...pathConfig];
    if (isSafe) {
      updated[currentRow].revealedSide = side;
      setPathConfig(updated);
      sound.playSuccessChime();

      if (currentRow + 1 >= totalRows) {
        // Player successfully crossed!
        concludeGame(true, updated);
      } else {
        setCurrentRow((r) => r + 1);
      }
    } else {
      // Step failed!
      updated[currentRow].shatteredSide = side;
      setPathConfig(updated);
      setPlayerFell(true);
      sound.playBuzzer();
      concludeGame(false, updated);
    }
  };

  const concludeGame = (playerPassed: boolean, currentPath: StepChoice[]) => {
    // Fill up remaining eliminations if needed
    const remainingBots = activeContestants.filter((c) => !c.isPlayer);
    const finalEliminated = [...eliminatedBotIds];

    let i = 0;
    while (finalEliminated.length < eliminationCount && i < remainingBots.length) {
      if (!finalEliminated.includes(remainingBots[i].id)) {
        finalEliminated.push(remainingBots[i].id);
      }
      i++;
    }

    setTimeout(() => {
      onFinish({
        gameId: 'safe-path',
        playerWon: playerPassed,
        lostLife: !playerPassed,
        eliminatedBotIds: finalEliminated,
        playerScore: playerPassed ? 100 : currentRow * 20,
        accuracyPercent: playerPassed ? 100 : Math.round((currentRow / totalRows) * 100),
      });
    }, 1200);
  };

  return (
    <div
      id="minigame-safe-path"
      className="w-full max-w-md mx-auto flex flex-col items-center justify-between p-3 select-none flex-1 min-h-[500px]"
    >
      {/* Top Banner */}
      <div className="w-full flex items-center justify-between bg-zinc-900/90 border border-zinc-800 rounded-2xl px-4 py-2.5 mb-2 shadow-md">
        <div className="flex items-center gap-2">
          <Footprints className="w-4 h-4 text-cyan-400" />
          <span className="text-cyan-300 text-xs font-bold uppercase">
            STEP {Math.min(totalRows, currentRow + 1)} / {totalRows}
          </span>
        </div>
        <span className="text-amber-400 text-xs font-mono font-bold">
          {playerFell ? 'FELL THROUGH!' : 'CHOOSE SAFE TILE'}
        </span>
      </div>

      {/* Bot Intel ticker */}
      {botTurnsLog.length > 0 && (
        <div className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 py-1.5 mb-2 text-left">
          <p className="text-[11px] text-zinc-300 font-medium">
            💡 <strong className="text-amber-400">Intel:</strong> {botTurnsLog[0]}
          </p>
        </div>
      )}

      {/* Glass Bridge Perspective Ladder */}
      <div className="w-full bg-zinc-950/90 border-2 border-zinc-800 rounded-3xl p-3 shadow-2xl flex flex-col-reverse gap-2 my-auto">
        {pathConfig.map((step) => {
          const isCurrent = step.row === currentRow;
          const isPassed = step.row < currentRow;

          return (
            <div
              key={step.row}
              className={`flex items-center justify-between gap-3 p-1.5 rounded-2xl transition-all ${
                isCurrent ? 'bg-amber-500/10 border border-amber-500/40' : 'bg-zinc-900/40'
              }`}
            >
              {/* Left Tile */}
              <div
                className={`flex-1 h-12 rounded-xl border-2 flex items-center justify-center font-black text-xs transition-all ${
                  step.revealedSide === 'LEFT'
                    ? 'bg-emerald-600/90 border-emerald-400 text-white shadow-md'
                    : step.shatteredSide === 'LEFT'
                    ? 'bg-red-950/60 border-red-500 text-red-400 line-through'
                    : isCurrent
                    ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300 shadow-sm'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-600'
                }`}
              >
                {step.revealedSide === 'LEFT' && 'SAFE 🟢'}
                {step.shatteredSide === 'LEFT' && 'BROKEN 💥'}
                {!step.revealedSide && !step.shatteredSide && 'LEFT'}
              </div>

              {/* Step Marker */}
              <div className="text-[10px] font-mono font-bold text-zinc-500 w-6 text-center">
                #{step.row + 1}
              </div>

              {/* Right Tile */}
              <div
                className={`flex-1 h-12 rounded-xl border-2 flex items-center justify-center font-black text-xs transition-all ${
                  step.revealedSide === 'RIGHT'
                    ? 'bg-emerald-600/90 border-emerald-400 text-white shadow-md'
                    : step.shatteredSide === 'RIGHT'
                    ? 'bg-red-950/60 border-red-500 text-red-400 line-through'
                    : isCurrent
                    ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300 shadow-sm'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-600'
                }`}
              >
                {step.revealedSide === 'RIGHT' && 'SAFE 🟢'}
                {step.shatteredSide === 'RIGHT' && 'BROKEN 💥'}
                {!step.revealedSide && !step.shatteredSide && 'RIGHT'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Control Buttons (LEFT / RIGHT) */}
      <div className="w-full grid grid-cols-2 gap-3 pt-3">
        <button
          id="btn-step-left"
          disabled={playerFell || currentRow >= totalRows}
          onClick={() => handleStep('LEFT')}
          className="py-4 px-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:scale-95 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>JUMP LEFT</span>
        </button>

        <button
          id="btn-step-right"
          disabled={playerFell || currentRow >= totalRows}
          onClick={() => handleStep('RIGHT')}
          className="py-4 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 active:scale-95 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50"
        >
          <span>JUMP RIGHT</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
