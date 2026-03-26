export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import SuccessContent from './SuccessContent';

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="text-center mt-20 text-white">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}