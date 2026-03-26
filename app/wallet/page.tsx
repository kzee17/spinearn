'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function Wallet() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  // 🔐 Check auth + load user
  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      window.location.href = '/auth';
      return;
    }

    const email = session.user.email;

    // 🔍 Try fetch user
    let { data } = await supabase
      .from('waitlist_users')
      .select('*')
      .eq('email', email)
      .single();

    // 🔥 Auto create if not exist
    if (!data) {
      const { data: newUser } = await supabase
        .from('waitlist_users')
        .insert([
          {
            email,
            spin_points: 0,
            balance_naira: 0,
          },
        ])
        .select()
        .single();

      setUser(newUser);
    } else {
      setUser(data);
    }

    setLoading(false);
  };

  // 💰 Withdraw function
  const handleWithdraw = async () => {
    if (!user) return;

    if (user.spin_points < 1000) {
      alert("⚠️ Minimum withdrawal is 1000 Spin Points");
      return;
    }

    const confirmWithdraw = confirm(
      `Withdraw ₦${user.balance_naira}?`
    );

    if (!confirmWithdraw) return;

    const { error } = await supabase.from('withdrawals').insert([
      {
        user_email: user.email,
        amount: user.balance_naira,
        status: 'pending',
      },
    ]);

    if (error) {
      console.error(error);
      alert("❌ Withdrawal failed");
      return;
    }

    // Reset wallet after request
    await supabase
      .from('waitlist_users')
      .update({
        spin_points: 0,
        balance_naira: 0,
      })
      .eq('email', user.email);

    alert("✅ Withdrawal request submitted!");

    // Refresh UI
    window.location.reload();
  };

  // ⏳ Loading UI
  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Loading wallet...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Error loading user</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">

      <h1 className="text-3xl font-bold mb-6">💼 Your Wallet</h1>

      <div className="bg-gray-900 p-6 rounded w-full max-w-md text-center">

        {/* Spin Points */}
        <p className="text-gray-400 mb-2">Spin Points</p>
        <h2 className="text-3xl font-bold text-green-400 mb-4">
          {user.spin_points}
        </h2>

        {/* Balance */}
        <p className="text-gray-400 mb-2">Balance (₦)</p>
        <h2 className="text-2xl font-bold">
          ₦{user.balance_naira}
        </h2>

      </div>

      {/* Withdraw Button */}
      <button
        onClick={handleWithdraw}
        className="mt-6 bg-green-500 hover:bg-green-600 px-6 py-3 rounded font-bold"
      >
        Withdraw 💰
      </button>

      {/* Info */}
      <p className="text-sm text-gray-400 mt-4 text-center">
        Minimum withdrawal: 1000 Spin Points (₦1000)
      </p>

    </main>
  );
}