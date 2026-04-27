'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function WalletPlusDashboard() {
  const [user, setUser] = useState<any>(null);
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
      window.location.href = '/auth';
      return;
    }

    const email = session.user.email;

    const { data: member } = await supabase
      .from('wallet_members')
      .select('*')
      .eq('user_email', email)
      .maybeSingle();

    if (!member) {
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

    setUser(member);
    setSavings(savingsData || []);
    setAdvances(advancesData || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading Wallet+ Dashboard...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-6">💼 Wallet+ Dashboard</h1>

      <section className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 p-4 rounded">
          <p className="text-gray-400">Membership Status</p>
          <h2 className="text-xl font-bold text-green-400">
            {user.membership_status}
          </h2>
        </div>

        <div className="bg-gray-900 p-4 rounded">
          <p className="text-gray-400">Wallet Balance</p>
          <h2 className="text-xl font-bold">₦{user.wallet_balance}</h2>
        </div>

        <div className="bg-gray-900 p-4 rounded">
          <p className="text-gray-400">Spin Points</p>
          <h2 className="text-xl font-bold text-yellow-400">
            {user.spin_points}
          </h2>
        </div>
      </section>

      <section className="flex flex-col md:flex-row gap-3 mb-8">
        <a
          href="/wallet-plus/savings"
          className="bg-green-500 hover:bg-green-600 text-black px-5 py-3 rounded font-bold text-center"
        >
          Start Savings 💰
        </a>

        <a
          href="/wallet-plus/advance"
          className="bg-yellow-500 hover:bg-yellow-600 text-black px-5 py-3 rounded font-bold text-center"
        >
          Request Advance 💳
        </a>

        <a
          href="/wallet"
          className="bg-blue-500 hover:bg-blue-600 px-5 py-3 rounded font-bold text-center"
        >
          Main Wallet 💼
        </a>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">📊 Savings Plans</h2>

        {savings.length === 0 ? (
          <p className="text-gray-400">No savings plan yet.</p>
        ) : (
          savings.map((plan) => (
            <div key={plan.id} className="bg-gray-900 p-4 rounded mb-3">
              <p>Saving Amount: ₦{plan.saving_amount}</p>
              <p>Target Amount: ₦{plan.target_amount}</p>
              <p>Current Saved: ₦{plan.current_saved}</p>
              <p>Status: {plan.status}</p>
              <p>Locked: {plan.locked ? 'Yes' : 'No'}</p>
            </div>
          ))
        )}
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">💳 Advance Requests</h2>

        {advances.length === 0 ? (
          <p className="text-gray-400">No advance request yet.</p>
        ) : (
          advances.map((advance) => (
            <div key={advance.id} className="bg-gray-900 p-4 rounded mb-3">
              <p>Amount: ₦{advance.amount}</p>
              <p>Service Fee: ₦{advance.service_fee}</p>
              <p>Total Repayable: ₦{advance.total_repay}</p>
              <p>Repayment Duration: {advance.repayment_months} months</p>
              <p>Supporter 1: {advance.supporter_one}</p>
              <p>Supporter 2: {advance.supporter_two}</p>
              <p>Status: {advance.status}</p>
            </div>
          ))
        )}
      </section>
    </main>
  );
}