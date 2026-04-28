'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

export default function DashboardContent() {
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get('payment');

  const [member, setMember] = useState<any>(null);
  const [savings, setSavings] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      alert('Please login first');
      window.location.href = '/auth';
      return;
    }

    const email = session.user.email;

    const { data: memberData, error: memberError } = await supabase
      .from('wallet_members')
      .select('*')
      .eq('user_email', email)
      .maybeSingle();

    if (memberError) {
      console.error('Member error:', memberError);
      alert(memberError.message);
      setLoading(false);
      return;
    }

    if (!memberData) {
      alert('Wallet+ membership not found. Please activate your membership.');
      window.location.href = '/wallet-plus/policy';
      return;
    }

    const { data: savingsData } = await supabase
      .from('wallet_savings')
      .select('*')
      .eq('user_email', email)
      .order('created_at', { ascending: false });

    const { data: advancesData } = await supabase
      .from('wallet_advances')
      .select('*')
      .eq('user_email', email)
      .order('created_at', { ascending: false });

    setMember(memberData);
    setSavings(savingsData || []);
    setAdvances(advancesData || []);
    setLoading(false);
  };

  const totalSaved = savings.reduce(
    (sum, item) => sum + (Number(item.current_saved) || 0),
    0
  );

  const totalTargets = savings.reduce(
    (sum, item) => sum + (Number(item.target_amount) || 0),
    0
  );

  const activeAdvance = advances.find(
    (item) => item.status === 'pending' || item.status === 'approved'
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Loading Wallet+ dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-8">
      <section className="max-w-5xl mx-auto mb-8">
        <h1 className="text-3xl md:text-4xl font-bold">
          💼 Wallet+ Dashboard
        </h1>

        <p className="text-gray-400 mt-2">
          Manage your Wallet+ membership, savings, advance requests,
          repayments, and SpinEarn points.
        </p>
      </section>

      <section className="max-w-5xl mx-auto mb-8">
        {paymentStatus === 'success' && (
          <div className="bg-green-900 border border-green-600 text-green-200 p-4 rounded mb-4">
            ✅ Payment successful. Your Wallet+ record has been updated.
          </div>
        )}

        {paymentStatus === 'failed' && (
          <div className="bg-red-900 border border-red-600 text-red-200 p-4 rounded mb-4">
            ❌ Payment failed or was not verified. Please try again.
          </div>
        )}

        {paymentStatus === 'already_verified' && (
          <div className="bg-blue-900 border border-blue-600 text-blue-200 p-4 rounded mb-4">
            ℹ️ This payment has already been verified.
          </div>
        )}

        {paymentStatus === 'error' && (
          <div className="bg-yellow-900 border border-yellow-600 text-yellow-200 p-4 rounded mb-4">
            ⚠️ Payment verification encountered an error. Contact support if payment was deducted.
          </div>
        )}

        {paymentStatus === 'env_error' && (
          <div className="bg-red-900 border border-red-600 text-red-200 p-4 rounded mb-4">
            ❌ Payment configuration error. Please contact admin.
          </div>
        )}

        {paymentStatus === 'no_reference' && (
          <div className="bg-yellow-900 border border-yellow-600 text-yellow-200 p-4 rounded mb-4">
            ⚠️ Payment reference was missing. Please try again.
          </div>
        )}
      </section>

      <section className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 p-5 rounded">
          <p className="text-gray-400 text-sm">Membership Status</p>
          <h2 className="text-xl font-bold capitalize">
            {member.membership_status || 'pending'}
          </h2>
        </div>

        <div className="bg-gray-900 p-5 rounded">
          <p className="text-gray-400 text-sm">Wallet Balance</p>
          <h2 className="text-xl font-bold">
            ₦{Number(member.wallet_balance || 0).toLocaleString()}
          </h2>
        </div>

        <div className="bg-gray-900 p-5 rounded">
          <p className="text-gray-400 text-sm">Total Saved</p>
          <h2 className="text-xl font-bold text-green-400">
            ₦{totalSaved.toLocaleString()}
          </h2>
        </div>

        <div className="bg-gray-900 p-5 rounded">
          <p className="text-gray-400 text-sm">Spin Points</p>
          <h2 className="text-xl font-bold text-yellow-400">
            {Number(member.spin_points || 0).toLocaleString()} pts
          </h2>
        </div>
      </section>

      <section className="max-w-5xl mx-auto mb-8">
        <div className="bg-blue-950 border border-blue-700 p-4 rounded text-sm text-blue-100">
          <p className="font-bold mb-1">Wallet+ Rule Summary</p>
          <p>
            Wallet+ is a digital wallet and engagement feature. It is not a
            bank, investment platform, or guaranteed return system. Advance
            requests are subject to membership status, savings history,
            supporter validation, service fee, and admin approval.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto mb-8">
        <h2 className="text-2xl font-bold mb-4">🚀 Quick Actions</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <a href="/wallet-plus/join" className="bg-green-500 hover:bg-green-600 text-black px-4 py-3 rounded text-center font-bold">
            Activate Wallet+
          </a>

          <a href="/wallet-plus/savings" className="bg-green-700 hover:bg-green-800 text-white px-4 py-3 rounded text-center font-bold">
            Savings Contribution
          </a>

          <a href="/wallet-plus/advance" className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-3 rounded text-center font-bold">
            Request Advance
          </a>

          <a href="/wallet-plus/supporter" className="bg-orange-500 hover:bg-orange-600 text-black px-4 py-3 rounded text-center font-bold">
            Supporter Requests
          </a>

          <a href="/wallet-plus/repay" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded text-center font-bold">
            Repay Advance
          </a>

          <a href="/tasks" className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded text-center font-bold">
            Earn More Spin Points
          </a>

          <a href="/wallet" className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded text-center font-bold">
            Main Wallet
          </a>

          <a href="/leaderboard" className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded text-center font-bold">
            View Leaderboard
          </a>
        </div>
      </section>

      <section className="max-w-5xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">💰 Savings Plans</h2>
          <p className="text-gray-400 text-sm">
            Target Total: ₦{totalTargets.toLocaleString()}
          </p>
        </div>

        {savings.length === 0 ? (
          <div className="bg-gray-900 p-5 rounded text-gray-400">
            No savings plan yet. Click <strong>Savings Contribution</strong> to
            create your first Wallet+ plan.
          </div>
        ) : (
          <div className="space-y-4">
            {savings.map((item) => {
              const target = Number(item.target_amount || 0);
              const saved = Number(item.current_saved || 0);
              const progress =
                target > 0 ? Math.min((saved / target) * 100, 100) : 0;

              return (
                <div key={item.id} className="bg-gray-900 p-5 rounded">
                  <h3 className="font-bold capitalize">
                    {item.saving_type || 'Savings Plan'}
                  </h3>

                  <p className="text-gray-400 text-sm">
                    Amount: ₦{Number(item.saving_amount || 0).toLocaleString()} | Target: ₦{target.toLocaleString()}
                  </p>

                  <div className="w-full bg-gray-800 rounded h-3 my-2">
                    <div className="bg-green-500 h-3 rounded" style={{ width: `${progress}%` }} />
                  </div>

                  <p className="text-sm text-gray-400">
                    Saved: ₦{saved.toLocaleString()} / ₦{target.toLocaleString()} ({progress.toFixed(1)}%)
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="max-w-5xl mx-auto mb-8">
        <h2 className="text-2xl font-bold mb-4">💳 Advance Requests</h2>

        {activeAdvance && (
          <div className="bg-yellow-950 border border-yellow-700 p-4 rounded mb-4 text-sm">
            ⚠️ You currently have an active or pending advance request.
          </div>
        )}

        {advances.length === 0 ? (
          <div className="bg-gray-900 p-5 rounded text-gray-400">
            No advance request yet.
          </div>
        ) : (
          <div className="space-y-4">
            {advances.map((item) => (
              <div key={item.id} className="bg-gray-900 p-5 rounded">
                <h3 className="font-bold">
                  ₦{Number(item.amount || 0).toLocaleString()} Advance
                </h3>

                <p className="text-gray-400 text-sm">
                  Service Fee: ₦{Number(item.service_fee || 0).toLocaleString()} | Total Settlement: ₦{Number(item.total_repay || 0).toLocaleString()}
                </p>

                <p className="text-gray-400 text-sm">
                  Duration: {item.repayment_months} months
                </p>

                <p className="text-gray-400 text-sm">
                  Status: {item.status}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}