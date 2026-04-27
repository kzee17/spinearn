'use client';

import { supabase } from '../../../lib/supabase';

export default function PolicyPage() {

  const acceptPolicy = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      alert("Login first");
      window.location.href = "/auth";
      return;
    }

    const email = session.user.email;

    const { error } = await supabase
      .from('wallet_members')
      .upsert({
        user_email: email,
        agreed_to_policy: true
      });

    if (error) {
      alert(error.message);
      return;
    }

    window.location.href = "/wallet-plus/join";
  };

  return (
    <main className="min-h-screen bg-black text-white p-6 max-w-3xl mx-auto">

      <h1 className="text-3xl font-bold mb-6">
        📜 Wallet+ Usage Agreement
      </h1>

      <div className="text-gray-300 space-y-4 text-sm">

        <p>
          SpinEarn Wallet+ is a digital wallet and engagement platform.
          It is NOT a bank, investment platform, or financial institution.
        </p>

        <p>
          All funds are user-controlled wallet contributions used within the platform.
        </p>

        <p>
          Advance requests are supported features and must be settled
          within the selected timeframe.
        </p>

        <p>
          Platform service fee applies to advance requests.
        </p>

        <p>
          You must be 18+ to use this platform.
        </p>

      </div>

      <button
        onClick={acceptPolicy}
        className="mt-6 w-full bg-green-500 py-3 rounded font-bold"
      >
        Agree & Continue
      </button>

    </main>
  );
}