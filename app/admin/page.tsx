'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [userTasks, setUserTasks] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      window.location.href = '/auth';
      return;
    }

    const email = session.user.email;

    const { data } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (!data) {
      alert("Access denied");
      window.location.href = '/';
      return;
    }

    setIsAdmin(true);
    await loadData();
    setLoading(false);
  };

  const loadData = async () => {
    const { data: u } = await supabase.from('waitlist_users').select('*');
    const { data: t } = await supabase.from('tasks').select('*');
    const { data: ut } = await supabase.from('user_tasks').select('*');
    const { data: w } = await supabase.from('withdrawals').select('*');

    setUsers(u || []);
    setTasks(t || []);
    setUserTasks(ut || []);
    setWithdrawals(w || []);
  };

  // 📊 Analytics
  const totalEarnings = users.reduce((sum, u) => sum + (u.balance_naira || 0), 0);

  // 🚨 Fraud Detection
  const detectFraud = () => {
    const ipMap: any = {};

    userTasks.forEach((t) => {
      if (!t.ip_address) return;

      ipMap[t.ip_address] = (ipMap[t.ip_address] || 0) + 1;
    });

    return Object.entries(ipMap).filter(([_, count]) => Number(count) > 5);
  };

  const fraudIPs = detectFraud();

  // 💰 Approve withdrawal
  const approveWithdrawal = async (id: string) => {
    await supabase
      .from('withdrawals')
      .update({ status: 'approved' })
      .eq('id', id);

    alert("✅ Approved");
    loadData();
  };

  // ❌ Reject withdrawal
  const rejectWithdrawal = async (id: string) => {
    await supabase
      .from('withdrawals')
      .update({ status: 'rejected' })
      .eq('id', id);

    alert("❌ Rejected");
    loadData();
  };

  if (loading) {
    return <div className="text-white text-center mt-10">Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">

      <h1 className="text-4xl mb-6">⚙️ Admin Dashboard</h1>

      {/* 📊 ANALYTICS */}
      <section className="mb-10">
        <h2 className="text-2xl mb-4">📊 Platform Analytics</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900 p-4">👥 Users: {users.length}</div>
          <div className="bg-gray-900 p-4">📋 Tasks: {tasks.length}</div>
          <div className="bg-gray-900 p-4">✅ Completions: {userTasks.length}</div>
          <div className="bg-gray-900 p-4">💰 Total Earnings: ₦{totalEarnings}</div>
        </div>
      </section>

      {/* 🚨 FRAUD */}
      <section className="mb-10">
        <h2 className="text-2xl text-red-400 mb-4">🚨 Fraud Detection</h2>

        {fraudIPs.length === 0 && <p>No suspicious activity</p>}

        {fraudIPs.map(([ip, count]) => (
          <div key={ip} className="bg-red-900 p-2 mb-2">
            {ip} → {String(count)} actions
          </div>
        ))}
      </section>

      {/* 📸 PROOFS */}
      <section className="mb-10">
        <h2 className="text-2xl mb-4">📸 Proof Submissions</h2>

        {userTasks.map((t) => (
          <div key={t.id} className="bg-gray-900 p-3 mb-3">

            <p>{t.user_email}</p>
            <p>Task ID: {t.task_id}</p>

            {t.proof_url && (
              <a
                href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${t.proof_url}`}
                target="_blank"
                className="text-blue-400 underline"
              >
                View Proof
              </a>
            )}

          </div>
        ))}
      </section>

      {/* 💰 WITHDRAWALS */}
      <section>
        <h2 className="text-2xl mb-4">💰 Withdrawals</h2>

        {withdrawals.map((w) => (
          <div key={w.id} className="bg-gray-900 p-3 mb-3">

            <p>{w.user_email}</p>
            <p>₦{w.amount}</p>
            <p>Status: {w.status}</p>

            {w.status === 'pending' && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => approveWithdrawal(w.id)}
                  className="bg-green-500 px-3 py-1 rounded"
                >
                  Approve
                </button>

                <button
                  onClick={() => rejectWithdrawal(w.id)}
                  className="bg-red-500 px-3 py-1 rounded"
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