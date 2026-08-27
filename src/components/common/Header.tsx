import React from 'react';
import { Heart, Volume2, VolumeX, ShieldAlert, Award } from 'lucide-react';
import { sound } from '../../utils/soundEngine';

interface Props {
  currentRound?: number;
  totalRounds?: number;
  roundTitle?: string;
  gameName?: string;
  playerLives?: number;
  lives?: number;
  aliveCount?: number;
  survivorsCount?: number;
  totalContestants?: number;
  coins?: number;
  onExit?: () => void;
  onQuit?: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

export const Header: React.FC<Props> = ({
  currentRound = 1,
  totalRounds = 4,
  roundTitle,
  gameName,
  playerLives,
  lives,
  aliveCount,
  survivorsCount,
  totalContestants = 8,
  coins,
  onExit,
  onQuit,
  isMuted = false,
  onToggleMute,
}) => {
  const displayTitle = gameName || roundTitle;
  const currentLives = lives !== undefined ? lives : (playerLives !== undefined ? playerLives : 1);
  const currentSurvivors = survivorsCount !== undefined ? survivorsCount : (aliveCount !== undefined ? aliveCount : 8);
  const handleExit = onQuit || onExit;
  return (
    <header className="w-full bg-zinc-950/90 border-b border-zinc-800/80 backdrop-blur-md px-3 py-2.5 z-40 sticky top-0 flex items-center justify-between shadow-lg select-none">
      {/* Left: Tournament Round Info */}
      <div className="flex items-center gap-2">
        {handleExit && (
          <button
            id="btn-header-exit"
            onClick={handleExit}
            className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors text-xs font-semibold"
            title="Leave Tournament"
          >
            ✕
          </button>
        )}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="bg-amber-500/20 text-amber-400 text-[10px] font-black tracking-wider px-2 py-0.5 rounded-full border border-amber-500/30">
              ROUND {currentRound}/{totalRounds}
            </span>
            {currentRound === 4 && (
              <span className="bg-rose-500/20 text-rose-400 text-[10px] font-black tracking-wider px-1.5 py-0.5 rounded-full border border-rose-500/30 animate-pulse">
                FINAL
              </span>
            )}
          </div>
          {displayTitle && (
            <span className="text-zinc-200 text-xs font-bold truncate max-w-[130px] sm:max-w-[200px]">
              {displayTitle}
            </span>
          )}
        </div>
      </div>

      {/* Center: Lives (Hearts ❤️) */}
      <div className="flex items-center gap-1 bg-zinc-900/90 px-2.5 py-1 rounded-full border border-zinc-800 shadow-inner">
        {[1, 2, 3].map((heartIndex) => {
          const isAlive = heartIndex <= currentLives;
          return (
            <Heart
              key={heartIndex}
              className={`w-5 h-5 transition-all duration-300 ${
                isAlive
                  ? 'text-rose-500 fill-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.7)] scale-100'
                  : 'text-zinc-700 fill-zinc-800/60 scale-75 opacity-40'
              }`}
            />
          );
        })}
      </div>

      {/* Right: Survivors Count + Sound + Coins */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-emerald-950/50 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/30 text-xs font-black">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block mr-0.5" />
          <span>{currentSurvivors}</span>
          <span className="text-emerald-500/70 font-normal">/{totalContestants}</span>
        </div>

        {typeof coins === 'number' && (
          <div className="hidden sm:flex items-center gap-1 bg-amber-950/40 text-amber-300 px-2 py-1 rounded-full border border-amber-500/30 text-xs font-bold">
            <span>🪙</span>
            <span>{coins}</span>
          </div>
        )}

        {onToggleMute && (
          <button
            id="btn-header-mute"
            onClick={() => {
              onToggleMute();
              sound.playTap();
            }}
            className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition-colors"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        )}
      </div>
    </header>
  );
};
