'use client';

import { useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function AdvancePage() {

  const [amount, setAmount] = useState(0);
  const [months, setMonths] = useState(3);
  const [support1, setSupport1] = useState('');
  const [support2, setSupport2] = useState('');

  const requestAdvance = async () => {

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return alert("Login required");

    const email = session.user.email;

    const fee = amount * 0.1;
    const total = amount + fee;

    const { error } = await supabase
      .from('wallet_advances')
      .insert([{
        user_email: email,
        amount,
        service_fee: fee,
        total_repay: total,
        repayment_months: months,
        supporter_one: support1,
        supporter_two: support2
      }]);

    if (error) return alert(error.message);

    alert("Advance request submitted!");
  };

  return (
    <main className="p-6 text-white">

      <h1 className="text-3xl mb-4">💳 Request Advance</h1>

      <input
        type="number"
        placeholder="Amount"
        onChange={(e) => setAmount(Number(e.target.value))}
        className="block mb-3 p-2 bg-gray-900"
      />

      <input
        type="number"
        placeholder="Repayment Months"
        onChange={(e) => setMonths(Number(e.target.value))}
        className="block mb-3 p-2 bg-gray-900"
      />

      <input
        type="email"
        placeholder="Supporter 1 Email"
        onChange={(e) => setSupport1(e.target.value)}
        className="block mb-3 p-2 bg-gray-900"
      />

      <input
        type="email"
        placeholder="Supporter 2 Email"
        onChange={(e) => setSupport2(e.target.value)}
        className="block mb-3 p-2 bg-gray-900"
      />

      <button
        onClick={requestAdvance}
        className="bg-yellow-500 px-4 py-2"
      >
        Request Advance
      </button>

    </main>
  );
}