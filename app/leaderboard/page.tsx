'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<any[]>([]);

  useEffect(() => {
    fetchLeaders();
  }, []);

  const fetchLeaders = async () => {
    const { data } = await supabase
      .from('waitlist_users')
      .select('name, spin_points')
      .order('spin_points', { ascending: false })
      .limit(10);

    setLeaders(data || []);
  };

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <h1 className="text-4xl text-center mb-6">🏆 Leaderboard</h1>

      {leaders.map((user, i) => (
        <div key={i} className="bg-gray-900 p-4 mb-3 rounded flex justify-between">
          <span>{i + 1}. {user.name || "User"}</span>
          <span>{user.spin_points} pts</span>
        </div>
      ))}
    </main>
  );
}