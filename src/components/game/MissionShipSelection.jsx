import React, { useState } from 'react';

export default function MissionShipSelection({ mission, ships, onConfirm, onCancel }) {
  const [selectedShips, setSelectedShips] = useState([]);
  
  if (!mission) return null;
  
  const eligibleShips = ships.filter(ship => ship.status === 'idle' && ship.maxLY >= mission.requiredLY);
  const ineligibleShips = ships.filter(ship => ship.status === 'idle' && ship.maxLY < mission.requiredLY);
  const busyShips = ships.filter(ship => ship.status !== 'idle');
  
  const toggleShip = (ship) => {
    if (selectedShips.find(s => s.id === ship.id)) {
      setSelectedShips(selectedShips.filter(s => s.id !== ship.id));
    } else if (selectedShips.length < 3) {
      setSelectedShips([...selectedShips, ship]);
    }
  };
  const canAnyShipHandle = eligibleShips.length > 0;
  
  return (
    <div className="fixed z-[4] bg-gradient-to-br from-[#0a1a14] to-[#050f0a] flex flex-col overflow-hidden" style={{
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    }}>
      <div className="flex-1 flex flex-col overflow-y-auto max-w-md mx-auto w-full" style={{ 
        WebkitOverflowScrolling: 'touch',
        paddingTop: 'calc(var(--content-pad-top) + 24px)',
        paddingBottom: 'calc(var(--content-pad-bottom) + 24px)',
        paddingLeft: 'calc(var(--content-pad-left) + 12px)',
        paddingRight: 'calc(var(--content-pad-right) + 12px)'
      }}>
          <div className="mb-6">
            <h2 className="text-cyan-400 font-bold text-base">SELECT SHIPS (1-3)</h2>
            <div className="text-xs text-purple-400 mt-1">
              Selected: {selectedShips.length}/3
            </div>
          </div>
          
          <div className="mb-4 relative">
            <div className="absolute inset-0 bg-[#2a3a2f] border-2 border-[#5a7a5f]" style={{
              boxShadow: 'inset 0 0 0 1px #1a2a1f'
            }}></div>
            <div className="absolute inset-[4px] bg-[#1a2a1f]" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(90,122,95,0.1) 1px, transparent 0)',
              backgroundSize: '3px 3px',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)'
            }}></div>
            <div className="relative p-3">
              <div className="text-[#a8c5ad] font-bold text-base mb-1">{mission.description}</div>
              <div className="text-xs text-[#5a9a8f]">{mission.tier} and higher • {mission.distance} LY</div>
            </div>
          </div>
          
          {!canAnyShipHandle && (
            <div className="text-red-400 text-sm text-center py-4 font-bold mb-4">
              with that fleet? I don't think so pal.
            </div>
          )}
          
          <div className="space-y-2 mb-4">
            {eligibleShips.map((ship) => {
              const isSelected = selectedShips.find(s => s.id === ship.id);
              return (
                <div
                  key={ship.id}
                  onClick={() => toggleShip(ship)}
                  className="relative cursor-pointer"
                >
                  <div className={`absolute inset-0 bg-[#2a3a2f] border-2 ${isSelected ? 'border-[#5aaa5f]' : 'border-[#5a7a5f]'}`} style={{
                    boxShadow: 'inset 0 0 0 1px #1a2a1f'
                  }}></div>
                  <div className={`absolute inset-[4px] ${isSelected ? 'bg-[#1a3a1f]' : 'bg-[#1a2a1f]'}`} style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(90,122,95,0.1) 1px, transparent 0)',
                    backgroundSize: '3px 3px',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)'
                  }}></div>
                  <div className="relative p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[#a8c5ad] font-bold text-sm">{ship.name}</div>
                        <div className="text-xs text-[#5a9a8f]">{ship.tier} • {ship.maxLY} LY • ${ship.hourlyPay}/h</div>
                      </div>
                      {isSelected ? (
                        <div className="text-green-400 font-bold">✓</div>
                      ) : (
                        <div className="text-green-400 text-xs">READY</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {ineligibleShips.map((ship) => (
              <div
                key={ship.id}
                className="relative opacity-50 cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-[#2a3a2f] border-2 border-[#7a5a5f]" style={{
                  boxShadow: 'inset 0 0 0 1px #1a2a1f'
                }}></div>
                <div className="absolute inset-[4px] bg-[#1a2a1f]" style={{
                  backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(90,122,95,0.1) 1px, transparent 0)',
                  backgroundSize: '3px 3px',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)'
                }}></div>
                <div className="relative p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[#a8c5ad] font-bold text-sm">{ship.name}</div>
                      <div className="text-xs text-[#5a9a8f]">{ship.tier} • {ship.maxLY} LY</div>
                    </div>
                    <div className="text-red-400 text-xs">OUT OF RANGE</div>
                  </div>
                </div>
              </div>
            ))}
            
            {busyShips.map((ship) => (
              <div
                key={ship.id}
                className="relative opacity-50 cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-[#2a3a2f] border-2 border-[#7a7a5f]" style={{
                  boxShadow: 'inset 0 0 0 1px #1a2a1f'
                }}></div>
                <div className="absolute inset-[4px] bg-[#1a2a1f]" style={{
                  backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(90,122,95,0.1) 1px, transparent 0)',
                  backgroundSize: '3px 3px',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)'
                }}></div>
                <div className="relative p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[#a8c5ad] font-bold text-sm">{ship.name}</div>
                      <div className="text-xs text-[#5a9a8f]">{ship.tier} • {ship.maxLY} LY</div>
                    </div>
                    <div className="text-amber-400 text-xs">DEPLOYED</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2 mt-4 flex-shrink-0">
            <button
              onClick={onCancel}
              className="flex-1 relative py-2.5 font-bold text-sm"
            >
              <div className="absolute inset-0 bg-[#2a3a2f] border-2 border-[#4a5a4f]" style={{
                boxShadow: 'inset 0 0 0 1px #1a2a1f'
              }}></div>
              <div className="absolute inset-[3px] bg-[#3a4a3f]" style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(74,90,79,0.15) 1px, transparent 0)',
                backgroundSize: '3px 3px'
              }}></div>
              <span className="relative text-[#a8c5ad]">BACK</span>
            </button>
            <button
              onClick={() => onConfirm(selectedShips)}
              disabled={selectedShips.length === 0}
              className="flex-1 relative py-2.5 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-[#2a3a2f] border-2 border-[#5aaa5f]" style={{
                boxShadow: 'inset 0 0 0 1px #1a2a1f'
              }}></div>
              <div className="absolute inset-[3px] bg-[#3a5a4f]" style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(90,170,95,0.15) 1px, transparent 0)',
                backgroundSize: '3px 3px'
              }}></div>
              <span className="relative text-[#d0e8d5]">CONFIRM ({selectedShips.length} SHIP{selectedShips.length !== 1 ? 'S' : ''})</span>
            </button>
        </div>
      </div>
    </div>
  );
}