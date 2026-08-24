import React, { useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext.jsx';

const formatCurrency = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const buildMapsUrl = (address) => {
  if (!address) return null;
  const query = [address.street, address.city, address.state, address.postalCode]
    .filter(Boolean)
    .join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};

const ManifestCard = ({ order, index, onNavigateToDropoff }) => {
  const org = order.buyerOrg?.organization || {};
  const mapsUrl = buildMapsUrl(org.address);
  const phone = org.phone;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#0f2d4a] text-white flex items-center justify-center text-xs font-bold shrink-0">
            {index + 1}
          </div>
          <div>
            <p className="font-bold text-sm text-[#0f2d4a]">{org.name || 'Unknown Chemist'}</p>
            <p className="text-xs font-mono text-slate-400">{order.invoiceNumber || `#${order._id.slice(-8)}`}</p>
          </div>
        </div>
        <span className="text-xs font-bold text-[#0f2d4a] whitespace-nowrap">{formatCurrency(order.orderTotal)}</span>
      </div>

      {org.address && (
        <p className="text-xs text-slate-500 mb-3 pl-11">
          {[org.address.street, org.address.city, org.address.state, org.address.postalCode].filter(Boolean).join(', ')}
        </p>
      )}

      <div className="flex flex-wrap gap-2 pl-11">
        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg border border-slate-200 text-[#0f2d4a] hover:border-[#009688] hover:text-[#009688] flex items-center gap-1.5"
          >
            🗺️ Directions
          </a>
        )}
        {phone && (
          <a
            href={`tel:${phone}`}
            className="text-[11px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg border border-slate-200 text-[#0f2d4a] hover:border-[#009688] hover:text-[#009688] flex items-center gap-1.5"
          >
            📞 Call {phone}
          </a>
        )}
        <button
          onClick={() => onNavigateToDropoff(order)}
          className="ml-auto text-[11px] font-bold uppercase tracking-wider px-4 py-2 rounded-lg bg-[#009688] text-white hover:bg-[#00786a]"
        >
          Drop-Off & OTP →
        </button>
      </div>
    </div>
  );
};

const ActiveManifest = () => {
  const { backendUrl } = useContext(AppContext);
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchManifest = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await axios.get(`${backendUrl}/api/v1/orders/driver/manifest`, { withCredentials: true });
      if (res.data?.success) {
        setOrders(res.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your manifest.');
    } finally {
      setIsLoading(false);
    }
  }, [backendUrl]);

  useEffect(() => {
    fetchManifest();
  }, [fetchManifest]);

  const handleNavigateToDropoff = (order) => {
    navigate('/dashboard/dropoff', { state: { orderId: order._id, orgName: order.buyerOrg?.organization?.name } });
  };

  const totalValue = orders.reduce((acc, o) => acc + (o.orderTotal || 0), 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 font-sans text-[#0f2d4a]">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold">Active Manifest</h1>
        <button
          onClick={fetchManifest}
          className="text-xs font-bold uppercase tracking-wider text-[#009688] hover:text-[#00786a] flex items-center gap-1.5"
        >
          ↻ Refresh
        </button>
      </div>
      <p className="text-xs text-slate-400 mb-6">Your assigned drop-offs, in dispatch order.</p>

      {!isLoading && !error && orders.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Stops Remaining</p>
            <p className="text-lg font-bold text-[#0f2d4a]">{orders.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Total Value on Route</p>
            <p className="text-lg font-bold text-[#0f2d4a]">{formatCurrency(totalValue)}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
          Loading manifest...
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl border border-red-200 p-12 text-center text-red-500 text-sm">
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
          No active drop-offs assigned to you right now. 🎉
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order, idx) => (
            <ManifestCard key={order._id} order={order} index={idx} onNavigateToDropoff={handleNavigateToDropoff} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ActiveManifest;