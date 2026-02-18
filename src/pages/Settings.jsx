import React from 'react';
import DeviceFrame from '../components/game/DeviceFrame';
import ResourceHeader from '../components/game/ResourceHeader';
import { getTierConfig, TIER_ORDER } from '../components/game/ShipTierConfig';
import { SHIP_IMAGES } from '../components/game/ShipImages';

export default function Settings() {
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
                            ₵{config.payRange[0]} - ₵{config.payRange[1]}
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
                            ₵{config.priceRange[0]} - ₵{config.priceRange[1]}
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
    </DeviceFrame>
  );
}