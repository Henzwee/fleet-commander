import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { MarketEngine } from './MarketEngine';

export default function MarketTicker() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [items, setItems] = useState([]);
  const [offset, setOffset] = useState(0);
  const animationRef = useRef(null);
  const itemWidthRef = useRef(160); // Fixed width for each item including gap
  const scrollSpeed = 1; // pixels per frame

  useEffect(() => {
    // Initialize MarketEngine with base items
    const baseItems = [
      { id: 'cracked_glass', name: 'Cracked Glass', basePrice: 150 },
      { id: 'evil_ai', name: 'Evil A.I.', basePrice: 200 },
      { id: 'rusty_screws', name: 'Rusty Screws', basePrice: 120 },
      { id: 'wire_splice', name: 'Wire Splice', basePrice: 180 },
      { id: 'antimatter', name: 'Antimatter', basePrice: 600 },
      { id: 'sci_fi_panel', name: 'Sci-Fi Panel', basePrice: 800 }
    ];

    MarketEngine.init(baseItems);
    
    // Subscribe to price updates
    const unsubscribe = MarketEngine.subscribe((updatedItems) => {
      setItems(updatedItems);
    });

    // Initial load
    setItems(MarketEngine.getAll());

    return () => {
      unsubscribe();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (items.length === 0) return;

    let lastTime = performance.now();
    const totalWidth = items.length * itemWidthRef.current;

    const animate = (currentTime) => {
      const deltaTime = currentTime - lastTime;
      
      // Update every ~16ms for smoother animation
      if (deltaTime >= 16) {
        setOffset(prev => {
          const newOffset = prev - scrollSpeed;
          
          // When scrolled past one full set, reprice and reset
          if (Math.abs(newOffset) >= totalWidth) {
            // Reprice all items
            items.forEach(item => MarketEngine.reprice(item.id));
            return 0;
          }
          
          return newOffset;
        });
        
        lastTime = currentTime;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [items, scrollSpeed]);

  if (items.length === 0) return null;

  // Triple items for seamless loop
  const displayItems = [...items, ...items, ...items];

  return (
    <div>
      <div className="text-cyan-400 font-bold text-lg mb-3 tracking-wider">Market</div>
      
      <div className="relative overflow-hidden h-12">
        <div 
          ref={containerRef} 
          className="flex gap-3 will-change-transform"
          style={{ 
            transform: `translateX(${offset}px)`,
            transition: 'none'
          }}
        >
          {displayItems.map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              onClick={() => navigate(createPageUrl('Market'))}
              className="flex-shrink-0 bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-600/40 rounded-lg px-4 py-2 cursor-pointer hover:border-cyan-500 hover:bg-cyan-500/10 transition-colors"
              style={{ width: '150px' }}
            >
              <div className="text-cyan-100 font-bold text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                {item.name}
                {item.deltaPercent !== 0 && (
                  <span 
                    className={`ml-2 ${
                      item.deltaPercent > 0 
                        ? 'text-red-400' 
                        : 'text-green-400'
                    }`}
                  >
                    {item.deltaPercent > 0 ? '+' : ''}
                    {item.deltaPercent}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}