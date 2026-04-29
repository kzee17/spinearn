import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { searchParams } = new URL(req.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.redirect('https://spinbyte.app/wallet-plus/dashboard?payment=no_reference');
    }

    // 🔥 Verify with Paystack
    const verify = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data = await verify.json();

    if (data?.data?.status !== 'success') {
      return NextResponse.redirect('https://spinbyte.app/wallet-plus/dashboard?payment=failed');
    }

    const email = data.data.customer.email;
    const amount = Number(data.data.amount) / 100;
    const meta = data.data.metadata || {};
    const paymentType = meta.payment_type;

    // 🔥 UPDATE PAYMENT STATUS
    await supabase
      .from('wallet_payments')
      .update({ status: 'success' })
      .eq('reference', reference);

    console.log('Payment verified:', paymentType);

    // ======================
    // 🔹 ADVERT TASK
    // ======================
    if (paymentType === 'advert_task') {
      console.log('Creating task...');

      const { error } = await supabase.from('tasks').insert([
        {
          title: meta.title,
          link: meta.link,
          reward: meta.reward || 5,
          max_completions: meta.max_completions,
          current_completions: 0,
          status: 'active',
          advertiser_email: email,
          proof_required: true,
        },
      ]);

      if (error) {
        console.error('Task creation error:', error);
      }

      return NextResponse.redirect('https://spinbyte.app/tasks');
    }

    // ======================
    // 🔹 DEFAULT
    // ======================
    return NextResponse.redirect(
      'https://spinbyte.app/wallet-plus/dashboard?payment=success'
    );
  } catch (error) {
    console.error('Verify error:', error);

    return NextResponse.redirect(
      'https://spinbyte.app/wallet-plus/dashboard?payment=error'
    );
  }
}