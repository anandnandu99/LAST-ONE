import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Contestant, MiniGameResult } from '../../types/game';
import { sound } from '../../utils/soundEngine';
import { Sparkles, Timer, RefreshCw } from 'lucide-react';

interface Props {
  activeContestants: Contestant[];
  eliminationCount: number;
  onFinish: (result: MiniGameResult) => void;
}

type ShapeType = 'STAR' | 'HEART' | 'TRIANGLE' | 'MOON' | 'LIGHTNING' | 'SPIRAL';

export const PerfectCut: React.FC<Props> = ({
  activeContestants,
  eliminationCount,
  onFinish,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [shape, setShape] = useState<ShapeType>('STAR');
  const [timeLeft, setTimeLeft] = useState<number>(12);
  const [progress, setProgress] = useState<number>(0);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [mistakes, setMistakes] = useState<number>(0);
  const [completed, setCompleted] = useState<boolean>(false);

  const pathPointsRef = useRef<{ x: number; y: number }[]>([]);
  const visitedPointsRef = useRef<Set<number>>(new Set());

  // Generate reference points for shape
  const generateShapePoints = useCallback((shapeType: ShapeType, width: number, height: number) => {
    const cx = width / 2;
    const cy = height / 2;
    const points: { x: number; y: number }[] = [];
    const count = 120;

    if (shapeType === 'STAR') {
      const rOuter = Math.min(width, height) * 0.38;
      const rInner = rOuter * 0.45;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
        const step = (i / count) * 10;
        const isSpike = Math.floor(step) % 2 === 0;
        const factor = step - Math.floor(step);
        const r = isSpike
          ? rOuter - factor * (rOuter - rInner)
          : rInner + factor * (rOuter - rInner);
        points.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
      }
    } else if (shapeType === 'HEART') {
      const scale = Math.min(width, height) * 0.022;
      for (let i = 0; i < count; i++) {
        const t = (i / count) * Math.PI * 2;
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        points.push({ x: cx + x * scale, y: cy + y * scale + 10 });
      }
    } else if (shapeType === 'TRIANGLE') {
      const size = Math.min(width, height) * 0.4;
      const p1 = { x: cx, y: cy - size };
      const p2 = { x: cx + size * 0.866, y: cy + size * 0.5 };
      const p3 = { x: cx - size * 0.866, y: cy + size * 0.5 };
      const third = count / 3;
      for (let i = 0; i < count; i++) {
        if (i < third) {
          const t = i / third;
          points.push({ x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t });
        } else if (i < third * 2) {
          const t = (i - third) / third;
          points.push({ x: p2.x + (p3.x - p2.x) * t, y: p2.y + (p3.y - p2.y) * t });
        } else {
          const t = (i - third * 2) / third;
          points.push({ x: p3.x + (p1.x - p3.x) * t, y: p3.y + (p1.y - p3.y) * t });
        }
      }
    } else if (shapeType === 'MOON') {
      const r = Math.min(width, height) * 0.35;
      for (let i = 0; i < count; i++) {
        const t = (i / count) * Math.PI * 2;
        if (t <= Math.PI) {
          // outer arc
          const angle = t - Math.PI / 2;
          points.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
        } else {
          // inner crescent
          const angle = Math.PI * 2 - t - Math.PI / 2;
          points.push({ x: cx + (r * 0.6) * Math.cos(angle) + r * 0.4, y: cy + (r * 0.9) * Math.sin(angle) });
        }
      }
    } else if (shapeType === 'LIGHTNING') {
      const s = Math.min(width, height) * 0.38;
      const segs = [
        { x: cx - s * 0.2, y: cy - s },
        { x: cx + s * 0.3, y: cy - s * 0.1 },
        { x: cx - s * 0.05, y: cy - s * 0.1 },
        { x: cx + s * 0.3, y: cy + s },
        { x: cx - s * 0.3, y: cy + s * 0.1 },
        { x: cx + s * 0.05, y: cy + s * 0.1 },
      ];
      for (let i = 0; i < count; i++) {
        const segIdx = Math.floor((i / count) * segs.length);
        const nextIdx = (segIdx + 1) % segs.length;
        const t = ((i / count) * segs.length) % 1;
        const pA = segs[segIdx];
        const pB = segs[nextIdx];
        points.push({ x: pA.x + (pB.x - pA.x) * t, y: pA.y + (pB.y - pA.y) * t });
      }
    } else {
      // SPIRAL
      const rMax = Math.min(width, height) * 0.38;
      for (let i = 0; i < count; i++) {
        const turns = 3;
        const t = (i / count);
        const angle = t * Math.PI * 2 * turns;
        const r = t * rMax;
        points.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
      }
    }

    return points;
  }, []);

  // Initialize random shape on mount
  useEffect(() => {
    const shapes: ShapeType[] = ['STAR', 'HEART', 'TRIANGLE', 'MOON', 'LIGHTNING', 'SPIRAL'];
    const chosen = shapes[Math.floor(Math.random() * shapes.length)];
    setShape(chosen);
  }, []);

  // Redraw Canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Cookie/Disc Base
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const cookieR = Math.min(canvas.width, canvas.height) * 0.45;

    ctx.beginPath();
    ctx.arc(cx, cy, cookieR, 0, Math.PI * 2);
    ctx.fillStyle = '#b45309';
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#78350f';
    ctx.stroke();

    // Cookie texture dots
    ctx.fillStyle = '#92400e';
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2 + i;
      const dist = (cookieR * 0.6) * ((i % 5) / 5);
      ctx.beginPath();
      ctx.arc(cx + dist * Math.cos(angle), cy + dist * Math.sin(angle), 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Shape Guide Outline
    const points = pathPointsRef.current;
    if (points.length > 0) {
      // Background guide slot
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.closePath();
      ctx.lineWidth = 14;
      ctx.strokeStyle = '#451a03';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Carved neon line
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.closePath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#fef08a';
      ctx.stroke();

      // Highlight visited points
      const visited = visitedPointsRef.current;
      visited.forEach((idx) => {
        const pt = points[idx];
        if (pt) {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 7, 0, Math.PI * 2);
          ctx.fillStyle = '#22c55e';
          ctx.fill();
        }
      });
    }
  }, []);

  // Resize and init points
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width || 320;
    canvas.height = rect.width || 320;

    pathPointsRef.current = generateShapePoints(shape, canvas.width, canvas.height);
    visitedPointsRef.current.clear();
    redrawCanvas();
  }, [shape, generateShapePoints, redrawCanvas]);

  // Countdown timer
  useEffect(() => {
    if (completed) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          finishChallenge(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [completed]);

  const checkPointerPosition = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || completed) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const points = pathPointsRef.current;
    if (!points.length) return;

    let nearestDist = Infinity;
    let nearestIdx = -1;

    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      const dist = Math.hypot(pt.x - x, pt.y - y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = i;
      }
    }

    const tolerance = 24; // boundary limit
    if (nearestDist > tolerance) {
      // Off boundary mistake!
      setMistakes((m) => {
        const nextM = m + 1;
        if (nextM >= 4) {
          sound.playBuzzer();
          finishChallenge(false);
        }
        return nextM;
      });
      sound.vibrate(30);
    } else if (nearestIdx !== -1) {
      visitedPointsRef.current.add(nearestIdx);
      const covered = (visitedPointsRef.current.size / points.length) * 100;
      setProgress(Math.min(100, Math.round(covered)));

      if (covered >= 92) {
        setCompleted(true);
        sound.playSuccessChime();
        finishChallenge(true);
      }
    }

    redrawCanvas();
  };

  const finishChallenge = (playerPassed: boolean) => {
    setCompleted(true);

    // Evaluate AI bots according to precision stat
    const botScores = activeContestants
      .filter((c) => !c.isPlayer)
      .map((bot) => {
        const precision = bot.stats.precision;
        const failed = Math.random() * 100 > precision + 15;
        return {
          id: bot.id,
          failed,
          score: precision + (Math.random() * 20 - 10),
        };
      })
      .sort((a, b) => a.score - b.score);

    const eliminatedBotIds: string[] = [];
    botScores.forEach((b) => {
      if (b.failed && eliminatedBotIds.length < eliminationCount) {
        eliminatedBotIds.push(b.id);
      }
    });

    // Fill quota
    let i = 0;
    while (eliminatedBotIds.length < eliminationCount && i < botScores.length) {
      if (!eliminatedBotIds.includes(botScores[i].id)) {
        eliminatedBotIds.push(botScores[i].id);
      }
      i++;
    }

    setTimeout(() => {
      onFinish({
        gameId: 'perfect-cut',
        playerWon: playerPassed,
        lostLife: !playerPassed,
        eliminatedBotIds,
        playerScore: progress,
        accuracyPercent: Math.max(0, 100 - mistakes * 25),
      });
    }, 600);
  };

  return (
    <div
      id="minigame-perfect-cut"
      className="w-full max-w-md mx-auto flex flex-col items-center justify-between p-3 select-none flex-1 min-h-[500px]"
    >
      {/* Top HUD */}
      <div className="w-full flex items-center justify-between bg-zinc-900/90 border border-zinc-800 rounded-2xl px-4 py-2.5 mb-3 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 text-xs font-bold uppercase">Shape: {shape}</span>
          <span className="text-zinc-500">•</span>
          <span className="text-red-400 text-xs font-semibold">Cracks: {mistakes}/3</span>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-base font-black text-amber-400">
          <Timer className="w-4 h-4 text-amber-400" />
          <span>{timeLeft}s</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-zinc-950 rounded-full h-3.5 border border-zinc-800 overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Interactive Tracing Canvas */}
      <div className="relative w-full aspect-square max-w-[320px] flex items-center justify-center">
        <canvas
          ref={canvasRef}
          onPointerDown={(e) => {
            setIsDrawing(true);
            checkPointerPosition(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => {
            if (isDrawing) {
              checkPointerPosition(e.clientX, e.clientY);
            }
          }}
          onPointerUp={() => setIsDrawing(false)}
          onPointerLeave={() => setIsDrawing(false)}
          className="w-full h-full rounded-3xl touch-none cursor-crosshair shadow-2xl border-4 border-amber-950/80 bg-zinc-950"
        />
      </div>

      {/* Footer Instructions */}
      <div className="w-full text-center pt-3">
        <p className="text-zinc-400 text-xs font-medium">
          Trace along the carved groove with your finger or mouse.
        </p>
        <p className="text-amber-400/80 text-[11px] font-bold mt-0.5">
          {progress}% Carved • {3 - mistakes} Cracks left before breaking
        </p>
      </div>
    </div>
  );
};
