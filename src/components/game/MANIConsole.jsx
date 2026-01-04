import React from 'react';

export default function MANIConsole({ messages = [], autoResolve = false, onToggleAuto }) {
  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-950 border-2 border-cyan-500/50 rounded-lg p-4 mb-3 border-glow-cyan">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-cyan-500/30">
        <div className="text-cyan-400 font-bold tracking-wider text-sm">MESSAGE LOG</div>
        <button
          onClick={onToggleAuto}
          className={`text-xs px-3 py-1 rounded border transition-all ${
            autoResolve
              ? 'bg-green-500/20 border-green-500 text-green-400'
              : 'bg-gray-700 border-gray-500 text-gray-400'
          }`}
        >
          AUTO: {autoResolve ? 'ON' : 'OFF'}
        </button>
      </div>
      
      <div className="space-y-1 max-h-32 overflow-y-auto text-xs text-cyan-100/90 font-mono">
        {messages.length === 0 ? (
          <div className="text-gray-500 italic">System standby. Awaiting input...</div>
        ) : (
          messages.slice(-5).map((msg, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-cyan-400">&gt;</span>
              <span>{msg}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}