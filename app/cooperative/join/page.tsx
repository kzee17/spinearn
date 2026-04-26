'use client';

import { useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function JoinPage() {
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      alert("Login required");
      window.location.href = "/auth";
      return;
    }

    const email = session.user.email;

    const { error } = await supabase
      .from('cooperative_members')
      .update({
        registration_paid: true,
        membership_status: 'active'
      })
      .eq('user_email', email);

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("🎉 Membership Activated!");
    window.location.href = "/cooperative/dashboard";
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">

      <h1 className="text-3xl font-bold mb-4">
        Join Cooperative
      </h1>

      <p className="text-gray-400 mb-6 text-center max-w-md">
        Pay ₦1,000 to activate your cooperative membership and unlock savings and loan features.
      </p>

      <button
        onClick={handleJoin}
        className="bg-green-500 px-6 py-3 rounded font-bold"
      >
        {loading ? "Processing..." : "Pay ₦1,000 & Join"}
      </button>

    </main>
  );
}