import React from 'react';
import DeviceFrame from '../components/game/DeviceFrame';
import ResourceHeader from '../components/game/ResourceHeader';

export default function Settings() {
  return (
    <DeviceFrame>
      <div className="flex flex-col min-h-full pb-6" style={{ maxWidth: '100%', paddingLeft: 'var(--safe-x)', paddingRight: 'var(--safe-x)', boxSizing: 'border-box' }}>
        <ResourceHeader />
        <div className="p-4 h-full flex items-center justify-center" style={{ paddingLeft: '0', paddingRight: '0', paddingTop: '70px' }}>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-cyan-400 glow-cyan mb-4">SETTINGS</h1>
            <p className="text-gray-400">Configuration options coming soon...</p>
          </div>
        </div>
      </div>
    </DeviceFrame>
  );
}