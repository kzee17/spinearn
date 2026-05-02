'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [userTasks, setUserTasks] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [walletMembers, setWalletMembers] = useState<any[]>([]);
  const [repayments, setRepayments] = useState<any[]>([]);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      alert('Please login first');
      window.location.href = '/auth';
      return;
    }

    const email = session.user.email;

    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (adminError) {
      console.error('Admin check error:', adminError);
      alert(adminError.message);
      window.location.href = '/';
      return;
    }

    if (!adminData) {
      alert('Access denied');
      window.location.href = '/';
      return;
    }

    await loadData();
    setLoading(false);
  };

  const loadData = async () => {
    const { data: usersData } = await supabase
      .from('waitlist_users')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: userTasksData } = await supabase
      .from('user_tasks')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: withdrawalsData } = await supabase
      .from('withdrawals')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: advancesData } = await supabase
      .from('wallet_advances')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: walletMembersData } = await supabase
      .from('wallet_members')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: repaymentsData } = await supabase
      .from('wallet_advance_repayments')
      .select('*')
      .order('created_at', { ascending: false });

    setUsers(usersData || []);
    setTasks(tasksData || []);
    setUserTasks(userTasksData || []);
    setWithdrawals(withdrawalsData || []);
    setAdvances(advancesData || []);
    setWalletMembers(walletMembersData || []);
    setRepayments(repaymentsData || []);
  };

  const totalMainWalletBalance = users.reduce(
    (sum, user) => sum + Number(user.balance_naira || 0),
    0
  );

  const totalWalletPlusBalance = walletMembers.reduce(
    (sum, member) => sum + Number(member.wallet_balance || 0),
    0
  );

  const totalPendingWithdrawals = withdrawals
    .filter((item) => item.status === 'pending')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const totalPendingAdvances = advances
    .filter(
      (item) =>
        item.status === 'pending' || item.status === 'supporters_approved'
    )
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const totalRepayments = repayments.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const detectFraudIPs = () => {
    const ipMap: Record<string, number> = {};

    userTasks.forEach((task) => {
      if (!task.ip_address) return;
      ipMap[task.ip_address] = (ipMap[task.ip_address] || 0) + 1;
    });

    return Object.entries(ipMap).filter(([_, count]) => Number(count) > 5);
  };

  const fraudIPs = detectFraudIPs();

  const approveWithdrawal = async (id: string) => {
    const confirmApproval = confirm('Approve this withdrawal request?');
    if (!confirmApproval) return;

    const { error } = await supabase
      .from('withdrawals')
      .update({ status: 'approved' })
      .eq('id', id);

    if (error) {
      alert(error.message);
      return;
    }

    alert('✅ Withdrawal approved.');
    loadData();
  };

  const rejectWithdrawal = async (id: string) => {
    const confirmReject = confirm('Reject this withdrawal request?');
    if (!confirmReject) return;

    const { error } = await supabase
      .from('withdrawals')
      .update({ status: 'rejected' })
      .eq('id', id);

    if (error) {
      alert(error.message);
      return;
    }

    alert('❌ Withdrawal rejected.');
    loadData();
  };

  const approveAdvance = async (advance: any) => {
    if (advance.status !== 'supporters_approved') {
      alert('Both supporters must approve before admin approval.');
      return;
    }

    if (!advance.supporter_one_approved || !advance.supporter_two_approved) {
      alert('Both supporters have not approved this request yet.');
      return;
    }

    if (advance.disbursed) {
      alert('This advance has already been disbursed.');
      return;
    }

    const confirmApproval = confirm(
      `Approve and credit ₦${Number(advance.amount || 0).toLocaleString()} to ${
        advance.user_email
      } Wallet+ balance?`
    );

    if (!confirmApproval) return;

    const { data: member, error: memberError } = await supabase
      .from('wallet_members')
      .select('*')
      .eq('user_email', advance.user_email)
      .maybeSingle();

    if (memberError) {
      alert(memberError.message);
      return;
    }

    if (!member) {
      alert('Wallet+ member account not found.');
      return;
    }

    const newWalletBalance =
      Number(member.wallet_balance || 0) + Number(advance.amount || 0);

    const { error: memberUpdateError } = await supabase
      .from('wallet_members')
      .update({
        wallet_balance: newWalletBalance,
      })
      .eq('user_email', advance.user_email);

    if (memberUpdateError) {
      alert(memberUpdateError.message);
      return;
    }

    const { error: advanceUpdateError } = await supabase
      .from('wallet_advances')
      .update({
        status: 'approved',
        admin_approved: true,
        disbursed: true,
        approved_at: new Date().toISOString(),
        disbursed_at: new Date().toISOString(),
      })
      .eq('id', advance.id);

    if (advanceUpdateError) {
      alert(advanceUpdateError.message);
      return;
    }
await supabase.from('notifications').insert([
  {
    user_email: advance.user_email,
    title: 'Advance Approved',
    message: `Your Wallet+ advance of ₦${Number(
      advance.amount || 0
    ).toLocaleString()} has been approved and credited.`,
  },
]);
    alert('✅ Advance approved and Wallet+ balance credited.');
    loadData();
  };

  const rejectAdvance = async (advanceId: string) => {
    const confirmReject = confirm('Reject this advance request?');
    if (!confirmReject) return;

    const { error } = await supabase
      .from('wallet_advances')
      .update({
        status: 'rejected',
        admin_approved: false,
        disbursed: false,
      })
      .eq('id', advanceId);

    if (error) {
      alert(error.message);
      return;
    }

    alert('❌ Advance request rejected.');
    loadData();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Loading admin dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-8">
      <section className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          ⚙️ SpinEarn Admin Dashboard
        </h1>
        <p className="text-gray-400">
          Control users, task activity, proof reviews, Wallet+ advances,
          withdrawals, repayments, and fraud monitoring.
        </p>
      </section>

      {/* QUICK LINKS */}
      <section className="max-w-7xl mx-auto mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <a
            href="/admin/proofs"
            className="bg-green-500 hover:bg-green-600 text-black px-4 py-3 rounded text-center font-bold"
          >
            Review Task Proofs
          </a>

          <a
            href="/advertise/dashboard"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded text-center font-bold"
          >
            Advertiser Dashboard
          </a>

          <a
            href="/admin/analytics"
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded text-center font-bold"
          >
            Revenue Analytics
          </a>

          <a
            href="/tasks"
            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded text-center font-bold"
          >
            View Tasks
          </a>
          <a
  href="/admin/fraud"
  className="bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded text-center font-bold"
>
  Fraud Monitoring
</a>
        </div>
      </section>

      {/* ANALYTICS */}
      <section className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-gray-900 p-5 rounded">
          <p className="text-gray-400 text-sm">Total Users</p>
          <h2 className="text-2xl font-bold">{users.length}</h2>
        </div>

        <div className="bg-gray-900 p-5 rounded">
          <p className="text-gray-400 text-sm">Wallet+ Members</p>
          <h2 className="text-2xl font-bold">{walletMembers.length}</h2>
        </div>

        <div className="bg-gray-900 p-5 rounded">
          <p className="text-gray-400 text-sm">Tasks</p>
          <h2 className="text-2xl font-bold">{tasks.length}</h2>
        </div>

        <div className="bg-gray-900 p-5 rounded">
          <p className="text-gray-400 text-sm">Task Submissions</p>
          <h2 className="text-2xl font-bold">{userTasks.length}</h2>
        </div>

        <div className="bg-gray-900 p-5 rounded">
          <p className="text-gray-400 text-sm">Main Wallet Balance</p>
          <h2 className="text-2xl font-bold text-green-400">
            ₦{totalMainWalletBalance.toLocaleString()}
          </h2>
        </div>

        <div className="bg-gray-900 p-5 rounded">
          <p className="text-gray-400 text-sm">Wallet+ Balance</p>
          <h2 className="text-2xl font-bold text-blue-400">
            ₦{totalWalletPlusBalance.toLocaleString()}
          </h2>
        </div>

        <div className="bg-gray-900 p-5 rounded">
          <p className="text-gray-400 text-sm">Pending Withdrawals</p>
          <h2 className="text-2xl font-bold text-yellow-400">
            ₦{totalPendingWithdrawals.toLocaleString()}
          </h2>
        </div>

        <div className="bg-gray-900 p-5 rounded">
          <p className="text-gray-400 text-sm">Pending Advances</p>
          <h2 className="text-2xl font-bold text-purple-400">
            ₦{totalPendingAdvances.toLocaleString()}
          </h2>
        </div>

        <div className="bg-gray-900 p-5 rounded">
          <p className="text-gray-400 text-sm">Total Repayments</p>
          <h2 className="text-2xl font-bold text-green-400">
            ₦{totalRepayments.toLocaleString()}
          </h2>
        </div>
      </section>

      {/* ADVANCE REPAYMENTS */}
      <section className="max-w-7xl mx-auto mb-10">
        <h2 className="text-2xl font-bold mb-4">💵 Advance Repayments</h2>

        {repayments.length === 0 ? (
          <div className="bg-gray-900 p-5 rounded text-gray-400">
            No repayments yet.
          </div>
        ) : (
          <div className="space-y-3">
            {repayments.slice(0, 20).map((repayment) => (
              <div key={repayment.id} className="bg-gray-900 p-4 rounded">
                <p className="font-bold">{repayment.user_email}</p>
                <p>
                  Amount Paid: ₦
                  {Number(repayment.amount || 0).toLocaleString()}
                </p>
                <p>Status: {repayment.status}</p>
                <p className="text-gray-400 text-sm">
                  Advance ID: {repayment.advance_id}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* WALLET+ ADVANCE REQUESTS */}
      <section className="max-w-7xl mx-auto mb-10">
        <h2 className="text-2xl font-bold mb-4">
          💳 Wallet+ Advance Requests
        </h2>

        {advances.length === 0 ? (
          <div className="bg-gray-900 p-5 rounded text-gray-400">
            No advance requests yet.
          </div>
        ) : (
          <div className="space-y-4">
            {advances.map((advance) => (
              <div key={advance.id} className="bg-gray-900 p-5 rounded">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold">
                      ₦{Number(advance.amount || 0).toLocaleString()} Advance
                    </h3>

                    <p className="text-gray-400 text-sm">
                      User: {advance.user_email}
                    </p>

                    <p className="text-gray-400 text-sm">
                      Service Fee: ₦
                      {Number(advance.service_fee || 0).toLocaleString()}
                    </p>

                    <p className="text-gray-400 text-sm">
                      Total Settlement: ₦
                      {Number(advance.total_repay || 0).toLocaleString()}
                    </p>

                    <p className="text-gray-400 text-sm">
                      Repayment Period: {advance.repayment_months} months
                    </p>

                    <p className="text-gray-400 text-sm">
                      Disbursed:{' '}
                      {advance.disbursed ? '✅ Yes' : '⏳ Not yet'}
                    </p>
                  </div>

                  <span
                    className={`text-sm px-3 py-1 rounded capitalize ${
                      advance.status === 'approved'
                        ? 'bg-green-900 text-green-300'
                        : advance.status === 'rejected'
                        ? 'bg-red-900 text-red-300'
                        : advance.status === 'supporters_approved'
                        ? 'bg-blue-900 text-blue-300'
                        : advance.status === 'settled'
                        ? 'bg-purple-900 text-purple-300'
                        : 'bg-yellow-900 text-yellow-300'
                    }`}
                  >
                    {advance.status}
                  </span>
                </div>

                <div className="bg-black p-4 rounded mt-4 text-sm text-gray-300">
                  <p>
                    Supporter 1: {advance.supporter_one}{' '}
                    {advance.supporter_one_approved ? '✅' : '⏳'}
                  </p>
                  <p>
                    Supporter 2: {advance.supporter_two}{' '}
                    {advance.supporter_two_approved ? '✅' : '⏳'}
                  </p>
                </div>

                {advance.status === 'supporters_approved' && (
                  <div className="flex flex-col md:flex-row gap-3 mt-4">
                    <button
                      onClick={() => approveAdvance(advance)}
                      className="bg-green-500 hover:bg-green-600 text-black px-4 py-2 rounded font-bold"
                    >
                      Approve & Credit Wallet
                    </button>

                    <button
                      onClick={() => rejectAdvance(advance.id)}
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
      </section>

      {/* WITHDRAWALS */}
      <section className="max-w-7xl mx-auto mb-10">
        <h2 className="text-2xl font-bold mb-4">💰 Withdrawal Requests</h2>

        {withdrawals.length === 0 ? (
          <div className="bg-gray-900 p-5 rounded text-gray-400">
            No withdrawal requests yet.
          </div>
        ) : (
          <div className="space-y-4">
            {withdrawals.map((withdrawal) => (
              <div key={withdrawal.id} className="bg-gray-900 p-5 rounded">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="font-bold">{withdrawal.user_email}</p>
                    <p className="text-gray-400">
                      Amount: ₦
                      {Number(withdrawal.amount || 0).toLocaleString()}
                    </p>
                    <p className="text-gray-400 capitalize">
                      Status: {withdrawal.status}
                    </p>
                  </div>

                  {withdrawal.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveWithdrawal(withdrawal.id)}
                        className="bg-green-500 hover:bg-green-600 text-black px-3 py-2 rounded font-bold"
                      >
                        Approve
                      </button>

                      <button
                        onClick={() => rejectWithdrawal(withdrawal.id)}
                        className="bg-red-500 hover:bg-red-600 px-3 py-2 rounded font-bold"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* FRAUD DETECTION */}
      <section className="max-w-7xl mx-auto mb-10">
        <h2 className="text-2xl font-bold text-red-400 mb-4">
          🚨 Fraud / Suspicious Activity
        </h2>

        {fraudIPs.length === 0 ? (
          <div className="bg-gray-900 p-5 rounded text-gray-400">
            No suspicious IP activity detected.
          </div>
        ) : (
          <div className="space-y-3">
            {fraudIPs.map(([ip, count]) => (
              <div
                key={ip}
                className="bg-red-950 border border-red-700 p-4 rounded"
              >
                <p className="font-bold">{ip}</p>
                <p className="text-sm text-red-200">
                  {String(count)} task activities detected from this IP.
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* USERS */}
      <section className="max-w-7xl mx-auto mb-10">
        <h2 className="text-2xl font-bold mb-4">👥 Recent Users</h2>

        {users.slice(0, 30).map((user) => (
          <div key={user.id} className="bg-gray-900 p-4 rounded mb-3">
            <p className="font-bold">{user.email}</p>
            <p className="text-gray-400 text-sm">
              Main Wallet: ₦{Number(user.balance_naira || 0).toLocaleString()} |
              Spin Points: {Number(user.spin_points || 0).toLocaleString()}
            </p>
          </div>
        ))}
      </section>
    </main>
  );
}