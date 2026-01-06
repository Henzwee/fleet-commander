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
    generateMissions();
    try {
      const ships = await base44.entities.Ship.filter({ status: 'idle', isHired: true }, '-created_date', 50);
      setIdleShips(ships || []);
    } catch (error) {
      console.error('Error loading ships:', error);
      setIdleShips([]);
    }
  };
  
  const generateMissions = () => {
    const missions = [];
    const descriptions = [
      'Routine cargo delivery',
      'Emergency supply run',
      'Escort mission',
      'Salvage operation',
      'Scientific survey',
      'Passenger transport'
    ];
    
    for (let i = 0; i < 8; i++) {
      const distance = Math.floor(Math.random() * 10000) + 100;
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
                {idleShips.map((ship) => (
                  <div
                    key={ship.id}
                    onClick={() => setSelectedShip(ship)}
                    className={`bg-gray-800 border-2 rounded-lg p-3 cursor-pointer transition-all ${
                      selectedShip?.id === ship.id
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-gray-600 hover:border-green-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-cyan-100 font-bold text-sm">{ship.name}</div>
                        <div className="text-xs text-gray-400">{ship.tier}</div>
                      </div>
                      <div className="text-green-400 text-xs">IDLE</div>
                    </div>
                  </div>
                ))}
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