import React, { useState, useEffect, useRef } from 'react';
import { Contestant, MiniGameResult } from '../../types/game';
import { ContestantAvatar } from '../common/ContestantAvatar';
import { sound } from '../../utils/soundEngine';
import { Wind, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';

interface Props {
  activeContestants: Contestant[];
  eliminationCount: number;
  onFinish: (result: MiniGameResult) => void;
}

export const BalanceMaster: React.FC<Props> = ({
  activeContestants,
  eliminationCount,
  onFinish,
}) => {
  const [tiltAngle, setTiltAngle] = useState<number>(0); // -50 to +50 deg
  const [windForce, setWindForce] = useState<number>(0);
  const [survivalTime, setSurvivalTime] = useState<number>(0);
  const [targetDuration] = useState<number>(10); // seconds
  const [hasFallen, setHasFallen] = useState<boolean>(false);

  const angleRef = useRef<number>(0);
  const angularVelocityRef = useRef<number>(0);
  const hasFallenRef = useRef<boolean>(false);
  const playerContestant = activeContestants.find((c) => c.isPlayer) || activeContestants[0];

  useEffect(() => {
    angleRef.current = 0;
    angularVelocityRef.current = 0;
    hasFallenRef.current = false;

    // Gentle wind gust generator
    let currentWind = 0;
    const windInterval = setInterval(() => {
      currentWind = (Math.random() - 0.5) * 0.7;
      setWindForce(currentWind);
    }, 1800);

    // Smooth Physics loop (approx 60fps)
    const startTime = Date.now();
    const loop = setInterval(() => {
      if (hasFallenRef.current) return;

      const elapsedSec = (Date.now() - startTime) / 1000;
      setSurvivalTime(Math.min(targetDuration, elapsedSec));

      if (elapsedSec >= targetDuration) {
        clearInterval(loop);
        clearInterval(windInterval);
        sound.playSuccessChime();
        concludeRound(true);
        return;
      }

      // Physics: smooth gravity + gentle wind + higher damping friction
      angularVelocityRef.current += (angleRef.current * 0.018 + currentWind * 0.12);
      angularVelocityRef.current *= 0.91; // Smooth dampening to prevent violent overshoot
      angleRef.current += angularVelocityRef.current;

      setTiltAngle(angleRef.current);

      if (Math.abs(angleRef.current) >= 48) {
        // Fallen off beam!
        hasFallenRef.current = true;
        setHasFallen(true);
        sound.playBuzzer();
        clearInterval(loop);
        clearInterval(windInterval);
        concludeRound(false);
      }
    }, 30);

    // Keyboard support for desktop players
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        applyLean('LEFT');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        applyLean('RIGHT');
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(loop);
      clearInterval(windInterval);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [targetDuration]);

  const applyLean = (direction: 'LEFT' | 'RIGHT') => {
    if (hasFallenRef.current) return;
    sound.playTap();
    // Gentle counteracting impulse that prevents over-correction
    const impulse = direction === 'LEFT' ? -2.2 : 2.2;
    angularVelocityRef.current += impulse;
  };

  const concludeRound = (playerSurvived: boolean) => {
    // AI bot balance duration calculation
    const botResults = activeContestants
      .filter((c) => !c.isPlayer)
      .map((bot) => {
        const precision = bot.stats.precision;
        const botSurvival = targetDuration * (precision / 100) + (Math.random() * 4 - 2);
        return {
          id: bot.id,
          survival: botSurvival,
          failed: botSurvival < targetDuration * 0.85,
        };
      })
      .sort((a, b) => a.survival - b.survival); // lowest survival first

    const eliminatedBotIds: string[] = [];
    botResults.forEach((b) => {
      if (b.failed && eliminatedBotIds.length < eliminationCount) {
        eliminatedBotIds.push(b.id);
      }
    });

    let i = 0;
    while (eliminatedBotIds.length < eliminationCount && i < botResults.length) {
      if (!eliminatedBotIds.includes(botResults[i].id)) {
        eliminatedBotIds.push(botResults[i].id);
      }
      i++;
    }

    setTimeout(() => {
      onFinish({
        gameId: 'balance-master',
        playerWon: playerSurvived,
        lostLife: !playerSurvived,
        eliminatedBotIds,
        playerScore: Math.round(survivalTime * 10),
        accuracyPercent: playerSurvived ? 100 : Math.round((survivalTime / targetDuration) * 100),
      });
    }, 800);
  };

  return (
    <div
      id="minigame-balance-master"
      className="w-full max-w-md mx-auto flex flex-col items-center justify-between p-3 select-none flex-1 min-h-[500px]"
    >
      {/* Top HUD */}
      <div className="w-full flex items-center justify-between bg-zinc-900/90 border border-zinc-800 rounded-2xl px-4 py-2.5 mb-3 shadow-md">
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-cyan-400" />
          <span className="text-cyan-300 text-xs font-bold uppercase">
            GUST: {windForce > 0.3 ? '➡️ STRONG RIGHT' : windForce < -0.3 ? '⬅️ STRONG LEFT' : 'CALM'}
          </span>
        </div>

        <div className="text-xs font-mono font-bold text-amber-400">
          SURVIVE: {Math.max(0, Math.ceil(targetDuration - survivalTime))}s
        </div>
      </div>

      {/* Tilt Angle Gauge */}
      <div className="w-full bg-zinc-950 rounded-full h-3 border border-zinc-800 relative overflow-hidden mb-4">
        <div
          className="absolute top-0 bottom-0 w-3 bg-amber-400 rounded-full transition-all duration-75"
          style={{ left: `calc(50% + ${(tiltAngle / 45) * 45}%)`, transform: 'translateX(-50%)' }}
        />
        <div className="absolute inset-y-0 left-1/2 w-0.5 bg-emerald-500/50 -translate-x-1/2" />
      </div>

      {/* Physics Beam Simulation Stage */}
      <div className="relative w-full aspect-square max-w-[340px] bg-zinc-950/90 border-2 border-zinc-800 rounded-3xl flex items-center justify-center overflow-hidden shadow-2xl my-auto">
        {/* Fulcrum Base */}
        <div className="absolute bottom-12 w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-b-[50px] border-b-zinc-700" />

        {/* Tilting Beam */}
        <div
          className="absolute bottom-[85px] w-64 h-5 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 rounded-full border-2 border-amber-300 shadow-xl flex items-center justify-center origin-center transition-transform duration-75"
          style={{ transform: `rotate(${tiltAngle}deg)` }}
        >
          {/* Contestant character standing on beam */}
          <div
            className={`absolute -top-14 transition-transform duration-75 ${
              hasFallen ? 'opacity-20 scale-75 translate-y-12' : ''
            }`}
          >
            <ContestantAvatar contestant={playerContestant} size="sm" />
          </div>
        </div>

        {hasFallen && (
          <div className="absolute inset-0 bg-red-950/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in">
            <span className="text-red-400 font-black text-2xl">FELL OFF!</span>
            <span className="text-zinc-300 text-xs mt-1">Balance lost</span>
          </div>
        )}
      </div>

      {/* Control Lean Buttons */}
      <div className="w-full grid grid-cols-2 gap-3 pt-3">
        <button
          id="btn-lean-left"
          disabled={hasFallen}
          onClick={() => applyLean('LEFT')}
          className="py-4 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border-2 border-cyan-500/40 text-cyan-300 font-black text-sm active:scale-95 flex items-center justify-center gap-2 shadow-lg"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>LEAN LEFT</span>
        </button>

        <button
          id="btn-lean-right"
          disabled={hasFallen}
          onClick={() => applyLean('RIGHT')}
          className="py-4 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border-2 border-cyan-500/40 text-cyan-300 font-black text-sm active:scale-95 flex items-center justify-center gap-2 shadow-lg"
        >
          <span>LEAN RIGHT</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
