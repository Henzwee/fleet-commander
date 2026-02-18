import React from 'react';
import { X } from 'lucide-react';

export default function ShipPurchaseDialog({ ship, onConfirm, onCancel }) {
  if (!ship) return null;

  return (
    <div className="fixed z-[4] bg-gradient-to-br from-[#0a1a14] to-[#050f0a] flex flex-col" style={{
      top: 'calc(var(--content-pad-top) - 40px)',
      bottom: 'calc(var(--content-pad-bottom) - 30px)',
      left: 'var(--content-pad-left)',
      right: 'var(--content-pad-right)'
    }}>
      <div className="flex-1 flex flex-col px-6 py-4 relative">
        <div className="mb-6 mt-6">
          <h2 className="font-bold text-base" style={{ color: 'var(--theme-primary)' }}>CONFIRM PURCHASE</h2>
        </div>

        {ship.imageUrl && (
          <div className="relative mb-3">
            <div className="absolute inset-0 border-2" style={{
              backgroundColor: '#2a3a2f',
              borderColor: 'var(--theme-border)',
              boxShadow: 'inset 0 0 0 1px #1a2a1f'
            }}></div>
            <div className="absolute inset-[4px] bg-[#1a2a1f]" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(90,122,95,0.1) 1px, transparent 0)',
              backgroundSize: '3px 3px'
            }}></div>
            <img 
              src={ship.imageUrl} 
              alt={ship.name} 
              className="relative w-full h-32 object-contain"
            />
          </div>
        )}

        <div className="space-y-2 mb-8 flex-1">
          <div className="font-bold text-base" style={{ color: 'var(--theme-light)' }}>{ship.name}</div>
          
          <div className="relative p-2.5">
            <div className="absolute inset-0 border-2" style={{
              backgroundColor: '#2a3a2f',
              borderColor: 'var(--theme-border-dark)',
              boxShadow: 'inset 0 0 0 1px #1a2a1f'
            }}></div>
            <div className="absolute inset-[3px] bg-[#1a2a1f]" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(58,90,79,0.15) 1px, transparent 0)',
              backgroundSize: '3px 3px'
            }}></div>
            <div className="relative space-y-1.5">
              <div className="flex justify-between text-xs">
                <span style={{ color: 'var(--theme-text-dim)' }}>Tier:</span>
                <span className="font-bold" style={{ color: 'var(--theme-primary)' }}>{ship.tier}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: 'var(--theme-text-dim)' }}>Max Range:</span>
                <span className="font-bold" style={{ color: 'var(--theme-primary)' }}>{ship.maxLY} LY</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: 'var(--theme-text-dim)' }}>Hourly Pay:</span>
                <span className="text-amber-400 font-bold">${ship.hourlyPay}/hr</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: 'var(--theme-text-dim)' }}>Price:</span>
                <span className="font-bold" style={{ color: 'var(--theme-primary)' }}>${ship.price}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-8">
          <button
            onClick={onCancel}
            className="relative flex-1 py-2.5 font-bold text-sm"
          >
            <div className="absolute inset-0 bg-[#3a3a3f] border-2 border-[#5a5a5f]" style={{
              boxShadow: 'inset 0 1px 0 rgba(90,90,95,0.4)'
            }}></div>
            <div className="absolute inset-[2px] bg-[#4a4a4f]" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(90,90,95,0.15) 1px, transparent 0)',
              backgroundSize: '3px 3px'
            }}></div>
            <span className="relative text-[#d0d0d5]">BACK</span>
          </button>
          <button
            onClick={() => onConfirm(1)}
            className="relative flex-1 py-2.5 font-bold text-sm"
          >
            <div className="absolute inset-0 border-2" style={{
              backgroundColor: 'var(--theme-dark)',
              borderColor: 'var(--theme-primary)',
              boxShadow: 'inset 0 1px 0 rgba(90,154,111,0.4)'
            }}></div>
            <div className="absolute inset-[2px]" style={{
              backgroundColor: 'var(--theme-dark)',
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(90,154,111,0.15) 1px, transparent 0)',
              backgroundSize: '3px 3px'
            }}></div>
            <span className="relative" style={{ color: 'var(--theme-text-bright)' }}>BUY ${ship.price}</span>
          </button>
        </div>
      </div>
    </div>
  );
}