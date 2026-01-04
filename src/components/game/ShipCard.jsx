import React from 'react';
import { Heart, Zap, Package, MapPin } from 'lucide-react';

const tierColors = {
  'Unregistered': 'text-gray-400 border-gray-500',
  'Known': 'text-green-400 border-green-500',
  'Notorious': 'text-blue-400 border-blue-500',
  'Esteemed': 'text-purple-400 border-purple-500',
  'Renowned': 'text-amber-400 border-amber-500',
  'Legendary': 'text-red-400 border-red-500'
};

const tierDescriptions = {
  'Unregistered': 'Just kind of showed up.',
  'Known': 'At least they have a resume.',
  'Notorious': 'They even have their own website! Very nice.',
  'Esteemed': 'Are those… matching leather vests?',
  'Renowned': 'You\'re hired, as long as I can get your autograph.',
  'Legendary': 'Wait, you\'re real? Did you ACTUALLY stop an asteroid with your bare fists?'
};

export default function ShipCard({ ship, onClick, showPrice = false }) {
  const colorClass = tierColors[ship.tier] || tierColors.Unregistered;
  
  return (
    <div
      onClick={onClick}
      className={`bg-gradient-to-b from-gray-800 to-gray-900 border-2 ${colorClass} rounded-lg p-4 cursor-pointer hover:scale-105 transition-all`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-cyan-100 font-bold text-sm mb-1">{ship.name}</div>
          <div className={`text-xs font-bold ${colorClass}`}>{ship.tier}</div>
        </div>
        {ship.health !== undefined && (
          <div className="flex items-center gap-1">
            <Heart className={`w-4 h-4 ${ship.health < 100 ? 'text-red-400' : 'text-green-400'}`} />
            <span className="text-xs">{ship.health}%</span>
          </div>
        )}
      </div>
      
      <div className="text-xs text-gray-400 italic mb-3">
        "{tierDescriptions[ship.tier]}"
      </div>
      
      {showPrice && ship.price && (
        <div className="text-amber-400 font-bold text-lg flex items-center gap-1 justify-center">
          <span>$</span>
          <span>{ship.price.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}