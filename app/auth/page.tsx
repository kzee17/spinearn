'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabase';

function AuthContent() {
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [ref, setRef] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const queryMode = searchParams.get('mode');
    const referral = searchParams.get('ref');

    if (queryMode === 'signup') setMode('signup');
    if (referral) setRef(referral);
  }, [searchParams]);

  const generateReferralCode = () => {
    const cleanName = name.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase();
    return `${cleanName || 'SPN'}${Date.now().toString().slice(-5)}`;
  };

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
      setLoading(false);
      alert(authError.message);
      return;
    }

    const referralCode = generateReferralCode();

    const { error: profileError } = await supabase
      .from('waitlist_users')
      .upsert(
        [
          {
            user_id: authData.user?.id || null,
            name: name.trim(),
            email: cleanEmail,
            phone: phone.trim(),
            referral_code: referralCode,
            referred_by: ref || null,
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

    alert('✅ Account created successfully. You can now login.');
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
        <h1 className="text-3xl font-bold mb-2 text-green-400">
          {mode === 'login' ? '🔐 Login to SpinEarn' : '🚀 Join SpinEarn'}
        </h1>

        <p className="text-gray-400 mb-6">
          {mode === 'login'
            ? 'Login with your email and password.'
            : 'Create your account and start using SpinEarn.'}
        </p>

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
          placeholder="Password minimum 6 characters"
          className="w-full mb-4 p-3 rounded bg-black border border-gray-700"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {mode === 'login' ? (
          <button
            onClick={signIn}
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-black py-3 rounded font-bold"
          >
            {loading ? 'Please wait...' : 'Login'}
          </button>
        ) : (
          <button
            onClick={signUp}
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 py-3 rounded font-bold"
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

        <div className="mt-6 bg-black/50 border border-gray-700 p-3 rounded">
          <p className="text-xs text-gray-300">
            🔒 Passwords are securely handled by Supabase Auth and are not
            stored in the SpinEarn user profile table.
          </p>
        </div>

        <div className="mt-6">
          <a href="/" className="text-gray-400 hover:text-green-400 text-sm">
            ← Back to Home
          </a>
        </div>
      </div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black text-white flex items-center justify-center">
          Loading...
        </main>
      }
    >
      <AuthContent />
    </Suspense>
  );
}