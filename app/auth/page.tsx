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

  // ================= LOGIN =================
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

  // ================= SIGNUP =================
  const signUp = async () => {
    if (!email || !password || !name || !phone) {
      alert('Please fill all fields');
      return;
    }

    if (password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const cleanEmail = email.toLowerCase().trim();

    // 🔍 Check if already exists
    const { data: existing } = await supabase
      .from('waitlist_users')
      .select('email')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existing) {
      alert('⚠️ User already exists. Please login.');
      setMode('login');
      setLoading(false);
      return;
    }

    // 🔐 Create auth user
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    const userId = data.user?.id;

    // 🎯 Create referral code
    const referralCode =
      name.slice(0, 3).toUpperCase() +
      Math.floor(Math.random() * 10000);

    // 🧾 Insert profile
    const { error: insertError } = await supabase
      .from('waitlist_users')
      .insert([
        {
          user_id: userId,
          name,
          email: cleanEmail,
          phone,
          referral_code: referralCode,
          spin_points: 0,
          balance_naira: 0,
          fraud_score: 0,
          fraud_status: 'clear',
        },
      ]);

    setLoading(false);

    if (insertError) {
      alert(insertError.message);
      return;
    }

    alert('✅ Account created successfully! You can now login.');
    setMode('login');
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <h1 className="text-3xl font-bold mb-6">
        {mode === 'login' ? '🔐 Login' : '🚀 Create Account'}
      </h1>

      <div className="w-full max-w-md">

        {/* SIGNUP ONLY FIELDS */}
        {mode === 'signup' && (
          <>
            <input
              type="text"
              placeholder="Full Name"
              className="w-full mb-3 p-3 rounded bg-gray-900"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              type="tel"
              placeholder="Phone Number"
              className="w-full mb-3 p-3 rounded bg-gray-900"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </>
        )}

        {/* COMMON FIELDS */}
        <input
          type="email"
          placeholder="Email"
          className="w-full mb-3 p-3 rounded bg-gray-900"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password (min 6 chars)"
          className="w-full mb-4 p-3 rounded bg-gray-900"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* LOGIN BUTTON */}
        {mode === 'login' ? (
          <button
            onClick={signIn}
            disabled={loading}
            className="w-full bg-green-500 py-3 rounded mb-2 font-bold"
          >
            {loading ? 'Please wait...' : 'Login'}
          </button>
        ) : (
          <button
            onClick={signUp}
            disabled={loading}
            className="w-full bg-blue-500 py-3 rounded mb-2 font-bold"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        )}

        {/* SWITCH MODE */}
        <button
          onClick={() =>
            setMode(mode === 'login' ? 'signup' : 'login')
          }
          className="text-sm text-green-400 underline mt-3"
        >
          {mode === 'login'
            ? 'New user? Create account'
            : 'Already have an account? Login'}
        </button>

        {/* BACK HOME */}
        <div className="mt-6">
          <a href="/" className="text-sm text-gray-400 hover:text-green-400">
            ← Back to Home
          </a>
        </div>
      </div>
    </main>
  );
}