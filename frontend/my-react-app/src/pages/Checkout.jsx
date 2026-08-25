import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext.jsx';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Checkout = () => {
  const { 
    backendUrl,
    userData, 
    setUserData, 
    cart, 
    setCart 
  } = useContext(AppContext);

  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState('net_14');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [isLoadingCart, setIsLoadingCart] = useState(true);

  useEffect(() => {
    const fetchServerCart = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/v1/users/cart`, { withCredentials: true });
        if (response.data && response.data.success) {
          const fetchedItems = response.data.data?.items || response.data.data || [];
          setCart(fetchedItems);
        }
      } catch (error) {
        console.error("Failed to fetch cart from server:", error);
      } finally {
        setIsLoadingCart(false);
      }
    };

    fetchServerCart();
  }, [backendUrl, setCart]);

  if (!userData || isLoadingCart) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center text-slate-400 font-medium">
        Loading organization profile and cart contents...
      </div>
    );
  }

  const activeOrg = userData.org || userData.organization || {};
  const orgDetails = activeOrg.organization || activeOrg;
  const orgName = orgDetails.name || "Apex Global Health";
  const gstin = orgDetails.taxId || "TIN-88291-XYZ";
  const creditProfile = activeOrg.creditProfile || {};

  const safeCart = cart || [];
  const subtotal = safeCart.reduce((acc, item) => {
    const price = item.salesRate || item.price || 0;
    const qty = item.orderQuantity || item.quantity || 1;
    return acc + (price * qty);
  }, 0);
  const taxAmount = subtotal * 0.12;
  const totalAmount = subtotal + taxAmount;

  const creditLimit = creditProfile.creditLimit ?? 50000;
  const currentOutstanding = creditProfile.currentOutstanding ?? 0;
  const availableCredit = Math.max(0, creditLimit - currentOutstanding);
  const isCreditSufficient = availableCredit >= totalAmount;
  const isCreditFrozen = creditProfile.isCreditFrozen ?? false;
  const isNetTermsEligible = (activeOrg.status === 'approved' || userData.status === 'approved') && !isCreditFrozen;
  const creditDays = creditProfile.creditDays || 14;

  const isCreditOptionDisabled = isCreditFrozen || !isNetTermsEligible;

  const calculateNetDueDate = () => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + creditDays);
    return dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleSettleBalance = async () => {
    setIsSettling(true);
    try {
      const response = await axios.post(
        `${backendUrl}/api/v1/payments/settlement/create-intent`,
        {},
        { withCredentials: true }
      );
      if (response.data?.data) {
        navigate('/settle-credit');
      }
    } catch (error) {
      alert(`Could not start settlement: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSettling(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (paymentMethod === 'net_14' && (!isNetTermsEligible || !isCreditSufficient)) {
      alert("Order cannot be processed on credit terms due to credit line constraints or account status.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(
        `${backendUrl}/api/v1/orders/checkout`, 
        { paymentMethod }, 
        { withCredentials: true }
      );
      
      if (response.data && response.data.success) {
        const payloadData = response.data.data;
        const orderInfo = payloadData?.order || payloadData;
        const freshOrg = payloadData?.updatedOrg;

        if (paymentMethod === 'immediate') {
          navigate(`/payment/${orderInfo._id}`); 
        } else {
          // Snapshot everything the success screen needs from the SERVER'S response
          const completedOrderSnapshot = {
            orderId: orderInfo._id,
            invoiceNumber: orderInfo.invoiceNumber || orderInfo._id,
            deliveryOtp: orderInfo.deliveryOtp || null,
            total: orderInfo.orderTotal ?? totalAmount,
            dueDate: orderInfo.dueDate || null,
          };

          // Clear local cart states
          setCart([]);
          localStorage.removeItem('cart');

          // Update user's credit profile locally
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

          // Route to the new unified confirmation page, passing the snapshot data
          navigate(`/order-confirmation/${orderInfo._id}`, { 
            state: { 
              orderComplete: completedOrderSnapshot,
              paymentMethod: 'net_14'
            } 
          });
        }
      }
    } catch (error) {
      alert(`Checkout failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 font-sans text-[#0f2d4a]">
      <h1 className="text-2xl font-bold mb-1">Wholesale Checkout</h1>
      <p className="text-xs text-slate-400 mb-8">Review items, verify credit limits, and confirm commercial terms.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div className="lg:col-span-2 space-y-6">

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

          {isCreditFrozen && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5">
              <h3 className="text-sm font-bold text-red-700 mb-1">⚠ Trade Credit Frozen</h3>
              <p className="text-xs text-red-600 mb-3">
                {creditProfile?.freezeReason || "Outstanding balance overdue past payment terms."}
              </p>
              <div className="flex justify-between items-center text-xs bg-white p-3 rounded-lg border border-red-200 mb-3">
                <span className="text-slate-500">Amount to unlock trade credit:</span>
                <strong className="text-red-600 text-sm">
                  ₹{currentOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </strong>
              </div>
              <button
                onClick={handleSettleBalance}
                disabled={isSettling}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-bold text-xs uppercase tracking-wider rounded-lg"
              >
                {isSettling ? 'Starting Payment...' : `Pay ₹${currentOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })} to Unlock Credit`}
              </button>
            </div>
          )}

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Payment Terms & Method</h3>

            <div className="space-y-3">

              <label 
                className={`flex items-start justify-between p-4 rounded-xl border-2 transition-all ${
                  isCreditOptionDisabled 
                    ? 'border-slate-100 bg-slate-50 cursor-not-allowed opacity-60' 
                    : paymentMethod === 'net_14' 
                      ? 'border-[#009688] bg-[#f4fbf9] cursor-pointer' 
                      : 'border-slate-200 hover:border-slate-300 cursor-pointer'
                }`}
                onClick={() => !isCreditOptionDisabled && setPaymentMethod('net_14')}
              >
                <div className="flex gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="net_14"
                    checked={paymentMethod === 'net_14'}
                    disabled={isCreditOptionDisabled}
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
                      {!isCreditFrozen && !isCreditSufficient && (
                        <p className="text-red-500 font-bold pt-1">
                          ⚠ Order total exceeds remaining trade credit capacity by ₹{(totalAmount - availableCredit).toFixed(2)}.
                        </p>
                      )}
                      {isCreditFrozen && (
                        <p className="text-red-500 font-bold pt-1">
                          ⚠ Credit is frozen — settle the outstanding balance above to re-enable this option.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </label>

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

        <div className="w-full">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Order Summary</h3>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {safeCart.map((item, idx) => {
                const price = item.salesRate || item.price || 0;
                const qty = item.orderQuantity || item.quantity || 1;
                return (
                  <div key={item._id || item.batchRef || idx} className="flex justify-between text-xs border-b border-slate-100 pb-2">
                    <div className="pr-2">
                      <p className="font-medium text-[#0f2d4a]">{item.product || item.productName || 'Item'}</p>
                      <p className="text-slate-400">{qty} × ₹{price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                    <span className="font-semibold text-[#0f2d4a] whitespace-nowrap">
                      ₹{(price * qty).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex justify-between">
              <span className="text-slate-500">Payment Method:</span>
              <strong className="text-[#0f2d4a]">
                {paymentMethod === 'net_14' ? `Net ${creditDays} Trade Credit` : 'Immediate Payment'}
              </strong>
            </div>

            <div className="space-y-2 text-xs text-slate-600 pt-2">
              <div className="flex justify-between">
                <span>Subtotal ({safeCart.length} batches)</span>
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
              disabled={isSubmitting || (paymentMethod === 'net_14' && (!isCreditSufficient || !isNetTermsEligible)) || safeCart.length === 0}
              className="w-full py-3 bg-[#00c4a7] hover:bg-[#00b096] disabled:bg-slate-300 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all"
            >
              {isSubmitting 
                ? 'Processing Transaction...' 
                : paymentMethod === 'net_14' 
                  ? `Confirm Order on Net ${creditDays} Terms` 
                  : 'Proceed to Payment Gateway'
              }
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Checkout;