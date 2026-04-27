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

    if (!session) {
      alert('Login required');
      window.location.href = '/auth';
      return;
    }

    const email = session.user.email;

    if (!amount || amount <= 0) {
      alert('Enter a valid amount');
      return;
    }

    if (![3, 6, 9, 12].includes(months)) {
      alert('Repayment period must be 3, 6, 9, or 12 months');
      return;
    }

    if (!support1 || !support2) {
      alert('Two supporters are required');
      return;
    }

    if (support1 === support2 || support1 === email || support2 === email) {
      alert('Supporters must be different members and cannot be yourself');
      return;
    }

    // Check active unpaid advance
    const { data: activeAdvance } = await supabase
      .from('wallet_advances')
      .select('*')
      .eq('user_email', email)
      .in('status', ['pending', 'approved'])
      .maybeSingle();

    if (activeAdvance) {
      alert('You already have an active advance request. Please settle it first.');
      return;
    }

    // Get member savings
    const { data: savings } = await supabase
      .from('wallet_savings')
      .select('*')
      .eq('user_email', email)
      .eq('status', 'active');

    const totalSaved =
      savings?.reduce((sum, item) => sum + Number(item.current_saved || 0), 0) || 0;

    if (totalSaved <= 0) {
      alert('You need active savings before requesting an advance.');
      return;
    }

    const maxAdvance = totalSaved * 2;

    if (amount > maxAdvance) {
      alert(`Maximum advance allowed is ₦${maxAdvance.toLocaleString()}`);
      return;
    }

    // Each supporter must have at least 50% of requested amount
    const requiredSupporterBalance = amount * 0.5;

    const { data: supporterOneSavings } = await supabase
      .from('wallet_savings')
      .select('*')
      .eq('user_email', support1)
      .eq('status', 'active');

    const { data: supporterTwoSavings } = await supabase
      .from('wallet_savings')
      .select('*')
      .eq('user_email', support2)
      .eq('status', 'active');

    const supporterOneTotal =
      supporterOneSavings?.reduce((sum, item) => sum + Number(item.current_saved || 0), 0) || 0;

    const supporterTwoTotal =
      supporterTwoSavings?.reduce((sum, item) => sum + Number(item.current_saved || 0), 0) || 0;

    if (supporterOneTotal < requiredSupporterBalance) {
      alert(`Supporter 1 must have at least ₦${requiredSupporterBalance.toLocaleString()} savings.`);
      return;
    }

    if (supporterTwoTotal < requiredSupporterBalance) {
      alert(`Supporter 2 must have at least ₦${requiredSupporterBalance.toLocaleString()} savings.`);
      return;
    }

    const serviceFee = Math.round(amount * 0.1);
    const totalRepay = amount + serviceFee;

    const { error } = await supabase.from('wallet_advances').insert([
      {
        user_email: email,
        amount,
        service_fee: serviceFee,
        total_repay: totalRepay,
        repayment_months: months,
        supporter_one: support1,
        supporter_two: support2,
        status: 'pending',
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    alert('✅ Advance request submitted for admin/supporter review.');
    window.location.href = '/wallet-plus/dashboard';
  };

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">💳 Request Advance</h1>

        <p className="text-gray-400 mb-6">
          You may request up to 2× your active Wallet+ savings. Two supporters are required, and each must have at least 50% of your requested amount in active savings.
        </p>

        <input
          type="number"
          placeholder="Advance Amount"
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full mb-3 p-3 rounded bg-gray-900"
        />

        <select
          value={months}
          onChange={(e) => setMonths(Number(e.target.value))}
          className="w-full mb-3 p-3 rounded bg-gray-900"
        >
          <option value={3}>3 months</option>
          <option value={6}>6 months</option>
          <option value={9}>9 months</option>
          <option value={12}>12 months</option>
        </select>

        <input
          type="email"
          placeholder="Supporter 1 Email"
          onChange={(e) => setSupport1(e.target.value)}
          className="w-full mb-3 p-3 rounded bg-gray-900"
        />

        <input
          type="email"
          placeholder="Supporter 2 Email"
          onChange={(e) => setSupport2(e.target.value)}
          className="w-full mb-4 p-3 rounded bg-gray-900"
        />

        <div className="bg-gray-900 p-4 rounded mb-4 text-sm text-gray-300">
          <p>Service fee: 10%</p>
          <p>Requested amount: ₦{amount.toLocaleString()}</p>
          <p>Total settlement: ₦{(amount + Math.round(amount * 0.1)).toLocaleString()}</p>
        </div>

        <button
          onClick={requestAdvance}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black py-3 rounded font-bold"
        >
          Submit Advance Request
        </button>
      </div>
    </main>
  );
}