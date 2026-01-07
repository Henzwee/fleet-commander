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
    <div className="fixed z-[4] bg-gradient-to-br from-gray-900 to-gray-950 flex flex-col" style={{
      top: 'calc(var(--content-pad-top) - 40px)',
      bottom: 'calc(var(--content-pad-bottom) - 30px)',
      left: 'var(--content-pad-left)',
      right: 'var(--content-pad-right)'
    }}>
      <div className="flex-1 flex flex-col px-6 py-4">
        <div className="mb-6 mt-12">
          <h3 className="text-cyan-400 font-bold text-base">CONFIRM PURCHASE</h3>
        </div>
        
        <div className="flex-1 flex flex-col justify-center">
          <div className="text-white text-base mb-1 font-bold">{item.name}</div>
          <div className="text-gray-400 text-xs mb-4">
            Stock Available: {item.stock}
          </div>
          
          <div className="flex items-center justify-center gap-4 mb-4">
            <button
              onClick={handleDecrease}
              disabled={quantity <= 1}
              className="w-10 h-10 bg-gray-800 border-2 border-gray-600 rounded hover:border-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Minus className="w-4 h-4 text-gray-400" />
            </button>
            
            <div className="text-white text-2xl font-bold w-16 text-center">
              {quantity}
            </div>
            
            <button
              onClick={handleIncrease}
              disabled={quantity >= maxQuantity}
              className="w-10 h-10 bg-gray-800 border-2 border-gray-600 rounded hover:border-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Plus className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          
          <div className="text-center mb-8">
            <div className="text-gray-400 text-xs mb-1">Total Cost</div>
            <div className={`text-2xl font-bold ${currency === 'crystals' ? 'text-purple-400' : 'text-amber-400'}`}>
              {currency === 'crystals' ? '◆' : '$'}{totalCost.toLocaleString()}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-8">
          <button
            onClick={onCancel}
            className="bg-gray-700 hover:bg-gray-600 border-2 border-gray-500 rounded-lg py-2.5 text-white font-bold text-sm"
          >
            CANCEL
          </button>
          <button
            onClick={() => onConfirm(quantity)}
            className="bg-cyan-600 hover:bg-cyan-700 border-2 border-cyan-500 rounded-lg py-2.5 text-white font-bold text-sm"
          >
            CONFIRM
          </button>
        </div>
      </div>
    </div>
  );
}