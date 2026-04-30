import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function DeviceFrame({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [debugMode, setDebugMode] = React.useState(false);
  const mainRef = React.useRef(null);

  // Reset scroll to top whenever the route changes
  React.useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  // Also expose a way for children to trigger a scroll reset after content loads
  React.useEffect(() => {
    const handler = () => {
      if (mainRef.current) {
        mainRef.current.scrollTop = 0;
      }
    };
    window.addEventListener('resetScroll', handler);
    return () => window.removeEventListener('resetScroll', handler);
  }, []);
  
  React.useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'd' || e.key === 'D') {
        setDebugMode(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);
  
  const frameVars = {
    '--content-pad-top': '95px',
    '--content-pad-bottom': '115px',
    '--content-pad-left': '22px',
    '--content-pad-right': '22px',
    '--safe-x': '16px',
    '--settings-x': '68%',
    '--settings-y': '3.8%',
    '--settings-w': '28%',
    '--settings-h': '5.8%',
    '--home-x': '38%',
    '--home-y': '87.5%',
    '--home-w': '25%',
    '--home-h': '6.2%',
    '--fleet-x': '68%',
    '--fleet-y': '87.5%',
    '--fleet-w': '25%',
    '--fleet-h': '6.2%'
  };
  
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#0d1a14] to-[#080f0c] flex items-center justify-center overflow-hidden" style={{
      padding: 'max(0.5rem, calc(0.5rem + env(safe-area-inset-top, 0px))) 0.5rem max(0.5rem, calc(0.5rem + env(safe-area-inset-bottom, 0px))) 0.5rem'
    }}>
      <div 
        className={`app-shell relative ${debugMode ? 'debug' : ''}`}
        style={{
          width: 'min(500px, 98vw)',
          height: 'min(1000px, 96dvh)',
          ...frameVars
        }}
      >
        {/* Main app content underneath */}
        <main 
          ref={mainRef}
        className="app-content absolute inset-0 overflow-y-auto overflow-x-hidden bg-gradient-to-br from-[#0a1a14] to-[#050f0a]"
          style={{
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <div 
            className="app-panel"
            style={{
              minHeight: '100%',
              paddingTop: location.pathname === '/Main' ? '125px' : '55px',
              paddingBottom: 'max(var(--content-pad-bottom), calc(var(--content-pad-bottom) + env(safe-area-inset-bottom, 0px)))',
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
            backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695af5ca435140b76c0dadc9/cf678d804_framebeta5.png)',
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            zIndex: 10
          }}
        />
        
        {/* Clickable hotspots */}
        <button
          onClick={() => navigate(createPageUrl('Settings'))}
          className="hotspot hs-settings absolute cursor-pointer"
          aria-label="Settings"
          style={{
            left: 'var(--settings-x)',
            top: 'var(--settings-y)',
            width: 'var(--settings-w)',
            height: 'var(--settings-h)',
            zIndex: 20
          }}
        />

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
          onClick={() => navigate(createPageUrl('FleetManagement'))}
          className="hotspot hs-fleet absolute cursor-pointer"
          aria-label="Fleet Management"
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