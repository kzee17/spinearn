'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState('');

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

    const email = session.user.email || '';
    setAdminEmail(email);

    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (adminError) {
      alert(adminError.message);
      window.location.href = '/';
      return;
    }

    if (!adminData) {
      alert('Access denied. This account is not an admin.');
      window.location.href = '/';
      return;
    }

    await loadData();
    setLoading(false);
  };

  const loadData = async () => {
    const [
      usersRes,
      tasksRes,
      userTasksRes,
      withdrawalsRes,
      advancesRes,
      walletMembersRes,
      repaymentsRes,
    ] = await Promise.all([
      supabase.from('waitlist_users').select('*').order('created_at', { ascending: false }),
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('user_tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('withdrawals').select('*').order('created_at', { ascending: false }),
      supabase.from('wallet_advances').select('*').order('created_at', { ascending: false }),
      supabase.from('wallet_members').select('*').order('created_at', { ascending: false }),
      supabase.from('wallet_advance_repayments').select('*').order('created_at', { ascending: false }),
    ]);

    setUsers(usersRes.data || []);
    setTasks(tasksRes.data || []);
    setUserTasks(userTasksRes.data || []);
    setWithdrawals(withdrawalsRes.data || []);
    setAdvances(advancesRes.data || []);
    setWalletMembers(walletMembersRes.data || []);
    setRepayments(repaymentsRes.data || []);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const totalMainWalletBalance = users.reduce(
    (sum, user) => sum + Number(user.balance_naira || 0),
    0
  );

  const totalWalletPlusBalance = walletMembers.reduce(
    (sum, member) => sum + Number(member.wallet_balance || 0),
    0
  );

  const pendingWithdrawals = withdrawals.filter((item) => item.status === 'pending');

  const totalPendingWithdrawals = pendingWithdrawals.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const pendingAdvances = advances.filter(
    (item) => item.status === 'pending' || item.status === 'supporters_approved'
  );

  const totalPendingAdvances = pendingAdvances.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const totalRepayments = repayments.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const fraudIPs = useMemo(() => {
    const ipMap: Record<string, number> = {};

    userTasks.forEach((task) => {
      if (!task.ip_address) return;
      ipMap[task.ip_address] = (ipMap[task.ip_address] || 0) + 1;
    });

    return Object.entries(ipMap).filter(([_, count]) => Number(count) > 5);
  }, [userTasks]);

  const approveWithdrawal = async (id: string) => {
    const confirmApproval = confirm(
      'Approve this withdrawal and process Paystack payout?'
    );

    if (!confirmApproval) return;

    const response = await fetch('/api/withdrawals/paystack-transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ withdrawal_id: id }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || 'Withdrawal payout failed');
      return;
    }

    alert('✅ Withdrawal approved and payout initiated.');
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
      `Approve and credit ₦${Number(advance.amount || 0).toLocaleString()} to ${advance.user_email} Wallet+ balance?`
    );

    if (!confirmApproval) return;

    const { data: member, error: memberError } = await supabase
      .from('wallet_members')
      .select('*')
      .eq('user_email', advance.user_email)
      .maybeSingle();

    if (memberError || !member) {
      alert(memberError?.message || 'Wallet+ member account not found.');
      return;
    }

    const newWalletBalance =
      Number(member.wallet_balance || 0) + Number(advance.amount || 0);

    const { error: memberUpdateError } = await supabase
      .from('wallet_members')
      .update({ wallet_balance: newWalletBalance })
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

  const statusBadge = (status: string) => {
    if (status === 'approved' || status === 'success') {
      return 'bg-green-900 text-green-300';
    }

    if (status === 'rejected' || status === 'failed') {
      return 'bg-red-900 text-red-300';
    }

    if (status === 'supporters_approved' || status === 'processing') {
      return 'bg-blue-900 text-blue-300';
    }

    if (status === 'settled') {
      return 'bg-purple-900 text-purple-300';
    }

    return 'bg-yellow-900 text-yellow-300';
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Loading admin dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* TOP NAV */}
      <header className="sticky top-0 z-50 bg-black/95 border-b border-gray-800 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-green-400">
              ⚙️ SpinEarn Admin
            </h1>
            <p className="text-xs text-gray-400">
              Logged in as: {adminEmail}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a href="/" className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded text-sm">
              Home
            </a>
            <a href="/admin/proofs" className="bg-green-500 hover:bg-green-600 text-black px-4 py-2 rounded text-sm font-bold">
              Proofs
            </a>
            <a href="/admin/fraud" className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-sm font-bold">
              Fraud
            </a>
            <a href="/admin/analytics" className="bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded text-sm font-bold">
              Analytics
            </a>
            <a href="/advertise/dashboard" className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded text-sm font-bold">
              Advertisers
            </a>
            <button
              onClick={handleLogout}
              className="bg-red-900 hover:bg-red-800 px-4 py-2 rounded text-sm font-bold"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* HERO */}
        <section className="mb-8 bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-2">
            Admin Control Centre
          </h2>
          <p className="text-gray-400">
            Manage users, task proofs, withdrawals, Wallet+ advances,
            repayments, fraud checks, advertiser activity and platform analytics.
          </p>
        </section>

        {/* QUICK ACCESS */}
        <section className="mb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a href="/admin/proofs" className="bg-green-500 hover:bg-green-600 text-black p-5 rounded-xl font-bold">
            ✅ Review Task Proofs
            <p className="text-sm font-normal mt-1 text-black/80">
              Pending task screenshots
            </p>
          </a>

          <a href="/admin/fraud" className="bg-red-500 hover:bg-red-600 p-5 rounded-xl font-bold">
            🚨 Fraud Monitoring
            <p className="text-sm font-normal mt-1 text-white/80">
              Flagged users and IP checks
            </p>
          </a>

          <a href="/admin/analytics" className="bg-purple-500 hover:bg-purple-600 p-5 rounded-xl font-bold">
            📊 Revenue Analytics
            <p className="text-sm font-normal mt-1 text-white/80">
              Platform performance
            </p>
          </a>

          <a href="/advertise/dashboard" className="bg-blue-500 hover:bg-blue-600 p-5 rounded-xl font-bold">
            📢 Advertiser Dashboard
            <p className="text-sm font-normal mt-1 text-white/80">
              Campaign tracking
            </p>
          </a>
        </section>

        {/* ANALYTICS CARDS */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl">
            <p className="text-gray-400 text-sm">Total Users</p>
            <h2 className="text-3xl font-bold">{users.length}</h2>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl">
            <p className="text-gray-400 text-sm">Wallet+ Members</p>
            <h2 className="text-3xl font-bold">{walletMembers.length}</h2>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl">
            <p className="text-gray-400 text-sm">Active Tasks</p>
            <h2 className="text-3xl font-bold">{tasks.length}</h2>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl">
            <p className="text-gray-400 text-sm">Task Submissions</p>
            <h2 className="text-3xl font-bold">{userTasks.length}</h2>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl">
            <p className="text-gray-400 text-sm">Main Wallet Balance</p>
            <h2 className="text-2xl font-bold text-green-400">
              ₦{totalMainWalletBalance.toLocaleString()}
            </h2>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl">
            <p className="text-gray-400 text-sm">Wallet+ Balance</p>
            <h2 className="text-2xl font-bold text-blue-400">
              ₦{totalWalletPlusBalance.toLocaleString()}
            </h2>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl">
            <p className="text-gray-400 text-sm">Pending Withdrawals</p>
            <h2 className="text-2xl font-bold text-yellow-400">
              ₦{totalPendingWithdrawals.toLocaleString()}
            </h2>
            <p className="text-xs text-gray-500">{pendingWithdrawals.length} requests</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl">
            <p className="text-gray-400 text-sm">Pending Advances</p>
            <h2 className="text-2xl font-bold text-purple-400">
              ₦{totalPendingAdvances.toLocaleString()}
            </h2>
            <p className="text-xs text-gray-500">{pendingAdvances.length} requests</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl md:col-span-2">
            <p className="text-gray-400 text-sm">Total Repayments</p>
            <h2 className="text-2xl font-bold text-green-400">
              ₦{totalRepayments.toLocaleString()}
            </h2>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl md:col-span-2">
            <p className="text-gray-400 text-sm">Suspicious IPs</p>
            <h2 className="text-2xl font-bold text-red-400">{fraudIPs.length}</h2>
          </div>
        </section>

        {/* WITHDRAWALS */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">💰 Withdrawal Requests</h2>
            <button
              onClick={loadData}
              className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded text-sm"
            >
              Refresh
            </button>
          </div>

          {withdrawals.length === 0 ? (
            <div className="bg-gray-900 p-5 rounded text-gray-400">
              No withdrawal requests yet.
            </div>
          ) : (
            <div className="space-y-4">
              {withdrawals.slice(0, 20).map((withdrawal) => (
                <div key={withdrawal.id} className="bg-gray-900 border border-gray-800 p-5 rounded-xl">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <p className="font-bold">{withdrawal.user_email}</p>
                      <p className="text-gray-400">
                        Amount: ₦{Number(withdrawal.amount || 0).toLocaleString()}
                      </p>
                      <p className="text-gray-400">
                        Bank: {withdrawal.bank_name || 'N/A'} {withdrawal.bank_code ? `(${withdrawal.bank_code})` : ''}
                      </p>
                      <p className="text-gray-400">
                        Account: {withdrawal.account_name || 'N/A'} - {withdrawal.account_number || 'N/A'}
                      </p>
                      <p className="text-gray-500 text-sm">
                        Transfer Status: {withdrawal.transfer_status || 'pending'}
                      </p>
                    </div>

                    <div className="flex flex-col md:items-end gap-2">
                      <span className={`text-sm px-3 py-1 rounded capitalize ${statusBadge(withdrawal.status)}`}>
                        {withdrawal.status || 'pending'}
                      </span>

                      {withdrawal.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => approveWithdrawal(withdrawal.id)}
                            className="bg-green-500 hover:bg-green-600 text-black px-3 py-2 rounded font-bold"
                          >
                            Approve & Pay
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
                </div>
              ))}
            </div>
          )}
        </section>

        {/* WALLET ADVANCES */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">💳 Wallet+ Advance Requests</h2>

          {advances.length === 0 ? (
            <div className="bg-gray-900 p-5 rounded text-gray-400">
              No advance requests yet.
            </div>
          ) : (
            <div className="space-y-4">
              {advances.slice(0, 20).map((advance) => (
                <div key={advance.id} className="bg-gray-900 border border-gray-800 p-5 rounded-xl">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold">
                        ₦{Number(advance.amount || 0).toLocaleString()} Advance
                      </h3>
                      <p className="text-gray-400 text-sm">User: {advance.user_email}</p>
                      <p className="text-gray-400 text-sm">
                        Service Fee: ₦{Number(advance.service_fee || 0).toLocaleString()}
                      </p>
                      <p className="text-gray-400 text-sm">
                        Total Settlement: ₦{Number(advance.total_repay || 0).toLocaleString()}
                      </p>
                      <p className="text-gray-400 text-sm">
                        Repayment Period: {advance.repayment_months} months
                      </p>
                    </div>

                    <span className={`text-sm px-3 py-1 rounded capitalize ${statusBadge(advance.status)}`}>
                      {advance.status}
                    </span>
                  </div>

                  <div className="bg-black p-4 rounded mt-4 text-sm text-gray-300">
                    <p>Supporter 1: {advance.supporter_one} {advance.supporter_one_approved ? '✅' : '⏳'}</p>
                    <p>Supporter 2: {advance.supporter_two} {advance.supporter_two_approved ? '✅' : '⏳'}</p>
                    <p>Disbursed: {advance.disbursed ? '✅ Yes' : '⏳ Not yet'}</p>
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

        {/* FRAUD */}
        <section className="mb-10">
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
                <div key={ip} className="bg-red-950 border border-red-700 p-4 rounded">
                  <p className="font-bold">{ip}</p>
                  <p className="text-sm text-red-200">
                    {String(count)} task activities detected from this IP.
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* REPAYMENTS */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">💵 Recent Advance Repayments</h2>

          {repayments.length === 0 ? (
            <div className="bg-gray-900 p-5 rounded text-gray-400">
              No repayments yet.
            </div>
          ) : (
            <div className="space-y-3">
              {repayments.slice(0, 10).map((repayment) => (
                <div key={repayment.id} className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
                  <p className="font-bold">{repayment.user_email}</p>
                  <p>Amount Paid: ₦{Number(repayment.amount || 0).toLocaleString()}</p>
                  <p>Status: {repayment.status}</p>
                  <p className="text-gray-400 text-sm">
                    Advance ID: {repayment.advance_id}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* USERS */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">👥 Recent Users</h2>

          {users.length === 0 ? (
            <div className="bg-gray-900 p-5 rounded text-gray-400">
              No users yet.
            </div>
          ) : (
            <div className="space-y-3">
              {users.slice(0, 30).map((user) => (
                <div key={user.id} className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
                  <p className="font-bold">{user.email}</p>
                  <p className="text-gray-400 text-sm">
                    Main Wallet: ₦{Number(user.balance_naira || 0).toLocaleString()} |
                    Spin Points: {Number(user.spin_points || 0).toLocaleString()} |
                    Fraud: {user.fraud_status || 'clear'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}