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
    if (health >= 75) return 'var(--theme-primary)';
    if (health >= 50) return '#ffaa00';
    if (health >= 25) return '#ffaa00';
    return '#c84444';
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
      case 'idle': return 'var(--theme-primary)';
      case 'active': return 'var(--theme-primary)';
      case 'damaged': return '#ffaa00';
      case 'destroyed': return '#c84444';
      default: return 'var(--theme-text-dim)';
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
            <div className="absolute inset-0 border-2" style={{
              backgroundColor: activeTab === 'ships' ? 'var(--theme-dark)' : '#2a3a2f',
              borderColor: activeTab === 'ships' ? 'var(--theme-border)' : 'var(--theme-border-dark)',
              boxShadow: 'inset 0 0 0 1px #1a2a1f'
            }}></div>
            <div className="absolute inset-[3px]" style={{
              backgroundColor: activeTab === 'ships' ? 'var(--theme-dark)' : '#1a2a1f',
              backgroundImage: 'none',
              backgroundSize: '3px 3px',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)'
            }}></div>
            <span className="relative" style={{
              color: activeTab === 'ships' ? 'var(--theme-text-bright)' : 'var(--theme-text-dim)'
            }}>SHIPS</span>
          </button>
          <button
            onClick={() => handleTabChange('inventory')}
            className="relative flex-1 py-3 font-bold text-sm"
          >
            <div className="absolute inset-0 border-2" style={{
              backgroundColor: activeTab === 'inventory' ? 'var(--theme-dark)' : '#2a3a2f',
              borderColor: activeTab === 'inventory' ? 'var(--theme-border)' : 'var(--theme-border-dark)',
              boxShadow: 'inset 0 0 0 1px #1a2a1f'
            }}></div>
            <div className="absolute inset-[3px]" style={{
              backgroundColor: activeTab === 'inventory' ? 'var(--theme-dark)' : '#1a2a1f',
              backgroundImage: 'none',
              backgroundSize: '3px 3px',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)'
            }}></div>
            <span className="relative" style={{
              color: activeTab === 'inventory' ? 'var(--theme-text-bright)' : 'var(--theme-text-dim)'
            }}>INVENTORY</span>
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
                <div className="font-bold" style={{ color: 'var(--theme-light)' }}>YOUR FLEET</div>
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--theme-text-dim)' }}>
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
                      <div className="font-bold text-sm mb-3 uppercase" style={{ color: 'var(--theme-light)' }}>{tier}</div>
                      <div className="grid grid-cols-1 gap-3">
                        {tierShips.map((ship) => (
                          <div key={ship.id}>
                            <ShipCard
                              ship={ship}
                              onClick={() => setSelectedShip(selectedShip?.id === ship.id ? null : ship)}
                            />
                            
                            {selectedShip?.id === ship.id && (
                              <div className="relative p-4 mt-2">
                                <div className={`absolute inset-0 ${
                                  ship.health <= 25 ? 'bg-[#3a1a1f] border-2 border-[#6a3a3f]' :
                                  ship.health <= 50 ? 'bg-[#3a2a1f] border-2 border-[#7a5a3f]' :
                                  'bg-[#1a2a2f] border-2 border-[#3a5a5f]'
                                }`} style={{
                                  boxShadow: 'inset 0 0 0 1px #0a1a1f'
                                }}></div>
                                <div className={`absolute inset-[4px] ${
                                  ship.health <= 25 ? 'bg-[#2a0a0f]' :
                                  ship.health <= 50 ? 'bg-[#2a1a0f]' :
                                  'bg-[#0a1a1f]'
                                }`} style={{
                                  backgroundImage: 'none',
                                  backgroundSize: '3px 3px'
                                }}></div>
                                <div className="relative">
                                  <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                                    <div>
                                      <div style={{ color: 'var(--theme-text-dim)' }}>Status</div>
                                      <div className="font-bold" style={{ color: getStatusColor(ship.status) }}>
                                        {ship.health === 0 ? 'DESTROYED' : ship.status.toUpperCase()}
                                      </div>
                                    </div>
                                    <div>
                                      <div style={{ color: 'var(--theme-text-dim)' }}>Hourly Pay</div>
                                      <div className="font-bold" style={{ color: '#ffaa00' }}>${ship.hourlyPay}</div>
                                    </div>
                                    <div>
                                      <div style={{ color: 'var(--theme-text-dim)' }}>Health</div>
                                      <div className="font-bold" style={{ color: getDamageColor(ship.health) }}>
                                        {ship.health}%
                                      </div>
                                    </div>
                                    <div>
                                      <div style={{ color: 'var(--theme-text-dim)' }}>Range</div>
                                      <div className="font-bold" style={{ color: 'var(--theme-primary)' }}>
                                        {getRange(ship.tier).toLocaleString()} ly
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {ship.damaged && ship.status !== 'active' && ship.requiredParts && ship.requiredParts.length > 0 && (
                                    <div className="relative mb-3 p-3">
                                      <div className="absolute inset-0 border-2" style={{ backgroundColor: '#2a3a2f', borderColor: 'var(--theme-border-dark)' }}></div>
                                      <div className="absolute inset-[2px] bg-[#1a2a1f]"></div>
                                      <div className="relative">
                                        <div className="text-xs font-bold mb-2" style={{ color: 'var(--theme-primary)' }}>Required Parts</div>
                                        <div className="space-y-1">
                                          {ship.requiredParts.map((part, idx) => {
                                            const available = (gameState?.parts || {})[part.name] || 0;
                                            const hasEnough = available >= part.qty;
                                            return (
                                              <div key={idx} className="flex items-center gap-2 text-xs">
                                                {hasEnough ? (
                                                  <Check className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                                                ) : (
                                                  <X className="w-4 h-4 text-[#c84444]" />
                                                )}
                                                <span style={{ color: hasEnough ? 'var(--theme-primary)' : '#c84444' }}>
                                                  {part.name} ({part.qty})
                                                </span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {ship.health < 100 && ship.status === 'active' && (
                                    <div className="relative mb-3 p-2">
                                      <div className="absolute inset-0 bg-[#3a2a1f] border-2 border-[#7a5a3f]"></div>
                                      <div className="absolute inset-[2px] bg-[#2a1a0f]"></div>
                                      <div className="relative text-amber-400 text-xs text-center">Deployed ships can't be repaired</div>
                                    </div>
                                  )}
                                  
                                  <div className="grid grid-cols-2 gap-2">
                                    {ship.health < 100 && (
                                      <button
                                        onClick={() => handleRepair(ship)}
                                        disabled={ship.status === 'active' || !hasParts(ship.requiredParts || [], gameState?.parts || {})}
                                        className="relative py-2 px-3 font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        <div className="absolute inset-0 border-2" style={{
                                          backgroundColor: 'var(--theme-dark)',
                                          borderColor: 'var(--theme-primary)',
                                          boxShadow: 'inset 0 1px 0 rgba(90,154,111,0.4)'
                                        }}></div>
                                        <div className="absolute inset-[2px]" style={{
                                          backgroundColor: 'var(--theme-dark)',
                                          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(90,154,111,0.15) 1px, transparent 0)',
                                          backgroundSize: '3px 3px'
                                        }}></div>
                                        <Wrench className="w-4 h-4 relative" />
                                        <span className="relative">REPAIR</span>
                                      </button>
                                    )}
                                    
                                    <button
                                      onClick={() => handleFire(ship)}
                                      disabled={ship.status === 'active'}
                                      className={`relative py-2 px-3 font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${ship.health < 100 ? '' : 'col-span-2'}`}
                                    >
                                      <div className="absolute inset-0 bg-[#6a3a3f] border-2 border-[#8a4a4f]" style={{
                                        boxShadow: 'inset 0 1px 0 rgba(138,74,79,0.4)'
                                      }}></div>
                                      <div className="absolute inset-[2px] bg-[#7a3a3f]" style={{
                                        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(138,74,79,0.15) 1px, transparent 0)',
                                        backgroundSize: '3px 3px'
                                      }}></div>
                                      <UserMinus className="w-4 h-4 relative" />
                                      <span className="relative">FIRE</span>
                                    </button>
                                  </div>
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
                <div className="font-bold" style={{ color: 'var(--theme-light)' }}>INVENTORY</div>
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--theme-text-dim)' }}>
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
                      <div className="absolute inset-0 border" style={{
                        borderColor: 'var(--theme-border-dark)',
                        boxShadow: 'inset 0 0 0 1px #1a2a1f'
                      }}></div>
                      <div className="absolute inset-[2px] bg-[#1a2a1f]" style={{
                        backgroundImage: 'none',
                        backgroundSize: '3px 3px',
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)'
                      }}></div>
                      <div className="relative p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Package className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                          <span className="text-sm" style={{ color: 'var(--theme-light)' }}>{partName}</span>
                        </div>
                        <div className="font-bold text-sm" style={{ color: 'var(--theme-primary)' }}>x{qty}</div>
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