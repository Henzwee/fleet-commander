import React from 'react';
import { X, Radio } from 'lucide-react';

export default function MissionReportScreen({ mission, event, onClose, onChoice, onTimeSkip, crystals }) {
  if (!mission) return null;
  
  const hoursRemaining = Math.ceil(mission.timeRemainingMinutes / 60);
  const crystalCost = hoursRemaining * 5;

  return (
    <div className="fixed bg-black/80 flex items-center justify-center" style={{
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 5
    }}>
      <div className="bg-gradient-to-br from-[#0a1a14] to-[#050f0a] border-2 border-[#5a7a5f] w-full h-full relative overflow-y-auto" style={{
        paddingTop: 'calc(var(--content-pad-top) + 24px)',
        paddingBottom: 'calc(var(--content-pad-bottom) + 32px)',
        paddingLeft: 'calc(var(--content-pad-left) + 24px)',
        paddingRight: 'calc(var(--content-pad-right) + 24px)',
        WebkitOverflowScrolling: 'touch'
      }}>
        <div className="flex items-center gap-2 mb-6">
          <Radio className="w-5 h-5 text-[#5a9a8f] animate-pulse" />
          <h2 className="text-[#5a9a8f] font-bold text-lg">M.A.N.I. REPORT</h2>
          <button
            onClick={onClose}
            className="ml-auto text-[#5a6a5f] active:text-[#5a9a8f] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {mission.shipImages && mission.shipImages.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {mission.shipImages.map((imgUrl, idx) => (
              <div key={idx} className="relative">
                <div className="absolute inset-0 bg-[#2a3a2f] border-2 border-[#3a5a4f]"></div>
                <div className="absolute inset-[2px] bg-[#1a2a1f]"></div>
                <img 
                  src={imgUrl} 
                  alt={`Ship ${idx + 1}`} 
                  className="relative w-full h-24 object-contain"
                />
              </div>
            ))}
          </div>
        )}

        <div className="mb-4">
          <div className="text-[#a8c5ad] font-bold text-base mb-2">{mission.shipNames || mission.shipName}</div>
          <div className="text-[#5a6a5f] text-xs space-y-1">
            <div>Distance: {mission.distance} ly</div>
            <div>Time Remaining: {mission.timeRemaining}</div>
            <div>Parts Reward: {mission.partsReward || 0} parts</div>
            <div>Wages: ₵{mission.totalWages || 0}</div>
            {mission.encounterResult && (
              <div className={`font-bold ${mission.encounterResult.includes('-') ? 'text-[#c84444]' : 'text-[#5a9a6f]'}`}>
                Encounter: {mission.encounterResult}
              </div>
            )}
          </div>
        </div>

        {event ? (
          <div className="relative p-4 mb-4">
            <div className="absolute inset-0 bg-[#3a2a1f] border-2 border-[#7a5a3f]" style={{
              boxShadow: 'inset 0 0 0 1px #1a1a0f'
            }}></div>
            <div className="absolute inset-[3px] bg-[#2a1a0f]" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(122,90,63,0.1) 1px, transparent 0)',
              backgroundSize: '3px 3px'
            }}></div>
            <div className="relative">
              <div className="text-amber-400 text-sm font-bold mb-2">{event.description}</div>
              <div className="flex flex-wrap gap-2 mt-3">
                {event.choices?.map((choice, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onChoice(choice.id);
                      onClose();
                    }}
                    className="relative px-4 py-2 text-xs font-bold tracking-wide"
                  >
                    {choice.primary ? (
                      <>
                        <div className="absolute inset-0 bg-[#3a7a4f] border-2 border-[#5a9a6f]" style={{
                          boxShadow: 'inset 0 1px 0 rgba(90,154,111,0.4)'
                        }}></div>
                        <div className="absolute inset-[2px] bg-[#4a8a5f]" style={{
                          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(90,154,111,0.15) 1px, transparent 0)',
                          backgroundSize: '3px 3px'
                        }}></div>
                        <span className="relative text-[#d0e8d5]">{choice.label}</span>
                      </>
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-[#5a3a1f] border-2 border-[#d89944]" style={{
                          boxShadow: 'inset 0 1px 0 rgba(216,153,68,0.4)'
                        }}></div>
                        <div className="absolute inset-[2px] bg-[#6a4a2f]" style={{
                          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(216,153,68,0.15) 1px, transparent 0)',
                          backgroundSize: '3px 3px'
                        }}></div>
                        <span className="relative text-[#ffc870]">{choice.label}</span>
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : mission.isFailed ? (
          <div className="relative p-4 mb-4">
            <div className="absolute inset-0 bg-[#3a1a1f] border-2 border-[#6a3a3f]" style={{
              boxShadow: 'inset 0 0 0 1px #1a0a0f'
            }}></div>
            <div className="absolute inset-[3px] bg-[#2a0a0f]" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(106,58,63,0.1) 1px, transparent 0)',
              backgroundSize: '3px 3px'
            }}></div>
            <div className="relative">
              <div className="text-[#c84444] text-sm font-bold mb-2">
                {mission.ships?.some(s => s.status === 'active')
                  ? `${mission.ships.find(s => s.status === 'destroyed')?.shipName} has been compromised. But the Ship Faced handbook says "no ship is ever truly totaled."`
                  : `${mission.shipNames} was unsuccessful in finishing the mission. This will put you behind on your monthly quota.`
                }
              </div>
              <button
                onClick={async () => {
                  await mission.ships?.forEach(async (ship) => {
                    if (ship.status === 'destroyed') {
                      await onChoice('tow_back');
                    }
                  });
                  onClose();
                }}
                className="relative w-full py-2 font-bold text-xs mt-3"
              >
                <div className="absolute inset-0 bg-[#3a3a3f] border-2 border-[#5a5a5f]"></div>
                <div className="absolute inset-[2px] bg-[#4a4a4f]"></div>
                <span className="relative text-[#d0d0d5]">TOW BACK</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="relative p-4 mb-4">
            <div className="absolute inset-0 bg-[#1a3a2f] border-2 border-[#3a6a4f]" style={{
              boxShadow: 'inset 0 0 0 1px #0a1a0f'
            }}></div>
            <div className="absolute inset-[3px] bg-[#0a2a1f]" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(58,106,79,0.1) 1px, transparent 0)',
              backgroundSize: '3px 3px'
            }}></div>
            <div className="relative text-[#5a9a6f] text-sm">
              All systems nominal. Mission proceeding smoothly.
            </div>
          </div>
        )}

        {onTimeSkip && (
          <button
            onClick={() => {
              onTimeSkip();
              onClose();
            }}
            disabled={crystals < crystalCost}
            className="relative w-full py-2 font-bold text-sm mb-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-[#5a3a6a] border-2 border-[#b89acf]" style={{
              boxShadow: 'inset 0 1px 0 rgba(184,154,207,0.4)'
            }}></div>
            <div className="absolute inset-[2px] bg-[#6a4a7a]" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(184,154,207,0.15) 1px, transparent 0)',
              backgroundSize: '3px 3px'
            }}></div>
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695af5ca435140b76c0dadc9/26d2c74b8_crystal.png" 
              alt="Crystal" 
              className="w-4 h-4 relative"
            />
            <span className="relative text-[#e8d0ff]">SKIP ({crystalCost})</span>
          </button>
        )}

        <button
          onClick={onClose}
          className="relative w-full py-2 font-bold text-sm"
        >
          <div className="absolute inset-0 bg-[#3a3a3f] border-2 border-[#5a5a5f]" style={{
            boxShadow: 'inset 0 1px 0 rgba(90,90,95,0.4)'
          }}></div>
          <div className="absolute inset-[2px] bg-[#4a4a4f]" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(90,90,95,0.15) 1px, transparent 0)',
            backgroundSize: '3px 3px'
          }}></div>
          <span className="relative text-[#d0d0d5]">CLOSE</span>
        </button>
      </div>
    </div>
  );
}