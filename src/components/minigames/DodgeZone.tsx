import React, { useState, useEffect, useRef } from 'react';
import { Contestant, MiniGameResult } from '../../types/game';
import { ContestantAvatar } from '../common/ContestantAvatar';
import { sound } from '../../utils/soundEngine';
import { Shield, Timer, ShieldAlert } from 'lucide-react';

interface Props {
  activeContestants: Contestant[];
  eliminationCount: number;
  onFinish: (result: MiniGameResult) => void;
}

interface DroneOrb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

export const DodgeZone: React.FC<Props> = ({
  activeContestants,
  eliminationCount,
  onFinish,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [playerPos, setPlayerPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [survivalSec, setSurvivalSec] = useState<number>(0);
  const [targetDuration] = useState<number>(14);
  const [hasHit, setHasHit] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const orbsRef = useRef<DroneOrb[]>([]);
  const playerPosRef = useRef<{ x: number; y: number }>({ x: 50, y: 50 });
  const hasHitRef = useRef<boolean>(false);

  const playerContestant = activeContestants.find((c) => c.isPlayer) || activeContestants[0];

  useEffect(() => {
    // Initialize bouncy drone laser orbs
    const orbs: DroneOrb[] = [
      { x: 15, y: 20, vx: 0.8, vy: 0.6, radius: 14, color: '#f43f5e' },
      { x: 80, y: 25, vx: -0.7, vy: 0.9, radius: 12, color: '#38bdf8' },
      { x: 25, y: 80, vx: 0.9, vy: -0.8, radius: 15, color: '#f59e0b' },
      { x: 75, y: 75, vx: -0.6, vy: -0.7, radius: 13, color: '#a855f7' },
    ];
    orbsRef.current = orbs;
    hasHitRef.current = false;

    const startTime = Date.now();

    const loop = setInterval(() => {
      if (hasHitRef.current) return;

      const elapsed = (Date.now() - startTime) / 1000;
      setSurvivalSec(Math.min(targetDuration, elapsed));

      if (elapsed >= targetDuration) {
        clearInterval(loop);
        sound.playSuccessChime();
        concludeRound(true);
        return;
      }

      // Update orbs physics & bounces
      orbsRef.current.forEach((orb) => {
        orb.x += orb.vx;
        orb.y += orb.vy;

        // Bounce boundaries (0 to 100%)
        if (orb.x <= 5 || orb.x >= 95) orb.vx *= -1;
        if (orb.y <= 5 || orb.y >= 95) orb.vy *= -1;

        // Check collision with player
        const dist = Math.hypot(orb.x - playerPosRef.current.x, orb.y - playerPosRef.current.y);
        if (dist < 8) {
          // Hit by laser drone!
          hasHitRef.current = true;
          setHasHit(true);
          sound.playBuzzer();
          clearInterval(loop);
          concludeRound(false);
        }
      });
    }, 30);

    return () => clearInterval(loop);
  }, [targetDuration]);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current || hasHit) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(8, Math.min(92, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(8, Math.min(92, ((e.clientY - rect.top) / rect.height) * 100));

    playerPosRef.current = { x, y };
    setPlayerPos({ x, y });
  };

  const concludeRound = (survived: boolean) => {
    // AI bot dodge skill
    const botResults = activeContestants
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
        gameId: 'dodge-zone',
        playerWon: survived,
        lostLife: !survived,
        eliminatedBotIds,
        playerScore: Math.round(survivalSec * 10),
        accuracyPercent: survived ? 100 : Math.round((survivalSec / targetDuration) * 100),
      });
    }, 800);
  };

  return (
    <div
      id="minigame-dodge-zone"
      className="w-full max-w-md mx-auto flex flex-col items-center justify-between p-3 select-none flex-1 min-h-[500px]"
    >
      {/* Top HUD */}
      <div className="w-full flex items-center justify-between bg-zinc-900/90 border border-zinc-800 rounded-2xl px-4 py-2.5 mb-3 shadow-md">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-300 text-xs font-bold uppercase">
            EVADE ORBS
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400">
          <Timer className="w-4 h-4" />
          <span>{Math.max(0, Math.ceil(targetDuration - survivalSec))}s</span>
        </div>
      </div>

      {/* Dodge Zone Arena */}
      <div
        ref={containerRef}
        onPointerDown={(e) => {
          setIsDragging(true);
          handlePointerMove(e);
        }}
        onPointerMove={(e) => {
          if (isDragging || e.buttons > 0) {
            handlePointerMove(e);
          }
        }}
        onPointerUp={() => setIsDragging(false)}
        className="relative w-full aspect-square max-w-[340px] bg-zinc-950/90 border-2 border-zinc-800 rounded-3xl overflow-hidden shadow-2xl touch-none cursor-grab active:cursor-grabbing my-auto"
      >
        {/* Drone Orbs */}
        {orbsRef.current.map((orb, index) => (
          <div
            key={index}
            style={{
              left: `${orb.x}%`,
              top: `${orb.y}%`,
              width: `${orb.radius * 2}px`,
              height: `${orb.radius * 2}px`,
              backgroundColor: orb.color,
              transform: 'translate(-50%, -50%)',
              boxShadow: `0 0 16px ${orb.color}`,
            }}
            className="absolute rounded-full pointer-events-none animate-pulse"
          />
        ))}

        {/* Player Avatar */}
        <div
          style={{
            left: `${playerPos.x}%`,
            top: `${playerPos.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
          className="absolute pointer-events-none transition-transform duration-75"
        >
          <ContestantAvatar contestant={playerContestant} size="sm" showJerseyNumber={false} />
        </div>

        {hasHit && (
          <div className="absolute inset-0 bg-red-950/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in">
            <span className="text-red-400 font-black text-3xl tracking-widest drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]">
              OUT
            </span>
            <span className="text-zinc-300 text-xs mt-1">Struck by drone orb</span>
          </div>
        )}
      </div>

      {/* Footer Instructions */}
      <div className="w-full text-center pt-3">
        <p className="text-zinc-400 text-xs font-medium">
          Drag your survivor around the arena to dodge incoming laser drone orbs!
        </p>
      </div>
    </div>
  );
};
