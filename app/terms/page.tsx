export default function TermsPage() {
  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Terms of Use</h1>

        <p className="text-gray-400 mb-6">
          Welcome to SpinEarn by Spinbyte International Ltd. By using this
          platform, you agree to these terms.
        </p>

        <section className="space-y-5 text-gray-300">
          <p>
            SpinEarn is a digital engagement, rewards, Wallet+, and advertising
            platform. It is not a bank, investment scheme, or guaranteed income
            programme.
          </p>

          <p>
            Users may earn Spin Points by completing verified tasks. Rewards are
            only credited after proof review and platform approval.
          </p>

          <p>
            Wallet+ is a membership-based digital wallet feature for platform
            participation, savings contribution tracking, referrals, and
            controlled advance requests subject to platform rules.
          </p>

          <p>
            Users must provide accurate information and must not create fake
            accounts, submit false proof, abuse referrals, or manipulate task
            completion.
          </p>

          <p>
            SpinEarn may suspend or restrict any account involved in fraud,
            abuse, false claims, chargeback abuse, or violation of platform
            rules.
          </p>

          <p>
            Users must be 18 years or older to use Wallet+ and payment-related
            features.
          </p>
        </section>

        <a href="/" className="inline-block mt-8 text-green-400 underline">
          Back to Home
        </a>
      </div>
    </main>
  );
}