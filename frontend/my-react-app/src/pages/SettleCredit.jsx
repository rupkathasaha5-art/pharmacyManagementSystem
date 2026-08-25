import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import axios from 'axios';
import { AppContext } from '../context/AppContext.jsx';
import { stripePromise } from '../utils/stripe.js';
import { CheckoutForm } from '../components/CheckoutForm.jsx';

const SettleCredit = () => {
  const navigate = useNavigate();
  const { backendUrl, setUserData } = useContext(AppContext);

  const [clientSecret, setClientSecret] = useState('');
  const [amountDue, setAmountDue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [settlementSuccess, setSettlementSuccess] = useState(false);

  useEffect(() => {
    const initSettlementSession = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await axios.post(
          `${backendUrl}/api/v1/payments/settlement/create-intent`,
          {},
          { withCredentials: true }
        );

        if (response.data?.data?.clientSecret) {
          setClientSecret(response.data.data.clientSecret);
          setAmountDue(response.data.data.amountDue);
        } else {
          throw new Error('Failed to retrieve client secret from gateway.');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Could not initialize settlement session.');
      } finally {
        setLoading(false);
      }
    };

    initSettlementSession();
  }, [backendUrl]);

  const handleSettlementSuccess = async (paymentIntent) => {
    try {
      setLoading(true);

      const response = await axios.post(
        `${backendUrl}/api/v1/payments/settlement/verify`,
        { paymentIntentId: paymentIntent.id },
        { withCredentials: true }
      );

      if (response.data?.data?.org && setUserData) {
        setUserData((prev) => {
          const orgKey = prev?.org ? 'org' : 'organization';
          const updatedUser = { ...prev, [orgKey]: response.data.data.org };
          localStorage.setItem('userData', JSON.stringify(updatedUser));
          return updatedUser;
        });
      }

      setSettlementSuccess(true);
      setTimeout(() => navigate('/dashboard/wallet'), 3000);
    } catch (err) {
      setError('Payment went through, but settlement verification failed. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-medium">Preparing your settlement payment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-red-50 border border-red-200 rounded-xl text-center">
        <h3 className="text-lg font-bold text-red-700 mb-2">Settlement Session Error</h3>
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <button
          onClick={() => navigate('/dashboard/wallet')}
          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
        >
          Return to Financial HUD
        </button>
      </div>
    );
  }

  if (settlementSuccess) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-green-50 border border-green-200 rounded-xl text-center shadow-sm">
        <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
          ✓
        </div>
        <h2 className="text-2xl font-bold text-green-800 mb-2">Balance Settled!</h2>
        <p className="text-sm text-green-700 mb-4">Your outstanding trade credit balance has been cleared.</p>
        <p className="text-xs text-gray-500">Redirecting to your Financial HUD...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto my-10 px-4">
      {amountDue !== null && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex justify-between text-base font-semibold text-gray-900">
            <span>Settling Outstanding Balance:</span>
            <span>₹{amountDue.toFixed(2)}</span>
          </div>
        </div>
      )}

      {clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm orderId={null} onSuccess={handleSettlementSuccess} />
        </Elements>
      )}
    </div>
  );
};

export default SettleCredit;