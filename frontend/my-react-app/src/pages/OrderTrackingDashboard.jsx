import React, { useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { AppContext } from '../context/AppContext.jsx';

// Order lifecycle, in sequence — matches the Order model's status enum.
// This is a real pipeline (each order genuinely moves left to right), so a
// step-strip is earned here rather than decorative.
const STATUS_PIPELINE = [
  { key: 'placed', label: 'Placed', color: '#009688' },
  { key: 'out_for_delivery', label: 'Out for Delivery', color: '#2563eb' },
  { key: 'delivered', label: 'Delivered', color: '#16a34a' },
];

const STATUS_META = {
  pending_payment: { label: 'Pending Payment', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: '#d97706' },
  placed: { label: 'Placed', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', dot: '#009688' },
  out_for_delivery: { label: 'Out for Delivery', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: '#2563eb' },
  delivered: { label: 'Delivered', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: '#16a34a' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: '#dc2626' },
};

const StatusPill = ({ status }) => {
  const meta = STATUS_META[status] || STATUS_META.placed;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${meta.bg} ${meta.text} ${meta.border}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.dot }} />
      {meta.label}
    </span>
  );
};

const formatCurrency = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

// Modal for dispatch (assign driver) and cancel (reason) actions
const ActionModal = ({ mode, order, onClose, onConfirm, isSubmitting }) => {
  const [driverId, setDriverId] = useState('');
  const [reason, setReason] = useState('');

  if (!order) return null;

  const isDispatch = mode === 'dispatch';

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-[#0f2d4a] mb-1">
          {isDispatch ? 'Dispatch Order' : 'Cancel Order'}
        </h3>
        <p className="text-xs text-slate-400 font-mono mb-4">
          {order.invoiceNumber || order._id}
        </p>

        {isDispatch ? (
          <div className="mb-4">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Driver ID
            </label>
            <input
              type="text"
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              placeholder="Enter the assigned driver's user ID"
              className="w-full text-sm px-3 py-2.5 rounded-lg border border-slate-200 focus:border-[#009688] focus:outline-none focus:ring-2 focus:ring-[#009688]/20"
            />
          </div>
        ) : (
          <div className="mb-4">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Cancellation Reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Buyer requested cancellation, stock damaged in transit..."
              rows={3}
              className="w-full text-sm px-3 py-2.5 rounded-lg border border-slate-200 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 resize-none"
            />
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(isDispatch ? { driverId } : { reason })}
            disabled={isSubmitting || (isDispatch ? !driverId.trim() : !reason.trim())}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg text-white disabled:bg-slate-300 ${
              isDispatch ? 'bg-[#009688] hover:bg-[#00786a]' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isSubmitting ? 'Processing...' : isDispatch ? 'Confirm Dispatch' : 'Confirm Cancellation'}
          </button>
        </div>
      </div>
    </div>
  );
};

const OrderTrackingDashboard = () => {
  const { backendUrl } = useContext(AppContext);

  const [summary, setSummary] = useState({});
  const [orders, setOrders] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [modal, setModal] = useState({ mode: null, order: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/v1/orders/admin/status-summary`, { withCredentials: true });
      if (res.data?.success) {
        const counts = {};
        (res.data.data || []).forEach((s) => { counts[s._id] = s.count; });
        setSummary(counts);
      }
    } catch (err) {
      console.error('Failed to fetch status summary:', err);
    }
  }, [backendUrl]);

  const fetchOrders = useCallback(async (statusFilter) => {
    setIsLoading(true);
    setError('');
    try {
      const params = statusFilter && statusFilter !== 'all' ? { status: statusFilter } : {};
      const res = await axios.get(`${backendUrl}/api/v1/orders/admin`, { params, withCredentials: true });
      if (res.data?.success) {
        setOrders(res.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load orders.');
    } finally {
      setIsLoading(false);
    }
  }, [backendUrl]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchOrders(activeFilter);
  }, [activeFilter, fetchOrders]);

  const refreshAll = () => {
    fetchSummary();
    fetchOrders(activeFilter);
  };

  const handleAction = async (payload) => {
    const { mode, order } = modal;
    setIsSubmitting(true);
    try {
      if (mode === 'dispatch') {
        await axios.post(
          `${backendUrl}/api/v1/orders/${order._id}/dispatch`,
          { driverId: payload.driverId },
          { withCredentials: true }
        );
      } else if (mode === 'cancel') {
        await axios.post(
          `${backendUrl}/api/v1/orders/${order._id}/cancel`,
          { reason: payload.reason },
          { withCredentials: true }
        );
      }
      setModal({ mode: null, order: null });
      refreshAll();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${mode} order.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalOrders = Object.values(summary).reduce((a, b) => a + b, 0);

  const filterTabs = [
    { key: 'all', label: 'All Orders', count: totalOrders },
    { key: 'pending_payment', label: 'Pending Payment', count: summary.pending_payment || 0 },
    { key: 'placed', label: 'Placed', count: summary.placed || 0 },
    { key: 'out_for_delivery', label: 'Out for Delivery', count: summary.out_for_delivery || 0 },
    { key: 'delivered', label: 'Delivered', count: summary.delivered || 0 },
    { key: 'cancelled', label: 'Cancelled', count: summary.cancelled || 0 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 font-sans text-[#0f2d4a]">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold">Order Tracking</h1>
        <button
          onClick={refreshAll}
          className="text-xs font-bold uppercase tracking-wider text-[#009688] hover:text-[#00786a] flex items-center gap-1.5"
        >
          ↻ Refresh
        </button>
      </div>
      <p className="text-xs text-slate-400 mb-6">
        Monitor fulfillment across every order — dispatch, confirm delivery, or cancel as needed.
      </p>

      {/* Status pipeline strip — a real sequence, so numbering/progression is earned */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Fulfillment Pipeline</h3>
        <div className="flex items-center">
          {STATUS_PIPELINE.map((stage, idx) => (
            <React.Fragment key={stage.key}>
              <button
                onClick={() => setActiveFilter(stage.key)}
                className="flex flex-col items-center gap-2 min-w-[110px] group"
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm transition-transform group-hover:scale-105"
                  style={{ backgroundColor: stage.color }}
                >
                  {summary[stage.key] || 0}
                </div>
                <span className={`text-xs font-semibold ${activeFilter === stage.key ? 'text-[#0f2d4a]' : 'text-slate-400'}`}>
                  {stage.label}
                </span>
              </button>
              {idx < STATUS_PIPELINE.length - 1 && (
                <div className="flex-1 h-0.5 bg-slate-100 mx-2 mb-6" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`text-xs font-bold px-3.5 py-2 rounded-lg border transition-all ${
              activeFilter === tab.key
                ? 'bg-[#0f2d4a] text-white border-[#0f2d4a]'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
            }`}
          >
            {tab.label} <span className="opacity-70">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading orders...</div>
        ) : error ? (
          <div className="p-12 text-center text-red-500 text-sm">{error}</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No orders match this filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left font-bold text-[11px] uppercase tracking-wider text-slate-400 px-5 py-3">Invoice</th>
                  <th className="text-left font-bold text-[11px] uppercase tracking-wider text-slate-400 px-5 py-3">Buyer Org</th>
                  <th className="text-left font-bold text-[11px] uppercase tracking-wider text-slate-400 px-5 py-3">Total</th>
                  <th className="text-left font-bold text-[11px] uppercase tracking-wider text-slate-400 px-5 py-3">Payment</th>
                  <th className="text-left font-bold text-[11px] uppercase tracking-wider text-slate-400 px-5 py-3">Status</th>
                  <th className="text-left font-bold text-[11px] uppercase tracking-wider text-slate-400 px-5 py-3">Driver</th>
                  <th className="text-left font-bold text-[11px] uppercase tracking-wider text-slate-400 px-5 py-3">Created</th>
                  <th className="text-right font-bold text-[11px] uppercase tracking-wider text-slate-400 px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const canDispatch = order.status === 'placed';
                  const canCancel = !['delivered', 'cancelled'].includes(order.status);
                  const isExpanded = expandedOrderId === order._id;

                  return (
                    <React.Fragment key={order._id}>
                      <tr className="border-b border-slate-50 hover:bg-slate-50/40 transition-colors">
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => setExpandedOrderId(isExpanded ? null : order._id)}
                            className="font-mono text-xs font-semibold text-[#0f2d4a] hover:text-[#009688]"
                          >
                            {order.invoiceNumber || `#${order._id.slice(-8)}`}
                          </button>
                        </td>
                        <td className="px-5 py-3.5 text-xs">
                          {order.buyerOrg?.organization?.name || '—'}
                        </td>
                        <td className="px-5 py-3.5 text-xs font-semibold">
                          {formatCurrency(order.orderTotal)}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-500">
                          {order.paymentMethod === 'net_14' ? 'Net Terms' : 'Immediate'}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusPill status={order.status} />
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-500">
                          {order.assignedDriver?.name || '—'}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-400">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex justify-end gap-2">
                            {canDispatch && (
                              <button
                                onClick={() => setModal({ mode: 'dispatch', order })}
                                className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg bg-[#009688] text-white hover:bg-[#00786a]"
                              >
                                Dispatch
                              </button>
                            )}
                            {canCancel && (
                              <button
                                onClick={() => setModal({ mode: 'cancel', order })}
                                className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                              >
                                Cancel
                              </button>
                            )}
                            {!canDispatch && !canCancel && (
                              <span className="text-[11px] text-slate-300">No actions</span>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-50/60 border-b border-slate-100">
                          <td colSpan={8} className="px-5 py-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                              <div>
                                <p className="text-slate-400 uppercase tracking-wider text-[10px] font-bold mb-1">Items</p>
                                <p className="font-semibold">{order.items?.length || 0} line item(s)</p>
                              </div>
                              <div>
                                <p className="text-slate-400 uppercase tracking-wider text-[10px] font-bold mb-1">Due Date</p>
                                <p className="font-semibold">{formatDate(order.dueDate)}</p>
                              </div>
                              <div>
                                <p className="text-slate-400 uppercase tracking-wider text-[10px] font-bold mb-1">Dispatched</p>
                                <p className="font-semibold">{formatDate(order.outForDeliveryAt)}</p>
                              </div>
                              <div>
                                <p className="text-slate-400 uppercase tracking-wider text-[10px] font-bold mb-1">Delivered</p>
                                <p className="font-semibold">{formatDate(order.deliveredAt)}</p>
                              </div>
                              {order.status === 'cancelled' && (
                                <div className="col-span-2 md:col-span-4">
                                  <p className="text-red-400 uppercase tracking-wider text-[10px] font-bold mb-1">Cancellation Reason</p>
                                  <p className="font-semibold text-red-600">{order.cancellationReason || '—'}</p>
                                </div>
                              )}
                            </div>
                            <div className="mt-3 border-t border-slate-200 pt-3 space-y-1.5">
                              {(order.items || []).map((item, idx) => (
                                <div key={idx} className="flex justify-between text-xs">
                                  <span className="text-slate-600">{item.productName} <span className="text-slate-400">({item.batchNumber})</span></span>
                                  <span className="font-semibold">{item.quantity} × {formatCurrency(item.rate)} = {formatCurrency(item.lineTotal)}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ActionModal
        mode={modal.mode}
        order={modal.order}
        onClose={() => setModal({ mode: null, order: null })}
        onConfirm={handleAction}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default OrderTrackingDashboard;