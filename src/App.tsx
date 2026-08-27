import React, { useState, useEffect } from 'react';
import { UserProfile, MiniGameId, Achievement } from './types/game';
import { loadUserProfile, saveUserProfile } from './utils/storage';
import { sound } from './utils/soundEngine';

import { MainMenu } from './components/views/MainMenu';
import { TournamentManager } from './components/tournament/TournamentManager';
import { PracticeMode } from './components/views/PracticeMode';
import { LockerRoom } from './components/views/LockerRoom';
import { DailyChallengesModal } from './components/views/DailyChallengesModal';
import { TrophyRoom } from './components/views/TrophyRoom';
import { ResultsScreen } from './components/views/ResultsScreen';

type AppView = 'MAIN_MENU' | 'TOURNAMENT' | 'PRACTICE_SELECT' | 'LOCKER_ROOM' | 'TROPHY_ROOM' | 'RESULTS';

export default function App() {
  const [userProfile, setUserProfile] = useState<UserProfile>(loadUserProfile());
  const [currentView, setCurrentView] = useState<AppView>('MAIN_MENU');
  const [practiceGameId, setPracticeGameId] = useState<MiniGameId | null>(null);
  const [showDailyModal, setShowDailyModal] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Results State
  const [tournamentResults, setTournamentResults] = useState<{
    wonTournament: boolean;
    finalPosition: number;
    botsDefeated: number;
    roundsSurvived: number;
    coinsEarned: number;
    xpEarned: number;
    leveledUp: boolean;
    newAchievements: Achievement[];
  } | null>(null);

  // Sync mute state
  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    sound.setMuted(nextMute);
  };

  const handleStartTournament = () => {
    setPracticeGameId(null);
    setCurrentView('TOURNAMENT');
  };

  const handleSelectPracticeGame = (gameId: MiniGameId) => {
    setPracticeGameId(gameId);
    setCurrentView('TOURNAMENT');
  };

  const handleTournamentEnd = (results: {
    wonTournament: boolean;
    finalPosition: number;
    botsDefeated: number;
    roundsSurvived: number;
    coinsEarned: number;
    xpEarned: number;
    leveledUp: boolean;
    newAchievements: Achievement[];
  }) => {
    setTournamentResults(results);
    setCurrentView('RESULTS');
  };

  return (
    <main
      id="last-one-app"
      className="w-full min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-x-hidden font-sans selection:bg-amber-400 selection:text-black"
    >
      {/* Background Ambience / Grid */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black opacity-80 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(#3f3f46_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-lg min-h-screen sm:min-h-[720px] sm:my-4 sm:border sm:border-zinc-800 sm:rounded-[36px] bg-zinc-950/70 backdrop-blur-md flex flex-col justify-between shadow-2xl overflow-hidden">
        {currentView === 'MAIN_MENU' && (
          <MainMenu
            userProfile={userProfile}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onStartTournament={handleStartTournament}
            onOpenPractice={() => setCurrentView('PRACTICE_SELECT')}
            onOpenLockerRoom={() => setCurrentView('LOCKER_ROOM')}
            onOpenDailyChallenges={() => setShowDailyModal(true)}
            onOpenTrophyRoom={() => setCurrentView('TROPHY_ROOM')}
          />
        )}

        {currentView === 'TOURNAMENT' && (
          <TournamentManager
            userProfile={userProfile}
            practiceGameId={practiceGameId}
            onUpdateProfile={setUserProfile}
            onTournamentEnd={handleTournamentEnd}
            onExitToMenu={() => setCurrentView('MAIN_MENU')}
          />
        )}

        {currentView === 'PRACTICE_SELECT' && (
          <PracticeMode
            onSelectGame={handleSelectPracticeGame}
            onBack={() => setCurrentView('MAIN_MENU')}
          />
        )}

        {currentView === 'LOCKER_ROOM' && (
          <LockerRoom
            userProfile={userProfile}
            onUpdateProfile={setUserProfile}
            onBack={() => setCurrentView('MAIN_MENU')}
          />
        )}

        {currentView === 'TROPHY_ROOM' && (
          <TrophyRoom
            userProfile={userProfile}
            onBack={() => setCurrentView('MAIN_MENU')}
          />
        )}

        {currentView === 'RESULTS' && tournamentResults && (
          <ResultsScreen
            wonTournament={tournamentResults.wonTournament}
            finalPosition={tournamentResults.finalPosition}
            botsDefeated={tournamentResults.botsDefeated}
            roundsSurvived={tournamentResults.roundsSurvived}
            coinsEarned={tournamentResults.coinsEarned}
            xpEarned={tournamentResults.xpEarned}
            leveledUp={tournamentResults.leveledUp}
            newAchievements={tournamentResults.newAchievements}
            userProfile={userProfile}
            onPlayAgain={handleStartTournament}
            onMainMenu={() => setCurrentView('MAIN_MENU')}
          />
        )}
      </div>

      {/* Daily Challenges Modal Overlay */}
      {showDailyModal && (
        <DailyChallengesModal
          userProfile={userProfile}
          onUpdateProfile={setUserProfile}
          onClose={() => setShowDailyModal(false)}
        />
      )}
    </main>
  );
}
