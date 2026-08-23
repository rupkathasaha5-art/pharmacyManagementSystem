import React, { useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { AppContext } from '../context/AppContext.jsx';

const formatCurrency = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

// Severity bands for how overdue a balance is — not the org's due-date terms
// (that's creditDays), but how far past it they've drifted.
const getSeverity = (daysOverdue) => {
  if (daysOverdue <= 0) return { label: 'Within Terms', bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200', bar: '#94a3b8' };
  if (daysOverdue <= 14) return { label: 'Recently Due', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', bar: '#d97706' };
  if (daysOverdue <= 30) return { label: 'Overdue', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', bar: '#ea580c' };
  return { label: 'Severely Overdue', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', bar: '#dc2626' };
};

const AccountsReceivable = () => {
  const { backendUrl } = useContext(AppContext);

  const [receivables, setReceivables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('daysOverdue'); // 'daysOverdue' | 'amountDue' | 'orgName'
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);

  const fetchReceivables = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await axios.get(`${backendUrl}/api/v1/orders/admin/receivables`, { withCredentials: true });
      if (res.data?.success) {
        setReceivables(res.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load accounts receivable.');
    } finally {
      setIsLoading(false);
    }
  }, [backendUrl]);

  useEffect(() => {
    fetchReceivables();
  }, [fetchReceivables]);

  const filtered = receivables.filter((r) => !showOverdueOnly || r.daysOverdue > 0);

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'amountDue') return b.amountDue - a.amountDue;
    if (sortBy === 'orgName') return (a.orgName || '').localeCompare(b.orgName || '');
    return b.daysOverdue - a.daysOverdue;
  });

  const totalOutstanding = receivables.reduce((acc, r) => acc + r.amountDue, 0);
  const totalOverdue = receivables.filter((r) => r.daysOverdue > 0).reduce((acc, r) => acc + r.amountDue, 0);
  const frozenCount = receivables.filter((r) => r.isCreditFrozen).length;
  const severelyOverdueCount = receivables.filter((r) => r.daysOverdue > 30).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 font-sans text-[#0f2d4a]">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold">Accounts Receivable</h1>
        <button
          onClick={fetchReceivables}
          className="text-xs font-bold uppercase tracking-wider text-[#009688] hover:text-[#00786a] flex items-center gap-1.5"
        >
          ↻ Refresh
        </button>
      </div>
      <p className="text-xs text-slate-400 mb-6">
        Organizations with outstanding trade credit — ordered by how overdue their balance is.
      </p>

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Total Outstanding</p>
          <p className="text-lg font-bold text-[#0f2d4a]">{formatCurrency(totalOutstanding)}</p>
        </div>
        <div className="bg-white rounded-xl border border-orange-200 shadow-sm p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-orange-400 mb-1">Overdue Balance</p>
          <p className="text-lg font-bold text-orange-600">{formatCurrency(totalOverdue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-red-400 mb-1">Severely Overdue (30+ days)</p>
          <p className="text-lg font-bold text-red-600">{severelyOverdueCount} org(s)</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Credit Frozen</p>
          <p className="text-lg font-bold text-[#0f2d4a]">{frozenCount} org(s)</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setShowOverdueOnly(false)}
            className={`text-xs font-bold px-3.5 py-2 rounded-lg border ${!showOverdueOnly ? 'bg-[#0f2d4a] text-white border-[#0f2d4a]' : 'bg-white text-slate-500 border-slate-200'}`}
          >
            All ({receivables.length})
          </button>
          <button
            onClick={() => setShowOverdueOnly(true)}
            className={`text-xs font-bold px-3.5 py-2 rounded-lg border ${showOverdueOnly ? 'bg-[#0f2d4a] text-white border-[#0f2d4a]' : 'bg-white text-slate-500 border-slate-200'}`}
          >
            Overdue Only ({receivables.filter((r) => r.daysOverdue > 0).length})
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-semibold uppercase tracking-wider">Sort by</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold"
          >
            <option value="daysOverdue">Days Overdue</option>
            <option value="amountDue">Amount Due</option>
            <option value="orgName">Org Name</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading receivables...</div>
        ) : error ? (
          <div className="p-12 text-center text-red-500 text-sm">{error}</div>
        ) : sorted.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            {showOverdueOnly ? 'No overdue balances right now.' : 'No outstanding receivables.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left font-bold text-[11px] uppercase tracking-wider text-slate-400 px-5 py-3">Organization</th>
                  <th className="text-left font-bold text-[11px] uppercase tracking-wider text-slate-400 px-5 py-3">GSTIN</th>
                  <th className="text-left font-bold text-[11px] uppercase tracking-wider text-slate-400 px-5 py-3">Amount Due</th>
                  <th className="text-left font-bold text-[11px] uppercase tracking-wider text-slate-400 px-5 py-3">Credit Limit</th>
                  <th className="text-left font-bold text-[11px] uppercase tracking-wider text-slate-400 px-5 py-3">Oldest Unpaid Invoice</th>
                  <th className="text-left font-bold text-[11px] uppercase tracking-wider text-slate-400 px-5 py-3">Due Since</th>
                  <th className="text-left font-bold text-[11px] uppercase tracking-wider text-slate-400 px-5 py-3">Days Overdue</th>
                  <th className="text-left font-bold text-[11px] uppercase tracking-wider text-slate-400 px-5 py-3">Credit Status</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => {
                  const severity = getSeverity(r.daysOverdue);
                  return (
                    <tr key={r.orgId} className="border-b border-slate-50 hover:bg-slate-50/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-xs text-[#0f2d4a]">{r.orgName || '—'}</p>
                        <p className="text-[11px] text-slate-400">{r.email || ''}</p>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-mono text-slate-500">{r.taxId || '—'}</td>
                      <td className="px-5 py-3.5 text-xs font-bold text-[#0f2d4a]">{formatCurrency(r.amountDue)}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">{formatCurrency(r.creditLimit)}</td>
                      <td className="px-5 py-3.5 text-xs font-mono text-slate-500">{r.oldestInvoiceNumber || '—'}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">{formatDate(r.oldestDueDate)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${severity.bg} ${severity.text} ${severity.border}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: severity.bar }} />
                            {r.daysOverdue > 0 ? `${r.daysOverdue} days` : 'On time'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {r.isCreditFrozen ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border bg-red-50 text-red-700 border-red-200">
                            Frozen
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border bg-teal-50 text-teal-700 border-teal-200">
                            Active
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-[11px] text-slate-400 mt-4">
        Days overdue is calculated from the oldest unpaid Net-Terms invoice per organization, assuming balances are settled oldest-first.
      </p>
    </div>
  );
};

export default AccountsReceivable;