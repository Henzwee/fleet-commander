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
      
      // Generate missions based on best ship
      const allShips = await base44.entities.Ship.filter({ isHired: true }, '-created_date', 100);
      const bestShipMaxLY = allShips.length > 0 
        ? Math.max(...allShips.map(s => s.maxLY || 100))
        : 100;
      generateMissions(bestShipMaxLY);
    } catch (error) {
      console.error('Error loading ships:', error);
      setIdleShips([]);
      generateMissions(100); // Default to Unregistered range
    }
  };
  
  const generateMissions = (maxLY) => {
    const missions = [];
    const descriptions = [
      'Routine cargo delivery',
      'Emergency supply run',
      'Escort mission',
      'Salvage operation',
      'Scientific survey',
      'Passenger transport'
    ];
    
    // Generate missions within player's best ship range
    // Mix of easier and challenging missions
    for (let i = 0; i < 8; i++) {
      const minDistance = Math.max(50, Math.floor(maxLY * 0.1));
      const maxDistance = maxLY;
      const distance = Math.floor(Math.random() * (maxDistance - minDistance)) + minDistance;
      const duration = Math.floor(distance / 500) + 1;
      const reward = Math.floor(distance * (Math.random() * 2 + 1));
      const fuelCost = Math.floor(distance / 100);
      
      missions.push({
        id: 'mission_' + i,
        distance,
        duration,
        reward,
        fuelCost,
        description: descriptions[Math.floor(Math.random() * descriptions.length)]
      });
    }
    
    setAvailableMissions(missions);
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
              onClick={() => setSelectedMission(mission)}
              className={`bg-gradient-to-r from-gray-800 to-gray-900 border-2 rounded-lg p-4 cursor-pointer transition-all ${
                selectedMission?.id === mission.id
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : 'border-gray-600 hover:border-cyan-500/50'
              }`}
            >
              <div className="text-cyan-100 font-bold mb-2">{mission.description}</div>
              
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