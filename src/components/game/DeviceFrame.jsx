import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function DeviceFrame({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [debugMode, setDebugMode] = React.useState(false);
  
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
    <div className="min-h-screen bg-black flex items-center justify-center p-2 overflow-hidden">
      <div 
        className={`app-shell relative overflow-hidden ${debugMode ? 'debug' : ''}`}
        style={{
          width: 'min(500px, 98vw)',
          height: 'min(1000px, 98svh)',
          ...frameVars
        }}
      >
        {/* Main app content underneath */}
        <main 
          className="app-content h-full overflow-y-auto overflow-x-hidden bg-gradient-to-br from-[#0a1628] to-[#050a14]"
          style={{
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <div 
            className="app-panel min-h-full"
            style={{
              paddingTop: location.pathname === '/Main' ? '95px' : '55px',
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
            backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695af5ca435140b76c0dadc9/1b69e895e_frame2.png)',
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