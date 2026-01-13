import React, { createContext, useContext, useState, useEffect } from 'react';
import { useGame } from './GameProvider';

const TutorialContext = createContext();

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) throw new Error('useTutorial must be used within TutorialProvider');
  return context;
};

export default function TutorialProvider({ children }) {
  const { gameState, updateGameState } = useGame();
  const [tutorialStep, setTutorialStep] = useState(0);
  const [tutorialActive, setTutorialActive] = useState(false);

  useEffect(() => {
    if (!gameState) return;
    
    // Check if tutorial should be active
    if (!gameState.tutorialCompleted) {
      setTutorialActive(true);
      // Load tutorial step from localStorage or start at 0
      const savedStep = localStorage.getItem('tutorial_step');
      setTutorialStep(savedStep ? parseInt(savedStep) : 0);
    } else {
      setTutorialActive(false);
    }
  }, [gameState?.tutorialCompleted]);

  const advanceTutorial = () => {
    const nextStep = tutorialStep + 1;
    setTutorialStep(nextStep);
    localStorage.setItem('tutorial_step', nextStep.toString());
  };

  const completeTutorial = async () => {
    await updateGameState({ tutorialCompleted: true });
    localStorage.removeItem('tutorial_step');
    setTutorialActive(false);
    setTutorialStep(0);
  };

  const value = {
    tutorialActive,
    tutorialStep,
    advanceTutorial,
    completeTutorial
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
}