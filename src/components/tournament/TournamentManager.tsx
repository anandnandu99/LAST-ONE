import React, { useState, useEffect } from 'react';
import {
  Contestant,
  MiniGameId,
  MiniGameResult,
  UserProfile,
  TournamentRound,
  Achievement,
} from '../../types/game';
import { AI_BOTS, ALL_MINIGAMES } from '../../data/gameData';
import { Header } from '../common/Header';
import { HowToPlayModal } from '../common/HowToPlayModal';
import { EliminationCeremony } from '../common/EliminationCeremony';
import { sound } from '../../utils/soundEngine';
import { saveUserProfile, addRewards } from '../../utils/storage';

// All Mini-Game Component Imports
import { RedGreenRun } from '../minigames/RedGreenRun';
import { PerfectCut } from '../minigames/PerfectCut';
import { MemoryTiles } from '../minigames/MemoryTiles';
import { NumberBluff } from '../minigames/NumberBluff';
import { ColorSwitch } from '../minigames/ColorSwitch';
import { SafePath } from '../minigames/SafePath';
import { QuickTap } from '../minigames/QuickTap';
import { BalanceMaster } from '../minigames/BalanceMaster';
import { NumberRace } from '../minigames/NumberRace';
import { DodgeZone } from '../minigames/DodgeZone';
import { StopTimer } from '../minigames/StopTimer';
import { ShapeMatch } from '../minigames/ShapeMatch';
import { FollowLeader } from '../minigames/FollowLeader';
import { HiddenSwitch } from '../minigames/HiddenSwitch';
import { FinalChoice } from '../minigames/FinalChoice';

interface Props {
  userProfile: UserProfile;
  practiceGameId?: MiniGameId | null; // If practicing specific game
  onUpdateProfile: (updated: UserProfile) => void;
  onTournamentEnd: (results: {
    wonTournament: boolean;
    finalPosition: number;
    botsDefeated: number;
    roundsSurvived: number;
    coinsEarned: number;
    xpEarned: number;
    leveledUp: boolean;
    newAchievements: Achievement[];
  }) => void;
  onExitToMenu: () => void;
}

