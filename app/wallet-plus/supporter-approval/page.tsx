'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function SupporterApprovalPage() {
  const [email, setEmail] = useState('');
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      alert('Please login first');
      window.location.href = '/auth';
      return;
    }

    const userEmail = session.user.email || '';
    setEmail(userEmail);

    const { data, error } = await supabase
      .from('wallet_advances')
      .select('*')
      .or(`supporter_one.eq.${userEmail},supporter_two.eq.${userEmail}`)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setRequests(data || []);
    setLoading(false);
  };

  const approveRequest = async (request: any) => {
    const updateData =
      request.supporter_one === email
        ? { supporter_one_approved: true }
        : { supporter_two_approved: true };

    const { error } = await supabase
      .from('wallet_advances')
      .update(updateData)
      .eq('id', request.id);

    if (error) {
      alert(error.message);
      return;
    }

    alert('✅ Support approval submitted');
    loadRequests();
  };

  const rejectRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('wallet_advances')
      .update({ status: 'rejected' })
      .eq('id', requestId);

    if (error) {
      alert(error.message);
      return;
    }

    alert('❌ Advance request rejected');
    loadRequests();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading supporter requests...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">
          🤝 Supporter Approval
        </h1>

        <p className="text-gray-400 mb-6">
          Review Wallet+ advance requests where you have been selected as a supporter.
        </p>

        {requests.length === 0 ? (
          <div className="bg-gray-900 p-5 rounded text-gray-400">
            No pending supporter approval requests.
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => {
              const alreadyApproved =
                (request.supporter_one === email && request.supporter_one_approved) ||
                (request.supporter_two === email && request.supporter_two_approved);

              return (
                <div key={request.id} className="bg-gray-900 p-5 rounded">
                  <p className="text-sm text-gray-400">Requester</p>
                  <h2 className="font-bold mb-3">{request.user_email}</h2>

                  <p>Amount: ₦{Number(request.amount || 0).toLocaleString()}</p>
                  <p>Service Fee: ₦{Number(request.service_fee || 0).toLocaleString()}</p>
                  <p>Total Settlement: ₦{Number(request.total_repay || 0).toLocaleString()}</p>
                  <p>Repayment Period: {request.repayment_months} months</p>

                  <div className="mt-4 bg-yellow-950 border border-yellow-700 p-3 rounded text-sm text-yellow-100">
                    By approving, you agree to stand as a supporter for this advance request based on Wallet+ rules.
                  </div>

                  {alreadyApproved ? (
                    <p className="mt-4 text-green-400 font-bold">
                      ✅ You have approved this request.
                    </p>
                  ) : (
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => approveRequest(request)}
                        className="bg-green-500 hover:bg-green-600 text-black px-4 py-2 rounded font-bold"
                      >
                        Approve
                      </button>

                      <button
                        onClick={() => rejectRequest(request.id)}
                        className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded font-bold"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}