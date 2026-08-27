import React, { useState, useEffect, useRef } from 'react';
import { Contestant, MiniGameResult } from '../../types/game';
import { sound } from '../../utils/soundEngine';
import { Timer, Zap, AlertTriangle } from 'lucide-react';

interface Props {
  activeContestants: Contestant[];
  eliminationCount: number;
  onFinish: (result: MiniGameResult) => void;
}

type ColorName = 'RED' | 'GREEN' | 'BLUE' | 'YELLOW';

const COLOR_DEFS: { name: ColorName; label: string; bgClass: string; textColor: string; hex: string; opposite: ColorName }[] = [
  { name: 'RED', label: '🔴 RED', bgClass: 'bg-red-600 hover:bg-red-500 border-red-400', textColor: '#ef4444', hex: '#ef4444', opposite: 'GREEN' },
  { name: 'GREEN', label: '🟢 GREEN', bgClass: 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400', textColor: '#10b981', hex: '#10b981', opposite: 'RED' },
  { name: 'BLUE', label: '🔵 BLUE', bgClass: 'bg-blue-600 hover:bg-blue-500 border-blue-400', textColor: '#3b82f6', hex: '#3b82f6', opposite: 'YELLOW' },
  { name: 'YELLOW', label: '🟡 YELLOW', bgClass: 'bg-amber-500 hover:bg-amber-400 border-amber-300 text-black', textColor: '#f59e0b', hex: '#f59e0b', opposite: 'BLUE' },
];

export const ColorSwitch: React.FC<Props> = ({
  activeContestants,
  eliminationCount,
  onFinish,
}) => {
  const [roundIndex, setRoundIndex] = useState<number>(0);
  const [totalRounds] = useState<number>(5);
  const [isReverseMode, setIsReverseMode] = useState<boolean>(false);
  const [promptWord, setPromptWord] = useState<ColorName>('RED');
  const [promptDisplayColorHex, setPromptDisplayColorHex] = useState<string>('#ef4444');
  const [targetExpectedColor, setTargetExpectedColor] = useState<ColorName>('RED');
  const [timeRemainingPercent, setTimeRemainingPercent] = useState<number>(100);
  const [score, setScore] = useState<number>(0);
  const [gameFinished, setGameFinished] = useState<boolean>(false);

  const timerRef = useRef<any>(null);
  const roundDurationRef = useRef<number>(2400); // gets faster each round

  const startNextRound = (currentIdx: number) => {
    if (currentIdx >= totalRounds) {
      finishGame(score + 1, true);
      return;
    }

    const reverse = Math.random() < 0.4 && currentIdx >= 2;
    setIsReverseMode(reverse);

    // Pick a word
    const colors: ColorName[] = ['RED', 'GREEN', 'BLUE', 'YELLOW'];
    const word = colors[Math.floor(Math.random() * colors.length)];
    // Pick ink color (may differ for Stroop effect)
    const inkColor = COLOR_DEFS[Math.floor(Math.random() * COLOR_DEFS.length)];

    setPromptWord(word);
    setPromptDisplayColorHex(inkColor.hex);

    // Expected answer:
    // If normal: matches the ink color (or word in some variants; standard Stroop is ink color)
    // If reverse mode: opposite of ink color!
    const baseTarget = inkColor.name;
    const expected = reverse ? COLOR_DEFS.find((c) => c.name === baseTarget)!.opposite : baseTarget;

    setTargetExpectedColor(expected);
    setTimeRemainingPercent(100);

    const speed = Math.max(1200, 2400 - currentIdx * 300);
    roundDurationRef.current = speed;

    const startTime = Date.now();
    clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.max(0, 100 - (elapsed / speed) * 100);
      setTimeRemainingPercent(pct);

      if (pct <= 0) {
        clearInterval(timerRef.current);
        sound.playBuzzer();
        finishGame(score, false);
      }
    }, 25);
  };

  useEffect(() => {
    startNextRound(0);
    return () => clearInterval(timerRef.current);
  }, []);

  const handleColorTap = (tappedColor: ColorName) => {
    if (gameFinished) return;
    clearInterval(timerRef.current);

    if (tappedColor === targetExpectedColor) {
      sound.playTap();
      setScore((s) => s + 1);
      setRoundIndex((r) => {
        const next = r + 1;
        startNextRound(next);
        return next;
      });
    } else {
      sound.playBuzzer();
      finishGame(score, false);
    }
  };

  const finishGame = (finalScore: number, passedAll: boolean) => {
    setGameFinished(true);
    clearInterval(timerRef.current);

    // AI Bots reaction & elimination
    const botScores = activeContestants
      .filter((c) => !c.isPlayer)
      .map((bot) => {
        const speedSkill = bot.stats.speed;
        const failed = Math.random() * 100 > speedSkill + 10;
        return {
          id: bot.id,
          failed,
          score: speedSkill + (Math.random() * 20 - 10),
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

    const won = passedAll || finalScore >= 3;

    if (won) {
      sound.playSuccessChime();
    }

    setTimeout(() => {
      onFinish({
        gameId: 'color-switch',
        playerWon: won,
        lostLife: !won,
        eliminatedBotIds,
        playerScore: finalScore * 20,
        accuracyPercent: Math.round((finalScore / totalRounds) * 100),
      });
    }, 800);
  };

  return (
    <div
      id="minigame-color-switch"
      className="w-full max-w-md mx-auto flex flex-col items-center justify-between p-3 select-none flex-1 min-h-[500px]"
    >
      {/* Top Banner */}
      <div className="w-full flex items-center justify-between bg-zinc-900/90 border border-zinc-800 rounded-2xl px-4 py-2.5 mb-3 shadow-md">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-amber-300 text-xs font-bold uppercase">
            ROUND {roundIndex + 1}/{totalRounds}
          </span>
        </div>

        {isReverseMode ? (
          <span className="bg-purple-950/80 text-purple-300 border border-purple-500/50 px-2 py-0.5 rounded-full text-[11px] font-black animate-pulse flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> REVERSE MODE
          </span>
        ) : (
          <span className="text-zinc-400 text-xs font-bold">MATCH INK COLOR</span>
        )}
      </div>

      {/* Timer Bar */}
      <div className="w-full bg-zinc-950 rounded-full h-3 border border-zinc-800 overflow-hidden mb-4">
        <div
          className={`h-full transition-all duration-75 ${
            timeRemainingPercent > 40 ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'
          }`}
          style={{ width: `${timeRemainingPercent}%` }}
        />
      </div>

      {/* Prompt Card */}
      <div className="w-full bg-zinc-950/90 border-2 border-zinc-800 rounded-3xl p-6 flex flex-col items-center justify-center shadow-2xl my-auto">
        <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
          {isReverseMode ? 'TAP OPPOSITE COLOR OF INK!' : 'TAP THE INK COLOR!'}
        </span>

        {/* Stroop Word Display */}
        <div
          className="text-4xl sm:text-5xl font-black tracking-widest px-6 py-4 rounded-2xl border-2 border-zinc-700/80 bg-zinc-900 shadow-inner"
          style={{ color: promptDisplayColorHex }}
        >
          {promptWord}
        </div>
      </div>

      {/* 4 Colored Control Buttons */}
      <div className="w-full grid grid-cols-2 gap-3 pt-4">
        {COLOR_DEFS.map((color) => (
          <button
            key={color.name}
            id={`btn-color-${color.name.toLowerCase()}`}
            disabled={gameFinished}
            onClick={() => handleColorTap(color.name)}
            className={`py-6 rounded-2xl border-2 font-black text-lg shadow-xl active:scale-95 transition-all text-white flex items-center justify-center ${color.bgClass}`}
          >
            <span>{color.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
