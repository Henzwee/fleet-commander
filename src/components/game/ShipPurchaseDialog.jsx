import React from 'react';
import { X } from 'lucide-react';

export default function ShipPurchaseDialog({ ship, onConfirm, onCancel }) {
  if (!ship) return null;

  return (
    <div className="fixed z-[4] bg-gradient-to-br from-gray-900 to-gray-950 flex flex-col" style={{
      top: 'var(--content-pad-top)',
      bottom: 'var(--content-pad-bottom)',
      left: 'var(--content-pad-left)',
      right: 'var(--content-pad-right)'
    }}>
      <div className="flex-1 flex flex-col p-5 relative">
        <button
          onClick={onCancel}
          className="absolute top-0 right-0 text-gray-400 hover:text-cyan-400 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-cyan-400 font-bold text-base mb-3">CONFIRM PURCHASE</h2>

        {ship.imageUrl && (
          <img 
            src={ship.imageUrl} 
            alt={ship.name} 
            className="w-full h-32 object-contain mb-3 rounded-lg bg-gray-800/50"
          />
        )}

        <div className="space-y-2 mb-4 flex-1">
          <div className="text-cyan-100 font-bold text-base">{ship.name}</div>
          
          <div className="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-2.5 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Tier:</span>
              <span className="text-cyan-300 font-bold">{ship.tier}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Max Range:</span>
              <span className="text-cyan-300 font-bold">{ship.maxLY} LY</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Hourly Pay:</span>
              <span className="text-amber-400 font-bold">${ship.hourlyPay}/hr</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Price:</span>
              <span className="text-green-400 font-bold">${ship.price}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-auto">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-700 hover:bg-gray-600 border-2 border-gray-600 rounded-lg py-2.5 text-white font-bold text-sm transition-all"
          >
            BACK
          </button>
          <button
            onClick={() => onConfirm(1)}
            className="flex-1 bg-green-600 hover:bg-green-700 border-2 border-green-500 rounded-lg py-2.5 text-white font-bold text-sm transition-all"
          >
            BUY ${ship.price}
          </button>
        </div>
      </div>
    </div>
  );
}