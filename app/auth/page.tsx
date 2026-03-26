'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signUp = async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    // ✅ Create user in waitlist_users
    if (data.user) {
      await supabase.from('waitlist_users').insert([
        {
          email: data.user.email,
          spin_points: 0,
          balance_naira: 0,
        },
      ]);
    }

    alert('✅ Signup successful! You can now login.');
  };

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error) {
      window.location.href = '/tasks';
    } else {
      alert(error.message);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <h1 className="text-3xl font-bold mb-6">🔐 Login / Signup</h1>

      <div className="w-full max-w-md">
        <input
          type="email"
          placeholder="Email"
          className="w-full mb-3 p-3 rounded bg-gray-900"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-3 p-3 rounded bg-gray-900"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={signIn}
          className="w-full bg-green-500 py-3 rounded mb-2"
        >
          Login
        </button>

        <button
          onClick={signUp}
          className="w-full bg-blue-500 py-3 rounded"
        >
          Sign Up
        </button>
      </div>
    </main>
  );
}