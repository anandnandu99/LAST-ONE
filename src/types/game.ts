export type BotPersonality =
  | 'aggressive'
  | 'strategist'
  | 'speedster'
  | 'careful'
  | 'trickster'
  | 'average'
  | 'beginner';

export interface Contestant {
  id: string;
  name: string;
  jerseyNumber: string;
  isPlayer: boolean;
  isAlive: boolean;
  eliminatedInRound?: number;
  eliminationReason?: string;
  personality: BotPersonality;
  avatar: {
    color: string;
    accentColor: string;
    hairStyle: string;
    accessory: string;
    expression: 'confident' | 'nervous' | 'intense' | 'smirk' | 'chill';
  };
  stats: {
    speed: number; // 0-100
    memory: number; // 0-100
    precision: number; // 0-100
    boldness: number; // 0-100
    deception: number; // 0-100
    bluff?: number;
    luck?: number;
  };
  quotes: {
    onWin: string[];
    onLose: string[];
    onBluff: string[];
    onTaunt: string[];
  };
}

export type MiniGameId =
  | 'red-green'
  | 'perfect-cut'
  | 'memory-tiles'
  | 'number-bluff'
  | 'color-switch'
  | 'safe-path'
  | 'quick-tap'
  | 'balance-master'
  | 'number-race'
  | 'dodge-zone'
  | 'stop-timer'
  | 'shape-match'
  | 'follow-leader'
  | 'hidden-switch'
  | 'final-choice';

export interface MiniGameMeta {
  id: MiniGameId;
  title: string;
  subtitle: string;
  icon: string;
  instruction: string;
  demoTip: string;
  category: 'Agility' | 'Precision' | 'Memory' | 'Mind Game' | 'Reflex';
}

export interface TournamentRound {
  roundNumber: number; // 1, 2, 3, 4
  gameId: MiniGameId;
  meta: MiniGameMeta;
  startCount: number;
  targetCount: number;
  eliminationCount: number;
}

export interface MiniGameResult {
  gameId: MiniGameId;
  playerWon: boolean;
  lostLife: boolean;
  eliminatedBotIds: string[];
  playerScore: number;
  reactionTimeMs?: number;
  accuracyPercent?: number;
  notes?: string;
}

export interface DailyChallenge {
  id: string;
  title: string;
  desc: string;
  goal: number;
  progress: number;
  rewardCoins: number;
  rewardXp: number;
  completed: boolean;
  claimed: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  icon: string;
  unlocked: boolean;
  progress?: { current: number; max: number };
}

export interface PlayerCustomization {
  jerseyColor: string;
  jerseyNumber: string;
  hairStyle: 'afro' | 'spiky' | 'slick' | 'buzz' | 'ponytail' | 'headband';
  skinTone: string;
  visor: 'none' | 'cyber' | 'stealth' | 'gold-rim' | 'neon-goggles';
  emote: '🔥' | '⚡' | '👑' | '🎯' | '💀' | '😈';
}

export interface UserProfile {
  level: number;
  xp: number;
  xpToNextLevel: number;
  coins: number;
  winStreak: number;
  bestWinStreak: number;
  totalTournaments: number;
  tournamentsWon: number;
  totalBotsEliminated: number;
  bestReactionTimeMs: number;
  customization: PlayerCustomization;
  unlockedItems: string[];
  dailyChallenges: DailyChallenge[];
  achievements: Achievement[];
}
