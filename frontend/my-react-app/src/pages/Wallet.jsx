import React, { useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext.jsx';

const formatCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');

const getDueBadge = (daysUntilDue) => {
  if (daysUntilDue < 0) return { label: `${Math.abs(daysUntilDue)}d overdue`, bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
  if (daysUntilDue <= 3) return { label: `Due in ${daysUntilDue}d`, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
  return { label: `Due in ${daysUntilDue}d`, bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200' };
};

const Wallet = () => {
  const { backendUrl } = useContext(AppContext);
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await axios.get(`${backendUrl}/api/v1/org-admin/my-financial-summary`, { withCredentials: true });
      if (res.data?.success) setSummary(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your financial summary.');
    } finally {
      setIsLoading(false);
    }
  }, [backendUrl]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  // Single action: always settles the full outstanding balance.
  // SettleCredit.jsx creates its own payment intent for the full amount on mount.
  const handleSettle = () => {
    navigate('/settle-credit');
  };

  if (isLoading) {
    return <div className="max-w-5xl mx-auto p-12 text-center text-slate-400 text-sm">Loading your financial summary...</div>;
  }
  if (error) {
    return <div className="max-w-5xl mx-auto p-6 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>;
  }
  if (!summary) return null;

  const creditUsedPercent = summary.creditLimit > 0 ? Math.min(100, (summary.currentOutstanding / summary.creditLimit) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto font-sans text-[#0f2d4a] space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Financial HUD</h1>
        <p className="text-xs text-slate-400 mt-1">Your trade credit standing and outstanding invoices.</p>
      </div>

      {summary.isCreditFrozen && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5 flex items-center justify-between gap-6 flex-wrap">
          <div>
            <h3 className="text-sm font-bold text-red-700 mb-1">⚠ Trade Credit Frozen</h3>
            <p className="text-xs text-red-600">{summary.freezeReason || 'Outstanding balance overdue past payment terms.'}</p>
          </div>
          <button
            onClick={handleSettle}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg whitespace-nowrap shrink-0"
          >
            {`Pay ${formatCurrency(summary.currentOutstanding)} to Unlock Credit`}
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex justify-between items-end mb-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Available Credit</p>
            <p className="text-2xl font-bold text-[#009688]">{formatCurrency(summary.availableCredit)}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Credit Limit</p>
            <p className="text-lg font-semibold text-slate-500">{formatCurrency(summary.creditLimit)}</p>
          </div>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all ${creditUsedPercent > 90 ? 'bg-red-500' : creditUsedPercent > 60 ? 'bg-amber-500' : 'bg-[#009688]'}`}
            style={{ width: `${creditUsedPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500">
          <span>Outstanding: <strong className="text-[#0f2d4a]">{formatCurrency(summary.currentOutstanding)}</strong></span>
          <span>Terms: Net {summary.creditDays}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-[#0f2d4a]">Unsettled Invoices</h3>
        </div>
        {summary.invoices.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">No unsettled invoices — you're all caught up.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left font-bold text-[11px] uppercase tracking-wider text-slate-400 px-6 py-3">Invoice</th>
                  <th className="text-left font-bold text-[11px] uppercase tracking-wider text-slate-400 px-6 py-3">Order Total</th>
                  <th className="text-left font-bold text-[11px] uppercase tracking-wider text-slate-400 px-6 py-3">Remaining</th>
                  <th className="text-left font-bold text-[11px] uppercase tracking-wider text-slate-400 px-6 py-3">Due Date</th>
                  <th className="text-left font-bold text-[11px] uppercase tracking-wider text-slate-400 px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {summary.invoices.map((inv) => {
                  const badge = getDueBadge(inv.daysUntilDue);
                  return (
                    <tr key={inv.orderId} className="border-b border-slate-50 hover:bg-slate-50/40">
                      <td className="px-6 py-3.5 text-xs font-mono font-semibold text-[#0f2d4a]">{inv.invoiceNumber || '—'}</td>
                      <td className="px-6 py-3.5 text-xs">{formatCurrency(inv.orderTotal)}</td>
                      <td className="px-6 py-3.5 text-xs font-bold">{formatCurrency(inv.amountRemaining)}</td>
                      <td className="px-6 py-3.5 text-xs text-slate-500">{formatDate(inv.dueDate)}</td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wallet;