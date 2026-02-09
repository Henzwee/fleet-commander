import React from 'react';
import { useGame } from './GameProvider';
import { DollarSign, Zap, Fuel } from 'lucide-react';

export default function ResourceHeader() {
  const { gameState } = useGame();
  
  return (
    <div className="fixed z-[3] pixel-panel" style={{ 
      top: 0,
      left: 'var(--content-pad-left)',
      right: 'var(--content-pad-right)',
      height: 'calc(var(--content-pad-top) + 28px)',
      background: 'linear-gradient(180deg, var(--navy-mid) 0%, var(--navy-dark) 100%)',
      borderBottom: '3px solid var(--navy-light)'
    }}>
      <div className="flex items-center justify-between gap-3 px-4 py-3" style={{
        position: 'absolute',
        top: 'calc(var(--content-pad-top) - 10px)',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 48px)',
        maxWidth: '452px',
        background: 'linear-gradient(180deg, var(--navy-light) 0%, var(--navy-mid) 100%)',
        border: '2px solid var(--pixel-teal)',
        boxShadow: 'inset 2px 2px 0 rgba(255,255,255,0.2), inset -2px -2px 0 rgba(0,0,0,0.4)'
      }}>
        <div className="flex items-center gap-1.5">
          <DollarSign className="w-4 h-4 text-amber-400" />
          <span className="text-amber-400 font-bold text-[10px] leading-none">
            {gameState?.credits?.toLocaleString() || 0}
          </span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695af5ca435140b76c0dadc9/26d2c74b8_crystal.png" 
            alt="Crystal" 
            className="w-4 h-4"
          />
          <span className="text-purple-400 font-bold text-[10px] leading-none">
            {gameState?.crystals || 0}
          </span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <Fuel className="w-4 h-4 text-cyan-400" />
          <span className="text-cyan-400 font-bold text-[10px] leading-none">
            {gameState?.fuel || 0}
          </span>
        </div>
      </div>
    </div>
  );
}