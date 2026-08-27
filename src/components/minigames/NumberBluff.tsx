import React, { useState, useEffect } from 'react';
import { Contestant, MiniGameResult } from '../../types/game';
import { ContestantAvatar } from '../common/ContestantAvatar';
import { sound } from '../../utils/soundEngine';
import { ShieldCheck, ShieldAlert, Sparkles, MessageSquare } from 'lucide-react';

interface Props {
  activeContestants: Contestant[];
  eliminationCount: number;
  onFinish: (result: MiniGameResult) => void;
}

export const NumberBluff: React.FC<Props> = ({
  activeContestants,
  eliminationCount,
  onFinish,
}) => {
  const [activeBot, setActiveBot] = useState<Contestant | null>(null);
  const [actualNumber, setActualNumber] = useState<number>(0);
  const [claimedNumber, setClaimedNumber] = useState<number>(0);
  const [isLying, setIsLying] = useState<boolean>(false);
  const [dialogue, setDialogue] = useState<string>('');
  const [outcome, setOutcome] = useState<'PENDING' | 'CAUGHT' | 'FOOLED' | 'TRUSTED_TRUTH' | 'TRUSTED_LIE'>('PENDING');

  useEffect(() => {
    // Pick an opponent bot
    const bots = activeContestants.filter((c) => !c.isPlayer);
    const chosenBot = bots[Math.floor(Math.random() * bots.length)] || activeContestants[1];
    setActiveBot(chosenBot);

    // Generate secret actual number (1-100)
    const secret = Math.floor(Math.random() * 90) + 10;
    setActualNumber(secret);

    // Bot decides whether to bluff based on deception stat
    const willBluff = Math.random() * 100 < chosenBot.stats.deception;
    setIsLying(willBluff);

    let claim = secret;
    if (willBluff) {
      const offset = (Math.floor(Math.random() * 30) + 10) * (Math.random() < 0.5 ? 1 : -1);
      claim = Math.max(10, Math.min(99, secret + offset));
    }
    setClaimedNumber(claim);

    // Bot line
    const quotes = chosenBot.quotes.onBluff;
    const quote = quotes[Math.floor(Math.random() * quotes.length)] || `My secret card is ${claim}!`;
    setDialogue(quote);
  }, [activeContestants]);

  const handleDecision = (decision: 'TRUST' | 'CALL_BLUFF') => {
    if (outcome !== 'PENDING' || !activeBot) return;

    sound.playTap();

    let playerWon = false;
    let nextOutcome: typeof outcome = 'PENDING';

    if (decision === 'CALL_BLUFF') {
      if (isLying) {
        // Player caught the bot!
        nextOutcome = 'CAUGHT';
        playerWon = true;
        sound.playSuccessChime();
        setDialogue(activeBot.quotes.onLose[0] || 'Ayyo! You caught me!');
      } else {
        // False accusation
        nextOutcome = 'FOOLED';
        playerWon = false;
        sound.playBuzzer();
        setDialogue(activeBot.quotes.onWin[0] || 'You actually doubted my honest card?!');
      }
    } else {
      // TRUST
      if (!isLying) {
        // Correct trust
        nextOutcome = 'TRUSTED_TRUTH';
        playerWon = true;
        sound.playSuccessChime();
        setDialogue('Good call! I told you I speak the truth!');
      } else {
        // Trusted a lie
        nextOutcome = 'TRUSTED_LIE';
        playerWon = false;
        sound.playBuzzer();
        setDialogue(activeBot.quotes.onWin[0] || 'You actually believed that? Haha!');
      }
    }

    setOutcome(nextOutcome);

    // Determine eliminated bots
    const otherBots = activeContestants.filter((c) => !c.isPlayer);
    const eliminatedBotIds: string[] = [];

    if (playerWon && !eliminatedBotIds.includes(activeBot.id)) {
      eliminatedBotIds.push(activeBot.id);
    }

    // Fill quota
    let i = 0;
    while (eliminatedBotIds.length < eliminationCount && i < otherBots.length) {
      if (!eliminatedBotIds.includes(otherBots[i].id)) {
        eliminatedBotIds.push(otherBots[i].id);
      }
      i++;
    }

    setTimeout(() => {
      onFinish({
        gameId: 'number-bluff',
        playerWon,
        lostLife: !playerWon,
        eliminatedBotIds,
        playerScore: playerWon ? 100 : 20,
        accuracyPercent: playerWon ? 100 : 0,
      });
    }, 1500);
  };

  if (!activeBot) return null;

  return (
    <div
      id="minigame-number-bluff"
      className="w-full max-w-md mx-auto flex flex-col items-center justify-between p-3 select-none flex-1 min-h-[500px]"
    >
      {/* Top Banner */}
      <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl px-4 py-2.5 mb-3 flex items-center justify-between shadow-md">
        <span className="text-amber-400 text-xs font-bold uppercase">
          BLUFF DUEL VS {activeBot.name}
        </span>
        <span className="text-zinc-400 text-xs font-mono">
          Personality: {activeBot.personality}
        </span>
      </div>

      {/* Opponent Card & Dialogue */}
      <div className="w-full bg-zinc-950/90 border-2 border-zinc-800 rounded-3xl p-5 flex flex-col items-center text-center shadow-2xl relative">
        <ContestantAvatar contestant={activeBot} size="lg" />

        <div className="mt-3 bg-zinc-900 border border-zinc-700/80 rounded-2xl p-3 w-full shadow-inner relative">
          <MessageSquare className="w-4 h-4 text-amber-400 absolute top-3 left-3" />
          <p className="text-amber-300 font-semibold text-sm px-4">
            "{dialogue}"
          </p>
        </div>

        {/* Claim Display */}
        <div className="my-5 flex flex-col items-center">
          <span className="text-zinc-400 text-xs uppercase font-bold tracking-wider mb-1">
            CLAIMED NUMBER CARD
          </span>
          <div className="w-24 h-32 rounded-2xl bg-gradient-to-b from-amber-500 to-amber-600 border-4 border-amber-300 flex items-center justify-center text-4xl font-black text-black shadow-xl shadow-amber-500/20">
            {claimedNumber}
          </div>
        </div>

        {/* Revealed card on resolution */}
        {outcome !== 'PENDING' && (
          <div className="w-full bg-zinc-900/90 rounded-2xl p-3 border border-zinc-700 animate-in fade-in">
            <span className="text-xs text-zinc-400 font-bold block mb-1">
              ACTUAL NUMBER WAS: <strong className="text-white text-base">{actualNumber}</strong>
            </span>
            <span
              className={`text-sm font-black ${
                outcome === 'CAUGHT' || outcome === 'TRUSTED_TRUTH'
                  ? 'text-emerald-400'
                  : 'text-red-400'
              }`}
            >
              {outcome === 'CAUGHT' && '🎯 BLUFF CAUGHT! Bot eliminated!'}
              {outcome === 'FOOLED' && '❌ THEY WERE TELLING THE TRUTH! You lose a life.'}
              {outcome === 'TRUSTED_TRUTH' && '✅ RIGHT TRUST! Bot was honest.'}
              {outcome === 'TRUSTED_LIE' && '❌ YOU BELIEVED A LIE! You lose a life.'}
            </span>
          </div>
        )}
      </div>

      {/* Decision Buttons */}
      <div className="w-full grid grid-cols-2 gap-3 pt-3">
        <button
          id="btn-trust"
          disabled={outcome !== 'PENDING'}
          onClick={() => handleDecision('TRUST')}
          className="py-4 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 active:scale-95 disabled:opacity-50 text-white font-black text-sm flex flex-col items-center justify-center gap-1 shadow-lg shadow-emerald-950/50"
        >
          <ShieldCheck className="w-5 h-5" />
          <span>TRUST CLAIM</span>
        </button>

        <button
          id="btn-call-bluff"
          disabled={outcome !== 'PENDING'}
          onClick={() => handleDecision('CALL_BLUFF')}
          className="py-4 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 active:scale-95 disabled:opacity-50 text-white font-black text-sm flex flex-col items-center justify-center gap-1 shadow-lg shadow-rose-950/50"
        >
          <ShieldAlert className="w-5 h-5" />
          <span>CALL BLUFF!</span>
        </button>
      </div>
    </div>
  );
};
