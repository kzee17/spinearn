'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function WalletPage() {
  const [user, setUser] = useState<any>(null);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [amount, setAmount] = useState(0);
  const [bankName, setBankName] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      alert('Please login first');
      window.location.href = '/auth';
      return;
    }

    const email = session.user.email || '';

    const { data: userData, error: userError } = await supabase
      .from('waitlist_users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (userError) {
      alert(userError.message);
      setLoading(false);
      return;
    }

    if (!userData) {
      alert('User wallet not found. Please join from the landing page first.');
      window.location.href = '/';
      return;
    }

    const { data: withdrawalData } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_email', email)
      .order('created_at', { ascending: false });

    setUser(userData);
    setWithdrawals(withdrawalData || []);
    setLoading(false);
  };

  const submitWithdrawal = async () => {
    if (!user) return;

    if (user.fraud_status && user.fraud_status !== 'clear') {
      alert('Your account is under review. Withdrawal is temporarily disabled.');
      return;
    }

    if (!amount || amount <= 0) {
      alert('Enter a valid withdrawal amount.');
      return;
    }

    if (amount < 1000) {
      alert('Minimum withdrawal is ₦1,000.');
      return;
    }

    if (amount > Number(user.balance_naira || 0)) {
      alert('Insufficient balance.');
      return;
    }

    if (!bankName || !bankCode || !accountNumber || !accountName) {
      alert('Please complete all bank details.');
      return;
    }

    if (accountNumber.length < 10) {
      alert('Please enter a valid 10-digit account number.');
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from('withdrawals').insert([
      {
        user_email: user.email,
        amount,
        bank_name: bankName,
        bank_code: bankCode,
        account_number: accountNumber,
        account_name: accountName,
        status: 'pending',
        transfer_status: 'pending',
      },
    ]);

    setSubmitting(false);

    if (error) {
      alert(error.message);
      return;
    }

    await supabase.from('notifications').insert([
      {
        user_email: user.email,
        title: 'Withdrawal Requested',
        message: `Your withdrawal request of ₦${Number(
          amount
        ).toLocaleString()} has been submitted for admin approval.`,
      },
    ]);

    alert('✅ Withdrawal request submitted for admin approval.');

    setAmount(0);
    setBankName('');
    setBankCode('');
    setAccountNumber('');
    setAccountName('');

    loadWallet();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading wallet...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-3">💼 SpinEarn Wallet</h1>

        <p className="text-gray-400 mb-8">
          View your earned balance and submit withdrawal requests. Withdrawals
          are reviewed and processed securely by admin.
        </p>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 p-5 rounded">
            <p className="text-gray-400 text-sm">Available Balance</p>
            <h2 className="text-2xl font-bold text-green-400">
              ₦{Number(user.balance_naira || 0).toLocaleString()}
            </h2>
          </div>

          <div className="bg-gray-900 p-5 rounded">
            <p className="text-gray-400 text-sm">Spin Points</p>
            <h2 className="text-2xl font-bold text-yellow-400">
              {Number(user.spin_points || 0).toLocaleString()} pts
            </h2>
          </div>

          <div className="bg-gray-900 p-5 rounded">
            <p className="text-gray-400 text-sm">Fraud Status</p>
            <h2
              className={`text-2xl font-bold capitalize ${
                user.fraud_status === 'clear'
                  ? 'text-green-400'
                  : 'text-red-400'
              }`}
            >
              {user.fraud_status || 'clear'}
            </h2>
          </div>
        </section>

        <section className="bg-gray-900 p-6 rounded mb-8">
          <h2 className="text-2xl font-bold mb-4">Request Withdrawal</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="Withdrawal amount"
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full p-3 rounded bg-black border border-gray-700"
            />

            <input
              type="text"
              placeholder="Bank Name e.g. Access Bank"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full p-3 rounded bg-black border border-gray-700"
            />

            <input
              type="text"
              placeholder="Bank Code e.g. 044"
              value={bankCode}
              onChange={(e) => setBankCode(e.target.value)}
              className="w-full p-3 rounded bg-black border border-gray-700"
            />

            <input
              type="text"
              placeholder="Account Number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full p-3 rounded bg-black border border-gray-700"
            />

            <input
              type="text"
              placeholder="Account Name"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="w-full p-3 rounded bg-black border border-gray-700 md:col-span-2"
            />
          </div>

          <div className="bg-blue-950 border border-blue-700 text-blue-100 p-4 rounded mt-4 text-sm">
            <p className="font-bold mb-1">Withdrawal Notice</p>
            <p>
              Minimum withdrawal is ₦1,000. Withdrawals are subject to admin
              approval, fraud checks, and available wallet balance.
            </p>
          </div>

          <button
            onClick={submitWithdrawal}
            disabled={submitting}
            className="mt-4 w-full bg-green-500 hover:bg-green-600 text-black py-3 rounded font-bold"
          >
            {submitting ? 'Submitting...' : 'Submit Withdrawal Request'}
          </button>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Withdrawal History</h2>

          {withdrawals.length === 0 ? (
            <div className="bg-gray-900 p-5 rounded text-gray-400">
              No withdrawal request yet.
            </div>
          ) : (
            <div className="space-y-4">
              {withdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="bg-gray-900 p-5 rounded">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div>
                      <h3 className="font-bold">
                        ₦{Number(withdrawal.amount || 0).toLocaleString()}
                      </h3>

                      <p className="text-gray-400 text-sm">
                        Bank: {withdrawal.bank_name || 'N/A'}
                      </p>

                      <p className="text-gray-400 text-sm">
                        Account: {withdrawal.account_name || 'N/A'} -{' '}
                        {withdrawal.account_number || 'N/A'}
                      </p>

                      <p className="text-gray-400 text-sm">
                        Transfer Status:{' '}
                        {withdrawal.transfer_status || 'pending'}
                      </p>

                      {withdrawal.transfer_reference && (
                        <p className="text-gray-500 text-xs">
                          Ref: {withdrawal.transfer_reference}
                        </p>
                      )}
                    </div>

                    <span
                      className={`text-sm px-3 py-1 rounded capitalize ${
                        withdrawal.status === 'approved'
                          ? 'bg-green-900 text-green-300'
                          : withdrawal.status === 'rejected'
                          ? 'bg-red-900 text-red-300'
                          : 'bg-yellow-900 text-yellow-300'
                      }`}
                    >
                      {withdrawal.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="mt-8 flex flex-col md:flex-row gap-3">
          <a
            href="/tasks"
            className="bg-purple-500 hover:bg-purple-600 px-4 py-3 rounded text-center font-bold"
          >
            Earn More
          </a>

          <a
            href="/notifications"
            className="bg-blue-500 hover:bg-blue-600 px-4 py-3 rounded text-center font-bold"
          >
            Notifications
          </a>

          <a
            href="/"
            className="bg-gray-800 hover:bg-gray-700 px-4 py-3 rounded text-center font-bold"
          >
            Home
          </a>
        </div>
      </div>
    </main>
  );
}