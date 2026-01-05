import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { MarketEngine } from './MarketEngine';

export default function MarketTicker() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [items, setItems] = useState([]);
  const positionsRef = useRef([]);
  const animationRef = useRef(null);
  const scrollSpeed = 0.5; // pixels per frame

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

    // Initialize positions (duplicate items for seamless loop)
    const allItems = [...MarketEngine.getAll(), ...MarketEngine.getAll()];
    positionsRef.current = allItems.map((_, idx) => idx * 200); // 200px spacing

    return () => {
      unsubscribe();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (items.length === 0) return;

    const animate = () => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const itemWidth = 200; // approximate item width

      // Move all positions left
      positionsRef.current = positionsRef.current.map(pos => pos - scrollSpeed);

      // Check for items that scrolled off screen and recycle them
      positionsRef.current.forEach((pos, idx) => {
        if (pos < -itemWidth) {
          // Recycle: move to the right end
          const maxPos = Math.max(...positionsRef.current);
          positionsRef.current[idx] = maxPos + itemWidth;

          // Reprice the item (use modulo to map back to original item)
          const itemIdx = idx % items.length;
          const item = items[itemIdx];
          if (item) {
            MarketEngine.reprice(item.id);
          }
        }
      });

      // Re-render by forcing update (we'll use inline styles)
      if (containerRef.current) {
        const itemElements = containerRef.current.children;
        positionsRef.current.forEach((pos, idx) => {
          if (itemElements[idx]) {
            itemElements[idx].style.transform = `translateX(${pos}px)`;
          }
        });
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [items]);

  if (items.length === 0) return null;

  // Duplicate items for seamless loop
  const displayItems = [...items, ...items];

  return (
    <div>
      <div className="text-cyan-400 font-bold text-lg mb-3 tracking-wider">Market</div>
      
      <div className="relative overflow-hidden h-12">
        <div ref={containerRef} className="absolute top-0 left-0 flex gap-4">
          {displayItems.map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              onClick={() => navigate(createPageUrl('Market'))}
              className="absolute flex-shrink-0 bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-600/40 rounded-lg px-4 py-2 cursor-pointer hover:border-cyan-500 hover:bg-cyan-500/10 transition-all"
              style={{ transform: `translateX(${positionsRef.current[idx] || 0}px)` }}
            >
              <div className="text-cyan-100 font-bold text-sm whitespace-nowrap">
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