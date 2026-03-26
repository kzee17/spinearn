'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function Wallet() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    // ❌ Not logged in → redirect
    if (!session) {
      window.location.href = '/auth';
      return;
    }

    const email = session.user.email;

    // ✅ Fetch user wallet
    const { data, error } = await supabase
      .from('waitlist_users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.error(error);
      return;
    }

    setUser(data);
  };

  // ⏳ Loading state
  if (!user) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">

      <h1 className="text-3xl font-bold mb-6">💼 Your Wallet</h1>

      <div className="bg-gray-900 p-6 rounded w-full max-w-md text-center">

        <p className="text-gray-400 mb-2">Spin Points</p>
        <h2 className="text-2xl font-bold text-green-400 mb-4">
          {user.spin_points}
        </h2>

        <p className="text-gray-400 mb-2">Balance (₦)</p>
        <h2 className="text-2xl font-bold">
          ₦{user.balance_naira}
        </h2>

      </div>

      <p className="text-sm text-gray-400 mt-4">
        1000 Spin Points = ₦1000
      </p>

    </main>
  );
}