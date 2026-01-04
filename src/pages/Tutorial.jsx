import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useGame } from '../components/game/GameProvider';
import DeviceFrame from '../components/game/DeviceFrame';
import { ChevronRight } from 'lucide-react';

export default function Tutorial() {
  const navigate = useNavigate();
  const { gameState, updateGameState, createRandomShip, addMessage } = useGame();
  const [step, setStep] = useState(0);
  const [tutorialShip, setTutorialShip] = useState(null);
  const [tutorialMission, setTutorialMission] = useState(null);
  
  const steps = [
    {
      title: 'Welcome, Commander',
      content: 'Congratulations on your new franchise! You\'ve been gifted the M.A.N.I. system (Mission Administration and Navigation Interface) and a small loan to get started.',
      action: 'BEGIN'
    },
    {
      title: 'Hire Your First Ship',
      content: 'Every fleet needs a crew. Let\'s hire your first ship. They might not be much, but they\'ll get the job done... probably.',
      action: 'HIRE SHIP',
      onAction: async () => {
        const ship = await createRandomShip('Unregistered');
        setTutorialShip(ship);
        addMessage(`${ship.name} has joined your fleet!`);
        return true;
      }
    },
    {
      title: 'Accept a Mission',
      content: 'Now that you have a ship, let\'s put them to work. Time to accept your first mission and start earning credits.',
      action: 'START MISSION',
      onAction: async () => {
        if (!tutorialShip) return false;
        
        const mission = await base44.entities.Mission.create({
          shipId: tutorialShip.id,
          shipName: tutorialShip.name,
          distance: 100,
          duration: 1,
          reward: 500,
          fuelCost: 10,
          startTime: new Date().toISOString(),
          status: 'active',
          description: 'Simple cargo delivery'
        });
        
        await base44.entities.Ship.update(tutorialShip.id, { status: 'active' });
        setTutorialMission(mission);
        addMessage(`${tutorialShip.name} departed on mission.`);
        return true;
      }
    },
    {
      title: 'Mission in Progress',
      content: 'Your ship is out there doing what they do best. In the real game, missions take time. But for now, let\'s skip ahead...',
      action: 'SKIP (Tutorial Only)',
      onAction: async () => {
        if (!tutorialMission || !tutorialShip) return false;
        
        // Simulate damage
        await base44.entities.Ship.update(tutorialShip.id, {
          damaged: true,
          health: 50,
          status: 'damaged'
        });
        
        await base44.entities.Mission.update(tutorialMission.id, { status: 'completed' });
        
        addMessage(`${tutorialShip.name} returned damaged but mission complete!`);
        return true;
      }
    },
    {
      title: 'Ship Damaged!',
      content: 'Uh oh. Your ship took some damage out there. You\'ll need to buy parts from the market to repair them.',
      action: 'GO TO MARKET',
      onAction: () => {
        navigate(createPageUrl('Market') + '?tutorial=parts');
        return false;
      }
    },
    {
      title: 'Repair Your Ship',
      content: 'Now that you have parts, head to Fleet Management to repair your ship. Damaged ships can\'t take new missions.',
      action: 'REPAIR SHIP',
      onAction: () => {
        navigate(createPageUrl('FleetManagement') + '?tutorial=repair');
        return false;
      }
    },
    {
      title: 'Tutorial Complete!',
      content: 'You\'re all set! Hire more ships, accept missions, and build your fleet empire. Remember: space is dangerous, so keep your ships maintained!',
      action: 'START PLAYING',
      onAction: async () => {
        await updateGameState({ tutorialCompleted: true });
        navigate(createPageUrl('Main'));
        return false;
      }
    }
  ];
  
  const currentStep = steps[step];
  
  const handleNext = async () => {
    if (currentStep.onAction) {
      const shouldContinue = await currentStep.onAction();
      if (shouldContinue) {
        setStep(step + 1);
      }
    } else {
      setStep(step + 1);
    }
  };
  
  return (
    <DeviceFrame title="TUTORIAL">
      <div className="flex flex-col items-center justify-center h-full p-6">
        <div className="bg-gradient-to-br from-gray-900 to-gray-950 border-2 border-cyan-500 rounded-lg p-6 max-w-md w-full border-glow-cyan">
          <div className="text-cyan-400 font-bold text-lg mb-4 text-center">{currentStep.title}</div>
          
          <div className="text-gray-300 text-sm leading-relaxed mb-6">
            {currentStep.content}
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-1">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full ${
                    idx === step ? 'bg-cyan-400' : idx < step ? 'bg-green-400' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
            <div className="text-xs text-gray-500">
              Step {step + 1} of {steps.length}
            </div>
          </div>
          
          <button
            onClick={handleNext}
            className="w-full bg-gradient-to-r from-cyan-600 to-cyan-700 border-2 border-cyan-500 rounded-lg p-4 flex items-center justify-center gap-2 text-white font-bold hover:from-cyan-500 hover:to-cyan-600 transition-all"
          >
            <span>{currentStep.action}</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </DeviceFrame>
  );
}