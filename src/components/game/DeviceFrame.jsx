import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Home } from 'lucide-react';

export default function DeviceFrame({ children, title = "M.A.N.I." }) {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-2 overflow-hidden">
      <div 
        className="frame-wrap relative"
        style={{
          width: 'min(430px, 96vw)',
          height: 'min(930px, 96svh)',
          '--frame-slice': '72px'
        }}
      >
        {/* Frame overlay using border-image */}
        <div 
          className="frame-overlay absolute inset-0 pointer-events-none"
          style={{
            borderImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695af5ca435140b76c0dadc9/4bbe613b0_framebeta.png) 72 fill stretch',
            borderWidth: '72px',
            borderStyle: 'solid'
          }}
        />
        
        {/* Top Center Screen - M.A.N.I. Title */}
        <div 
          className="absolute z-20 flex items-center justify-center"
          style={{
            top: '2.5%',
            left: '35%',
            width: '30%',
            height: '4%'
          }}
        >
          <h1 
            className="font-bold text-white tracking-[0.3em] uppercase"
            style={{ 
              fontFamily: 'Orbitron, sans-serif',
              fontSize: 'clamp(0.75rem, 2.5vw, 1rem)',
              textShadow: '0 0 10px rgba(0, 212, 255, 0.8), 0 2px 4px rgba(0, 0, 0, 0.8)'
            }}
          >
            {title}
          </h1>
        </div>
        
        {/* Top Right Screen - Home Button */}
        <button
          onClick={() => navigate(createPageUrl('Main'))}
          className="absolute z-20 flex items-center justify-center hover:opacity-80 transition-opacity"
          style={{
            top: '2.5%',
            right: '8%',
            width: '8%',
            height: '4%'
          }}
        >
          <Home 
            className="text-amber-400" 
            style={{ width: 'clamp(16px, 4vw, 24px)', height: 'clamp(16px, 4vw, 24px)' }}
          />
        </button>
        
        {/* Main Content Screen - Center scrollable area */}
        <div 
          className="screen absolute bg-gradient-to-br from-[#0a1628] to-[#050a14] scanline overflow-hidden"
          style={{
            top: 'calc(var(--frame-slice) + 2%)',
            left: 'calc(var(--frame-slice) - 8px)',
            right: 'calc(var(--frame-slice) - 8px)',
            bottom: 'calc(var(--frame-slice) + 18%)'
          }}
        >
          {children}
        </div>
        
        {/* Bottom Left Screen - Fleet Button (blue-ish) */}
        <button
          onClick={() => navigate(createPageUrl('FleetManagement'))}
          className="absolute z-20 flex items-center justify-center bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-500/50 rounded transition-all"
          style={{
            bottom: '4%',
            left: '10%',
            width: '18%',
            height: '6%'
          }}
        >
          <span 
            className="font-bold text-cyan-100 uppercase tracking-wider"
            style={{ fontSize: 'clamp(0.6rem, 2vw, 0.85rem)' }}
          >
            Fleet
          </span>
        </button>
        
        {/* Bottom Right Screen - Jobs Button (orange-ish) */}
        <button
          onClick={() => navigate(createPageUrl('Jobs'))}
          className="absolute z-20 flex items-center justify-center bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/50 rounded transition-all"
          style={{
            bottom: '4%',
            right: '10%',
            width: '18%',
            height: '6%'
          }}
        >
          <span 
            className="font-bold text-amber-100 uppercase tracking-wider"
            style={{ fontSize: 'clamp(0.6rem, 2vw, 0.85rem)' }}
          >
            Jobs
          </span>
        </button>
      </div>
    </div>
  );
}