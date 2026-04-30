export default function AdvertiserTermsPage() {
  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Advertiser Terms</h1>

        <p className="text-gray-400 mb-6">
          These terms apply to companies, creators, and individuals who create
          paid campaigns on SpinEarn.
        </p>

        <section className="space-y-5 text-gray-300">
          <p>
            Advertisers may create paid campaigns for social pages, websites,
            product links, content engagement, and traffic promotion.
          </p>

          <p>
            Campaigns go live after successful payment verification. SpinEarn
            may reject or remove campaigns that violate platform rules.
          </p>

          <p>
            Advertisers must not promote illegal, fraudulent, harmful,
            misleading, adult, gambling, political hate, or prohibited content.
          </p>

          <p>
            Users are rewarded only after submitting proof and after admin
            validation. Completion numbers may depend on user participation and
            campaign settings.
          </p>

          <p>
            Campaign fees are used to publish tasks, reward eligible users, and
            support platform operations. Refunds are subject to administrative
            review.
          </p>

          <p>
            SpinEarn does not guarantee sales, followers retention, purchases,
            or long-term engagement beyond verified platform task activity.
          </p>
        </section>

        <a href="/" className="inline-block mt-8 text-green-400 underline">
          Back to Home
        </a>
      </div>
    </main>
  );
}