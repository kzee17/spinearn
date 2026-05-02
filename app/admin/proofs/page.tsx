'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

const ADMIN_EMAIL = 'engrlawalko@gmail.com';
const TASK_REWARD = 5;

export default function AdminProofsPage() {
  const [proofs, setProofs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState('');

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

    const email = (session.user.email || '').toLowerCase().trim();
    setAdminEmail(email);

    if (email !== ADMIN_EMAIL) {
      alert('Access denied. This account is not an admin.');
      await supabase.auth.signOut();
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
      setLoading(false);
      return;
    }

    setProofs(data || []);
  };

  const getProofUrl = (proofUrl: string) => {
    if (!proofUrl) return '#';

    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/proofs/${proofUrl}`;
  };

  const approveProof = async (proof: any) => {
    if (proof.credited) {
      alert('This proof has already been credited.');
      return;
    }

    const confirmApprove = confirm(
      `Approve this proof and credit ${TASK_REWARD} Spin Points?`
    );

    if (!confirmApprove) return;

    const { data: user, error: userError } = await supabase
      .from('waitlist_users')
      .select('email, spin_points, balance_naira')
      .eq('email', proof.user_email)
      .maybeSingle();

    if (userError || !user) {
      alert(userError?.message || 'User not found.');
      return;
    }

    const newSpinPoints = Number(user.spin_points || 0) + TASK_REWARD;
    const newBalance = Number(user.balance_naira || 0) + TASK_REWARD;

    const { error: walletError } = await supabase
      .from('waitlist_users')
      .update({
        spin_points: newSpinPoints,
        balance_naira: newBalance,
      })
      .eq('email', proof.user_email);

    if (walletError) {
      alert(`Wallet credit failed: ${walletError.message}`);
      return;
    }

    const { error: proofError } = await supabase
      .from('user_tasks')
      .update({
        proof_status: 'approved',
        credited: true,
        reward_amount: TASK_REWARD,
      })
      .eq('id', proof.id);

    if (proofError) {
      alert(`Proof update failed: ${proofError.message}`);
      return;
    }

    await supabase.from('notifications').insert([
      {
        user_email: proof.user_email,
        title: 'Proof Approved',
        message: `Your proof was approved and ${TASK_REWARD} Spin Points have been credited.`,
      },
    ]);

    alert(`✅ Proof approved. ${TASK_REWARD} Spin Points credited.`);
    loadProofs();
  };

  const rejectProof = async (proof: any) => {
    const confirmReject = confirm('Reject this proof submission?');
    if (!confirmReject) return;

    const { error } = await supabase
      .from('user_tasks')
      .update({
        proof_status: 'rejected',
        credited: false,
        reward_amount: TASK_REWARD,
      })
      .eq('id', proof.id);

    if (error) {
      alert(error.message);
      return;
    }

    await supabase.from('notifications').insert([
      {
        user_email: proof.user_email,
        title: 'Proof Rejected',
        message:
          'Your task proof was rejected. Please submit valid proof next time.',
      },
    ]);

    alert('❌ Proof rejected.');
    loadProofs();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">🛡️ Admin Proof Validation</h1>
            <p className="text-gray-400 text-sm mt-1">
              Logged in as: {adminEmail}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a href="/admin" className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded">
              Admin Home
            </a>

            <a href="/admin/fraud" className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded font-bold">
              Fraud
            </a>

            <button
              onClick={handleLogout}
              className="bg-red-900 hover:bg-red-800 px-4 py-2 rounded font-bold"
            >
              Logout
            </button>
          </div>
        </div>

        <p className="text-gray-400 mb-8">
          Review task proofs before rewarding users. Each approved proof gives
          the user <strong>{TASK_REWARD} Spin Points</strong>.
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
                      Reward: {Number(proof.reward_amount || TASK_REWARD)} Spin Points
                    </p>

                    <p className="text-sm text-gray-400">
                      IP: {proof.ip_address || 'N/A'}
                    </p>

                    <p className="text-sm text-gray-400">
                      Fraud Score: {proof.fraud_score || 0}
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
                    rel="noopener noreferrer"
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
                        Approve & Credit {TASK_REWARD} Points
                      </button>

                      <button
                        onClick={() => rejectProof(proof)}
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
      </div>
    </main>
  );
}