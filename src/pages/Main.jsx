import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import DeviceFrame from '../components/game/DeviceFrame';
import BottomNav from '../components/game/BottomNav';
import MANIConsole from '../components/game/MANIConsole';
import DecisionPrompt from '../components/game/DecisionPrompt';
import MarketCarousel from '../components/game/MarketCarousel';
import ActiveJobsList from '../components/game/ActiveJobsList';
import ExplosionEffect from '../components/game/ExplosionEffect';
import { useGame } from '../components/game/GameProvider';
import { UserPlus, Briefcase } from 'lucide-react';

export default function Main() {
  const navigate = useNavigate();
  const { gameState, loading, messages, currentEvent, updateGameState, addMessage, handleEventChoice } = useGame();
  const [activeMissions, setActiveMissions] = useState([]);
  const [marketItems, setMarketItems] = useState([]);
  const [showExplosion, setShowExplosion] = useState(false);
  
  useEffect(() => {
    if (!loading && gameState && !gameState.tutorialCompleted) {
      navigate(createPageUrl('Tutorial'));
    }
  }, [loading, gameState, navigate]);
  
  useEffect(() => {
    if (gameState) {
      loadActiveMissions();
      loadMarketPreview();
    }
  }, [gameState]);
  
  const loadActiveMissions = async () => {
    try {
      const missions = await base44.entities.Mission.filter({ status: 'active' }, '-created_date', 20);
      
      const missionsWithTime = missions.map(mission => {
      const startTime = new Date(mission.startTime);
      const now = new Date();
      const elapsed = Math.floor((now - startTime) / (1000 * 60 * 60));
      const remaining = Math.max(0, mission.duration - elapsed);
      
      return {
        ...mission,
        timeRemaining: `${Math.floor(remaining)}h ${Math.floor((remaining % 1) * 60)}m`
      };
      });
      
      setActiveMissions(missionsWithTime);
    } catch (error) {
      console.error('Error loading missions:', error);
      setActiveMissions([]);
    }
  };
  
  const loadMarketPreview = () => {
    const items = [
      { name: 'Scrap Parts', price: 150, icon: '🔧', category: 'parts' },
      { name: 'Fuel Cell', price: 200, icon: '⚡', category: 'fuel' },
      { name: 'Ship Upgrade', price: 500, icon: '🚀', category: 'ships' },
      { name: 'Repair Kit', price: 300, icon: '🛠️', category: 'parts' }
    ];
    
    setMarketItems(items);
  };
  
  const handleToggleAuto = async () => {
    await updateGameState({ autoResolve: !gameState.autoResolve });
  };
  
  const handleMarketItemClick = (item) => {
    navigate(createPageUrl('Market') + '?category=' + item.category);
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
      
      <div className="p-4 pb-20 overflow-y-auto h-full">
        <MANIConsole 
          messages={messages}
          autoResolve={gameState?.autoResolve}
          onToggleAuto={handleToggleAuto}
        />
        
        {currentEvent && (
          <DecisionPrompt
            event={currentEvent}
            onChoice={handleEventChoice}
          />
        )}
        
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={() => navigate(createPageUrl('HireShips'))}
            className="bg-gradient-to-r from-green-600 to-green-700 border-2 border-green-500 rounded-lg p-3 flex items-center justify-center gap-2 text-white font-bold text-sm hover:from-green-500 hover:to-green-600 transition-all"
          >
            <UserPlus className="w-5 h-5" />
            <span>Hire Ships</span>
          </button>
          
          <button
            onClick={() => navigate(createPageUrl('Jobs'))}
            className="bg-gradient-to-r from-cyan-600 to-cyan-700 border-2 border-cyan-500 rounded-lg p-3 flex items-center justify-center gap-2 text-white font-bold text-sm hover:from-cyan-500 hover:to-cyan-600 transition-all"
          >
            <Briefcase className="w-5 h-5" />
            <span>Available Jobs</span>
          </button>
        </div>
        
        <MarketCarousel
          items={marketItems}
          onItemClick={handleMarketItemClick}
        />
        
        <ActiveJobsList
          missions={activeMissions}
          onMissionClick={(mission) => navigate(createPageUrl('Jobs') + '?id=' + mission.id)}
        />
      </div>
      
      <BottomNav active="main" />
    </DeviceFrame>
  );
}