import React from 'react';
import { Zap, Clock } from 'lucide-react';
import InsufficientFundsToast from './InsufficientFundsToast';

export default function CrystalTimeSkip({ mission, onConfirm, onCancel, crystals, isTutorial = false }) {
  const [insufficientTrigger, setInsufficientTrigger] = React.useState(0);
  // Use timeRemainingMinutes which is in minutes, not the formatted string
  const timeInMinutes = Number(mission.timeRemainingMinutes) || 0;
  const hoursRemaining = Math.max(1, Math.ceil(timeInMinutes / 60));
  const crystalCost = hoursRemaining * 5;
  const canAfford = crystals >= crystalCost;

  return (
    <div className="fixed bg-black/80 flex items-center justify-center" style={{
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 5
    }}>
      <div className="bg-gradient-to-br from-[#0a1a14] to-[#050f0a] border-2 border-[#5a7a5f] w-full h-full relative flex flex-col overflow-y-auto" style={{
        paddingTop: 'calc(var(--content-pad-top) + 24px)',
        paddingBottom: 'calc(var(--content-pad-bottom) + 32px)',
        paddingLeft: 'calc(var(--content-pad-left) + 24px)',
        paddingRight: 'calc(var(--content-pad-right) + 24px)',
        WebkitOverflowScrolling: 'touch'
      }}>
        <div className="relative flex-1 flex flex-col">
          <div className="mb-6">
            <div className="text-[#d0e8d5] font-bold text-lg">HYPERDRIVE BOOST</div>
            <div className="text-sm text-[#8fb4c9] mt-1">Accelerate mission using crystals</div>
          </div>

          <div className="space-y-4 flex-1">
            <div className="relative p-4">
              <div className="absolute inset-0 bg-[#2a3a2f] border-2 border-[#5a7a5f]" style={{
                boxShadow: 'inset 0 0 0 1px #1a2a1f'
              }}></div>
              <div className="absolute inset-[4px] bg-[#1a2a1f]" style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(90,122,95,0.1) 1px, transparent 0)',
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

          <div className="flex gap-3 mt-4">
            {!isTutorial && (
              <button
                onClick={onCancel}
                className="relative flex-1 py-2 font-bold text-sm"
              >
                <div className="absolute inset-0 bg-[#2a3a2f] border-2 border-[#4a5a4f]" style={{
                  boxShadow: 'inset 0 0 0 1px #1a2a1f'
                }}></div>
                <div className="absolute inset-[3px] bg-[#3a4a3f]" style={{
                  backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(74,90,79,0.15) 1px, transparent 0)',
                  backgroundSize: '3px 3px'
                }}></div>
                <span className="relative text-[#a8c5ad]">CANCEL</span>
              </button>
            )}
            <button
              onClick={() => {
                if (!canAfford && !isTutorial) {
                  setInsufficientTrigger(t => t + 1);
                  return;
                }
                onConfirm();
              }}
              disabled={false}
              className={`${isTutorial ? 'flex-1' : 'flex-1'} relative py-2 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="absolute inset-0 bg-[#5a3a6a] border-2 border-[#b89acf]" style={{
                boxShadow: 'inset 0 1px 0 rgba(184,154,207,0.4)'
              }}></div>
              <div className="absolute inset-[2px] bg-[#6a4a7a]" style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(184,154,207,0.15) 1px, transparent 0)',
                backgroundSize: '3px 3px'
              }}></div>
              <span className="relative text-[#e8d0ff]">BOOST</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}