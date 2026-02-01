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
      <div className="bg-gradient-to-br from-gray-900 to-gray-950 border-2 border-cyan-500 w-full h-full relative overflow-y-auto" style={{
        paddingTop: 'calc(var(--content-pad-top) + 24px)',
        paddingBottom: 'calc(var(--content-pad-bottom) + 32px)',
        paddingLeft: 'calc(var(--content-pad-left) + 24px)',
        paddingRight: 'calc(var(--content-pad-right) + 24px)',
        WebkitOverflowScrolling: 'touch'
      }}>
        <div className="flex items-center gap-2 mb-6">
          <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
          <h2 className="text-cyan-400 font-bold text-lg">M.A.N.I. REPORT</h2>
          <button
            onClick={onClose}
            className="ml-auto text-gray-400 active:text-cyan-400 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {mission.shipImages && mission.shipImages.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {mission.shipImages.map((imgUrl, idx) => (
              <img 
                key={idx}
                src={imgUrl} 
                alt={`Ship ${idx + 1}`} 
                className="w-full h-24 object-contain rounded-lg bg-gray-800/50"
              />
            ))}
          </div>
        )}

        <div className="mb-4">
          <div className="text-cyan-100 font-bold text-base mb-2">{mission.shipNames || mission.shipName}</div>
          <div className="text-gray-400 text-xs space-y-1">
            <div>Distance: {mission.distance} ly</div>
            <div>Time Remaining: {mission.timeRemaining}</div>
            <div>Parts Reward: {mission.partsReward || 0} parts</div>
            <div>Wages: ${mission.totalWages || 0}</div>
            {mission.encounterResult && (
              <div className={`font-bold ${mission.encounterResult.includes('-') ? 'text-red-400' : 'text-green-400'}`}>
                Encounter: {mission.encounterResult}
              </div>
            )}
          </div>
        </div>

        {event ? (
          <div className="bg-amber-900/20 border-2 border-amber-500/50 rounded-lg p-4 mb-4">
            <div className="text-amber-400 text-sm font-bold mb-2">{event.description}</div>
            <div className="flex flex-wrap gap-2 mt-3">
              {event.choices?.map((choice, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onChoice(choice.id);
                    onClose();
                  }}
                  className={`px-4 py-2 rounded border-2 text-xs font-bold tracking-wide transition-all ${
                    choice.primary
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 active:bg-cyan-500/30'
                      : 'bg-gray-700/50 border-gray-500 text-gray-300 active:bg-gray-600/50'
                  }`}
                >
                  {choice.label}
                </button>
              ))}
            </div>
          </div>
        ) : mission.isFailed ? (
          <div className="bg-red-900/20 border-2 border-red-500/50 rounded-lg p-4 mb-4">
            <div className="text-red-400 text-sm font-bold mb-2">
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
              className="w-full bg-gray-700 active:bg-gray-600 border-2 border-gray-600 rounded-lg py-2 text-white font-bold text-xs transition-all mt-3"
            >
              TOW BACK
            </button>
          </div>
        ) : (
          <div className="bg-green-900/20 border-2 border-green-500/50 rounded-lg p-4 mb-4">
            <div className="text-green-400 text-sm">
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
            className="w-full bg-gradient-to-br from-purple-600 to-purple-700 active:from-purple-700 active:to-purple-800 disabled:bg-gray-600 disabled:cursor-not-allowed border-2 border-purple-400 disabled:border-gray-500 rounded-lg py-2 text-white font-bold text-sm transition-all mb-3 flex items-center justify-center gap-2"
          >
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695af5ca435140b76c0dadc9/26d2c74b8_crystal.png" 
              alt="Crystal" 
              className="w-4 h-4"
            />
            <span>SKIP ({crystalCost})</span>
          </button>
        )}

        <button
          onClick={onClose}
          className="w-full bg-gray-700 active:bg-gray-600 border-2 border-gray-600 rounded-lg py-2 text-white font-bold text-sm transition-all"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
}