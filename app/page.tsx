import { Suspense } from 'react';
import HomeContent from './HomeContent';

export default function Home() {
  return (
    <Suspense fallback={<div className="text-center mt-20">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}