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

    if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
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

    const { data: user } = await supabase
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
          fraud_score: 0,
          fraud_status: 'clear',
        },
      ]);
    }

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
      setTasks([]);
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
      if (!file) {
        alert('Please select a proof screenshot.');
        return null;
      }

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
    } catch (error: any) {
      alert(error.message || 'Proof upload failed.');
      return null;
    }
  };

  const completeTask = async (task: any) => {
    if (!userEmail) return;

    if (timer > 0) {
      alert('⏳ Please wait for the timer to finish.');
      return;
    }

    if (!proof) {
      alert('⚠️ Please upload proof screenshot.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    const { data: todayTasks } = await supabase
      .from('user_tasks')
      .select('*')
      .eq('user_email', userEmail)
      .gte('created_at', today);

    if ((todayTasks?.length || 0) >= 10) {
      alert('⚠️ Daily limit reached.');
      return;
    }

    const { data: existing } = await supabase
      .from('user_tasks')
      .select('*')
      .eq('user_email', userEmail)
      .eq('task_id', task.id)
      .maybeSingle();

    if (existing) {
      alert('⚠️ You have already submitted this task.');
      return;
    }

    let ip = '';

    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const json = await res.json();
      ip = json.ip || '';
    } catch {
      ip = '';
    }

    const deviceInfo = navigator.userAgent;

    const fraudCheck = await fetch('/api/fraud/check-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_email: userEmail,
        ip_address: ip,
        device_info: deviceInfo,
      }),
    });

    const fraudResult = await fraudCheck.json();

    if (!fraudCheck.ok) {
      alert(fraudResult.error || 'Fraud check failed. Please try again.');
      return;
    }

    if (fraudResult.fraud_status === 'blocked') {
      alert('⚠️ Your account has been flagged for suspicious activity.');
      return;
    }

    const proofUrl = await uploadProof(proof);

    if (!proofUrl) {
      alert('❌ Proof upload failed.');
      return;
    }

    const { error: taskError } = await supabase.from('user_tasks').insert([
      {
        user_email: userEmail,
        task_id: task.id,
        status: 'completed',
        proof_status: 'pending',
        reward_amount: TASK_REWARD,
        credited: false,
        fraud_score: fraudResult.fraud_score || 0,
        fraud_flags: fraudResult.fraud_flags || [],
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        ip_address: ip,
        device_info: deviceInfo,
        proof_url: proofUrl,
      },
    ]);

    if (taskError) {
      alert(taskError.message);
      return;
    }

    await supabase.from('notifications').insert([
      {
        user_email: userEmail,
        title: 'Proof Submitted',
        message:
          'Your task proof has been submitted and is awaiting admin approval.',
      },
    ]);

    await supabase
      .from('tasks')
      .update({
        current_completions: Number(task.current_completions || 0) + 1,
      })
      .eq('id', task.id);

    setCompletedTasks((prev) => [...prev, task.id]);
    setActiveTask(null);
    setProof(null);

    alert('✅ Proof submitted. Your 5 Spin Points will be credited after admin approval.');

    fetchTasks();
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
      <h1 className="text-4xl text-center mb-8">💰 Earn Spin Points</h1>

      {tasks.length === 0 && (
        <p className="text-center text-gray-400">No tasks available yet.</p>
      )}

      <div className="max-w-xl mx-auto">
        {tasks.map((task) => {
          const done = completedTasks.includes(task.id);
          const isActive = activeTask === task.id;
          const displayLink = normalizeUrl(task.link || '');

          return (
            <div key={task.id} className="bg-gray-900 p-4 rounded mb-4">
              <h2 className="font-semibold">{task.title}</h2>

              <p className="text-sm text-gray-400 mb-1">
                Reward: {TASK_REWARD} Spin Points
              </p>

              <p className="text-xs text-gray-500 mb-2 break-all">
                Link: {displayLink}
              </p>

              <p className="text-xs text-gray-500 mb-2">
                Progress: {task.current_completions || 0}/
                {task.max_completions || 100}
              </p>

              {isActive && !done && (
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProof(e.target.files?.[0] || null)}
                  className="mb-2 block"
                />
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => startTask(task.id, task.link)}
                  disabled={done}
                  className={`px-4 py-2 rounded ${
                    done ? 'bg-gray-600' : 'bg-blue-500 hover:bg-blue-600'
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
                      : timer > 0 && isActive
                      ? 'bg-yellow-500 text-black'
                      : 'bg-green-500 hover:bg-green-600 text-black'
                  }`}
                >
                  {done
                    ? 'Submitted'
                    : timer > 0 && isActive
                    ? `Wait ${timer}s`
                    : 'Submit Proof'}
                </button>
              </div>

              {done && (
                <p className="text-xs text-yellow-400 mt-2">
                  ⏳ Submitted for admin review.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}