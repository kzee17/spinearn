'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const setupRecoverySession = async () => {
      const hash = window.location.hash;

      if (!hash) {
        setReady(true);
        return;
      }

      const params = new URLSearchParams(hash.replace('#', ''));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const type = params.get('type');

      if (type === 'recovery' && accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          alert(error.message);
        }

        window.history.replaceState({}, document.title, '/reset-password');
      }

      setReady(true);
    };

    setupRecoverySession();
  }, []);

  const updatePassword = async () => {
    if (!password || password.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert('✅ Password updated successfully. Please login.');
    await supabase.auth.signOut();
    window.location.href = '/auth';
  };

  if (!ready) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Preparing password reset...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h1 className="text-3xl font-bold text-green-400 mb-2">
          🔐 Reset Password
        </h1>

        <p className="text-gray-400 mb-6">
          Enter your new password below.
        </p>

        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-3 p-3 rounded bg-black border border-gray-700"
        />

        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full mb-4 p-3 rounded bg-black border border-gray-700"
        />

        <button
          onClick={updatePassword}
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-black py-3 rounded font-bold"
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>

        <a
          href="/auth"
          className="inline-block mt-5 text-sm text-gray-400 hover:text-green-400"
        >
          ← Back to Login
        </a>
      </div>
    </main>
  );
}