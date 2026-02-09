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
        <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border-4 border-cyan-600/50 p-4 w-full" style={{ height: '160px', boxSizing: 'border-box' }}>
          <div 
            ref={messageLogRef}
            className="h-full overflow-y-auto space-y-2 text-sm text-cyan-100/90 message-text"
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
            className="bg-gradient-to-br from-cyan-600/80 to-blue-600/80 border-4 border-cyan-500/50 py-4 text-white font-bold text-xs hover:from-cyan-500/80 hover:to-blue-500/80 transition-all w-full"
            style={{ minWidth: 0 }}
          >
            Ship Market
          </button>

          <button
            onClick={() => navigate(createPageUrl('FleetManagement'))}
            className="bg-gradient-to-br from-cyan-600/80 to-blue-600/80 border-4 border-cyan-500/50 py-4 text-white font-bold text-xs hover:from-cyan-500/80 hover:to-blue-500/80 transition-all w-full"
            style={{ minWidth: 0 }}
          >
            Manage Fleet
          </button>
        </div>

        {/* Available Jobs Button */}
        <button
          onClick={() => navigate(createPageUrl('Jobs'))}
          className="w-full bg-gradient-to-br from-cyan-700/60 to-blue-700/60 border-4 border-cyan-600/60 py-6 text-cyan-100 font-bold text-base tracking-wider hover:from-cyan-600/60 hover:to-blue-600/60 transition-all"
        >
          Available Jobs
        </button>

        {/* Active Missions */}
        <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border-4 border-cyan-600/50 p-4 flex-1 flex flex-col min-h-0">
          {activeMissions.length === 0 ? (
            <div className="text-center text-gray-500 py-8 text-xs">No active missions</div>
          ) : (
            <div className="space-y-3 overflow-y-auto">
              {activeMissions.map((mission) => {
                const hasEvent = currentEvent?.missionId === mission.id;
                const isFailed = mission.isFailed;
                return (
                  <div
                    key={mission.id}
                    className={`bg-gradient-to-r from-cyan-800/20 to-blue-800/20 border-2 p-3 cursor-pointer transition-all ${
                      isFailed
                        ? 'border-red-500 animate-pulse'
                        : hasEvent 
                        ? 'border-amber-500 animate-pulse' 
                        : 'border-cyan-600/30 hover:border-cyan-500'
                    }`}
                  >
                    <div className="flex items-center gap-3" onClick={() => setSelectedMission(mission)}>
                      {mission.shipImage && (
                        <img src={mission.shipImage} alt={mission.shipNames} className="w-8 h-8 object-contain" style={{ imageRendering: 'pixelated' }} />
                      )}
                      <div className="text-cyan-100 font-bold text-xs flex-1">
                        {mission.shipNames} - {mission.distance}ly
                        {mission.activeShipCount > 1 && (
                          <span className="text-cyan-400 text-xs ml-2">({mission.activeShipCount} ships)</span>
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
                          className="bg-green-600 hover:bg-green-700 border-2 border-green-500 rounded px-3 py-1 text-white font-bold text-xs"
                        >
                          COLLECT
                        </button>
                      ) : mission.isFailed ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMission(mission);
                          }}
                          className="bg-red-600 hover:bg-red-700 border-2 border-red-500 rounded px-3 py-1 text-white font-bold text-xs animate-pulse"
                        >
                          DEBRIEF
                        </button>
                      ) : (
                        <div className="text-cyan-400 text-xs font-mono">
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
              <div className="bg-cyan-900/20 border-2 border-cyan-500/50 rounded-lg p-4">
                <div className="text-amber-400 font-bold text-sm mb-2">Credits Earned</div>
                <div className="text-white text-2xl font-bold">${debriefData.credits}</div>
              </div>
              
              <div className="bg-cyan-900/20 border-2 border-cyan-500/50 rounded-lg p-4">
                <div className="text-green-400 font-bold text-sm mb-2">Parts Collected ({debriefData.parts.length})</div>
                <div className="text-gray-300 text-xs space-y-1">
                  {debriefData.parts.map((part, idx) => (
                    <div key={idx}>• {part}</div>
                  ))}
                </div>
              </div>
              
              {debriefData.crystals > 0 && (
                <div className="bg-purple-900/20 border-2 border-purple-500/50 rounded-lg p-4">
                  <div className="text-purple-400 font-bold text-sm mb-2">Crystals Earned</div>
                  <div className="text-white text-2xl font-bold">{debriefData.crystals}</div>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setDebriefData(null)}
              className="w-full bg-gray-700 active:bg-gray-600 border-2 border-gray-600 rounded-lg py-2 text-white font-bold text-sm transition-all mt-4"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </DeviceFrame>
  );
}