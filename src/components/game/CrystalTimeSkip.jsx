import React from 'react';
import { Zap, Clock } from 'lucide-react';

export default function CrystalTimeSkip({ mission, onConfirm, onCancel, crystals, isTutorial = false }) {
  // Use timeRemainingMinutes which is in minutes, not the formatted string
  const timeInMinutes = Number(mission.timeRemainingMinutes) || 0;
  const hoursRemaining = Math.max(1, Math.ceil(timeInMinutes / 60));
  const crystalCost = hoursRemaining * 5;
  const canAfford = crystals >= crystalCost;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <div 
        className="relative bg-gradient-to-br from-[#0a1a14] to-[#050f0a] shadow-2xl"
        style={{
          width: 'min(420px, 90vw)',
          padding: '32px'
        }}
      >
        <div className="absolute inset-0 border-4 border-[#6a5a7a]" style={{
          boxShadow: 'inset 0 0 0 2px #1a2a1f'
        }}></div>
        <div className="relative">
          <div className="mb-6">
            <div className="text-[#b89acf] font-bold text-xl mb-2">HYPERDRIVE BOOST</div>
            <div className="text-xs text-[#6a5a7a]">Accelerate mission using crystals</div>
          </div>

          <div className="mb-6 space-y-4">
            <div className="relative p-4">
              <div className="absolute inset-0 bg-[#2a3a2f] border-2 border-[#3a5a4f]" style={{
                boxShadow: 'inset 0 0 0 1px #1a2a1f'
              }}></div>
              <div className="absolute inset-[3px] bg-[#1a2a1f]" style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(58,90,79,0.15) 1px, transparent 0)',
                backgroundSize: '3px 3px'
              }}></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-[#5a9a8f]">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Time Remaining</span>
                  </div>
                  <span className="text-[#5a9a8f] font-bold">{hoursRemaining}h</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#b89acf]">
                    <img 
                      src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695af5ca435140b76c0dadc9/26d2c74b8_crystal.png" 
                      alt="Crystal" 
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Crystal Cost</span>
                  </div>
                  <span className="text-[#b89acf] font-bold">{crystalCost}</span>
                </div>
              </div>
            </div>

            {isTutorial && (
              <div className="relative p-3">
                <div className="absolute inset-0 bg-[#2a3a4f] border-2 border-[#3a5a6f]"></div>
                <div className="absolute inset-[2px] bg-[#1a2a3f]"></div>
                <p className="text-[#5a9a8f] text-xs relative">
                  Tutorial: Use crystals to complete this mission instantly!
                </p>
              </div>
            )}

            {!canAfford && !isTutorial && (
              <div className="relative p-3">
                <div className="absolute inset-0 bg-[#4a2a2f] border-2 border-[#6a3a3f]"></div>
                <div className="absolute inset-[2px] bg-[#3a1a1f]"></div>
                <p className="text-[#c84444] text-xs relative">Not enough crystals!</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {!isTutorial && (
              <button
                onClick={onCancel}
                className="relative flex-1 py-3 font-bold text-sm"
              >
                <div className="absolute inset-0 bg-[#3a3a3f] border-2 border-[#5a5a5f]" style={{
                  boxShadow: 'inset 0 1px 0 rgba(90,90,95,0.4)'
                }}></div>
                <div className="absolute inset-[2px] bg-[#4a4a4f]" style={{
                  backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(90,90,95,0.15) 1px, transparent 0)',
                  backgroundSize: '3px 3px'
                }}></div>
                <span className="relative text-[#d0d0d5]">CANCEL</span>
              </button>
            )}
            <button
              onClick={onConfirm}
              disabled={!canAfford}
              className={`${isTutorial ? 'flex-1' : 'flex-1'} relative py-3 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="absolute inset-0 bg-[#3a2a4a] border-2 border-[#6a5a7a]" style={{
                boxShadow: 'inset 0 1px 0 rgba(106,90,122,0.4)'
              }}></div>
              <div className="absolute inset-[2px] bg-[#4a3a5a]" style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(106,90,122,0.15) 1px, transparent 0)',
                backgroundSize: '3px 3px'
              }}></div>
              <span className="relative text-[#d0d0e8]">BOOST</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}