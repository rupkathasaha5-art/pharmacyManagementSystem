import React, { useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { AppContext } from '../context/AppContext.jsx';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

const ConfirmReturnModal = ({ record, onClose, onConfirm, isSubmitting }) => {
  const [creditNoteNumber, setCreditNoteNumber] = useState('');
  const [notes, setNotes] = useState('');

  if (!record) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-[#0f2d4a] mb-1">Confirm Manufacturer Return</h3>
        <p className="text-xs text-slate-400 font-mono mb-4">
          {record.productName} · {record.batchNumber}
        </p>

        <div className="bg-slate-50 rounded-lg p-3 mb-4 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Quantity</span>
            <span className="font-semibold text-[#0f2d4a]">{record.quantityReturned} units</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Expired</span>
            <span className="font-semibold text-[#0f2d4a]">{formatDate(record.expiryDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Supplier</span>
            <span className="font-semibold text-[#0f2d4a]">{record.supplierName || '—'}</span>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
            Credit Note Number (optional)
          </label>
          <input
            type="text"
            value={creditNoteNumber}
            onChange={(e) => setCreditNoteNumber(e.target.value)}
            placeholder="e.g. CN-2024-0417"
            className="w-full text-sm px-3 py-2.5 rounded-lg border border-slate-200 focus:border-[#009688] focus:outline-none focus:ring-2 focus:ring-[#009688]/20"
          />
        </div>

        <div className="mb-5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Any relevant detail about the return..."
            className="w-full text-sm px-3 py-2.5 rounded-lg border border-slate-200 focus:border-[#009688] focus:outline-none focus:ring-2 focus:ring-[#009688]/20 resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm({ creditNoteNumber, notes })}
            disabled={isSubmitting}
            className="flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg text-white bg-[#009688] hover:bg-[#00786a] disabled:bg-slate-300"
          >
            {isSubmitting ? 'Confirming...' : 'Confirm Returned'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ManufacturerReturns = () => {
  const { backendUrl } = useContext(AppContext);

  const [returns, setReturns] = useState([]);
  const [summary, setSummary] = useState({ pendingCount: 0, pendingQty: 0, returnedCount: 0, returnedQty: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending_return'); // 'pending_return' | 'returned' | 'all'

  const [modalRecord, setModalRecord] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReturns = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const res = await axios.get(`${backendUrl}/api/v1/manufacturer-returns`, { params, withCredentials: true });
      if (res.data?.success) {
        setReturns(res.data.data.returns || []);
        setSummary(res.data.data.summary || {});
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load manufacturer returns.');
    } finally {
      setIsLoading(false);
    }
  }, [backendUrl, filter]);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  const handleConfirmReturn = async ({ creditNoteNumber, notes }) => {
    setIsSubmitting(true);
    try {
      await axios.patch(
        `${backendUrl}/api/v1/manufacturer-returns/${modalRecord._id}/confirm`,
        { creditNoteNumber, notes },
        { withCredentials: true }
      );
      setModalRecord(null);
      fetchReturns();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to confirm return.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 font-sans text-[#0f2d4a]">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold">Return to Manufacturer</h1>
        <button
          onClick={fetchReturns}
          className="text-xs font-bold uppercase tracking-wider text-[#009688] hover:text-[#00786a] flex items-center gap-1.5"
        >
          ↻ Refresh
        </button>
      </div>
      <p className="text-xs text-slate-400 mb-6">
        Batches flagged red by the expiry audit — track which have actually been sent back and reimbursed.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-amber-200 shadow-sm p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500 mb-1">Pending Return</p>
          <p className="text-lg font-bold text-amber-600">{summary.pendingCount} batch(es)</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Units Pending</p>
          <p className="text-lg font-bold text-[#0f2d4a]">{summary.pendingQty}</p>
        </div>
        <div className="bg-white rounded-xl border border-emerald-200 shadow-sm p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 mb-1">Confirmed Returned</p>
          <p className="text-lg font-bold text-emerald-600">{summary.returnedCount} batch(es)</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Units Returned</p>
          <p className="text-lg font-bold text-[#0f2d4a]">{summary.returnedQty}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {[
          { key: 'pending_return', label: 'Pending' },
          { key: 'returned', label: 'Confirmed' },
          { key: 'all', label: 'All' },
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
          <div className="p-12 text-center text-slate-400 text-sm">Loading...</div>
        ) : error ? (
          <div className="p-12 text-center text-red-500 text-sm">{error}</div>
        ) : returns.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">Nothing here for this filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left font-bold text-[11px] uppercase tracking-wider text-slate-400 px-5 py-3">Product</th>
                  <th className="text-left font-bold text-[11px] uppercase tracking-wider text-slate-400 px-5 py-3">Batch</th>
                  <th className="text-left font-bold text-[11px] uppercase tracking-wider text-slate-400 px-5 py-3">Expired</th>
                  <th className="text-left font-bold text-[11px] uppercase tracking-wider text-slate-400 px-5 py-3">Qty</th>
                  <th className="text-left font-bold text-[11px] uppercase tracking-wider text-slate-400 px-5 py-3">Supplier</th>
                  <th className="text-left font-bold text-[11px] uppercase tracking-wider text-slate-400 px-5 py-3">Flagged On</th>
                  <th className="text-left font-bold text-[11px] uppercase tracking-wider text-slate-400 px-5 py-3">Status</th>
                  <th className="text-right font-bold text-[11px] uppercase tracking-wider text-slate-400 px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {returns.map((r) => (
                  <tr key={r._id} className="border-b border-slate-50 hover:bg-slate-50/40">
                    <td className="px-5 py-3.5 text-xs font-semibold text-[#0f2d4a]">{r.productName}</td>
                    <td className="px-5 py-3.5 text-xs font-mono text-slate-500">{r.batchNumber}</td>
                    <td className="px-5 py-3.5 text-xs text-red-500 font-medium">{formatDate(r.expiryDate)}</td>
                    <td className="px-5 py-3.5 text-xs font-semibold">{r.quantityReturned}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">{r.supplierName || '—'}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">{formatDate(r.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      {r.status === 'returned' ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                          Returned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                          Pending
                        </span>
                      )}
                      {r.creditNoteNumber && (
                        <p className="text-[10px] text-slate-400 font-mono mt-1">{r.creditNoteNumber}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {r.status === 'pending_return' ? (
                        <button
                          onClick={() => setModalRecord(r)}
                          className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg bg-[#009688] text-white hover:bg-[#00786a]"
                        >
                          Confirm Return
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-300">
                          {r.confirmedBy?.name ? `by ${r.confirmedBy.name}` : '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmReturnModal
        record={modalRecord}
        onClose={() => setModalRecord(null)}
        onConfirm={handleConfirmReturn}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default ManufacturerReturns;