import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useGame } from '../components/game/GameProvider';
import DeviceFrame from '../components/game/DeviceFrame';
import ShipCard from '../components/game/ShipCard';
import { Wrench, UserMinus, Package } from 'lucide-react';

export default function FleetManagement() {
  const { gameState, updateGameState, addMessage } = useGame();
  const [ships, setShips] = useState([]);
  const [selectedShip, setSelectedShip] = useState(null);
  
  useEffect(() => {
    loadShips();
  }, []);
  
  const loadShips = async () => {
    try {
      const allShips = await base44.entities.Ship.filter({ isHired: true }, '-created_date', 50);
      setShips(allShips || []);
    } catch (error) {
      console.error('Error loading ships:', error);
      setShips([]);
    }
  };
  
  const getRepairCost = (ship) => {
    const tierCosts = {
      'Unregistered': 3,
      'Known': 4,
      'Notorious': 5,
      'Esteemed': 6,
      'Renowned': 7,
      'Legendary': 8
    };
    return tierCosts[ship.tier] || 3;
  };
  
  const handleRepair = async (ship) => {
    const partsNeeded = getRepairCost(ship);
    const parts = gameState.parts;
    
    // Check if player has enough parts
    const totalParts = Object.values(parts).reduce((sum, count) => sum + count, 0);
    if (totalParts < partsNeeded) {
      addMessage(`Need ${partsNeeded} parts to repair ${ship.name}!`);
      return;
    }
    
    // Deduct parts
    const newParts = { ...parts };
    let remaining = partsNeeded;
    for (const partName in newParts) {
      if (remaining <= 0) break;
      const available = newParts[partName];
      const toUse = Math.min(available, remaining);
      newParts[partName] -= toUse;
      remaining -= toUse;
      
      if (newParts[partName] <= 0) {
        delete newParts[partName];
      }
    }
    
    // Repair ship
    await base44.entities.Ship.update(ship.id, {
      health: 100,
      damaged: false,
      status: 'idle'
    });
    
    await updateGameState({ parts: newParts });
    
    addMessage(`${ship.name} repaired successfully!`);
    loadShips();
  };
  
  const handleFire = async (ship) => {
    if (ship.status === 'active') {
      addMessage('Cannot fire ship while on mission!');
      return;
    }
    
    await base44.entities.Ship.update(ship.id, { isHired: false });
    addMessage(`${ship.name} has been fired.`);
    loadShips();
    setSelectedShip(null);
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'idle': return 'text-green-400';
      case 'active': return 'text-cyan-400';
      case 'damaged': return 'text-amber-400';
      case 'destroyed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };
  
  return (
    <DeviceFrame title="FLEET">
      <div className="p-4 overflow-y-auto h-full">
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-2 border-cyan-500/50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="text-cyan-400 font-bold">YOUR FLEET</div>
            <div className="flex items-center gap-2 text-gray-400 text-xs">
              <Package className="w-4 h-4" />
              <span>
                {Object.values(gameState?.parts || {}).reduce((sum, count) => sum + count, 0)} parts
              </span>
            </div>
          </div>
        </div>
        
        {ships.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No ships in fleet. Hire ships from the market!
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {ships.map((ship) => (
              <div key={ship.id}>
                <ShipCard
                  ship={ship}
                  onClick={() => setSelectedShip(selectedShip?.id === ship.id ? null : ship)}
                />
                
                {selectedShip?.id === ship.id && (
                  <div className="bg-gradient-to-br from-gray-900 to-gray-950 border-2 border-cyan-500/30 rounded-lg p-4 mt-2">
                    <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                      <div>
                        <div className="text-gray-400">Status</div>
                        <div className={`font-bold ${getStatusColor(ship.status)}`}>
                          {ship.status.toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">Hourly Pay</div>
                        <div className="text-amber-400 font-bold">${ship.hourlyPay}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Health</div>
                        <div className={`font-bold ${ship.health === 100 ? 'text-green-400' : 'text-red-400'}`}>
                          {ship.health}%
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">Repair Cost</div>
                        <div className="text-cyan-400 font-bold">{getRepairCost(ship)} parts</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {ship.damaged && ship.status !== 'active' && (
                        <button
                          onClick={() => handleRepair(ship)}
                          className="bg-green-600 hover:bg-green-700 border-2 border-green-500 rounded-lg py-2 px-3 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
                        >
                          <Wrench className="w-4 h-4" />
                          <span>REPAIR</span>
                        </button>
                      )}
                      
                      {ship.status !== 'active' && (
                        <button
                          onClick={() => handleFire(ship)}
                          className="bg-red-600 hover:bg-red-700 border-2 border-red-500 rounded-lg py-2 px-3 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
                        >
                          <UserMinus className="w-4 h-4" />
                          <span>FIRE</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          )}
          </div>
          </DeviceFrame>
          );
          }