import { Suspense } from 'react';
import JoinContent from './JoinContent';

export const dynamic = 'force-dynamic';

export default function WalletPlusJoinPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black text-white flex items-center justify-center">
          <p>Loading Wallet+ activation...</p>
        </main>
      }
    >
      <JoinContent />
    </Suspense>
  );
}