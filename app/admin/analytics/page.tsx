'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function Analytics() {
  const [payments, setPayments] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const { data: pay } = await supabase.from('wallet_payments').select('*');
    const { data: t } = await supabase.from('tasks').select('*');

    setPayments(pay || []);
    setTasks(t || []);
  };

  const revenue = payments
    .filter(p => p.payment_type === 'advert_task')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <main className="bg-black text-white p-6">

      <h1 className="text-2xl mb-6">📈 Revenue Analytics</h1>

      <div className="grid grid-cols-3 gap-4">

        <div className="bg-gray-900 p-4">
          <p>Total Revenue</p>
          <h2>₦{revenue}</h2>
        </div>

        <div className="bg-gray-900 p-4">
          <p>Total Tasks</p>
          <h2>{tasks.length}</h2>
        </div>

        <div className="bg-gray-900 p-4">
          <p>Total Advertisers</p>
          <h2>
            {[...new Set(tasks.map(t => t.advertiser_email))].length}
          </h2>
        </div>

      </div>

    </main>
  );
}