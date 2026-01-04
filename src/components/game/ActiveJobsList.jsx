import React from 'react';
import { Clock, MapPin, Zap } from 'lucide-react';

export default function ActiveJobsList({ missions = [], onMissionClick }) {
  if (missions.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-900 to-gray-950 border-2 border-cyan-500/50 rounded-lg p-4 text-center">
        <div className="text-gray-500 text-sm">No active missions</div>
      </div>
    );
  }
  
  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-950 border-2 border-cyan-500/50 rounded-lg p-3">
      <div className="text-cyan-400 font-bold tracking-wider text-sm mb-3 pb-2 border-b border-cyan-500/30">
        ACTIVE JOBS
      </div>
      
      <div className="space-y-2">
        {missions.map((mission) => (
          <div
            key={mission.id}
            onClick={() => onMissionClick(mission)}
            className="bg-gradient-to-r from-gray-800 to-gray-900 border border-cyan-500/30 rounded-lg p-3 cursor-pointer hover:border-cyan-500 hover:bg-cyan-500/10 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-cyan-100 font-bold text-sm">{mission.shipName}</div>
              <div className="text-amber-400 font-bold text-xs flex items-center gap-1">
                <Zap className="w-3 h-3" />
                <span>${mission.reward}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{mission.distance} ly</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{mission.timeRemaining}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}