import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { useTutorial } from './TutorialProvider';

export default function DeviceFrame({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { tutorialActive, tutorialStep } = useTutorial();
  const [debugMode, setDebugMode] = React.useState(false);
  
  // Block navigation during certain tutorial steps
  const canNavigate = (target) => {
    // Settings and FleetManagement always accessible
    if (target === 'Settings' || target === 'FleetManagement') return true;
    if (!tutorialActive) return true;
    
    if (tutorialStep === 1 && target !== 'Market') return false;
    if (tutorialStep === 2 && target !== 'Market') return false;
    if (tutorialStep === 3 && target !== 'Main') return false;
    if (tutorialStep === 4) {
      // On step 4, only allow clicking Jobs button
      if (target === 'Jobs') {
        return true;
      }
      return false;
    }
    if (tutorialStep === 5 && target !== 'Jobs') return false;
    if (tutorialStep === 6 && target !== 'Jobs') return false;
    if (tutorialStep === 10 && target !== 'Market') return false;
    if (tutorialStep === 12 && target !== 'FleetManagement') return false;
    if (tutorialStep === 13 && target !== 'FleetManagement') return false;
    
    return true;
  };
  
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
          onClick={() => canNavigate('Settings') && navigate(createPageUrl('Settings'))}
          disabled={!canNavigate('Settings')}
          className="hotspot hs-settings absolute cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
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
          onClick={() => canNavigate('Main') && navigate(createPageUrl('Main'))}
          disabled={!canNavigate('Main')}
          className="hotspot hs-home absolute cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
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
          onClick={() => {
            if (canNavigate('Jobs')) {
              navigate(createPageUrl('Jobs'));
              if (tutorialActive && tutorialStep === 4) {
                setTimeout(() => advanceTutorial(), 100);
              }
            }
          }}
          disabled={!canNavigate('Jobs')}
          className={`hotspot hs-fleet absolute cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${tutorialActive && tutorialStep === 4 ? 'animate-pulse' : ''}`}
          aria-label="Jobs"
          style={{
            left: 'var(--fleet-x)',
            top: 'var(--fleet-y)',
            width: 'var(--fleet-w)',
            height: 'var(--fleet-h)',
            zIndex: 20,
            ...(tutorialActive && tutorialStep === 4 ? {
              boxShadow: '0 0 20px rgba(0, 212, 255, 0.8)',
              backgroundColor: 'rgba(0, 212, 255, 0.2)'
            } : {})
          }}
        />
      </div>
    </div>
  );
}