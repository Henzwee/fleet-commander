import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useGame } from '../components/game/GameProvider';
import DeviceFrame from '../components/game/DeviceFrame';
import ResourceHeader from '../components/game/ResourceHeader';
import ShipCard from '../components/game/ShipCard';
import { Heart, Wrench, UserMinus, Package, Check, X } from 'lucide-react';
import { getRequiredPartCountFromDamage, generateRequiredParts, hasParts, consumeParts } from '../components/game/PartsCatalog';
import { getMaxLYForTier } from '../components/game/ShipTierConfig';

export default function FleetManagement() {
  const { gameState, ships, updateShip, removeShip, updateGameState, addMessage, refreshShips } = useGame();
  const [selectedShip, setSelectedShip] = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('fleet_tab_v1') || 'ships';
  });
  
  // Generate required parts for damaged ships on mount
  useEffect(() => {
    const initDamagedShips = async () => {
      for (const ship of ships) {
        if (ship.damaged && (!ship.requiredParts || ship.requiredParts.length === 0)) {
          const damagePercent = 100 - ship.health;
          const partCount = getRequiredPartCountFromDamage(damagePercent);
          const requiredParts = generateRequiredParts(partCount);
          await updateShip(ship.id, { requiredParts });
        }
      }
    };
    
    if (ships.length > 0) {
      initDamagedShips();
    }
  }, [ships.length]);
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('fleet_tab_v1', tab);
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
  
  const getRange = (tier) => {
    return getMaxLYForTier(tier) || 100;
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
    await updateShip(ship.id, {
      health: 100,
      damaged: false,
      status: 'idle',
      requiredParts: []
    });
    
    await updateGameState({ parts: newParts });
    
    addMessage(`${ship.name} repaired successfully!`);
  };
  
  const handleFire = async (ship) => {
    if (ship.status === 'active') {
      addMessage('Cannot fire ship while on mission!');
      return;
    }
    
    await removeShip(ship.id);
    addMessage(`${ship.name} has been fired.`);
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
  
  const inventoryParts = gameState?.parts || {};
  const totalParts = Object.values(inventoryParts).reduce((sum, count) => sum + count, 0);
  
  return (
    <DeviceFrame title="FLEET">
      <div className="flex flex-col min-h-full pb-6" style={{ maxWidth: '100%', paddingLeft: 'var(--safe-x)', paddingRight: 'var(--safe-x)', boxSizing: 'border-box' }}>
        <ResourceHeader />
        <div className="p-4 pb-24 overflow-y-auto h-full" style={{ paddingLeft: '0', paddingRight: '0', paddingTop: '70px' }}>
        {/* Tab Switcher */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => handleTabChange('ships')}
            className={`flex-1 py-3 rounded-lg font-bold text-sm border-2 transition-all ${
              activeTab === 'ships'
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                : 'bg-gray-800 border-gray-600 text-gray-400'
            }`}
          >
            SHIPS
          </button>
          <button
            onClick={() => handleTabChange('inventory')}
            className={`flex-1 py-3 rounded-lg font-bold text-sm border-2 transition-all ${
              activeTab === 'inventory'
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                : 'bg-gray-800 border-gray-600 text-gray-400'
            }`}
          >
            INVENTORY
          </button>
        </div>
        
        {/* Ships Tab */}
        {activeTab === 'ships' && (
          <section id="fleetShipsPanel">
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-2 border-cyan-500/50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="text-cyan-400 font-bold">YOUR FLEET</div>
                <div className="flex items-center gap-2 text-gray-400 text-xs">
                  <Package className="w-4 h-4" />
                  <span>{totalParts} parts</span>
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
                            <div className="text-gray-400">Range</div>
                            <div className="text-cyan-400 font-bold">
                              {getRange(ship.tier).toLocaleString()} ly
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
                          {ship.health < 100 && (
                            <button
                              onClick={() => handleRepair(ship)}
                              disabled={ship.status === 'active' || !hasParts(ship.requiredParts || [], gameState?.parts || {})}
                              className="bg-green-600 border-2 border-green-500 rounded-lg py-2 px-3 text-white font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Wrench className="w-4 h-4" />
                              <span>REPAIR</span>
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleFire(ship)}
                            disabled={ship.status === 'active'}
                            className={`bg-red-600 border-2 border-red-500 rounded-lg py-2 px-3 text-white font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${ship.health < 100 ? '' : 'col-span-2'}`}
                          >
                            <UserMinus className="w-4 h-4" />
                            <span>FIRE</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
        
        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <section id="fleetInventoryPanel">
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-2 border-cyan-500/50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="text-cyan-400 font-bold">INVENTORY</div>
                <div className="flex items-center gap-2 text-gray-400 text-xs">
                  <Package className="w-4 h-4" />
                  <span>{totalParts} parts</span>
                </div>
              </div>
            </div>
            
            {Object.keys(inventoryParts).length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No parts in inventory. Buy from market!
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(inventoryParts)
                  .filter(([_, qty]) => qty > 0)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([partName, qty]) => (
                    <div
                      key={partName}
                      className="bg-gradient-to-r from-gray-800/60 to-gray-900/60 border border-cyan-500/20 rounded-lg p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Package className="w-5 h-5 text-cyan-400" />
                        <span className="text-cyan-100 text-sm">{partName}</span>
                      </div>
                      <div className="text-cyan-400 font-bold text-sm">x{qty}</div>
                    </div>
                  ))}
              </div>
            )}
          </section>
        )}
      </div>
      </div>
    </DeviceFrame>
  );
}