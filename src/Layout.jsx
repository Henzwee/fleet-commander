import React from 'react';
import GameProvider from './components/game/GameProvider';

export default function Layout({ children }) {
  return (
    <GameProvider>
      {children}
    </GameProvider>
  );
}