export default function CooperativePage() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center text-center px-6">

      <h1 className="text-4xl font-bold mb-4">
        🏦 SpinEarn Cooperative
      </h1>

      <p className="text-gray-400 max-w-xl mb-6">
        Save, borrow, and grow together with a trusted member-based financial system.
      </p>

      <a
        href="/cooperative/policy"
        className="bg-green-500 px-6 py-3 rounded font-bold"
      >
        Get Started
      </a>

    </main>
  );
}