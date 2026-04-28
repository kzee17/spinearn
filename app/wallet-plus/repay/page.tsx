'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function RepayAdvancePage() {
  const [advances, setAdvances] = useState<any[]>([]);
  const [repayments, setRepayments] = useState<any[]>([]);
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRepaymentData();
  }, []);

  const loadRepaymentData = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      alert('Please login first');
      window.location.href = '/auth';
      return;
    }

    const email = session.user.email || '';

    const { data: advancesData, error: advancesError } = await supabase
      .from('wallet_advances')
      .select('*')
      .eq('user_email', email)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (advancesError) {
      alert(advancesError.message);
      setLoading(false);
      return;
    }

    const { data: repaymentsData, error: repaymentsError } = await supabase
      .from('wallet_advance_repayments')
      .select('*')
      .eq('user_email', email)
      .order('created_at', { ascending: false });

    if (repaymentsError) {
      alert(repaymentsError.message);
      setLoading(false);
      return;
    }

    setAdvances(advancesData || []);
    setRepayments(repaymentsData || []);
    setLoading(false);
  };

  const getPaidAmount = (advanceId: string) => {
    return repayments
      .filter((item) => item.advance_id === advanceId && item.status === 'paid')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  };

  const handleAmountChange = (advanceId: string, value: number) => {
    setAmounts((prev) => ({
      ...prev,
      [advanceId]: value,
    }));
  };

  const submitRepayment = async (advance: any) => {
    const repayAmount = Number(amounts[advance.id] || 0);

    if (!repayAmount || repayAmount <= 0) {
      alert('Enter a valid repayment amount');
      return;
    }

    const paidAmount = getPaidAmount(advance.id);
    const totalRepay = Number(advance.total_repay || 0);
    const balance = totalRepay - paidAmount;

    if (repayAmount > balance) {
      alert(`You only need to repay ₦${balance.toLocaleString()}`);
      return;
    }

    const { error: repaymentError } = await supabase
      .from('wallet_advance_repayments')
      .insert([
        {
          advance_id: advance.id,
          user_email: advance.user_email,
          amount: repayAmount,
          status: 'paid',
        },
      ]);

    if (repaymentError) {
      alert(repaymentError.message);
      return;
    }

    const newPaidAmount = paidAmount + repayAmount;

    if (newPaidAmount >= totalRepay) {
      const { error: advanceError } = await supabase
        .from('wallet_advances')
        .update({
          status: 'settled',
          settled: true,
        })
        .eq('id', advance.id);

      if (advanceError) {
        alert(advanceError.message);
        return;
      }

      alert('✅ Advance fully settled!');
    } else {
      alert('✅ Repayment recorded successfully!');
    }

    setAmounts((prev) => ({
      ...prev,
      [advance.id]: 0,
    }));

    loadRepaymentData();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Loading repayment data...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-3">💳 Repay Wallet+ Advance</h1>

        <p className="text-gray-400 mb-8">
          Make repayments toward your approved Wallet+ advance. Once the total
          settlement amount is fully paid, the advance will be marked as settled.
        </p>

        {advances.length === 0 ? (
          <div className="bg-gray-900 p-5 rounded text-gray-400">
            You do not have any approved advance requiring repayment.
          </div>
        ) : (
          <div className="space-y-5">
            {advances.map((advance) => {
              const paidAmount = getPaidAmount(advance.id);
              const totalRepay = Number(advance.total_repay || 0);
              const balance = Math.max(totalRepay - paidAmount, 0);
              const progress =
                totalRepay > 0
                  ? Math.min((paidAmount / totalRepay) * 100, 100)
                  : 0;

              return (
                <div key={advance.id} className="bg-gray-900 p-5 rounded">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-xl font-bold">
                        ₦{Number(advance.amount || 0).toLocaleString()} Advance
                      </h2>

                      <p className="text-gray-400 text-sm">
                        Total Settlement: ₦{totalRepay.toLocaleString()}
                      </p>

                      <p className="text-gray-400 text-sm">
                        Paid: ₦{paidAmount.toLocaleString()}
                      </p>

                      <p className="text-gray-400 text-sm">
                        Balance: ₦{balance.toLocaleString()}
                      </p>
                    </div>

                    <span className="text-sm px-3 py-1 rounded bg-green-900 text-green-300 capitalize">
                      {advance.status}
                    </span>
                  </div>

                  <div className="w-full bg-gray-800 rounded h-3 mb-3">
                    <div
                      className="bg-green-500 h-3 rounded"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <p className="text-xs text-gray-400 mb-4">
                    Repayment progress: {progress.toFixed(1)}%
                  </p>

                  {balance > 0 && (
                    <div className="flex flex-col md:flex-row gap-3">
                      <input
                        type="number"
                        placeholder="Enter repayment amount"
                        value={amounts[advance.id] || ''}
                        onChange={(e) =>
                          handleAmountChange(
                            advance.id,
                            Number(e.target.value)
                          )
                        }
                        className="flex-1 p-3 rounded bg-black border border-gray-700"
                      />

                      <button
                        onClick={() => submitRepayment(advance)}
                        className="bg-green-500 hover:bg-green-600 text-black px-5 py-3 rounded font-bold"
                      >
                        Submit Repayment
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 flex flex-col md:flex-row gap-3">
          <a
            href="/wallet-plus/dashboard"
            className="bg-gray-800 hover:bg-gray-700 px-4 py-3 rounded text-center font-bold"
          >
            Back to Wallet+ Dashboard
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