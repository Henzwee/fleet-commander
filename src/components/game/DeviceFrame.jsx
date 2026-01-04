import React from 'react';
import { Battery, Wifi, Signal } from 'lucide-react';

export default function DeviceFrame({ children, title = "M.A.N.I." }) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-2">
      <div className="w-full max-w-md bg-gradient-to-b from-gray-800 via-gray-900 to-black rounded-3xl shadow-2xl border-4 border-gray-700 relative overflow-hidden">
        {/* Device Frame Details */}
        <div className="absolute top-2 left-2 w-16 h-16 bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-lg opacity-30" />
        <div className="absolute bottom-2 right-2 w-20 h-20 bg-gradient-to-tl from-gray-700 to-gray-800 rounded-lg opacity-40" />
        
        {/* Top Status Bar */}
        <div className="relative z-10 bg-gradient-to-r from-gray-800 to-gray-900 border-b-2 border-cyan-500 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
            <div className="w-3 h-3 bg-green-400 rounded-full" />
          </div>
          
          <div className="flex-1 text-center">
            <h1 className="font-bold text-cyan-400 text-lg tracking-widest glow-cyan" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              {title}
            </h1>
          </div>
          
          <div className="flex items-center gap-2 text-cyan-400">
            <Battery className="w-4 h-4" />
            <span className="text-xs font-bold">79%</span>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="relative z-10 scanline" style={{ minHeight: 'calc(100vh - 120px)', maxHeight: 'calc(100vh - 120px)' }}>
          {children}
        </div>
        
        {/* Bottom Device Details */}
        <div className="relative z-10 bg-gradient-to-r from-gray-900 to-gray-800 border-t-2 border-gray-700 p-2 flex items-center justify-between">
          <div className="text-xs text-gray-500 font-mono">FC-19B-X</div>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-red-500 rounded-full" />
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <Signal className="w-3 h-3" />
            <Wifi className="w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
}