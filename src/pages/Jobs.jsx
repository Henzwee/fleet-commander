import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useGame } from '../components/game/GameProvider';
import DeviceFrame from '../components/game/DeviceFrame';
import ResourceHeader from '../components/game/ResourceHeader';
import { MapPin, Clock, Zap, Fuel } from 'lucide-react';
import { SHIP_TIERS, TIER_ORDER, getTierConfig, getMaxLYForTier } from '../components/game/ShipTierConfig';

export default function Jobs() {
  const { gameState, ships: allShips, updateShip, addMessage, updateGameState } = useGame();
  const [availableMissions, setAvailableMissions] = useState([]);
  const [selectedMission, setSelectedMission] = useState(null);
  const [selectedShip, setSelectedShip] = useState(null);
  
  // Filter idle ships from centralized inventory
  const idleShips = allShips.filter(ship => ship.isHired && ship.status === 'idle');
  
  useEffect(() => {
    loadData();
  }, [allShips.length]);
  
  const loadData = async () => {
    try {
      // Get player's maximum ship range
      const maxLY = allShips.length > 0 
        ? Math.max(...allShips.map(s => s.maxLY || 100))
        : 100;
      
      generateMissions(maxLY);
    } catch (error) {
      console.error('Error loading missions:', error);
      generateMissions(100);
    }
  };
  
  const generateMissions = (playerMaxLY) => {
    const missions = [];
    const descriptions = [
      'Deliver mystery meat to Station 7',
      'Rescue cat stuck in airlock',
      'Get an oil change and thruster rotation',
      'Haul cursed cargo (probably fine)',
      'Escort paranoid merchant',
      'Salvage "totally not stolen" goods',
      'Find lost space tourist',
      'Pull small prank (involving antimatter)',
      'Transport experimental goo',
      'Deliver lug nuts to hostile robot planet',
      'Test weapons on small moons',
      'Listen to Also sprach Zarathustra',
      'Deliver antique weapons to museum',
      'Survey planet that keeps disappearing',
      'Transport android that won\'t stop talking',
      'Haul defective AI cores',
      'Blow up space junk',
      'Escort convoy through "totally safe" nebula',
      'Deliver barely expired medical supplies',
      'Make up new constellations',
      'Scrub space barnacles off ship',
      'Deliver waste to trash planet'
    ];
    
    // Find player's current tier index based on maxLY
    let playerTierIndex = 0;
    for (let i = 0; i < TIER_ORDER.length; i++) {
      if (playerMaxLY >= getMaxLYForTier(TIER_ORDER[i])) {
        playerTierIndex = i;
      }
    }
    
    // Generate missions for current tier and below (3-4 missions per accessible tier)
    for (let i = 0; i <= playerTierIndex; i++) {
      const tier = TIER_ORDER[i];
      const tierMaxLY = getMaxLYForTier(tier);
      const tierMinLY = i > 0 ? getMaxLYForTier(TIER_ORDER[i - 1]) : 10;
      
      const missionsForTier = i === playerTierIndex ? 4 : 3;
      
      for (let j = 0; j < missionsForTier; j++) {
        const distance = Math.floor(Math.random() * (tierMaxLY - tierMinLY)) + tierMinLY;
        missions.push({
          id: `mission_${tier}_${j}`,
          distance,
          duration: Math.floor(distance / 500) + 1,
          reward: Math.floor(distance * (Math.random() * 1.5 + 1.5)),
          fuelCost: Math.floor(distance / 100) || 1,
          description: descriptions[Math.floor(Math.random() * descriptions.length)],
          tier,
          requiredLY: distance
        });
      }
    }
    
    // Add 1-2 aspirational missions (next tier above player)
    if (playerTierIndex < TIER_ORDER.length - 1) {
      const nextTier = TIER_ORDER[playerTierIndex + 1];
      const tierMaxLY = getMaxLYForTier(nextTier);
      const tierMinLY = getMaxLYForTier(TIER_ORDER[playerTierIndex]);
      
      const numAspirational = playerTierIndex < TIER_ORDER.length - 2 ? 2 : 1;
      
      for (let i = 0; i < numAspirational; i++) {
        const distance = Math.floor(Math.random() * (tierMaxLY - tierMinLY)) + tierMinLY;
        missions.push({
          id: `mission_aspirational_${i}`,
          distance,
          duration: Math.floor(distance / 500) + 1,
          reward: Math.floor(distance * (Math.random() * 1.5 + 2)),
          fuelCost: Math.floor(distance / 100),
          description: descriptions[Math.floor(Math.random() * descriptions.length)],
          tier: nextTier,
          requiredLY: distance,
          aspirational: true
        });
      }
    }
    
    setAvailableMissions(missions);
  };
  
  const handleAssignMission = async () => {
    if (!selectedMission || !selectedShip) {
      addMessage('Select a mission and ship first!');
      return;
    }
    
    // Check if ship can handle the distance
    if (selectedShip.maxLY < selectedMission.requiredLY) {
      addMessage(`${selectedShip.name} cannot travel ${selectedMission.requiredLY} LY! (Max: ${selectedShip.maxLY} LY)`);
      return;
    }
    
    if (gameState.fuel < selectedMission.fuelCost) {
      addMessage('Insufficient fuel!');
      return;
    }
    
    // Create mission
    await base44.entities.Mission.create({
      shipId: selectedShip.id,
      shipName: selectedShip.name,
      distance: selectedMission.distance,
      duration: selectedMission.duration,
      reward: selectedMission.reward,
      fuelCost: selectedMission.fuelCost,
      startTime: new Date().toISOString(),
      status: 'active',
      description: selectedMission.description
    });
    
    // Update ship status using centralized function
    await updateShip(selectedShip.id, { status: 'active' });
    
    // Deduct fuel
    await updateGameState({
      fuel: gameState.fuel - selectedMission.fuelCost
    });
    
    addMessage(`${selectedShip.name} deployed on mission!`);
    
    // Reset selection
    setSelectedMission(null);
    setSelectedShip(null);
  };
  
  // Check if any ship can handle the selected mission
  const canAnyShipHandleMission = selectedMission 
    ? idleShips.some(ship => ship.maxLY >= selectedMission.requiredLY)
    : true;
  
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
              onClick={() => setSelectedMission(mission)}
              className={`bg-gradient-to-r from-gray-800 to-gray-900 border-2 rounded-lg p-4 transition-all cursor-pointer ${
                selectedMission?.id === mission.id
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : mission.aspirational
                  ? 'border-amber-500/30 hover:border-amber-500/50'
                  : 'border-gray-600 hover:border-cyan-500/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-cyan-100 font-bold">{mission.description}</div>
                {mission.aspirational && (
                  <div className="text-amber-400 text-xs font-bold">⭐ ASPIRATIONAL</div>
                )}
              </div>
              
              <div className="text-xs text-gray-400 mb-2">{mission.tier} • Requires {mission.requiredLY} LY</div>
              
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
            ) : !canAnyShipHandleMission ? (
              <div className="text-red-400 text-sm text-center py-4 font-bold">
                with that crew? I dont think so, pal.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {idleShips.map((ship) => {
                  const canHandle = ship.maxLY >= selectedMission.requiredLY;
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
            
            {canAnyShipHandleMission && (
              <button
                onClick={handleAssignMission}
                disabled={!selectedShip || gameState.fuel < selectedMission.fuelCost}
                className="w-full mt-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed border-2 border-green-500 disabled:border-gray-500 rounded-lg py-3 text-white font-bold transition-all"
              >
                LAUNCH MISSION
              </button>
            )}
          </div>
        )}
        </div>
      </div>
    </DeviceFrame>
  );
}