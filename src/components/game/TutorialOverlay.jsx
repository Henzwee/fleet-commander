import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { useTutorial } from './TutorialProvider';
import { useGame } from './GameProvider';
import MANIDialog from './MANIDialog';
import { base44 } from '@/api/base44Client';

export default function TutorialOverlay() {
  const { tutorialActive, tutorialStep, advanceTutorial, completeTutorial } = useTutorial();
  const { updateGameState, gameState, ships, updateShip } = useGame();
  const navigate = useNavigate();
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMessages, setDialogMessages] = useState([]);

  // Step 8: Trigger forced encounter after dialogue
  useEffect(() => {
    if (tutorialActive && tutorialStep === 8) {
      triggerTutorialEncounter();
    }
  }, [tutorialStep, tutorialActive]);

  // Redirect to Main page when tutorial starts
  useEffect(() => {
    if (tutorialActive && tutorialStep === 0 && !showDialog) {
      navigate(createPageUrl('Main'));
    }
  }, [tutorialActive, tutorialStep]);

  useEffect(() => {
    if (!tutorialActive) return;

    switch (tutorialStep) {
      case 0:
        // Step 1: Welcome
        setDialogMessages([
          "Hello new franchisee! And welcome to Ship Faced Co.",
          "Where we handle all (monetary) intergalactic needs! Such as shipping, transportation, discovery, theft, bounty hunting",
          "M.A.N.I. updating...",
          "Shipping, transportation, discovery, and so much more\n(within legal limits)!",
          "Let's get you started with your first ship!"
        ]);
        setShowDialog(true);
        break;

      case 1:
        // Step 2: Force navigate to store
        navigate(createPageUrl('Market'));
        break;

      case 2:
        // Step 3: First ship purchase confirmation
        setDialogMessages([
          "It's not much to look at,\nor work in,\nor to operate,\nand is a huge legal liability…",
          "But you're official!",
          "Now let's get this clunker out there\nand making us some money!"
        ]);
        setShowDialog(true);
        break;

      case 3:
        // Step 4: Navigate to Main and wait for Jobs button click
        navigate(createPageUrl('Main'));
        break;

      case 7:
        // Step 7: Encounter explanation
        setDialogMessages([
          "Space is a dangerous place.",
          "Your ships will let you know\nif they find anything interesting.",
          "It's up to you to tell them\nto blow it up…\nor not."
        ]);
        setShowDialog(true);
        break;

      case 9:
        // Step 9: Post-encounter damage explanation
        setDialogMessages([
          "Well you made it through your first encounter,\nbut tore up your only ship in the process.",
          "Luckily Ship Faced Co. has a fresh shipment\nof supplies come in multiple times a day"
        ]);
        setShowDialog(true);
        break;

      case 10:
        // Step 10: Force navigate to Store for antimatter
        navigate(createPageUrl('Market'));
        break;

      case 11:
        // Step 11: After antimatter purchase
        setDialogMessages([
          "Now that we have what we need,\nwe can get this clunker back to work"
        ]);
        setShowDialog(true);
        break;

      case 12:
        // Step 12: Force navigate to Fleet for repair
        navigate(createPageUrl('FleetManagement'));
        break;

      case 14:
        // Step 14: Crystal tutorial
        setDialogMessages([
          "Rare crystals can be found out in space.",
          "Sometimes they're on planets,\nsometimes wrecked ships,\nand sometimes in other people's pockets.",
          "They are very valuable and can be traded\nfor money, gas, and specialty goods.",
          "They can also be used on your ship's\nhyperdrive to keep your efficiency up.\n\nThe way Ship Faced Co. likes it!"
        ]);
        setShowDialog(true);
        break;

      case 11:
        // Step 11: Tutorial completion
        setDialogMessages([
          "Just like that!",
          "Now that I've shown you the ropes,\nShip Faced Co. approves you\nto work at your own pace…",
          "So long as you behave."
        ]);
        setShowDialog(true);
        break;
    }
  }, [tutorialStep, tutorialActive]);

  const triggerTutorialEncounter = async () => {
    console.log('[TUTORIAL] Triggering forced encounter at step 8');
    
    // Find the active mission (should be the one just started)
    const activeMissions = await base44.entities.Mission.filter({ status: 'active' }, '-created_date', 1);
    if (activeMissions.length === 0) {
      console.error('[TUTORIAL] No active mission found');
      advanceTutorial();
      return;
    }

    const mission = activeMissions[0];
    const ship = ships.find(s => s.id === mission.shipId);
    
    if (!ship) {
      console.error('[TUTORIAL] Ship not found');
      advanceTutorial();
      return;
    }

    // Damage ship to 50% health
    await updateShip(ship.id, {
      health: 50,
      damaged: true,
      status: 'idle'
    });

    // Cancel the mission
    await base44.entities.Mission.update(mission.id, { status: 'failed' });

    console.log('[TUTORIAL] Encounter resolved, ship damaged to 50%');
    
    // Advance to next step (damage explanation)
    advanceTutorial();
  };

  const handleDialogComplete = async () => {
    setShowDialog(false);

    switch (tutorialStep) {
      case 0:
        // After welcome, advance to force store navigation
        advanceTutorial();
        break;

      case 2:
        // After ship purchase confirmation, advance to force home
        advanceTutorial();
        break;

      case 7:
        // After encounter explanation, advance to trigger encounter
        advanceTutorial();
        break;

      case 9:
        // After damage explanation, advance to store navigation
        advanceTutorial();
        break;

      case 11:
        // After repair explanation, advance to fleet navigation
        advanceTutorial();
        break;

      case 14:
        // After crystal tutorial, advance to time-skip mechanic
        advanceTutorial();
        break;

      case 16:
        // Tutorial complete - give rewards
        const newCredits = gameState.credits + 1000;
        const newCrystals = gameState.crystals + 5;
        const newFuel = gameState.fuel + 50;
        await updateGameState({
          credits: newCredits,
          crystals: newCrystals,
          fuel: newFuel
        });
        advanceTutorial();
        setTimeout(() => {
          completeTutorial();
        }, 500);
        break;

      default:
        advanceTutorial();
    }
  };

  if (!tutorialActive || !showDialog) return null;

  return <MANIDialog messages={dialogMessages} onComplete={handleDialogComplete} showProgress />;
}