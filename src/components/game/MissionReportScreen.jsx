import React from 'react';
import { X, Radio } from 'lucide-react';

export default function MissionReportScreen({ mission, event, onClose, onChoice }) {
  if (!mission) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-950 border-2 border-cyan-500 rounded-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-cyan-400 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <Radio className="w-6 h-6 text-cyan-400" />
          <h2 className="text-cyan-400 font-bold text-lg">M.A.N.I. TRANSMISSION</h2>
        </div>

        {mission.shipImage && (
          <img 
            src={mission.shipImage} 
            alt={mission.shipName} 
            className="w-full h-32 object-contain mb-4 rounded-lg bg-gray-800/50"
          />
        )}

        <div className="mb-4">
          <div className="text-cyan-100 font-bold text-base mb-2">{mission.shipName}</div>
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
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 hover:bg-cyan-500/30'
                      : 'bg-gray-700/50 border-gray-500 text-gray-300 hover:bg-gray-600/50'
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

        <button
          onClick={onClose}
          className="w-full bg-gray-700 hover:bg-gray-600 border-2 border-gray-600 rounded-lg py-2 text-white font-bold text-sm transition-all"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
}