import React from 'react';
import { Zap, Clock } from 'lucide-react';

export default function CrystalTimeSkip({ mission, onConfirm, onCancel, crystals, isTutorial = false }) {
  const timeRemaining = mission.timeRemaining || 0;
  const hoursRemaining = Math.ceil(timeRemaining / 60);
  const crystalCost = hoursRemaining * 5;
  const canAfford = crystals >= crystalCost;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <div 
        className="bg-gradient-to-br from-gray-900 to-gray-950 border-4 border-purple-500 rounded-lg shadow-2xl"
        style={{
          width: 'min(420px, 90vw)',
          padding: '32px'
        }}
      >
        <div className="mb-6">
          <div className="text-purple-400 font-bold text-xl mb-2">HYPERDRIVE BOOST</div>
          <div className="text-xs text-purple-400/60">Accelerate mission using crystals</div>
        </div>

        <div className="mb-6 space-y-4">
          <div className="bg-gray-800/50 border border-purple-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-cyan-400">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Time Remaining</span>
              </div>
              <span className="text-cyan-400 font-bold">{hoursRemaining}h</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-400">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695af5ca435140b76c0dadc9/26d2c74b8_crystal.png" 
                  alt="Crystal" 
                  className="w-4 h-4"
                />
                <span className="text-sm">Crystal Cost</span>
              </div>
              <span className="text-purple-400 font-bold">{crystalCost}</span>
            </div>
          </div>

          {isTutorial && (
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
              <p className="text-cyan-400 text-xs">
                Tutorial: Use crystals to complete this mission instantly!
              </p>
            </div>
          )}

          {!canAfford && !isTutorial && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-400 text-xs">Not enough crystals!</p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          {!isTutorial && (
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-700 border-2 border-gray-600 rounded-lg py-3 text-white font-bold text-sm"
            >
              CANCEL
            </button>
          )}
          <button
            onClick={onConfirm}
            disabled={!canAfford}
            className={`${isTutorial ? 'flex-1' : 'flex-1'} bg-purple-600 border-2 border-purple-500 rounded-lg py-3 text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            BOOST
          </button>
        </div>
      </div>
    </div>
  );
}