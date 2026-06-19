// components/ProductCard.jsx
import React from 'react';

const ProductCard = ({ product, children }) => {
  // Short-dated calculations (< 60 Day parameter validation indicator threshold)
  const isShortDated = new Date(product.expiryDate) < new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

  // Safely handle both data keys (backend aggregation availableStock vs mock data totalAvailableATP)
  const stockCount = product.availableStock !== undefined ? product.availableStock : product.totalAvailableATP;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-teal-500/40 transition-all hover:shadow-md relative">
      {/* Expiry Alert Line */}
      <div className={`h-1.5 w-full ${isShortDated ? 'bg-amber-400' : 'bg-[#00c4a7]'}`}></div>
      
      <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
        <div>
          <div className="flex justify-between items-start gap-2">
            <h2 className="text-base font-bold text-[#0f2d4a] tracking-tight leading-tight">{product.name}</h2>
            <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-100 px-2 py-0.5 rounded text-slate-500 shrink-0 border">{product.form}</span>
          </div>
          <p className="text-xs text-[#009688] font-semibold mt-1">{product.manufacturer}</p>
        </div>

        {/* Technical Inventory Details */}
        <div className="inventory-details bg-[#f4fbf9]/60 p-3 rounded-lg text-xs space-y-1.5 border border-teal-500/5 font-medium">
          <div className="flex justify-between">
            <span className="text-slate-400">Warehouse Batch:</span>
            <span className="font-mono font-bold text-slate-700">{product.batchNumber}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Expiration Milestone:</span>
            <span className={`font-semibold px-1.5 py-0.5 rounded text-[11px] ${isShortDated ? 'bg-amber-50 text-amber-700 font-bold' : 'text-slate-700'}`}>
              {product.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : ''}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Available ATP Stock:</span>
            <span className="font-semibold text-slate-700">{(stockCount || 0).toLocaleString()} boxes</span>
          </div>
        </div>

        {/* Action Panel Container */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold">Wholesale Price</span>
            <span className="text-lg font-black text-[#0f2d4a]">
              ${(product.wholesalePrice || 0).toFixed(2)}
              <span className="text-xs font-normal text-slate-400">/box</span>
            </span>
          </div>
          
          {/* Injected Content Slot from Parent View (Buttons go here) */}
          {children}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;