import React from 'react';
import DeviceFrame from '../components/game/DeviceFrame';
import ResourceHeader from '../components/game/ResourceHeader';

export default function Settings() {
  return (
    <DeviceFrame>
      <ResourceHeader />
      <div className="p-4 h-full flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-cyan-400 glow-cyan mb-4">SETTINGS</h1>
          <p className="text-gray-400">Configuration options coming soon...</p>
        </div>
      </div>
    </DeviceFrame>
  );
}