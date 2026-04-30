'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

export default function WalletPlusJoinPage() {
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState('');

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) setReferralCode(ref);
  }, [searchParams]);

  const activateWithPaystack = async () => {
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      alert('Please login first');
      window.location.href = '/auth';
      return;
    }

    const email = session.user.email;

    if (!email) {
      alert('Unable to detect your email.');
      setLoading(false);
      return;
    }

    const response = await fetch('/api/wallet-plus/paystack-init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        amount: 1000,
        payment_type: 'wallet_activation',
        metadata: {
          purpose: 'Wallet+ membership activation',
          referred_by: referralCode || null,
        },
      }),
    });

    const data = await response.json();

    setLoading(false);

    if (!response.ok) {
      alert(data.error || 'Payment initialization failed');
      return;
    }

    window.location.href = data.authorization_url;
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-4">💼 Activate Wallet+</h1>

        <p className="text-gray-400 mb-6">
          Pay ₦1,000 to activate your Wallet+ membership and unlock savings,
          advance request, rewards, and Wallet+ features.
        </p>

        <input
          type="text"
          placeholder="Referral Code (optional)"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
          className="w-full mb-4 p-3 rounded bg-gray-900 border border-gray-700"
        />

        <div className="bg-gray-900 p-5 rounded mb-6 text-left text-sm text-gray-300">
          <p className="mb-2">✅ Wallet+ membership activation</p>
          <p className="mb-2">✅ Access to savings plans</p>
          <p className="mb-2">✅ Access to advance request feature</p>
          <p className="mb-2">✅ Earn Spin Points from Wallet+ transactions</p>
          <p>✅ Referral reward eligibility</p>
        </div>

        <button
          onClick={activateWithPaystack}
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-600 text-black py-3 rounded font-bold"
        >
          {loading ? 'Redirecting to Paystack...' : 'Pay ₦1,000 & Activate'}
        </button>

        <a
          href="/wallet-plus/dashboard"
          className="block mt-4 text-green-400 underline"
        >
          Go to Wallet+ Dashboard
        </a>
      </div>
    </main>
  );
}