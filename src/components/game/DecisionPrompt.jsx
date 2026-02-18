import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function DecisionPrompt({ event, onChoice }) {
  if (!event) return null;
  
  return (
    <div className="relative p-4 mb-3">
      <div className="absolute inset-0 bg-[#3a2a1f] border-2 border-[#7a5a3f]" style={{
        boxShadow: 'inset 0 0 0 1px #1a1a0f, 0 0 10px rgba(122,90,63,0.5)'
      }}></div>
      <div className="absolute inset-[4px] bg-[#2a1a0f]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(122,90,63,0.1) 1px, transparent 0)',
        backgroundSize: '3px 3px'
      }}></div>
      <div className="relative flex items-start gap-3">
        <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <div className="text-amber-400 font-bold text-sm mb-2">ALERT: {event.title}</div>
          <div className="text-[#d0c5ad] text-xs mb-3">{event.description}</div>
          
          <div className="flex gap-2">
            {event.choices?.map((choice, idx) => (
              <button
                key={idx}
                onClick={() => onChoice(choice.id)}
                className={`relative flex-1 px-4 py-2 text-xs font-bold tracking-wide whitespace-nowrap ${
                  choice.primary ? '' : ''
                }`}
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
                    <div className="absolute inset-0 bg-[#3a3a3f] border-2 border-[#5a5a5f]" style={{
                      boxShadow: 'inset 0 1px 0 rgba(90,90,95,0.4)'
                    }}></div>
                    <div className="absolute inset-[2px] bg-[#4a4a4f]" style={{
                      backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(90,90,95,0.15) 1px, transparent 0)',
                      backgroundSize: '3px 3px'
                    }}></div>
                    <span className="relative text-[#a0a0a5]">{choice.label}</span>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}