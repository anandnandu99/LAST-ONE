import React, { useState } from 'react';
import { UserProfile, PlayerCustomization } from '../../types/game';
import { ContestantAvatar } from '../common/ContestantAvatar';
import { sound } from '../../utils/soundEngine';
import { saveUserProfile } from '../../utils/storage';
import { ArrowLeft, Check, Sparkles, Lock, ShoppingBag } from 'lucide-react';

interface Props {
  userProfile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onBack: () => void;
}

const JERSEY_COLORS = [
  { hex: '#10b981', name: 'Emerald' },
  { hex: '#ef4444', name: 'Crimson' },
  { hex: '#3b82f6', name: 'Cobalt' },
  { hex: '#eab308', name: 'Gold' },
  { hex: '#a855f7', name: 'Purple' },
  { hex: '#ec4899', name: 'Neon Pink' },
  { hex: '#06b6d4', name: 'Cyan' },
  { hex: '#f97316', name: 'Solar Orange' },
];

const HAIR_STYLES: { id: PlayerCustomization['hairStyle']; name: string }[] = [
  { id: 'spiky', name: 'Spiky Surge' },
  { id: 'buzz', name: 'Buzz Cut' },
  { id: 'slick', name: 'Slick Back' },
  { id: 'afro', name: 'Afro Core' },
  { id: 'ponytail', name: 'High Ponytail' },
];

const VISORS: { id: PlayerCustomization['visor']; name: string; cost: number }[] = [
  { id: 'none', name: 'Standard Visor', cost: 0 },
  { id: 'cyber', name: 'Cyber Visor', cost: 150 },
  { id: 'neon-goggles', name: 'Neon Goggles', cost: 250 },
  { id: 'gold-rim', name: 'Gold Specs', cost: 400 },
];

const EMOTES: PlayerCustomization['emote'][] = ['🔥', '⚡', '👑', '🎯', '💀', '😈'];

