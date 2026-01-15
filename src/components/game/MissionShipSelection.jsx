import React, { useState } from 'react';

export default function MissionShipSelection({ mission, ships, onConfirm, onCancel }) {
  const [selectedShips, setSelectedShips] = useState([]);
  
  if (!mission) return null;
  
  const eligibleShips = ships.filter(ship => ship.maxLY >= mission.requiredLY);
  const ineligibleShips = ships.filter(ship => ship.maxLY < mission.requiredLY);
  
  const toggleShip = (ship) => {
    if (selectedShips.find(s => s.id === ship.id)) {
      setSelectedShips(selectedShips.filter(s => s.id !== ship.id));
    } else if (selectedShips.length < 3) {
      setSelectedShips([...selectedShips, ship]);
    }
  };
  const canAnyShipHandle = eligibleShips.length > 0;
  
  return (
    <div className="fixed z-[4] bg-gradient-to-br from-gray-900 to-gray-950 flex flex-col overflow-hidden" style={{
      top: 'calc(var(--content-pad-top) - 40px)',
      bottom: 'calc(var(--content-pad-bottom) - 30px)',
      left: 'var(--content-pad-left)',
      right: 'var(--content-pad-right)'
    }}>
      <div className="flex-1 flex flex-col px-6 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="mb-6 mt-12">
            <h2 className="text-cyan-400 font-bold text-base">SELECT SHIP</h2>
          </div>
          
          <div className="mb-4 bg-gray-800/50 rounded-lg p-3 border border-cyan-500/30">
            <div className="text-cyan-100 font-bold text-base mb-1">{mission.description}</div>
            <div className="text-xs text-gray-400">{mission.tier} and higher • {mission.distance} LY</div>
          </div>
          
          {!canAnyShipHandle ? (
            <div className="text-red-400 text-sm text-center py-8 font-bold">
              with that crew? I dont think so, pal.
            </div>
          ) : (
            <div className="space-y-2 mb-4">
              {eligibleShips.map((ship) => (
                <div
                  key={ship.id}
                  onClick={() => setSelectedShip(ship)}
                  className={`bg-gray-800 border-2 rounded-lg p-3 transition-all cursor-pointer ${
                    selectedShip?.id === ship.id
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-gray-600 hover:border-green-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-cyan-100 font-bold text-sm">{ship.name}</div>
                      <div className="text-xs text-gray-400">{ship.tier} • {ship.maxLY} LY</div>
                    </div>
                    <div className="text-green-400 text-xs">READY</div>
                  </div>
                </div>
              ))}
              
              {ineligibleShips.map((ship) => (
                <div
                  key={ship.id}
                  className="bg-gray-800 border-2 border-red-500/30 rounded-lg p-3 opacity-50 cursor-not-allowed"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-cyan-100 font-bold text-sm">{ship.name}</div>
                      <div className="text-xs text-gray-400">{ship.tier} • {ship.maxLY} LY</div>
                    </div>
                    <div className="text-red-400 text-xs">OUT OF RANGE</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex gap-2 mb-8 mt-4 flex-shrink-0">
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-700 hover:bg-gray-600 border-2 border-gray-600 rounded-lg py-2.5 text-white font-bold text-sm transition-all"
            >
              BACK
            </button>
            <button
              onClick={() => selectedShip && onConfirm(selectedShip)}
              disabled={!selectedShip}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed border-2 border-green-500 disabled:border-gray-500 rounded-lg py-2.5 text-white font-bold text-sm transition-all"
            >
              CONFIRM
            </button>
        </div>
      </div>
    </div>
  );
}