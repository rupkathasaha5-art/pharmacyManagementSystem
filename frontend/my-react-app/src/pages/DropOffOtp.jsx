import React, { useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext.jsx';

const OTP_LENGTH = 6; // Matches generateDeliveryOtp() on the backend.
// Note: product copy elsewhere describes this as a "4-digit OTP" — the
// backend actually generates 6 digits. Built against the real contract.

const EXCEPTION_REASONS = [
  'Shop Closed',
  'Recipient Unavailable',
  'Address Not Found',
  'Buyer Refused Delivery',
  'Other',
];

const NumericKeypad = ({ onPress, onBackspace }) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];
  return (
    <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
      {keys.map((key, idx) => {
        if (key === '') return <div key={idx} />;
        if (key === '⌫') {
          return (
            <button
              key={idx}
              onClick={onBackspace}
              className="h-14 rounded-xl bg-slate-50 border border-slate-200 text-lg font-bold text-slate-500 hover:bg-slate-100 active:scale-95 transition-transform"
            >
              ⌫
            </button>
          );
        }
        return (
          <button
            key={idx}
            onClick={() => onPress(key)}
            className="h-14 rounded-xl bg-white border border-slate-200 text-xl font-bold text-[#0f2d4a] hover:border-[#009688] active:scale-95 transition-transform"
          >
            {key}
          </button>
        );
      })}
    </div>
  );
};

