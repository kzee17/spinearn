import { Suspense } from 'react';
import HomeContent from './HomeContent';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black text-white flex items-center justify-center">
          Loading SpinEarn...
        </main>
      }
    >
      <HomeContent />
    </Suspense>
  );
}