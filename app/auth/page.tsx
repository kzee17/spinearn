'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const signUp = async () => {
    if (!name || !phone || !email || !password) {
      alert('Please fill all fields');
      return;
    }

    if (password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const cleanEmail = email.toLowerCase().trim();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
    });

    if (authError) {
      alert(authError.message);
      setLoading(false);
      return;
    }

    const referralCode =
      name.slice(0, 3).toUpperCase() + Math.floor(Math.random() * 10000);

    const { error: profileError } = await supabase
      .from('waitlist_users')
      .upsert(
        [
          {
            user_id: authData.user?.id || null,
            name,
            email: cleanEmail,
            phone,
            referral_code: referralCode,
            referred_by: null,
            spin_points: 0,
            balance_naira: 0,
            fraud_score: 0,
            fraud_status: 'clear',
          },
        ],
        { onConflict: 'email' }
      );

    setLoading(false);

    if (profileError) {
      alert(profileError.message);
      return;
    }

    alert('✅ Account created successfully. Please login.');
    setMode('login');
  };

  const signIn = async () => {
    if (!email || !password) {
      alert('Enter email and password');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    window.location.href = '/';
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h1 className="text-3xl font-bold mb-6 text-green-400">
          {mode === 'login' ? '🔐 Login to SpinEarn' : '🚀 Join SpinEarn'}
        </h1>

        {mode === 'signup' && (
          <>
            <input
              type="text"
              placeholder="Full Name"
              className="w-full mb-3 p-3 rounded bg-black border border-gray-700"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              type="tel"
              placeholder="Phone Number"
              className="w-full mb-3 p-3 rounded bg-black border border-gray-700"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </>
        )}

        <input
          type="email"
          placeholder="Email Address"
          className="w-full mb-3 p-3 rounded bg-black border border-gray-700"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-4 p-3 rounded bg-black border border-gray-700"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {mode === 'login' ? (
          <button
            onClick={signIn}
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 text-black py-3 rounded font-bold"
          >
            {loading ? 'Please wait...' : 'Login'}
          </button>
        ) : (
          <button
            onClick={signUp}
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 py-3 rounded font-bold"
          >
            {loading ? 'Creating account...' : 'Sign Up / Join Now'}
          </button>
        )}

        <button
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          className="mt-5 text-green-400 underline text-sm"
        >
          {mode === 'login'
            ? 'New user? Sign up / Join now'
            : 'Already have an account? Login'}
        </button>

        <div className="mt-6">
          <a href="/" className="text-gray-400 hover:text-green-400 text-sm">
            ← Back to Home
          </a>
        </div>
      </div>
    </main>
  );
}