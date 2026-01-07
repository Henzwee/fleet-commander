import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useGame } from '../components/game/GameProvider';
import DeviceFrame from '../components/game/DeviceFrame';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import ShipCard from '../components/game/ShipCard';
import { getRandomShipImage, SHIP_IMAGES } from '../components/game/ShipImages';

export default function HireShips() {
  const navigate = useNavigate();
  const { gameState, updateGameState, addMessage, rollShipTier } = useGame();
  const [availableShips, setAvailableShips] = useState([]);
  
  useEffect(() => {
    generateAvailableShips();
  }, []);
  
  const generateAvailableShips = () => {
    const ships = [];
    const names = ['Vanguard', 'Sentinel', 'Pathfinder', 'Explorer', 'Voyager', 'Nomad', 'Ranger', 'Pioneer'];
    
    for (let i = 0; i < 6; i++) {
      const tier = rollShipTier();
      const tierPrices = {
        'Unregistered': [1000, 2000],
        'Known': [3000, 5000],
        'Notorious': [6000, 10000],
        'Esteemed': [12000, 18000],
        'Renowned': [20000, 30000],
        'Legendary': [40000, 60000]
      };
      
      const tierPay = {
        'Unregistered': [200, 500],
        'Known': [250, 750],
        'Notorious': [300, 900],
        'Esteemed': [500, 1100],
        'Renowned': [750, 1800],
        'Legendary': [1000, 2000]
      };
      
      const [minPrice, maxPrice] = tierPrices[tier];
      const price = Math.floor(Math.random() * (maxPrice - minPrice + 1)) + minPrice;
      
      const [minPay, maxPay] = tierPay[tier];
      const hourlyPay = Math.floor(Math.random() * (maxPay - minPay + 1)) + minPay;
      
      const tierMaxLY = {
        'Unregistered': 100,
        'Known': 500,
        'Notorious': 1500,
        'Esteemed': 3500,
        'Renowned': 6000,
        'Legendary': 10000
      };
      
      ships.push({
        name: names[i] + '-' + Math.floor(Math.random() * 1000),
        tier,
        imageUrl: getRandomShipImage(tier),
        maxLY: tierMaxLY[tier],
        price,
        hourlyPay,
        health: 100
      });
    }
    
    setAvailableShips(ships);
  };
  
  const handleHire = async (ship) => {
    if (gameState.credits < ship.price) {
      addMessage('Insufficient credits!');
      return;
    }
    
    await base44.entities.Ship.create({
      name: ship.name,
      tier: ship.tier,
      imageUrl: ship.imageUrl,
      maxLY: ship.maxLY,
      health: 100,
      damaged: false,
      status: 'idle',
      isHired: true,
      hourlyPay: ship.hourlyPay
    });
    
    await updateGameState({
      credits: gameState.credits - ship.price
    });
    
    addMessage(`${ship.name} hired for $${ship.price}!`);
    
    // Remove from available
    setAvailableShips(availableShips.filter(s => s.name !== ship.name));
  };
  
  return (
    <DeviceFrame title="HIRE SHIPS">
      <div className="p-4 pb-20 overflow-y-auto h-full">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(createPageUrl('Main'))}
            className="bg-gray-700 border-2 border-gray-600 rounded-lg p-2 text-gray-300 hover:bg-gray-600 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <ShoppingCart className="w-5 h-5" />
            <span>${gameState?.credits.toLocaleString()}</span>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-2 border-cyan-500/50 rounded-lg p-4 mb-4">
          <div className="text-cyan-400 font-bold text-sm">AVAILABLE FOR HIRE</div>
          <div className="text-gray-400 text-xs mt-1">Select a ship to add to your fleet</div>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {availableShips.map((ship, idx) => (
            <div key={idx}>
              <ShipCard ship={ship} showPrice={true} onClick={() => {}} />
              
              <button
                onClick={() => handleHire(ship)}
                disabled={gameState.credits < ship.price}
                className="w-full mt-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed border-2 border-green-500 disabled:border-gray-500 rounded-lg py-3 text-white font-bold transition-all"
              >
                HIRE FOR ${ship.price.toLocaleString()}
              </button>
            </div>
          ))}
        </div>
      </div>
    </DeviceFrame>
  );
}