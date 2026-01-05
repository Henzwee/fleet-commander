import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useGame } from '../components/game/GameProvider';
import DeviceFrame from '../components/game/DeviceFrame';
import BottomNav from '../components/game/BottomNav';
import ShipCard from '../components/game/ShipCard';
import { Heart, Wrench, UserMinus, Package, Check, X } from 'lucide-react';
import { getRequiredPartCountFromDamage, generateRequiredParts, hasParts, consumeParts } from '../components/game/PartsCatalog';

export default function FleetManagement() {
  const { gameState, updateGameState, addMessage } = useGame();
  const [ships, setShips] = useState([]);
  const [selectedShip, setSelectedShip] = useState(null);
  
  useEffect(() => {
    loadShips();
  }, []);
  
  const loadShips = async () => {
    try {
      let allShips = await base44.entities.Ship.filter({ isHired: true }, '-created_date', 50);
      
      // Generate required parts for damaged ships that don't have them
      for (const ship of allShips) {
        if (ship.damaged && (!ship.requiredParts || ship.requiredParts.length === 0)) {
          const damagePercent = 100 - ship.health;
          const partCount = getRequiredPartCountFromDamage(damagePercent);
          const requiredParts = generateRequiredParts(partCount);
          
          await base44.entities.Ship.update(ship.id, { requiredParts });
          ship.requiredParts = requiredParts;
        }
      }
      
      setShips(allShips || []);
    } catch (error) {
      console.error('Error loading ships:', error);
      setShips([]);
    }
  };
  
  const getBaseParts = (tier) => {
    const tierParts = {
      'Unregistered': 3,
      'Known': 4,
      'Notorious': 5,
      'Esteemed': 6,
      'Renowned': 7,
      'Legendary': 8
    };
    return tierParts[tier] || 3;
  };
  
  const getUsableParts = (ship) => {
    const baseParts = getBaseParts(ship.tier);
    const damagePercent = 100 - ship.health;
    
    if (damagePercent >= 100) return 0;
    
    const penalty =
      damagePercent >= 75 ? 3 :
      damagePercent >= 50 ? 2 :
      damagePercent >= 25 ? 1 : 0;
    
    return Math.max(0, baseParts - penalty);
  };
  
  const getRepairCost = (ship) => {
    const baseParts = getBaseParts(ship.tier);
    const damagePercent = (100 - ship.health) / 100;
    return Math.ceil(baseParts * damagePercent);
  };
  
  const getDamageColor = (health) => {
    if (health >= 75) return 'text-green-400';
    if (health >= 50) return 'text-yellow-400';
    if (health >= 25) return 'text-amber-400';
    return 'text-red-400';
  };
  
  const handleRepair = async (ship) => {
    const requiredParts = ship.requiredParts || [];
    const parts = gameState.parts || {};
    
    // Check if player has all required parts
    if (!hasParts(requiredParts, parts)) {
      addMessage(`Missing required parts to repair ${ship.name}!`);
      return;
    }
    
    // Deduct required parts
    const newParts = consumeParts(requiredParts, parts);
    
    // Repair ship (reset to 100% health)
    await base44.entities.Ship.update(ship.id, {
      health: 100,
      damaged: false,
      status: 'idle',
      requiredParts: []
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
      <div className="p-4 pb-24 overflow-y-auto h-full">
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
                  <div className={`bg-gradient-to-br from-gray-900 to-gray-950 rounded-lg p-4 mt-2 ${
                    ship.health <= 25 ? 'border-2 border-red-500/60' :
                    ship.health <= 50 ? 'border-2 border-amber-500/60' :
                    'border-2 border-cyan-500/30'
                  }`}>
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
                        <div className="text-gray-400">Damage</div>
                        <div className={`font-bold ${getDamageColor(ship.health)}`}>
                          {100 - ship.health}%
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">Usable Parts</div>
                        <div className="text-cyan-400 font-bold">
                          {getUsableParts(ship)}/{getBaseParts(ship.tier)}
                        </div>
                      </div>
                    </div>
                    
                    {ship.damaged && ship.status !== 'active' && ship.requiredParts && ship.requiredParts.length > 0 && (
                      <div className="mb-3 bg-gray-900/50 rounded-lg p-3 border border-cyan-500/30">
                        <div className="text-cyan-400 text-xs font-bold mb-2">Required Parts</div>
                        <div className="space-y-1">
                          {ship.requiredParts.map((part, idx) => {
                            const available = (gameState?.parts || {})[part.name] || 0;
                            const hasEnough = available >= part.qty;
                            return (
                              <div key={idx} className="flex items-center gap-2 text-xs">
                                {hasEnough ? (
                                  <Check className="w-4 h-4 text-green-400" />
                                ) : (
                                  <X className="w-4 h-4 text-red-400" />
                                )}
                                <span className={hasEnough ? 'text-green-400' : 'text-red-400'}>
                                  {part.name} ({part.qty})
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2">
                      {ship.damaged && ship.status !== 'active' && (
                        <button
                          onClick={() => handleRepair(ship)}
                          disabled={!hasParts(ship.requiredParts || [], gameState?.parts || {})}
                          className="bg-green-600 hover:bg-green-700 border-2 border-green-500 rounded-lg py-2 px-3 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
      
      <BottomNav active="ships" />
    </DeviceFrame>
  );
}