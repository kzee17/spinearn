'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function WalletPlusDashboard() {
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
      alert('Please activate Wallet+ membership first.');
      window.location.href = '/wallet-plus/policy';
      return;
    }

    const { data: savingsData, error: savingsError } = await supabase
      .from('wallet_savings')
      .select('*')
      .eq('user_email', email)
      .order('created_at', { ascending: false });

    if (savingsError) {
      console.error('Savings error:', savingsError);
    }

    const { data: advanceData, error: advanceError } = await supabase
      .from('wallet_advances')
      .select('*')
      .eq('user_email', email)
      .order('created_at', { ascending: false });

    if (advanceError) {
      console.error('Advance error:', advanceError);
    }

    setMember(memberData);
    setSavings(savingsData || []);
    setAdvances(advanceData || []);
    setLoading(false);
  };

  const totalSaved = savings.reduce(
    (sum, item) => sum + (item.current_saved || 0),
    0
  );

  const activeSavings = savings.find((item) => item.status === 'active');
  const activeAdvance = advances.find(
    (item) => item.status === 'pending' || item.status === 'active'
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Loading Wallet+ Dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-5xl mx-auto">

        <div className="mb-8">
          <h1 className="text-3xl font-bold">💼 Wallet+ Dashboard</h1>
          <p className="text-gray-400 mt-2">
            Manage your Wallet+ membership, savings, advances, and rewards.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 p-5 rounded">
            <p className="text-gray-400 text-sm">Membership</p>
            <h2 className="text-xl font-bold text-green-400 capitalize">
              {member.membership_status}
            </h2>
          </div>

          <div className="bg-gray-900 p-5 rounded">
            <p className="text-gray-400 text-sm">Wallet Balance</p>
            <h2 className="text-xl font-bold">
              ₦{member.wallet_balance || 0}
            </h2>
          </div>

          <div className="bg-gray-900 p-5 rounded">
            <p className="text-gray-400 text-sm">Total Saved</p>
            <h2 className="text-xl font-bold">
              ₦{totalSaved}
            </h2>
          </div>

          <div className="bg-gray-900 p-5 rounded">
            <p className="text-gray-400 text-sm">Spin Points</p>
            <h2 className="text-xl font-bold text-yellow-400">
              {member.spin_points || 0}
            </h2>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 mb-10">
          <a
            href="/wallet-plus/savings"
            className="bg-green-500 hover:bg-green-600 text-black px-5 py-3 rounded font-bold text-center"
          >
            Create Savings Plan 💰
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
            Main Wallet
          </a>
        </div>

        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">📊 Active Savings</h2>

          {!activeSavings && (
            <div className="bg-gray-900 p-5 rounded text-gray-400">
              No active savings plan yet.
            </div>
          )}

          {activeSavings && (
            <div className="bg-gray-900 p-5 rounded">
              <p>
                Saving Amount:{' '}
                <span className="font-bold">₦{activeSavings.saving_amount}</span>
              </p>
              <p>
                Target Amount:{' '}
                <span className="font-bold">₦{activeSavings.target_amount}</span>
              </p>
              <p>
                Current Saved:{' '}
                <span className="font-bold text-green-400">
                  ₦{activeSavings.current_saved}
                </span>
              </p>
              <p>
                Status:{' '}
                <span className="font-bold capitalize">
                  {activeSavings.status}
                </span>
              </p>
              <p>
                Locked:{' '}
                <span className="font-bold">
                  {activeSavings.locked ? 'Yes' : 'No'}
                </span>
              </p>
            </div>
          )}
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">💳 Active Advance</h2>

          {!activeAdvance && (
            <div className="bg-gray-900 p-5 rounded text-gray-400">
              No active advance request.
            </div>
          )}

          {activeAdvance && (
            <div className="bg-gray-900 p-5 rounded">
              <p>
                Requested Amount:{' '}
                <span className="font-bold">₦{activeAdvance.amount}</span>
              </p>
              <p>
                Service Fee:{' '}
                <span className="font-bold">₦{activeAdvance.service_fee}</span>
              </p>
              <p>
                Total Repayable:{' '}
                <span className="font-bold text-yellow-400">
                  ₦{activeAdvance.total_repay}
                </span>
              </p>
              <p>
                Repayment Months:{' '}
                <span className="font-bold">
                  {activeAdvance.repayment_months}
                </span>
              </p>
              <p>
                Status:{' '}
                <span className="font-bold capitalize">
                  {activeAdvance.status}
                </span>
              </p>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">📜 Recent Savings Plans</h2>

          {savings.length === 0 && (
            <div className="bg-gray-900 p-5 rounded text-gray-400">
              No savings record yet.
            </div>
          )}

          {savings.map((item) => (
            <div key={item.id} className="bg-gray-900 p-4 rounded mb-3">
              <p>Amount: ₦{item.saving_amount}</p>
              <p>Target: ₦{item.target_amount}</p>
              <p>Saved: ₦{item.current_saved}</p>
              <p>Status: {item.status}</p>
            </div>
          ))}
        </section>

      </div>
    </main>
  );
}