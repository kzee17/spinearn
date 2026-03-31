'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [userTasks, setUserTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const ADMIN_EMAIL = "your@email.com";

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session || session.user.email !== ADMIN_EMAIL) {
      alert("Access denied");
      window.location.href = "/";
      return;
    }

    await loadData();
    setLoading(false);
  };

  const loadData = async () => {
    const { data: u } = await supabase.from('waitlist_users').select('*');
    const { data: w } = await supabase.from('withdrawals').select('*');
    const { data: t } = await supabase.from('tasks').select('*');
    const { data: ut } = await supabase.from('user_tasks').select('*');

    setUsers(u || []);
    setWithdrawals(w || []);
    setTasks(t || []);
    setUserTasks(ut || []);
  };

  // 🔥 FRAUD DETECTION
  const detectFraud = () => {
    const ipMap: any = {};

    userTasks.forEach((task) => {
      if (!task.ip_address) return;

      if (!ipMap[task.ip_address]) {
        ipMap[task.ip_address] = 1;
      } else {
        ipMap[task.ip_address]++;
      }
    });

    return Object.entries(ipMap).filter(([_, count]) => Number(count) > 5);
  };

  const fraudIPs = detectFraud();

  if (loading) return <div className="text-white">Loading...</div>;

  return (
    <main className="bg-black text-white min-h-screen p-6">

      <h1 className="text-4xl mb-6">⚙️ Admin Dashboard</h1>

      {/* 📊 ANALYTICS */}
      <section className="mb-10">
        <h2 className="text-2xl mb-2">📊 Platform Stats</h2>
        <p>Users: {users.length}</p>
        <p>Tasks: {tasks.length}</p>
        <p>Completions: {userTasks.length}</p>
        <p>Withdrawals: {withdrawals.length}</p>
      </section>

      {/* 🚨 FRAUD */}
      <section className="mb-10">
        <h2 className="text-2xl mb-2 text-red-400">🚨 Suspicious IPs</h2>

        {fraudIPs.length === 0 && <p>No fraud detected</p>}

        {fraudIPs.map(([ip, count]) => (
          <div key={ip} className="bg-red-900 p-2 mb-2">
            {ip} → {String(count)} activities
          </div>
        ))}
      </section>

      {/* 📸 PROOF VIEW */}
      <section className="mb-10">
        <h2 className="text-2xl mb-4">📸 Task Proofs</h2>

        {userTasks.map((t) => (
          <div key={t.id} className="bg-gray-900 p-3 mb-3">

            <p>{t.user_email}</p>
            <p>{t.task_id}</p>

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
            {w.user_email} - ₦{w.amount} ({w.status})
          </div>
        ))}
      </section>

    </main>
  );
}