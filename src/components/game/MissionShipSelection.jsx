import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function MissionShipSelection({ mission, ships, onConfirm, onCancel }) {
  const [selectedShip, setSelectedShip] = useState(null);
  
  if (!mission) return null;
  
  const eligibleShips = ships.filter(ship => ship.maxLY >= mission.requiredLY);
  const ineligibleShips = ships.filter(ship => ship.maxLY < mission.requiredLY);
  const canAnyShipHandle = eligibleShips.length > 0;
  
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-950 border-2 border-cyan-500 rounded-xl max-w-md w-full shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-cyan-400 font-bold text-lg">SELECT SHIP</h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-cyan-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="mb-4 bg-gray-800/50 rounded-lg p-3 border border-cyan-500/30">
            <div className="text-cyan-100 font-bold text-sm mb-1">{mission.description}</div>
            <div className="text-xs text-gray-400">{mission.tier} and higher • {mission.distance} LY</div>
          </div>
          
          {!canAnyShipHandle ? (
            <div className="text-red-400 text-sm text-center py-8 font-bold">
              with that crew? I dont think so, pal.
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
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
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onCancel}
              className="bg-gray-700 hover:bg-gray-600 border-2 border-gray-600 rounded-lg py-3 text-white font-bold transition-all"
            >
              BACK
            </button>
            <button
              onClick={() => selectedShip && onConfirm(selectedShip)}
              disabled={!selectedShip}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed border-2 border-green-500 disabled:border-gray-500 rounded-lg py-3 text-white font-bold transition-all"
            >
              CONFIRM
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}