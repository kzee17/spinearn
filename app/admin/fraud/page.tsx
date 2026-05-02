'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

const ADMIN_EMAIL = 'engrlawalko@gmail.com';

export default function FraudPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState('');

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      alert('Please login');
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

    await loadUsers();
    setLoading(false);
  };

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('waitlist_users')
      .select('*')
      .neq('fraud_status', 'clear')
      .order('fraud_score', { ascending: false });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setUsers(data || []);
  };

  const resetUser = async (email: string) => {
    const confirmReset = confirm('Reset fraud status for this user?');
    if (!confirmReset) return;

    const { error } = await supabase
      .from('waitlist_users')
      .update({
        fraud_score: 0,
        fraud_status: 'clear',
      })
      .eq('email', email);

    if (error) {
      alert(error.message);
      return;
    }

    alert('User reset successfully');
    loadUsers();
  };

  const blockUser = async (email: string) => {
    const confirmBlock = confirm('Block this user?');
    if (!confirmBlock) return;

    const { error } = await supabase
      .from('waitlist_users')
      .update({
        fraud_status: 'blocked',
      })
      .eq('email', email);

    if (error) {
      alert(error.message);
      return;
    }

    alert('User blocked');
    loadUsers();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">🚨 Fraud Monitoring Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">
              Logged in as: {adminEmail}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a href="/admin" className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded">
              Admin Home
            </a>
            <a href="/admin/proofs" className="bg-green-500 hover:bg-green-600 text-black px-4 py-2 rounded font-bold">
              Proofs
            </a>
            <button
              onClick={handleLogout}
              className="bg-red-900 hover:bg-red-800 px-4 py-2 rounded font-bold"
            >
              Logout
            </button>
          </div>
        </div>

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
                      Fraud Score: {user.fraud_score || 0}
                    </p>

                    <p className="text-sm text-gray-400">
                      Status: {user.fraud_status || 'clear'}
                    </p>

                    <p className="text-sm text-gray-400">
                      Balance: ₦{Number(user.balance_naira || 0).toLocaleString()}
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded text-sm h-fit ${
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
                    className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded text-black font-bold"
                  >
                    Reset
                  </button>

                  <button
                    onClick={() => blockUser(user.email)}
                    className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded font-bold"
                  >
                    Block
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}