'use client';

import { useState } from 'react';

export default function Advertise() {
  const [form, setForm] = useState({
    title: '',
    link: '',
    max_completions: 100,
  });

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePayment = async () => {
    const amount = form.max_completions * 120; // ₦120 per user

    const res = await fetch('/api/paystack-init', {
      method: 'POST',
      body: JSON.stringify({
        email: 'advertiser@email.com',
        amount,
        metadata: form,
      }),
    });

    const data = await res.json();

    window.location.href = data.authorization_url;
  };

  return (
    <main className="min-h-screen bg-black text-white p-10">

      <h1 className="text-3xl mb-6">🚀 Create Campaign</h1>

      <input
        name="title"
        placeholder="Task Title"
        onChange={handleChange}
        className="block mb-3 p-3 bg-gray-900 w-full"
      />

      <input
        name="link"
        placeholder="Task URL"
        onChange={handleChange}
        className="block mb-3 p-3 bg-gray-900 w-full"
      />

      <input
        name="max_completions"
        type="number"
        placeholder="Number of Users"
        onChange={handleChange}
        className="block mb-3 p-3 bg-gray-900 w-full"
      />

      <button
        onClick={handlePayment}
        className="bg-green-500 px-6 py-3 rounded"
      >
        Pay & Launch Campaign 💰
      </button>

    </main>
  );
}