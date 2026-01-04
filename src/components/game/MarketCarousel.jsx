import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function MarketCarousel({ items = [], onItemClick }) {
  const scrollRef = React.useRef(null);
  
  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 150;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };
  
  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-950 border-2 border-cyan-500/50 rounded-lg p-3 mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-cyan-400 font-bold tracking-wider text-sm">MARKET</div>
        <div className="flex gap-1">
          <button
            onClick={() => scroll('left')}
            className="w-6 h-6 bg-cyan-500/20 border border-cyan-500 rounded flex items-center justify-center text-cyan-400 hover:bg-cyan-500/30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-6 h-6 bg-cyan-500/20 border border-cyan-500 rounded flex items-center justify-center text-cyan-400 hover:bg-cyan-500/30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item, idx) => (
          <div
            key={idx}
            onClick={() => onItemClick(item)}
            className="flex-shrink-0 w-32 bg-gradient-to-b from-gray-800 to-gray-900 border border-cyan-500/30 rounded-lg p-3 cursor-pointer hover:border-cyan-500 hover:bg-cyan-500/10 transition-all"
          >
            <div className="w-16 h-16 mx-auto bg-gray-700 rounded-lg mb-2 flex items-center justify-center">
              <div className="text-2xl">{item.icon || '📦'}</div>
            </div>
            <div className="text-center text-xs text-cyan-100 font-bold mb-1 truncate">{item.name}</div>
            <div className="text-center text-amber-400 font-bold text-sm flex items-center justify-center gap-1">
              <span>$</span>
              <span>{item.price}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}