import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
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
  const navigate = useNavigate();
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
    // Check if ship is on a mission
    if (ship.status === 'active') {
      addMessage(`${ship.name} is deployed and can't be repaired!`);
      return;
    }
    
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
    
    // Random exit messages
    const exitMessages = [
      'They flipped you off on the way out.',
      'They made space tracks before warping away.',
      'They shot their canons thinking you told them TO fire.',
      'Exit interview declined.',
      'Their company email has been deactivated.',
      'They are no longer our problem.',
      'They promised revenge. I archived it.',
      'They are starting a competitor. Allegedly.'
    ];
    const randomExit = exitMessages[Math.floor(Math.random() * exitMessages.length)];
    addMessage(randomExit);
    
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
      <div className="flex flex-col h-full overflow-hidden" style={{ maxWidth: '100%', paddingLeft: 'var(--safe-x)', paddingRight: 'var(--safe-x)', boxSizing: 'border-box' }}>
        <ResourceHeader />
        <div className="flex-1 overflow-y-auto" style={{ paddingLeft: '0', paddingRight: '0', paddingTop: '70px', paddingBottom: '24px' }}>
        {/* Tab Switcher */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => handleTabChange('ships')}
            className="relative flex-1 py-3 font-bold text-sm"
          >
            <div className={`absolute inset-0 border-2 ${
              activeTab === 'ships'
                ? 'bg-[#3a5a4f] border-[#5a7a5f]'
                : 'bg-[#2a3a2f] border-[#3a4a3f]'
            }`} style={{
              boxShadow: 'inset 0 0 0 1px #1a2a1f'
            }}></div>
            <div className={`absolute inset-[3px] ${
              activeTab === 'ships'
                ? 'bg-[#3a5a4f]'
                : 'bg-[#1a2a1f]'
            }`} style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(90,122,95,0.15) 1px, transparent 0)',
              backgroundSize: '3px 3px',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)'
            }}></div>
            <span className={`relative ${
              activeTab === 'ships'
                ? 'text-[#d0e8d5]'
                : 'text-[#5a6a5f]'
            }`}>SHIPS</span>
          </button>
          <button
            onClick={() => handleTabChange('inventory')}
            className="relative flex-1 py-3 font-bold text-sm"
          >
            <div className={`absolute inset-0 border-2 ${
              activeTab === 'inventory'
                ? 'bg-[#3a5a4f] border-[#5a7a5f]'
                : 'bg-[#2a3a2f] border-[#3a4a3f]'
            }`} style={{
              boxShadow: 'inset 0 0 0 1px #1a2a1f'
            }}></div>
            <div className={`absolute inset-[3px] ${
              activeTab === 'inventory'
                ? 'bg-[#3a5a4f]'
                : 'bg-[#1a2a1f]'
            }`} style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(90,122,95,0.15) 1px, transparent 0)',
              backgroundSize: '3px 3px',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)'
            }}></div>
            <span className={`relative ${
              activeTab === 'inventory'
                ? 'text-[#d0e8d5]'
                : 'text-[#5a6a5f]'
            }`}>INVENTORY</span>
          </button>
        </div>
        
        {/* Ships Tab */}
        {activeTab === 'ships' && (
          <section id="fleetShipsPanel">
            <div className="relative p-4 mb-4">
              <div className="absolute inset-0 bg-[#2a3a2f] border-2 border-[#5a7a5f]" style={{
                boxShadow: 'inset 0 0 0 1px #1a2a1f'
              }}></div>
              <div className="absolute inset-[4px] bg-[#1a2a1f]" style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(90,122,95,0.1) 1px, transparent 0)',
                backgroundSize: '3px 3px',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)'
              }}></div>
              <div className="relative flex items-center justify-between">
                <div className="text-[#a8c5ad] font-bold">YOUR FLEET</div>
                <div className="flex items-center gap-2 text-[#5a6a5f] text-xs">
                  <Package className="w-4 h-4" />
                  <span>{totalParts} parts</span>
                </div>
              </div>
            </div>
            
            {ships.length === 0 ? (
              <div className="text-center text-[#3a4a3f] py-8">
                No ships in fleet. Hire ships from the market!
              </div>
            ) : (
              <>
                {['Legendary', 'Renowned', 'Esteemed', 'Notorious', 'Known', 'Unregistered'].map(tier => {
                  const tierShips = ships.filter(ship => ship.tier === tier);
                  if (tierShips.length === 0) return null;
                  
                  return (
                    <div key={tier} className="mb-6">
                      <div className="text-[#a8c5ad] font-bold text-sm mb-3 uppercase">{tier}</div>
                      <div className="grid grid-cols-1 gap-3">
                        {tierShips.map((ship) => (
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
                                      {ship.health === 0 ? 'DESTROYED' : ship.status.toUpperCase()}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-gray-400">Hourly Pay</div>
                                    <div className="text-amber-400 font-bold">${ship.hourlyPay}</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-400">Health</div>
                                    <div className={`font-bold ${getDamageColor(ship.health)}`}>
                                      {ship.health}%
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
                                
                                {ship.health < 100 && ship.status === 'active' && (
                                  <div className="mb-3 bg-amber-900/30 rounded-lg p-2 border border-amber-500/30">
                                    <div className="text-amber-400 text-xs text-center">Deployed ships can't be repaired</div>
                                  </div>
                                )}
                                
                                <div className="grid grid-cols-2 gap-2">
                                  {ship.health < 100 && (
                                    <button
                                      onClick={() => handleRepair(ship)}
                                      disabled={ship.status === 'active' || !hasParts(ship.requiredParts || [], gameState?.parts || {})}
                                      className="bg-green-600 border-2 border-green-500 rounded-lg py-2 px-3 text-white font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:bg-green-700"
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
                    </div>
                  );
                })}
              </>
            )}
          </section>
        )}
        
        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <section id="fleetInventoryPanel">
            <div className="relative p-4 mb-4">
              <div className="absolute inset-0 bg-[#2a3a2f] border-2 border-[#5a7a5f]" style={{
                boxShadow: 'inset 0 0 0 1px #1a2a1f'
              }}></div>
              <div className="absolute inset-[4px] bg-[#1a2a1f]" style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(90,122,95,0.1) 1px, transparent 0)',
                backgroundSize: '3px 3px',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)'
              }}></div>
              <div className="relative flex items-center justify-between">
                <div className="text-[#a8c5ad] font-bold">INVENTORY</div>
                <div className="flex items-center gap-2 text-[#5a6a5f] text-xs">
                  <Package className="w-4 h-4" />
                  <span>{totalParts} parts</span>
                </div>
              </div>
            </div>
            
            {Object.keys(inventoryParts).length === 0 ? (
              <div className="text-center text-[#3a4a3f] py-8">
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
                      className="relative"
                    >
                      <div className="absolute inset-0 border border-[#3a5a4f]" style={{
                        boxShadow: 'inset 0 0 0 1px #1a2a1f'
                      }}></div>
                      <div className="absolute inset-[2px] bg-[#1a2a1f]" style={{
                        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(58,90,79,0.15) 1px, transparent 0)',
                        backgroundSize: '3px 3px',
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)'
                      }}></div>
                      <div className="relative p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Package className="w-5 h-5 text-[#5a9a8f]" />
                          <span className="text-[#a8c5ad] text-sm">{partName}</span>
                        </div>
                        <div className="text-[#5a9a8f] font-bold text-sm">x{qty}</div>
                      </div>
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