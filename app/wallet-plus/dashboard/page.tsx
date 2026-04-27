'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function Dashboard() {

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return;

    const { data } = await supabase
      .from('wallet_members')
      .select('*')
      .eq('user_email', session.user.email)
      .single();

    setUser(data);
  };

  if (!user) return <div className="text-white">Loading...</div>;

  return (
    <main className="min-h-screen bg-black text-white p-6">

      <h1 className="text-3xl mb-6">💼 Wallet+ Dashboard</h1>

      <div className="bg-gray-900 p-4 mb-4">
        💰 Wallet Balance: ₦{user.wallet_balance}
      </div>

      <div className="bg-gray-900 p-4 mb-4">
        ⭐ Spin Points: {user.spin_points}
      </div>

      <div className="bg-gray-900 p-4 mb-4">
        📊 Status: {user.membership_status}
      </div>

    </main>
  );
}