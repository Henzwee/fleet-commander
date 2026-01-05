import React from 'react';

export default function DeviceFrame({ children, title = "M.A.N.I." }) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-0 overflow-hidden">
      <div className="relative w-full max-w-md" style={{ aspectRatio: '640/1138' }}>
        {/* Device Frame Background Image */}
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695af5ca435140b76c0dadc9/22a189f1f_framebeta.png"
          alt="Device Frame"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
          draggable="false"
        />
        
        {/* Title Overlay - positioned over the frame's title area */}
        <div className="absolute top-[2.8%] left-[35%] right-[35%] z-20 text-center">
          <h1 
            className="font-bold text-white text-sm tracking-[0.3em] uppercase"
            style={{ 
              fontFamily: 'Orbitron, sans-serif',
              textShadow: '0 0 10px rgba(0, 212, 255, 0.8), 0 2px 4px rgba(0, 0, 0, 0.8)'
            }}
          >
            {title}
          </h1>
        </div>
        
        {/* Main Content Area - positioned in the white screen area */}
        <div 
          className="absolute bg-gradient-to-br from-[#0a1628] to-[#050a14] scanline overflow-hidden"
          style={{
            top: '9.5%',
            left: '7.5%',
            right: '7.5%',
            bottom: '16.5%',
            borderRadius: '8px'
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}