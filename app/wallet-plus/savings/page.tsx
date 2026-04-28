'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function WalletPlusSavingsPage() {
  const [savingType, setSavingType] = useState('monthly');
  const [savingAmount, setSavingAmount] = useState(0);
  const [targetAmount, setTargetAmount] = useState(0);
  const [contributionAmount, setContributionAmount] = useState(0);
  const [savings, setSavings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    loadSavings();
  }, []);

  const loadSavings = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      alert('Please login first');
      window.location.href = '/auth';
      return;
    }

    const email = session.user.email;

    const { data, error } = await supabase
      .from('wallet_savings')
      .select('*')
      .eq('user_email', email)
      .order('created_at', { ascending: false });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setSavings(data || []);
    setLoading(false);
  };

  const createSavingsPlan = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      alert('Please login first');
      window.location.href = '/auth';
      return;
    }

    const email = session.user.email;

    if (!savingAmount || savingAmount <= 0) {
      alert('Enter a valid saving amount');
      return;
    }

    if (!targetAmount || targetAmount <= 0) {
      alert('Enter a valid target amount');
      return;
    }

    if (targetAmount < savingAmount) {
      alert('Target amount should be greater than or equal to saving amount');
      return;
    }

    const { error } = await supabase.from('wallet_savings').insert([
      {
        user_email: email,
        saving_type: savingType,
        saving_amount: savingAmount,
        target_amount: targetAmount,
        current_saved: 0,
        locked: true,
        status: 'active',
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    alert('✅ Savings plan created!');
    setSavingAmount(0);
    setTargetAmount(0);
    loadSavings();
  };

  const payContribution = async (saving: any) => {
    setPaying(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      alert('Please login first');
      window.location.href = '/auth';
      return;
    }

    const email = session.user.email;

    const amountToPay = contributionAmount || Number(saving.saving_amount || 0);

    if (!amountToPay || amountToPay <= 0) {
      alert('Enter a valid contribution amount');
      setPaying(false);
      return;
    }

    const response = await fetch('/api/wallet-plus/paystack-init', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amountToPay,
        payment_type: 'savings_contribution',
        metadata: {
          savings_id: saving.id,
          saving_type: saving.saving_type,
          purpose: 'Wallet+ savings contribution',
        },
      }),
    });

    const data = await response.json();

    setPaying(false);

    if (!response.ok) {
      alert(data.error || 'Payment initialization failed');
      return;
    }

    window.location.href = data.authorization_url;
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Loading savings...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-3">💰 Wallet+ Savings</h1>

        <p className="text-gray-400 mb-8">
          Create a savings target and make secure contributions through Paystack.
          Your wallet stays locked until your target is reached.
        </p>

        <section className="bg-gray-900 p-5 rounded mb-8">
          <h2 className="text-xl font-bold mb-4">Create Savings Plan</h2>

          <select
            value={savingType}
            onChange={(e) => setSavingType(e.target.value)}
            className="w-full mb-3 p-3 rounded bg-black border border-gray-700"
          >
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
          </select>

          <input
            type="number"
            placeholder="Saving amount"
            value={savingAmount || ''}
            onChange={(e) => setSavingAmount(Number(e.target.value))}
            className="w-full mb-3 p-3 rounded bg-black border border-gray-700"
          />

          <input
            type="number"
            placeholder="Target amount"
            value={targetAmount || ''}
            onChange={(e) => setTargetAmount(Number(e.target.value))}
            className="w-full mb-4 p-3 rounded bg-black border border-gray-700"
          />

          <button
            onClick={createSavingsPlan}
            className="w-full bg-green-500 hover:bg-green-600 text-black py-3 rounded font-bold"
          >
            Create Savings Plan
          </button>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Your Savings Plans</h2>

          {savings.length === 0 ? (
            <div className="bg-gray-900 p-5 rounded text-gray-400">
              No savings plan yet.
            </div>
          ) : (
            <div className="space-y-4">
              {savings.map((saving) => {
                const currentSaved = Number(saving.current_saved || 0);
                const target = Number(saving.target_amount || 0);
                const progress =
                  target > 0 ? Math.min((currentSaved / target) * 100, 100) : 0;

                return (
                  <div key={saving.id} className="bg-gray-900 p-5 rounded">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-xl font-bold capitalize">
                          {saving.saving_type} Savings
                        </h3>

                        <p className="text-gray-400 text-sm">
                          Regular Amount: ₦
                          {Number(saving.saving_amount || 0).toLocaleString()}
                        </p>

                        <p className="text-gray-400 text-sm">
                          Target: ₦{target.toLocaleString()}
                        </p>

                        <p className="text-gray-400 text-sm">
                          Saved: ₦{currentSaved.toLocaleString()}
                        </p>

                        <p className="text-gray-400 text-sm">
                          Status: {saving.status}
                        </p>
                      </div>

                      <span
                        className={`text-sm px-3 py-1 rounded ${
                          saving.locked
                            ? 'bg-yellow-900 text-yellow-300'
                            : 'bg-green-900 text-green-300'
                        }`}
                      >
                        {saving.locked ? 'Locked' : 'Unlocked'}
                      </span>
                    </div>

                    <div className="w-full bg-gray-800 rounded h-3 mb-3">
                      <div
                        className="bg-green-500 h-3 rounded"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <p className="text-xs text-gray-400 mb-4">
                      Progress: {progress.toFixed(1)}%
                    </p>

                    {saving.status === 'active' && (
                      <div className="flex flex-col md:flex-row gap-3">
                        <input
                          type="number"
                          placeholder={`Contribution amount or default ₦${Number(
                            saving.saving_amount || 0
                          ).toLocaleString()}`}
                          onChange={(e) =>
                            setContributionAmount(Number(e.target.value))
                          }
                          className="flex-1 p-3 rounded bg-black border border-gray-700"
                        />

                        <button
                          onClick={() => payContribution(saving)}
                          disabled={paying}
                          className="bg-green-500 hover:bg-green-600 text-black px-5 py-3 rounded font-bold"
                        >
                          {paying ? 'Redirecting...' : 'Pay Contribution'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div className="mt-8 flex flex-col md:flex-row gap-3">
          <a
            href="/wallet-plus/dashboard"
            className="bg-gray-800 hover:bg-gray-700 px-4 py-3 rounded text-center font-bold"
          >
            Back to Dashboard
          </a>

          <a
            href="/wallet-plus/advance"
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-3 rounded text-center font-bold"
          >
            Request Advance
          </a>
        </div>
      </div>
    </main>
  );
}