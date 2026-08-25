import React, { useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { AppContext } from '../context/AppContext.jsx';

const formatCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');

const STATUS_META = {
  pending_payment: { label: 'Pending Payment', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  placed: { label: 'Placed', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  out_for_delivery: { label: 'Out for Delivery', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  delivered: { label: 'Delivered', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  delivery_failed: { label: 'Delivery Issue', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  cancelled: { label: 'Cancelled', bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200' },
};

const StatusPill = ({ status }) => {
  const meta = STATUS_META[status] || STATUS_META.placed;
  return (
    <span className={`inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full border ${meta.bg} ${meta.text} ${meta.border}`}>
      {meta.label}
    </span>
  );
};

const MyOrders = () => {
  const { backendUrl } = useContext(AppContext);

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await axios.get(`${backendUrl}/api/v1/org-admin/my-orders`, { withCredentials: true });
      if (res.data?.success) setOrders(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your orders.');
    } finally {
      setIsLoading(false);
    }
  }, [backendUrl]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  return (
    <div className="max-w-5xl mx-auto font-sans text-[#0f2d4a]">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold">Order Tracking & OTPs</h1>
        <button onClick={fetchOrders} className="text-xs font-bold uppercase tracking-wider text-[#009688] hover:text-[#00786a]">
          ↻ Refresh
        </button>
      </div>
      <p className="text-xs text-slate-400 mb-6">
        Your order history. When an order is out for delivery, share its delivery code with the driver at drop-off.
      </p>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading your orders...</div>
        ) : error ? (
          <div className="p-12 text-center text-red-500 text-sm">{error}</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">You haven't placed any orders yet.</div>
        ) : (
          <div>
            {orders.map((order) => {
              const isExpanded = expandedId === order._id;
              return (
                <div key={order._id} className="border-b border-slate-50 last:border-b-0">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : order._id)}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50/40 transition-colors text-left"
                  >
                    <div>
                      <p className="font-mono text-xs font-semibold text-[#0f2d4a]">
                        {order.invoiceNumber || `#${order._id.slice(-8)}`}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold">{formatCurrency(order.orderTotal)}</span>
                      <StatusPill status={order.status} />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-5 bg-slate-50/50">
                      {order.status === 'out_for_delivery' && order.deliveryOtp && (
                        <div className="my-3 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-1">
                            🔑 Delivery Confirmation Code
                          </p>
                          <p className="text-2xl font-mono font-bold text-amber-800 tracking-widest">
                            {order.deliveryOtp}
                          </p>
                          <p className="text-[11px] text-amber-600 mt-1">
                            Share this only with the delivery driver, at the moment your order arrives.
                          </p>
                        </div>
                      )}

                      {order.status === 'delivery_failed' && order.deliveryException && (
                        <div className="my-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                          <strong>Delivery issue:</strong> {order.deliveryException}
                        </div>
                      )}

                      <div className="pt-2 space-y-1.5">
                        {(order.items || []).map((item, idx) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <span className="text-slate-600">
                              {item.productName} <span className="text-slate-400">({item.batchNumber})</span>
                            </span>
                            <span className="font-semibold">
                              {item.quantity} × {formatCurrency(item.rate)} = {formatCurrency(item.lineTotal)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {order.invoiceNumber && (
                        <a
                          href={`${backendUrl}/api/v1/orders/${order._id}/invoice`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-4 text-xs font-bold uppercase tracking-wider text-[#009688] hover:text-[#00786a]"
                        >
                          📄 Download Invoice PDF
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;