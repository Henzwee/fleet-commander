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

      <div className="flex flex-col min-h-full pb-6 px-4">
        <ResourceHeader />
        <div className="space-y-3">
        {/* Message Console */}
        <div className="mani-console pixel-panel p-4 w-full" style={{ height: '160px', boxSizing: 'border-box' }}>
          <div 
            ref={messageLogRef}
            className="mani-text h-full overflow-y-auto space-y-2 text-sm text-cyan-100/90 font-mono"
            style={{ scrollBehavior: 'smooth' }}
          >
            {messages.length === 0 ? (
              <div className="text-gray-500 italic">System standby...</div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="text-cyan-500 flex-shrink-0 text-xs">
                    {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </span>
                  <span className="break-words">{msg}</span>
                </div>
              ))
            )}
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
            className="pixel-btn-cyan py-4 text-[var(--navy-dark)] font-bold text-[10px] leading-tight uppercase w-full"
            style={{ minWidth: 0 }}
          >
            Ship Market
          </button>

          <button
            onClick={() => navigate(createPageUrl('FleetManagement'))}
            className="pixel-btn-cyan py-4 text-[var(--navy-dark)] font-bold text-[10px] leading-tight uppercase w-full"
            style={{ minWidth: 0 }}
          >
            Manage Fleet
          </button>
        </div>

        {/* Available Jobs Button */}
        <button
          onClick={() => navigate(createPageUrl('Jobs'))}
          className="w-full pixel-btn-green py-6 text-[var(--navy-dark)] font-bold text-[11px] uppercase"
        >
          Available Jobs
        </button>

        {/* Active Missions */}
        <div className="pixel-panel p-4 flex-1 flex flex-col min-h-0">
          {activeMissions.length === 0 ? (
            <div className="text-center text-gray-500 py-8 text-[10px]">No active missions</div>
          ) : (
            <div className="space-y-3 overflow-y-auto">
              {activeMissions.map((mission) => {
                const hasEvent = currentEvent?.missionId === mission.id;
                const isFailed = mission.isFailed;
                return (
                  <div
                    key={mission.id}
                    className="p-3 cursor-pointer transition-all"
                    style={{
                      background: 'linear-gradient(135deg, var(--navy-mid) 0%, var(--navy-dark) 100%)',
                      border: `2px solid ${isFailed ? '#ff4444' : hasEvent ? '#ffaa00' : 'var(--pixel-teal)'}`,
                      boxShadow: `inset 2px 2px 0 rgba(255,255,255,0.1), inset -2px -2px 0 rgba(0,0,0,0.3)`,
                      animation: (isFailed || hasEvent) ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
                    }}
                  >
                    <div className="flex items-center gap-3" onClick={() => setSelectedMission(mission)}>
                      {mission.shipImage && (
                        <img src={mission.shipImage} alt={mission.shipNames} className="w-10 h-10 object-contain" />
                      )}
                      <div className="text-cyan-100 font-bold text-[10px] leading-tight flex-1">
                        {mission.shipNames} - {mission.distance}ly
                        {mission.activeShipCount > 1 && (
                          <span className="text-cyan-400 text-[9px] ml-2">({mission.activeShipCount} ships)</span>
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
                          className="pixel-btn-green px-3 py-1 text-[var(--navy-dark)] font-bold text-[8px]"
                        >
                          COLLECT
                        </button>
                      ) : mission.isFailed ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMission(mission);
                          }}
                          className="px-3 py-1 font-bold text-[8px] animate-pulse"
                          style={{
                            background: 'linear-gradient(180deg, #ff6666 0%, #cc0000 100%)',
                            border: '2px solid #ff4444',
                            boxShadow: 'inset 2px 2px 0 rgba(255,255,255,0.3), inset -2px -2px 0 rgba(0,0,0,0.5)',
                            color: 'white'
                          }}
                        >
                          DEBRIEF
                        </button>
                      ) : (
                        <div className="text-cyan-400 text-[9px] font-mono">
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
          <div className="pixel-panel w-full h-full relative flex flex-col overflow-y-auto" style={{
            paddingTop: 'calc(var(--content-pad-top) + 24px)',
            paddingBottom: 'calc(var(--content-pad-bottom) + 32px)',
            paddingLeft: 'calc(var(--content-pad-left) + 24px)',
            paddingRight: 'calc(var(--content-pad-right) + 24px)',
            WebkitOverflowScrolling: 'touch'
          }}>
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-cyan-400 font-bold text-[12px]">MISSION DEBRIEF</h2>
            </div>
            
            <div className="space-y-4 flex-1">
              <div className="pixel-panel p-4">
                <div className="text-amber-400 font-bold text-[10px] mb-2">Credits Earned</div>
                <div className="text-white text-[14px] font-bold">${debriefData.credits}</div>
              </div>
              
              <div className="pixel-panel p-4">
                <div className="text-green-400 font-bold text-[10px] mb-2">Parts Collected ({debriefData.parts.length})</div>
                <div className="text-gray-300 text-[8px] space-y-1">
                  {debriefData.parts.map((part, idx) => (
                    <div key={idx}>• {part}</div>
                  ))}
                </div>
              </div>
              
              {debriefData.crystals > 0 && (
                <div className="pixel-panel p-4">
                  <div className="text-purple-400 font-bold text-[10px] mb-2">Crystals Earned</div>
                  <div className="text-white text-[14px] font-bold">{debriefData.crystals}</div>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setDebriefData(null)}
              className="w-full pixel-btn py-2 text-white font-bold text-[10px] transition-all mt-4"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </DeviceFrame>
  );
}