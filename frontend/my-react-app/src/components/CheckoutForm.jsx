import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';

export const CheckoutForm = ({ orderId, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required', // Prevents automatic redirection if immediate authentication succeeds
    });

    if (error) {
      // Handles payment failures, card validation errors, or 3D Secure cancellation
      setErrorMessage(error.message || 'Payment processing failed. Please try again.');
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      setIsProcessing(false);
      if (onSuccess) {
        onSuccess(paymentIntent);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-1">
          Payment Details
        </h3>
        <p className="text-xs text-slate-500">
          Enter card or net banking details to clear order invoice.
        </p>
      </div>

      {/* Stripe Elements Container */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
        <PaymentElement 
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-medium">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={isProcessing || !stripe || !elements}
        className="w-full py-3.5 bg-[#00c4a7] hover:bg-[#00b096] disabled:bg-slate-300 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Authorizing Payment...</span>
          </>
        ) : (
          <span>Authorize & Pay Now</span>
        )}
      </button>
    </form>
  );
};