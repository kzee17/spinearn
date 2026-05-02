'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

const ADMIN_EMAIL = 'engrlawalko@gmail.com';

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState('');

  useEffect(() => {
    checkAdminAndLoadWithdrawals();
  }, []);

  const checkAdminAndLoadWithdrawals = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      alert('Please login first');
      window.location.href = '/auth';
      return;
    }

    const email = (session.user.email || '').toLowerCase().trim();
    setAdminEmail(email);

    if (email !== ADMIN_EMAIL) {
      alert('Access denied. This account is not an admin.');
      await supabase.auth.signOut();
      window.location.href = '/';
      return;
    }

    await loadWithdrawals();
    setLoading(false);
  };

  const loadWithdrawals = async () => {
    const { data, error } = await supabase
      .from('withdrawals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setWithdrawals(data || []);
  };

  const approveAndProcessWithdrawal = async (withdrawal: any) => {
    const confirmApproval = confirm(
      `Approve and process payment of ₦${Number(
        withdrawal.amount || 0
      ).toLocaleString()} to ${withdrawal.account_name}?`
    );

    if (!confirmApproval) return;

    setProcessingId(withdrawal.id);

    try {
      const response = await fetch('/api/admin/process-withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalId: withdrawal.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Withdrawal processing failed');
        setProcessingId(null);
        return;
      }

      alert('✅ Withdrawal approved and payment processing started.');
      await loadWithdrawals();
    } catch (error: any) {
      alert(error.message || 'Withdrawal processing failed');
    } finally {
      setProcessingId(null);
    }
  };

  const rejectWithdrawal = async (withdrawal: any) => {
    const confirmReject = confirm(
      `Reject withdrawal request of ₦${Number(
        withdrawal.amount || 0
      ).toLocaleString()} from ${withdrawal.user_email}?`
    );

    if (!confirmReject) return;

    const { error } = await supabase
      .from('withdrawals')
      .update({
        status: 'rejected',
        transfer_status: 'rejected',
      })
      .eq('id', withdrawal.id);

    if (error) {
      alert(error.message);
      return;
    }

    await supabase.from('notifications').insert([
      {
        user_email: withdrawal.user_email,
        title: 'Withdrawal Rejected',
        message: `Your withdrawal request of ₦${Number(
          withdrawal.amount || 0
        ).toLocaleString()} was rejected by admin.`,
      },
    ]);

    alert('❌ Withdrawal rejected.');
    loadWithdrawals();
  };

  const statusBadge = (status: string) => {
    if (status === 'approved' || status === 'success') {
      return 'bg-green-900 text-green-300';
    }

    if (status === 'rejected' || status === 'failed') {
      return 'bg-red-900 text-red-300';
    }

    if (status === 'processing') {
      return 'bg-blue-900 text-blue-300';
    }

    return 'bg-yellow-900 text-yellow-300';
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading withdrawals...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">💰 Admin Withdrawals</h1>
            <p className="text-gray-400 text-sm mt-1">
              Logged in as: {adminEmail}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href="/admin"
              className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded"
            >
              Admin Home
            </a>

            <button
              onClick={loadWithdrawals}
              className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded font-bold"
            >
              Refresh
            </button>

            <button
              onClick={handleLogout}
              className="bg-red-900 hover:bg-red-800 px-4 py-2 rounded font-bold"
            >
              Logout
            </button>
          </div>
        </div>

        {withdrawals.length === 0 ? (
          <div className="bg-gray-900 p-6 rounded text-gray-400">
            No withdrawal requests yet.
          </div>
        ) : (
          <div className="space-y-4">
            {withdrawals.map((withdrawal) => (
              <div
                key={withdrawal.id}
                className="bg-gray-900 border border-gray-800 p-5 rounded-xl"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div>
                    <h2 className="font-bold text-lg">
                      ₦{Number(withdrawal.amount || 0).toLocaleString()}
                    </h2>

                    <p className="text-gray-400 text-sm">
                      User: {withdrawal.user_email}
                    </p>

                    <p className="text-gray-400 text-sm">
                      Bank: {withdrawal.bank_name || 'N/A'}{' '}
                      {withdrawal.bank_code
                        ? `(${withdrawal.bank_code})`
                        : ''}
                    </p>

                    <p className="text-gray-400 text-sm">
                      Account Name: {withdrawal.account_name || 'N/A'}
                    </p>

                    <p className="text-gray-400 text-sm">
                      Account Number: {withdrawal.account_number || 'N/A'}
                    </p>

                    <p className="text-gray-500 text-xs mt-2">
                      Transfer Ref:{' '}
                      {withdrawal.transfer_reference || 'Not generated yet'}
                    </p>

                    {withdrawal.transfer_error && (
                      <p className="text-red-400 text-xs mt-1">
                        Error: {withdrawal.transfer_error}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 lg:items-end">
                    <span
                      className={`text-sm px-3 py-1 rounded capitalize ${statusBadge(
                        withdrawal.status || 'pending'
                      )}`}
                    >
                      Request: {withdrawal.status || 'pending'}
                    </span>

                    <span
                      className={`text-sm px-3 py-1 rounded capitalize ${statusBadge(
                        withdrawal.transfer_status || 'pending'
                      )}`}
                    >
                      Transfer: {withdrawal.transfer_status || 'pending'}
                    </span>

                    {withdrawal.status === 'pending' && (
                      <div className="flex flex-col sm:flex-row gap-2 mt-3">
                        <button
                          onClick={() => approveAndProcessWithdrawal(withdrawal)}
                          disabled={processingId === withdrawal.id}
                          className="bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black px-4 py-2 rounded font-bold"
                        >
                          {processingId === withdrawal.id
                            ? 'Processing...'
                            : 'Approve & Process Payment'}
                        </button>

                        <button
                          onClick={() => rejectWithdrawal(withdrawal)}
                          disabled={processingId === withdrawal.id}
                          className="bg-red-500 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded font-bold"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {withdrawal.status !== 'pending' && (
                      <p className="text-xs text-gray-500 mt-2">
                        Already {withdrawal.status}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}