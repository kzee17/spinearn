'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function FraudPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      alert('Please login');
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

    loadUsers();
  };

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('waitlist_users')
      .select('*')
      .neq('fraud_status', 'clear')
      .order('fraud_score', { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setUsers(data || []);
    setLoading(false);
  };

  const resetUser = async (email: string) => {
    const confirmReset = confirm('Reset fraud status for this user?');
    if (!confirmReset) return;

    await supabase
      .from('waitlist_users')
      .update({
        fraud_score: 0,
        fraud_status: 'clear',
      })
      .eq('email', email);

    alert('User reset successfully');
    loadUsers();
  };

  const blockUser = async (email: string) => {
    const confirmBlock = confirm('Block this user?');
    if (!confirmBlock) return;

    await supabase
      .from('waitlist_users')
      .update({
        fraud_status: 'blocked',
      })
      .eq('email', email);

    alert('User blocked');
    loadUsers();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading fraud data...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-6xl mx-auto">

        <h1 className="text-3xl font-bold mb-6">
          🚨 Fraud Monitoring Dashboard
        </h1>

        {users.length === 0 ? (
          <div className="bg-gray-900 p-6 rounded text-gray-400">
            No suspicious users detected.
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.email} className="bg-gray-900 p-5 rounded">

                <div className="flex flex-col md:flex-row md:justify-between gap-4">
                  <div>
                    <h2 className="font-bold">{user.email}</h2>

                    <p className="text-sm text-gray-400">
                      Fraud Score: {user.fraud_score}
                    </p>

                    <p className="text-sm text-gray-400">
                      Status: {user.fraud_status}
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded text-sm ${
                      user.fraud_status === 'blocked'
                        ? 'bg-red-600'
                        : 'bg-yellow-600'
                    }`}
                  >
                    {user.fraud_status}
                  </span>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => resetUser(user.email)}
                    className="bg-green-500 px-4 py-2 rounded text-black font-bold"
                  >
                    Reset
                  </button>

                  <button
                    onClick={() => blockUser(user.email)}
                    className="bg-red-500 px-4 py-2 rounded font-bold"
                  >
                    Block
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

        <a
          href="/admin"
          className="inline-block mt-8 bg-gray-800 px-4 py-2 rounded"
        >
          ← Back to Admin
        </a>

      </div>
    </main>
  );
}