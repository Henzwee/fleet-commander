import React, { createContext, useContext, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

const GameContext = createContext();

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within GameProvider');
  return context;
};

export default function GameProvider({ children }) {
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [currentEvent, setCurrentEvent] = useState(null);
  
  // Load or initialize game state
  useEffect(() => {
    loadGameState();
  }, []);
  
  // Tick system - check every 60 seconds
  useEffect(() => {
    if (!gameState) return;
    
    const interval = setInterval(() => {
      processTick();
    }, 60000); // 1 minute
    
    return () => clearInterval(interval);
  }, [gameState]);
  
  const loadGameState = async () => {
    try {
      const states = await base44.entities.GameState.list('-created_date', 1);
      if (!states || states.length === 0) {
        // Initialize new game
        const newState = await base44.entities.GameState.create({
          credits: 5000,
          fuel: 100,
          parts: {
            'Box of Tangled Wire': 5,
            'Rusty Screws': 3,
            'Wire Splice (Gum)': 2
          },
          tutorialCompleted: false,
          lastFuelRefill: new Date().toISOString(),
          lastMarketReset: new Date().toISOString(),
          autoResolve: false,
          highestTier: 'Unregistered'
        });
        setGameState(newState);
        setMessages(['M.A.N.I. system initialized. Welcome, Commander.']);
      } else {
        setGameState(states[0]);
        setMessages(['M.A.N.I. system online. Status: Operational.']);
      }
    } catch (error) {
      console.error('Failed to load game state:', error);
      // Initialize with default state if network fails
      setGameState({
        credits: 5000,
        fuel: 100,
        parts: {
          'Box of Tangled Wire': 5,
          'Rusty Screws': 3,
          'Wire Splice (Gum)': 2
        },
        tutorialCompleted: false,
        autoResolve: false,
        highestTier: 'Unregistered'
      });
      setMessages(['M.A.N.I. system online (offline mode).']);
    } finally {
      setLoading(false);
    }
  };
  
  const updateGameState = async (updates) => {
    try {
      const updated = await base44.entities.GameState.update(gameState.id, updates);
      setGameState(updated);
      return updated;
    } catch (error) {
      console.error('Failed to update game state:', error);
      throw error;
    }
  };
  
  const addMessage = (message) => {
    setMessages(prev => [...prev, message].slice(-10));
  };
  
  const processTick = async () => {
    try {
      // Process active missions
      const missions = await base44.entities.Mission.filter({ status: 'active' }, '-created_date', 50);
      
      for (const mission of missions) {
      const startTime = new Date(mission.startTime);
      const now = new Date();
      const hoursElapsed = Math.floor((now - startTime) / (1000 * 60 * 60));
      
      // Check if mission complete
      if (hoursElapsed >= mission.duration) {
        await completeMission(mission);
        continue;
      }
      
      // Roll for damage
      const ship = await base44.entities.Ship.filter({ id: mission.shipId });
      if (ship.length > 0) {
        await rollForDamage(ship[0], mission);
      }
      
      // Roll for distress signal (5% chance per hour)
      if (Math.random() < 0.05) {
        await createDistressEvent(mission);
      }
      
      // Roll for forgotten ship (25% chance)
      if (Math.random() < 0.25) {
        await createScavengeEvent(mission);
      }
    }
    
    // Check for daily fuel refill
    await checkDailyFuelRefill();
    
      // Check for market reset (every 6 hours)
      await checkMarketReset();
    } catch (error) {
      console.error('Error processing tick:', error);
    }
  };
  
  const rollForDamage = async (ship, mission) => {
    try {
      const tierDamageChance = {
        'Unregistered': 0.30,
        'Known': 0.25,
        'Notorious': 0.20,
        'Esteemed': 0.15,
        'Renowned': 0.10,
        'Legendary': 0.05
      };
      
      const damageChance = tierDamageChance[ship.tier] || 0.30;
      
      if (Math.random() < damageChance) {
        if (ship.damaged) {
          // Ship was already damaged - destroy it
          await base44.entities.Ship.update(ship.id, { 
            status: 'destroyed',
            health: 0
          });
          await base44.entities.Mission.update(mission.id, { status: 'failed' });
          addMessage(`${ship.name} has been destroyed!`);
          setCurrentEvent({
            type: 'explosion',
            shipName: ship.name,
            intensity: 2
          });
        } else {
          // First damage
          await base44.entities.Ship.update(ship.id, { 
            damaged: true,
            health: 50,
            status: 'damaged'
          });
          addMessage(`${ship.name} has taken damage!`);
          
          // Create decision event
          setCurrentEvent({
            title: `${ship.name} Damaged`,
            description: 'The ship has sustained damage. Recall for repairs or continue mission?',
            choices: [
              { id: 'recall', label: 'RECALL', primary: true },
              { id: 'continue', label: 'CARRY ON' }
            ],
            shipId: ship.id,
            missionId: mission.id,
            type: 'damage'
          });
        }
      }
    } catch (error) {
      console.error('Error rolling for damage:', error);
    }
  };
  
  const createDistressEvent = async (mission) => {
    setCurrentEvent({
      title: 'Distress Signal Detected',
      description: 'A distress beacon has been detected nearby. Investigate?',
      choices: [
        { id: 'investigate', label: 'INVESTIGATE', primary: true },
        { id: 'ignore', label: 'IGNORE' }
      ],
      missionId: mission.id,
      type: 'distress',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    });
    
    addMessage('Distress signal detected. Awaiting orders.');
  };
  
  const createScavengeEvent = async (mission) => {
    const ship = await base44.entities.Ship.filter({ id: mission.shipId });
    
    setCurrentEvent({
      title: 'Long-Forgotten Ship Found',
      description: `${ship[0]?.name} has discovered a derelict vessel. Scavenge for parts?`,
      choices: [
        { id: 'scavenge', label: 'SCAVENGE', primary: true },
        { id: 'leave', label: 'LEAVE IT' }
      ],
      missionId: mission.id,
      type: 'scavenge'
    });
    
    addMessage('Derelict ship detected. Potential salvage available.');
  };
  
  const completeMission = async (mission) => {
    await base44.entities.Mission.update(mission.id, { status: 'completed' });

    const ship = await base44.entities.Ship.filter({ id: mission.shipId });
    if (ship.length > 0) {
      await base44.entities.Ship.update(ship[0].id, { status: 'idle' });
    }

    // Roll for fuel reward
    const rand = Math.random();
    let fuelReward = 0;
    if (rand < 0.25) {
      fuelReward = 0;
    } else if (rand < 0.65) {
      fuelReward = 10;
    } else if (rand < 0.90) {
      fuelReward = 15;
    } else {
      fuelReward = 20;
    }

    // Award credits and fuel
    const newCredits = gameState.credits + mission.reward;
    const newFuel = gameState.fuel + fuelReward;
    await updateGameState({ credits: newCredits, fuel: newFuel });

    if (fuelReward > 0) {
      addMessage(`Mission completed! ${mission.shipName} earned $${mission.reward} and ${fuelReward} fuel.`);
    } else {
      addMessage(`Mission completed! ${mission.shipName} earned $${mission.reward}.`);
    }
  };
  
  const handleEventChoice = async (choiceId) => {
    if (!currentEvent) return;
    
    switch (currentEvent.type) {
      case 'damage':
        if (choiceId === 'recall') {
          const ship = await base44.entities.Ship.filter({ id: currentEvent.shipId });
          await base44.entities.Ship.update(currentEvent.shipId, { status: 'idle' });
          await base44.entities.Mission.update(currentEvent.missionId, { status: 'failed' });
          addMessage(`${ship[0]?.name} recalled safely.`);
        } else {
          addMessage('Ship continuing mission despite damage...');
        }
        break;
        
      case 'distress':
        if (choiceId === 'investigate') {
          // 75% real ship
          if (Math.random() < 0.75) {
            addMessage('Ship in distress rescued. They\'ve joined your fleet!');
            // Create new ship based on rarity
            const tier = rollShipTier();
            await createRandomShip(tier);
          } else {
            addMessage('False alarm. No ship found.');
          }
        } else {
          addMessage('Distress signal ignored.');
        }
        break;
        
      case 'scavenge':
        if (choiceId === 'scavenge') {
          // Roll for parts
          const partsFound = Math.random() < 0.5 ? 2 : (Math.random() < 0.75 ? 3 : 4);
          const partNames = [
            'Box of Tangled Wire', 'Rusty Screws', 'Cracked Glass', 
            'Wire Splice (Gum)', 'Stripped Bolts'
          ];
          
          const newParts = { ...gameState.parts };
          for (let i = 0; i < partsFound; i++) {
            const partName = partNames[Math.floor(Math.random() * partNames.length)];
            newParts[partName] = (newParts[partName] || 0) + 1;
          }
          
          await updateGameState({ parts: newParts });
          addMessage(`Salvaged ${partsFound} parts from derelict vessel.`);
        } else {
          addMessage('Derelict vessel left undisturbed.');
        }
        break;
    }
    
    setCurrentEvent(null);
  };
  
  const rollShipTier = () => {
    const rand = Math.random();
    if (rand < 0.30) return 'Unregistered';
    if (rand < 0.55) return 'Known';
    if (rand < 0.75) return 'Notorious';
    if (rand < 0.90) return 'Esteemed';
    if (rand < 0.98) return 'Renowned';
    return 'Legendary';
  };
  
  const createRandomShip = async (tier) => {
    const names = ['Starlight', 'Nebula', 'Phoenix', 'Ranger', 'Comet', 'Eclipse'];
    const name = names[Math.floor(Math.random() * names.length)] + ' ' + Math.floor(Math.random() * 1000);
    
    const tierPay = {
      'Unregistered': [200, 500],
      'Known': [250, 750],
      'Notorious': [300, 900],
      'Esteemed': [500, 1100],
      'Renowned': [750, 1800],
      'Legendary': [1000, 2000]
    };
    
    const [min, max] = tierPay[tier];
    const hourlyPay = Math.floor(Math.random() * (max - min + 1)) + min;
    
    return await base44.entities.Ship.create({
      name,
      tier,
      health: 100,
      damaged: false,
      status: 'idle',
      isHired: true,
      hourlyPay
    });
  };
  
  const checkDailyFuelRefill = async () => {
    const lastRefill = new Date(gameState.lastFuelRefill);
    const now = new Date();
    const hoursSinceRefill = (now - lastRefill) / (1000 * 60 * 60);
    
    if (hoursSinceRefill >= 24) {
      await updateGameState({
        fuel: gameState.fuel + 50,
        lastFuelRefill: now.toISOString()
      });
      addMessage('Daily fuel ration received: +50 fuel.');
    }
  };
  
  const checkMarketReset = async () => {
    const lastReset = new Date(gameState.lastMarketReset);
    const now = new Date();
    const hoursSinceReset = (now - lastReset) / (1000 * 60 * 60);
    
    if (hoursSinceReset >= 6) {
      await updateGameState({
        lastMarketReset: now.toISOString()
      });
      addMessage('Market inventory refreshed.');
    }
  };
  
  const value = {
    gameState,
    loading,
    messages,
    currentEvent,
    updateGameState,
    addMessage,
    handleEventChoice,
    createRandomShip,
    rollShipTier
  };
  
  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}