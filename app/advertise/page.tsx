'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdvertisePage() {
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [maxCompletions, setMaxCompletions] = useState(100);
  const [loading, setLoading] = useState(false);

  const costPerTask = 120;
  const rewardPerUser = 5;
  const totalAmount = Number(maxCompletions || 0) * costPerTask;

  const createCampaign = async () => {
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      alert('Please login first');
      window.location.href = '/auth';
      return;
    }

    const email = session.user.email;

    if (!title || !link || !maxCompletions || maxCompletions <= 0) {
      alert('Please complete all fields');
      setLoading(false);
      return;
    }

    const response = await fetch('/api/wallet-plus/paystack-init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        amount: totalAmount,
        payment_type: 'advert_task',
        metadata: {
          title,
          link,
          max_completions: maxCompletions,
          reward: rewardPerUser,
          purpose: 'Advertiser task campaign',
        },
      }),
    });

    const data = await response.json();

    setLoading(false);

    if (!response.ok) {
      alert(data.error || 'Payment initialization failed');
      return;
    }

    window.location.href = data.authorization_url;
  };

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-3">
          📢 Create Advert Campaign
        </h1>

        <p className="text-gray-400 mb-8">
          Pay to publish your social media page, website, product, or content as
          a paid task for SpinEarn members.
        </p>

        <section className="bg-gray-900 p-5 rounded mb-6">
          <input
            type="text"
            placeholder="Task title e.g. Follow our Instagram page"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full mb-3 p-3 rounded bg-black border border-gray-700"
          />

          <input
            type="url"
            placeholder="Target URL e.g. https://instagram.com/yourbrand"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="w-full mb-3 p-3 rounded bg-black border border-gray-700"
          />

          <input
            type="number"
            placeholder="Number of members to complete this task"
            value={maxCompletions || ''}
            onChange={(e) => setMaxCompletions(Number(e.target.value))}
            className="w-full mb-4 p-3 rounded bg-black border border-gray-700"
          />

          <div className="bg-black p-4 rounded mb-4 text-sm text-gray-300">
            <p>Cost per completed task: ₦{costPerTask.toLocaleString()}</p>
            <p>Member reward: {rewardPerUser} Spin Points</p>
            <p className="font-bold text-green-400 mt-2">
              Total Campaign Cost: ₦{totalAmount.toLocaleString()}
            </p>
          </div>

          <button
            onClick={createCampaign}
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 text-black py-3 rounded font-bold"
          >
            {loading ? 'Redirecting to Paystack...' : 'Pay & Launch Campaign'}
          </button>
        </section>

        <div className="bg-blue-950 border border-blue-700 p-4 rounded text-sm text-blue-100">
          <p className="font-bold mb-1">Advertiser Note</p>
          <p>
            Your campaign will go live automatically after payment confirmation.
            Members must complete the task and upload proof before earning.
          </p>
        </div>
      </div>
    </main>
  );
}