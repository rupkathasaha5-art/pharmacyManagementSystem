import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext.jsx';
import ProductCard from '../components/ProductCard.jsx';

const Cart = () => {
  // Pull core cart states out of App Context
  const { cart, removeFromCart, updateCartQuantity } = useContext(AppContext);

  // Math Procurement Pipeline: Calculate gross bulk totals for corporate invoices
  const subtotal = cart.reduce((acc, item) => acc + item.wholesalePrice * item.orderQuantity, 0);
  const regulatoryLogisticsFee = subtotal > 500 || subtotal === 0 ? 0 : 50.00; 
  const totalInvoiceAmount = subtotal + regulatoryLogisticsFee;

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-[#0f2d4a]">
        <div className="text-5xl mb-4">🛒</div>
        <h1 className="text-2xl font-bold tracking-tight">Your Procurement Cart is Empty</h1>
        <p className="text-slate-400 text-sm mt-1 max-w-md mx-auto">
          There are no uncompleted batch orders allocated to your current active session profile.
        </p>
        <a 
          href="/catalog" 
          className="mt-6 inline-block bg-[#00c4a7] hover:bg-[#00b096] text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-xl shadow-sm transition-all"
        >
          Return to Catalog
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 text-[#0f2d4a] font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Review Procurement Cart</h1>
        <p className="text-xs text-slate-400 mt-1">Verify your added items, select quantity modifications, and proceed to checkout.</p>
      </div>

      {/* Split Layout: Left Card List Stack vs Right Summary Block */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* LEFT COLUMN: Displays clean product details with total item amounts */}
        <div className="w-full lg:w-2/3 space-y-4">
          {cart.map((item) => {
            const itemSubtotal = item.wholesalePrice * item.orderQuantity;

            return (
              /* Crucial Tailored Class: target whatever wrapper contains your inner inventory specifications and force hide them */
              <div key={item._id} className="relative [&_.inventory-details]:hidden">
                
                <ProductCard product={item}>
                  
                  {/* INJECTED PANEL: Quantity controls, specific item sum, and removal triggers */}
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-6 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                    
                    {/* Real-time calculated price total for this specific product entry */}
                    <div className="text-left sm:text-right order-2 sm:order-1">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Product Amount</p>
                      <p className="text-xl font-black text-[#009688] font-mono">
                        ${itemSubtotal.toFixed(2)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 order-1 sm:order-2">
                      {/* Quantity Stepper Counter */}
                      <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden shadow-sm">
                        <button
                          onClick={() => updateCartQuantity(item._id, item.orderQuantity - 1)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 font-bold text-slate-500 transition-colors border-r"
                        >
                          -
                        </button>
                        <span className="px-4 py-1.5 font-mono font-bold text-sm bg-slate-50 text-[#0f2d4a]">
                          {item.orderQuantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item._id, item.orderQuantity + 1)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 font-bold text-slate-500 transition-colors border-l"
                        >
                          +
                        </button>
                      </div>

                      {/* Remove Line Option Button */}
                      <button
                        onClick={() => removeFromCart(item._id)}
                        className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors border border-slate-200 hover:border-red-200 px-3 py-2.5 rounded-lg bg-white uppercase tracking-wider shadow-sm"
                      >
                        Remove
                      </button>
                    </div>

                  </div>

                </ProductCard>
              </div>
            );
          })}
        </div>

        {/* RIGHT COLUMN: Summary Invoice Block */}
        <div className="w-full lg:w-1/3 bg-white p-6 rounded-xl border border-teal-100 shadow-sm sticky top-6">
          <h2 className="text-sm font-bold text-[#0f2d4a] uppercase tracking-wide mb-4">
            Order Summary
          </h2>
          
          <div className="space-y-3 text-sm font-medium border-b border-dashed border-slate-100 pb-4">
            <div className="flex justify-between text-slate-400">
              <span>Total Line Items:</span>
              <span className="text-[#0f2d4a] font-bold">{cart.length} items</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Wholesale Subtotal:</span>
              <span className="text-[#0f2d4a] font-mono">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400 items-center">
              <span>Logistics Fee:</span>
              <span className="text-[#0f2d4a] font-mono">
                {regulatoryLogisticsFee === 0 ? (
                  <span className="text-xs font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded uppercase">Free</span>
                ) : (
                  `$${regulatoryLogisticsFee.toFixed(2)}`
                )}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center py-4 mb-6">
            <span className="text-sm font-bold text-[#0f2d4a] uppercase tracking-wider">Total Due</span>
            <span className="text-2xl font-black text-[#0f2d4a] font-mono">
              ${totalInvoiceAmount.toFixed(2)}
            </span>
          </div>

          <button
            onClick={() => alert("Forwarding order data payload...")}
            className="w-full bg-[#009688] hover:bg-[#00796b] text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all uppercase tracking-wider text-xs"
          >
            Execute Procurement Order
          </button>
        </div>

      </div>
    </div>
  );
};

export default Cart
