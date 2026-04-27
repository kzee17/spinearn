'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [userTasks, setUserTasks] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      window.location.href = '/auth';
      return;
    }

    const email = session.user.email;

    const { data: admin } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (!admin) {
      alert('Access denied');
      window.location.href = '/';
      return;
    }

    await loadData();
    setLoading(false);
  };

  const loadData = async () => {
    const { data: u } = await supabase.from('waitlist_users').select('*');
    const { data: t } = await supabase.from('tasks').select('*');
    const { data: ut } = await supabase.from('user_tasks').select('*');

    const { data: w } = await supabase
      .from('withdrawals')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: a } = await supabase
      .from('wallet_advances')
      .select('*')
      .order('created_at', { ascending: false });

    setUsers(u || []);
    setTasks(t || []);
    setUserTasks(ut || []);
    setWithdrawals(w || []);
    setAdvances(a || []);
  };

  const totalEarnings = users.reduce(
    (sum, user) => sum + Number(user.balance_naira || 0),
    0
  );

  const detectFraud = () => {
    const ipMap: Record<string, number> = {};

    userTasks.forEach((task) => {
      if (!task.ip_address) return;
      ipMap[task.ip_address] = (ipMap[task.ip_address] || 0) + 1;
    });

    return Object.entries(ipMap).filter(([_, count]) => count > 5);
  };

  const fraudIPs = detectFraud();

  const approveWithdrawal = async (id: string) => {
    const { error } = await supabase
      .from('withdrawals')
      .update({ status: 'approved' })
      .eq('id', id);

    if (error) {
      alert(error.message);
      return;
    }

    alert('✅ Withdrawal approved');
    loadData();
  };

  const rejectWithdrawal = async (id: string) => {
    const { error } = await supabase
      .from('withdrawals')
      .update({ status: 'rejected' })
      .eq('id', id);

    if (error) {
      alert(error.message);
      return;
    }

    alert('❌ Withdrawal rejected');
    loadData();
  };

  const approveAdvance = async (advance: any) => {
    if (advance.status !== 'supporters_approved') {
      alert('Both supporters must approve before admin approval.');
      return;
    }

    const confirmApproval = confirm(
      `Approve and credit ₦${Number(advance.amount || 0).toLocaleString()} to ${advance.user_email}?`
    );

    if (!confirmApproval) return;

    const { error: advanceError } = await supabase
      .from('wallet_advances')
      .update({
        status: 'approved',
        admin_approved: true,
        disbursed: true,
        approved_at: new Date(),
        disbursed_at: new Date(),
      })
      .eq('id', advance.id);

    if (advanceError) {
      alert(advanceError.message);
      return;
    }

    const { data: member } = await supabase
      .from('wallet_members')
      .select('*')
      .eq('user_email', advance.user_email)
      .maybeSingle();

    if (member) {
      const { error: walletError } = await supabase
        .from('wallet_members')
        .update({
          wallet_balance:
            Number(member.wallet_balance || 0) + Number(advance.amount || 0),
        })
        .eq('user_email', advance.user_email);

      if (walletError) {
        alert(walletError.message);
        return;
      }
    }

    alert('✅ Advance approved and wallet credited');
    loadData();
  };

  const rejectAdvance = async (advanceId: string) => {
    const confirmReject = confirm('Reject this advance request?');
    if (!confirmReject) return;

    const { error } = await supabase
      .from('wallet_advances')
      .update({
        status: 'rejected',
        admin_approved: false,
        disbursed: false,
      })
      .eq('id', advanceId);

    if (error) {
      alert(error.message);
      return;
    }

    alert('❌ Advance rejected');
    loadData();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Loading admin dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-4xl font-bold mb-8">⚙️ Admin Dashboard</h1>

      {/* ANALYTICS */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">📊 Platform Analytics</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-900 p-4 rounded">👥 Users: {users.length}</div>
          <div className="bg-gray-900 p-4 rounded">📋 Tasks: {tasks.length}</div>
          <div className="bg-gray-900 p-4 rounded">
            ✅ Completions: {userTasks.length}
          </div>
          <div className="bg-gray-900 p-4 rounded">
            💰 Total Earnings: ₦{totalEarnings.toLocaleString()}
          </div>
        </div>
      </section>

      {/* FRAUD */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-red-400 mb-4">
          🚨 Fraud Detection
        </h2>

        {fraudIPs.length === 0 && (
          <div className="bg-gray-900 p-4 rounded text-gray-400">
            No suspicious IP activity detected.
          </div>
        )}

        {fraudIPs.map(([ip, count]) => (
          <div key={ip} className="bg-red-900 p-3 rounded mb-2">
            {ip} → {String(count)} actions
          </div>
        ))}
      </section>

      {/* PROOFS */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">📸 Task Proofs</h2>

        {userTasks.length === 0 && (
          <div className="bg-gray-900 p-4 rounded text-gray-400">
            No task proofs submitted yet.
          </div>
        )}

        {userTasks.map((task) => (
          <div key={task.id} className="bg-gray-900 p-4 rounded mb-3">
            <p>User: {task.user_email}</p>
            <p>Task ID: {task.task_id}</p>
            <p>Status: {task.status}</p>
            <p>IP: {task.ip_address || 'N/A'}</p>

            {task.proof_url ? (
              <a
                href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${task.proof_url}`}
                target="_blank"
                className="text-blue-400 underline"
              >
                View Proof
              </a>
            ) : (
              <p className="text-gray-500">No proof uploaded</p>
            )}
          </div>
        ))}
      </section>

      {/* ADVANCES */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">
          💳 Wallet+ Advance Requests
        </h2>

        {advances.length === 0 && (
          <div className="bg-gray-900 p-4 rounded text-gray-400">
            No advance requests yet.
          </div>
        )}

        {advances.map((advance) => (
          <div key={advance.id} className="bg-gray-900 p-4 mb-3 rounded">
            <p className="font-bold">{advance.user_email}</p>
            <p>Amount: ₦{Number(advance.amount || 0).toLocaleString()}</p>
            <p>
              Service Fee: ₦
              {Number(advance.service_fee || 0).toLocaleString()}
            </p>
            <p>
              Total Settlement: ₦
              {Number(advance.total_repay || 0).toLocaleString()}
            </p>
            <p>Duration: {advance.repayment_months} months</p>
            <p>Status: {advance.status}</p>

            <div className="text-sm text-gray-300 mt-2">
              <p>
                Supporter 1: {advance.supporter_one}{' '}
                {advance.supporter_one_approved ? '✅' : '⏳'}
              </p>
              <p>
                Supporter 2: {advance.supporter_two}{' '}
                {advance.supporter_two_approved ? '✅' : '⏳'}
              </p>
              <p>Admin Approved: {advance.admin_approved ? '✅' : '⏳'}</p>
              <p>Disbursed: {advance.disbursed ? '✅' : '⏳'}</p>
            </div>

            {advance.status === 'supporters_approved' && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => approveAdvance(advance)}
                  className="bg-green-500 hover:bg-green-600 text-black px-3 py-2 rounded font-bold"
                >
                  Approve & Credit Wallet
                </button>

                <button
                  onClick={() => rejectAdvance(advance.id)}
                  className="bg-red-500 hover:bg-red-600 px-3 py-2 rounded font-bold"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </section>

      {/* WITHDRAWALS */}
      <section>
        <h2 className="text-2xl font-bold mb-4">💰 Withdrawals</h2>

        {withdrawals.length === 0 && (
          <div className="bg-gray-900 p-4 rounded text-gray-400">
            No withdrawal requests yet.
          </div>
        )}

        {withdrawals.map((withdrawal) => (
          <div key={withdrawal.id} className="bg-gray-900 p-4 mb-3 rounded">
            <p>{withdrawal.user_email}</p>
            <p>₦{Number(withdrawal.amount || 0).toLocaleString()}</p>
            <p>Status: {withdrawal.status}</p>

            {withdrawal.status === 'pending' && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => approveWithdrawal(withdrawal.id)}
                  className="bg-green-500 hover:bg-green-600 text-black px-3 py-2 rounded font-bold"
                >
                  Approve
                </button>

                <button
                  onClick={() => rejectWithdrawal(withdrawal.id)}
                  className="bg-red-500 hover:bg-red-600 px-3 py-2 rounded font-bold"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </section>
    </main>
  );
}