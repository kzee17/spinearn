'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function Tasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔐 Check user + load tasks
  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      window.location.href = '/auth';
      return;
    }

    const email = session.user.email;
    setUserEmail(email || '');

    // 🔥 Ensure user exists
    let { data: user } = await supabase
      .from('waitlist_users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (!user) {
      await supabase.from('waitlist_users').insert([
        {
          email,
          spin_points: 0,
          balance_naira: 0,
        },
      ]);
    }

    await fetchTasks();
    await fetchCompletedTasks(email || '');

    setLoading(false);
  };

  // 📥 Get all tasks
  const fetchTasks = async () => {
    const { data, error } = await supabase.from('tasks').select('*');

    if (error) {
      console.error("Tasks error:", error);
    }

    setTasks(data || []);
  };

  // 📥 Get completed tasks
  const fetchCompletedTasks = async (email: string) => {
    const { data } = await supabase
      .from('user_tasks')
      .select('task_id')
      .eq('user_email', email);

    const ids = data?.map((t: any) => t.task_id) || [];
    setCompletedTasks(ids);
  };

  // ✅ Complete task
  const completeTask = async (task: any) => {
    if (!userEmail) return;

    // 🔍 Prevent duplicate
    const { data: existing } = await supabase
      .from('user_tasks')
      .select('*')
      .eq('user_email', userEmail)
      .eq('task_id', task.id)
      .maybeSingle();

    if (existing) {
      alert("⚠️ Already completed");
      return;
    }

    // Save task
    await supabase.from('user_tasks').insert([
      {
        user_email: userEmail,
        task_id: task.id,
        completed: true,
      },
    ]);

    // Update wallet
    const { data: user } = await supabase
      .from('waitlist_users')
      .select('*')
      .eq('email', userEmail)
      .maybeSingle();

    if (user) {
      await supabase
        .from('waitlist_users')
        .update({
          spin_points: user.spin_points + task.reward,
          balance_naira: user.balance_naira + task.reward,
        })
        .eq('email', userEmail);
    }

    // Update UI instantly
    setCompletedTasks((prev) => [...prev, task.id]);

    alert(`🎉 You earned ${task.reward} Spin Point`);
  };

  // ⏳ Loading
  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Loading tasks...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">

      <h1 className="text-4xl font-bold text-center mb-8">
        💰 Earn Spin Points
      </h1>

      {/* ❌ No tasks */}
      {tasks.length === 0 && (
        <p className="text-center text-gray-400">
          No tasks available yet.
        </p>
      )}

      {/* ✅ Tasks list */}
      <div className="max-w-xl mx-auto">
        {tasks.map((task) => {
          const done = completedTasks.includes(task.id);

          return (
            <div key={task.id} className="bg-gray-900 p-4 rounded mb-4">

              <h2 className="text-lg font-semibold">{task.title}</h2>

              <p className="text-sm text-gray-400 mb-2">
                Reward: {task.reward} points
              </p>

              <div className="flex gap-2">

                {/* Go button */}
                <a
                  href={task.link}
                  target="_blank"
                  className="bg-blue-500 px-4 py-2 rounded"
                >
                  Go
                </a>

                {/* Confirm button */}
                <button
                  disabled={done}
                  onClick={() => completeTask(task)}
                  className={`px-4 py-2 rounded ${
                    done
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-green-500 hover:bg-green-600'
                  }`}
                >
                  {done ? 'Completed' : 'Confirm'}
                </button>

              </div>

            </div>
          );
        })}
      </div>

    </main>
  );
}