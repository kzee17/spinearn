'use client';

import { useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function SavingsPage() {

  const [amount, setAmount] = useState(0);
  const [target, setTarget] = useState(0);

  const createSavings = async () => {

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return alert("Login required");

    const email = session.user.email;

    const { error } = await supabase
      .from('wallet_savings')
      .insert([{
        user_email: email,
        saving_amount: amount,
        target_amount: target
      }]);

    if (error) return alert(error.message);

    alert("Savings plan created!");
  };

  return (
    <main className="p-6 text-white">

      <h1 className="text-3xl mb-4">💰 Create Savings Plan</h1>

      <input
        type="number"
        placeholder="Daily / Monthly Amount"
        onChange={(e) => setAmount(Number(e.target.value))}
        className="block mb-3 p-2 bg-gray-900"
      />

      <input
        type="number"
        placeholder="Target Amount"
        onChange={(e) => setTarget(Number(e.target.value))}
        className="block mb-3 p-2 bg-gray-900"
      />

      <button
        onClick={createSavings}
        className="bg-green-500 px-4 py-2"
      >
        Start Saving
      </button>

    </main>
  );
}