export const LockerRoom: React.FC<Props> = ({
  userProfile,
  onUpdateProfile,
  onBack,
}) => {
  const [customization, setCustomization] = useState<PlayerCustomization>(userProfile.customization);
  const [activeTab, setActiveTab] = useState<'JERSEY' | 'HAIR' | 'VISOR' | 'EMOTE'>('JERSEY');

  const handleSave = (newCust: PlayerCustomization) => {
    setCustomization(newCust);
    const updated: UserProfile = {
      ...userProfile,
      customization: newCust,
    };
    saveUserProfile(updated);
    onUpdateProfile(updated);
  };

  const handleBuyVisor = (visorId: PlayerCustomization['visor'], cost: number) => {
    const itemKey = `visor-${visorId}`;
    if (userProfile.unlockedItems.includes(itemKey) || cost === 0) {
      handleSave({ ...customization, visor: visorId });
      sound.playTap();
      return;
    }

    if (userProfile.coins >= cost) {
      sound.playSuccessChime();
      const updated: UserProfile = {
        ...userProfile,
        coins: userProfile.coins - cost,
        unlockedItems: [...userProfile.unlockedItems, itemKey],
        customization: { ...customization, visor: visorId },
      };
      setCustomization(updated.customization);
      saveUserProfile(updated);
      onUpdateProfile(updated);
    } else {
      sound.playBuzzer();
    }
  };

  const dummyContestant = {
    name: 'YOU',
    jerseyNumber: customization.jerseyNumber,
    avatar: {
      color: customization.jerseyColor,
      accentColor: '#3b82f6',
      hairStyle: customization.hairStyle,
      accessory: customization.visor,
      expression: 'confident' as const,
    },
  };

  return (
    <div
      id="locker-room-view"
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
          <Sparkles className="w-4 h-4 text-amber-400" /> LOCKER ROOM
        </h2>

        <div className="flex items-center gap-1 bg-amber-950/60 border border-amber-500/40 text-amber-300 px-2.5 py-1 rounded-full text-xs font-bold">
          <span>🪙</span>
          <span>{userProfile.coins}</span>
        </div>
      </div>

      {/* Avatar Live Preview */}
      <div className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-3xl p-6 flex flex-col items-center justify-center my-3 shadow-xl relative overflow-hidden">
        <div className="absolute top-3 right-3 text-2xl animate-bounce">
          {customization.emote}
        </div>
        <ContestantAvatar contestant={dummyContestant} size="xl" showJerseyNumber={true} />
        <span className="text-white font-black text-sm mt-2">CONTESTANT #{customization.jerseyNumber}</span>
      </div>

      {/* Tab Switcher */}
      <div className="w-full grid grid-cols-4 gap-1.5 p-1 bg-zinc-900 rounded-2xl border border-zinc-800 mb-3">
        {(['JERSEY', 'HAIR', 'VISOR', 'EMOTE'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              sound.playTap();
              setActiveTab(tab);
            }}
            className={`py-2 text-[11px] font-black rounded-xl transition-all ${
              activeTab === tab
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content Controls */}
      <div className="w-full bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 mb-4 flex-1">
        {activeTab === 'JERSEY' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300">JERSEY COLOR</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-zinc-400">NUMBER:</span>
                <input
                  type="text"
                  maxLength={3}
                  value={customization.jerseyNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    handleSave({ ...customization, jerseyNumber: val || '001' });
                  }}
                  className="w-14 text-center font-mono font-black text-xs bg-zinc-950 border border-zinc-700 rounded-lg py-1 text-amber-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-1">
              {JERSEY_COLORS.map((col) => (
                <button
                  key={col.hex}
                  onClick={() => handleSave({ ...customization, jerseyColor: col.hex })}
                  style={{ backgroundColor: col.hex }}
                  className="h-10 rounded-xl border-2 border-white/20 flex items-center justify-center shadow-md active:scale-95 transition-transform"
                >
                  {customization.jerseyColor === col.hex && <Check className="w-5 h-5 text-white drop-shadow" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'HAIR' && (
          <div className="grid grid-cols-2 gap-2">
            {HAIR_STYLES.map((hair) => (
              <button
                key={hair.id}
                onClick={() => handleSave({ ...customization, hairStyle: hair.id })}
                className={`py-3 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                  customization.hairStyle === hair.id
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <span>{hair.name}</span>
                {customization.hairStyle === hair.id && <Check className="w-4 h-4 text-amber-400" />}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'VISOR' && (
          <div className="grid grid-cols-2 gap-2">
            {VISORS.map((vis) => {
              const isUnlocked = userProfile.unlockedItems.includes(`visor-${vis.id}`) || vis.cost === 0;
              const isEquipped = customization.visor === vis.id;

              return (
                <button
                  key={vis.id}
                  onClick={() => handleBuyVisor(vis.id, vis.cost)}
                  className={`py-3 px-3 rounded-xl border text-xs font-bold flex flex-col items-start gap-1 transition-all ${
                    isEquipped
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-300'
                  }`}
                >
                  <div className="w-full flex items-center justify-between">
                    <span>{vis.name}</span>
                    {isEquipped ? (
                      <Check className="w-4 h-4 text-amber-400" />
                    ) : !isUnlocked ? (
                      <Lock className="w-3.5 h-3.5 text-zinc-500" />
                    ) : null}
                  </div>
                  {!isUnlocked && (
                    <span className="text-[10px] text-amber-400 flex items-center gap-1 font-mono">
                      🪙 {vis.cost} COINS
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {activeTab === 'EMOTE' && (
          <div className="grid grid-cols-3 gap-2.5">
            {EMOTES.map((em) => (
              <button
                key={em}
                onClick={() => handleSave({ ...customization, emote: em })}
                className={`py-3 rounded-xl border text-2xl flex items-center justify-center transition-all ${
                  customization.emote === em
                    ? 'bg-amber-500/20 border-amber-500 shadow-md scale-105'
                    : 'bg-zinc-950 border-zinc-800'
                }`}
              >
                {em}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Done Button */}
      <button
        onClick={() => {
          sound.playTap();
          onBack();
        }}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-black font-black text-sm shadow-xl shadow-amber-500/25"
      >
        SAVE & CLOSE
      </button>
    </div>
  );
};
