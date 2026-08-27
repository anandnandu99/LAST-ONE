import React from 'react';
import { Contestant } from '../../types/game';

interface Props {
  contestant: Contestant | {
    name: string;
    jerseyNumber: string;
    avatar: Contestant['avatar'];
    isPlayer?: boolean;
    isEliminated?: boolean;
  };
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showJerseyNumber?: boolean;
  className?: string;
}

export const ContestantAvatar: React.FC<Props> = ({
  contestant,
  size = 'md',
  showJerseyNumber = true,
  className = '',
}) => {
  const { avatar, jerseyNumber, isEliminated } = contestant;

  const sizeDimensions = {
    sm: 'w-10 h-10 text-xs',
    md: 'w-14 h-14 text-sm',
    lg: 'w-20 h-20 text-base',
    xl: 'w-28 h-28 text-lg',
  }[size];

  const strokeWidth = size === 'sm' ? 2 : 3;

  return (
    <div
      id={`avatar-${contestant.jerseyNumber}`}
      className={`relative inline-flex flex-col items-center justify-center select-none ${className}`}
    >
      <div
        className={`relative ${sizeDimensions} rounded-2xl flex items-center justify-center overflow-hidden border-2 shadow-lg transition-all ${
          isEliminated
            ? 'grayscale opacity-40 border-zinc-700 bg-zinc-900'
            : 'border-white/30 shadow-cyan-500/20'
        }`}
        style={{
          background: isEliminated
            ? '#18181b'
            : `linear-gradient(135deg, ${avatar.color} 0%, ${avatar.accentColor} 100%)`,
        }}
      >
        {/* Stylized Avatar Head SVG */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full p-1.5 drop-shadow-md"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Hair back / base */}
          {avatar.hairStyle === 'afro' && (
            <circle cx="50" cy="45" r="34" fill="#18181b" />
          )}
          {avatar.hairStyle === 'spiky' && (
            <path
              d="M20 50 L30 18 L45 30 L50 12 L60 30 L75 16 L80 50 Z"
              fill="#09090b"
            />
          )}
          {avatar.hairStyle === 'ponytail' && (
            <>
              <path d="M25 45 C25 20 75 20 75 45 Z" fill="#18181b" />
              <path d="M72 32 C88 28 92 48 85 58 C78 52 75 42 72 32 Z" fill="#27272a" />
            </>
          )}
          {avatar.hairStyle === 'slick' && (
            <path d="M26 46 C26 22 74 22 74 46 C74 30 26 30 26 46 Z" fill="#18181b" />
          )}
          {avatar.hairStyle === 'buzz' && (
            <ellipse cx="50" cy="46" rx="27" ry="24" fill="#27272a" />
          )}

          {/* Head Shape */}
          <ellipse cx="50" cy="54" rx="24" ry="26" fill="#fcd34d" />

          {/* Eyes & Expression */}
          {avatar.expression === 'confident' && (
            <>
              {/* Confident eyes */}
              <path d="M38 52 Q44 48 48 52" stroke="#18181b" strokeWidth={strokeWidth} strokeLinecap="round" />
              <path d="M54 52 Q58 48 64 52" stroke="#18181b" strokeWidth={strokeWidth} strokeLinecap="round" />
              <circle cx="43" cy="55" r="2.5" fill="#18181b" />
              <circle cx="59" cy="55" r="2.5" fill="#18181b" />
              <path d="M42 66 Q51 72 60 66" stroke="#18181b" strokeWidth={strokeWidth} strokeLinecap="round" />
            </>
          )}

          {avatar.expression === 'intense' && (
            <>
              <path d="M36 50 L47 54" stroke="#7f1d1d" strokeWidth={strokeWidth + 1} strokeLinecap="round" />
              <path d="M64 50 L53 54" stroke="#7f1d1d" strokeWidth={strokeWidth + 1} strokeLinecap="round" />
              <circle cx="43" cy="56" r="2.5" fill="#18181b" />
              <circle cx="57" cy="56" r="2.5" fill="#18181b" />
              <path d="M43 68 L57 68" stroke="#18181b" strokeWidth={strokeWidth} strokeLinecap="round" />
            </>
          )}

          {avatar.expression === 'smirk' && (
            <>
              <circle cx="42" cy="54" r="2.5" fill="#18181b" />
              <circle cx="60" cy="54" r="2.5" fill="#18181b" />
              <path d="M44 67 Q52 66 62 61" stroke="#18181b" strokeWidth={strokeWidth} strokeLinecap="round" />
            </>
          )}

          {avatar.expression === 'nervous' && (
            <>
              <circle cx="41" cy="53" r="3.5" fill="#ffffff" stroke="#18181b" strokeWidth="1.5" />
              <circle cx="41" cy="53" r="1.5" fill="#18181b" />
              <circle cx="59" cy="53" r="3.5" fill="#ffffff" stroke="#18181b" strokeWidth="1.5" />
              <circle cx="59" cy="53" r="1.5" fill="#18181b" />
              <path d="M42 68 Q46 64 50 68 Q54 72 58 68" stroke="#18181b" strokeWidth={strokeWidth} strokeLinecap="round" fill="none" />
              {/* Sweat drop */}
              <path d="M68 46 C70 42 74 46 72 50 C70 52 68 50 68 46 Z" fill="#38bdf8" />
            </>
          )}

          {avatar.expression === 'chill' && (
            <>
              <path d="M38 54 Q43 56 47 54" stroke="#18181b" strokeWidth={strokeWidth} strokeLinecap="round" fill="none" />
              <path d="M53 54 Q57 56 62 54" stroke="#18181b" strokeWidth={strokeWidth} strokeLinecap="round" fill="none" />
              <path d="M44 65 Q50 69 56 65" stroke="#18181b" strokeWidth={strokeWidth} strokeLinecap="round" fill="none" />
            </>
          )}

          {/* Accessories */}
          {avatar.accessory === 'cyber' && (
            <path
              d="M32 50 L68 50 L64 58 L36 58 Z"
              fill="#06b6d4"
              stroke="#22d3ee"
              strokeWidth="1.5"
              fillOpacity="0.85"
            />
          )}
          {avatar.accessory === 'neon-goggles' && (
            <>
              <circle cx="42" cy="54" r="8" fill="#eab308" fillOpacity="0.8" stroke="#ca8a04" strokeWidth="1.5" />
              <circle cx="58" cy="54" r="8" fill="#eab308" fillOpacity="0.8" stroke="#ca8a04" strokeWidth="1.5" />
              <line x1="50" y1="54" x2="50" y2="54" stroke="#ca8a04" strokeWidth="2" />
            </>
          )}
          {avatar.accessory === 'gold-rim' && (
            <>
              <circle cx="42" cy="54" r="7" fill="none" stroke="#fbbf24" strokeWidth="2" />
              <circle cx="58" cy="54" r="7" fill="none" stroke="#fbbf24" strokeWidth="2" />
              <line x1="49" y1="54" x2="51" y2="54" stroke="#fbbf24" strokeWidth="2" />
            </>
          )}
          {avatar.accessory === 'headband' && (
            <rect x="25" y="38" width="50" height="8" rx="2" fill="#ef4444" stroke="#dc2626" strokeWidth="1" />
          )}

          {/* Jersey Collar */}
          <path d="M30 78 Q50 90 70 78 L80 98 L20 98 Z" fill="#09090b" />
          <path d="M42 78 L50 88 L58 78 Z" fill="#27272a" />
        </svg>

        {/* Elimination Red Cross Overlay */}
        {isEliminated && (
          <div className="absolute inset-0 bg-red-950/70 flex items-center justify-center backdrop-blur-[1px]">
            <span className="text-red-500 font-black text-2xl drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">
              ✕
            </span>
          </div>
        )}
      </div>

      {showJerseyNumber && (
        <span
          className={`mt-1 font-mono font-black tracking-wider text-[11px] px-1.5 py-0.5 rounded-full border shadow-sm ${
            isEliminated
              ? 'bg-zinc-800 text-zinc-500 border-zinc-700'
              : 'bg-zinc-900/90 text-amber-300 border-amber-500/30'
          }`}
        >
          #{jerseyNumber}
        </span>
      )}
    </div>
  );
};
