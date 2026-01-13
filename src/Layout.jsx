import React from 'react';
import GameProvider from './components/game/GameProvider';
import TutorialProvider from './components/game/TutorialProvider';
import TutorialOverlay from './components/game/TutorialOverlay';

export default function Layout({ children }) {
  return (
    <GameProvider>
      <TutorialProvider>
        <TutorialOverlay />
        {children}
      </TutorialProvider>
    </GameProvider>
  );
}