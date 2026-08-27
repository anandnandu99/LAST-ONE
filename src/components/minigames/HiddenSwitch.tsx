import React, { useState, useEffect } from 'react';
import { Contestant, MiniGameResult } from '../../types/game';
import { sound } from '../../utils/soundEngine';
import { ToggleLeft, ShieldAlert, Sparkles } from 'lucide-react';

interface Props {
  activeContestants: Contestant[];
  eliminationCount: number;
  onFinish: (result: MiniGameResult) => void;
}

interface SwitchItem {
  id: number;
  label: string;
  isSafe: boolean;
  isTriggered: boolean;
  wasEliminatedByBot?: string; // bot name that tried this switch and failed
}

export const HiddenSwitch: React.FC<Props> = ({
  activeContestants,
  eliminationCount,
  onFinish,
}) => {
  const [switches, setSwitches] = useState<SwitchItem[]>([]);
  const [selectedSwitchId, setSelectedSwitchId] = useState<number | null>(null);
  const [historyIntel, setHistoryIntel] = useState<string[]>([]);
  const [isResolved, setIsResolved] = useState<boolean>(false);

  useEffect(() => {
    const totalSwitches = 5;
    const safeIndex = Math.floor(Math.random() * totalSwitches);

    const bots = activeContestants.filter((c) => !c.isPlayer);
    const intelLogs: string[] = [];

    // Pre-test 1 or 2 switches by unlucky bots to provide clues
    const unluckyBot = bots[0];
    let badSwitchTested = -1;
    if (unluckyBot) {
      // Pick a switch that is NOT safe
      const unsafePool = Array.from({ length: totalSwitches })
        .map((_, i) => i)
        .filter((i) => i !== safeIndex);
      badSwitchTested = unsafePool[Math.floor(Math.random() * unsafePool.length)];
      intelLogs.push(`Intel: ${unluckyBot.name} pulled Switch #${badSwitchTested + 1} and got eliminated!`);
    }

    const items: SwitchItem[] = [];
    for (let i = 0; i < totalSwitches; i++) {
      items.push({
        id: i + 1,
        label: `SWITCH #${i + 1}`,
        isSafe: i === safeIndex,
        isTriggered: false,
        wasEliminatedByBot: i === badSwitchTested ? unluckyBot?.name : undefined,
      });
    }

    setSwitches(items);
    setHistoryIntel(intelLogs);
  }, [activeContestants]);

  const handlePullSwitch = (sw: SwitchItem) => {
    if (isResolved) return;
    setIsResolved(true);
    setSelectedSwitchId(sw.id);
    sound.playTap();

    const updated = switches.map((s) => (s.id === sw.id ? { ...s, isTriggered: true } : s));
    setSwitches(updated);

    if (sw.isSafe) {
      sound.playSuccessChime();
      concludeRound(true);
    } else {
      sound.playBuzzer();
      concludeRound(false);
    }
  };

  const concludeRound = (playerPassed: boolean) => {
    const bots = activeContestants.filter((c) => !c.isPlayer);
    const eliminatedBotIds: string[] = [];

    // Natural eliminations
    let i = 0;
    while (eliminatedBotIds.length < eliminationCount && i < bots.length) {
      eliminatedBotIds.push(bots[i].id);
      i++;
    }

    setTimeout(() => {
      onFinish({
        gameId: 'hidden-switch',
        playerWon: playerPassed,
        lostLife: !playerPassed,
        eliminatedBotIds,
        playerScore: playerPassed ? 100 : 20,
        accuracyPercent: playerPassed ? 100 : 0,
      });
    }, 1200);
  };

  return (
    <div
      id="minigame-hidden-switch"
      className="w-full max-w-md mx-auto flex flex-col items-center justify-between p-3 select-none flex-1 min-h-[500px]"
    >
      {/* Top Banner */}
      <div className="w-full flex items-center justify-between bg-zinc-900/90 border border-zinc-800 rounded-2xl px-4 py-2.5 mb-3 shadow-md">
        <div className="flex items-center gap-2">
          <ToggleLeft className="w-4 h-4 text-amber-400" />
          <span className="text-amber-300 text-xs font-bold uppercase">
            CHOOSE THE 1 SAFE SWITCH
          </span>
        </div>
        <span className="text-zinc-400 text-xs font-mono font-bold">1 SAFE • 4 TRAPS</span>
      </div>

      {/* Intel Hint Log */}
      {historyIntel.length > 0 && (
        <div className="w-full bg-red-950/20 border border-red-500/30 rounded-xl px-3.5 py-2 mb-3 text-left">
          <p className="text-xs text-red-300 font-medium">
            ⚠️ <strong className="text-white">SURVEILLANCE INTEL:</strong> {historyIntel[0]}
          </p>
        </div>
      )}

      {/* Switches Console */}
      <div className="w-full bg-zinc-950/90 border-2 border-zinc-800 rounded-3xl p-5 flex flex-col gap-3 shadow-2xl my-auto">
        {switches.map((sw) => {
          const isSelected = selectedSwitchId === sw.id;

          let btnStyle = 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-200';
          if (sw.wasEliminatedByBot) {
            btnStyle = 'bg-red-950/40 border-red-800/80 text-red-400 opacity-60 line-through';
          }
          if (isResolved && isSelected) {
            btnStyle = sw.isSafe
              ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg'
              : 'bg-red-600 border-red-400 text-white shadow-lg';
          }

          return (
            <button
              key={sw.id}
              id={`switch-btn-${sw.id}`}
              disabled={isResolved}
              onClick={() => handlePullSwitch(sw)}
              className={`w-full py-3.5 px-4 rounded-2xl border-2 font-black text-sm flex items-center justify-between transition-all active:scale-98 ${btnStyle}`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-4 h-4 rounded-full bg-amber-400/80 border border-amber-300 shadow-sm" />
                <span>{sw.label}</span>
              </div>

              {sw.wasEliminatedByBot && (
                <span className="text-[10px] bg-red-950 text-red-300 px-2 py-0.5 rounded border border-red-600/40">
                  KILLED {sw.wasEliminatedByBot}
                </span>
              )}

              {isResolved && isSelected && (
                <span className="text-xs font-black">
                  {sw.isSafe ? 'SAFE! ✅' : 'TRAP DOOR! 💥'}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Instructions */}
      <div className="w-full text-center pt-3">
        <p className="text-zinc-400 text-xs font-medium">
          Deduce which switches have already triggered traps to eliminate risky options!
        </p>
      </div>
    </div>
  );
};
