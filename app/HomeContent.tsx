'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function HomeContent() {
  const searchParams = useSearchParams();
  const [ref, setRef] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: ""
  });

  useEffect(() => {
    const referral = searchParams.get("ref");
    if (referral) setRef(referral);
  }, [searchParams]);

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const referralCode =
      formData.name.slice(0, 3).toUpperCase() +
      Math.floor(Math.random() * 10000);

    const { error } = await supabase.from('waitlist_users').insert([
      {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        referral_code: referralCode,
        referred_by: ref || null,
      },
    ]);

    if (!error) {
      window.location.href = `/success?ref=${referralCode}`;
    } else {
      alert("❌ Error occurred. Try again.");
      console.error(error);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="flex flex-col items-center justify-center text-center px-6 py-20">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          💰 Turn Your Time Online Into Daily Income
        </h1>

        <p className="text-lg md:text-xl text-gray-300 max-w-2xl mb-6">
          SpinEarn™ by Spinbyte is a fintech-powered platform where you earn from referrals,
          content, and engagement.
        </p>

        <form onSubmit={handleSubmit} className="w-full max-w-md">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full mb-3 p-3 rounded bg-gray-900 border border-gray-700"
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full mb-3 p-3 rounded bg-gray-900 border border-gray-700"
          />

          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleChange}
            required
            className="w-full mb-3 p-3 rounded bg-gray-900 border border-gray-700"
          />

          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-3 rounded"
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