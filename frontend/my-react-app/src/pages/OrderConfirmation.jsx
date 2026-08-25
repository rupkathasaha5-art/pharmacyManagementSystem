// src/pages/OrderConfirmation.jsx
import React, { useContext } from 'react';
import { useLocation, Navigate, Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext.jsx';

const formatCurrency = (n) => `₹${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'See Invoice');

const OrderConfirmation = () => {
  const { backendUrl } = useContext(AppContext);
  const location = useLocation();

  const orderComplete = location.state?.orderComplete;
  const paymentMethod = location.state?.paymentMethod;

  // Confirmation is a one-time view tied to the checkout flow — a refresh
  // or direct visit loses location.state, so we send the buyer to their
  // order list rather than show a broken page.
  if (!orderComplete) {
    return <Navigate to="/dashboard/my-orders" replace />;
  }

  return (
    <div className="max-w-xl mx-auto my-16 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center font-sans">
      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">
        ✓
      </div>
      <h2 className="text-2xl font-bold text-[#0f2d4a]">Order Confirmed</h2>
      <p className="text-xs text-slate-400 font-mono mt-1">Invoice No: {orderComplete.invoiceNumber}</p>

      {paymentMethod === 'net_14' ? (
        <div className="my-6 p-4 bg-teal-50 border border-teal-200 rounded-xl text-left text-xs text-[#0f2d4a] space-y-1">
          <p className="font-bold text-teal-800 uppercase tracking-wider">Net Trade Credit Applied</p>
          <p><strong>Total Due:</strong> {formatCurrency(orderComplete.total)}</p>
          <p><strong>Due Date:</strong> {formatDate(orderComplete.dueDate)}</p>
        </div>
      ) : (
        <p className="my-6 text-sm text-emerald-700 font-medium">Immediate payment verified. Dispatch tracking initialized.</p>
      )}

      {orderComplete.deliveryOtp && (
        <div className="my-4 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl text-left">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-1">🔑 Delivery Confirmation Code</p>
          <p className="text-2xl font-mono font-bold text-amber-800 tracking-widest">{orderComplete.deliveryOtp}</p>
          <p className="text-[11px] text-amber-600 mt-1">
            Share this only with the delivery driver, at the moment your order arrives.
          </p>
        </div>
      )}

      <div className="flex items-center justify-center gap-6 mt-4">
        
        <a href={`${backendUrl}/api/v1/orders/${orderComplete.orderId}/invoice`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-bold uppercase tracking-wider text-[#009688] hover:text-[#00786a]"
        >
          📄 Download Invoice PDF
        </a>
        <Link
          to="/dashboard/my-orders"
          className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600"
        >
          View All Orders →
        </Link>
      </div>
    </div>
  );
};

export default OrderConfirmation;