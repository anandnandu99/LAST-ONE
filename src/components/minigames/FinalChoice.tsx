import React, { useState, useEffect, useRef } from 'react';
import { Contestant, MiniGameResult } from '../../types/game';
import { ContestantAvatar } from '../common/ContestantAvatar';
import { sound } from '../../utils/soundEngine';
import { Trophy, Zap, Brain, Target, ArrowLeft, ArrowRight, Sparkles, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  activeContestants: Contestant[];
  onFinish: (result: MiniGameResult) => void;
}

export const FinalChoice: React.FC<Props> = ({
  activeContestants,
  onFinish,
}) => {
  const opponentBot = activeContestants.find((c) => !c.isPlayer) || activeContestants[1];
  const player = activeContestants.find((c) => c.isPlayer) || activeContestants[0];

  const [currentStage, setCurrentStage] = useState<1 | 2 | 3 | 4>(1);
  const [stageProgress, setStageProgress] = useState<number>(0);
  const [suspenseActive, setSuspenseActive] = useState<boolean>(false);
  const [winnerDeclared, setWinnerDeclared] = useState<'PLAYER' | 'BOT' | null>(null);

  // Stage 1: Red/Green state
  const [s1Light, setS1Light] = useState<'GREEN' | 'RED'>('GREEN');
  const [s1Holding, setS1Holding] = useState<boolean>(false);
  const [s1Distance, setS1Distance] = useState<number>(0);
  const s1HoldingRef = useRef<boolean>(false);
  const s1LightRef = useRef<'GREEN' | 'RED'>('GREEN');

  // Stage 2: Memory state
  const [s2TargetGlyphs, setS2TargetGlyphs] = useState<number[]>([1, 3, 2, 4]);
  const [s2PlayerTaps, setS2PlayerTaps] = useState<number[]>([]);
  const [s2ShowingDemo, setS2ShowingDemo] = useState<boolean>(true);

  // Stage 3: Quick Reaction state
  const [s3TargetReady, setS3TargetReady] = useState<boolean>(false);
  const [s3ReactionTime, setS3ReactionTime] = useState<number>(0);
  const s3SpawnTimeRef = useRef<number>(0);

  // Stage 4: Vault choice state
  const [s4ChosenSide, setS4ChosenSide] = useState<'LEFT' | 'RIGHT' | null>(null);
  const [s4SafeSide] = useState<'LEFT' | 'RIGHT'>(Math.random() < 0.5 ? 'LEFT' : 'RIGHT');

  // ================= STAGE 1: Red/Green Sprint =================
  useEffect(() => {
    if (currentStage !== 1) return;

    sound.playGreenSignal();
    const interval = setInterval(() => {
      // Toggle light
      if (Math.random() < 0.3) {
        const nextLight = s1LightRef.current === 'GREEN' ? 'RED' : 'GREEN';
        s1LightRef.current = nextLight;
        setS1Light(nextLight);
        if (nextLight === 'RED') sound.playRedAlarm();
        else sound.playGreenSignal();
      }

      if (s1HoldingRef.current) {
        if (s1LightRef.current === 'RED') {
          sound.playBuzzer();
          setS1Distance((d) => Math.max(0, d - 15));
        } else {
          setS1Distance((d) => {
            const nextD = d + 5;
            if (nextD >= 100) {
              sound.playSuccessChime();
              advanceToStage(2);
            }
            return Math.min(100, nextD);
          });
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [currentStage]);

  // ================= STAGE 2: Memory =================
  useEffect(() => {
    if (currentStage !== 2) return;
    setS2ShowingDemo(true);
    setS2PlayerTaps([]);

    // Blink pattern
    let t = 0;
    const interval = setInterval(() => {
      sound.playTap();
      t++;
      if (t >= 4) {
        clearInterval(interval);
        setS2ShowingDemo(false);
      }
    }, 600);

    return () => clearInterval(interval);
  }, [currentStage]);

  const handleS2Tap = (glyphId: number) => {
    if (s2ShowingDemo) return;
    sound.playTap();
    const nextTaps = [...s2PlayerTaps, glyphId];
    setS2PlayerTaps(nextTaps);

    const expected = s2TargetGlyphs[s2PlayerTaps.length];
    if (glyphId !== expected) {
      sound.playBuzzer();
      setS2PlayerTaps([]);
    } else if (nextTaps.length === s2TargetGlyphs.length) {
      sound.playSuccessChime();
      advanceToStage(3);
    }
  };

  // ================= STAGE 3: Quick Reaction =================
  useEffect(() => {
    if (currentStage !== 3) return;
    setS3TargetReady(false);

    const delay = 1500 + Math.random() * 1500;
    const timer = setTimeout(() => {
      setS3TargetReady(true);
      s3SpawnTimeRef.current = Date.now();
      sound.playGreenSignal();
    }, delay);

    return () => clearTimeout(timer);
  }, [currentStage]);

  const handleS3Strike = () => {
    if (!s3TargetReady) {
      sound.playBuzzer();
      return;
    }
    const ms = Date.now() - s3SpawnTimeRef.current;
    setS3ReactionTime(ms);
    sound.playSuccessChime();
    advanceToStage(4);
  };

  // ================= STAGE 4: Final Vault Decision =================
  const handleS4Choice = (side: 'LEFT' | 'RIGHT') => {
    setS4ChosenSide(side);
    setSuspenseActive(true);
    sound.playHeartbeat();

    // Dramatic suspense pause
    setTimeout(() => {
      const isCorrect = side === s4SafeSide;
      setSuspenseActive(false);

      if (isCorrect) {
        setWinnerDeclared('PLAYER');
        sound.playVictoryFanfare();
        try {
          confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
        } catch {}

        setTimeout(() => {
          onFinish({
            gameId: 'final-choice',
            playerWon: true,
            lostLife: false,
            eliminatedBotIds: [opponentBot.id],
            playerScore: 500,
            accuracyPercent: 100,
          });
        }, 2200);
      } else {
        setWinnerDeclared('BOT');
        sound.playBuzzer();

        setTimeout(() => {
          onFinish({
            gameId: 'final-choice',
            playerWon: false,
            lostLife: true,
            eliminatedBotIds: [],
            playerScore: 150,
            accuracyPercent: 50,
          });
        }, 2000);
      }
    }, 2400);
  };

  const advanceToStage = (stage: 1 | 2 | 3 | 4) => {
    setCurrentStage(stage);
  };

  return (
    <div
      id="minigame-final-choice"
      className="w-full max-w-md mx-auto flex flex-col items-center justify-between p-3 select-none flex-1 min-h-[520px]"
    >
      {/* Top Grand Finale HUD */}
      <div className="w-full bg-gradient-to-r from-amber-950/80 via-zinc-900 to-amber-950/80 border-2 border-amber-500/50 rounded-2xl px-4 py-2.5 mb-3 flex items-center justify-between shadow-xl shadow-amber-950/40">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400 animate-pulse" />
          <span className="text-amber-300 font-black text-xs tracking-wider">
            GRAND FINAL • STAGE {currentStage}/4
          </span>
        </div>
        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black px-2 py-0.5 rounded-full">
          1v1 SHOWDOWN
        </span>
      </div>

      {/* Duel Avatar Cards */}
      <div className="w-full flex items-center justify-around bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3 mb-3">
        <div className="flex flex-col items-center">
          <ContestantAvatar contestant={player} size="sm" showJerseyNumber={false} />
          <span className="text-white font-bold text-[11px] mt-1">YOU</span>
        </div>

        <div className="text-amber-400 font-black text-xl italic font-mono">VS</div>

        <div className="flex flex-col items-center">
          <ContestantAvatar contestant={opponentBot} size="sm" showJerseyNumber={false} />
          <span className="text-white font-bold text-[11px] mt-1">{opponentBot.name}</span>
        </div>
      </div>

      {/* Dynamic Multi-Stage Arena */}
      <div className="w-full bg-zinc-950/95 border-2 border-zinc-800 rounded-3xl p-5 flex flex-col items-center justify-center shadow-2xl my-auto min-h-[260px] relative overflow-hidden">
        {/* Ambient arena glow */}
        <div className="absolute inset-0 bg-[radial-gradient(#eab308_1px,transparent_1px)] [background-size:20px_20px] opacity-20 pointer-events-none" />

        {/* STAGE 1: Red/Green Sprint */}
        {currentStage === 1 && (
          <div className="w-full flex flex-col items-center animate-in fade-in">
            <span className="text-xs font-bold text-zinc-400 uppercase mb-2">
              STAGE 1: POWER SPRINT
            </span>
            <div
              className={`px-6 py-2 rounded-2xl font-black text-xl mb-4 border-2 ${
                s1Light === 'GREEN'
                  ? 'bg-emerald-950 border-emerald-400 text-emerald-300'
                  : 'bg-rose-950 border-rose-500 text-rose-300'
              }`}
            >
              {s1Light === 'GREEN' ? '🟢 GREEN - SPRINT!' : '🛑 RED - FREEZE!'}
            </div>

            {/* Sprint progress meter */}
            <div className="w-full bg-zinc-900 rounded-full h-4 border border-zinc-800 overflow-hidden mb-4">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all"
                style={{ width: `${s1Distance}%` }}
              />
            </div>

            <button
              onPointerDown={() => {
                s1HoldingRef.current = true;
                setS1Holding(true);
              }}
              onPointerUp={() => {
                s1HoldingRef.current = false;
                setS1Holding(false);
              }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black text-base active:scale-95 shadow-lg"
            >
              {s1Holding ? 'SPRINTING...' : 'HOLD TO SPRINT'}
            </button>
          </div>
        )}

        {/* STAGE 2: Memory Sequence */}
        {currentStage === 2 && (
          <div className="w-full flex flex-col items-center animate-in fade-in">
            <span className="text-xs font-bold text-zinc-400 uppercase mb-3">
              STAGE 2: GLYPH MEMORY
            </span>
            <p className="text-amber-400 text-xs font-semibold mb-4">
              {s2ShowingDemo ? 'Memorizing sequence...' : `Repeat sequence: ${s2PlayerTaps.length}/4`}
            </p>
            <div className="grid grid-cols-2 gap-3 w-full max-w-[240px]">
              {[1, 2, 3, 4].map((id) => (
                <button
                  key={id}
                  disabled={s2ShowingDemo}
                  onClick={() => handleS2Tap(id)}
                  className="py-4 rounded-2xl bg-zinc-900 border-2 border-zinc-700 hover:border-amber-400 text-2xl font-black text-white active:scale-90"
                >
                  {id === 1 && '💎'}
                  {id === 2 && '⚡'}
                  {id === 3 && '🔥'}
                  {id === 4 && '👑'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STAGE 3: Quick Reflex Strike */}
        {currentStage === 3 && (
          <div className="w-full flex flex-col items-center animate-in fade-in">
            <span className="text-xs font-bold text-zinc-400 uppercase mb-2">
              STAGE 3: INSTANT REFLEX
            </span>
            <p className="text-zinc-400 text-xs mb-4">
              Strike the glowing energy core the exact millisecond it flashes!
            </p>

            <button
              onClick={handleS3Strike}
              className={`w-28 h-28 rounded-full border-4 flex items-center justify-center font-black transition-all ${
                s3TargetReady
                  ? 'bg-amber-400 border-white text-black shadow-[0_0_30px_#f59e0b] scale-110 animate-ping'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-600'
              }`}
            >
              {s3TargetReady ? <Zap className="w-10 h-10 fill-black" /> : 'WAIT...'}
            </button>
          </div>
        )}

        {/* STAGE 4: Final Vault Decision */}
        {currentStage === 4 && (
          <div className="w-full flex flex-col items-center animate-in fade-in">
            <span className="text-xs font-black text-amber-400 uppercase tracking-widest mb-1">
              STAGE 4: THE LAST DECISION
            </span>
            <p className="text-zinc-300 text-xs font-medium mb-4 text-center">
              Only ONE vault door opens to victory. The other triggers immediate collapse!
            </p>

            {suspenseActive ? (
              <div className="flex flex-col items-center py-6 animate-pulse">
                <span className="text-amber-400 text-4xl">⏳</span>
                <span className="text-white font-black text-sm mt-2 tracking-widest">
                  OPENING VAULT DOOR...
                </span>
              </div>
            ) : winnerDeclared ? (
              <div className="flex flex-col items-center py-4">
                <span className="text-4xl">{winnerDeclared === 'PLAYER' ? '👑' : '💀'}</span>
                <span
                  className={`text-2xl font-black mt-2 ${
                    winnerDeclared === 'PLAYER' ? 'text-amber-400' : 'text-red-400'
                  }`}
                >
                  {winnerDeclared === 'PLAYER' ? 'THE LAST ONE!' : 'ELIMINATED IN FINAL!'}
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 w-full pt-2">
                <button
                  onClick={() => handleS4Choice('LEFT')}
                  className="py-5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 active:scale-95 text-white font-black text-sm flex flex-col items-center justify-center gap-1 shadow-xl"
                >
                  <ArrowLeft className="w-6 h-6" />
                  <span>LEFT VAULT</span>
                </button>

                <button
                  onClick={() => handleS4Choice('RIGHT')}
                  className="py-5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-black font-black text-sm flex flex-col items-center justify-center gap-1 shadow-xl"
                >
                  <ArrowRight className="w-6 h-6" />
                  <span>RIGHT VAULT</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Instructions */}
      <div className="w-full text-center pt-2">
        <p className="text-zinc-400 text-xs font-medium">
          Survive all 4 trials to defeat {opponentBot.name} and become the ultimate champion!
        </p>
      </div>
    </div>
  );
};
