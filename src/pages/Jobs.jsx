import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useGame } from '../components/game/GameProvider';
import DeviceFrame from '../components/game/DeviceFrame';
import ResourceHeader from '../components/game/ResourceHeader';
import { MapPin, Clock, Zap, Fuel } from 'lucide-react';

export default function Jobs() {
  const { gameState, addMessage, updateGameState } = useGame();
  const [availableMissions, setAvailableMissions] = useState([]);
  const [idleShips, setIdleShips] = useState([]);
  const [selectedMission, setSelectedMission] = useState(null);
  const [selectedShip, setSelectedShip] = useState(null);
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      const ships = await base44.entities.Ship.filter({ status: 'idle', isHired: true }, '-created_date', 50);
      setIdleShips(ships || []);
      
      // Generate missions based on all ship tiers owned
      const allShips = await base44.entities.Ship.filter({ isHired: true }, '-created_date', 100);
      const bestShipMaxLY = allShips.length > 0 
        ? Math.max(...allShips.map(s => s.maxLY || 100))
        : 100;
      
      // Get unique tiers owned by player
      const ownedTiers = [...new Set(allShips.map(s => s.tier))];
      generateMissions(bestShipMaxLY, ownedTiers);
    } catch (error) {
      console.error('Error loading ships:', error);
      setIdleShips([]);
      generateMissions(100, ['Unregistered']); // Default to Unregistered range
    }
  };
  
  const generateMissions = (maxLY, ownedTiers = ['Unregistered']) => {
    const missions = [];
    const descriptions = [
      'Deliver mystery meat to Station 7',
      'Rescue cat stuck in airlock',
      'Get an oil change and thruster rotation',
      'Haul cursed cargo (probably fine)',
      'Escort paranoid merchant',
      'Salvage "totally not stolen" goods',
      'Find lost space tourist',
      'Deliver overdue library books',
      'Transport experimental goo',
      'Deliver lug nuts to hostile robot planet',
      'Test weapons on small moons',
      'Escort celebrity on "incognito" trip',
      'Deliver antique weapons to museum',
      'Survey planet that keeps disappearing',
      'Transport philosopher who won\'t stop talking',
      'Haul defective AI cores',
      'Blow up space junk',
      'Escort convoy through "totally safe" nebula',
      'Deliver barely expired medical supplies',
      'Deliver waste to trash planet'
    ];
    
    const tierBands = [
      { name: 'Unregistered', min: 10, max: 100 },
      { name: 'Known', min: 100, max: 500 },
      { name: 'Notorious', min: 500, max: 1500 },
      { name: 'Esteemed', min: 1500, max: 3500 },
      { name: 'Renowned', min: 3500, max: 6000 },
      { name: 'Legendary', min: 6000, max: 10000 }
    ];
    
    // Find player's current tier based on maxLY
    let playerTierIndex = 0;
    for (let i = 0; i < tierBands.length; i++) {
      if (maxLY >= tierBands[i].max) {
        playerTierIndex = i;
      }
    }
    
    // Generate at least 3 missions for each tier the player owns ships in
    for (const tier of tierBands) {
      if (ownedTiers.includes(tier.name)) {
        for (let i = 0; i < 3; i++) {
          const distance = Math.floor(Math.random() * (tier.max - tier.min)) + tier.min;
          missions.push({
            id: 'mission_' + missions.length,
            distance,
            duration: Math.floor(distance / 500) + 1,
            reward: Math.floor(distance * (Math.random() * 2 + 1)),
            fuelCost: Math.floor(distance / 100) || 1,
            description: descriptions[Math.floor(Math.random() * descriptions.length)],
            tier: tier.name,
            locked: false
          });
        }
      }
    }
    
    // Add exactly 1 aspirational mission (one tier above, locked)
    if (playerTierIndex < tierBands.length - 1) {
      const nextTier = tierBands[playerTierIndex + 1];
      const distance = Math.floor(Math.random() * (nextTier.max - nextTier.min)) + nextTier.min;
      missions.push({
        id: 'mission_aspirational',
        distance,
        duration: Math.floor(distance / 500) + 1,
        reward: Math.floor(distance * (Math.random() * 2 + 1)),
        fuelCost: Math.floor(distance / 100),
        description: descriptions[Math.floor(Math.random() * descriptions.length)],
        tier: nextTier.name,
        locked: true
      });
    }
    
    setAvailableMissions(missions);
  };
  
  const calculateReward = (missionTier, shipTier, distance) => {
    const tierRanking = {
      'Unregistered': 0,
      'Known': 1,
      'Notorious': 2,
      'Esteemed': 3,
      'Renowned': 4,
      'Legendary': 5
    };
    
    const missionRank = tierRanking[missionTier] || 0;
    const shipRank = tierRanking[shipTier] || 0;
    
    // Calculate multiplier based on tier match
    // Better match = higher multiplier (closer to 3x)
    // Worse match = lower multiplier (closer to 1x)
    const tierDiff = Math.abs(missionRank - shipRank);
    const multiplier = 3 - (tierDiff * 0.33); // Range: 3x to ~1x
    
    return Math.floor(distance * multiplier);
  };

  const handleAssignMission = async () => {
    if (!selectedMission || !selectedShip) {
      addMessage('Select a mission and ship first!');
      return;
    }
    
    // Check if ship can handle the distance
    if (selectedShip.maxLY < selectedMission.distance) {
      addMessage(`${selectedShip.name} cannot travel ${selectedMission.distance} LY! (Max: ${selectedShip.maxLY} LY)`);
      return;
    }
    
    if (gameState.fuel < selectedMission.fuelCost) {
      addMessage('Insufficient fuel!');
      return;
    }
    
    // Calculate reward based on ship tier vs mission tier
    const adjustedReward = calculateReward(selectedMission.tier, selectedShip.tier, selectedMission.distance);
    
    // Create mission
    await base44.entities.Mission.create({
      shipId: selectedShip.id,
      shipName: selectedShip.name,
      distance: selectedMission.distance,
      duration: selectedMission.duration,
      reward: adjustedReward,
      fuelCost: selectedMission.fuelCost,
      startTime: new Date().toISOString(),
      status: 'active',
      description: selectedMission.description
    });
    
    // Update ship status
    await base44.entities.Ship.update(selectedShip.id, { status: 'active' });
    
    // Deduct fuel
    await updateGameState({
      fuel: gameState.fuel - selectedMission.fuelCost
    });
    
    addMessage(`${selectedShip.name} deployed on mission!`);
    
    // Reload
    setSelectedMission(null);
    setSelectedShip(null);
    loadData();
  };
  
  return (
    <DeviceFrame title="JOBS">
      <div className="flex flex-col min-h-full pb-6" style={{ maxWidth: '100%', paddingLeft: 'var(--safe-x)', paddingRight: 'var(--safe-x)', boxSizing: 'border-box' }}>
        <ResourceHeader />
        <div className="p-4 pb-24 overflow-y-auto h-full" style={{ paddingLeft: '0', paddingRight: '0', paddingTop: '70px' }}>
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-2 border-cyan-500/50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="text-cyan-400 font-bold">AVAILABLE MISSIONS</div>
            <div className="flex items-center gap-2 text-amber-400">
              <Fuel className="w-4 h-4" />
              <span className="font-bold">{gameState?.fuel} fuel</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-3 mb-4">
          {availableMissions.map((mission) => (
            <div
              key={mission.id}
              onClick={() => !mission.locked && setSelectedMission(mission)}
              className={`bg-gradient-to-r from-gray-800 to-gray-900 border-2 rounded-lg p-4 transition-all ${
                mission.locked
                  ? 'border-red-500/30 opacity-60 cursor-not-allowed'
                  : selectedMission?.id === mission.id
                  ? 'border-cyan-500 bg-cyan-500/10 cursor-pointer'
                  : 'border-gray-600 hover:border-cyan-500/50 cursor-pointer'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-cyan-100 font-bold">{mission.description}</div>
                {mission.locked && (
                  <div className="text-red-400 text-xs font-bold">🔒 LOCKED</div>
                )}
              </div>
              
              <div className="text-xs text-gray-500 mb-2">{mission.tier}</div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1 text-gray-400">
                  <MapPin className="w-3 h-3" />
                  <span>{mission.distance} ly</span>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>{mission.duration}h</span>
                </div>
                <div className="flex items-center gap-1 text-amber-400">
                  <Zap className="w-3 h-3" />
                  <span>${mission.reward}</span>
                </div>
                <div className="flex items-center gap-1 text-blue-400">
                  <Fuel className="w-3 h-3" />
                  <span>{mission.fuelCost} fuel</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {selectedMission && (
          <div className="bg-gradient-to-br from-gray-900 to-gray-950 border-2 border-cyan-500 rounded-lg p-4 mb-4">
            <div className="text-cyan-400 font-bold mb-3">SELECT SHIP</div>
            
            {idleShips.length === 0 ? (
              <div className="text-gray-500 text-sm text-center py-4">
                No ships available. Hire more ships or wait for active missions to complete.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {idleShips.map((ship) => {
                  const canHandle = ship.maxLY >= selectedMission.distance;
                  const estimatedReward = calculateReward(selectedMission.tier, ship.tier, selectedMission.distance);
                  return (
                    <div
                      key={ship.id}
                      onClick={() => canHandle && setSelectedShip(ship)}
                      className={`bg-gray-800 border-2 rounded-lg p-3 transition-all ${
                        !canHandle
                          ? 'border-red-500/30 opacity-50 cursor-not-allowed'
                          : selectedShip?.id === ship.id
                          ? 'border-green-500 bg-green-500/10 cursor-pointer'
                          : 'border-gray-600 hover:border-green-500/50 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-cyan-100 font-bold text-sm">{ship.name}</div>
                          <div className="text-xs text-gray-400">{ship.tier} • {ship.maxLY} LY</div>
                          {canHandle && (
                            <div className="text-xs text-amber-400 mt-1">Reward: ${estimatedReward}</div>
                          )}
                        </div>
                        {canHandle ? (
                          <div className="text-green-400 text-xs">IDLE</div>
                        ) : (
                          <div className="text-red-400 text-xs">OUT OF RANGE</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            <button
              onClick={handleAssignMission}
              disabled={!selectedShip || gameState.fuel < selectedMission.fuelCost}
              className="w-full mt-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed border-2 border-green-500 disabled:border-gray-500 rounded-lg py-3 text-white font-bold transition-all"
            >
              LAUNCH MISSION
            </button>
          </div>
        )}
        </div>
      </div>
    </DeviceFrame>
  );
}