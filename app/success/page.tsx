'use client';

import { useSearchParams } from 'next/navigation';

export default function SuccessPage() {
  const searchParams = useSearchParams();

  const code = searchParams.get('ref') || '';

  const referralLink = `https://spinbyte.app?ref=${code}`;

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center text-center px-6">

      <h1 className="text-4xl font-bold mb-4">
        🎉 You're on the Waitlist!
      </h1>

      <p className="text-gray-300 mb-6">
        Invite your friends and earn early access + bonuses.
      </p>

      {/* Referral Box */}
      <div className="bg-gray-900 p-4 rounded w-full max-w-md mb-4">
        <p className="text-sm text-gray-400 mb-2">Your Referral Link:</p>
        <p className="break-all text-green-400">{referralLink}</p>
      </div>

      {/* WhatsApp Share */}
      <a
        href={`https://wa.me/?text=Join SpinEarn and start earning here: ${referralLink}`}
        target="_blank"
        className="bg-green-500 hover:bg-green-600 text-black px-6 py-3 rounded font-bold mb-4"
      >
        Share on WhatsApp 🚀
      </a>

      <p className="text-sm text-gray-400">
        🎁 Invite 5 friends to unlock priority access
      </p>

    </main>
  );
}