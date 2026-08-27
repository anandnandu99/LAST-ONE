import React, { useEffect, useState } from 'react';
import { MiniGameMeta } from '../../types/game';
import { sound } from '../../utils/soundEngine';
import { Play, Flame, ShieldAlert, Sparkles } from 'lucide-react';

interface Props {
  gameMeta?: MiniGameMeta;
  meta?: MiniGameMeta;
  roundNumber?: number;
  survivorsCount?: number;
  targetSurvivors?: number;
  eliminationCount?: number;
  onStart: () => void;
}

export const HowToPlayModal: React.FC<Props> = ({
  gameMeta,
  meta,
  roundNumber = 1,
  survivorsCount = 8,
  targetSurvivors,
  eliminationCount,
  onStart,
}) => {
  const [countdown, setCountdown] = useState<number>(4);

  const activeMeta = gameMeta || meta || {
    id: 'unknown' as any,
    title: 'Survival Round',
    subtitle: 'Stay focused to survive',
    icon: '⚡',
    instruction: 'Complete the survival objective before time runs out.',
    demoTip: 'React quickly and accurately.',
    category: 'Reflex' as const,
  };

  useEffect(() => {
    sound.playCountdownTick(false);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        sound.playCountdownTick(prev === 2);
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (countdown === 0) {
      sound.playGreenSignal();
      onStart();
    }
  }, [countdown, onStart]);

  const elimCount =
    eliminationCount !== undefined
      ? eliminationCount
      : targetSurvivors !== undefined
      ? Math.max(1, survivorsCount - targetSurvivors)
      : 2;

  return (
    <div
      id="how-to-play-overlay"
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none animate-in fade-in duration-300"
    >
      <div className="w-full max-w-md bg-zinc-950 border-2 border-amber-500/40 rounded-3xl p-6 shadow-2xl shadow-amber-500/10 flex flex-col items-center text-center relative overflow-hidden">
        {/* Top ambient glow */}
        <div className="absolute -top-24 w-60 h-60 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Round Tag */}
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
            {roundNumber === 4 ? '🏆 GRAND FINALE' : `ROUND ${roundNumber}`}
          </span>
          <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold px-3 py-1 rounded-full">
            {elimCount} WILL BE ELIMINATED
          </span>
        </div>

        {/* Game Icon & Title */}
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-3xl shadow-inner mb-3">
          {activeMeta.icon || '⚡'}
        </div>
        <h2 className="text-2xl font-black text-white tracking-wide mb-1">
          {activeMeta.title}
        </h2>
        <p className="text-zinc-400 text-xs font-medium mb-4">
          {activeMeta.subtitle}
        </p>

        {/* Instruction Box */}
        <div className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 text-left mb-4 shadow-inner">
          <div className="text-[11px] font-black text-amber-400 tracking-wider uppercase mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> HOW TO PLAY
          </div>
          <p className="text-zinc-200 text-sm font-semibold leading-relaxed mb-3">
            {activeMeta.instruction}
          </p>

          <div className="bg-zinc-950/60 rounded-xl p-2.5 border border-zinc-800/80 flex items-start gap-2">
            <span className="text-base leading-none">💡</span>
            <p className="text-zinc-400 text-xs font-medium leading-tight">
              {activeMeta.demoTip}
            </p>
          </div>
        </div>

        {/* Countdown / Start Action */}
        <div className="w-full flex items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 bg-zinc-900 px-3 py-2 rounded-2xl border border-zinc-800">
            <span className="text-xs text-zinc-400 font-bold">STARTING IN</span>
            <span className="text-amber-400 font-mono font-black text-lg w-5 text-center">
              {countdown}s
            </span>
          </div>

          <button
            id="btn-skip-howtoplay"
            onClick={() => {
              sound.playTap();
              onStart();
            }}
            className="flex-1 py-3 px-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-black font-black text-sm rounded-2xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all"
          >
            <Play className="w-4 h-4 fill-black" />
            <span>PLAY NOW</span>
          </button>
        </div>
      </div>
    </div>
  );
};
