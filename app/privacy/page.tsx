export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>

        <p className="text-gray-400 mb-6">
          This Privacy Policy explains how SpinEarn collects, uses, and protects
          user information.
        </p>

        <section className="space-y-5 text-gray-300">
          <p>
            We may collect your name, email address, phone number, wallet
            activity, payment references, referral records, task activity,
            uploaded proof, IP address, and device information.
          </p>

          <p>
            We use this information to manage user accounts, verify task
            completion, process payments, prevent fraud, support Wallet+
            features, and improve platform performance.
          </p>

          <p>
            Payment processing is handled through approved third-party payment
            providers. SpinEarn does not store card details.
          </p>

          <p>
            Uploaded proof and activity logs may be reviewed by administrators
            for fraud prevention and reward approval.
          </p>

          <p>
            Users are responsible for ensuring that information submitted on the
            platform is accurate and lawful.
          </p>

          <p>
            We aim to process personal data responsibly and in line with
            applicable data protection requirements.
          </p>
        </section>

        <a href="/" className="inline-block mt-8 text-green-400 underline">
          Back to Home
        </a>
      </div>
    </main>
  );
}