import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { MarketEngine } from './MarketEngine';
import { useGame } from './GameProvider';

export default function MarketTicker() {
  const navigate = useNavigate();
  const { gameState } = useGame();
  const containerRef = useRef(null);
  const [items, setItems] = useState([]);
  const [offset, setOffset] = useState(0);
  const animationRef = useRef(null);
  const scrollSpeed = 1; // pixels per frame

  useEffect(() => {
    // Initialize MarketEngine with correct full names
    const baseItems = [
      { id: 'cracked_glass', name: 'Cracked glass', basePrice: 150 },
      { id: 'evil_ai', name: 'Reformed evil AI', basePrice: 100 },
      { id: 'rusty_screws', name: 'Rusty screws', basePrice: 300 },
      { id: 'wire_splice', name: 'Wire splice', basePrice: 200 },
      { id: 'antimatter', name: 'Mostly stable antimatter', basePrice: 600 },
      { id: 'sci_fi_panel', name: 'Sci-fi looking panel', basePrice: 800 },
      { id: 'tangled_wire', name: 'Box of tangled wire', basePrice: 60 },
      { id: 'stripped_bolts', name: 'Stripped bolts', basePrice: 400 },
      { id: 'outdated_map', name: 'Outdated map', basePrice: 500 },
      { id: 'expired_food', name: 'Expired food rations', basePrice: 700 }
    ];

    MarketEngine.init(baseItems);
    
    // Subscribe to price updates
    const unsubscribe = MarketEngine.subscribe((updatedItems) => {
      // Filter to only in-stock items
      if (!gameState?.marketStock) {
        setItems(updatedItems);
        return;
      }
      
      const inStockItems = updatedItems.filter(item => {
        const stock = gameState.marketStock[item.id];
        return stock !== undefined && stock > 0;
      });
      
      setItems(inStockItems);
    });

    // Initial load with filter
    const allItems = MarketEngine.getAll();
    if (!gameState?.marketStock) {
      setItems(allItems);
    } else {
      const inStockItems = allItems.filter(item => {
        const stock = gameState.marketStock[item.id];
        return stock !== undefined && stock > 0;
      });
      setItems(inStockItems);
    }

    return () => {
      unsubscribe();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState?.marketStock]);

  useEffect(() => {
    if (items.length === 0) return;

    let lastTime = performance.now();
    
    // Calculate total width dynamically based on rendered items
    const calculateTotalWidth = () => {
      if (containerRef.current) {
        const firstSet = containerRef.current.children;
        if (firstSet.length >= items.length) {
          let width = 0;
          for (let i = 0; i < items.length; i++) {
            width += firstSet[i].offsetWidth + 12; // 12px gap
          }
          return width;
        }
      }
      return items.length * 200; // fallback estimate
    };
    
    const totalWidth = calculateTotalWidth();

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

  // If no items, show idle message
  if (items.length === 0) {
    return (
      <div className="w-full">
        <div className="relative w-full" style={{ height: '64px' }}>
          <div className="absolute inset-0 border-2" style={{
            backgroundColor: '#2a3a2f',
            borderColor: 'var(--theme-border)',
            boxShadow: 'inset 0 0 0 1px #1a2a1f, 0 2px 0 #1a2a1f'
          }}></div>
          <div className="absolute inset-[6px] border" style={{
            backgroundColor: '#1f2e24',
            borderColor: 'var(--theme-border-dark)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)'
          }}></div>
          <div className="absolute inset-[10px] bg-[#0f1a14]" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(90,122,95,0.1) 1px, transparent 0)',
            backgroundSize: '4px 4px',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.7)'
          }}>
            <div className="h-full flex items-center justify-center px-4">
              <div className="font-bold text-sm" style={{ color: 'var(--theme-border-dark)' }}>
                Market idle — awaiting inventory
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Triple items for seamless loop
  const displayItems = [...items, ...items, ...items];

  return (
    <div className="w-full">
      <div className="relative w-full" style={{ height: '64px' }}>
        <div className="absolute inset-0 border-2" style={{
          backgroundColor: '#2a3a2f',
          borderColor: 'var(--theme-border)',
          boxShadow: 'inset 0 0 0 1px #1a2a1f, 0 2px 0 #1a2a1f'
        }}></div>
        <div className="absolute inset-[6px] border" style={{
          backgroundColor: '#1f2e24',
          borderColor: 'var(--theme-border-dark)',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)'
        }}></div>
        <div className="absolute inset-[10px] bg-[#0f1a14] overflow-hidden" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(90,122,95,0.1) 1px, transparent 0)',
          backgroundSize: '4px 4px',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.7)'
        }}>
          <div 
            ref={containerRef} 
            className="flex gap-3 will-change-transform h-full items-center"
            style={{ 
              transform: `translateX(${offset}px)`,
              transition: 'none',
              paddingLeft: '12px'
            }}
          >
            {displayItems.map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                onClick={() => navigate(createPageUrl('Market'))}
                className="flex-shrink-0 cursor-pointer"
              >
                <div className="font-bold text-sm whitespace-nowrap" style={{ color: 'var(--theme-light)' }}>
                  {item.name}
                  {item.deltaPercent !== 0 && (
                    <span 
                      className="ml-2"
                      style={{
                        color: item.deltaPercent > 0 ? '#c84444' : 'var(--theme-primary)'
                      }}
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
    </div>
  );
}