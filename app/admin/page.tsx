'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const ADMIN_EMAIL = "engrlawalko@gmail.com"; // 🔥 CHANGE THIS

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session || session.user.email !== ADMIN_EMAIL) {
      alert("Access denied");
      window.location.href = '/';
      return;
    }

    await loadData();
    setLoading(false);
  };

  const loadData = async () => {
    // Users
    const { data: usersData } = await supabase
      .from('waitlist_users')
      .select('*');

    setUsers(usersData || []);

    // Withdrawals
    const { data: withdrawalData } = await supabase
      .from('withdrawals')
      .select('*')
      .order('created_at', { ascending: false });

    setWithdrawals(withdrawalData || []);

    // Tasks
    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*');

    setTasks(tasksData || []);
  };

  // ✅ Approve withdrawal
  const approveWithdrawal = async (id: string) => {
    await supabase
      .from('withdrawals')
      .update({ status: 'approved' })
      .eq('id', id);

    alert("✅ Withdrawal approved");
    loadData();
  };

  // ❌ Reject withdrawal
  const rejectWithdrawal = async (id: string) => {
    await supabase
      .from('withdrawals')
      .update({ status: 'rejected' })
      .eq('id', id);

    alert("❌ Withdrawal rejected");
    loadData();
  };

  if (loading) {
    return <div className="text-white text-center mt-10">Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">

      <h1 className="text-4xl font-bold mb-10 text-center">
        ⚙️ Admin Dashboard
      </h1>

      {/* USERS */}
      <section className="mb-10">
        <h2 className="text-2xl mb-4">👥 Users ({users.length})</h2>

        {users.map((user) => (
          <div key={user.id} className="bg-gray-900 p-3 mb-2 rounded">
            {user.email} | ₦{user.balance_naira} | {user.spin_points} pts
          </div>
        ))}
      </section>

      {/* WITHDRAWALS */}
      <section className="mb-10">
        <h2 className="text-2xl mb-4">💰 Withdrawals</h2>

        {withdrawals.map((w) => (
          <div key={w.id} className="bg-gray-900 p-4 mb-3 rounded">

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

      {/* TASKS */}
      <section>
        <h2 className="text-2xl mb-4">📋 Tasks</h2>

        {tasks.map((task) => (
          <div key={task.id} className="bg-gray-900 p-3 mb-2 rounded">
            {task.title} | Reward: {task.reward}
          </div>
        ))}
      </section>

    </main>
  );
}