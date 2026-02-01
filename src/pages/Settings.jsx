import React from 'react';
import DeviceFrame from '../components/game/DeviceFrame';
import ResourceHeader from '../components/game/ResourceHeader';
import { getTierConfig, SHIP_TIERS } from '../components/game/ShipTierConfig';
import { getRandomShipImage } from '../components/game/ShipImages';

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
    'Legendary': '5%'
  };

  return (
    <DeviceFrame>
      <div className="flex flex-col min-h-full pb-6" style={{ maxWidth: '100%', paddingLeft: 'var(--safe-x)', paddingRight: 'var(--safe-x)', boxSizing: 'border-box' }}>
        <ResourceHeader />
        <div className="p-4 pb-24 overflow-y-auto h-full" style={{ paddingLeft: '0', paddingRight: '0', paddingTop: '70px' }}>
          <h1 className="text-2xl font-bold text-cyan-400 mb-4">SHIP TIER STATS</h1>
          
          <div className="space-y-4">
            {SHIP_TIERS.map((tier) => {
              const config = getTierConfig(tier);
              const shipImage = getRandomShipImage(tier);
              
              return (
                <div 
                  key={tier}
                  className={`bg-gradient-to-r from-gray-900 to-gray-800 border-2 ${tierColors[tier]} rounded-lg p-4`}
                >
                  <div className="flex gap-4">
                    {/* Ship Image */}
                    <div className="flex-shrink-0 w-20">
                      {shipImage && (
                        <img 
                          src={shipImage} 
                          alt={tier} 
                          className="w-full h-20 object-contain"
                        />
                      )}
                    </div>
                    
                    {/* Stats */}
                    <div className="flex-1">
                      <div className={`font-bold text-lg mb-2 ${tierColors[tier]}`}>
                        {tier}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="text-gray-500">Hourly Wage</div>
                          <div className="text-cyan-100 font-bold">
                            ${config.payRange[0]} - ${config.payRange[1]}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-gray-500">Max Range</div>
                          <div className="text-cyan-100 font-bold">
                            {config.maxLY} LY
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-gray-500">Encounter Success</div>
                          <div className="text-green-400 font-bold">
                            {encounterRates[tier]}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-gray-500">Damage Risk</div>
                          <div className="text-red-400 font-bold">
                            {damageChance[tier]}
                          </div>
                        </div>
                        
                        <div className="col-span-2">
                          <div className="text-gray-500">Market Price</div>
                          <div className="text-amber-400 font-bold">
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
    </DeviceFrame>
  );
}