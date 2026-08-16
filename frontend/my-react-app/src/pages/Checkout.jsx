import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext.jsx';
import axios from 'axios';

const Checkout = () => {
  const { 
    backendUrl,
    userData, 
    setUserData, 
    cart, 
    setCart 
  } = useContext(AppContext);

  const [paymentMethod, setPaymentMethod] = useState('net_14');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(null);

  if (!userData) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center text-slate-400 font-medium">
        Loading organization billing and credit profile...
      </div>
    );
  }

  // 1. Resolve Organization Object & Nested Subdocuments
  const activeOrg = userData.org || userData.organization || {};
  const orgDetails = activeOrg.organization || activeOrg;
  const orgName = orgDetails.name || "Apex Global Health";
  const gstin = orgDetails.taxId || "TIN-88291-XYZ";
  const creditProfile = activeOrg.creditProfile || {};

  // 2. Financial Metrics Calculation
  const subtotal = (cart || []).reduce((acc, item) => acc + ((item.salesRate || 0) * (item.orderQuantity || 1)), 0);
  const taxAmount = subtotal * 0.12; // 12% GST standard
  const totalAmount = subtotal + taxAmount;

  // 3. Real-time Credit Capacity Checks
  const creditLimit = creditProfile.creditLimit ?? 50000;
  const currentOutstanding = creditProfile.currentOutstanding ?? 0;
  const availableCredit = Math.max(0, creditLimit - currentOutstanding);
  const isCreditSufficient = availableCredit >= totalAmount;
  const isCreditFrozen = creditProfile.isCreditFrozen ?? false;
  const isNetTermsEligible = (activeOrg.status === 'approved' || userData.status === 'approved') && !isCreditFrozen;
  const creditDays = creditProfile.creditDays || 14;

  const calculateNetDueDate = () => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + creditDays);
    return dueDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // 4. Place Order & Sync State
  const handlePlaceOrder = async () => {
    if (paymentMethod === 'net_14' && (!isNetTermsEligible || !isCreditSufficient)) {
      alert("Order cannot be processed on credit terms due to credit line constraints or account status.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(
        `${backendUrl}/api/v1/orders/checkout`, 
        {}, 
        { withCredentials: true }
      );
      
      if (response.data && response.data.success) {
        const payloadData = response.data.data;
        const orderInfo = payloadData?.order || payloadData;
        const freshOrg = payloadData?.updatedOrg;

        setOrderComplete(orderInfo.invoiceNumber || orderInfo._id);
        setCart([]);

        // Instant frontend state synchronization
        if (setUserData) {
          setUserData(prev => {
            const orgKey = prev?.org ? 'org' : 'organization';
            const updatedUser = {
              ...prev,
              [orgKey]: freshOrg || {
                ...activeOrg,
                creditProfile: {
                  ...creditProfile,
                  currentOutstanding: currentOutstanding + totalAmount
                }
              }
            };
            localStorage.setItem("userData", JSON.stringify(updatedUser));
            return updatedUser;
          });
        }
      }
    } catch (error) {
      alert(`Checkout failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="max-w-xl mx-auto my-16 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center font-sans">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">
          ✓
        </div>
        <h2 className="text-2xl font-bold text-[#0f2d4a]">Order Confirmed</h2>
        <p className="text-xs text-slate-400 font-mono mt-1">Invoice No: {orderComplete}</p>

        {paymentMethod === 'net_14' ? (
          <div className="my-6 p-4 bg-teal-50 border border-teal-200 rounded-xl text-left text-xs text-[#0f2d4a] space-y-1">
            <p className="font-bold text-teal-800 uppercase tracking-wider">Net {creditDays} Trade Credit Applied</p>
            <p><strong>Billed To:</strong> {orgName}</p>
            <p><strong>Total Due:</strong> ₹{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            <p><strong>Due Date:</strong> {calculateNetDueDate()}</p>
            <p className="text-slate-500 text-[11px] pt-1">The commercial tax invoice has been generated and queued for dispatch.</p>
          </div>
        ) : (
          <p className="my-6 text-sm text-slate-600">Immediate payment verified. Dispatch tracking initialized.</p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 font-sans text-[#0f2d4a]">
      <h1 className="text-2xl font-bold mb-1">Wholesale Checkout</h1>
      <p className="text-xs text-slate-400 mb-8">Review items, verify credit limits, and confirm commercial terms.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Organization & Payment Terms */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Purchasing Entity Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Purchasing Entity</h3>
            <div className="flex justify-between items-center text-sm">
              <div>
                <p className="font-bold text-[#0f2d4a]">{orgName}</p>
                <p className="text-xs font-mono text-slate-400">GSTIN: {gstin}</p>
              </div>
              <span className="bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                {userData?.role || "ORG_ADMIN"}
              </span>
            </div>
          </div>

          {/* Payment Terms Selector */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Payment Terms & Method</h3>

            <div className="space-y-3">
              
              {/* Option 1: Net Trade Credit */}
              <label 
                className={`flex items-start justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'net_14' ? 'border-[#009688] bg-[#f4fbf9]' : 'border-slate-200 hover:border-slate-300'
                }`}
                onClick={() => setPaymentMethod('net_14')}
              >
                <div className="flex gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="net_14"
                    checked={paymentMethod === 'net_14'}
                    onChange={() => setPaymentMethod('net_14')}
                    className="mt-1 accent-[#009688]"
                  />
                  <div>
                    <span className="font-bold text-sm block">Invoice on Terms: Net {creditDays}</span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pay after delivery. Settlement due: <strong>{calculateNetDueDate()}</strong>.
                    </p>
                    
                    <div className="mt-3 text-[11px] bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Available Trade Credit:</span>
                        <strong className={isCreditSufficient ? "text-emerald-600" : "text-red-500"}>
                          ₹{availableCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </strong>
                      </div>
                      {!isCreditSufficient && (
                        <p className="text-red-500 font-bold pt-1">
                          ⚠ Order total exceeds remaining trade credit capacity by ₹{(totalAmount - availableCredit).toFixed(2)}.
                        </p>
                      )}
                      {isCreditFrozen && (
                        <p className="text-red-500 font-bold pt-1">
                          ⚠ Credit is currently frozen: {creditProfile?.freezeReason || "Outstanding balance overdue."}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </label>

              {/* Option 2: Immediate Payment */}
              <label 
                className={`flex items-start justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'immediate' ? 'border-[#009688] bg-[#f4fbf9]' : 'border-slate-200 hover:border-slate-300'
                }`}
                onClick={() => setPaymentMethod('immediate')}
              >
                <div className="flex gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="immediate"
                    checked={paymentMethod === 'immediate'}
                    onChange={() => setPaymentMethod('immediate')}
                    className="mt-1 accent-[#009688]"
                  />
                  <div>
                    <span className="font-bold text-sm block">Immediate Payment (Cards / Virtual Account / UPI)</span>
                    <p className="text-xs text-slate-500 mt-0.5">Direct gateway clearance.</p>
                  </div>
                </div>
              </label>

            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="w-full">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Order Summary</h3>

            <div className="space-y-2 text-xs text-slate-600 pt-2">
              <div className="flex justify-between">
                <span>Subtotal ({cart?.length || 0} batches)</span>
                <span className="font-semibold text-[#0f2d4a]">₹{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated GST (12%)</span>
                <span className="font-semibold text-[#0f2d4a]">₹{taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[#0f2d4a] pt-3 border-t">
                <span>Total Payable</span>
                <span>₹{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isSubmitting || (paymentMethod === 'net_14' && (!isCreditSufficient || !isNetTermsEligible)) || (cart?.length === 0)}
              className="w-full py-3 bg-[#00c4a7] hover:bg-[#00b096] disabled:bg-slate-300 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all"
            >
              {isSubmitting 
                ? 'Processing Transaction...' 
                : paymentMethod === 'net_14' 
                  ? `Confirm Order on Net ${creditDays} Terms` 
                  : 'Pay Now & Complete Order'
              }
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Checkout;