import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useGame } from '../components/game/GameProvider';

import DeviceFrame from '../components/game/DeviceFrame';
import ResourceHeader from '../components/game/ResourceHeader';
import { MapPin, Clock, Zap, Fuel } from 'lucide-react';
import { SHIP_TIERS, TIER_ORDER, getTierConfig, getMaxLYForTier } from '../components/game/ShipTierConfig';
import MissionShipSelection from '../components/game/MissionShipSelection';

export default function Jobs() {
  const { gameState, ships: allShips, updateShip, addMessage, updateGameState } = useGame();
  const navigate = useNavigate();
  const [availableMissions, setAvailableMissions] = useState([]);
  const [selectedMission, setSelectedMission] = useState(null);
  const [selectedShip, setSelectedShip] = useState(null);
  const [isDeploying, setIsDeploying] = useState(false);
  
  // Get all hired ships (not just idle ones)
  const allHiredShips = allShips.filter(ship => ship.isHired);
  
  useEffect(() => {
    loadData();
  }, [allShips.length]);
  
  const loadData = async () => {
    try {
      // First, check for orphaned ships (marked as active but not on any active mission)
      const activeMissions = await base44.entities.Mission.filter({ status: 'active' }, '-created_date', 50);
      const activeShipIds = new Set();
      
      activeMissions.forEach(mission => {
        if (mission.ships) {
          mission.ships.forEach(ship => {
            if (ship.status === 'active') {
              activeShipIds.add(ship.shipId);
            }
          });
        }
      });
      
      // Fix any ships that are marked as active but not on active missions
      for (const ship of allShips) {
        if (ship.status === 'active' && !activeShipIds.has(ship.id)) {
          const newStatus = ship.health < 100 ? 'damaged' : 'idle';
          await updateShip(ship.id, { status: newStatus });
          console.log(`[Jobs] Fixed orphaned ship ${ship.name} to ${newStatus}`);
        }
      }
      
      // Get player's maximum ship range
      const maxLY = allShips.length > 0 
        ? Math.max(...allShips.map(s => s.maxLY || 100))
        : 100;
      
      generateMissions(maxLY);
    } catch (error) {
      console.error('Error loading missions:', error);
      generateMissions(100);
    }
  };
  
  const generateMissions = (playerMaxLY) => {
    const missions = [];
    
    // Check if it's Friday (5 = Friday in JavaScript)
    const today = new Date().getDay();
    if (today === 5) {
      // Add Ship Face Incentive Mission
      missions.push({
        id: 'friday_incentive',
        distance: 50,
        duration: 2,
        partsReward: 0,
        crystalReward: 5,
        fuelCost: 5,
        description: 'Ship Face Incentive Mission',
        tier: 'Unregistered',
        requiredLY: 50,
        isFridayMission: true
      });
    }
    
    const descriptions = [
      'Deliver mystery meat to Station 7',
      'Rescue cat stuck in airlock',
      'Get an oil change and thruster rotation',
      'Haul cursed cargo (probably fine)',
      'Escort paranoid merchant',
      'Salvage "totally not stolen" goods',
      'Find lost space tourist',
      'Pull small prank (involving antimatter)',
      'Transport experimental goo',
      'Deliver lug nuts to hostile robot planet',
      'Test weapons on small moons',
      'Listen to Also sprach Zarathustra',
      'Deliver antique weapons to museum',
      'Survey planet that keeps disappearing',
      'Transport android that won\'t stop talking',
      'Haul defective AI cores',
      'Blow up space junk',
      'Escort convoy through "totally safe" nebula',
      'Deliver barely expired medical supplies',
      'Make up new constellations',
      'Scrub space barnacles off ship',
      'Deliver waste to trash planet'
    ];
    
    // Find player's current tier index based on maxLY
    let playerTierIndex = 0;
    for (let i = 0; i < TIER_ORDER.length; i++) {
      if (playerMaxLY >= getMaxLYForTier(TIER_ORDER[i])) {
        playerTierIndex = i;
      }
    }
    
    // Generate missions for current tier and below (3-4 missions per accessible tier)
    for (let i = 0; i <= playerTierIndex; i++) {
      const tier = TIER_ORDER[i];
      const tierMaxLY = getMaxLYForTier(tier);
      const tierMinLY = i > 0 ? getMaxLYForTier(TIER_ORDER[i - 1]) : 10;
      
      const missionsForTier = i === playerTierIndex ? 4 : 3;
      
      for (let j = 0; j < missionsForTier; j++) {
        const rawDistance = Math.floor(Math.random() * (tierMaxLY - tierMinLY)) + tierMinLY;
        const distance = Math.round(rawDistance / 5) * 5; // Round to nearest 5
        
        // Calculate duration based on distance brackets with gradual increase
        let duration;
        if (distance <= 100) duration = Math.floor(Math.random() * 2) + 1; // 1-2h
        else if (distance <= 200) duration = Math.floor(Math.random() * 2) + 2; // 2-3h
        else if (distance <= 300) duration = Math.floor(Math.random() * 2) + 3; // 3-4h
        else if (distance <= 500) duration = Math.floor(Math.random() * 3) + 4; // 4-6h
        else if (distance <= 750) duration = Math.floor(Math.random() * 4) + 6; // 6-9h
        else duration = Math.floor(Math.random() * 4) + 9; // 9-12h
        
        // Calculate parts reward based on tier
        const tierPartsMap = {
          'Unregistered': [1, 3],
          'Known': [2, 4],
          'Notorious': [3, 5],
          'Esteemed': [4, 6],
          'Renowned': [6, 8],
          'Legendary': [8, 10]
        };
        const [minParts, maxParts] = tierPartsMap[tier] || [1, 3];
        const partsReward = Math.floor(Math.random() * (maxParts - minParts + 1)) + minParts;
        
        missions.push({
          id: `mission_${tier}_${j}`,
          distance,
          duration,
          partsReward,
          fuelCost: Math.min(170, Math.max(1, Math.floor(distance / 100))),
          description: descriptions[Math.floor(Math.random() * descriptions.length)],
          tier,
          requiredLY: distance
        });
      }
    }
    
    // Add 1-2 aspirational missions (next tier above player)
    if (playerTierIndex < TIER_ORDER.length - 1) {
      const nextTier = TIER_ORDER[playerTierIndex + 1];
      const tierMaxLY = getMaxLYForTier(nextTier);
      const tierMinLY = getMaxLYForTier(TIER_ORDER[playerTierIndex]);
      
      const numAspirational = playerTierIndex < TIER_ORDER.length - 2 ? 2 : 1;
      
      for (let i = 0; i < numAspirational; i++) {
        const rawDistance = Math.floor(Math.random() * (tierMaxLY - tierMinLY)) + tierMinLY;
        const distance = Math.round(rawDistance / 5) * 5; // Round to nearest 5
        
        // Calculate duration based on distance brackets with gradual increase
        let duration;
        if (distance <= 100) duration = Math.floor(Math.random() * 2) + 1; // 1-2h
        else if (distance <= 200) duration = Math.floor(Math.random() * 2) + 2; // 2-3h
        else if (distance <= 300) duration = Math.floor(Math.random() * 2) + 3; // 3-4h
        else if (distance <= 500) duration = Math.floor(Math.random() * 3) + 4; // 4-6h
        else if (distance <= 750) duration = Math.floor(Math.random() * 4) + 6; // 6-9h
        else duration = Math.floor(Math.random() * 4) + 9; // 9-12h
        
        // Calculate parts reward based on tier
        const tierPartsMap = {
          'Unregistered': [1, 3],
          'Known': [2, 4],
          'Notorious': [3, 5],
          'Esteemed': [4, 6],
          'Renowned': [6, 8],
          'Legendary': [8, 10]
        };
        const [minParts, maxParts] = tierPartsMap[nextTier] || [1, 3];
        const partsReward = Math.floor(Math.random() * (maxParts - minParts + 1)) + minParts;
        
        missions.push({
          id: `mission_aspirational_${i}`,
          distance,
          duration,
          partsReward,
          fuelCost: Math.min(170, Math.max(1, Math.floor(distance / 100))),
          description: descriptions[Math.floor(Math.random() * descriptions.length)],
          tier: nextTier,
          requiredLY: distance,
          aspirational: true
        });
      }
    }
    
    setAvailableMissions(missions);
  };
  
  const handleConfirmShip = async (selectedShips) => {
    if (!selectedMission || !selectedShips || selectedShips.length === 0) return;
    if (isDeploying) return;

    if (gameState.fuel < selectedMission.fuelCost) {
      addMessage('Insufficient fuel!');
      return;
    }

    // Check if any selected ships are already active (double-tap guard)
    const alreadyActive = selectedShips.some(ship => ship.status === 'active');
    if (alreadyActive) {
      addMessage('One or more ships are already deployed!');
      setSelectedMission(null);
      return;
    }

    setIsDeploying(true);
    try {
    // Create mission with multiple ships
    await base44.entities.Mission.create({
      ships: selectedShips.map(ship => ({
        shipId: ship.id,
        shipName: ship.name,
        hourlyPay: ship.hourlyPay,
        status: 'active'
      })),
      distance: selectedMission.distance,
      duration: selectedMission.duration,
      partsReward: selectedMission.partsReward || 0,
      crystalReward: selectedMission.crystalReward || 0,
      isFridayMission: selectedMission.isFridayMission || false,
      fuelCost: selectedMission.fuelCost,
      startTime: new Date().toISOString(),
      status: 'active',
      description: selectedMission.description
    });
    
    // Update all ship statuses using centralized function
    for (const ship of selectedShips) {
      await updateShip(ship.id, { status: 'active' });
    }
    
    // Deduct fuel
    await updateGameState({
      fuel: gameState.fuel - selectedMission.fuelCost
    });
    
    addMessage(`${selectedShips.length} ship${selectedShips.length > 1 ? 's' : ''} deployed on mission!`);
    
    // Reset selection
    setSelectedMission(null);
    } finally {
      setIsDeploying(false);
    }
  };
  
  return (
    <DeviceFrame title="JOBS">
      <div className="flex flex-col h-full overflow-hidden" style={{ maxWidth: '100%', paddingLeft: 'var(--safe-x)', paddingRight: 'var(--safe-x)', boxSizing: 'border-box' }}>
        <ResourceHeader />
        <div className="flex-1 overflow-y-auto" style={{ paddingLeft: '0', paddingRight: '0', paddingTop: '70px', paddingBottom: '24px' }}>
        <div className="relative p-4 mb-4">
          <div className="absolute inset-0 bg-[#2a3a2f] border-2 border-[#5a7a5f]" style={{
            boxShadow: 'inset 0 0 0 1px #1a2a1f'
          }}></div>
          <div className="absolute inset-[4px] bg-[#1a2a1f]" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(90,122,95,0.1) 1px, transparent 0)',
            backgroundSize: '3px 3px',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)'
          }}></div>
          <div className="relative flex items-center justify-between">
            <div className="text-[#a8c5ad] font-bold">AVAILABLE MISSIONS</div>
            <div className="flex items-center gap-2 text-[#5a9a8f]">
              <Fuel className="w-4 h-4" />
              <span className="font-bold">{gameState?.fuel} fuel</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-3 mb-4">
          {availableMissions.map((mission, idx) => {
            return (
            <div
              key={mission.id}
              onClick={() => setSelectedMission(mission)}
              className="relative cursor-pointer"
            >
              <div className={`absolute inset-0 border-2 ${
                selectedMission?.id === mission.id
                  ? 'border-[#5a9a6f]'
                  : 'border-[#3a5a4f]'
              }`} style={{
                boxShadow: 'inset 0 0 0 1px #1a2a1f'
              }}></div>
              <div className={`absolute inset-[3px] ${
                selectedMission?.id === mission.id
                  ? 'bg-[#2a3a2f]'
                  : 'bg-[#1a2a1f]'
              }`} style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(58,90,79,0.15) 1px, transparent 0)',
                backgroundSize: '3px 3px',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)'
              }}></div>
              <div className="relative p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[#a8c5ad] font-bold">{mission.description}</div>
                </div>
                
                <div className="text-xs text-[#5a6a5f] mb-2">{mission.tier} and higher</div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1 text-[#5a9a8f]">
                    <MapPin className="w-3 h-3" />
                    <span>{mission.distance} ly</span>
                  </div>
                  <div className="flex items-center gap-1 text-[#5a9a8f]">
                    <Clock className="w-3 h-3" />
                    <span>{mission.duration}h</span>
                  </div>
                  <div className="flex items-center gap-1 text-[#d89944]">
                    {mission.isFridayMission ? (
                      <>
                        <img 
                          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695af5ca435140b76c0dadc9/26d2c74b8_crystal.png" 
                          alt="Crystal" 
                          className="w-3 h-3"
                        />
                        <span>{mission.crystalReward} crystals</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3" />
                        <span>{mission.partsReward} parts</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[#5a9a8f]">
                    <Fuel className="w-3 h-3" />
                    <span>{mission.fuelCost} fuel</span>
                  </div>
                </div>
              </div>
            </div>
          )})}
        
        </div>
        
        {selectedMission && allHiredShips.length > 0 && (
          <MissionShipSelection
            mission={selectedMission}
            ships={allHiredShips}
            onConfirm={handleConfirmShip}
            onCancel={() => setSelectedMission(null)}
          />
        )}
        
        {selectedMission && allHiredShips.length === 0 && (
          <div className="fixed z-[4] bg-gradient-to-br from-gray-900 to-gray-950 flex flex-col" style={{
            top: 'calc(var(--content-pad-top) - 40px)',
            bottom: 'calc(var(--content-pad-bottom) - 30px)',
            left: 'var(--content-pad-left)',
            right: 'var(--content-pad-right)'
          }}>
            <div className="flex-1 flex flex-col px-6 py-4 relative">
              <div className="mb-6 mt-6">
                <h2 className="text-cyan-400 font-bold text-base">SELECT SHIP</h2>
              </div>
              <div className="text-gray-500 text-sm text-center py-8 flex-1 flex items-center justify-center">
                No ships available. Hire more ships or wait for active missions to complete.
              </div>
              <button
                onClick={() => setSelectedMission(null)}
                className="bg-gray-700 hover:bg-gray-600 border-2 border-gray-600 rounded-lg py-2.5 text-white font-bold text-sm transition-all mb-8"
              >
                BACK
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </DeviceFrame>
  );
}