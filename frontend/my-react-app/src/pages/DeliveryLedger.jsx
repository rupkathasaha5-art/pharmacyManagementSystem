import React, { useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { AppContext } from '../context/AppContext.jsx';

const formatCurrency = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const formatDateTime = (d) =>
  d
    ? new Date(d).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

const isToday = (d) => {
  if (!d) return false;
  const date = new Date(d);
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
};

const LedgerEntry = ({ order }) => {
  const isDelivered = order.status === 'delivered';
  const timestamp = isDelivered ? order.deliveredAt : order.deliveryExceptionAt;

  return (
    <div className="flex items-start justify-between p-4 border-b border-slate-50 last:border-b-0">
      <div className="flex items-start gap-3">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
            isDelivered ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
          }`}
        >
          {isDelivered ? '✓' : '!'}
        </div>
        <div>
          <p className="font-bold text-sm text-[#0f2d4a]">{order.buyerOrg?.organization?.name || 'Unknown Chemist'}</p>
          <p className="text-xs font-mono text-slate-400">{order.invoiceNumber || `#${order._id.slice(-8)}`}</p>
          {!isDelivered && order.deliveryException && (
            <p className="text-xs text-red-500 font-medium mt-1">⚠ {order.deliveryException}</p>
          )}
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs font-bold text-[#0f2d4a]">{formatCurrency(order.orderTotal)}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">{formatDateTime(timestamp)}</p>
      </div>
    </div>
  );
};

const DeliveryLedger = () => {
  const { backendUrl } = useContext(AppContext);

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('today'); // 'today' | 'all' | 'exceptions'

  const fetchLedger = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await axios.get(`${backendUrl}/api/v1/orders/driver/ledger`, { withCredentials: true });
      if (res.data?.success) {
        setOrders(res.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your delivery ledger.');
    } finally {
      setIsLoading(false);
    }
  }, [backendUrl]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  const filtered = orders.filter((o) => {
    if (filter === 'exceptions') return o.status === 'delivery_failed';
    if (filter === 'today') {
      const ts = o.status === 'delivered' ? o.deliveredAt : o.deliveryExceptionAt;
      return isToday(ts);
    }
    return true; // 'all'
  });

  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;
  const exceptionCount = orders.filter((o) => o.status === 'delivery_failed').length;
  const todayDeliveredCount = orders.filter((o) => o.status === 'delivered' && isToday(o.deliveredAt)).length;
  const totalValueDelivered = orders
    .filter((o) => o.status === 'delivered')
    .reduce((acc, o) => acc + (o.orderTotal || 0), 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 font-sans text-[#0f2d4a]">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold">Delivery Ledger</h1>
        <button
          onClick={fetchLedger}
          className="text-xs font-bold uppercase tracking-wider text-[#009688] hover:text-[#00786a] flex items-center gap-1.5"
        >
          ↻ Refresh
        </button>
      </div>
      <p className="text-xs text-slate-400 mb-6">Your completed deliveries and reported exceptions.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Delivered Today</p>
          <p className="text-lg font-bold text-emerald-600">{todayDeliveredCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Total Delivered</p>
          <p className="text-lg font-bold text-[#0f2d4a]">{deliveredCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-red-400 mb-1">Exceptions</p>
          <p className="text-lg font-bold text-red-600">{exceptionCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Value Delivered</p>
          <p className="text-lg font-bold text-[#0f2d4a]">{formatCurrency(totalValueDelivered)}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {[
          { key: 'today', label: 'Today' },
          { key: 'all', label: 'All' },
          { key: 'exceptions', label: 'Exceptions Only' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`text-xs font-bold px-3.5 py-2 rounded-lg border ${
              filter === tab.key ? 'bg-[#0f2d4a] text-white border-[#0f2d4a]' : 'bg-white text-slate-500 border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading ledger...</div>
        ) : error ? (
          <div className="p-12 text-center text-red-500 text-sm">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">Nothing to show for this filter yet.</div>
        ) : (
          <div>
            {filtered.map((order) => (
              <LedgerEntry key={order._id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryLedger;