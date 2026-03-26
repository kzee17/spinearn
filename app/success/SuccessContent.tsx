'use client';

import { useSearchParams } from 'next/navigation';

export default function SuccessContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('ref') || '';

  const referralLink = `https://spinbyte.app?ref=${code}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    alert('✅ Referral link copied!');
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

      {/* Buttons */}
      <div className="flex flex-col gap-3 w-full max-w-md">

        {/* Copy Button */}
        <button
          onClick={copyToClipboard}
          className="bg-gray-700 hover:bg-gray-600 py-3 rounded font-bold"
        >
          Copy Link 📋
        </button>

        {/* WhatsApp Share */}
        <a
          href={`https://wa.me/?text=Join SpinEarn and start earning here: ${referralLink}`}
          target="_blank"
          className="bg-green-500 hover:bg-green-600 text-black py-3 rounded font-bold text-center"
        >
          Share on WhatsApp 🚀
        </a>

        {/* Wallet Link */}
        <a
          href="/wallet"
          className="bg-blue-500 hover:bg-blue-600 py-3 rounded font-bold text-center"
        >
          View Wallet 💼
        </a>

        {/* Leaderboard Link */}
        <a
          href="/leaderboard"
          className="bg-yellow-500 hover:bg-yellow-600 text-black py-3 rounded font-bold text-center"
        >
          View Leaderboard 🏆
        </a>
        
        View Tasks 🏆
        <a href="/tasks" className="bg-purple-500 py-3 rounded font-bold text-center">
  Start Earning 💰
</a>

      </div>

      {/* Incentive */}
      <p className="text-sm text-gray-400 mt-6">
        🎁 Invite 5 friends → Unlock priority access  
        <br />
        🔥 Top referrers earn more rewards
      </p>

    </main>
  );
}