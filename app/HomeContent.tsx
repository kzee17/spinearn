'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function HomeContent() {
  const searchParams = useSearchParams();

  const [ref, setRef] = useState('');
  const [userCount, setUserCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sessionUser, setSessionUser] = useState<any>(null);

  useEffect(() => {
    const referral = searchParams.get('ref');
    if (referral) setRef(referral);

    checkSession();
    fetchUserCount();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      checkSession();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [searchParams]);

  const checkSession = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    setSessionUser(session?.user || null);

    if (session?.user?.email) {
      fetchUnread(session.user.email);
    } else {
      setUnreadCount(0);
    }
  };

  const fetchUnread = async (email: string) => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_email', email)
      .eq('status', 'unread');

    setUnreadCount(data?.length || 0);
  };

 const fetchUserCount = async () => {
  const { count, error } = await supabase
    .from('waitlist_users')
    .select('id', { count: 'exact', head: true });

  if (error) {
    console.error('User count error:', error.message);
    setUserCount(0);
    return;
  }

  setUserCount(count ?? 0);
};

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSessionUser(null);
    setUnreadCount(0);
    alert('You have logged out successfully.');
    window.location.href = '/';
  };

  return (
    <main className="min-h-screen bg-black text-white">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="SpinEarn Logo"
              className="w-12 h-12 rounded-full bg-white object-contain p-1"
            />
            <div>
              <h1 className="text-xl font-bold text-green-400">SpinEarn</h1>
              <p className="text-xs text-gray-400">by Spinbyte</p>
            </div>
          </a>

          <nav className="hidden md:flex items-center gap-5 text-sm">
            <a href="#how" className="hover:text-green-400">How it Works</a>
            <a href="#trust" className="hover:text-green-400">Trust</a>
            <a href="#walletplus" className="hover:text-green-400">Wallet+</a>
            <a href="/tasks" className="hover:text-green-400">Tasks</a>
            <a href="/advertise" className="hover:text-green-400">Advertise</a>
            <a href="/leaderboard" className="hover:text-green-400">Leaderboard</a>

            {sessionUser && (
              <a
                href="/notifications"
                className="relative bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded text-sm"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </a>
            )}
          </nav>

          <div className="flex gap-2 items-center">
            {sessionUser ? (
              <>
                <a
                  href="/wallet"
                  className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded text-sm font-bold"
                >
                  Wallet
                </a>

                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-sm font-bold"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <a
                  href="/auth"
                  className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded text-sm"
                >
                  Login
                </a>

                <a
                  href={`/auth?mode=signup${ref ? `&ref=${ref}` : ''}`}
                  className="bg-green-500 hover:bg-green-600 text-black px-4 py-2 rounded text-sm font-bold"
                >
                  Join Now
                </a>

                <a
                  href="/admin"
                  className="bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded text-sm font-bold"
                >
                  Admin
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div>
          <div className="inline-block bg-green-900/40 border border-green-600 text-green-300 px-4 py-2 rounded-full text-sm mb-5">
            🔥 {userCount} registered users on SpinEarn
          </div>

          <h2 className="text-4xl md:text-6xl font-extrabold leading-tight mb-5">
            Earn, Save, Promote and Grow Digitally with SpinEarn
          </h2>

          <p className="text-gray-300 text-lg mb-5">
            SpinEarn is a digital engagement and Wallet+ platform powered by
            Spinbyte International Ltd. Users complete verified tasks, upload
            proof, earn Spin Points, and participate in Wallet+ activities.
          </p>

          <div className="bg-gray-900 border border-green-700 p-4 rounded-xl mb-8">
            <p className="text-green-300 font-bold mb-1">
              ✅ Built for transparency, not fake promises.
            </p>
            <p className="text-gray-300 text-sm">
              SpinEarn does not promise overnight wealth or guaranteed income.
              Rewards are earned only through verified platform activity.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={`/auth?mode=signup${ref ? `&ref=${ref}` : ''}`}
              className="bg-green-500 hover:bg-green-600 text-black px-6 py-3 rounded font-bold text-center"
            >
              Sign Up / Join Now
            </a>

            <a
              href="/tasks"
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded font-bold text-center"
            >
              View Tasks
            </a>

            <a
              href="/advertise"
              className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded font-bold text-center"
            >
              Advertise
            </a>
          </div>
        </div>

        {/* JOIN CARD */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
          <h3 className="text-2xl font-bold mb-2">Join SpinEarn Today</h3>

          <p className="text-gray-400 mb-5">
            Create your SpinEarn account with your name, phone number, email,
            and password. After registration, you can login, complete tasks,
            upload proof, and earn Spin Points after approval.
          </p>

          <div className="bg-black/50 border border-green-700 p-4 rounded-xl mb-5">
            <p className="text-green-300 font-bold mb-1">
              ✅ Secure signup for new members
            </p>
            <p className="text-gray-300 text-sm">
              Passwords are handled securely by Supabase Auth. SpinEarn does not
              store your password inside the public user profile table.
            </p>
          </div>

          <a
            href={`/auth?mode=signup${ref ? `&ref=${ref}` : ''}`}
            className="block w-full bg-green-500 hover:bg-green-600 text-black py-3 rounded font-bold text-center"
          >
            Sign Up / Join Now 🚀
          </a>

          <a
            href="/auth"
            className="block w-full mt-3 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded font-bold text-center"
          >
            Already Registered? Login
          </a>

          <div className="bg-black/50 border border-gray-700 p-3 rounded mt-4">
            <p className="text-xs text-gray-300">
              🔒 We only request basic registration details. Rewards are
              credited only after verified task proof.
            </p>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Platform manager?{' '}
            <a href="/admin" className="text-purple-400 underline">
              Admin Login
            </a>
          </p>
        </div>
      </section>

      {/* TRUST BADGES */}
      <section id="trust" className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl">
          <p className="text-green-400 font-bold">✅ Powered by Spinbyte</p>
          <p className="text-gray-400 text-sm mt-2">
            Built by Spinbyte International Ltd, an Abuja-based engineering and
            technology company.
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl">
          <p className="text-green-400 font-bold">✅ Verified Tasks</p>
          <p className="text-gray-400 text-sm mt-2">
            Users upload proof before rewards are credited.
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl">
          <p className="text-green-400 font-bold">✅ Fraud Checks</p>
          <p className="text-gray-400 text-sm mt-2">
            Suspicious activity can be flagged before payout.
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl">
          <p className="text-green-400 font-bold">✅ Clear Rules</p>
          <p className="text-gray-400 text-sm mt-2">
            No guaranteed returns. Rewards depend on verified activity.
          </p>
        </div>
      </section>
<section className="max-w-7xl mx-auto px-6 py-8">
  <div className="bg-yellow-950/40 border border-yellow-700 p-6 rounded-2xl">
    <h2 className="text-2xl font-bold text-yellow-300 mb-3">
      🚀 SpinEarn is Currently in Early Access
    </h2>

    <p className="text-gray-300 mb-3">
      SpinEarn is still growing. We are currently onboarding early users,
      testing verified tasks, improving Wallet+, and preparing the platform for
      real advertiser campaigns.
    </p>

    <p className="text-gray-400 text-sm">
      We do not display fake withdrawal proofs, inflated numbers, or false
      earning claims. Every visible number on SpinEarn is based on real platform
      activity.
    </p>
  </div>
</section>

      {/* ABOUT SPINBYTE */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-3xl font-bold mb-4">
              About Spinbyte International Ltd
            </h2>

            <p className="text-gray-300 mb-4">
              SpinEarn is developed by Spinbyte International Ltd, a technology
              and engineering company focused on MEP engineering, smart
              infrastructure, ICT solutions, and AI training.
            </p>

            <p className="text-gray-400">
              Spinbyte’s broader mission is to support smart infrastructure,
              professional technology solutions, and digital transformation for
              individuals, businesses, and institutions.
            </p>

            <a
              href="https://spinbyteltd.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-6 bg-blue-500 hover:bg-blue-600 text-white px-5 py-3 rounded font-bold"
            >
              Visit Spinbyte Official Website
            </a>
          </div>

          <div className="bg-black/50 border border-gray-700 p-6 rounded-xl">
            <h3 className="text-xl font-bold mb-4">Why this matters</h3>

            <ul className="space-y-3 text-gray-300 text-sm">
              <li>✅ SpinEarn is not an anonymous platform.</li>
              <li>✅ It is connected to a known technology brand.</li>
              <li>✅ The reward system is based on completed tasks.</li>
              <li>✅ Wallet+ is clearly separated from investment schemes.</li>
              <li>✅ Users are rewarded after validation, not by false promises.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 p-5 rounded-xl">
          <p className="text-gray-400 text-sm">Members</p>
          <h3 className="text-3xl font-bold text-green-400">{userCount}</h3>
        </div>

        <div className="bg-gray-900 p-5 rounded-xl">
          <p className="text-gray-400 text-sm">Earning Method</p>
          <h3 className="text-2xl font-bold">Verified Tasks</h3>
        </div>

        <div className="bg-gray-900 p-5 rounded-xl">
          <p className="text-gray-400 text-sm">Wallet System</p>
          <h3 className="text-2xl font-bold">Wallet+</h3>
        </div>

        <div className="bg-gray-900 p-5 rounded-xl">
          <p className="text-gray-400 text-sm">Business Growth</p>
          <h3 className="text-2xl font-bold">Advertise</h3>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-10">
          How SpinEarn Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-gray-900 p-6 rounded-xl">
            <h3 className="text-xl font-bold mb-3">1. Join the Platform</h3>
            <p className="text-gray-400">
              Create your account, login, and access tasks, Wallet+, and
              referral opportunities.
            </p>
          </div>

          <div className="bg-gray-900 p-6 rounded-xl">
            <h3 className="text-xl font-bold mb-3">
              2. Complete Verified Tasks
            </h3>
            <p className="text-gray-400">
              Visit assigned links, engage with content, upload proof, and earn
              Spin Points only after validation.
            </p>
          </div>

          <div className="bg-gray-900 p-6 rounded-xl">
            <h3 className="text-xl font-bold mb-3">3. Grow Your Wallet</h3>
            <p className="text-gray-400">
              Use Wallet+ for savings tracking, referrals, participation
              records, and controlled advance requests.
            </p>
          </div>
        </div>
      </section>

      {/* HOW MONEY FLOWS */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-blue-950/40 border border-blue-700 p-8 rounded-2xl">
          <h2 className="text-3xl font-bold mb-4">
            How the Reward System Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-black/40 p-5 rounded-xl">
              <h3 className="font-bold text-blue-300 mb-2">
                1. Advertisers Promote
              </h3>
              <p className="text-gray-300 text-sm">
                Businesses and creators can publish engagement campaigns and
                tasks.
              </p>
            </div>

            <div className="bg-black/40 p-5 rounded-xl">
              <h3 className="font-bold text-blue-300 mb-2">
                2. Users Complete Tasks
              </h3>
              <p className="text-gray-300 text-sm">
                Users visit links, follow instructions, and upload proof for
                validation.
              </p>
            </div>

            <div className="bg-black/40 p-5 rounded-xl">
              <h3 className="font-bold text-blue-300 mb-2">
                3. Rewards Are Credited
              </h3>
              <p className="text-gray-300 text-sm">
                Approved proofs earn Spin Points according to platform rules.
              </p>
            </div>
          </div>

          <p className="text-yellow-300 text-sm mt-6">
            ⚠️ SpinEarn is not a get-rich-quick scheme. Earnings depend on real
            task availability, successful completion, and verification.
          </p>
        </div>
      </section>

      {/* WALLET PLUS */}
      <section id="walletplus" className="max-w-7xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-br from-green-900 to-gray-900 p-8 rounded-2xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4">💼 SpinEarn Wallet+</h2>

            <p className="text-gray-200 mb-5">
              Wallet+ is a digital wallet and membership feature that helps
              users participate in savings contributions, referral rewards,
              Spin Points, and controlled advance requests.
            </p>

            <ul className="space-y-2 text-gray-200 mb-6">
              <li>✅ ₦1,000 Wallet+ activation</li>
              <li>✅ Savings contribution tracking</li>
              <li>✅ Referral reward automation</li>
              <li>✅ Supporter-based advance requests</li>
              <li>✅ Spin Points from platform activities</li>
            </ul>

            <a
              href="/wallet-plus"
              className="inline-block bg-green-500 hover:bg-green-600 text-black px-6 py-3 rounded font-bold"
            >
              Explore Wallet+
            </a>
          </div>

          <div className="bg-black/40 p-6 rounded-xl">
            <h3 className="text-xl font-bold mb-4">Important Notice</h3>
            <p className="text-gray-300 text-sm mb-4">
              Wallet+ is not a bank, investment scheme, loan company, or
              guaranteed return platform.
            </p>

            <p className="text-gray-300 text-sm">
              It is a digital wallet, rewards, savings tracking, and membership
              feature governed by platform usage rules and user consent.
            </p>
          </div>
        </div>
      </section>

      {/* ADVERTISERS */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-10">
          For Companies, Creators and Advertisers
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-900 p-6 rounded-xl">
            <h3 className="text-2xl font-bold mb-3">📢 Promote Your Brand</h3>
            <p className="text-gray-400 mb-5">
              Pay to publish social media follow tasks, content engagement
              tasks, product links, traffic links, or page visibility campaigns.
            </p>

            <a
              href="/advertise"
              className="bg-yellow-500 hover:bg-yellow-600 text-black px-5 py-3 rounded font-bold inline-block"
            >
              Create Campaign
            </a>
          </div>

          <div className="bg-gray-900 p-6 rounded-xl">
            <h3 className="text-2xl font-bold mb-3">📊 Track Campaigns</h3>
            <p className="text-gray-400 mb-5">
              Advertisers can monitor campaign performance, completions,
              remaining slots, and audience response through the advertiser
              dashboard.
            </p>

            <a
              href="/advertise/dashboard"
              className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-3 rounded font-bold inline-block"
            >
              Advertiser Dashboard
            </a>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-7xl mx-auto px-6 py-16 text-center">
        <div className="bg-gray-900 p-8 rounded-2xl">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Join a Transparent Digital Engagement Platform?
          </h2>

          <p className="text-gray-400 max-w-2xl mx-auto mb-6">
            Whether you want to earn Spin Points from verified tasks, use
            Wallet+, promote your brand, or track platform activity, SpinEarn
            gives you one connected digital engagement system.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <a
              href={`/auth?mode=signup${ref ? `&ref=${ref}` : ''}`}
              className="bg-green-500 hover:bg-green-600 text-black px-6 py-3 rounded font-bold"
            >
              Sign Up / Join Now
            </a>

            <a
              href="/auth"
              className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded font-bold"
            >
              Login
            </a>

            <a
              href="/wallet-plus"
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded font-bold"
            >
              Join Wallet+
            </a>

            <a
              href="/advertise"
              className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded font-bold"
            >
              Advertise Now
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between gap-4 text-sm text-gray-400">
          <p>
            © {new Date().getFullYear()} SpinEarn by Spinbyte International Ltd.
          </p>

          <div className="flex flex-wrap gap-4">
            <a href="/tasks" className="hover:text-green-400">Tasks</a>
            <a href="/wallet-plus" className="hover:text-green-400">Wallet+</a>
            <a href="/advertise" className="hover:text-green-400">Advertise</a>
            <a href="/admin" className="hover:text-green-400">Admin Login</a>
            <a href="/terms" className="hover:text-green-400">Terms</a>
            <a href="/privacy" className="hover:text-green-400">Privacy</a>
            <a href="/advertiser-terms" className="hover:text-green-400">
              Advertiser Terms
            </a>
            <a
              href="https://spinbyteltd.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-green-400"
            >
              Spinbyte Website
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}