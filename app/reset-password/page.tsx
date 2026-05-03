'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const updatePassword = async () => {
    if (!password || password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      alert('✅ Password updated successfully');
      window.location.href = '/auth';
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-gray-900 p-6 rounded-xl">
        <h1 className="text-2xl font-bold mb-4 text-green-400">
          🔐 Reset Password
        </h1>

        <input
          type="password"
          placeholder="New Password"
          className="w-full mb-4 p-3 rounded bg-black border border-gray-700"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={updatePassword}
          disabled={loading}
          className="w-full bg-green-500 py-3 rounded text-black font-bold"
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </div>
    </main>
  );
}