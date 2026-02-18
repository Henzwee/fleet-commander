import React, { useState } from 'react';
import DeviceFrame from '../components/game/DeviceFrame';
import ResourceHeader from '../components/game/ResourceHeader';
import { getTierConfig, TIER_ORDER } from '../components/game/ShipTierConfig';
import { SHIP_IMAGES } from '../components/game/ShipImages';
import { useGame } from '../components/game/GameProvider';
import { Palette } from 'lucide-react';

export default function Settings() {
  const { gameState, updateGameState, addMessage } = useGame();
  const [showThemeConfirm, setShowThemeConfirm] = useState(null);
  
  const themes = [
    { id: 'green', name: 'Green', color: '#5a9a8f', free: true },
    { id: 'orange', name: 'Orange', color: '#d89944', cost: 100 },
    { id: 'red', name: 'Red', color: '#c84444', cost: 100 },
    { id: 'purple', name: 'Purple', color: '#b89acf', cost: 100 },
    { id: 'blue', name: 'Blue', color: '#5a8acf', cost: 100 }
  ];
  
  const purchasedThemes = gameState?.purchasedThemes || ['green'];
  const activeTheme = gameState?.activeTheme || 'green';
  
  const handleThemeClick = async (theme) => {
    if (theme.free || purchasedThemes.includes(theme.id)) {
      // Apply theme
      await updateGameState({ activeTheme: theme.id });
      addMessage(`${theme.name} theme activated!`);
      applyTheme(theme.id);
    } else {
      // Show purchase confirmation
      setShowThemeConfirm(theme);
    }
  };
  
  const handlePurchaseTheme = async (theme) => {
    if (gameState.crystals < theme.cost) {
      addMessage('Not enough crystals!');
      setShowThemeConfirm(null);
      return;
    }
    
    const newPurchasedThemes = [...purchasedThemes, theme.id];
    await updateGameState({
      crystals: gameState.crystals - theme.cost,
      purchasedThemes: newPurchasedThemes,
      activeTheme: theme.id
    });
    
    addMessage(`${theme.name} theme purchased and activated!`);
    applyTheme(theme.id);
    setShowThemeConfirm(null);
  };
  
  const applyTheme = (themeId) => {
    const themeColors = {
      green: { primary: '#5a9a8f', light: '#a8c5ad', dark: '#3a5a4f' },
      orange: { primary: '#d89944', light: '#f0c890', dark: '#8a5a24' },
      red: { primary: '#c84444', light: '#e88888', dark: '#8a2424' },
      purple: { primary: '#b89acf', light: '#d8bae0', dark: '#7a5a8f' },
      blue: { primary: '#5a8acf', light: '#a0c0e8', dark: '#3a5a8f' }
    };
    
    const colors = themeColors[themeId];
    document.documentElement.style.setProperty('--theme-primary', colors.primary);
    document.documentElement.style.setProperty('--theme-light', colors.light);
    document.documentElement.style.setProperty('--theme-dark', colors.dark);
  };
  
  React.useEffect(() => {
    if (activeTheme) {
      applyTheme(activeTheme);
    }
  }, [activeTheme]);
  
  const tierColors = {
    'Unregistered': 'border-gray-500 text-gray-400',
    'Known': 'border-green-500 text-green-400',
    'Notorious': 'border-blue-500 text-blue-400',
    'Esteemed': 'border-purple-500 text-purple-400',
    'Renowned': 'border-amber-500 text-amber-400',
    'Legendary': 'border-red-500 text-red-400'
  };

  const encounterRates = {
    'Unregistered': '50%',
    'Known': '60%',
    'Notorious': '70%',
    'Esteemed': '80%',
    'Renowned': '90%',
    'Legendary': '99%'
  };

  const damageChance = {
    'Unregistered': '50%',
    'Known': '40%',
    'Notorious': '30%',
    'Esteemed': '20%',
    'Renowned': '10%',
    'Legendary': '1%'
  };

  return (
    <DeviceFrame>
      <div className="flex flex-col h-full overflow-hidden" style={{ maxWidth: '100%', paddingLeft: 'var(--safe-x)', paddingRight: 'var(--safe-x)', boxSizing: 'border-box' }}>
        <ResourceHeader />
        <div className="flex-1 overflow-y-auto" style={{ paddingLeft: '0', paddingRight: '0', paddingTop: '70px', paddingBottom: '24px' }}>
          {/* Themes Section */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#a8c5ad] mb-3 flex items-center gap-2">
              <Palette className="w-5 h-5" />
              THEMES
            </h2>
            
            <div className="grid grid-cols-2 gap-3">
              {themes.map((theme) => {
                const isPurchased = theme.free || purchasedThemes.includes(theme.id);
                const isActive = activeTheme === theme.id;
                
                return (
                  <button
                    key={theme.id}
                    onClick={() => handleThemeClick(theme)}
                    className="relative p-4 text-left"
                  >
                    <div className={`absolute inset-0 border-2 ${
                      isActive ? 'border-[#5a9a8f]' : 'border-[#3a4a3f]'
                    }`} style={{
                      boxShadow: 'inset 0 0 0 1px #1a2a1f'
                    }}></div>
                    <div className="absolute inset-[3px] bg-[#1a2a1f]" style={{
                      backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(58,90,79,0.1) 1px, transparent 0)',
                      backgroundSize: '3px 3px'
                    }}></div>
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-2">
                        <div 
                          className="w-6 h-6 rounded border-2 border-[#5a6a5f]"
                          style={{ backgroundColor: theme.color }}
                        ></div>
                        <span className="text-[#a8c5ad] font-bold text-sm">{theme.name}</span>
                      </div>
                      {isActive && (
                        <div className="text-[#5a9a8f] text-xs">ACTIVE</div>
                      )}
                      {!isPurchased && (
                        <div className="flex items-center gap-1 text-xs text-purple-400">
                          <img 
                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695af5ca435140b76c0dadc9/26d2c74b8_crystal.png" 
                            alt="Crystal" 
                            className="w-3 h-3"
                          />
                          <span>{theme.cost}</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-[#a8c5ad] mb-4">SHIP TIER STATS</h1>
          
          <div className="space-y-4">
            {TIER_ORDER.map((tier) => {
              const config = getTierConfig(tier);
              const shipImages = SHIP_IMAGES[tier] || [];
              
              return (
                <div 
                  key={tier}
                  className="relative"
                >
                  <div className={`absolute inset-0 border-2 ${tierColors[tier]}`} style={{
                    boxShadow: 'inset 0 0 0 1px #1a2a1f'
                  }}></div>
                  <div className="absolute inset-[3px] bg-[#1a2a1f]" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(58,90,79,0.15) 1px, transparent 0)',
                    backgroundSize: '3px 3px',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)'
                  }}></div>
                  <div className="relative p-4 flex gap-4">
                    {/* Ship Images */}
                    <div className="flex-shrink-0 w-28 flex flex-col gap-2 justify-start py-2">
                      {shipImages.map((img, idx) => {
                        const isUnregistered1 = img.includes('unregistered1.png');
                        return (
                          <img 
                            key={idx}
                            src={img} 
                            alt={`${tier} ${idx + 1}`} 
                            className={`w-full object-contain ${isUnregistered1 ? 'h-14' : 'h-24'}`}
                          />
                        );
                      })}
                    </div>
                    
                    {/* Stats */}
                    <div className="flex-1">
                      <div className={`font-bold text-lg mb-3 ${tierColors[tier]}`}>
                        {tier}
                      </div>
                      
                      <div className="space-y-2 text-xs">
                        <div>
                          <div className="text-[#5a6a5f]">Hourly Wage</div>
                          <div className="text-[#a8c5ad] font-bold">
                            ${config.payRange[0]} - ${config.payRange[1]}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-[#5a6a5f]">Max Range</div>
                          <div className="text-[#a8c5ad] font-bold">
                            {config.maxLY} LY
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-[#5a6a5f]">Encounter Success</div>
                          <div className="text-[#5a9a6f] font-bold">
                            {encounterRates[tier]}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-[#5a6a5f]">Damage Risk</div>
                          <div className="text-[#c84444] font-bold">
                            {damageChance[tier]}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-[#5a6a5f]">Market Price</div>
                          <div className="text-[#d89944] font-bold">
                            ${config.priceRange[0]} - ${config.priceRange[1]}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Theme Purchase Confirmation */}
      {showThemeConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-sm">
            <div className="absolute inset-0 bg-[#2a3a2f] border-2 border-[#5a7a5f]" style={{
              boxShadow: 'inset 0 0 0 1px #1a2a1f'
            }}></div>
            <div className="absolute inset-[4px] bg-[#1a2a1f]" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(90,122,95,0.1) 1px, transparent 0)',
              backgroundSize: '3px 3px'
            }}></div>
            <div className="relative p-6">
              <h3 className="text-[#a8c5ad] font-bold text-lg mb-4">Purchase {showThemeConfirm.name} Theme?</h3>
              
              <div className="flex items-center gap-2 mb-6 text-purple-400">
                <span>Cost:</span>
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695af5ca435140b76c0dadc9/26d2c74b8_crystal.png" 
                  alt="Crystal" 
                  className="w-4 h-4"
                />
                <span className="font-bold">{showThemeConfirm.cost}</span>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowThemeConfirm(null)}
                  className="relative flex-1 py-3 font-bold text-sm"
                >
                  <div className="absolute inset-0 bg-[#2a3a2f] border-2 border-[#3a4a3f]"></div>
                  <div className="absolute inset-[2px] bg-[#1a2a1f]"></div>
                  <span className="relative text-[#5a6a5f]">CANCEL</span>
                </button>
                <button
                  onClick={() => handlePurchaseTheme(showThemeConfirm)}
                  disabled={gameState?.crystals < showThemeConfirm.cost}
                  className="relative flex-1 py-3 font-bold text-sm disabled:opacity-50"
                >
                  <div className="absolute inset-0 bg-[#3a7a4f] border-2 border-[#5a9a6f]"></div>
                  <div className="absolute inset-[2px] bg-[#4a8a5f]"></div>
                  <span className="relative text-[#d0e8d5]">BUY</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DeviceFrame>
  );
}