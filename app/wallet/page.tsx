'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function Wallet() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = '/auth';
      return;
    }

    const { data } = await supabase
      .from('waitlist_users')
      .select('*')
      .eq('email', user.email)
      .single();

    setUser(data);
  };

  if (!user) return <p className="text-white text-center mt-10">Loading...</p>;

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <h1 className="text-3xl mb-6">💼 Wallet</h1>

      <div className="bg-gray-900 p-6 rounded text-center">
        <p>Spin Points</p>
        <h2 className="text-2xl text-green-400">{user.spin_points}</h2>

        <p className="mt-4">Balance</p>
        <h2 className="text-2xl">₦{user.balance_naira}</h2>
      </div>
    </main>
  );
}