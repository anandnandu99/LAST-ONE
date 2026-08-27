import React from 'react';
import { ALL_MINIGAMES } from '../../data/gameData';
import { MiniGameId } from '../../types/game';
import { sound } from '../../utils/soundEngine';
import { ArrowLeft, Play, Sparkles } from 'lucide-react';

interface Props {
  onSelectGame: (gameId: MiniGameId) => void;
  onBack: () => void;
}

export const PracticeMode: React.FC<Props> = ({ onSelectGame, onBack }) => {
  return (
    <div
      id="practice-mode-view"
      className="w-full max-w-lg mx-auto flex flex-col justify-between p-4 select-none min-h-[600px] animate-in fade-in"
    >
      {/* Header */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-zinc-800">
        <button
          onClick={() => {
            sound.playTap();
            onBack();
          }}
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white flex items-center gap-1 text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK</span>
        </button>

        <h2 className="text-lg font-black text-white flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-cyan-400" /> PRACTICE ARENA
        </h2>

        <div className="w-8" />
      </div>

      {/* Mini-Games Grid (14 games + Grand Final) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-3 flex-1 overflow-y-auto max-h-[460px] pr-1">
        {ALL_MINIGAMES.map((game) => (
          <button
            key={game.id}
            onClick={() => {
              sound.playTap();
              onSelectGame(game.id);
            }}
            className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 rounded-2xl p-3 flex items-center gap-3 text-left transition-all active:scale-98 shadow-md"
          >
            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-2xl shrink-0">
              {game.icon}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-white font-bold text-xs truncate">{game.title}</span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                  {game.category}
                </span>
              </div>
              <p className="text-zinc-400 text-[11px] truncate mt-0.5">{game.subtitle}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Back button */}
      <button
        onClick={() => {
          sound.playTap();
          onBack();
        }}
        className="w-full py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-black text-sm border border-zinc-800"
      >
        BACK TO MAIN MENU
      </button>
    </div>
  );
};
