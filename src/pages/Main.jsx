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


export default function Main() {
  const navigate = useNavigate();
  const { gameState, loading, messages, currentEvent, handleEventChoice } = useGame();
  const [activeMissions, setActiveMissions] = useState([]);
  const [showExplosion, setShowExplosion] = useState(false);
  const [selectedMission, setSelectedMission] = useState(null);
  const messageLogRef = React.useRef(null);

  // Tutorial redirect disabled - allow direct access to main page

  useEffect(() => {
    if (gameState) {
      loadActiveMissions();
    }
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
      const missions = await base44.entities.Mission.filter({ status: 'active' }, '-created_date', 20);

      const missionsWithTime = await Promise.all(missions.map(async mission => {
        const startTime = new Date(mission.startTime);
        const now = new Date();
        const elapsed = Math.floor((now - startTime) / (1000 * 60 * 60));
        const remaining = Math.max(0, mission.duration - elapsed);
        const hours = Math.floor(remaining);
        const minutes = Math.floor((remaining % 1) * 60);

        // Get ship image
        let shipImage = null;
        try {
          const ships = await base44.entities.Ship.filter({ id: mission.shipId });
          if (ships.length > 0 && ships[0].imageUrl) {
            shipImage = ships[0].imageUrl;
          }
        } catch (err) {
          console.error('Error loading ship image:', err);
        }

        return {
          ...mission,
          shipImage,
          timeRemaining: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`
        };
      }));

      setActiveMissions(missionsWithTime);
    } catch (error) {
      console.error('Error loading missions:', error);
      setActiveMissions([]);
    }
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

      <div className="flex flex-col min-h-full pb-6" style={{ maxWidth: '100%', paddingLeft: 'var(--safe-x)', paddingRight: 'var(--safe-x)', boxSizing: 'border-box' }}>
        <ResourceHeader />
        <div className="space-y-3" style={{ paddingTop: '28px' }}>
        {/* Message Console */}
        <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border-2 border-cyan-600/50 rounded-2xl p-4 w-full" style={{ height: '160px', boxSizing: 'border-box' }}>
          <div 
            ref={messageLogRef}
            className="h-full overflow-y-auto space-y-2 text-sm text-cyan-100/90 font-mono"
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

        {/* Market Ticker */}
        <MarketTicker />

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 w-full" style={{ minWidth: 0 }}>
          <button
            onClick={() => navigate(createPageUrl('Market'))}
            className="bg-gradient-to-br from-cyan-600/80 to-blue-600/80 border-2 border-cyan-500/50 rounded-xl py-4 text-white font-bold text-sm hover:from-cyan-500/80 hover:to-blue-500/80 transition-all w-full"
            style={{ minWidth: 0 }}
          >
            Ship Market
          </button>

          <button
            onClick={() => navigate(createPageUrl('FleetManagement'))}
            className="bg-gradient-to-br from-cyan-600/80 to-blue-600/80 border-2 border-cyan-500/50 rounded-xl py-4 text-white font-bold text-sm hover:from-cyan-500/80 hover:to-blue-500/80 transition-all w-full"
            style={{ minWidth: 0 }}
          >
            Manage Fleet
          </button>
        </div>

        {/* Available Jobs Button */}
        <button
          onClick={() => navigate(createPageUrl('Jobs'))}
          className="w-full bg-gradient-to-br from-cyan-700/60 to-blue-700/60 border-2 border-cyan-600/60 rounded-2xl py-6 text-cyan-100 font-bold text-xl tracking-wider hover:from-cyan-600/60 hover:to-blue-600/60 transition-all"
        >
          Available Jobs
        </button>

        {/* Active Missions */}
        <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border-2 border-cyan-600/50 rounded-2xl p-4 flex-1 flex flex-col min-h-0">
          {activeMissions.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No active missions</div>
          ) : (
            <div className="space-y-3 overflow-y-auto">
              {activeMissions.map((mission) => (
                <div
                  key={mission.id}
                  onClick={() => setSelectedMission(mission)}
                  className="bg-gradient-to-r from-cyan-800/20 to-blue-800/20 border border-cyan-600/30 rounded-lg p-4 cursor-pointer hover:border-cyan-500 transition-all"
                >
                  <div className="flex items-center gap-3">
                    {mission.shipImage && (
                      <img src={mission.shipImage} alt={mission.shipName} className="w-10 h-10 object-contain" />
                    )}
                    <div className="text-cyan-100 font-bold text-base flex-1">
                      {mission.shipName} - {mission.distance}ly - {mission.timeRemaining}
                    </div>
                  </div>
                </div>
              ))}
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
        />
      )}
    </DeviceFrame>
  );
}