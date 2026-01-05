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
    <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-around gap-2">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = active === tab.id;
        
        return (
          <Link
            key={tab.id}
            to={createPageUrl(tab.page)}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded transition-all ${
              isActive 
                ? 'bg-amber-500/30 text-amber-400' 
                : 'text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/20'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="text-[0.6rem] font-bold tracking-wider uppercase">{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}