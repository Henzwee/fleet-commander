import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useGame } from '../components/game/GameProvider';

import DeviceFrame from '../components/game/DeviceFrame';
import ResourceHeader from '../components/game/ResourceHeader';
import PurchaseConfirmDialog from '../components/game/PurchaseConfirmDialog';
import ShipPurchaseDialog from '../components/game/ShipPurchaseDialog';
import { Clock, ShoppingCart, Zap, RefreshCw } from 'lucide-react';
import { MarketEngine } from '../components/game/MarketEngine';
import { getRandomShipImage } from '../components/game/ShipImages';
import { generateWeightedRotation, updateRotationHistory } from '../components/game/MarketRotation';
import { SHIP_TIERS, getTierConfig } from '../components/game/ShipTierConfig';

export default function Market() {
  const { gameState, addShip, updateGameState, addMessage, rollShipTier } = useGame();
  const [activeTab, setActiveTab] = useState('scrap');
  const [marketItems, setMarketItems] = useState([]);
  const [timeUntilReset, setTimeUntilReset] = useState('');
  const [purchaseDialog, setPurchaseDialog] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  
  useEffect(() => {
    if (gameState) {
      // Initialize MarketEngine with correct names (force re-init if names are wrong)
      const baseItems = [
        { id: 'cracked_glass', name: 'Cracked glass', basePrice: 150 },
        { id: 'evil_ai', name: 'Reformed evil AI', basePrice: 100 },
        { id: 'rusty_screws', name: 'Rusty screws', basePrice: 300 },
        { id: 'wire_splice', name: 'Wire splice', basePrice: 200 },
        { id: 'antimatter', name: 'Mostly stable antimatter', basePrice: 600 },
        { id: 'sci_fi_panel', name: 'Sci-fi looking panel', basePrice: 800 },
        { id: 'tangled_wire', name: 'Box of tangled wire', basePrice: 60 },
        { id: 'stripped_bolts', name: 'Stripped bolts', basePrice: 400 },
        { id: 'outdated_map', name: 'Outdated map', basePrice: 500 },
        { id: 'expired_food', name: 'Expired food rations', basePrice: 700 }
      ];
      
      // Check if we need to re-initialize due to name changes
      const existing = MarketEngine.getAll();
      const needsReinit = existing.length === 0 || 
        existing.some(item => {
          const correct = baseItems.find(b => b.id === item.id);
          return correct && correct.name !== item.name;
        });
      
      if (needsReinit) {
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
  
  const generateMarketItems = async () => {
    if (activeTab === 'scrap') {
      // Get prices from MarketEngine
      const iconMap = {
        'Box of tangled wire': '📦',
        'Reformed evil AI': '🤖',
        'Cracked glass': '🔷',
        'Wire splice': '🔧',
        'Rusty screws': '🔩',
        'Stripped bolts': '⚙️',
        'Outdated map': '🗺️',
        'Mostly stable antimatter': '⚛️',
        'Expired food rations': '🥫',
        'Sci-fi looking panel': '🖥️'
      };
      
      // Initialize or use existing market rotation
      if (!gameState.marketStock && !isInitializing) {
        setIsInitializing(true);
        const allItems = MarketEngine.getAll();
        const allItemIds = allItems.map(item => item.id);
        
        // Use weighted rotation with no history (first time)
        const seed = Date.now();
        const selectedIds = generateWeightedRotation(allItemIds, [], 6, seed);
        
        const newStock = { shipStock: 5 }; // Initialize with ship stock
        selectedIds.forEach(itemId => {
          const stockAmount = Math.floor(Math.random() * 5) + 1; // 1-5 stock
          newStock[itemId] = stockAmount;
        });
        
        // Store rotation history
        const rotationHistory = updateRotationHistory(selectedIds, []);
        
        await updateGameState({ 
          marketStock: newStock,
          marketRotationHistory: rotationHistory,
          lastMarketRotationSeed: seed
        });
        setIsInitializing(false);
        return;
      }
      
      // Use existing rotation
      const parts = Object.keys(gameState.marketStock)
        .filter(itemId => itemId !== 'shipStock') // Skip shipStock
        .map(itemId => {
          const item = MarketEngine.get(itemId);
          if (!item) return null; // Skip if item doesn't exist
          return {
            id: item.id,
            name: item.name,
            price: item.currentPrice,
            deltaPercent: item.deltaPercent,
            icon: iconMap[item.name] || '📦',
            stock: gameState.marketStock[itemId],
            currency: 'credits'
          };
        })
        .filter(Boolean); // Remove null entries
      
      setMarketItems(parts);
    } else if (activeTab === 'ships') {
      // Ensure ship stock and seed are initialized
      if ((gameState.marketStock?.shipStock === undefined || !gameState.lastMarketRotationSeed) && !isInitializing) {
        setIsInitializing(true);
        const newStock = { ...gameState.marketStock, shipStock: 5 };
        const seed = gameState.lastMarketRotationSeed || Date.now();
        await updateGameState({ 
          marketStock: newStock,
          lastMarketRotationSeed: seed
        });
        setIsInitializing(false);
        return;
      }

      // Check if ships are sold out
      if (gameState.marketStock.shipStock <= 0) {
        setMarketItems([]);
        return;
      }

      // Generate ships based on seed for consistency
      const ships = [];
      const seed = gameState.lastMarketRotationSeed;
      const shipCount = gameState.marketStock.shipStock;

      for (let i = 0; i < shipCount; i++) {
        // Use seed-based random for tier
        const tierRand = Math.sin(seed + i * 100) * 10000;
        const tierVal = tierRand - Math.floor(tierRand);
        
        let tier;
        if (tierVal < 0.30) tier = 'Unregistered';
        else if (tierVal < 0.55) tier = 'Known';
        else if (tierVal < 0.75) tier = 'Notorious';
        else if (tierVal < 0.90) tier = 'Esteemed';
        else if (tierVal < 0.98) tier = 'Renowned';
        else tier = 'Legendary';

        const tierConfig = getTierConfig(tier);

        // Use seed for consistent pricing
        const payRand = Math.sin(seed + i * 200) * 10000;
        const payVal = payRand - Math.floor(payRand);
        const [minPay, maxPay] = tierConfig.payRange;
        const hourlyPay = Math.floor(payVal * (maxPay - minPay + 1)) + minPay;

        const priceRand = Math.sin(seed + i * 300) * 10000;
        const priceVal = priceRand - Math.floor(priceRand);
        const [min, max] = tierConfig.priceRange;
        const price = Math.floor(priceVal * (max - min + 1)) + min;

        // Use seed for consistent naming
        const nameRand = Math.sin(seed + i * 400) * 10000;
        const nameVal = Math.floor((nameRand - Math.floor(nameRand)) * 1000);
        const names = ['Vanguard', 'Sentinel', 'Pathfinder', 'Explorer', 'Voyager'];
        
        ships.push({
          name: names[i % names.length] + '-' + nameVal,
          tier,
          imageUrl: getRandomShipImage(tier),
          maxLY: tierConfig.maxLY,
          price,
          hourlyPay,
          icon: '🚀',
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
      // Create ship using centralized function
      await addShip({
        name: item.name,
        tier: item.tier,
        imageUrl: item.imageUrl,
        maxLY: item.maxLY,
        health: 100,
        damaged: false,
        status: 'idle',
        isHired: true,
        hourlyPay: item.hourlyPay
      });
      
      const newStock = { ...gameState.marketStock };
      newStock.shipStock = (newStock.shipStock || 5) - 1;

      await updateGameState({
        credits: gameState.credits - totalCost,
        marketStock: newStock
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
      <div className="flex flex-col min-h-full pb-6" style={{ maxWidth: '100%', paddingLeft: 'var(--safe-x)', paddingRight: 'var(--safe-x)', boxSizing: 'border-box' }}>
        <ResourceHeader />
        <div className="p-4 pb-24 overflow-y-auto h-full" style={{ paddingLeft: '0', paddingRight: '0', paddingTop: '70px' }}>
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-2 border-cyan-500/50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-400 text-sm">
              <Clock className="w-4 h-4" />
              <span>Resets: {timeUntilReset}</span>
            </div>
            <button
              onClick={async () => {
                if (!gameState || gameState.crystals < 10) {
                  addMessage('Need 10 crystals to reset market!');
                  return;
                }
                
                // Use weighted rotation based on history
                const allItems = MarketEngine.getAll();
                const allItemIds = allItems.map(item => item.id);
                const rotationHistory = gameState.marketRotationHistory || [];
                const seed = Date.now();
                
                const selectedIds = generateWeightedRotation(allItemIds, rotationHistory, 6, seed);
                
                const newStock = {};
                selectedIds.forEach(itemId => {
                  MarketEngine.reprice(itemId);
                  const stockAmount = Math.floor(Math.random() * 5) + 1; // 1-5 stock
                  newStock[itemId] = stockAmount;
                });
                newStock.shipStock = 5; // Reset ship stock
                
                // Update rotation history
                const newRotationHistory = updateRotationHistory(selectedIds, rotationHistory);
                
                await updateGameState({
                  crystals: gameState.crystals - 10,
                  lastMarketReset: new Date().toISOString(),
                  marketStock: newStock,
                  marketRotationHistory: newRotationHistory,
                  lastMarketRotationSeed: seed
                });
                addMessage('Market reset!');
              }}
              disabled={!gameState || gameState.crystals < 10}
              className="bg-purple-600 active:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed border-2 border-purple-500 disabled:border-gray-500 rounded-lg px-3 py-1 text-white font-bold text-xs transition-all flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695af5ca435140b76c0dadc9/26d2c74b8_crystal.png" 
                alt="Crystal" 
                className="w-3 h-3 inline-block"
              />
              <span>10</span>
            </button>
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
          {activeTab === 'ships' && marketItems.length === 0 && gameState?.marketStock?.shipStock <= 0 && (
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-2 border-cyan-500/30 rounded-lg p-8 text-center">
              <div className="text-cyan-400 font-bold text-lg mb-2">SOLD OUT</div>
              <div className="text-gray-400 text-sm">Come back later, money bags</div>
            </div>
          )}
          {marketItems.map((item, idx) => (
            <div
              key={idx}
              className={`bg-gradient-to-r from-gray-800 to-gray-900 border rounded-lg p-4 flex items-center justify-between transition-all ${
                (activeTab === 'scrap' && item.stock === 0) 
                  ? 'border-gray-700 opacity-50' 
                  : 'border-cyan-500/30'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.imageUrl ? (
                  <img 
                    src={item.imageUrl} 
                    alt={item.name} 
                    className="w-12 h-12 object-contain" 
                    style={item.imageUrl.includes('unregistered1.png') ? { transform: 'scale(0.6)' } : {}}
                  />
                ) : (
                  <div className="text-3xl">{item.icon}</div>
                )}
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
                    <div className="text-xs text-gray-400">{item.tier} • {item.maxLY} LY</div>
                  )}
                  {activeTab === 'scrap' && item.stock !== undefined && (
                    <div className={`text-xs ${item.stock === 0 ? 'text-red-500' : 'text-gray-500'}`}>
                      Stock: {item.stock}
                    </div>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => handleBuyClick(item)}
                disabled={
                  (item.currency === 'crystals' ? gameState?.crystals < item.price : gameState?.credits < item.price) ||
                  (activeTab === 'scrap' && item.stock === 0)
                }
                className="bg-green-600 active:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed border-2 border-green-500 disabled:border-gray-500 rounded-lg px-6 py-2 text-white font-bold text-sm transition-all"
              >
                {(activeTab === 'scrap' && item.stock === 0) ? 'OUT' : (
                  <>
                    {item.currency === 'crystals' ? (
                      <img 
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695af5ca435140b76c0dadc9/26d2c74b8_crystal.png" 
                        alt="Crystal" 
                        className="w-4 h-4 inline-block"
                      />
                    ) : '$'}
                    {item.price}
                  </>
                )}
              </button>
              </div>
              ))}
        </div>
        
        {purchaseDialog && activeTab === 'ships' && (
          <ShipPurchaseDialog
            ship={purchaseDialog}
            onConfirm={handleConfirmPurchase}
            onCancel={() => setPurchaseDialog(null)}
          />
        )}

        {purchaseDialog && activeTab !== 'ships' && (
          <PurchaseConfirmDialog
            item={purchaseDialog}
            onConfirm={handleConfirmPurchase}
            onCancel={() => setPurchaseDialog(null)}
          />
        )}
        </div>
      </div>
    </DeviceFrame>
  );
}