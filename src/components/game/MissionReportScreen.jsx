import React from 'react';
import { X, Radio } from 'lucide-react';

export default function MissionReportScreen({ mission, event, onClose, onChoice }) {
  if (!mission) return null;

  return (
    <div className="fixed bg-black/80 flex items-center justify-center" style={{
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 5,
      paddingTop: 'var(--content-pad-top)',
      paddingBottom: 'var(--content-pad-bottom)',
      paddingLeft: 'var(--content-pad-left)',
      paddingRight: 'var(--content-pad-right)'
    }}>
      <div className="bg-gradient-to-br from-gray-900 to-gray-950 border-2 border-cyan-500 w-full p-6 pb-8 relative flex flex-col" style={{ maxHeight: '100%' }}>
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

        <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
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
              <div>Reward: ${mission.reward}</div>
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
          ) : (
            <div className="bg-green-900/20 border-2 border-green-500/50 rounded-lg p-4 mb-4">
              <div className="text-green-400 text-sm">
                All systems nominal. Mission proceeding smoothly.
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full bg-gray-700 active:bg-gray-600 border-2 border-gray-600 rounded-lg py-2 text-white font-bold text-sm transition-all mt-4 flex-shrink-0"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
}