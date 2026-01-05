import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Home } from 'lucide-react';

export default function DeviceFrame({ children, title = "M.A.N.I.", debug = false }) {
  const navigate = useNavigate();
  
  const frameVars = {
    '--frame-slice': '72px',
    '--title-x': '50%',
    '--title-y': '4.2%',
    '--home-x': '87%',
    '--home-y': '4.2%',
    '--fleet-x': '19%',
    '--fleet-y': '95%',
    '--jobs-x': '81%',
    '--jobs-y': '95%',
    '--title-nudge-x': '0px',
    '--title-nudge-y': '0px',
    '--home-nudge-x': '0px',
    '--home-nudge-y': '0px',
    '--fleet-nudge-x': '0px',
    '--fleet-nudge-y': '0px',
    '--jobs-nudge-x': '0px',
    '--jobs-nudge-y': '0px'
  };
  
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-2 overflow-hidden">
      <div 
        className={`frame-wrap relative ${debug ? 'debug' : ''}`}
        style={{
          width: 'min(430px, 96vw)',
          height: 'min(930px, 96svh)',
          ...frameVars
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
          className={`top-title absolute z-20 flex items-center justify-center ${debug ? 'debug-outline' : ''}`}
          style={{
            left: 'calc(var(--title-x) + var(--title-nudge-x))',
            top: 'calc(var(--title-y) + var(--title-nudge-y))',
            transform: 'translate(-50%, -50%)',
            width: '30%',
            height: '5%'
          }}
        >
          <h1 
            className="font-bold text-white tracking-[0.3em] uppercase"
            style={{ 
              fontFamily: 'Orbitron, sans-serif',
              fontSize: 'clamp(14px, 2.2vw, 20px)',
              textShadow: '0 0 10px rgba(0, 212, 255, 0.8), 0 2px 4px rgba(0, 0, 0, 0.8)'
            }}
          >
            {title}
          </h1>
        </div>
        
        {/* Top Right Screen - Home Button */}
        <button
          onClick={() => navigate(createPageUrl('Main'))}
          className={`home-btn absolute z-20 flex items-center justify-center hover:opacity-80 transition-opacity ${debug ? 'debug-outline' : ''}`}
          style={{
            left: 'calc(var(--home-x) + var(--home-nudge-x))',
            top: 'calc(var(--home-y) + var(--home-nudge-y))',
            transform: 'translate(-50%, -50%)',
            width: 'clamp(40px, 8%, 60px)',
            height: 'clamp(30px, 5%, 45px)'
          }}
        >
          <Home 
            className="text-amber-400" 
            style={{ width: 'clamp(18px, 3.5vw, 28px)', height: 'clamp(18px, 3.5vw, 28px)' }}
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
          className={`nav-fleet absolute z-20 flex items-center justify-center bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-500/50 rounded transition-all ${debug ? 'debug-outline' : ''}`}
          style={{
            left: 'calc(var(--fleet-x) + var(--fleet-nudge-x))',
            top: 'calc(var(--fleet-y) + var(--fleet-nudge-y))',
            transform: 'translate(-50%, -50%)',
            width: 'clamp(60px, 18%, 90px)',
            height: 'clamp(35px, 6%, 50px)'
          }}
        >
          <span 
            className="font-bold text-cyan-100 uppercase tracking-wider"
            style={{ fontSize: 'clamp(11px, 2vw, 16px)' }}
          >
            Fleet
          </span>
        </button>
        
        {/* Bottom Right Screen - Jobs Button (orange-ish) */}
        <button
          onClick={() => navigate(createPageUrl('Jobs'))}
          className={`nav-jobs absolute z-20 flex items-center justify-center bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/50 rounded transition-all ${debug ? 'debug-outline' : ''}`}
          style={{
            left: 'calc(var(--jobs-x) + var(--jobs-nudge-x))',
            top: 'calc(var(--jobs-y) + var(--jobs-nudge-y))',
            transform: 'translate(-50%, -50%)',
            width: 'clamp(60px, 18%, 90px)',
            height: 'clamp(35px, 6%, 50px)'
          }}
        >
          <span 
            className="font-bold text-amber-100 uppercase tracking-wider"
            style={{ fontSize: 'clamp(11px, 2vw, 16px)' }}
          >
            Jobs
          </span>
        </button>
      </div>
    </div>
  );
}