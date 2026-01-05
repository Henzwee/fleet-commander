import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Home } from 'lucide-react';

export default function DeviceFrame({ children, title = "M.A.N.I.", debug = false }) {
  const navigate = useNavigate();
  
  return (
    <div className="app">
      <div className={`frame-wrap ${debug ? 'debug' : ''}`}>
        {/* Main Content Screen - fills interior opening */}
        <div className={`screen ${debug ? 'debug-outline' : ''}`}>
          {children}
        </div>
        
        {/* Overlay elements */}
        <div className={`overlay overlay-title ${debug ? 'debug-outline' : ''}`}>
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
        
        <button
          onClick={() => navigate(createPageUrl('Main'))}
          className={`overlay overlay-home ${debug ? 'debug-outline' : ''}`}
          aria-label="Home"
        >
          <Home 
            className="text-amber-400" 
            style={{ width: 'clamp(18px, 3.5vw, 28px)', height: 'clamp(18px, 3.5vw, 28px)' }}
          />
        </button>
        
        <button
          onClick={() => navigate(createPageUrl('FleetManagement'))}
          className={`overlay overlay-fleet ${debug ? 'debug-outline' : ''}`}
        >
          <span 
            className="font-bold text-cyan-100 uppercase tracking-wider"
            style={{ fontSize: 'clamp(11px, 2vw, 16px)' }}
          >
            Fleet
          </span>
        </button>
        
        <button
          onClick={() => navigate(createPageUrl('Jobs'))}
          className={`overlay overlay-jobs ${debug ? 'debug-outline' : ''}`}
        >
          <span 
            className="font-bold text-amber-100 uppercase tracking-wider"
            style={{ fontSize: 'clamp(11px, 2vw, 16px)' }}
          >
            Jobs
          </span>
        </button>
        
        {/* CRITICAL: Frame overlay - must exist for border-image to render */}
        <div className="frame"></div>
      </div>
    </div>
  );
}