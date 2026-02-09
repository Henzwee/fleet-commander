import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import DeviceFrame from '../components/game/DeviceFrame';
import ExplosionEffect from '../components/game/ExplosionEffect';
import { useGame } from '../components/game/GameProvider';

import MarketTicker from '../components/game/MarketTicker';
import ResourceHeader from '../components/game/ResourceHeader';
import MissionReportScreen from '../components/game/MissionReportScreen';
import CrystalTimeSkip from '../components/game/CrystalTimeSkip';


export default function Main() {
  const navigate = useNavigate();
  const { gameState, loading, messages, currentEvent, handleEventChoice, updateGameState, addMessage, updateShip } = useGame();
  const [activeMissions, setActiveMissions] = useState([]);
  const [showExplosion, setShowExplosion] = useState(false);
  const [selectedMission, setSelectedMission] = useState(null);
  const [timeSkipMission, setTimeSkipMission] = useState(null);
  const [debriefData, setDebriefData] = useState(null);
  const messageLogRef = React.useRef(null);

  useEffect(() => {
    if (gameState) {
      loadActiveMissions();
    }
  }, [gameState]);

  useEffect(() => {
    if (!gameState) return;
    
    const interval = setInterval(() => {
      loadActiveMissions();
    }, 30000);
    return () => clearInterval(interval);
  }, [gameState]);

  useEffect(() => {
    if (messageLogRef.current) {
      const el = messageLogRef.current;
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
      if (isNearBottom || el.scrollTop === 0) {
        el.scrollTop = el.scrollHeight;
      }
    }
  }, [messages]);

  const loadActiveMissions = async () => {
    try {
      const missions = await base44.entities.Mission.filter({ status: 'active' }, '-created_date', 50) || [];
      const completed = await base44.entities.Mission.filter({ status: 'completed' }, '-created_date', 50) || [];
      const failed = await base44.entities.Mission.filter({ status: 'failed' }, '-created_date', 50) || [];

      const allMissions = [...missions, ...completed, ...failed].filter(m => m && m.id);

      const missionsWithTime = await Promise.all(allMissions.map(async mission => {
        const startTime = new Date(mission.startTime);
        const now = new Date();
        const elapsed = (now - startTime) / (1000 * 60 * 60);
        const remaining = Math.max(0, mission.duration - elapsed);
        const hours = Math.floor(remaining);
        const minutes = Math.floor((remaining % 1) * 60);
        const seconds = Math.floor(((remaining % 1) * 60 % 1) * 60);

        let shipImage = null;
        const shipImages = [];
        const activeShips = mission.ships?.filter(s => s.status === 'active') || [];
        if (activeShips.length > 0) {
          try {
            for (const activeShip of activeShips) {
              const ships = await base44.entities.Ship.filter({ id: activeShip.shipId });
              if (ships.length > 0 && ships[0].imageUrl) {
                shipImages.push(ships[0].imageUrl);
                if (!shipImage) shipImage = ships[0].imageUrl;
              }
            }
          } catch (err) {
            console.error('Error loading ship images:', err);
          }
        }

        const shipNames = activeShips.map(s => s.shipName).join(', ');
        const totalWages = activeShips.reduce((sum, ship) => {
          return sum + (ship.hourlyPay * mission.duration);
        }, 0);

        return {
          ...mission,
          shipImage,
          shipImages,
          shipNames,
          activeShipCount: activeShips.length,
          totalWages,
          isComplete: mission.status === 'completed' || remaining <= 0,
          isFailed: mission.status === 'failed',
          timeRemaining: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
          timeRemainingMinutes: remaining * 60
        };
      }));

      setActiveMissions(missionsWithTime);
    } catch (error) {
      console.error('Error loading missions:', error);
      setActiveMissions([]);
    }
  };

  const handleCrystalBoost = async (mission) => {
    const hoursRemaining = Math.ceil(mission.timeRemainingMinutes / 60);
    const crystalCost = hoursRemaining * 5;
    
    if (gameState.crystals < crystalCost) {
      addMessage('Not enough crystals!');
      return;
    }
    
    await base44.entities.Mission.update(mission.id, { status: 'completed' });
    
    for (const ship of mission.ships || []) {
      if (ship.status === 'active') {
        await updateShip(ship.shipId, { status: 'idle' });
      }
    }
    
    await updateGameState({ crystals: gameState.crystals - crystalCost });
    
    addMessage(`Mission boosted! Used ${crystalCost} crystals.`);
    setTimeSkipMission(null);
    loadActiveMissions();
  };

  if (loading) {
    return (
      <DeviceFrame>
        <div className="flex items-center justify-center h-full">
          <div className="text-cyan-400 animate-pulse text-[10px]">Loading M.A.N.I. system...</div>
        </div>
      </DeviceFrame>
    );
  }

  return (
    <DeviceFrame title="M.A.N.I.">
      {showExplosion && (
        <ExplosionEffect
          duration={3000}
          intensity={2}
          onComplete={() => setShowExplosion(false)}
        />
      )}

      <div className="flex flex-col min-h-full pb-6 px-4">
        <ResourceHeader />
        
        <div className="space-y-4 mt-4">
          
          {/* M.A.N.I. CONSOLE */}
          <div style={{
            background: '#0d1b2a',
            border: '4px solid #415a77',
            boxShadow: 'inset 4px 4px 0 rgba(0,0,0,0.5), inset -2px -2px 0 rgba(255,255,255,0.1), 0 6px 0 #000'
          }}>
            <div style={{
              background: 'linear-gradient(180deg, #1b263b 0%, #0d1b2a 100%)',
              borderBottom: '3px solid #00ccaa',
              padding: '8px 12px'
            }}>
              <div className="text-[10px] font-bold" style={{ color: '#00ff66' }}>M.A.N.I. MESSAGE LOG</div>
            </div>
            <div 
              ref={messageLogRef}
              className="mani-text p-3 overflow-y-auto"
              style={{ 
                height: '140px',
                background: '#000',
                scrollBehavior: 'smooth'
              }}
            >
              {messages.length === 0 ? (
                <div className="text-gray-600 italic text-xs">System standby...</div>
              ) : (
                <div className="space-y-2 text-xs text-cyan-100/90 font-mono">
                  {messages.map((msg, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="text-cyan-500 flex-shrink-0">
                        {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </span>
                      <span className="break-words">{msg}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* MARKET TICKER */}
          <div style={{
            background: '#0d1b2a',
            border: '3px solid #1b263b',
            boxShadow: 'inset 3px 3px 0 rgba(0,0,0,0.6), inset -2px -2px 0 rgba(255,255,255,0.08)'
          }}>
            <MarketTicker />
          </div>

          {/* NAVIGATION PANEL */}
          <div style={{
            background: 'linear-gradient(135deg, #1b263b 0%, #0d1b2a 100%)',
            border: '4px solid #415a77',
            boxShadow: 'inset 3px 3px 0 rgba(255,255,255,0.1), inset -3px -3px 0 rgba(0,0,0,0.4), 0 6px 0 #000',
            padding: '16px'
          }}>
            <div className="text-[9px] font-bold mb-3" style={{ color: '#00ccaa', letterSpacing: '0.1em' }}>▼ NAVIGATION</div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                onClick={() => navigate(createPageUrl('Market'))}
                className="relative py-3 text-[9px] font-bold"
                style={{
                  background: 'linear-gradient(180deg, #00ccaa 0%, #008877 100%)',
                  border: '3px solid #00ff66',
                  boxShadow: 'inset 2px 2px 0 rgba(255,255,255,0.4), inset -2px -2px 0 rgba(0,0,0,0.6), 4px 4px 0 rgba(0,0,0,0.3)',
                  color: '#0d1b2a',
                  transition: 'all 0.1s'
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'translate(3px, 3px)';
                  e.currentTarget.style.boxShadow = 'inset 3px 3px 0 rgba(0,0,0,0.6), inset -2px -2px 0 rgba(255,255,255,0.2)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = 'inset 2px 2px 0 rgba(255,255,255,0.4), inset -2px -2px 0 rgba(0,0,0,0.6), 4px 4px 0 rgba(0,0,0,0.3)';
                }}
              >
                SHIP MARKET
              </button>

              <button
                onClick={() => navigate(createPageUrl('FleetManagement'))}
                className="relative py-3 text-[9px] font-bold"
                style={{
                  background: 'linear-gradient(180deg, #00ccaa 0%, #008877 100%)',
                  border: '3px solid #00ff66',
                  boxShadow: 'inset 2px 2px 0 rgba(255,255,255,0.4), inset -2px -2px 0 rgba(0,0,0,0.6), 4px 4px 0 rgba(0,0,0,0.3)',
                  color: '#0d1b2a',
                  transition: 'all 0.1s'
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'translate(3px, 3px)';
                  e.currentTarget.style.boxShadow = 'inset 3px 3px 0 rgba(0,0,0,0.6), inset -2px -2px 0 rgba(255,255,255,0.2)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = 'inset 2px 2px 0 rgba(255,255,255,0.4), inset -2px -2px 0 rgba(0,0,0,0.6), 4px 4px 0 rgba(0,0,0,0.3)';
                }}
              >
                FLEET MGMT
              </button>
            </div>

            <button
              onClick={() => navigate(createPageUrl('Jobs'))}
              className="w-full relative py-4 text-[10px] font-bold"
              style={{
                background: 'linear-gradient(180deg, #00ff66 0%, #00cc44 100%)',
                border: '4px solid #00ff88',
                boxShadow: 'inset 3px 3px 0 rgba(255,255,255,0.5), inset -3px -3px 0 rgba(0,0,0,0.7), 5px 5px 0 rgba(0,0,0,0.4)',
                color: '#0d1b2a',
                letterSpacing: '0.1em',
                transition: 'all 0.1s'
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'translate(4px, 4px)';
                e.currentTarget.style.boxShadow = 'inset 4px 4px 0 rgba(0,0,0,0.7), inset -3px -3px 0 rgba(255,255,255,0.3)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = 'inset 3px 3px 0 rgba(255,255,255,0.5), inset -3px -3px 0 rgba(0,0,0,0.7), 5px 5px 0 rgba(0,0,0,0.4)';
              }}
            >
              ★ AVAILABLE JOBS ★
            </button>
          </div>

          {/* ACTIVE MISSIONS SCREEN */}
          <div style={{
            background: '#0d1b2a',
            border: '4px solid #415a77',
            boxShadow: 'inset 4px 4px 0 rgba(0,0,0,0.5), inset -2px -2px 0 rgba(255,255,255,0.1), 0 6px 0 #000',
            minHeight: '200px'
          }}>
            <div style={{
              background: 'linear-gradient(180deg, #1b263b 0%, #0d1b2a 100%)',
              borderBottom: '3px solid #00ccaa',
              padding: '8px 12px'
            }}>
              <div className="text-[10px] font-bold" style={{ color: '#00d4ff' }}>ACTIVE MISSIONS</div>
            </div>
            <div className="p-3 overflow-y-auto" style={{ 
              background: '#000',
              maxHeight: '280px'
            }}>
              {activeMissions.length === 0 ? (
                <div className="text-center py-12 text-gray-600 text-[9px]">
                  ▒▒▒ NO ACTIVE MISSIONS ▒▒▒
                </div>
              ) : (
                <div className="space-y-3">
                  {activeMissions.map((mission) => {
                    const hasEvent = currentEvent?.missionId === mission.id;
                    const isFailed = mission.isFailed;
                    return (
                      <div
                        key={mission.id}
                        className="cursor-pointer"
                        onClick={() => setSelectedMission(mission)}
                        style={{
                          background: isFailed ? 'linear-gradient(135deg, #2a0d0d 0%, #1a0000 100%)' :
                                      hasEvent ? 'linear-gradient(135deg, #2a2000 0%, #1a1400 100%)' :
                                      'linear-gradient(135deg, #1b263b 0%, #0d1b2a 100%)',
                          border: `3px solid ${isFailed ? '#ff4444' : hasEvent ? '#ffaa00' : '#00ccaa'}`,
                          boxShadow: `inset 2px 2px 0 rgba(255,255,255,0.1), inset -2px -2px 0 rgba(0,0,0,0.5), 0 3px 0 rgba(0,0,0,0.4)`,
                          padding: '10px',
                          animation: (isFailed || hasEvent) ? 'pulse 2s ease-in-out infinite' : 'none'
                        }}
                      >
                        <div className="flex items-center gap-3">
                          {mission.shipImage && (
                            <div style={{
                              width: '40px',
                              height: '40px',
                              border: '2px solid #415a77',
                              background: '#0d1b2a',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: 'inset 2px 2px 0 rgba(0,0,0,0.5)'
                            }}>
                              <img src={mission.shipImage} alt={mission.shipNames} className="w-10 h-10 object-contain" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="text-[9px] font-bold leading-tight" style={{ color: '#00d4ff' }}>
                              {mission.shipNames}
                            </div>
                            <div className="text-[8px]" style={{ color: '#00ccaa' }}>
                              {mission.distance}ly {mission.activeShipCount > 1 && `[${mission.activeShipCount} SHIPS]`}
                            </div>
                          </div>
                          {mission.isComplete ? (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                
                                const activeShips = mission.ships?.filter(s => s.status === 'active') || [];
                                const totalWages = activeShips.reduce((sum, ship) => {
                                  return sum + (ship.hourlyPay * mission.duration);
                                }, 0);
                                
                                const partsReward = mission.partsReward || 0;
                                const newParts = { ...gameState.parts };
                                const earnedParts = [];
                                
                                const partsList = [
                                  'Box of tangled wire', 'Rusty screws', 'Cracked glass',
                                  'Wire splice', 'Stripped bolts', 'Reformed evil AI',
                                  'Outdated map', 'Mostly stable antimatter', 'Expired food rations',
                                  'Sci-fi looking panel'
                                ];
                                
                                for (let i = 0; i < partsReward; i++) {
                                  const randomPart = partsList[Math.floor(Math.random() * partsList.length)];
                                  newParts[randomPart] = (newParts[randomPart] || 0) + 1;
                                  earnedParts.push(randomPart);
                                }
                                
                                setDebriefData({
                                  credits: totalWages,
                                  parts: earnedParts,
                                  crystals: 0
                                });
                                
                                await base44.entities.Mission.delete(mission.id);
                                await updateGameState({ 
                                  credits: gameState.credits + totalWages,
                                  parts: newParts
                                });
                                
                                loadActiveMissions();
                              }}
                              className="text-[8px] font-bold px-3 py-1"
                              style={{
                                background: 'linear-gradient(180deg, #00ff66 0%, #00cc44 100%)',
                                border: '2px solid #00ff88',
                                boxShadow: 'inset 2px 2px 0 rgba(255,255,255,0.4), inset -2px -2px 0 rgba(0,0,0,0.6), 3px 3px 0 rgba(0,0,0,0.3)',
                                color: '#0d1b2a'
                              }}
                            >
                              COLLECT
                            </button>
                          ) : mission.isFailed ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMission(mission);
                              }}
                              className="text-[8px] font-bold px-3 py-1 animate-pulse"
                              style={{
                                background: 'linear-gradient(180deg, #ff6666 0%, #cc0000 100%)',
                                border: '2px solid #ff4444',
                                boxShadow: 'inset 2px 2px 0 rgba(255,255,255,0.3), inset -2px -2px 0 rgba(0,0,0,0.5)',
                                color: 'white'
                              }}
                            >
                              ALERT
                            </button>
                          ) : (
                            <div className="text-[9px] font-mono font-bold px-2 py-1" style={{
                              background: '#0d1b2a',
                              border: '2px solid #415a77',
                              color: '#00d4ff',
                              boxShadow: 'inset 2px 2px 0 rgba(0,0,0,0.5)'
                            }}>
                              {mission.timeRemaining}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedMission && (
        <MissionReportScreen
          mission={selectedMission}
          event={currentEvent?.missionId === selectedMission.id ? currentEvent : null}
          onClose={() => setSelectedMission(null)}
          onChoice={handleEventChoice}
          onTimeSkip={!selectedMission.isComplete && !selectedMission.isFailed ? () => setTimeSkipMission(selectedMission) : null}
          crystals={gameState?.crystals || 0}
        />
      )}
      
      {timeSkipMission && (
        <CrystalTimeSkip
          mission={timeSkipMission}
          onConfirm={() => handleCrystalBoost(timeSkipMission)}
          onCancel={() => setTimeSkipMission(null)}
          crystals={gameState?.crystals || 0}
        />
      )}
      
      {debriefData && (
        <div className="fixed bg-black/80 flex items-center justify-center" style={{
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 5
        }}>
          <div className="w-full h-full relative flex flex-col overflow-y-auto" style={{
            background: '#0d1b2a',
            border: '4px solid #415a77',
            boxShadow: 'inset 4px 4px 0 rgba(0,0,0,0.5), inset -2px -2px 0 rgba(255,255,255,0.1), 0 6px 0 #000',
            paddingTop: 'calc(var(--content-pad-top) + 24px)',
            paddingBottom: 'calc(var(--content-pad-bottom) + 32px)',
            paddingLeft: 'calc(var(--content-pad-left) + 24px)',
            paddingRight: 'calc(var(--content-pad-right) + 24px)',
            WebkitOverflowScrolling: 'touch'
          }}>
            <div style={{
              background: 'linear-gradient(180deg, #1b263b 0%, #0d1b2a 100%)',
              borderBottom: '3px solid #00ccaa',
              padding: '12px 16px',
              marginLeft: '-24px',
              marginRight: '-24px',
              marginTop: '-24px',
              marginBottom: '16px'
            }}>
              <h2 className="font-bold text-[11px]" style={{ color: '#00ff66', letterSpacing: '0.1em' }}>▼ MISSION DEBRIEF</h2>
            </div>
            
            <div className="space-y-4 flex-1">
              <div style={{
                background: 'linear-gradient(135deg, #1b263b 0%, #0d1b2a 100%)',
                border: '3px solid #ffaa00',
                boxShadow: 'inset 2px 2px 0 rgba(255,255,255,0.1), inset -2px -2px 0 rgba(0,0,0,0.4)',
                padding: '12px'
              }}>
                <div className="font-bold text-[9px] mb-2" style={{ color: '#ffaa00' }}>CREDITS EARNED</div>
                <div className="text-white text-[16px] font-bold">${debriefData.credits}</div>
              </div>
              
              <div style={{
                background: 'linear-gradient(135deg, #1b263b 0%, #0d1b2a 100%)',
                border: '3px solid #00ff66',
                boxShadow: 'inset 2px 2px 0 rgba(255,255,255,0.1), inset -2px -2px 0 rgba(0,0,0,0.4)',
                padding: '12px'
              }}>
                <div className="font-bold text-[9px] mb-2" style={{ color: '#00ff66' }}>PARTS COLLECTED ({debriefData.parts.length})</div>
                <div className="text-gray-300 text-[8px] space-y-1">
                  {debriefData.parts.map((part, idx) => (
                    <div key={idx}>▪ {part}</div>
                  ))}
                </div>
              </div>
              
              {debriefData.crystals > 0 && (
                <div style={{
                  background: 'linear-gradient(135deg, #1b263b 0%, #0d1b2a 100%)',
                  border: '3px solid #bb88ff',
                  boxShadow: 'inset 2px 2px 0 rgba(255,255,255,0.1), inset -2px -2px 0 rgba(0,0,0,0.4)',
                  padding: '12px'
                }}>
                  <div className="font-bold text-[9px] mb-2" style={{ color: '#bb88ff' }}>CRYSTALS EARNED</div>
                  <div className="text-white text-[16px] font-bold">{debriefData.crystals}</div>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setDebriefData(null)}
              className="w-full py-3 text-white font-bold text-[10px] mt-4"
              style={{
                background: 'linear-gradient(180deg, #415a77 0%, #1b263b 100%)',
                border: '3px solid #415a77',
                boxShadow: 'inset 2px 2px 0 rgba(255,255,255,0.2), inset -2px -2px 0 rgba(0,0,0,0.5), 4px 4px 0 rgba(0,0,0,0.3)'
              }}
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </DeviceFrame>
  );
}