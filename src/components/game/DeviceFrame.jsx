import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function DeviceFrame({ children, debug = false }) {
  const navigate = useNavigate();
  
  const frameVars = {
    '--content-pad-top': '65px',
    '--content-pad-bottom': '105px',
    '--content-pad-left': '22px',
    '--content-pad-right': '22px',
    '--home-x': '78%',
    '--home-y': '3.8%',
    '--home-w': '18%',
    '--home-h': '5.8%',
    '--jobs-x': '38%',
    '--jobs-y': '92.4%',
    '--jobs-w': '25%',
    '--jobs-h': '6.2%',
    '--fleet-x': '68%',
    '--fleet-y': '92.4%',
    '--fleet-w': '25%',
    '--fleet-h': '6.2%'
  };
  
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-2 overflow-hidden">
      <div 
        className={`app-shell relative overflow-hidden ${debug ? 'debug' : ''}`}
        style={{
          width: 'min(430px, 96vw)',
          height: 'min(930px, 96svh)',
          ...frameVars
        }}
      >
        {/* Main app content underneath */}
        <main 
          className="app-content h-full overflow-y-auto bg-gradient-to-br from-[#0a1628] to-[#050a14]"
          style={{
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <div 
            className="app-panel min-h-full"
            style={{
              paddingTop: 'var(--content-pad-top)',
              paddingBottom: 'var(--content-pad-bottom)',
              paddingLeft: 'var(--content-pad-left)',
              paddingRight: 'var(--content-pad-right)'
            }}
          >
            {children}
          </div>
        </main>
        
        {/* Frame overlay (non-interactive) */}
        <div 
          className="frame-layer absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695af5ca435140b76c0dadc9/593cbcb81_framebeta.png)',
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            zIndex: 10
          }}
        />
        
        {/* Clickable hotspots */}
        <button
          onClick={() => navigate(createPageUrl('Main'))}
          className="hotspot hs-home absolute cursor-pointer"
          aria-label="Home"
          style={{
            left: 'var(--home-x)',
            top: 'var(--home-y)',
            width: 'var(--home-w)',
            height: 'var(--home-h)',
            zIndex: 20
          }}
        />
        
        <button
          onClick={() => navigate(createPageUrl('Jobs'))}
          className="hotspot hs-jobs absolute cursor-pointer"
          aria-label="Jobs"
          style={{
            left: 'var(--jobs-x)',
            top: 'var(--jobs-y)',
            width: 'var(--jobs-w)',
            height: 'var(--jobs-h)',
            zIndex: 20
          }}
        />
        
        <button
          onClick={() => navigate(createPageUrl('FleetManagement'))}
          className="hotspot hs-fleet absolute cursor-pointer"
          aria-label="Fleet"
          style={{
            left: 'var(--fleet-x)',
            top: 'var(--fleet-y)',
            width: 'var(--fleet-w)',
            height: 'var(--fleet-h)',
            zIndex: 20
          }}
        />
      </div>
    </div>
  );
}