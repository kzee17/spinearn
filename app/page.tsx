'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Home() {
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

  // Handle input changes
  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submit
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

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: ""
      });
    } else {
      alert("❌ Error occurred. Try again.");
      console.error(error);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white">

      {/* HERO SECTION */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-20">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          💰 Turn Your Time Online Into Daily Income
        </h1>

        <p className="text-lg md:text-xl text-gray-300 max-w-2xl mb-6">
          SpinEarn™ by Spinbyte is a fintech-powered platform where you earn from referrals,
          content, and engagement.
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

          {/* Hidden referral */}
          <input type="hidden" value={ref} />

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

      {/* HOW IT WORKS */}
      <section className="px-6 py-16 bg-gray-950 text-center">
        <h2 className="text-3xl font-bold mb-10">How SpinEarn Works</h2>

        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-2">1. Sign Up</h3>
            <p>Create your account in seconds</p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">2. Engage & Share</h3>
            <p>Watch content, invite friends, and interact</p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">3. Earn Daily</h3>
            <p>Convert your activity into real income</p>
          </div>
        </div>
      </section>

      {/* EARNING SECTION */}
      <section className="px-6 py-16 text-center">
        <h2 className="text-3xl font-bold mb-10">Multiple Ways to Earn</h2>

        <div className="grid md:grid-cols-4 gap-6 text-gray-300">
          <div>🔁 Referral Rewards</div>
          <div>🎬 Content Creation</div>
          <div>❤️ Engagement Rewards</div>
          <div>💼 Sponsored Campaigns</div>
        </div>
      </section>

      {/* TRUST SECTION */}
      <section className="px-6 py-16 bg-gray-950 text-center">
        <h2 className="text-3xl font-bold mb-6">
          Built for Trust & Transparency
        </h2>

        <p className="text-gray-400 max-w-xl mx-auto">
          Secure wallet system, verified payouts, and a transparent earning
          structure powered by Spinbyte International Ltd.
        </p>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 py-20 text-center">
        <h2 className="text-4xl font-bold mb-4">
          🔥 Don’t Miss Out — Early Users Earn More
        </h2>

        <p className="text-gray-400 mb-6">
          Join the waitlist today and secure your early access spot.
        </p>

        <a
          href="#"
          className="bg-green-500 hover:bg-green-600 text-black px-6 py-3 rounded font-bold"
        >
          Join Now
        </a>
      </section>

      {/* FOOTER */}
      <footer className="text-center text-gray-500 py-6 text-sm">
        © {new Date().getFullYear()} SpinEarn™ — A Product of Spinbyte International Ltd
      </footer>

    </main>
  );
}