const DropOffOtp = () => {
  const { backendUrl } = useContext(AppContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [showExceptionForm, setShowExceptionForm] = useState(false);
  const [exceptionReason, setExceptionReason] = useState('');
  const [exceptionNotes, setExceptionNotes] = useState('');
  const [isReportingException, setIsReportingException] = useState(false);

  const preselectedOrderId = location.state?.orderId;
  const preselectedOrgName = location.state?.orgName;

  const fetchPendingOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    try {
      const res = await axios.get(`${backendUrl}/api/v1/orders/driver/manifest`, { withCredentials: true });
      if (res.data?.success) {
        setPendingOrders(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load pending orders:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  }, [backendUrl]);

  useEffect(() => {
    if (preselectedOrderId) {
      setSelectedOrder({ _id: preselectedOrderId, orgName: preselectedOrgName });
      setIsLoadingOrders(false);
    } else {
      fetchPendingOrders();
    }
  }, [preselectedOrderId, preselectedOrgName, fetchPendingOrders]);

  const handleKeyPress = (digit) => {
    if (otp.length >= OTP_LENGTH) return;
    setError('');
    setOtp((prev) => prev + digit);
  };

  const handleBackspace = () => {
    setError('');
    setOtp((prev) => prev.slice(0, -1));
  };

  const handleSubmitOtp = async () => {
    if (otp.length !== OTP_LENGTH) {
      setError(`Enter the full ${OTP_LENGTH}-digit code.`);
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await axios.post(
        `${backendUrl}/api/v1/orders/${selectedOrder._id}/confirm-delivery`,
        { otp },
        { withCredentials: true }
      );
      setSuccess(true);
      setTimeout(() => navigate('/dashboard/manifest'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
      setOtp('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportException = async () => {
    if (!exceptionReason) return;
    setIsReportingException(true);
    try {
      const reason = exceptionNotes ? `${exceptionReason}: ${exceptionNotes}` : exceptionReason;
      await axios.post(
        `${backendUrl}/api/v1/orders/${selectedOrder._id}/report-exception`,
        { reason },
        { withCredentials: true }
      );
      navigate('/dashboard/manifest');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to report exception.');
    } finally {
      setIsReportingException(false);
    }
  };

  // Order selection screen — shown when no order was passed in via manifest navigation
  if (!selectedOrder) {
    return (
      <div className="max-w-md mx-auto px-4 py-10 font-sans text-[#0f2d4a]">
        <h1 className="text-2xl font-bold mb-1">Drop-Off & OTP</h1>
        <p className="text-xs text-slate-400 mb-6">Select an order to confirm delivery.</p>

        {isLoadingOrders ? (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
            Loading your assigned orders...
          </div>
        ) : pendingOrders.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
            No orders currently out for delivery.
          </div>
        ) : (
          <div className="space-y-2">
            {pendingOrders.map((order) => (
              <button
                key={order._id}
                onClick={() => setSelectedOrder({ _id: order._id, orgName: order.buyerOrg?.organization?.name })}
                className="w-full text-left bg-white rounded-xl border border-slate-200 p-4 hover:border-[#009688] transition-colors flex justify-between items-center"
              >
                <div>
                  <p className="font-bold text-sm">{order.buyerOrg?.organization?.name || 'Unknown Chemist'}</p>
                  <p className="text-xs font-mono text-slate-400">{order.invoiceNumber || `#${order._id.slice(-8)}`}</p>
                </div>
                <span className="text-[#009688] font-bold text-sm">→</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Success screen
  if (success) {
    return (
      <div className="max-w-md mx-auto my-16 px-4 text-center font-sans">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold">
          ✓
        </div>
        <h2 className="text-2xl font-bold text-[#0f2d4a] mb-2">Delivery Confirmed</h2>
        <p className="text-sm text-slate-500">Returning to your manifest...</p>
      </div>
    );
  }

  // Exception-reporting screen
  if (showExceptionForm) {
    return (
      <div className="max-w-md mx-auto px-4 py-10 font-sans text-[#0f2d4a]">
        <button
          onClick={() => setShowExceptionForm(false)}
          className="text-xs font-bold text-slate-400 hover:text-slate-600 mb-4"
        >
          ← Back to OTP entry
        </button>
        <h1 className="text-xl font-bold mb-1">Report Delivery Exception</h1>
        <p className="text-xs text-slate-400 font-mono mb-6">{selectedOrder.orgName}</p>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Reason</label>
            <div className="space-y-2">
              {EXCEPTION_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    exceptionReason === reason ? 'border-red-300 bg-red-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="exceptionReason"
                    checked={exceptionReason === reason}
                    onChange={() => setExceptionReason(reason)}
                    className="accent-red-500"
                  />
                  <span className="text-sm font-medium">{reason}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Additional Notes (optional)
            </label>
            <textarea
              value={exceptionNotes}
              onChange={(e) => setExceptionNotes(e.target.value)}
              rows={2}
              placeholder="Any extra detail for the ledger..."
              className="w-full text-sm px-3 py-2.5 rounded-lg border border-slate-200 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 resize-none"
            />
          </div>

          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

          <button
            onClick={handleReportException}
            disabled={!exceptionReason || isReportingException}
            className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-bold text-xs uppercase tracking-wider rounded-xl"
          >
            {isReportingException ? 'Reporting...' : 'Submit Exception'}
          </button>
        </div>
      </div>
    );
  }

  // OTP entry screen
  return (
    <div className="max-w-md mx-auto px-4 py-10 font-sans text-[#0f2d4a]">
      <h1 className="text-xl font-bold mb-1">Confirm Drop-Off</h1>
      <p className="text-xs text-slate-400 font-mono mb-8">{selectedOrder.orgName || selectedOrder._id}</p>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-4">
        <p className="text-xs text-center text-slate-400 mb-4">
          Ask the chemist for the {OTP_LENGTH}-digit code printed on their invoice.
        </p>

        <div className="flex justify-center gap-2 mb-6">
          {Array.from({ length: OTP_LENGTH }).map((_, i) => (
            <div
              key={i}
              className={`w-9 h-11 rounded-lg border-2 flex items-center justify-center text-lg font-bold ${
                otp[i] ? 'border-[#009688] bg-[#f4fbf9] text-[#0f2d4a]' : 'border-slate-200 text-slate-300'
              }`}
            >
              {otp[i] || ''}
            </div>
          ))}
        </div>

        {error && <p className="text-xs text-red-500 font-medium text-center mb-4">{error}</p>}

        <NumericKeypad onPress={handleKeyPress} onBackspace={handleBackspace} />

        <button
          onClick={handleSubmitOtp}
          disabled={otp.length !== OTP_LENGTH || isSubmitting}
          className="w-full mt-6 py-3 bg-[#009688] hover:bg-[#00786a] disabled:bg-slate-300 text-white font-bold text-xs uppercase tracking-wider rounded-xl"
        >
          {isSubmitting ? 'Verifying...' : 'Confirm Delivery'}
        </button>
      </div>

      <button
        onClick={() => setShowExceptionForm(true)}
        className="w-full py-2.5 text-xs font-bold uppercase tracking-wider text-red-500 hover:text-red-600"
      >
        ⚠ Can't Deliver — Report an Exception
      </button>
    </div>
  );
};

export default DropOffOtp;