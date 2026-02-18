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

  // Tutorial redirect disabled - allow direct access to main page

  useEffect(() => {
    if (gameState) {
      loadActiveMissions();
    }
  }, [gameState]);

  useEffect(() => {
    if (!gameState) return;
    
    const interval = setInterval(() => {
      loadActiveMissions();
    }, 30000); // Check every 30 seconds instead of 5
    return () => clearInterval(interval);
  }, [gameState]);

  useEffect(() => {
    // Auto-scroll to bottom when messages change
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

        // Get all active ship images
        let shipImage = null;
        const shipImages = [];
        const activeShips = mission.ships?.filter(s => s.status === 'active') || [];
        if (activeShips.length > 0) {
          try {
            for (const activeShip of activeShips) {
              const ships = await base44.entities.Ship.filter({ id: activeShip.shipId });
              if (ships.length > 0 && ships[0].imageUrl) {
                shipImages.push(ships[0].imageUrl);
                if (!shipImage) shipImage = ships[0].imageUrl; // First ship for backwards compat
              }
            }
          } catch (err) {
            console.error('Error loading ship images:', err);
          }
        }

        const shipNames = activeShips.map(s => s.shipName).join(', ');
        
        // Calculate total wages based on active ships
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
    
    // Complete mission immediately
    await base44.entities.Mission.update(mission.id, { status: 'completed' });
    
    // Update all active ships to idle
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
          <div className="text-cyan-400 animate-pulse">Loading M.A.N.I. system...</div>
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

      <div className="flex flex-col px-4" style={{ paddingBottom: 'max(180px, calc(180px + env(safe-area-inset-bottom, 0px)))' }}>
        <ResourceHeader />
        <div className="space-y-4">
        {/* Message Console */}
        <div className="relative w-full" style={{ height: '160px', boxSizing: 'border-box' }}>
          {/* Outer frame */}
          <div className="absolute inset-0 border-2" style={{
            backgroundColor: 'var(--theme-dark)',
            borderColor: 'var(--theme-border)',
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.3), 0 2px 0 rgba(0,0,0,0.3)'
          }}></div>
          {/* Inner frame */}
          <div className="absolute inset-[6px] border" style={{
            backgroundColor: 'var(--theme-dark)',
            borderColor: 'var(--theme-border-dark)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)'
          }}></div>
          {/* Content surface with texture */}
          <div className="absolute inset-[10px]" style={{
            backgroundColor: 'var(--theme-dark)',
            backgroundImage: 'none',
            backgroundSize: '4px 4px',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.7)'
          }}>
            <div 
              ref={messageLogRef}
              className="h-full overflow-y-auto space-y-2 text-sm font-mono p-3"
              style={{ color: 'var(--theme-light)' }}
              style={{ scrollBehavior: 'smooth' }}
            >
              {messages.length === 0 ? (
                <div className="italic" style={{ color: 'var(--theme-border-dark)' }}>System standby...</div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="flex-shrink-0 text-xs" style={{ color: 'var(--theme-primary)' }}>
                      {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </span>
                    <span className="break-words" style={{ color: 'var(--theme-primary)' }}>{msg}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Market Section */}
        <div className="w-full">
          <MarketTicker />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 w-full" style={{ minWidth: 0 }}>
          <button
            onClick={() => navigate(createPageUrl('Market'))}
            className="relative w-full py-4 font-bold text-sm"
            style={{ minWidth: 0 }}
          >
            {/* Outer frame */}
            <div className="absolute inset-0 border-2" style={{
              backgroundColor: 'var(--theme-dark)',
              borderColor: 'var(--theme-border)',
              boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.3), 0 2px 0 rgba(0,0,0,0.3)'
            }}></div>
            {/* Button surface */}
            <div className="absolute inset-[4px] border" style={{
              backgroundColor: 'var(--theme-dark)',
              borderColor: 'var(--theme-border)',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)',
              backgroundImage: 'none',
              backgroundSize: '3px 3px'
            }}></div>
            <span className="relative" style={{ color: 'var(--theme-text-bright)' }}>Ship Market</span>
          </button>

          <button
            onClick={() => navigate(createPageUrl('FleetManagement'))}
            className="relative w-full py-4 font-bold text-sm"
            style={{ minWidth: 0 }}
          >
            {/* Outer frame */}
            <div className="absolute inset-0 border-2" style={{
              backgroundColor: 'var(--theme-dark)',
              borderColor: 'var(--theme-border)',
              boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.3), 0 2px 0 rgba(0,0,0,0.3)'
            }}></div>
            {/* Button surface */}
            <div className="absolute inset-[4px] border" style={{
              backgroundColor: 'var(--theme-dark)',
              borderColor: 'var(--theme-border)',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)',
              backgroundImage: 'none',
              backgroundSize: '3px 3px'
            }}></div>
            <span className="relative" style={{ color: 'var(--theme-text-bright)' }}>Manage Fleet</span>
          </button>
        </div>

        {/* Available Jobs Button */}
        <button
          onClick={() => navigate(createPageUrl('Jobs'))}
          className="relative w-full py-6 font-bold text-xl tracking-wider"
        >
          {/* Outer frame */}
          <div className="absolute inset-0 border-2" style={{
            backgroundColor: 'var(--theme-dark)',
            borderColor: 'var(--theme-border)',
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.3), 0 3px 0 rgba(0,0,0,0.3)'
          }}></div>
          {/* Inner frame */}
          <div className="absolute inset-[4px] border" style={{
            backgroundColor: 'var(--theme-dark)',
            borderColor: 'var(--theme-border-dark)'
          }}></div>
          {/* Button surface with accent */}
          <div className="absolute inset-[8px]" style={{
            backgroundColor: 'var(--theme-dark)',
            boxShadow: 'inset 0 2px 3px rgba(0,0,0,0.4)',
            backgroundImage: 'none',
            backgroundSize: '4px 4px'
          }}></div>
          <span className="relative" style={{ color: 'var(--theme-text-bright)' }}>Available Jobs</span>
        </button>

        {/* Active Missions */}
        <div className="border-2 p-[6px]" style={{
          backgroundColor: 'var(--theme-dark)',
          borderColor: 'var(--theme-border)',
          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.3), 0 2px 0 rgba(0,0,0,0.3)'
        }}>
          <div className="border p-[4px]" style={{
            backgroundColor: 'var(--theme-dark)',
            borderColor: 'var(--theme-border-dark)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)'
          }}>
            <div className="p-3" style={{
              backgroundColor: 'var(--theme-dark)',
              backgroundImage: 'none',
              backgroundSize: '4px 4px',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.7)'
            }}>
              {activeMissions.length === 0 ? (
                <div className="text-center py-8" style={{ color: 'var(--theme-border-dark)' }}>No active missions</div>
              ) : (
                <div className="space-y-3">
                  {activeMissions.map((mission) => {
                    const hasEvent = currentEvent?.missionId === mission.id;
                    const isFailed = mission.isFailed;
                    return (
                      <div
                        key={mission.id}
                        className="relative cursor-pointer"
                      >
                        {/* Mission item frame */}
                        <div className={`absolute inset-0 border-2 ${
                          isFailed
                            ? 'border-[#c84444] animate-pulse'
                            : hasEvent 
                            ? 'border-[#d89944] animate-pulse' 
                            : ''
                        }`} style={{
                          borderColor: isFailed ? '#c84444' : hasEvent ? '#d89944' : 'var(--theme-border-dark)',
                          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.3)'
                        }}></div>
                        <div className="absolute inset-[3px]" style={{
                          backgroundColor: 'var(--theme-dark)',
                          backgroundImage: 'none',
                          backgroundSize: '3px 3px',
                          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)'
                        }}></div>
                        
                        <div className="relative p-4">
                          <div className="flex items-center gap-3" onClick={() => setSelectedMission(mission)}>
                            {mission.shipImage && (
                              <img src={mission.shipImage} alt={mission.shipNames} className="w-10 h-10 object-contain" />
                            )}
                            <div className="font-bold text-sm flex-1" style={{ color: 'var(--theme-light)' }}>
                              {mission.shipNames} - {mission.distance}ly
                              {mission.activeShipCount > 1 && (
                                <span className="text-xs ml-2" style={{ color: 'var(--theme-primary)' }}>({mission.activeShipCount} ships)</span>
                              )}
                            </div>
                            {mission.isComplete ? (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();

                                  // Calculate total wages from all active ships
                                  const activeShips = mission.ships?.filter(s => s.status === 'active') || [];
                                  const totalWages = activeShips.reduce((sum, ship) => {
                                    return sum + (ship.hourlyPay * mission.duration);
                                  }, 0);

                                  // Award parts reward
                                  const partsReward = mission.partsReward || 0;
                                  const newParts = { ...gameState.parts };
                                  const earnedParts = [];

                                  // Generate random parts
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

                                  // Show debrief
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
                                className="relative px-3 py-1 font-bold text-xs"
                              >
                                <div className="absolute inset-0 border-2" style={{
                                  backgroundColor: 'var(--theme-dark)',
                                  borderColor: 'var(--theme-primary)',
                                  boxShadow: 'inset 0 1px 0 rgba(90,154,111,0.4)'
                                }}></div>
                                <span className="relative" style={{ color: 'var(--theme-text-bright)' }}>COLLECT</span>
                              </button>
                            ) : mission.isFailed ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedMission(mission);
                                }}
                                className="relative px-3 py-1 font-bold text-xs animate-pulse"
                              >
                                <div className="absolute inset-0 bg-[#8a3a3a] border-2 border-[#c84444]" style={{
                                  boxShadow: 'inset 0 1px 0 rgba(200,68,68,0.4)'
                                }}></div>
                                <span className="relative text-[#ffd0d0]">DEBRIEF</span>
                              </button>
                            ) : (
                              <div className="text-xs font-mono" style={{ color: 'var(--theme-primary)' }}>
                                {mission.timeRemaining}
                              </div>
                            )}
                          </div>
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
          <div className="bg-gradient-to-br from-gray-900 to-gray-950 border-2 border-cyan-500 w-full h-full relative flex flex-col overflow-y-auto" style={{
            paddingTop: 'calc(var(--content-pad-top) + 24px)',
            paddingBottom: 'calc(var(--content-pad-bottom) + 32px)',
            paddingLeft: 'calc(var(--content-pad-left) + 24px)',
            paddingRight: 'calc(var(--content-pad-right) + 24px)',
            WebkitOverflowScrolling: 'touch'
          }}>
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-cyan-400 font-bold text-lg">MISSION DEBRIEF</h2>
            </div>
            
            <div className="space-y-4 flex-1">
              <div className="relative p-4">
                <div className="absolute inset-0 border-2" style={{
                  backgroundColor: 'var(--theme-dark)',
                  borderColor: 'var(--theme-border)',
                  boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.3)'
                }}></div>
                <div className="absolute inset-[4px]" style={{
                  backgroundColor: 'var(--theme-dark)',
                  backgroundImage: 'none',
                  backgroundSize: '3px 3px',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)'
                }}></div>
                <div className="relative">
                  <div className="font-bold text-sm mb-2" style={{ color: '#d89944' }}>Credits Earned</div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--theme-text-bright)' }}>${debriefData.credits}</div>
                </div>
              </div>
              
              <div className="relative p-4">
                <div className="absolute inset-0 border-2" style={{
                  backgroundColor: 'var(--theme-dark)',
                  borderColor: 'var(--theme-border)',
                  boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.3)'
                }}></div>
                <div className="absolute inset-[4px]" style={{
                  backgroundColor: 'var(--theme-dark)',
                  backgroundImage: 'none',
                  backgroundSize: '3px 3px',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)'
                }}></div>
                <div className="relative">
                  <div className="font-bold text-sm mb-2" style={{ color: 'var(--theme-primary)' }}>Parts Collected ({debriefData.parts.length})</div>
                  <div className="text-xs space-y-1" style={{ color: 'var(--theme-light)' }}>
                    {debriefData.parts.map((part, idx) => (
                      <div key={idx}>• {part}</div>
                    ))}
                  </div>
                </div>
              </div>
              
              {debriefData.crystals > 0 && (
                <div className="relative p-4">
                  <div className="absolute inset-0 bg-[#3a2a4a] border-2 border-[#6a5a7a]" style={{
                    boxShadow: 'inset 0 0 0 1px #2a1a3a'
                  }}></div>
                  <div className="absolute inset-[4px] bg-[#2a1a3a]" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(106,90,122,0.1) 1px, transparent 0)',
                    backgroundSize: '3px 3px',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)'
                  }}></div>
                  <div className="relative">
                    <div className="text-[#b89acf] font-bold text-sm mb-2">Crystals Earned</div>
                    <div className="text-[#d0d0e8] text-2xl font-bold">{debriefData.crystals}</div>
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setDebriefData(null)}
              className="relative w-full py-2 font-bold text-sm mt-4"
            >
              <div className="absolute inset-0 border-2" style={{
                backgroundColor: 'var(--theme-dark)',
                borderColor: 'var(--theme-border-dark)',
                boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.3)'
              }}></div>
              <div className="absolute inset-[3px]" style={{
                backgroundColor: 'var(--theme-dark)',
                backgroundImage: 'none',
                backgroundSize: '3px 3px',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)'
              }}></div>
              <span className="relative" style={{ color: 'var(--theme-light)' }}>CLOSE</span>
            </button>
          </div>
        </div>
      )}
    </DeviceFrame>
  );
}