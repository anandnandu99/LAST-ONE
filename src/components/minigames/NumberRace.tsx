import React, { useState, useEffect, useRef } from 'react';
import { Contestant, MiniGameResult } from '../../types/game';
import { sound } from '../../utils/soundEngine';
import { Hash, Timer, Check, X } from 'lucide-react';

interface Props {
  activeContestants: Contestant[];
  eliminationCount: number;
  onFinish: (result: MiniGameResult) => void;
}

export const NumberRace: React.FC<Props> = ({
  activeContestants,
  eliminationCount,
  onFinish,
}) => {
  const [phase, setPhase] = useState<'SHOW_TARGET' | 'CHOOSE' | 'RESOLVED'>('SHOW_TARGET');
  const [targetNumber, setTargetNumber] = useState<number>(0);
  const [options, setOptions] = useState<number[]>([]);
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [totalRounds] = useState<number>(3);
  const [timeLeftMs, setTimeLeftMs] = useState<number>(3000);
  const [playerScore, setPlayerScore] = useState<number>(0);

  const timerRef = useRef<any>(null);

  const startRound = (roundIdx: number) => {
    // Generate distinct target number
    const target = Math.floor(Math.random() * 85) + 12;
    setTargetNumber(target);

    // Distractors
    const choices = new Set<number>();
    choices.add(target);

    // Inverted digits e.g. 37 -> 73
    const str = target.toString();
    const inverted = parseInt(str.split('').reverse().join(''), 10);
    if (!isNaN(inverted) && inverted !== target) choices.add(inverted);

    while (choices.size < 6) {
      const rand = target + (Math.floor(Math.random() * 20) - 10);
      if (rand > 0 && rand < 100) {
        choices.add(rand);
      }
    }

    setOptions(Array.from(choices).sort(() => Math.random() - 0.5));
    setPhase('SHOW_TARGET');
    sound.playTap();

    // Show target for 1.2s then prompt selection
    setTimeout(() => {
      setPhase('CHOOSE');
      const timeLimit = Math.max(1800, 3000 - roundIdx * 350);
      const start = Date.now();

      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        const remaining = Math.max(0, timeLimit - (Date.now() - start));
        setTimeLeftMs(remaining);

        if (remaining <= 0) {
          clearInterval(timerRef.current);
          handleChoice(-1); // Timeout failure
        }
      }, 30);
    }, 1200);
  };

  useEffect(() => {
    startRound(0);
    return () => clearInterval(timerRef.current);
  }, []);

  const handleChoice = (selectedNum: number) => {
    clearInterval(timerRef.current);
    const isCorrect = selectedNum === targetNumber;

    if (isCorrect) {
      sound.playSuccessChime();
      const nextScore = playerScore + 1;
      setPlayerScore(nextScore);

      if (roundNumber >= totalRounds) {
        finishGame(nextScore, true);
      } else {
        setRoundNumber((r) => {
          const nextR = r + 1;
          startRound(nextR);
          return nextR;
        });
      }
    } else {
      sound.playBuzzer();
      finishGame(playerScore, false);
    }
  };

  const finishGame = (finalScore: number, passed: boolean) => {
    setPhase('RESOLVED');
    clearInterval(timerRef.current);

    // Evaluate bots
    const botScores = activeContestants
      .filter((c) => !c.isPlayer)
      .map((bot) => {
        const memorySkill = (bot.stats.memory + bot.stats.speed) / 2;
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
        gameId: 'number-race',
        playerWon: passed,
        lostLife: !passed,
        eliminatedBotIds,
        playerScore: finalScore * 30,
        accuracyPercent: passed ? 100 : Math.round((finalScore / totalRounds) * 100),
      });
    }, 800);
  };

  return (
    <div
      id="minigame-number-race"
      className="w-full max-w-md mx-auto flex flex-col items-center justify-between p-3 select-none flex-1 min-h-[500px]"
    >
      {/* Top HUD */}
      <div className="w-full flex items-center justify-between bg-zinc-900/90 border border-zinc-800 rounded-2xl px-4 py-2.5 mb-3 shadow-md">
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-amber-400" />
          <span className="text-amber-300 text-xs font-bold uppercase">
            ROUND {roundNumber}/{totalRounds}
          </span>
        </div>

        <div className="text-xs font-mono font-bold text-zinc-400">
          {phase === 'SHOW_TARGET' ? (
            <span className="text-cyan-400">MEMORIZE!</span>
          ) : (
            <span className="text-emerald-400">{(timeLeftMs / 1000).toFixed(2)}s</span>
          )}
        </div>
      </div>

      {/* Main Flash Stage */}
      <div className="w-full bg-zinc-950/90 border-2 border-zinc-800 rounded-3xl p-6 flex flex-col items-center justify-center shadow-2xl my-auto min-h-[220px]">
        {phase === 'SHOW_TARGET' ? (
          <div className="flex flex-col items-center animate-in zoom-in-95 duration-200">
            <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
              TARGET NUMBER
            </span>
            <div className="text-6xl font-black text-amber-400 font-mono tracking-wider drop-shadow-[0_0_20px_rgba(251,191,36,0.6)]">
              {targetNumber}
            </div>
          </div>
        ) : (
          <div className="w-full">
            <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider block text-center mb-3">
              SELECT THE ORIGINAL NUMBER!
            </span>
            <div className="grid grid-cols-3 gap-2.5">
              {options.map((num, idx) => (
                <button
                  key={idx}
                  id={`btn-num-${num}`}
                  onClick={() => handleChoice(num)}
                  className="py-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border-2 border-zinc-700 hover:border-amber-400 font-mono font-black text-2xl text-white active:scale-95 transition-all shadow-lg"
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Instructions */}
      <div className="w-full text-center pt-3">
        <p className="text-zinc-400 text-xs font-medium">
          {phase === 'SHOW_TARGET'
            ? 'Number will vanish quickly—keep it in mind!'
            : 'Find and tap the target among similar inverted digits.'}
        </p>
      </div>
    </div>
  );
};
