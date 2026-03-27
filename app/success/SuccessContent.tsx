'use client';

import { useSearchParams } from 'next/navigation';

export default function SuccessContent() {
  const searchParams = useSearchParams();

  const code = searchParams.get('ref') || '';
  const referralLink = `https://spinbyte.app?ref=${code}`;

  // 📋 Copy function
  const copyLink = async () => {
    await navigator.clipboard.writeText(referralLink);
    alert("✅ Link copied!");
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center text-center px-6">

      <h1 className="text-4xl font-bold mb-4">
        🎉 You're on the Waitlist!
      </h1>

      <p className="text-gray-300 mb-6">
        Invite your friends and earn Spin Points + early access bonuses.
      </p>

      {/* Referral Box */}
      <div className="bg-gray-900 p-4 rounded w-full max-w-md mb-4">
        <p className="text-sm text-gray-400 mb-2">Your Referral Link:</p>
        <p className="break-all text-green-400">{referralLink}</p>
      </div>

      {/* Copy Button */}
      <button
        onClick={copyLink}
        className="w-full max-w-md bg-gray-700 hover:bg-gray-600 py-3 rounded font-bold mb-3"
      >
        Copy Link 📋
      </button>

      {/* WhatsApp Share */}
      <a
        href={`https://wa.me/?text=Join SpinEarn and start earning here: ${referralLink}`}
        target="_blank"
        className="w-full max-w-md bg-green-500 hover:bg-green-600 text-black py-3 rounded font-bold mb-3"
      >
        Share on WhatsApp 🚀
      </a>

      {/* Wallet */}
      <a
        href="/wallet"
        className="w-full max-w-md bg-blue-500 hover:bg-blue-600 py-3 rounded font-bold mb-3"
      >
        View Wallet 💼
      </a>

      {/* Leaderboard */}
      <a
        href="/leaderboard"
        className="w-full max-w-md bg-yellow-500 hover:bg-yellow-600 text-black py-3 rounded font-bold mb-3"
      >
        View Leaderboard 🏆
      </a>

      {/* ✅ FIXED: VIEW TASKS BUTTON */}
      <a
        href="/tasks"
        className="w-full max-w-md bg-purple-500 hover:bg-purple-600 py-3 rounded font-bold mb-3"
      >
        View Tasks 🎯
      </a>

      {/* Start Earning */}
      <a
        href="/tasks"
        className="w-full max-w-md bg-gradient-to-r from-purple-500 to-pink-500 py-3 rounded font-bold"
      >
        Start Earning 💰
      </a>

      <p className="text-sm text-gray-400 mt-4">
        🎁 Invite 5 friends to unlock priority access
      </p>

    </main>
  );
}