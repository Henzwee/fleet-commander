import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { ShoppingCart, Briefcase, Ship } from 'lucide-react';

export default function BottomNav({ active }) {
  const tabs = [
    { id: 'market', label: 'Market', icon: ShoppingCart, page: 'Market' },
    { id: 'jobs', label: 'Jobs', icon: Briefcase, page: 'Jobs' },
    { id: 'ships', label: 'Ships', icon: Ship, page: 'FleetManagement' }
  ];
  
  return (
    <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-t-2 border-cyan-500/30 p-2 flex items-center justify-around">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = active === tab.id;
        
        return (
          <Link
            key={tab.id}
            to={createPageUrl(tab.page)}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
              isActive 
                ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-400' 
                : 'text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs font-bold tracking-wide">{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}