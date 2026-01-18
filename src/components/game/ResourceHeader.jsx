import React from 'react';
import { useGame } from './GameProvider';
import { DollarSign, Zap, Fuel } from 'lucide-react';

export default function ResourceHeader() {
  const { gameState } = useGame();
  
  return (
    <div className="fixed z-[3] bg-gradient-to-r from-gray-900/95 to-gray-800/95 backdrop-blur-sm" style={{ 
      top: 0,
      left: 'var(--content-pad-left)',
      right: 'var(--content-pad-right)',
      height: 'calc(var(--content-pad-top) + 28px)'
    }}>
      <div className="flex items-center justify-between gap-3 rounded-full px-4 py-3" style={{
        position: 'absolute',
        top: 'calc(var(--content-pad-top) - 10px)',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 48px)',
        maxWidth: '452px'
      }}>
        <div className="flex items-center gap-1.5">
          <DollarSign className="w-4 h-4 text-amber-400" />
          <span className="text-amber-400 font-bold text-sm">
            {gameState?.credits?.toLocaleString() || 0}
          </span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-purple-400" />
          <span className="text-purple-400 font-bold text-sm">
            {gameState?.crystals || 0}
          </span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <Fuel className="w-4 h-4 text-cyan-400" />
          <span className="text-cyan-400 font-bold text-sm">
            {gameState?.fuel || 0}
          </span>
        </div>
      </div>
    </div>
  );
}