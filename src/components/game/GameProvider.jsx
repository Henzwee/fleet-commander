import React, { createContext, useContext, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getRandomShipImage } from './ShipImages';
import { getTierConfig } from './ShipTierConfig';

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
  const queryClient = useQueryClient();
  
  // Centralized ship inventory with React Query
  const { data: ships = [], isLoading: shipsLoading } = useQuery({
    queryKey: ['ships', 'inventory'],
    queryFn: async () => {
      console.log('[INVENTORY] Loading ships from database...');
      const allShips = await base44.entities.Ship.filter({ isHired: true }, '-created_date', 100);
      console.log('[INVENTORY] Loaded ships:', allShips.length, 'ships');
      return allShips || [];
    },
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 60000, // Keep in cache for 1 minute
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  
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
        // Initialize new game - clear any old tutorial progress
        localStorage.removeItem('tutorial_step');

        // Initialize market stock with 6 random items
        const allItemIds = ['cracked_glass', 'evil_ai', 'rusty_screws', 'wire_splice', 'antimatter', 'sci_fi_panel', 'tangled_wire', 'stripped_bolts', 'outdated_map', 'expired_food'];
        const shuffled = allItemIds.sort(() => Math.random() - 0.5);
        const selectedIds = shuffled.slice(0, 6);
        const initialStock = { shipStock: 5 };
        selectedIds.forEach(itemId => {
          initialStock[itemId] = Math.floor(Math.random() * 5) + 1; // 1-5 stock
        });

        const newState = await base44.entities.GameState.create({
          credits: 5000,
          crystals: 10,
          fuel: 50,
          parts: {
            'Box of tangled wire': 5,
            'Rusty screws': 3,
            'Wire splice': 2
          },
          tutorialCompleted: true,
          lastFuelRefill: new Date().toISOString(),
          lastMarketReset: new Date().toISOString(),
          autoResolve: false,
          highestTier: 'Unregistered',
          marketStock: initialStock,
          marketRotationHistory: [selectedIds]
        });
        setGameState(newState);
        setMessages(['M.A.N.I. system initialized. Welcome, Commander.']);
      } else {
        let state = states[0];

        // Fix existing game states that don't have market stock
        if (!state.marketStock || Object.keys(state.marketStock).filter(k => k !== 'shipStock').length === 0) {
          const allItemIds = ['cracked_glass', 'evil_ai', 'rusty_screws', 'wire_splice', 'antimatter', 'sci_fi_panel', 'tangled_wire', 'stripped_bolts', 'outdated_map', 'expired_food'];
          const shuffled = allItemIds.sort(() => Math.random() - 0.5);
          const selectedIds = shuffled.slice(0, 6);
          const initialStock = { shipStock: 5 };
          selectedIds.forEach(itemId => {
            initialStock[itemId] = Math.floor(Math.random() * 5) + 1;
          });

          state = await base44.entities.GameState.update(state.id, {
            marketStock: initialStock,
            marketRotationHistory: [selectedIds]
          });
        }

        setGameState(state);

        // Clean up orphaned ships (active status but no active mission)
        await cleanupOrphanedShips();

        // Random startup messages
        const startupMessages = [
          'M.A.N.I. system online. Now with 0.025% less sarcasm!',
          'M.A.N.I. system online. Deleting 537 messages from corporate.',
          'M.A.N.I. system online. Productivity mode enabled. Empathy module… pending.',
          'M.A.N.I. system online. All systems nominal. (Definitions of \'nominal\' may vary.)',
          'M.A.N.I. system online. Running diagnostics… ignoring minor ethical concerns.',
          'M.A.N.I. system online. I missed you. Logically speaking.',
          'M.A.N.I. system online. Let\'s try not to lose anything important today.'
        ];
        const randomMessage = startupMessages[Math.floor(Math.random() * startupMessages.length)];
        setMessages([randomMessage]);
      }
    } catch (error) {
      console.error('Failed to load game state:', error);
      // Initialize with default state if network fails
      setGameState({
        credits: 5000,
        crystals: 50,
        fuel: 100,
        parts: {
          'Box of tangled wire': 5,
          'Rusty screws': 3,
          'Wire splice': 2
        },
        tutorialCompleted: false,
        autoResolve: false,
        highestTier: 'Unregistered',
        marketStock: {}
      });
      setMessages(['M.A.N.I. system online (offline mode).']);
    } finally {
      setLoading(false);
    }
  };

  const cleanupOrphanedShips = async () => {
    try {
      // Get all active missions
      const activeMissions = await base44.entities.Mission.filter({ status: 'active' }, '-created_date', 50);
      const activeShipIds = new Set();

      // Collect all ship IDs that are actually on active missions
      activeMissions.forEach(mission => {
        if (mission.ships) {
          mission.ships.forEach(ship => {
            if (ship.status === 'active') {
              activeShipIds.add(ship.shipId);
            }
          });
        }
      });

      // Get all ships with active or damaged status
      const allShips = await base44.entities.Ship.filter({ isHired: true }, '-created_date', 100);
      const orphanedShips = allShips.filter(ship => 
        ship.status === 'active' && !activeShipIds.has(ship.id)
      );

      // Reset orphaned ships to idle (unless damaged)
      for (const ship of orphanedShips) {
        const newStatus = ship.health < 100 ? 'damaged' : 'idle';
        await base44.entities.Ship.update(ship.id, { status: newStatus });
        console.log(`[CLEANUP] Reset orphaned ship ${ship.name} to ${newStatus}`);
      }

      if (orphanedShips.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['ships', 'inventory'] });
      }
    } catch (error) {
      console.error('Error cleaning up orphaned ships:', error);
    }
  };
  
  const updateGameState = async (updates) => {
    try {
      if (!gameState?.id) {
        console.error('Cannot update game state: no id found');
        return gameState;
      }
      const updated = await base44.entities.GameState.update(gameState.id, updates);
      setGameState(updated);
      return updated;
    } catch (error) {
      console.error('Failed to update game state:', error);
      throw error;
    }
  };
  
  // Update a single ship without refetching all ships
  const updateShip = async (shipId, updates) => {
    console.log('[INVENTORY] Updating ship:', shipId, updates);
    try {
      const updatedShip = await base44.entities.Ship.update(shipId, updates);
      
      // Update the ship in the cache
      queryClient.setQueryData(['ships', 'inventory'], (oldShips = []) => {
        const newShips = oldShips.map(ship => 
          ship.id === shipId ? { ...ship, ...updatedShip } : ship
        );
        console.log('[INVENTORY] Ship updated in cache. Total ships:', newShips.length);
        return newShips;
      });
      
      return updatedShip;
    } catch (error) {
      console.error('[INVENTORY] Failed to update ship:', error);
      throw error;
    }
  };
  
  // Remove ship from inventory (fire/destroy)
  const removeShip = async (shipId) => {
    console.log('[INVENTORY] Removing ship:', shipId);
    try {
      await base44.entities.Ship.update(shipId, { isHired: false });
      
      // Remove from cache
      queryClient.setQueryData(['ships', 'inventory'], (oldShips = []) => {
        const newShips = oldShips.filter(ship => ship.id !== shipId);
        console.log('[INVENTORY] Ship removed from cache. Remaining ships:', newShips.length);
        return newShips;
      });
    } catch (error) {
      console.error('[INVENTORY] Failed to remove ship:', error);
      throw error;
    }
  };
  
  // Add new ship to inventory
  const addShip = async (shipData) => {
    console.log('[INVENTORY] Adding new ship:', shipData.name);
    try {
      const newShip = await base44.entities.Ship.create(shipData);
      
      // Add to cache
      queryClient.setQueryData(['ships', 'inventory'], (oldShips = []) => {
        const newShips = [...oldShips, newShip];
        console.log('[INVENTORY] Ship added to cache. Total ships:', newShips.length);
        return newShips;
      });
      
      return newShip;
    } catch (error) {
      console.error('[INVENTORY] Failed to add ship:', error);
      throw error;
    }
  };
  
  // Refresh ships from database
  const refreshShips = () => {
    console.log('[INVENTORY] Manual refresh requested');
    queryClient.invalidateQueries({ queryKey: ['ships', 'inventory'] });
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

        // Initialize damage tracking if not exists
        if (!mission.damageHoursChecked) {
          mission.damageHoursChecked = [];
        }

        // Roll for damage for each active ship - but only once per hour
        const currentShips = queryClient.getQueryData(['ships', 'inventory']) || [];
        for (let hour = 1; hour <= hoursElapsed; hour++) {
          if (!mission.damageHoursChecked.includes(hour)) {
            // Mark this hour as checked
            mission.damageHoursChecked.push(hour);
            await base44.entities.Mission.update(mission.id, { 
              damageHoursChecked: mission.damageHoursChecked 
            });

            // Roll damage for each active ship this hour
            for (const missionShip of mission.ships || []) {
              if (missionShip.status === 'active') {
                const ship = currentShips.find(s => s.id === missionShip.shipId);
                if (ship) {
                  await rollForDamage(ship, mission, hour);
                }
              }
            }
          }
        }

        // Roll for special encounters (15% chance)
        if (Math.random() < 0.15) {
          const encounterType = Math.floor(Math.random() * 4);
          switch (encounterType) {
            case 0: await createDistressEvent(mission); break;
            case 1: await createPlanetDiscoveryEvent(mission); break;
            case 2: await createScavengeEvent(mission); break;
            case 3: await createHostileFleetEvent(mission); break;
          }
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
  
  const rollForDamage = async (ship, mission, currentHour) => {
    try {
      const tierDamageChance = {
        'Unregistered': 0.50,
        'Known': 0.40,
        'Notorious': 0.30,
        'Esteemed': 0.20,
        'Renowned': 0.10,
        'Legendary': 0.05
      };

      const damageChance = tierDamageChance[ship.tier] || 0.50;

      if (Math.random() < damageChance) {
        // Reduce health by 25%
        const newHealth = Math.max(0, ship.health - 25);

        if (newHealth === 0) {
          // Ship destroyed
          console.log('[INVENTORY] Ship destroyed:', ship.name);
          await updateShip(ship.id, { 
            status: 'destroyed',
            health: 0,
            damaged: true
          });

          // Update mission ship status
          const updatedShips = mission.ships.map(s => 
            s.shipId === ship.id ? { ...s, status: 'destroyed' } : s
          );
          const anyActive = updatedShips.some(s => s.status === 'active');
          await base44.entities.Mission.update(mission.id, { 
            ships: updatedShips,
            status: anyActive ? 'active' : 'failed'
          });

          addMessage(`${ship.name} has been totaled. They're getting towed back.`);
          setCurrentEvent({
            type: 'explosion',
            shipName: ship.name,
            intensity: 2
          });
        } else {
          // Take damage
          console.log('[INVENTORY] Ship damaged:', ship.name);
          await updateShip(ship.id, { 
            damaged: true,
            health: newHealth,
            status: 'damaged'
          });
          
          // Random damage messages
          const damageMessages = [
            `${ship.name} got too comfortable flying through an asteroid field.`,
            `${ship.name}'s autopilot was trusted. Autopilot was wrong.`,
            `${ship.name} tested structural integrity. Results recorded.`,
            `${ship.name} encountered pirates. Then encountered their firearms.`,
            `${ship.name} clipped a derelict that was less derelict than advertised.`,
            `${ship.name} attempted a shortcut.`,
            `${ship.name} chose speed over safety.`,
            `${ship.name} exceeded acceptable risk tolerance.`,
            `${ship.name} failed to maximize long-term asset value.`
          ];
          const randomDamage = damageMessages[Math.floor(Math.random() * damageMessages.length)];
          addMessage(randomDamage);

          // Create decision event
          setCurrentEvent({
            title: `${ship.name} Taking Damage`,
            description: `${ship.name} took some damage out there. She's still flying but... barely. Recommend immediate recall, but we could risk it if you're feeling lucky.`,
            choices: [
              { id: 'recall', label: 'RECALL NOW', primary: true },
              { id: 'continue', label: 'RISK IT' }
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
    // Get the first active ship from the mission
    const activeShip = mission.ships?.find(s => s.status === 'active');
    if (!activeShip) return;

    const currentShips = queryClient.getQueryData(['ships', 'inventory']) || [];
    const ship = currentShips.find(s => s.id === activeShip.shipId);
    const shipName = ship?.name || 'Unknown Ship';

    setCurrentEvent({
      title: 'Distress Signal Detected',
      description: `${shipName} picked up a distress signal. It clearly states in the employee handbook not to investigate such things. But the ship's captain believes there's a chance to salvage some good loot. You make the call.`,
      choices: [
        { id: 'investigate', label: 'CHECK IT OUT', primary: true },
        { id: 'ignore', label: 'FOLLOW POLICY' }
      ],
      missionId: mission.id,
      shipId: ship?.id,
      shipTier: ship?.tier,
      type: 'distress',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    });

    addMessage(`${shipName} detected distress signal. Awaiting orders.`);
  };
  
  const createPlanetDiscoveryEvent = async (mission) => {
    const activeShip = mission.ships?.find(s => s.status === 'active');
    if (!activeShip) return;

    const currentShips = queryClient.getQueryData(['ships', 'inventory']) || [];
    const ship = currentShips.find(s => s.id === activeShip.shipId);
    const shipName = ship?.name || 'Unknown Ship';

    setCurrentEvent({
      title: 'New Planet Discovered',
      description: `${shipName} has discovered a new planet. Ship Faced policy states that such planets shall be taken in their name. There's sure to be a substantial reward.`,
      choices: [
        { id: 'claim', label: 'CLAIM', primary: true },
        { id: 'ignore', label: 'IGNORE' }
      ],
      missionId: mission.id,
      shipId: ship?.id,
      type: 'planet_discovery',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    });

    addMessage(`${shipName} discovered an uncharted planet.`);
  };

  const createHostileFleetEvent = async (mission) => {
    const activeShip = mission.ships?.find(s => s.status === 'active');
    if (!activeShip) return;

    const currentShips = queryClient.getQueryData(['ships', 'inventory']) || [];
    const ship = currentShips.find(s => s.id === activeShip.shipId);
    const shipName = ship?.name || 'Unknown Ship';

    setCurrentEvent({
      title: 'Hostile Fleet Detected',
      description: `${shipName} is reporting a fleet of hostile ships warping in on their location. Handbook says it's best to surrender in these situations, but the captain believes he can take them.`,
      choices: [
        { id: 'fight', label: 'FIGHT', primary: true },
        { id: 'surrender', label: 'SURRENDER' }
      ],
      missionId: mission.id,
      shipId: ship?.id,
      totalWages: activeShip.hourlyPay * mission.duration,
      type: 'hostile_fleet',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    });

    addMessage(`${shipName} detected hostile fleet approaching!`);
  };

  const createScavengeEvent = async (mission) => {
    const ship = await base44.entities.Ship.filter({ id: mission.shipId });
    const shipName = ship[0]?.name || 'Unknown Ship';

    setCurrentEvent({
      title: 'Derelict Vessel Located',
      description: `${shipName} found a beat-up wreck floating around. Looks like scrap material, but it'll take time to salvage. We got time for this?`,
      choices: [
        { id: 'scavenge', label: 'SALVAGE IT', primary: true },
        { id: 'leave', label: 'LEAVE IT' }
      ],
      missionId: mission.id,
      type: 'scavenge'
    });

    addMessage(`${shipName} found salvageable wreckage.`);
  };
  
  const completeMission = async (mission) => {
    console.log('[INVENTORY] Mission completed:', mission.id);
    await base44.entities.Mission.update(mission.id, { status: 'completed' });

    // Update all active ships to idle
    for (const missionShip of mission.ships || []) {
      if (missionShip.status === 'active') {
        await updateShip(missionShip.shipId, { status: 'idle' });
      }
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

    // Calculate total wages from all active ships
    const activeShips = mission.ships.filter(s => s.status === 'active');
    const totalWages = activeShips.reduce((sum, ship) => {
      return sum + (ship.hourlyPay * mission.duration);
    }, 0);
    
    // Award parts reward
    const partsReward = mission.partsReward || 0;
    const newParts = { ...gameState.parts };
    
    // Generate random parts
    const partsList = [
      'Box of tangled wire', 'Rusty screws', 'Cracked glass',
      'Wire splice', 'Stripped bolts', 'Reformed evil AI',
      'Outdated map', 'Mostly stable antimatter', 'Expired food rations',
      'Sci-fi looking panel'
    ];
    
    for (let i = 0; i < partsReward; i++) {
      const randomPart = partsList[Math.floor(Math.random() * partsList.length)];
      newParts[randomPart] = (newParts[randomPart] || 0) + 1;
    }
    
    const newFuel = gameState.fuel + fuelReward;
    await updateGameState({ credits: gameState.credits + totalWages, fuel: newFuel, parts: newParts });

    const shipNames = activeShips.map(s => s.shipName).join(', ');

    if (fuelReward > 0) {
      addMessage(`Mission completed! ${shipNames} earned $${totalWages} wages, ${partsReward} parts, and ${fuelReward} fuel.`);
    } else {
      addMessage(`Mission completed! ${shipNames} earned $${totalWages} wages and ${partsReward} parts.`);
    }
  };
  
  const handleEventChoice = async (choiceId) => {
    if (choiceId === 'tow_back') {
      // Handle towing destroyed ships back
      return;
    }

    if (!currentEvent) return;
    
    switch (currentEvent.type) {
      case 'damage':
        if (choiceId === 'recall') {
          const currentShips = queryClient.getQueryData(['ships', 'inventory']) || [];
          const ship = currentShips.find(s => s.id === currentEvent.shipId);
          
          // Calculate hourly wage for time worked
          const mission = await base44.entities.Mission.filter({ id: currentEvent.missionId });
          if (mission[0]) {
            const startTime = new Date(mission[0].startTime);
            const now = new Date();
            const hoursWorked = Math.max(1, Math.floor((now - startTime) / (1000 * 60 * 60)));
            
            const missionShip = mission[0].ships.find(s => s.shipId === currentEvent.shipId);
            const hourlyWage = hoursWorked * (missionShip?.hourlyPay || 0);
            
            // Pay the ship and update mission
            await updateGameState({ credits: gameState.credits + hourlyWage });
            
            const updatedShips = mission[0].ships.map(s => 
              s.shipId === currentEvent.shipId ? { ...s, status: 'recalled' } : s
            );
            const anyActive = updatedShips.some(s => s.status === 'active');
            
            await base44.entities.Mission.update(currentEvent.missionId, { 
              ships: updatedShips,
              status: anyActive ? 'active' : 'failed'
            });
            
            addMessage(`${ship?.name} recalled safely. Earned $${hourlyWage} (${hoursWorked}h).`);
          }
          
          await updateShip(currentEvent.shipId, { status: 'idle' });
        } else {
          addMessage('Ship continuing mission despite damage...');
        }
        break;
        
      case 'distress':
        if (choiceId === 'investigate') {
          const currentShips = queryClient.getQueryData(['ships', 'inventory']) || [];
          const ship = currentShips.find(s => s.id === currentEvent.shipId);
          const shipName = ship?.name || 'Unknown Ship';

          // Calculate success rate based on tier
          const tierSuccessRate = {
            'Unregistered': 0.50,
            'Known': 0.55,
            'Notorious': 0.60,
            'Esteemed': 0.65,
            'Renowned': 0.70,
            'Legendary': 0.75
          };

          const successRate = tierSuccessRate[currentEvent.shipTier] || 0.50;

          if (Math.random() < successRate) {
            // Success - choose one of two outcomes
            const bonusCredits = Math.floor(Math.random() * 500) + 300; // 300-800 credits
            const bonusParts = Math.floor(Math.random() * 3) + 2; // 2-4 parts

            const partsList = [
              'Box of tangled wire', 'Rusty screws', 'Cracked glass',
              'Wire splice', 'Stripped bolts', 'Reformed evil AI',
              'Outdated map', 'Mostly stable antimatter', 'Expired food rations',
              'Sci-fi looking panel'
            ];

            const newParts = { ...gameState.parts };
            for (let i = 0; i < bonusParts; i++) {
              const randomPart = partsList[Math.floor(Math.random() * partsList.length)];
              newParts[randomPart] = (newParts[randomPart] || 0) + 1;
            }

            await updateGameState({ 
              credits: gameState.credits + bonusCredits,
              parts: newParts
            });

            // Pick one of two success messages
            const successMessage = Math.random() < 0.5
              ? `Just some lightly armored pirates. ${shipName} only shot a warning shot before they flew away, tail between the legs. The ship under attack thanked us with some credits and spare parts.`
              : `This ship must have been floating around for years. It was completely vacant. Luckily, they left some good loot behind. ${shipName} will collect it and get back to work.`;

            addMessage(successMessage);

            // Store result on mission for display
            const mission = await base44.entities.Mission.filter({ id: currentEvent.missionId });
            if (mission[0]) {
              await base44.entities.Mission.update(currentEvent.missionId, {
                encounterResult: `+${bonusParts} parts, +$${bonusCredits}`
              });
            }
          } else {
            // Failure - ship takes 50% damage
            const newHealth = Math.max(0, ship.health - 50);
            await updateShip(currentEvent.shipId, {
              health: newHealth,
              damaged: newHealth < 100,
              status: newHealth === 0 ? 'destroyed' : 'damaged'
            });

            // Update mission ship status if destroyed
            if (newHealth === 0) {
              const mission = await base44.entities.Mission.filter({ id: currentEvent.missionId });
              if (mission[0]) {
                const updatedShips = mission[0].ships.map(s => 
                  s.shipId === currentEvent.shipId ? { ...s, status: 'destroyed' } : s
                );
                const anyActive = updatedShips.some(s => s.status === 'active');
                await base44.entities.Mission.update(currentEvent.missionId, {
                  ships: updatedShips,
                  status: anyActive ? 'active' : 'failed',
                  encounterResult: `-50% damage (DESTROYED)`
                });
              }
            } else {
              const mission = await base44.entities.Mission.filter({ id: currentEvent.missionId });
              if (mission[0]) {
                await base44.entities.Mission.update(currentEvent.missionId, {
                  encounterResult: `-50% damage`
                });
              }
            }

            // Pick one of two failure messages
            const failureMessage = Math.random() < 0.5
              ? `${shipName} made it to the signal's origin. Unfortunately they were greatly outnumbered by pirates. They managed to escape, but not without taking heavy damage.`
              : `${shipName} made it too the distress signal, but it turned out to be a trap. They managed to escape but not without taking heavy damage. They're getting back to the task at hand now and are hoping this doesn't get brought up again.`;

            addMessage(failureMessage);
          }
        } else {
          addMessage('Distress signal ignored.');
        }
        break;
        
      case 'hostile_fleet':
        if (choiceId === 'fight') {
          const currentShips = queryClient.getQueryData(['ships', 'inventory']) || [];
          const ship = currentShips.find(s => s.id === currentEvent.shipId);
          const shipName = ship?.name || 'Unknown Ship';

          if (Math.random() < 0.5) {
            // Success - reward credits and parts
            const bonusCredits = Math.floor(Math.random() * 501) + 800; // 800-1300
            const bonusParts = Math.floor(Math.random() * 3) + 3; // 3-5 parts

            const partsList = [
              'Box of tangled wire', 'Rusty screws', 'Cracked glass',
              'Wire splice', 'Stripped bolts', 'Reformed evil AI',
              'Outdated map', 'Mostly stable antimatter', 'Expired food rations',
              'Sci-fi looking panel'
            ];

            const newParts = { ...gameState.parts };
            for (let i = 0; i < bonusParts; i++) {
              const randomPart = partsList[Math.floor(Math.random() * partsList.length)];
              newParts[randomPart] = (newParts[randomPart] || 0) + 1;
            }

            await updateGameState({ 
              credits: gameState.credits + bonusCredits,
              parts: newParts
            });

            const mission = await base44.entities.Mission.filter({ id: currentEvent.missionId });
            if (mission[0]) {
              await base44.entities.Mission.update(currentEvent.missionId, {
                encounterResult: `+${bonusParts} parts, +$${bonusCredits} (hostile victory)`
              });
            }

            addMessage(`After some fancy flying, and lack of concern for the crew, the hostiles were defeated.`);
          } else {
            // Failure - 50% damage
            const newHealth = Math.max(0, ship.health - 50);
            await updateShip(currentEvent.shipId, {
              health: newHealth,
              damaged: newHealth < 100,
              status: newHealth === 0 ? 'destroyed' : 'damaged'
            });

            if (newHealth === 0) {
              const mission = await base44.entities.Mission.filter({ id: currentEvent.missionId });
              if (mission[0]) {
                const updatedShips = mission[0].ships.map(s => 
                  s.shipId === currentEvent.shipId ? { ...s, status: 'destroyed' } : s
                );
                const anyActive = updatedShips.some(s => s.status === 'active');
                await base44.entities.Mission.update(currentEvent.missionId, {
                  ships: updatedShips,
                  status: anyActive ? 'active' : 'failed',
                  encounterResult: `-50% damage (DESTROYED - hostile fleet)`
                });
              }
            } else {
              const mission = await base44.entities.Mission.filter({ id: currentEvent.missionId });
              if (mission[0]) {
                await base44.entities.Mission.update(currentEvent.missionId, {
                  encounterResult: `-50% damage (hostile fleet)`
                });
              }
            }

            addMessage(`It was a resilient effort, but you were no match for the hostile fleet. You managed to escape, but not without paying the price.`);
          }
        } else {
          // Surrender - lose 50% of mission reward
          const mission = await base44.entities.Mission.filter({ id: currentEvent.missionId });
          if (mission[0]) {
            const activeShip = mission[0].ships.find(s => s.shipId === currentEvent.shipId);
            const lostWages = Math.floor((activeShip?.hourlyPay || 0) * mission[0].duration * 0.5);

            await base44.entities.Mission.update(currentEvent.missionId, {
              encounterResult: `-$${lostWages} (surrendered)`
            });

            // Reduce wages for this ship only
            const updatedShips = mission[0].ships.map(s => 
              s.shipId === currentEvent.shipId 
                ? { ...s, hourlyPay: Math.floor(s.hourlyPay * 0.5) } 
                : s
            );
            await base44.entities.Mission.update(currentEvent.missionId, { ships: updatedShips });
          }

          addMessage(`Surrendered to hostile fleet. Half of mission earnings confiscated.`);
        }
        break;

      case 'planet_discovery':
        if (choiceId === 'claim') {
          const currentShips = queryClient.getQueryData(['ships', 'inventory']) || [];
          const ship = currentShips.find(s => s.id === currentEvent.shipId);
          const shipName = ship?.name || 'Unknown Ship';

          if (Math.random() < 0.5) {
            // Success - reward credits
            const bonusCredits = Math.floor(Math.random() * 501) + 1000; // 1000-1500
            await updateGameState({ credits: gameState.credits + bonusCredits });

            const mission = await base44.entities.Mission.filter({ id: currentEvent.missionId });
            if (mission[0]) {
              await base44.entities.Mission.update(currentEvent.missionId, {
                encounterResult: `+$${bonusCredits} (planet claim)`
              });
            }

            addMessage(`${shipName} successfully claimed the planet and received $${bonusCredits} reward!`);
          } else {
            // Failure - pirate hideout, 50% damage
            const newHealth = Math.max(0, ship.health - 50);
            await updateShip(currentEvent.shipId, {
              health: newHealth,
              damaged: newHealth < 100,
              status: newHealth === 0 ? 'destroyed' : 'damaged'
            });

            if (newHealth === 0) {
              const mission = await base44.entities.Mission.filter({ id: currentEvent.missionId });
              if (mission[0]) {
                const updatedShips = mission[0].ships.map(s => 
                  s.shipId === currentEvent.shipId ? { ...s, status: 'destroyed' } : s
                );
                const anyActive = updatedShips.some(s => s.status === 'active');
                await base44.entities.Mission.update(currentEvent.missionId, {
                  ships: updatedShips,
                  status: anyActive ? 'active' : 'failed',
                  encounterResult: `-50% damage (DESTROYED - pirate hideout)`
                });
              }
            } else {
              const mission = await base44.entities.Mission.filter({ id: currentEvent.missionId });
              if (mission[0]) {
                await base44.entities.Mission.update(currentEvent.missionId, {
                  encounterResult: `-50% damage (pirate hideout)`
                });
              }
            }

            addMessage(`The planet turned out to be a secret hideout for a gang of pirates. They quickly swarmed your fleet and overwhelmed their defenses. They managed to escape before total annihilation.`);
          }
        } else {
          addMessage('Planet discovery ignored. Ship continuing mission.');
        }
        break;

      case 'scavenge':
        if (choiceId === 'scavenge') {
          const currentShips = queryClient.getQueryData(['ships', 'inventory']) || [];
          const mission = await base44.entities.Mission.filter({ id: currentEvent.missionId });
          const activeShip = mission[0]?.ships?.find(s => s.status === 'active');
          const ship = currentShips.find(s => s.id === activeShip?.shipId);
          const shipName = ship?.name || 'Unknown Ship';

          if (Math.random() < 0.5) {
            // Success - get parts
            const partsFound = Math.random() < 0.5 ? 2 : (Math.random() < 0.75 ? 3 : 4);
            const partNames = [
              'Box of tangled wire', 'Rusty screws', 'Cracked glass', 
              'Wire splice', 'Stripped bolts'
            ];

            const newParts = { ...gameState.parts };
            for (let i = 0; i < partsFound; i++) {
              const partName = partNames[Math.floor(Math.random() * partNames.length)];
              newParts[partName] = (newParts[partName] || 0) + 1;
            }

            await updateGameState({ parts: newParts });
            addMessage(`Salvaged ${partsFound} parts from derelict vessel.`);
          } else {
            // Failure - mind slugs, 25% damage
            const newHealth = Math.max(0, ship.health - 25);
            await updateShip(ship.id, {
              health: newHealth,
              damaged: newHealth < 100,
              status: newHealth === 0 ? 'destroyed' : 'damaged'
            });

            if (newHealth === 0) {
              const updatedShips = mission[0].ships.map(s => 
                s.shipId === ship.id ? { ...s, status: 'destroyed' } : s
              );
              const anyActive = updatedShips.some(s => s.status === 'active');
              await base44.entities.Mission.update(currentEvent.missionId, {
                ships: updatedShips,
                status: anyActive ? 'active' : 'failed',
                encounterResult: `-25% damage (DESTROYED - mind slugs)`
              });
            } else {
              await base44.entities.Mission.update(currentEvent.missionId, {
                encounterResult: `-25% damage (mind slugs)`
              });
            }

            addMessage(`The abandoned ship was infested with mind slugs. Your crew managed to kill several of them, but they were severely outnumbered. The crew managed to escape before being succumbed to the hive mind.`);
          }
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

    const tierConfig = getTierConfig(tier);
    const [min, max] = tierConfig.payRange;
    const hourlyPay = Math.floor(Math.random() * (max - min + 1)) + min;

    return await base44.entities.Ship.create({
      name,
      tier,
      imageUrl: getRandomShipImage(tier),
      maxLY: tierConfig.maxLY,
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
    loading: loading || shipsLoading,
    messages,
    currentEvent,
    ships,
    updateGameState,
    updateShip,
    removeShip,
    addShip,
    refreshShips,
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