export const TournamentManager: React.FC<Props> = ({
  userProfile,
  practiceGameId,
  onUpdateProfile,
  onTournamentEnd,
  onExitToMenu,
}) => {
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [rounds, setRounds] = useState<TournamentRound[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState<number>(0);
  const [playerLives, setPlayerLives] = useState<number>(1); // 1 life per tournament

  // Stage states
  const [showHowToPlay, setShowHowToPlay] = useState<boolean>(true);
  const [isPlayingGame, setIsPlayingGame] = useState<boolean>(false);
  const [showCeremony, setShowCeremony] = useState<boolean>(false);
  const [recentlyEliminated, setRecentlyEliminated] = useState<Contestant[]>([]);

  // Tournament Stats Accumulator
  const [botsDefeatedCount, setBotsDefeatedCount] = useState<number>(0);
  const [accumulatedScore, setAccumulatedScore] = useState<number>(0);

  // Initialize Tournament or Practice
  useEffect(() => {
    // 1. Build Human Contestant
    const playerContestant: Contestant = {
      id: 'player-human',
      name: 'YOU',
      jerseyNumber: userProfile.customization.jerseyNumber,
      isPlayer: true,
      personality: 'confident' as any,
      quotes: {
        onWin: ['I am the Last One!'],
        onLose: ['Good attempt!'],
        onBluff: ['Trust me!'],
        onTaunt: ['Let the games begin!'],
      },
      avatar: {
        color: userProfile.customization.jerseyColor,
        accentColor: '#3b82f6',
        hairStyle: userProfile.customization.hairStyle,
        accessory: userProfile.customization.visor,
        expression: 'confident',
      },
      stats: { speed: 85, memory: 85, precision: 85, boldness: 85, deception: 85 },
      isAlive: true,
    };

    // 2. Build 7 AI Bots
    const activeBots: Contestant[] = AI_BOTS.map((bot) => ({
      ...bot,
      isPlayer: false,
      isAlive: true,
    }));

    const allContestants = [playerContestant, ...activeBots];
    setContestants(allContestants);

    if (practiceGameId) {
      // PRACTICE MODE: 1 round with selected game
      const meta = ALL_MINIGAMES.find((m) => m.id === practiceGameId) || ALL_MINIGAMES[0];
      setRounds([
        {
          roundNumber: 1,
          gameId: practiceGameId,
          meta,
          startCount: 8,
          targetCount: 6,
          eliminationCount: 2,
        },
      ]);
    } else {
      // FULL SURVIVAL TOURNAMENT: Pick 3 random distinct games + FinalChoice
      const pool = ALL_MINIGAMES.filter((g) => g.id !== 'final-choice');
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      const selectedGames = shuffled.slice(0, 3);
      const finalMeta = ALL_MINIGAMES.find((g) => g.id === 'final-choice')!;

      const tournamentRounds: TournamentRound[] = [
        {
          roundNumber: 1,
          gameId: selectedGames[0].id,
          meta: selectedGames[0],
          startCount: 8,
          targetCount: 6,
          eliminationCount: 2,
        },
        {
          roundNumber: 2,
          gameId: selectedGames[1].id,
          meta: selectedGames[1],
          startCount: 6,
          targetCount: 4,
          eliminationCount: 2,
        },
        {
          roundNumber: 3,
          gameId: selectedGames[2].id,
          meta: selectedGames[2],
          startCount: 4,
          targetCount: 2,
          eliminationCount: 2,
        },
        {
          roundNumber: 4,
          gameId: 'final-choice',
          meta: finalMeta,
          startCount: 2,
          targetCount: 1,
          eliminationCount: 1,
        },
      ];

      setRounds(tournamentRounds);
    }

    setCurrentRoundIndex(0);
    setShowHowToPlay(true);
    setIsPlayingGame(false);
    setShowCeremony(false);
  }, [practiceGameId, userProfile.customization]);

  const currentRound = rounds[currentRoundIndex];
  const activeContestants = contestants.filter((c) => c.isAlive);

  // Handle Start of Active Mini-Game after Instructions modal countdown
  const handleStartGame = () => {
    setShowHowToPlay(false);
    setIsPlayingGame(true);
  };

  // Handle Game Completion Result from Mini-Game
  const handleGameFinish = (result: MiniGameResult) => {
    setIsPlayingGame(false);

    // Track bots eliminated
    const newlyEliminatedContestants: Contestant[] = [];

    let updatedContestants = contestants.map((c) => {
      if (result.eliminatedBotIds.includes(c.id)) {
        newlyEliminatedContestants.push(c);
        return { ...c, isAlive: false, eliminatedInRound: currentRoundIndex + 1 };
      }
      return c;
    });

    setBotsDefeatedCount((b) => b + result.eliminatedBotIds.length);
    setAccumulatedScore((s) => s + result.playerScore);

    // Check player survival
    if (!result.playerWon || result.lostLife) {
      // Player eliminated
      sound.playEliminationSound();
      setPlayerLives(0);

      // Find player contestant
      const playerObj = updatedContestants.find((c) => c.isPlayer)!;
      playerObj.isAlive = false;
      playerObj.eliminatedInRound = currentRoundIndex + 1;
      newlyEliminatedContestants.push(playerObj);

      setContestants(updatedContestants);
      setRecentlyEliminated(newlyEliminatedContestants);
      setShowCeremony(true);
      return;
    }

    // Player survived!
    setContestants(updatedContestants);
    setRecentlyEliminated(newlyEliminatedContestants);
    setShowCeremony(true);
  };

  // Handle Proceeding after Elimination Ceremony
  const handleContinueAfterCeremony = () => {
    setShowCeremony(false);

    // If player died, finish tournament as loss
    if (playerLives <= 0) {
      finalizeTournament(false);
      return;
    }

    // Check if tournament is won (Round 4 finished)
    if (currentRoundIndex >= rounds.length - 1) {
      finalizeTournament(true);
      return;
    }

    // Next round!
    setCurrentRoundIndex((idx) => idx + 1);
    setShowHowToPlay(true);
  };

  // Finalize tournament outcomes and update persistence
  const finalizeTournament = (won: boolean) => {
    const finalRank = won ? 1 : Math.max(2, 8 - (currentRoundIndex * 2));
    const roundsSurvived = won ? 4 : currentRoundIndex + 1;
    const coinsEarned = won ? 500 : roundsSurvived * 60;
    const xpEarned = won ? 250 : roundsSurvived * 40;

    const outcome = addRewards(
      userProfile,
      coinsEarned,
      xpEarned,
      {
        wonTournament: won,
        botsEliminated: botsDefeatedCount,
        livesLeft: playerLives,
        reactionMs: 250,
      }
    );

    saveUserProfile(outcome.updatedProfile);
    onUpdateProfile(outcome.updatedProfile);

    onTournamentEnd({
      wonTournament: won,
      finalPosition: finalRank,
      botsDefeated: botsDefeatedCount,
      roundsSurvived,
      coinsEarned,
      xpEarned,
      leveledUp: outcome.leveledUp,
      newAchievements: outcome.newAchievements,
    });
  };

  if (!currentRound) return null;

  return (
    <div
      id="tournament-manager"
      className="w-full max-w-lg mx-auto flex flex-col justify-between p-3 select-none flex-1 min-h-[640px]"
    >
      {/* Universal In-Game HUD Header */}
      <Header
        currentRound={currentRoundIndex + 1}
        totalRounds={rounds.length}
        survivorsCount={activeContestants.length}
        lives={playerLives}
        gameName={currentRound.meta.title}
        onQuit={onExitToMenu}
      />

      {/* How to Play Modal with Countdown */}
      {showHowToPlay && (
        <HowToPlayModal
          meta={currentRound.meta}
          roundNumber={currentRoundIndex + 1}
          survivorsCount={activeContestants.length}
          eliminationCount={currentRound.eliminationCount}
          onStart={handleStartGame}
        />
      )}

      {/* Active Mini-Game Rendering */}
      {isPlayingGame && (
        <div className="w-full flex-1 flex flex-col items-center justify-center my-auto">
          {currentRound.gameId === 'red-green' && (
            <RedGreenRun
              activeContestants={activeContestants}
              eliminationCount={currentRound.eliminationCount}
              onFinish={handleGameFinish}
            />
          )}

          {currentRound.gameId === 'perfect-cut' && (
            <PerfectCut
              activeContestants={activeContestants}
              eliminationCount={currentRound.eliminationCount}
              onFinish={handleGameFinish}
            />
          )}

          {currentRound.gameId === 'memory-tiles' && (
            <MemoryTiles
              activeContestants={activeContestants}
              eliminationCount={currentRound.eliminationCount}
              onFinish={handleGameFinish}
            />
          )}

          {currentRound.gameId === 'number-bluff' && (
            <NumberBluff
              activeContestants={activeContestants}
              eliminationCount={currentRound.eliminationCount}
              onFinish={handleGameFinish}
            />
          )}

          {currentRound.gameId === 'color-switch' && (
            <ColorSwitch
              activeContestants={activeContestants}
              eliminationCount={currentRound.eliminationCount}
              onFinish={handleGameFinish}
            />
          )}

          {currentRound.gameId === 'safe-path' && (
            <SafePath
              activeContestants={activeContestants}
              eliminationCount={currentRound.eliminationCount}
              onFinish={handleGameFinish}
            />
          )}

          {currentRound.gameId === 'quick-tap' && (
            <QuickTap
              activeContestants={activeContestants}
              eliminationCount={currentRound.eliminationCount}
              onFinish={handleGameFinish}
            />
          )}

          {currentRound.gameId === 'balance-master' && (
            <BalanceMaster
              activeContestants={activeContestants}
              eliminationCount={currentRound.eliminationCount}
              onFinish={handleGameFinish}
            />
          )}

          {currentRound.gameId === 'number-race' && (
            <NumberRace
              activeContestants={activeContestants}
              eliminationCount={currentRound.eliminationCount}
              onFinish={handleGameFinish}
            />
          )}

          {currentRound.gameId === 'dodge-zone' && (
            <DodgeZone
              activeContestants={activeContestants}
              eliminationCount={currentRound.eliminationCount}
              onFinish={handleGameFinish}
            />
          )}

          {currentRound.gameId === 'stop-timer' && (
            <StopTimer
              activeContestants={activeContestants}
              eliminationCount={currentRound.eliminationCount}
              onFinish={handleGameFinish}
            />
          )}

          {currentRound.gameId === 'shape-match' && (
            <ShapeMatch
              activeContestants={activeContestants}
              eliminationCount={currentRound.eliminationCount}
              onFinish={handleGameFinish}
            />
          )}

          {currentRound.gameId === 'follow-leader' && (
            <FollowLeader
              activeContestants={activeContestants}
              eliminationCount={currentRound.eliminationCount}
              onFinish={handleGameFinish}
            />
          )}

          {currentRound.gameId === 'hidden-switch' && (
            <HiddenSwitch
              activeContestants={activeContestants}
              eliminationCount={currentRound.eliminationCount}
              onFinish={handleGameFinish}
            />
          )}

          {currentRound.gameId === 'final-choice' && (
            <FinalChoice
              activeContestants={activeContestants}
              onFinish={handleGameFinish}
            />
          )}
        </div>
      )}

      {/* Dramatic Elimination Ceremony Overlay */}
      {showCeremony && (
        <EliminationCeremony
          eliminatedContestants={recentlyEliminated}
          remainingContestants={activeContestants}
          roundNumber={currentRoundIndex + 1}
          isGameOver={playerLives <= 0}
          onContinue={handleContinueAfterCeremony}
        />
      )}
    </div>
  );
};
