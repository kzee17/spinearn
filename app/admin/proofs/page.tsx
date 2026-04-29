'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function AdminProofsPage() {
  const [proofs, setProofs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAndLoadProofs();
  }, []);

  const checkAdminAndLoadProofs = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      alert('Please login first');
      window.location.href = '/auth';
      return;
    }

    const email = session.user.email;

    const { data: adminData } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (!adminData) {
      alert('Access denied');
      window.location.href = '/';
      return;
    }

    await loadProofs();
    setLoading(false);
  };

  const loadProofs = async () => {
    const { data, error } = await supabase
      .from('user_tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setProofs(data || []);
  };

  const getProofUrl = (proofUrl: string) => {
    if (!proofUrl) return '';

    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/proofs/${proofUrl.replace(
      'proofs/',
      ''
    )}`;
  };

  const approveProof = async (proof: any) => {
    if (proof.credited) {
      alert('This proof has already been credited.');
      return;
    }

    const reward = Number(proof.reward_amount || 0);

    if (reward <= 0) {
      alert('Invalid reward amount.');
      return;
    }

    const { data: user, error: userError } = await supabase
      .from('waitlist_users')
      .select('*')
      .eq('email', proof.user_email)
      .maybeSingle();

    if (userError) {
      alert(userError.message);
      return;
    }

    if (!user) {
      alert('User not found.');
      return;
    }

    const { error: walletError } = await supabase
      .from('waitlist_users')
      .update({
        spin_points: Number(user.spin_points || 0) + reward,
        balance_naira: Number(user.balance_naira || 0) + reward,
      })
      .eq('email', proof.user_email);

    if (walletError) {
      alert(walletError.message);
      return;
    }

    const { error: proofError } = await supabase
      .from('user_tasks')
      .update({
        proof_status: 'approved',
        credited: true,
      })
      .eq('id', proof.id);

    if (proofError) {
      alert(proofError.message);
      return;
    }

    alert('✅ Proof approved and wallet credited.');
    loadProofs();
  };

  const rejectProof = async (proofId: string) => {
    const confirmReject = confirm('Reject this proof submission?');

    if (!confirmReject) return;

    const { error } = await supabase
      .from('user_tasks')
      .update({
        proof_status: 'rejected',
        credited: false,
      })
      .eq('id', proofId);

    if (error) {
      alert(error.message);
      return;
    }

    alert('❌ Proof rejected.');
    loadProofs();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading proof submissions...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-3">
          🛡️ Admin Proof Validation
        </h1>

        <p className="text-gray-400 mb-8">
          Review task proofs before rewarding users. Wallet credit is only given
          after approval.
        </p>

        {proofs.length === 0 ? (
          <div className="bg-gray-900 p-5 rounded text-gray-400">
            No proof submissions yet.
          </div>
        ) : (
          <div className="space-y-4">
            {proofs.map((proof) => (
              <div key={proof.id} className="bg-gray-900 p-5 rounded">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h2 className="font-bold">{proof.user_email}</h2>

                    <p className="text-sm text-gray-400">
                      Task ID: {proof.task_id}
                    </p>

                    <p className="text-sm text-gray-400">
                      Reward: {Number(proof.reward_amount || 0)} Spin Points
                    </p>

                    <p className="text-sm text-gray-400">
                      IP: {proof.ip_address || 'N/A'}
                    </p>

                    <p className="text-sm text-gray-400">
                      Status: {proof.proof_status || 'pending'}
                    </p>

                    <p className="text-sm text-gray-400">
                      Credited: {proof.credited ? 'Yes' : 'No'}
                    </p>
                  </div>

                  <span
                    className={`text-sm px-3 py-1 rounded capitalize ${
                      proof.proof_status === 'approved'
                        ? 'bg-green-900 text-green-300'
                        : proof.proof_status === 'rejected'
                        ? 'bg-red-900 text-red-300'
                        : 'bg-yellow-900 text-yellow-300'
                    }`}
                  >
                    {proof.proof_status || 'pending'}
                  </span>
                </div>

                {proof.proof_url ? (
                  <a
                    href={getProofUrl(proof.proof_url)}
                    target="_blank"
                    className="inline-block mt-4 text-blue-400 underline"
                  >
                    View Uploaded Proof
                  </a>
                ) : (
                  <p className="text-yellow-400 text-sm mt-4">
                    No proof uploaded.
                  </p>
                )}

                {proof.proof_status !== 'approved' &&
                  proof.proof_status !== 'rejected' && (
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => approveProof(proof)}
                        className="bg-green-500 hover:bg-green-600 text-black px-4 py-2 rounded font-bold"
                      >
                        Approve & Credit
                      </button>

                      <button
                        onClick={() => rejectProof(proof.id)}
                        className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded font-bold"
                      >
                        Reject
                      </button>
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <a
            href="/admin"
            className="bg-gray-800 hover:bg-gray-700 px-4 py-3 rounded font-bold"
          >
            Back to Admin Dashboard
          </a>

          <a
            href="/tasks"
            className="bg-purple-500 hover:bg-purple-600 px-4 py-3 rounded font-bold"
          >
            View Tasks
          </a>
        </div>
      </div>
    </main>
  );
}