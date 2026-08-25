import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import axios from 'axios';
import { AppContext } from '../context/AppContext.jsx';
import { stripePromise } from '../utils/stripe.js';
import { CheckoutForm } from '../components/CheckoutForm.jsx';

const PaymentPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { backendUrl, setCart, refreshCart } = useContext(AppContext);

  const [clientSecret, setClientSecret] = useState('');
  const [orderSummary, setOrderSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) {
      setError('Invalid payment session: No order ID found.');
      setLoading(false);
      return;
    }

    const initPaymentSession = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await axios.post(
          `${backendUrl}/api/v1/payments/create-intent`,
          { orderId },
          { withCredentials: true }
        );

        if (response.data?.data?.clientSecret) {
          setClientSecret(response.data.data.clientSecret);
          setOrderSummary(response.data.data.orderSummary || null);
        } else {
          throw new Error('Failed to retrieve client secret from gateway.');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Could not initialize payment session.');
      } finally {
        setLoading(false);
      }
    };

    initPaymentSession();
  }, [orderId, backendUrl]);

  const handlePaymentSuccess = async (paymentIntent) => {
    try {
      setLoading(true); // Keep the spinner up while we verify — no separate inline success screen anymore

      const response = await axios.post(
        `${backendUrl}/api/v1/payments/verify`,
        { paymentIntentId: paymentIntent.id, orderId },
        { withCredentials: true }
      );

      const updatedOrder = response.data?.data?.order;

      // Clear cart now that payment is genuinely confirmed
      setCart([]);
      localStorage.removeItem('cart');
      refreshCart();

      // Same snapshot shape Checkout.jsx builds for net_14 — one unified
      // confirmation page for both payment paths, instead of two different
      // success screens depending on how the order was paid.
      const completedOrderSnapshot = {
        orderId: orderId,
        invoiceNumber: updatedOrder?.invoiceNumber || orderId,
        deliveryOtp: updatedOrder?.deliveryOtp || null,
        total: updatedOrder?.orderTotal ?? orderSummary?.total,
        dueDate: updatedOrder?.dueDate || null,
      };

      navigate(`/order-confirmation/${orderId}`, {
        state: {
          orderComplete: completedOrderSnapshot,
          paymentMethod: 'immediate',
        },
      });
    } catch (err) {
      console.error('❌ [VERIFICATION ERROR]:', err.response?.data || err.message);
      setError('Payment went through, but verification failed on our server. Please contact support.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-medium">Communicating with secure gateway...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-red-50 border border-red-200 rounded-xl text-center">
        <h3 className="text-lg font-bold text-red-700 mb-2">Payment Session Error</h3>
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
        >
          Return to Checkout
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto my-10 px-4">
      {orderSummary && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Order Reference:</span>
            <span className="font-mono font-medium text-gray-900">{orderId}</span>
          </div>
          <div className="flex justify-between text-base font-semibold text-gray-900">
            <span>Amount Payable:</span>
            <span>₹{orderSummary.total?.toFixed(2)}</span>
          </div>
        </div>
      )}

      {clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm orderId={orderId} onSuccess={handlePaymentSuccess} />
        </Elements>
      )}
    </div>
  );
};

export default PaymentPage;