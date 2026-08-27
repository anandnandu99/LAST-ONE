import { UserProfile, DailyChallenge, Achievement } from '../types/game';
import { INITIAL_USER_PROFILE } from '../data/gameData';

const STORAGE_KEY = 'last_one_user_profile_v1';

export function loadUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_USER_PROFILE;
    const parsed = JSON.parse(raw);
    return {
      ...INITIAL_USER_PROFILE,
      ...parsed,
      customization: {
        ...INITIAL_USER_PROFILE.customization,
        ...(parsed.customization || {}),
      },
      dailyChallenges: parsed.dailyChallenges || INITIAL_USER_PROFILE.dailyChallenges,
      achievements: parsed.achievements || INITIAL_USER_PROFILE.achievements,
    };
  } catch {
    return INITIAL_USER_PROFILE;
  }
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore storage quota errors
  }
}

export function addRewards(
  profile: UserProfile,
  coins: number,
  xp: number,
  options?: {
    wonTournament?: boolean;
    botsEliminated?: number;
    livesLeft?: number;
    reactionMs?: number;
  }
): { updatedProfile: UserProfile; leveledUp: boolean; newAchievements: Achievement[] } {
  let newXp = profile.xp + xp;
  let newLevel = profile.level;
  let xpNeeded = profile.xpToNextLevel;
  let leveledUp = false;

  while (newXp >= xpNeeded) {
    newXp -= xpNeeded;
    newLevel += 1;
    xpNeeded = Math.round(xpNeeded * 1.35);
    leveledUp = true;
  }

  const updatedProfile: UserProfile = {
    ...profile,
    level: newLevel,
    xp: newXp,
    xpToNextLevel: xpNeeded,
    coins: profile.coins + coins,
    totalTournaments: profile.totalTournaments + 1,
    tournamentsWon: options?.wonTournament ? profile.tournamentsWon + 1 : profile.tournamentsWon,
    winStreak: options?.wonTournament ? profile.winStreak + 1 : 0,
    bestWinStreak: options?.wonTournament
      ? Math.max(profile.bestWinStreak, profile.winStreak + 1)
      : profile.bestWinStreak,
    totalBotsEliminated: profile.totalBotsEliminated + (options?.botsEliminated || 0),
    bestReactionTimeMs:
      options?.reactionMs && options.reactionMs > 0
        ? Math.min(profile.bestReactionTimeMs || 999, options.reactionMs)
        : profile.bestReactionTimeMs,
  };

  // Update daily challenges
  const updatedDaily: DailyChallenge[] = updatedProfile.dailyChallenges.map((dc) => {
    let progress = dc.progress;
    if (dc.id === 'dc-1' && (options?.botsEliminated || 0) >= 4) {
      progress = Math.min(dc.goal, progress + 1);
    } else if (dc.id === 'dc-2' && options?.wonTournament) {
      progress = Math.min(dc.goal, progress + 1);
    } else if (dc.id === 'dc-3') {
      progress = Math.min(dc.goal, progress + (options?.botsEliminated || 0));
    }
    const completed = progress >= dc.goal;
    return { ...dc, progress, completed };
  });
  updatedProfile.dailyChallenges = updatedDaily;

  // Check achievements
  const newAchievements: Achievement[] = [];
  const updatedAchievements: Achievement[] = updatedProfile.achievements.map((ach) => {
    let unlock = ach.unlocked;
    if (!unlock) {
      if (ach.id === 'ach-first-blood' && (options?.botsEliminated || 0) > 0) {
        unlock = true;
      } else if (ach.id === 'ach-grand-champ' && options?.wonTournament) {
        unlock = true;
      } else if (ach.id === 'ach-flawless' && options?.wonTournament && (options.livesLeft ?? 0) >= 3) {
        unlock = true;
      } else if (
        ach.id === 'ach-speed-demon' &&
        options?.reactionMs &&
        options.reactionMs > 0 &&
        options.reactionMs <= 220
      ) {
        unlock = true;
      }
    }
    if (unlock && !ach.unlocked) {
      newAchievements.push({ ...ach, unlocked: true });
    }
    return { ...ach, unlocked: unlock };
  });
  updatedProfile.achievements = updatedAchievements;

  saveUserProfile(updatedProfile);
  return { updatedProfile, leveledUp, newAchievements };
}
