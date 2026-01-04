import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function DecisionPrompt({ event, onChoice }) {
  if (!event) return null;
  
  return (
    <div className="bg-gradient-to-r from-amber-900/30 to-red-900/30 border-2 border-amber-500 rounded-lg p-4 mb-3 border-glow-amber">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <div className="text-amber-400 font-bold text-sm mb-2">ALERT: {event.title}</div>
          <div className="text-amber-100/90 text-xs mb-3">{event.description}</div>
          
          <div className="flex flex-wrap gap-2">
            {event.choices?.map((choice, idx) => (
              <button
                key={idx}
                onClick={() => onChoice(choice.id)}
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
      </div>
    </div>
  );
}