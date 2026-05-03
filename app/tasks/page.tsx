'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const TASK_REWARD = 5;

export default function Tasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [proof, setProof] = useState<File | null>(null);

  useEffect(() => {
    init();
  }, []);

  const normalizeUrl = (url: string) => {
    if (!url) return '';
    const trimmedUrl = url.trim();

    if (
      trimmedUrl.startsWith('http://') ||
      trimmedUrl.startsWith('https://')
    ) {
      return trimmedUrl;
    }

    return `https://${trimmedUrl}`;
  };

  const init = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      window.location.href = '/auth';
      return;
    }

    const email = session.user.email || '';
    setUserEmail(email);

    await fetchTasks();
    await fetchCompletedTasks(email);

    setLoading(false);
  };

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setTasks(data || []);
  };

  const fetchCompletedTasks = async (email: string) => {
    const { data } = await supabase
      .from('user_tasks')
      .select('task_id')
      .eq('user_email', email);

    setCompletedTasks(data?.map((t: any) => t.task_id) || []);
  };

  const startTask = (taskId: string, link: string) => {
    const finalUrl = normalizeUrl(link);

    if (!finalUrl) {
      alert('Invalid advertiser URL.');
      return;
    }

    setActiveTask(taskId);
    setTimer(10);
    setProof(null);

    window.open(finalUrl, '_blank', 'noopener,noreferrer');

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

  const uploadProof = async (file: File) => {
    try {
      if (!file) return null;

      const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${Date.now()}-${safeFileName}`;

      const { error } = await supabase.storage
        .from('proofs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || 'image/png',
        });

      if (error) {
        alert(error.message);
        return null;
      }

      return filePath;
    } catch (err: any) {
      alert(err.message);
      return null;
    }
  };

  const completeTask = async (task: any) => {
    if (!userEmail) return;

    if (timer > 0) {
      alert('⏳ Wait for timer to finish');
      return;
    }

    if (!proof) {
      alert('⚠️ Upload proof screenshot');
      return;
    }

    const { data: existing } = await supabase
      .from('user_tasks')
      .select('*')
      .eq('user_email', userEmail)
      .eq('task_id', task.id)
      .maybeSingle();

    if (existing) {
      setCompletedTasks((prev) =>
        prev.includes(task.id) ? prev : [...prev, task.id]
      );

      alert('⚠️ You already submitted this task');
      return;
    }

    const proofUrl = await uploadProof(proof);

    if (!proofUrl) {
      alert('❌ Proof upload failed');
      return;
    }

    const { error } = await supabase.from('user_tasks').insert([
      {
        user_email: userEmail,
        task_id: task.id,
        status: 'completed',
        proof_status: 'pending',
        reward_amount: TASK_REWARD,
        credited: false,
        proof_url: proofUrl,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      if (error.code === '23505') {
        alert('⚠️ Already submitted');
        return;
      }

      alert(error.message);
      return;
    }

    alert('✅ Submitted. Awaiting approval (5 Spin Points)');
    setCompletedTasks((prev) => [...prev, task.id]);
    setActiveTask(null);
    setProof(null);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      
      {/* 🔥 NAV BAR */}
      <div className="max-w-xl mx-auto mb-6 flex justify-between items-center">
        <a
          href="/"
          className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded text-sm font-bold"
        >
          ← Home
        </a>

        <a
          href="/wallet"
          className="bg-green-500 hover:bg-green-600 text-black px-4 py-2 rounded text-sm font-bold"
        >
          Wallet
        </a>
      </div>

      <h1 className="text-4xl text-center mb-8">💰 Earn Spin Points</h1>

      {tasks.length === 0 && (
        <p className="text-center text-gray-400">No tasks available</p>
      )}

      <div className="max-w-xl mx-auto">
        {tasks.map((task) => {
          const done = completedTasks.includes(task.id);
          const isActive = activeTask === task.id;

          return (
            <div key={task.id} className="bg-gray-900 p-4 rounded mb-4">
              <h2 className="font-semibold">{task.title}</h2>

              <p className="text-sm text-gray-400">
                Reward: {TASK_REWARD} Spin Points
              </p>

              <p className="text-xs text-gray-500 break-all">
                Link: {normalizeUrl(task.link)}
              </p>

              {isActive && !done && (
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setProof(e.target.files?.[0] || null)
                  }
                  className="mb-2"
                />
              )}

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => startTask(task.id, task.link)}
                  disabled={done}
                  className={`px-4 py-2 rounded ${
                    done
                      ? 'bg-gray-600'
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  Start
                </button>

                <button
                  disabled={done || !isActive || timer > 0}
                  onClick={() => completeTask(task)}
                  className={`px-4 py-2 rounded ${
                    done
                      ? 'bg-gray-600'
                      : timer > 0
                      ? 'bg-yellow-500 text-black'
                      : 'bg-green-500 text-black'
                  }`}
                >
                  {done
                    ? 'Submitted'
                    : timer > 0
                    ? `Wait ${timer}s`
                    : 'Submit Proof'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}