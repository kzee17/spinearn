'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function AdvertiserDashboard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [email, setEmail] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      window.location.href = '/auth';
      return;
    }

    const userEmail = session.user.email || '';
    setEmail(userEmail);

    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('advertiser_email', userEmail)
      .order('created_at', { ascending: false });

    setTasks(data || []);
  };

  const totalSpend = tasks.reduce((sum, t) => sum + (t.cost_per_task || 0) * (t.max_completions || 0), 0);

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">

      <h1 className="text-3xl font-bold mb-6">
        📊 Advertiser Dashboard
      </h1>

      <div className="grid grid-cols-3 gap-4 mb-6">

        <div className="bg-gray-900 p-4 rounded">
          <p>Total Campaigns</p>
          <h2 className="text-2xl font-bold">{tasks.length}</h2>
        </div>

        <div className="bg-gray-900 p-4 rounded">
          <p>Total Spend</p>
          <h2 className="text-2xl font-bold">₦{totalSpend}</h2>
        </div>

        <div className="bg-gray-900 p-4 rounded">
          <p>Total Completions</p>
          <h2 className="text-2xl font-bold">
            {tasks.reduce((sum, t) => sum + (t.current_completions || 0), 0)}
          </h2>
        </div>

      </div>

      {tasks.map(task => (
        <div key={task.id} className="bg-gray-900 p-4 rounded mb-4">

          <h2 className="font-bold">{task.title}</h2>
          <p className="text-sm text-gray-400">{task.link}</p>

          <div className="mt-2 text-sm">
            <p>Clicks: {task.clicks || 0}</p>
            <p>Completed: {task.current_completions}/{task.max_completions}</p>
            <p>Status: {task.status}</p>
          </div>

        </div>
      ))}

    </main>
  );
}