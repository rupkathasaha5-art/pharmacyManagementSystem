import React from 'react'

const AddProduct = () => {
  return (
    <div>
      <form onSubmit={handleBulkProductSubmit} className="space-y-6 max-w-5xl">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 mb-6 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#00c4a7]"></span>
                  <h2 className="text-xl font-bold tracking-tight">Bulk Base Product Initialization</h2>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Define master chemical configurations. Create as many entries as needed before publishing.</p>
              </div>
              <button 
                type="button" 
                onClick={addProductRow}
                className="bg-teal-50 text-[#009688] border border-teal-200 hover:bg-teal-100 font-bold text-xs px-4 py-2 rounded-lg tracking-wider uppercase transition-all shadow-sm"
              >
                + Add Another Product Row
              </button>
            </div>

            {/* Matrix Form Repeater */}
            <div className="space-y-6 divide-y divide-dashed divide-slate-200">
              {productRows.map((row, index) => (
                <div key={index} className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-semibold text-slate-600 ${index > 0 ? 'pt-6' : ''}`}>
                  <div className="sm:col-span-1 lg:col-span-3 flex justify-between items-center bg-slate-50 p-2 rounded-lg border">
                    <span className="text-[11px] uppercase tracking-wider font-mono text-slate-400 font-bold">Item Instance #{index + 1}</span>
                    {productRows.length > 1 && (
                      <button type="button" onClick={() => removeProductRow(index)} className="text-red-500 hover:text-red-700 text-[10px] uppercase font-black">Remove Entry Row</button>
                    )}
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase tracking-wider mb-1">Medicine Nomenclature Title</label>
                    <input type="text" value={row.name} onChange={e => handleProductRowChange(index, 'name', e.target.value)} className="w-full border p-2.5 rounded-lg focus:outline-none focus:border-teal-500 bg-white font-medium text-sm text-[#0f2d4a]" placeholder="e.g., Amoxicillin Trihydrate" required />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase tracking-wider mb-1">Active Mass Strength</label>
                    <input type="text" value={row.strength} onChange={e => handleProductRowChange(index, 'strength', e.target.value)} className="w-full border p-2.5 rounded-lg focus:outline-none focus:border-teal-500 bg-white font-medium text-sm text-[#0f2d4a]" placeholder="e.g., 500mg" required />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase tracking-wider mb-1">Galenic Formulation Matrix Type</label>
                    <select value={row.form} onChange={e => handleProductRowChange(index, 'form', e.target.value)} className="w-full border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-teal-500 bg-white font-medium text-sm text-[#0f2d4a]">
                      <option>Tablet</option><option>Capsule</option><option>Vial</option><option>Syrup</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase tracking-wider mb-1">Stock Keeping Unit (SKU Code)</label>
                    <input type="text" value={row.sku} onChange={e => handleProductRowChange(index, 'sku', e.target.value)} className="w-full border p-2.5 rounded-lg focus:outline-none focus:border-teal-500 bg-white font-mono text-xs font-bold text-[#0f2d4a]" placeholder="e.g., SKU-AMX-250-CAP" required />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase tracking-wider mb-1">Wholesale Pricing Basis ($ / Case Lot)</label>
                    <input type="number" min="0" step="0.01" value={row.wholesalePrice} onChange={e => handleProductRowChange(index, 'wholesalePrice', e.target.value)} className="w-full border p-2.5 rounded-lg focus:outline-none focus:border-teal-500 bg-white font-medium text-sm text-[#0f2d4a]" placeholder="0.00" required />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase tracking-wider mb-1">Manufacturing Organization Label</label>
                    <input type="text" value={row.manufacturer} onChange={e => handleProductRowChange(index, 'manufacturer', e.target.value)} className="w-full border p-2.5 rounded-lg focus:outline-none focus:border-teal-500 bg-white font-medium text-sm text-[#0f2d4a]" placeholder="e.g., Cipla Corporate" required />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 text-[10px] uppercase tracking-wider mb-1">Regulatory Risk Schedule Classification Tiering</label>
                    <select value={row.scheduleClass} onChange={e => handleProductRowChange(index, 'scheduleClass', e.target.value)} className="w-full border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-teal-500 bg-white font-medium text-sm text-[#0f2d4a]">
                      <option>Rx-Only</option><option>Schedule-II</option><option>Schedule-IV</option><option>Over-The-Counter</option>
                    </select>
                  </div>
                  <div className="sm:col-span-1 flex items-center gap-2 py-2 pt-6">
                    <input type="checkbox" id={`coldChain-${index}`} checked={row.requiresColdChain} onChange={e => handleProductRowChange(index, 'requiresColdChain', e.target.checked)} className="h-4 w-4 accent-[#00c4a7] cursor-pointer" />
                    <label htmlFor={`coldChain-${index}`} className="text-[11px] text-slate-500 select-none font-bold cursor-pointer leading-tight">Demands Cold Chain (2°C–8°C)</label>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-slate-100 mt-6 flex justify-end">
              <button type="submit" className="bg-[#00c4a7] text-white hover:bg-[#00b096] font-bold py-3 px-8 rounded-xl transition-all uppercase tracking-wider text-xs shadow-md">
                Commit & Publish Master Products ({productRows.length})
              </button>
            </div>
          </div>
        </form>
    </div>
  )
}

export default AddProduct
