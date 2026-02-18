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
  const [processingPayment, setProcessingPayment] = useState(false);
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
  }, [activeTab, gameState?.marketStock?.shipStock, isInitializing]);
  
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
    if (!gameState) return;
    
    // Clear items first to prevent showing wrong tab's items
    setMarketItems([]);
    
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
      if (!gameState.marketStock) {
        if (isInitializing) return;
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
      // Wait if already initializing
      if (isInitializing) {
        return;
      }

      // Initialize marketStock if it doesn't exist (handled in scrap tab initialization)
      if (!gameState.marketStock) {
        return; // Will be initialized by scrap tab logic
      }
      
      // Helper function to generate ships
      const generateShips = (seed, count) => {
        const seededRandom = (seed, index, salt) => {
          const x = Math.sin(seed * 0.0001 + index * 12.9898 + salt * 78.233) * 43758.5453;
          return x - Math.floor(x);
        };

        const ships = [];
        for (let i = 0; i < count; i++) {
          const tierRand = seededRandom(seed, i, 1);
          
          let tier;
          if (tierRand < 0.30) tier = 'Unregistered';
          else if (tierRand < 0.55) tier = 'Known';
          else if (tierRand < 0.75) tier = 'Notorious';
          else if (tierRand < 0.90) tier = 'Esteemed';
          else if (tierRand < 0.98) tier = 'Renowned';
          else tier = 'Legendary';

          const tierConfig = getTierConfig(tier);

          const payRand = seededRandom(seed, i, 2);
          const [minPay, maxPay] = tierConfig.payRange;
          const hourlyPay = minPay + Math.floor(payRand * (maxPay - minPay + 1));

          const priceRand = seededRandom(seed, i, 3);
          const [min, max] = tierConfig.priceRange;
          const price = min + Math.floor(priceRand * (max - min + 1));

          const nameRand = seededRandom(seed, i, 4);
          const nameVal = Math.floor(nameRand * 1000);
          const names = ['Vanguard', 'Sentinel', 'Pathfinder', 'Explorer', 'Voyager'];
          
          ships.push({
            id: `ship_${seed}_${i}`,
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
        return ships;
      };
      
      // Initialize ships if they don't exist (undefined means never initialized, empty array means sold out)
      if (!gameState.marketStock.ships) {
        if (isInitializing) return;
        setIsInitializing(true);

        const seed = gameState.lastMarketRotationSeed || Date.now();
        const ships = generateShips(seed, 5);

        await updateGameState({ 
          marketStock: {
            ...gameState.marketStock,
            ships,
            shipStock: ships.length
          },
          lastMarketRotationSeed: seed
        });
        setIsInitializing(false);
        return;
      }

      // Display stored ships
      setMarketItems(gameState.marketStock.ships || []);
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
    } else if (activeTab === 'crystals') {
      const crystalPackages = [
        { id: 'crystal_099', name: '100 Crystals', price: 0.99, crystalAmount: 100, icon: '💎' },
        { id: 'crystal_299', name: '350 Crystals', price: 2.99, crystalAmount: 350, icon: '💎' },
        { id: 'crystal_499', name: '650 Crystals', price: 4.99, crystalAmount: 650, icon: '💎' },
        { id: 'crystal_999', name: '1400 Crystals', price: 9.99, crystalAmount: 1400, icon: '💎' },
        { id: 'crystal_1999', name: '3000 Crystals', price: 19.99, crystalAmount: 3000, icon: '💎' },
        { id: 'crystal_4999', name: '8000 Crystals', price: 49.99, crystalAmount: 8000, icon: '💎' },
        { id: 'crystal_9999', name: '17000 Crystals', price: 99.99, crystalAmount: 17000, icon: '💎' }
      ];
      setMarketItems(crystalPackages);
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
      
      // Remove the purchased ship from the stored ships array
      const newStock = { ...gameState.marketStock };
      const remainingShips = (newStock.ships || []).filter(ship => ship.id !== item.id);
      newStock.ships = remainingShips;
      newStock.shipStock = remainingShips.length;

      await updateGameState({
        credits: gameState.credits - totalCost,
        marketStock: newStock
      });
      
      // Check if all ships sold out after this purchase
      if (remainingShips.length === 0) {
        addMessage('No more ships for hire. Come back later, money bags.');
      } else {
        addMessage(`Hired ${item.name} for $${totalCost}`);
      }
    } else if (activeTab === 'fuel') {
      await updateGameState({
        fuel: gameState.fuel + (item.fuelAmount * quantity),
        crystals: gameState.crystals - totalCost
      });
      
      addMessage(`Purchased ${item.fuelAmount * quantity} fuel for ◆${totalCost}`);
    } else if (activeTab === 'crystals') {
      // Real money purchase - redirect to Stripe checkout
      setProcessingPayment(true);
      try {
        const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            'payment_method_types[]': 'card',
            'line_items[0][price_data][currency]': 'usd',
            'line_items[0][price_data][product_data][name]': item.name,
            'line_items[0][price_data][unit_amount]': Math.round(item.price * 100),
            'line_items[0][quantity]': '1',
            'mode': 'payment',
            'success_url': window.location.origin + '/success?crystals=' + item.crystalAmount,
            'cancel_url': window.location.origin + '/Market'
          })
        });
        
        const session = await response.json();
        window.location.href = session.url;
      } catch (error) {
        console.error('Payment error:', error);
        addMessage('Payment failed. Please try again.');
        setProcessingPayment(false);
      }
      return;
    }
    
    setPurchaseDialog(null);
    generateMarketItems();
  };
  
  return (
    <DeviceFrame title="STORE">
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
            <div className="flex items-center gap-2 text-[#5a9a8f] text-sm">
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
                
                // Generate new ships
                const seededRandom = (seed, index, salt) => {
                  const x = Math.sin(seed * 0.0001 + index * 12.9898 + salt * 78.233) * 43758.5453;
                  return x - Math.floor(x);
                };
                
                const newShips = [];
                for (let i = 0; i < 5; i++) {
                  const tierRand = seededRandom(seed, i, 1);
                  let tier;
                  if (tierRand < 0.30) tier = 'Unregistered';
                  else if (tierRand < 0.55) tier = 'Known';
                  else if (tierRand < 0.75) tier = 'Notorious';
                  else if (tierRand < 0.90) tier = 'Esteemed';
                  else if (tierRand < 0.98) tier = 'Renowned';
                  else tier = 'Legendary';

                  const tierConfig = getTierConfig(tier);
                  const payRand = seededRandom(seed, i, 2);
                  const [minPay, maxPay] = tierConfig.payRange;
                  const hourlyPay = minPay + Math.floor(payRand * (maxPay - minPay + 1));

                  const priceRand = seededRandom(seed, i, 3);
                  const [min, max] = tierConfig.priceRange;
                  const price = min + Math.floor(priceRand * (max - min + 1));

                  const nameRand = seededRandom(seed, i, 4);
                  const nameVal = Math.floor(nameRand * 1000);
                  const names = ['Vanguard', 'Sentinel', 'Pathfinder', 'Explorer', 'Voyager'];
                  
                  newShips.push({
                    id: `ship_${seed}_${i}`,
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
                
                newStock.ships = newShips;
                newStock.shipStock = newShips.length;
                
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
              className="relative px-3 py-1 font-bold text-xs flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-[#3a2a4a] border-2 border-[#6a5a7a]" style={{
                boxShadow: 'inset 0 1px 0 rgba(106,90,122,0.4)'
              }}></div>
              <div className="absolute inset-[2px] bg-[#4a3a5a]" style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(106,90,122,0.15) 1px, transparent 0)',
                backgroundSize: '3px 3px'
              }}></div>
              <RefreshCw className="w-3 h-3 relative text-[#b89acf]" />
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695af5ca435140b76c0dadc9/26d2c74b8_crystal.png" 
                alt="Crystal" 
                className="w-3 h-3 relative"
              />
              <span className="relative text-[#d0d0e8]">10</span>
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => setActiveTab('scrap')}
            className="relative py-3 font-bold text-sm"
          >
            <div className={`absolute inset-0 border-2 ${
              activeTab === 'scrap'
                ? 'bg-[#3a5a4f] border-[#5a7a5f]'
                : 'bg-[#2a3a2f] border-[#3a4a3f]'
            }`} style={{
              boxShadow: 'inset 0 0 0 1px #1a2a1f'
            }}></div>
            <div className={`absolute inset-[3px] ${
              activeTab === 'scrap'
                ? 'bg-[#3a5a4f]'
                : 'bg-[#1a2a1f]'
            }`} style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(90,122,95,0.15) 1px, transparent 0)',
              backgroundSize: '3px 3px',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)'
            }}></div>
            <span className={`relative ${
              activeTab === 'scrap'
                ? 'text-[#d0e8d5]'
                : 'text-[#5a6a5f]'
            }`}>SCRAP</span>
          </button>
          <button
            onClick={() => setActiveTab('ships')}
            className="relative py-3 font-bold text-sm"
          >
            <div className={`absolute inset-0 border-2 ${
              activeTab === 'ships'
                ? 'bg-[#3a5a4f] border-[#5a7a5f]'
                : 'bg-[#2a3a2f] border-[#3a4a3f]'
            }`} style={{
              boxShadow: 'inset 0 0 0 1px #1a2a1f'
            }}></div>
            <div className={`absolute inset-[3px] ${
              activeTab === 'ships'
                ? 'bg-[#3a5a4f]'
                : 'bg-[#1a2a1f]'
            }`} style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(90,122,95,0.15) 1px, transparent 0)',
              backgroundSize: '3px 3px',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)'
            }}></div>
            <span className={`relative ${
              activeTab === 'ships'
                ? 'text-[#d0e8d5]'
                : 'text-[#5a6a5f]'
            }`}>SHIPS</span>
          </button>
          <button
            onClick={() => setActiveTab('fuel')}
            className="relative py-3 font-bold text-sm"
          >
            <div className={`absolute inset-0 border-2 ${
              activeTab === 'fuel'
                ? 'bg-[#3a5a4f] border-[#5a7a5f]'
                : 'bg-[#2a3a2f] border-[#3a4a3f]'
            }`} style={{
              boxShadow: 'inset 0 0 0 1px #1a2a1f'
            }}></div>
            <div className={`absolute inset-[3px] ${
              activeTab === 'fuel'
                ? 'bg-[#3a5a4f]'
                : 'bg-[#1a2a1f]'
            }`} style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(90,122,95,0.15) 1px, transparent 0)',
              backgroundSize: '3px 3px',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)'
            }}></div>
            <span className={`relative ${
              activeTab === 'fuel'
                ? 'text-[#d0e8d5]'
                : 'text-[#5a6a5f]'
            }`}>FUEL</span>
          </button>
          <button
            onClick={() => setActiveTab('crystals')}
            className="relative py-3 font-bold text-sm"
          >
            <div className={`absolute inset-0 border-2 ${
              activeTab === 'crystals'
                ? 'bg-[#3a5a4f] border-[#5a7a5f]'
                : 'bg-[#2a3a2f] border-[#3a4a3f]'
            }`} style={{
              boxShadow: 'inset 0 0 0 1px #1a2a1f'
            }}></div>
            <div className={`absolute inset-[3px] ${
              activeTab === 'crystals'
                ? 'bg-[#3a5a4f]'
                : 'bg-[#1a2a1f]'
            }`} style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(90,122,95,0.15) 1px, transparent 0)',
              backgroundSize: '3px 3px',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)'
            }}></div>
            <span className={`relative ${
              activeTab === 'crystals'
                ? 'text-[#d0e8d5]'
                : 'text-[#5a6a5f]'
            }`}>CRYSTALS</span>
          </button>
        </div>
        
        <div className="space-y-3">
          {activeTab === 'ships' && gameState?.marketStock?.ships?.length === 0 && (
            <div className="relative p-8 text-center">
              <div className="absolute inset-0 bg-[#2a3a2f] border-2 border-[#5a7a5f]" style={{
                boxShadow: 'inset 0 0 0 1px #1a2a1f'
              }}></div>
              <div className="absolute inset-[4px] bg-[#1a2a1f]" style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(90,122,95,0.1) 1px, transparent 0)',
                backgroundSize: '3px 3px',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)'
              }}></div>
              <div className="relative">
                <div className="text-[#5a9a8f] font-bold text-lg mb-2">NO MORE SHIPS FOR HIRE</div>
                <div className="text-[#5a6a5f] text-sm">Come back later, money bags.</div>
              </div>
            </div>
          )}
          {marketItems.map((item, idx) => (
            <div
              key={idx}
              className="relative"
            >
              <div className={`absolute inset-0 border-2 ${
                (activeTab === 'scrap' && item.stock === 0)
                  ? 'border-[#3a3a3f] opacity-50'
                  : 'border-[#3a5a4f]'
              }`} style={{
                boxShadow: 'inset 0 0 0 1px #1a2a1f'
              }}></div>
              <div className="absolute inset-[3px] bg-[#1a2a1f]" style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(58,90,79,0.15) 1px, transparent 0)',
                backgroundSize: '3px 3px',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)'
              }}></div>
              <div className="relative p-4 flex items-center justify-between">
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
                    <div className="text-[#a8c5ad] font-bold text-sm">
                      {item.name}
                      {activeTab === 'scrap' && item.deltaPercent !== 0 && (
                        <span 
                          className={`ml-2 text-xs ${
                            item.deltaPercent > 0 
                              ? 'text-[#c84444]' 
                              : 'text-[#5a9a6f]'
                          }`}
                        >
                          {item.deltaPercent > 0 ? '+' : ''}
                          {item.deltaPercent}%
                        </span>
                      )}
                    </div>
                    {item.tier && (
                      <div className="text-xs text-[#5a6a5f]">{item.tier} • {item.maxLY} LY</div>
                    )}
                    {activeTab === 'scrap' && item.stock !== undefined && (
                      <div className={`text-xs ${item.stock === 0 ? 'text-[#c84444]' : 'text-[#5a6a5f]'}`}>
                        Stock: {item.stock}
                      </div>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => handleBuyClick(item)}
                  disabled={
                    (activeTab === 'crystals' ? false : 
                      (item.currency === 'crystals' ? gameState?.crystals < item.price : gameState?.credits < item.price)) ||
                    (activeTab === 'scrap' && item.stock === 0) ||
                    processingPayment
                  }
                  className="relative px-6 py-2 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-[#3a7a4f] border-2 border-[#5a9a6f]" style={{
                    boxShadow: 'inset 0 1px 0 rgba(90,154,111,0.4)'
                  }}></div>
                  <div className="absolute inset-[2px] bg-[#4a8a5f]" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(90,154,111,0.15) 1px, transparent 0)',
                    backgroundSize: '3px 3px'
                  }}></div>
                  <span className="relative text-[#d0e8d5]">
                    {(activeTab === 'scrap' && item.stock === 0) ? 'OUT' : (
                      <>
                        {activeTab === 'crystals' ? (
                          `$${item.price.toFixed(2)}`
                        ) : item.currency === 'crystals' ? (
                          <>
                            <img 
                              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695af5ca435140b76c0dadc9/26d2c74b8_crystal.png" 
                              alt="Crystal" 
                              className="w-4 h-4 inline-block"
                            />
                            {item.price}
                          </>
                        ) : (
                          `$${item.price}`
                        )}
                      </>
                    )}
                  </span>
                </button>
              </div>
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

        {purchaseDialog && activeTab !== 'ships' && activeTab !== 'crystals' && (
          <PurchaseConfirmDialog
            item={purchaseDialog}
            onConfirm={handleConfirmPurchase}
            onCancel={() => setPurchaseDialog(null)}
          />
        )}
        
        {purchaseDialog && activeTab === 'crystals' && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setPurchaseDialog(null)}>
            <div className="relative bg-[#1a2a1f] border-4 border-[#3a5a4f] p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="text-center mb-4">
                <div className="text-2xl mb-2">💎</div>
                <h3 className="text-cyan-400 font-bold text-lg mb-2">{purchaseDialog.name}</h3>
                <p className="text-gray-400 text-sm mb-4">
                  You'll be redirected to Stripe to complete your purchase.
                </p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setPurchaseDialog(null)}
                  className="flex-1 relative py-2 font-bold text-sm"
                >
                  <div className="absolute inset-0 bg-[#3a3a3f] border-2 border-[#5a5a5f]" style={{
                    boxShadow: 'inset 0 1px 0 rgba(90,90,95,0.4)'
                  }}></div>
                  <div className="absolute inset-[2px] bg-[#4a4a4f]" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(90,90,95,0.15) 1px, transparent 0)',
                    backgroundSize: '3px 3px'
                  }}></div>
                  <span className="relative text-[#a0a0a5]">CANCEL</span>
                </button>
                <button
                  onClick={() => handleConfirmPurchase(1)}
                  disabled={processingPayment}
                  className="flex-1 relative py-2 font-bold text-sm disabled:opacity-50"
                >
                  <div className="absolute inset-0 bg-[#3a7a4f] border-2 border-[#5a9a6f]" style={{
                    boxShadow: 'inset 0 1px 0 rgba(90,154,111,0.4)'
                  }}></div>
                  <div className="absolute inset-[2px] bg-[#4a8a5f]" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(90,154,111,0.15) 1px, transparent 0)',
                    backgroundSize: '3px 3px'
                  }}></div>
                  <span className="relative text-[#d0e8d5]">
                    {processingPayment ? 'PROCESSING...' : `BUY $${purchaseDialog.price.toFixed(2)}`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </DeviceFrame>
  );
}