'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function Tasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);

  useEffect(() => {
    checkUser();
    fetchTasks();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = '/auth';
    } else {
      setUserEmail(user.email || '');
    }
  };

  useEffect(() => {
    if (userEmail) fetchCompletedTasks();
  }, [userEmail]);

  const fetchTasks = async () => {
    const { data } = await supabase.from('tasks').select('*');
    setTasks(data || []);
  };

  const fetchCompletedTasks = async () => {
    const { data } = await supabase
      .from('user_tasks')
      .select('task_id')
      .eq('user_email', userEmail);

    const ids = data?.map((t: any) => t.task_id) || [];
    setCompletedTasks(ids);
  };

  const completeTask = async (task: any) => {
    const { data: existing } = await supabase
      .from('user_tasks')
      .select('*')
      .eq('user_email', userEmail)
      .eq('task_id', task.id)
      .single();

    if (existing) {
      alert("⚠️ Already completed");
      return;
    }

    await supabase.from('user_tasks').insert([
      {
        user_email: userEmail,
        task_id: task.id,
        completed: true,
      },
    ]);

    const { data: user } = await supabase
      .from('waitlist_users')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (user) {
      await supabase
        .from('waitlist_users')
        .update({
          spin_points: user.spin_points + task.reward,
          balance_naira: user.balance_naira + task.reward,
        })
        .eq('email', userEmail);
    }

    setCompletedTasks((prev) => [...prev, task.id]);

    alert(`🎉 Earned ${task.reward} point`);
  };

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <h1 className="text-4xl font-bold text-center mb-8">
        💰 Earn Spin Points
      </h1>

      <div className="max-w-xl mx-auto">
        {tasks.map((task) => {
          const done = completedTasks.includes(task.id);

          return (
            <div key={task.id} className="bg-gray-900 p-4 rounded mb-4">
              <h2 className="font-semibold">{task.title}</h2>

              <div className="flex gap-2 mt-2">
                <a href={task.link} target="_blank" className="bg-blue-500 px-3 py-2 rounded">
                  Go
                </a>

                <button
                  disabled={done}
                  onClick={() => completeTask(task)}
                  className={`px-3 py-2 rounded ${
                    done ? 'bg-gray-600' : 'bg-green-500'
                  }`}
                >
                  {done ? 'Done' : 'Confirm'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}