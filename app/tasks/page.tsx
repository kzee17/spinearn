'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function Tasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Anti-cheat states
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    init();
  }, []);

  // INIT
  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      window.location.href = '/auth';
      return;
    }

    const email = session.user.email;
    setUserEmail(email || '');

    // Ensure user exists
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

  // Fetch tasks
  const fetchTasks = async () => {
    const { data, error } = await supabase.from('tasks').select('*');

    if (error) {
      console.error("Tasks error:", error);
    }

    setTasks(data || []);
  };

  // Fetch completed tasks
  const fetchCompletedTasks = async (email: string) => {
    const { data } = await supabase
      .from('user_tasks')
      .select('task_id')
      .eq('user_email', email);

    const ids = data?.map((t: any) => t.task_id) || [];
    setCompletedTasks(ids);
  };

  // START TASK
  const startTask = (taskId: string, link: string) => {
    setActiveTask(taskId);
    setTimer(10);

    window.open(link, '_blank');

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // COMPLETE TASK (ANTI-CHEAT FULL)
  const completeTask = async (task: any) => {
    if (!userEmail) return;

    // ⏳ Timer check
    if (timer > 0) {
      alert("⏳ Please wait before confirming");
      return;
    }

    // 🔍 Duplicate check
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

    // 🚫 DAILY LIMIT CHECK (10 per day)
    const today = new Date().toISOString().split('T')[0];

    const { data: todayTasks } = await supabase
      .from('user_tasks')
      .select('*')
      .eq('user_email', userEmail)
      .gte('created_at', today);

    if ((todayTasks?.length || 0) >= 10) {
      alert("⚠️ Daily limit reached (10 tasks)");
      return;
    }

    // 🌐 GET IP ADDRESS
    let ip = '';
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const json = await res.json();
      ip = json.ip;
    } catch (err) {
      console.error("IP fetch error", err);
    }

    // 📱 DEVICE INFO
    const device = navigator.userAgent;

    // ✅ SAVE TASK COMPLETION
    await supabase.from('user_tasks').insert([
      {
        user_email: userEmail,
        task_id: task.id,
        status: 'completed',
        started_at: new Date(),
        completed_at: new Date(),
        ip_address: ip,
        device_info: device,
      },
    ]);

    // 💰 UPDATE WALLET
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

    // UI update
    setCompletedTasks((prev) => [...prev, task.id]);
    setActiveTask(null);

    alert(`✅ Task verified! You earned ${task.reward} points`);
  };

  // LOADING
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

      {tasks.length === 0 && (
        <p className="text-center text-gray-400">
          No tasks available yet.
        </p>
      )}

      <div className="max-w-xl mx-auto">
        {tasks.map((task) => {
          const done = completedTasks.includes(task.id);
          const isActive = activeTask === task.id;

          return (
            <div key={task.id} className="bg-gray-900 p-4 rounded mb-4">

              <h2 className="text-lg font-semibold">{task.title}</h2>

              <p className="text-sm text-gray-400 mb-2">
                Reward: {task.reward} points
              </p>

              <div className="flex gap-2">

                {/* Start */}
                <button
                  onClick={() => startTask(task.id, task.link)}
                  disabled={done}
                  className={`px-4 py-2 rounded ${
                    done ? 'bg-gray-600' : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  Start
                </button>

                {/* Confirm */}
                <button
                  disabled={done || !isActive || timer > 0}
                  onClick={() => completeTask(task)}
                  className={`px-4 py-2 rounded ${
                    done
                      ? 'bg-gray-600'
                      : timer > 0 && isActive
                      ? 'bg-yellow-500'
                      : 'bg-green-500 hover:bg-green-600'
                  }`}
                >
                  {done
                    ? 'Completed'
                    : timer > 0 && isActive
                    ? `Wait ${timer}s`
                    : 'Confirm'}
                </button>

              </div>

            </div>
          );
        })}
      </div>

    </main>
  );
}