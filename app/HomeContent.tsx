'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function HomeContent() {
  const searchParams = useSearchParams();

  const [ref, setRef] = useState('');
  const [userCount, setUserCount] = useState(0);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  // Get referral
  useEffect(() => {
    const referral = searchParams.get('ref');
    if (referral) setRef(referral);
  }, [searchParams]);

  // Fetch total users
  useEffect(() => {
    const fetchCount = async () => {
      const { count } = await supabase
        .from('waitlist_users')
        .select('*', { count: 'exact', head: true });

      setUserCount(count || 0);
    };

    fetchCount();
  }, []);

  // Handle input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const referralCode =
        formData.name.slice(0, 3).toUpperCase() +
        Math.floor(Math.random() * 10000);

      // Check existing user
      const { data: existingUser } = await supabase
        .from('waitlist_users')
        .select('*')
        .eq('email', formData.email)
        .maybeSingle();

      if (existingUser) {
        alert("⚠️ You already joined. Please login.");
        window.location.href = '/auth';
        return;
      }

      // Insert user
      const { error } = await supabase.from('waitlist_users').insert([
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          referral_code: referralCode,
          referred_by: ref || null,
          spin_points: 0,
          balance_naira: 0,
        },
      ]);

      if (error) {
        alert(error.message);
        console.error(error);
        return;
      }

      // Redirect to success page
      window.location.href = `/success?ref=${referralCode}`;

    } catch (err) {
      console.error(err);
      alert("❌ Something went wrong");
    }
  };

  return (
    <main className="min-h-screen bg-black text-white">

      {/* HEADER */}
      <div className="w-full flex justify-between items-center px-6 py-4">

        <h1 className="text-xl font-bold text-green-400">
          SpinEarn
        </h1>

        <div className="flex gap-3">

          {/* Login */}
          <a
            href="/auth"
            className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded text-sm"
          >
            Login 🔐
          </a>

          {/* Admin */}
          <a
            href="/admin"
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded text-sm"
          >
            Admin ⚙️
          </a>

        </div>

      </div>

      {/* HERO */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-20">

        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          💰 Turn Your Time Online Into Daily Income
        </h1>

        {/* USER COUNT */}
        <p className="text-green-400 font-semibold mb-4">
          🔥 Join {userCount}+ users already earning on SpinEarn
        </p>

        <p className="text-lg text-gray-300 max-w-2xl mb-6">
          SpinEarn™ by Spinbyte is a fintech-powered platform where you earn from
          referrals, content, and engagement.
        </p>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="w-full max-w-md">

          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full mb-3 p-3 rounded bg-gray-900"
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full mb-3 p-3 rounded bg-gray-900"
          />

          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleChange}
            required
            className="w-full mb-3 p-3 rounded bg-gray-900"
          />

          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 py-3 rounded font-bold"
          >
            Join Waitlist 🚀
          </button>

        </form>

        <p className="text-sm text-gray-400 mt-4">
          🎁 Early users get exclusive earning bonuses
        </p>

      </section>

    </main>
  );
}