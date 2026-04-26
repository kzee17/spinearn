'use client';

import { useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function PolicyPage() {
  const [loading, setLoading] = useState(false);

  const acceptPolicy = async () => {
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      alert("Please login first");
      window.location.href = "/auth";
      return;
    }

    const email = session.user.email;

    const { error } = await supabase
      .from('cooperative_members')
      .upsert({
        user_email: email,
        agreed_to_policy: true
      });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    window.location.href = "/cooperative/join";
  };

  return (
    <main className="min-h-screen bg-black text-white p-6 max-w-3xl mx-auto">

      <h1 className="text-3xl font-bold mb-6">📜 Cooperative Policy Agreement</h1>

      <div className="space-y-4 text-gray-300 text-sm">

        <p>
          By joining SpinEarn Cooperative, you agree to participate in a
          member-based savings and loan support system.
        </p>

        <p>
          This platform is NOT a bank or investment scheme. All activities are
          based on cooperative participation.
        </p>

        <p>
          Loans are secured by your savings and guarantors. Default may result
          in deductions from both your savings and guarantors.
        </p>

        <p>
          You must be 18 years and above and provide accurate information.
        </p>

        <p>
          Your data will be handled in accordance with Nigeria Data Protection
          laws.
        </p>

      </div>

      <button
        onClick={acceptPolicy}
        disabled={loading}
        className="mt-6 w-full bg-green-500 py-3 rounded font-bold"
      >
        {loading ? "Processing..." : "I Agree & Continue"}
      </button>

    </main>
  );
}