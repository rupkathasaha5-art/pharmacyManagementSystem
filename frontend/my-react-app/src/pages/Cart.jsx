import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext.jsx';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { FiTrash2, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

const Cart = () => {
  const navigate = useNavigate();

  const {
    cart,
    removeFromCart,
    updateCartQuantity,
    isLoggedIn,
    isCartLoaded,
    cartLoading,
    cartError,
    refreshCart
  } = useContext(AppContext);

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  const subtotal = (cart || []).reduce((acc, item) => acc + ((item.salesRate || 0) * (item.orderQuantity || 0)), 0);
  const totalItems = (cart || []).reduce((acc, item) => acc + (item.orderQuantity || 0), 0);
  const hasErrors = (cart || []).some(item => item.hasIssue);

  // Initial load: cart hasn't come back from the backend yet
  if (!isCartLoaded && cartLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 space-y-5 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-slate-200 h-32 rounded-xl"></div>
        ))}
      </div>
    );
  }

  // Fetch failed on initial load
  if (!isCartLoaded && cartError) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <div className="bg-white p-10 rounded-2xl border border-red-200 shadow-sm max-w-xl mx-auto w-full">
          <FiAlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Couldn't load your cart</h2>
          <p className="text-slate-500 mb-6">{cartError}</p>
          <button
            onClick={refreshCart}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-8 rounded-lg transition-colors inline-flex items-center gap-2"
          >
            <FiRefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!cart || cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <div className="bg-white p-10 sm:p-16 rounded-2xl border border-slate-200 shadow-sm max-w-xl mx-auto w-full">
          <span className="text-7xl block mb-6">🛒</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3">Your Trade Cart is Empty</h2>
          <p className="text-slate-500 mb-8 text-base">You haven't added any pharmaceutical batches to your order yet.</p>
          <Link to="/catalog" className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 px-10 rounded-lg transition-colors inline-block text-lg shadow-sm">
            Browse Live Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-teal-900 tracking-tight">Trade Order Summary</h1>
        <span className="bg-teal-100 text-teal-800 font-bold px-4 py-1.5 rounded-full text-sm">
          {totalItems} Items
        </span>
      </div>

      {cartError && (
        <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-lg border-l-4 border-red-500 text-sm flex items-center justify-between gap-4">
          <span>{cartError}</span>
          <button onClick={refreshCart} className="font-bold underline whitespace-nowrap">Retry</button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8 items-start">

        {/* LEFT COLUMN: Cart Items List */}
        <div className="lg:w-2/3 w-full space-y-5">
          {cart.map((item) => (
            <div
              key={item._id}
              className={`bg-white border rounded-xl overflow-hidden transition-all shadow-sm
                ${item.hasIssue ? 'border-red-400 ring-1 ring-red-100' : 'border-slate-200 hover:border-teal-200'}`}
            >
              <div className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">

                {/* Product Info */}
                <div className="flex-grow">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-slate-800">{item.product}</h3>
                    <span className="bg-slate-100 border border-slate-200 text-slate-600 text-[11px] px-2.5 py-1 rounded font-bold uppercase tracking-wider">
                      {item.batchNumber}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mb-2">
                    {item.packSize} • <span className="truncate">{item.manufacturer}</span>
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <p className="text-sm font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded">
                      PTR: ₹{item.salesRate?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-slate-400 line-through">
                      MRP: ₹{item.mrp?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* Quantity & Actions */}
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4">

                  {/* Quantity Stepper */}
                  <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden h-11 w-32 bg-white shadow-sm">
                    <button
                      onClick={() => updateCartQuantity(item._id, item.orderQuantity - 1)}
                      disabled={item.orderQuantity <= 1}
                      className="px-3.5 bg-slate-50 hover:bg-slate-100 disabled:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed text-slate-600 font-bold h-full border-r border-slate-300 transition-colors"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={item.orderQuantity}
                      readOnly
                      className="w-full text-center text-sm font-bold text-slate-800 outline-none p-1 bg-white"
                    />
                    <button
                      onClick={() => updateCartQuantity(item._id, item.orderQuantity + 1)}
                      disabled={item.orderQuantity >= item.totalStock}
                      className="px-3.5 bg-slate-50 hover:bg-slate-100 disabled:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed text-slate-600 font-bold h-full border-l border-slate-300 transition-colors"
                    >
                      +
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromCart(item._id)}
                    className="flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:text-red-700 transition-colors"
                  >
                    <FiTrash2 className="w-4 h-4" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>

              {/* LIVE INVENTORY WARNING BANNER */}
              {item.hasIssue && (
                <div className="bg-red-50 px-5 py-3.5 border-t border-red-200 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                  <div className="flex items-center gap-2 text-red-700">
                    <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">
                      {item.warning}
                    </p>
                  </div>

                  {item.totalStock > 0 && (
                    <button
                      onClick={() => updateCartQuantity(item._id, item.totalStock)}
                      className="text-xs bg-white border border-red-200 hover:bg-red-100 text-red-800 font-bold px-4 py-2 rounded-md transition-colors whitespace-nowrap shadow-sm"
                    >
                      Adjust to {item.totalStock} max
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* RIGHT COLUMN: Order Summary (Sticky) */}
        <div className="lg:w-1/3 w-full sticky top-6">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 mb-6 pb-4 border-b border-slate-100">Order Summary</h2>

            <div className="space-y-4 mb-8 text-base">
              <div className="flex justify-between text-slate-600">
                <span>Total Items</span>
                <span className="font-bold text-slate-800">{totalItems} Boxes</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Trade Rate)</span>
                <span className="font-bold text-slate-800">
                  ₹{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-500 text-sm">
                <span>Estimated GST</span>
                <span className="italic">Calculated at Checkout</span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-5 mb-8 border border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">Total Value</span>
                <span className="text-2xl sm:text-3xl font-bold text-teal-700">
                  ₹{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Checkout Action Button with Navigation */}
            <button
              onClick={() => navigate('/checkout')}
              disabled={hasErrors}
              className={`w-full font-bold py-4 rounded-xl transition-all text-lg shadow-sm flex items-center justify-center gap-2
                ${hasErrors
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-700 text-white hover:shadow-md'}`}
            >
              {hasErrors ? (
                <>
                  <FiAlertCircle className="w-5 h-5" />
                  <span>Fix errors to checkout</span>
                </>
              ) : (
                <span>Proceed to Checkout</span>
              )}
            </button>

            {hasErrors && (
              <p className="text-sm text-red-500 text-center mt-4 font-medium flex items-center justify-center gap-1">
                <FiAlertCircle className="w-4 h-4" />
                Please resolve highlighted issues.
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Cart;