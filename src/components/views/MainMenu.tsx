import React from 'react';
import { UserProfile } from '../../types/game';
import { ContestantAvatar } from '../common/ContestantAvatar';
import { sound } from '../../utils/soundEngine';
import { Play, Trophy, Sparkles, Calendar, Award, Volume2, VolumeX, Shield, Flame } from 'lucide-react';

interface Props {
  userProfile: UserProfile;
  isMuted: boolean;
  onToggleMute: () => void;
  onStartTournament: () => void;
  onOpenPractice: () => void;
  onOpenLockerRoom: () => void;
  onOpenDailyChallenges: () => void;
  onOpenTrophyRoom: () => void;
}

export const MainMenu: React.FC<Props> = ({
  userProfile,
  isMuted,
  onToggleMute,
  onStartTournament,
  onOpenPractice,
  onOpenLockerRoom,
  onOpenDailyChallenges,
  onOpenTrophyRoom,
}) => {
  const dummyContestant = {
    name: 'YOU',
    jerseyNumber: userProfile.customization.jerseyNumber,
    avatar: {
      color: userProfile.customization.jerseyColor,
      accentColor: '#3b82f6',
      hairStyle: userProfile.customization.hairStyle,
      accessory: userProfile.customization.visor,
      expression: 'confident' as const,
    },
  };

  const unclaimedDaily = userProfile.dailyChallenges.filter((d) => d.completed && !d.claimed).length;

  return (
    <div
      id="main-menu-view"
      className="w-full max-w-lg mx-auto flex flex-col justify-between p-4 select-none min-h-[640px] animate-in fade-in"
    >
      {/* Top Profile Bar */}
      <div className="w-full flex items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-2xl flex items-center gap-1.5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-white text-xs font-black">LVL {userProfile.level}</span>
          </div>

          {userProfile.winStreak > 0 && (
            <div className="bg-rose-950/60 border border-rose-500/40 px-2.5 py-1 rounded-2xl flex items-center gap-1 text-rose-400 text-xs font-black">
              <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
              <span>{userProfile.winStreak} STREAK</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-amber-950/50 border border-amber-500/40 text-amber-300 px-3 py-1 rounded-2xl text-xs font-bold flex items-center gap-1 shadow-sm">
            <span>🪙</span>
            <span>{userProfile.coins}</span>
          </div>

          <button
            onClick={() => {
              onToggleMute();
              sound.playTap();
            }}
            className="p-2 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Hero Title & Identity */}
      <div className="w-full flex flex-col items-center text-center my-auto py-3">
        <div className="relative mb-2">
          {/* Neon Logo Badge */}
          <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-black font-black text-4xl sm:text-5xl px-8 py-2.5 rounded-3xl tracking-widest shadow-2xl shadow-amber-500/30 transform -rotate-1 border-2 border-white/50">
            LAST ONE
          </div>
          <span className="absolute -bottom-2.5 right-2 bg-zinc-950 border border-amber-500/50 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
            SURVIVAL TOURNAMENT
          </span>
        </div>

        <p className="text-zinc-400 text-xs font-medium max-w-xs mt-3">
          8 Contestants • Random Mini-Games • Only 1 Survives
        </p>

        {/* Player Avatar Spotlight Card */}
        <div
          onClick={() => {
            sound.playTap();
            onOpenLockerRoom();
          }}
          className="mt-5 bg-zinc-950/80 hover:bg-zinc-900 border-2 border-zinc-800 hover:border-amber-500/50 rounded-3xl p-4 flex items-center gap-4 shadow-xl transition-all cursor-pointer group active:scale-98 w-full max-w-xs"
        >
          <ContestantAvatar contestant={dummyContestant} size="md" showJerseyNumber={false} />
          <div className="flex-1 text-left">
            <div className="flex items-center justify-between">
              <span className="text-white font-black text-sm group-hover:text-amber-400 transition-colors">
                CONTESTANT #{userProfile.customization.jerseyNumber}
              </span>
              <span className="text-lg">{userProfile.customization.emote}</span>
            </div>
            <span className="text-[11px] text-zinc-400 block mt-0.5">Tap to customize gear</span>
          </div>
        </div>
      </div>

      {/* Main Action Buttons */}
      <div className="w-full space-y-2.5 pt-2">
        {/* Play Tournament Primary CTA */}
        <button
          id="btn-main-play-tournament"
          onClick={() => {
            sound.playTap();
            onStartTournament();
          }}
          className="w-full py-5 px-6 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 active:scale-95 text-black font-black text-xl rounded-3xl shadow-2xl shadow-amber-500/30 flex items-center justify-center gap-3 transition-all"
        >
          <Play className="w-6 h-6 fill-black" />
          <span>PLAY TOURNAMENT</span>
        </button>

        {/* Secondary Hub Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            id="btn-main-practice"
            onClick={() => {
              sound.playTap();
              onOpenPractice();
            }}
            className="py-3 px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-2xl text-zinc-200 text-xs font-black flex items-center justify-center gap-1.5 active:scale-95 shadow-md"
          >
            <span>🎮</span>
            <span>PRACTICE ARENA</span>
          </button>

          <button
            id="btn-main-locker"
            onClick={() => {
              sound.playTap();
              onOpenLockerRoom();
            }}
            className="py-3 px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-2xl text-zinc-200 text-xs font-black flex items-center justify-center gap-1.5 active:scale-95 shadow-md"
          >
            <span>👕</span>
            <span>LOCKER ROOM</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            id="btn-main-daily"
            onClick={() => {
              sound.playTap();
              onOpenDailyChallenges();
            }}
            className="py-3 px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-2xl text-zinc-200 text-xs font-black flex items-center justify-center gap-1.5 active:scale-95 shadow-md relative"
          >
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>DAILY MISSIONS</span>
            {unclaimedDaily > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                {unclaimedDaily}
              </span>
            )}
          </button>

          <button
            id="btn-main-trophy"
            onClick={() => {
              sound.playTap();
              onOpenTrophyRoom();
            }}
            className="py-3 px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-2xl text-zinc-200 text-xs font-black flex items-center justify-center gap-1.5 active:scale-95 shadow-md"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>TROPHY ROOM</span>
          </button>
        </div>
      </div>
    </div>
  );
};
