import { Suspense } from 'react';
import DashboardContent from './DashboardContent';

export const dynamic = 'force-dynamic';

export default function WalletPlusDashboardPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black text-white flex items-center justify-center">
          <p>Loading Wallet+ dashboard...</p>
        </main>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}