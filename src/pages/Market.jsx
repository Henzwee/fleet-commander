import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useGame } from '../components/game/GameProvider';
import DeviceFrame from '../components/game/DeviceFrame';
import ResourceHeader from '../components/game/ResourceHeader';
import PurchaseConfirmDialog from '../components/game/PurchaseConfirmDialog';
import { Clock, ShoppingCart, Zap } from 'lucide-react';
import { MarketEngine } from '../components/game/MarketEngine';

export default function Market() {
  const { gameState, updateGameState, addMessage, rollShipTier } = useGame();
  const [activeTab, setActiveTab] = useState('scrap');
  const [marketItems, setMarketItems] = useState([]);
  const [timeUntilReset, setTimeUntilReset] = useState('');
  const [purchaseDialog, setPurchaseDialog] = useState(null);
  
  useEffect(() => {
    if (gameState) {
      // Initialize MarketEngine if not already done
      if (MarketEngine.getAll().length === 0) {
        const baseItems = [
          { id: 'cracked_glass', name: 'Cracked Glass', basePrice: 150 },
          { id: 'evil_ai', name: 'Totally Not Evil A.I.', basePrice: 100 },
          { id: 'rusty_screws', name: 'Rusty Screws', basePrice: 300 },
          { id: 'wire_splice', name: 'Wire Splice (Gum)', basePrice: 200 },
          { id: 'antimatter', name: 'Mostly Stable Antimatter', basePrice: 600 },
          { id: 'sci_fi_panel', name: 'Sci-Fi Looking Panel', basePrice: 800 },
          { id: 'tangled_wire', name: 'Box of Tangled Wire', basePrice: 60 },
          { id: 'stripped_bolts', name: 'Stripped Bolts', basePrice: 400 },
          { id: 'outdated_map', name: 'Outdated Map', basePrice: 500 },
          { id: 'expired_food', name: 'Expired Food Rations', basePrice: 700 }
        ];
        MarketEngine.init(baseItems);
      }
      
      generateMarketItems();
      updateResetTimer();
      
      // Subscribe to market updates
      const unsubscribe = MarketEngine.subscribe(() => {
        generateMarketItems();
      });
      
      return () => unsubscribe();
    }
  }, [gameState, activeTab]);
  
  useEffect(() => {
    const interval = setInterval(updateResetTimer, 1000);
    return () => clearInterval(interval);
  }, [gameState]);
  
  const updateResetTimer = () => {
    if (!gameState?.lastMarketReset) return;
    
    const lastReset = new Date(gameState.lastMarketReset);
    const nextReset = new Date(lastReset.getTime() + 6 * 60 * 60 * 1000);
    const now = new Date();
    const diff = nextReset - now;
    
    if (diff <= 0) {
      setTimeUntilReset('Resetting...');
    } else {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeUntilReset(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }
  };
  
  const generateMarketItems = () => {
    if (activeTab === 'scrap') {
      // Get prices from MarketEngine
      const iconMap = {
        'Box of Tangled Wire': '📦',
        'Totally Not Evil A.I.': '🤖',
        'Cracked Glass': '🔷',
        'Wire Splice (Gum)': '🔧',
        'Rusty Screws': '🔩',
        'Stripped Bolts': '⚙️',
        'Outdated Map': '🗺️',
        'Mostly Stable Antimatter': '⚛️',
        'Expired Food Rations': '🥫',
        'Sci-Fi Looking Panel': '🖥️'
      };
      
      // Initialize stock if not exists
      if (!gameState.marketStock) {
        const initialStock = {};
        MarketEngine.getAll().forEach(item => {
          initialStock[item.id] = Math.floor(Math.random() * 16) + 5; // 5-20 stock
        });
        updateGameState({ marketStock: initialStock });
      }
      
      const parts = MarketEngine.getAll().map(item => ({
        id: item.id,
        name: item.name,
        price: item.currentPrice,
        deltaPercent: item.deltaPercent,
        icon: iconMap[item.name] || '📦',
        stock: gameState?.marketStock?.[item.id] || 0,
        currency: 'credits'
      }));
      
      setMarketItems(parts);
    } else if (activeTab === 'ships') {
      // Generate ships based on player's highest tier
      const ships = [];
      for (let i = 0; i < 5; i++) {
        const tier = rollShipTier();
        const tierPrices = {
          'Unregistered': [1000, 2000],
          'Known': [3000, 5000],
          'Notorious': [6000, 10000],
          'Esteemed': [12000, 18000],
          'Renowned': [20000, 30000],
          'Legendary': [40000, 60000]
        };
        
        const [min, max] = tierPrices[tier];
        const price = Math.floor(Math.random() * (max - min + 1)) + min;
        
        const names = ['Vanguard', 'Sentinel', 'Pathfinder', 'Explorer', 'Voyager'];
        ships.push({
          name: names[i] + '-' + Math.floor(Math.random() * 1000),
          tier,
          price,
          icon: '🚀',
          stock: 1,
          currency: 'credits'
        });
      }
      setMarketItems(ships);
    } else if (activeTab === 'fuel') {
      // Fuel for crystals
      const fuelItems = [
        { 
          id: 'fuel_10', 
          name: '10 Fuel', 
          price: 5, 
          fuelAmount: 10, 
          icon: '⛽',
          stock: Math.floor(Math.random() * 11) + 10, // 10-20 stock
          currency: 'crystals'
        },
        { 
          id: 'fuel_25', 
          name: '25 Fuel', 
          price: 12, 
          fuelAmount: 25, 
          icon: '⛽',
          stock: Math.floor(Math.random() * 11) + 10,
          currency: 'crystals'
        },
        { 
          id: 'fuel_50', 
          name: '50 Fuel', 
          price: 20, 
          fuelAmount: 50, 
          icon: '⛽',
          stock: Math.floor(Math.random() * 11) + 10,
          currency: 'crystals'
        },
        { 
          id: 'fuel_100', 
          name: '100 Fuel', 
          price: 35, 
          fuelAmount: 100, 
          icon: '⛽',
          stock: Math.floor(Math.random() * 11) + 10,
          currency: 'crystals'
        }
      ];
      setMarketItems(fuelItems);
    }
  };
  
  const handleBuyClick = (item) => {
    setPurchaseDialog(item);
  };
  
  const handleConfirmPurchase = async (quantity) => {
    const item = purchaseDialog;
    const currency = item.currency || 'credits';
    const totalCost = item.price * quantity;
    
    // Check currency
    if (currency === 'crystals') {
      if (gameState.crystals < totalCost) {
        addMessage('Insufficient crystals!');
        setPurchaseDialog(null);
        return;
      }
    } else {
      if (gameState.credits < totalCost) {
        addMessage('Insufficient credits!');
        setPurchaseDialog(null);
        return;
      }
    }
    
    if (activeTab === 'scrap') {
      const newParts = { ...gameState.parts };
      newParts[item.name] = (newParts[item.name] || 0) + quantity;
      
      const newStock = { ...gameState.marketStock };
      newStock[item.id] = (newStock[item.id] || 0) - quantity;
      
      const updates = { parts: newParts, marketStock: newStock };
      if (currency === 'crystals') {
        updates.crystals = gameState.crystals - totalCost;
      } else {
        updates.credits = gameState.credits - totalCost;
      }
      
      await updateGameState(updates);
      addMessage(`Purchased ${quantity}x ${item.name}`);
    } else if (activeTab === 'ships') {
      // Create ship
      const tierPay = {
        'Unregistered': [200, 500],
        'Known': [250, 750],
        'Notorious': [300, 900],
        'Esteemed': [500, 1100],
        'Renowned': [750, 1800],
        'Legendary': [1000, 2000]
      };
      
      const [min, max] = tierPay[item.tier];
      const hourlyPay = Math.floor(Math.random() * (max - min + 1)) + min;
      
      await base44.entities.Ship.create({
        name: item.name,
        tier: item.tier,
        health: 100,
        damaged: false,
        status: 'idle',
        isHired: true,
        hourlyPay
      });
      
      await updateGameState({
        credits: gameState.credits - totalCost
      });
      
      addMessage(`Hired ${item.name} for $${totalCost}`);
    } else if (activeTab === 'fuel') {
      await updateGameState({
        fuel: gameState.fuel + (item.fuelAmount * quantity),
        crystals: gameState.crystals - totalCost
      });
      
      addMessage(`Purchased ${item.fuelAmount * quantity} fuel for ◆${totalCost}`);
    }
    
    setPurchaseDialog(null);
    generateMarketItems();
  };
  
  return (
    <DeviceFrame title="STORE">
      <ResourceHeader />
      <div className="p-4 pb-24 overflow-y-auto h-full">
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-2 border-cyan-500/50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-400" />
                <span className="text-amber-400 font-bold text-lg">
                  ${gameState?.credits.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-400" />
                <span className="text-purple-400 font-bold text-lg">
                  ◆{gameState?.crystals || 0}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-cyan-400 text-sm">
              <Clock className="w-4 h-4" />
              <span>Resets: {timeUntilReset}</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('scrap')}
            className={`flex-1 py-3 rounded-lg font-bold text-sm border-2 transition-all ${
              activeTab === 'scrap'
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                : 'bg-gray-800 border-gray-600 text-gray-400'
            }`}
          >
            SCRAP
          </button>
          <button
            onClick={() => setActiveTab('ships')}
            className={`flex-1 py-3 rounded-lg font-bold text-sm border-2 transition-all ${
              activeTab === 'ships'
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                : 'bg-gray-800 border-gray-600 text-gray-400'
            }`}
          >
            SHIPS
          </button>
          <button
            onClick={() => setActiveTab('fuel')}
            className={`flex-1 py-3 rounded-lg font-bold text-sm border-2 transition-all ${
              activeTab === 'fuel'
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                : 'bg-gray-800 border-gray-600 text-gray-400'
            }`}
          >
            FUEL
          </button>
        </div>
        
        <div className="space-y-3">
          {marketItems.map((item, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-r from-gray-800 to-gray-900 border border-cyan-500/30 rounded-lg p-4 flex items-center justify-between hover:border-cyan-500 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="text-3xl">{item.icon}</div>
                <div>
                  <div className="text-cyan-100 font-bold text-sm">
                    {item.name}
                    {activeTab === 'scrap' && item.deltaPercent !== 0 && (
                      <span 
                        className={`ml-2 text-xs ${
                          item.deltaPercent > 0 
                            ? 'text-red-400' 
                            : 'text-green-400'
                        }`}
                      >
                        {item.deltaPercent > 0 ? '+' : ''}
                        {item.deltaPercent}%
                      </span>
                    )}
                  </div>
                  {item.tier && (
                    <div className="text-xs text-gray-400">{item.tier}</div>
                  )}
                  {item.stock !== undefined && (
                    <div className="text-xs text-gray-500">Stock: {item.stock}</div>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => handleBuyClick(item)}
                disabled={
                  (item.currency === 'crystals' ? gameState?.crystals < item.price : gameState?.credits < item.price) ||
                  item.stock === 0
                }
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed border-2 border-green-500 disabled:border-gray-500 rounded-lg px-6 py-2 text-white font-bold text-sm transition-all"
              >
                {item.currency === 'crystals' ? '◆' : '$'}{item.price}
              </button>
            </div>
          ))}
        </div>
        
        {purchaseDialog && (
          <PurchaseConfirmDialog
            item={purchaseDialog}
            onConfirm={handleConfirmPurchase}
            onCancel={() => setPurchaseDialog(null)}
          />
        )}
      </div>
    </DeviceFrame>
  );
}