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
  const [paymentSuccess, setPaymentSuccess] = useState(false);

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
        console.error('❌ [INIT PAYMENT ERROR]:', err.response?.data || err.message);
        setError(err.response?.data?.message || 'Could not initialize payment session.');
      } finally {
        setLoading(false);
      }
    };

    initPaymentSession();
  }, [orderId, backendUrl]);

  const handlePaymentSuccess = (paymentIntent) => {
    setPaymentSuccess(true);

    // Clear cart in local state & storage once order is settled
    setCart([]);
    localStorage.removeItem('cart');
    refreshCart();

    // Redirect user to order summary or invoice after 3 seconds
    setTimeout(() => {
      navigate(`/orders/${orderId}`);
    }, 3000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-medium">Securing payment gateway...</p>
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

  if (paymentSuccess) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-green-50 border border-green-200 rounded-xl text-center shadow-sm">
        <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
          ✓
        </div>
        <h2 className="text-2xl font-bold text-green-800 mb-2">Payment Successful!</h2>
        <p className="text-sm text-green-700 mb-4">
          Your transaction has been confirmed. Updating inventory and generating your tax invoice...
        </p>
        <p className="text-xs text-gray-500">Redirecting to order details...</p>
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