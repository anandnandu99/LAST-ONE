import React, { useState, useEffect, useRef } from 'react';
import { Contestant, MiniGameResult } from '../../types/game';
import { sound } from '../../utils/soundEngine';
import { Shapes, Timer, Zap } from 'lucide-react';

interface Props {
  activeContestants: Contestant[];
  eliminationCount: number;
  onFinish: (result: MiniGameResult) => void;
}

type ShapeGlyph = 'HEXAGON' | 'DIAMOND' | 'OCTAGON' | 'SHIELD' | 'PENTAGRAM' | 'CRESCENT';

interface ShapeCard {
  id: number;
  glyph: ShapeGlyph;
  rotation: number; // 0, 90, 180, 270
  isCorrect: boolean;
}

const GLYPH_PATHS: Record<ShapeGlyph, string> = {
  HEXAGON: 'M50 15 L85 35 L85 65 L50 85 L15 65 L15 35 Z',
  DIAMOND: 'M50 10 L85 50 L50 90 L15 50 Z',
  OCTAGON: 'M30 15 L70 15 L85 30 L85 70 L70 85 L30 85 L15 70 L15 30 Z',
  SHIELD: 'M20 20 L80 20 L80 55 Q50 90 50 90 Q20 55 20 20 Z',
  PENTAGRAM: 'M50 10 L62 38 L92 38 L68 56 L77 86 L50 68 L23 86 L32 56 L8 38 L38 38 Z',
  CRESCENT: 'M50 15 A35 35 0 1 0 85 50 A25 25 0 1 1 50 15 Z',
};

export const ShapeMatch: React.FC<Props> = ({
  activeContestants,
  eliminationCount,
  onFinish,
}) => {
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [totalRounds] = useState<number>(4);
  const [targetShape, setTargetShape] = useState<ShapeGlyph>('HEXAGON');
  const [cards, setCards] = useState<ShapeCard[]>([]);
  const [timeLeftMs, setTimeLeftMs] = useState<number>(3000);
  const [score, setScore] = useState<number>(0);
  const [isDone, setIsDone] = useState<boolean>(false);

  const timerRef = useRef<any>(null);

  const setupRound = (rIndex: number) => {
    const allGlyphs: ShapeGlyph[] = ['HEXAGON', 'DIAMOND', 'OCTAGON', 'SHIELD', 'PENTAGRAM', 'CRESCENT'];
    const chosenTarget = allGlyphs[Math.floor(Math.random() * allGlyphs.length)];
    setTargetShape(chosenTarget);

    const generatedCards: ShapeCard[] = [
      {
        id: 1,
        glyph: chosenTarget,
        rotation: [0, 90, 180, 270][Math.floor(Math.random() * 4)],
        isCorrect: true,
      },
    ];

    // Pick 3 distractors
    const remainingGlyphs = allGlyphs.filter((g) => g !== chosenTarget);
    while (generatedCards.length < 4) {
      const distractor = remainingGlyphs[Math.floor(Math.random() * remainingGlyphs.length)];
      generatedCards.push({
        id: generatedCards.length + 1,
        glyph: distractor,
        rotation: [0, 90, 180, 270][Math.floor(Math.random() * 4)],
        isCorrect: false,
      });
    }

    // Shuffle cards
    setCards(generatedCards.sort(() => Math.random() - 0.5));

    const timeLimit = Math.max(1400, 2800 - rIndex * 350);
    const start = Date.now();

    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, timeLimit - (Date.now() - start));
      setTimeLeftMs(remaining);

      if (remaining <= 0) {
        clearInterval(timerRef.current);
        handleSelect(false);
      }
    }, 25);
  };

  useEffect(() => {
    setupRound(0);
    return () => clearInterval(timerRef.current);
  }, []);

  const handleSelect = (isCorrect: boolean) => {
    if (isDone) return;
    clearInterval(timerRef.current);

    if (isCorrect) {
      sound.playSuccessChime();
      const nextScore = score + 1;
      setScore(nextScore);

      if (currentRound >= totalRounds) {
        finishGame(nextScore, true);
      } else {
        setCurrentRound((r) => {
          const nextR = r + 1;
          setupRound(nextR);
          return nextR;
        });
      }
    } else {
      sound.playBuzzer();
      finishGame(score, false);
    }
  };

  const finishGame = (finalScore: number, passed: boolean) => {
    setIsDone(true);
    clearInterval(timerRef.current);

    // AI bot accuracy check
    const botScores = activeContestants
      .filter((c) => !c.isPlayer)
      .map((bot) => {
        const speedAndPrecision = (bot.stats.speed + bot.stats.precision) / 2;
        const failed = Math.random() * 100 > speedAndPrecision + 10;
        return {
          id: bot.id,
          failed,
          score: speedAndPrecision + (Math.random() * 20 - 10),
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
        gameId: 'shape-match',
        playerWon: passed,
        lostLife: !passed,
        eliminatedBotIds,
        playerScore: finalScore * 25,
        accuracyPercent: passed ? 100 : Math.round((finalScore / totalRounds) * 100),
      });
    }, 800);
  };

  return (
    <div
      id="minigame-shape-match"
      className="w-full max-w-md mx-auto flex flex-col items-center justify-between p-3 select-none flex-1 min-h-[500px]"
    >
      {/* Top Banner */}
      <div className="w-full flex items-center justify-between bg-zinc-900/90 border border-zinc-800 rounded-2xl px-4 py-2.5 mb-3 shadow-md">
        <div className="flex items-center gap-2">
          <Shapes className="w-4 h-4 text-amber-400" />
          <span className="text-amber-300 text-xs font-bold uppercase">
            ROUND {currentRound}/{totalRounds}
          </span>
        </div>

        <div className="text-xs font-mono font-bold text-emerald-400">
          {(timeLeftMs / 1000).toFixed(2)}s
        </div>
      </div>

      {/* Target Glyph Display */}
      <div className="w-full bg-zinc-950/90 border-2 border-zinc-800 rounded-3xl p-5 flex flex-col items-center justify-center shadow-2xl mb-4">
        <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
          TARGET GLYPH
        </span>
        <div className="w-24 h-24 rounded-2xl bg-zinc-900 border-2 border-amber-400/80 flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.25)] p-2">
          <svg viewBox="0 0 100 100" className="w-full h-full text-amber-400 fill-amber-400/20 stroke-amber-400 stroke-[4]">
            <path d={GLYPH_PATHS[targetShape]} />
          </svg>
        </div>
      </div>

      {/* 4 Options Grid */}
      <div className="w-full grid grid-cols-2 gap-3 mb-auto">
        {cards.map((card, idx) => (
          <button
            key={idx}
            id={`btn-glyph-${idx}`}
            disabled={isDone}
            onClick={() => handleSelect(card.isCorrect)}
            className="p-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border-2 border-zinc-700 hover:border-amber-400 active:scale-95 transition-all flex flex-col items-center justify-center shadow-lg"
          >
            <div
              className="w-16 h-16 p-1 transition-transform"
              style={{ transform: `rotate(${card.rotation}deg)` }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full text-cyan-400 fill-cyan-400/20 stroke-cyan-400 stroke-[4]">
                <path d={GLYPH_PATHS[card.glyph]} />
              </svg>
            </div>
          </button>
        ))}
      </div>

      {/* Footer Instructions */}
      <div className="w-full text-center pt-3">
        <p className="text-zinc-400 text-xs font-medium">
          Select the shape matching the master glyph, regardless of rotation angle!
        </p>
      </div>
    </div>
  );
};
