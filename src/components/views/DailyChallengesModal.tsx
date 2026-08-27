import React from 'react';
import { UserProfile, DailyChallenge } from '../../types/game';
import { sound } from '../../utils/soundEngine';
import { saveUserProfile } from '../../utils/storage';
import { Calendar, CheckCircle2, Gift, X, Sparkles } from 'lucide-react';

interface Props {
  userProfile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onClose: () => void;
}

export const DailyChallengesModal: React.FC<Props> = ({
  userProfile,
  onUpdateProfile,
  onClose,
}) => {
  const handleClaim = (challengeId: string) => {
    const target = userProfile.dailyChallenges.find((c) => c.id === challengeId);
    if (!target || !target.completed || target.claimed) return;

    sound.playSuccessChime();

    let newCoins = userProfile.coins + target.rewardCoins;
    let newXp = userProfile.xp + target.rewardXp;
    let newLevel = userProfile.level;
    let xpNeeded = userProfile.xpToNextLevel;

    while (newXp >= xpNeeded) {
      newXp -= xpNeeded;
      newLevel += 1;
      xpNeeded = Math.round(xpNeeded * 1.35);
    }

    const updatedChallenges = userProfile.dailyChallenges.map((c) =>
      c.id === challengeId ? { ...c, claimed: true } : c
    );

    const updatedProfile: UserProfile = {
      ...userProfile,
      coins: newCoins,
      xp: newXp,
      level: newLevel,
      xpToNextLevel: xpNeeded,
      dailyChallenges: updatedChallenges,
    };

    saveUserProfile(updatedProfile);
    onUpdateProfile(updatedProfile);
  };

  return (
    <div
      id="daily-challenges-modal"
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in"
    >
      <div className="w-full max-w-md bg-zinc-950 border-2 border-amber-500/40 rounded-3xl p-5 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-black text-white">DAILY CHALLENGES</h2>
          </div>
          <button
            onClick={() => {
              sound.playTap();
              onClose();
            }}
            className="p-1 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Challenges */}
        <div className="space-y-3 my-4">
          {userProfile.dailyChallenges.map((challenge) => {
            const pct = Math.min(100, Math.round((challenge.progress / challenge.goal) * 100));

            return (
              <div
                key={challenge.id}
                className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3.5 flex flex-col gap-2 shadow-inner"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-white">{challenge.title}</h4>
                    <p className="text-[11px] text-zinc-400">{challenge.desc}</p>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    <span>+{challenge.rewardCoins}🪙</span>
                    <span>+{challenge.rewardXp}XP</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-zinc-950 rounded-full h-2 border border-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Claim / Progress status */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-mono text-zinc-500 font-bold">
                    {challenge.progress}/{challenge.goal} COMPLETED
                  </span>

                  {challenge.claimed ? (
                    <span className="text-[11px] font-bold text-zinc-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> CLAIMED
                    </span>
                  ) : challenge.completed ? (
                    <button
                      onClick={() => handleClaim(challenge.id)}
                      className="py-1 px-3 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black text-[11px] rounded-xl shadow-md flex items-center gap-1 active:scale-95"
                    >
                      <Gift className="w-3.5 h-3.5" /> CLAIM REWARD
                    </button>
                  ) : (
                    <span className="text-[10px] text-zinc-500 font-bold">IN PROGRESS</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Close button */}
        <button
          onClick={() => {
            sound.playTap();
            onClose();
          }}
          className="w-full py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs border border-zinc-800"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
};
