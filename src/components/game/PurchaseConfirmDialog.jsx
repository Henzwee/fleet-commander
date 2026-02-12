import React, { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';

export default function PurchaseConfirmDialog({ item, onConfirm, onCancel }) {
  const [quantity, setQuantity] = useState(1);
  
  const maxQuantity = item.stock || 1;
  const totalCost = (item.price || 0) * quantity;
  const currency = item.currency || 'credits';
  
  const handleIncrease = () => {
    if (quantity < maxQuantity) {
      setQuantity(quantity + 1);
    }
  };
  
  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };
  
  return (
    <div className="fixed z-[4] bg-gradient-to-br from-[#0a1a14] to-[#050f0a] flex flex-col" style={{
      top: 'calc(var(--content-pad-top) - 40px)',
      bottom: 'calc(var(--content-pad-bottom) - 30px)',
      left: 'var(--content-pad-left)',
      right: 'var(--content-pad-right)'
    }}>
      <div className="flex-1 flex flex-col px-6 py-4">
        <div className="mb-6 mt-12">
          <h3 className="text-[#5a9a8f] font-bold text-base">CONFIRM PURCHASE</h3>
        </div>
        
        <div className="flex-1 flex flex-col justify-center">
          <div className="text-[#a8c5ad] text-base mb-1 font-bold">{item.name}</div>
          <div className="text-[#5a6a5f] text-xs mb-4">
            Stock Available: {item.stock}
          </div>
          
          <div className="flex items-center justify-center gap-4 mb-4">
            <button
              onClick={handleDecrease}
              disabled={quantity <= 1}
              className="relative w-10 h-10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-[#2a3a2f] border-2 border-[#3a5a4f]"></div>
              <div className="absolute inset-[2px] bg-[#1a2a1f]"></div>
              <Minus className="w-4 h-4 text-[#5a6a5f] relative" />
            </button>
            
            <div className="text-[#d0e8d5] text-2xl font-bold w-16 text-center">
              {quantity}
            </div>
            
            <button
              onClick={handleIncrease}
              disabled={quantity >= maxQuantity}
              className="relative w-10 h-10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-[#2a3a2f] border-2 border-[#3a5a4f]"></div>
              <div className="absolute inset-[2px] bg-[#1a2a1f]"></div>
              <Plus className="w-4 h-4 text-[#5a6a5f] relative" />
            </button>
          </div>
          
          <div className="text-center mb-8">
            <div className="text-[#5a6a5f] text-xs mb-1">Total Cost</div>
            <div className={`text-2xl font-bold ${currency === 'crystals' ? 'text-[#b89acf]' : 'text-amber-400'}`}>
              {currency === 'crystals' ? '◆' : '$'}{totalCost.toLocaleString()}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-8">
          <button
            onClick={onCancel}
            className="relative py-2.5 font-bold text-sm"
          >
            <div className="absolute inset-0 bg-[#3a3a3f] border-2 border-[#5a5a5f]" style={{
              boxShadow: 'inset 0 1px 0 rgba(90,90,95,0.4)'
            }}></div>
            <div className="absolute inset-[2px] bg-[#4a4a4f]" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(90,90,95,0.15) 1px, transparent 0)',
              backgroundSize: '3px 3px'
            }}></div>
            <span className="relative text-[#d0d0d5]">CANCEL</span>
          </button>
          <button
            onClick={() => onConfirm(quantity)}
            className="relative py-2.5 font-bold text-sm"
          >
            <div className="absolute inset-0 bg-[#3a7a4f] border-2 border-[#5a9a6f]" style={{
              boxShadow: 'inset 0 1px 0 rgba(90,154,111,0.4)'
            }}></div>
            <div className="absolute inset-[2px] bg-[#4a8a5f]" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(90,154,111,0.15) 1px, transparent 0)',
              backgroundSize: '3px 3px'
            }}></div>
            <span className="relative text-[#d0e8d5]">CONFIRM</span>
          </button>
        </div>
      </div>
    </div>
  );
}