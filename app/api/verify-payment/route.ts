import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // IMPORTANT
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get('reference');

  const verify = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    },
  });

  const data = await verify.json();

  if (data.data.status !== 'success') {
    return NextResponse.redirect('https://spinbyte.app/payment-failed');
  }

  const meta = data.data.metadata;

  // 🔥 CREATE TASK AUTOMATICALLY
  await supabase.from('tasks').insert([
    {
      title: meta.title,
      link: meta.link,
      reward: 5,
      max_completions: meta.max_completions,
      current_completions: 0,
      status: 'active',
      advertiser_email: data.data.customer.email,
      proof_required: true,
    },
  ]);

  return NextResponse.redirect('https://spinbyte.app/tasks');
}