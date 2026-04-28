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

    // 🔥 Verify payment with Paystack
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

    // 🔥 Mark payment as success
    await supabase
      .from('wallet_payments')
      .update({ status: 'success' })
      .eq('reference', reference);

    // =========================
    // 🔹 WALLET+ ACTIVATION
    // =========================
    if (paymentType === 'wallet_activation') {
      await supabase.from('wallet_members').upsert({
        user_email: email,
        membership_paid: true,
        membership_status: 'active',
        agreed_to_policy: true,
      });

      return NextResponse.redirect(
        'https://spinbyte.app/wallet-plus/dashboard?payment=success'
      );
    }

    // =========================
    // 🔹 SAVINGS CONTRIBUTION
    // =========================
    if (paymentType === 'savings_contribution') {
      const savingsId = meta.savings_id;

      if (savingsId) {
        const { data: saving } = await supabase
          .from('wallet_savings')
          .select('*')
          .eq('id', savingsId)
          .maybeSingle();

        if (saving) {
          const newSaved =
            Number(saving.current_saved || 0) + amount;

          await supabase
            .from('wallet_savings')
            .update({
              current_saved: newSaved,
            })
            .eq('id', savingsId);
        }
      }

      return NextResponse.redirect(
        'https://spinbyte.app/wallet-plus/dashboard?payment=success'
      );
    }

    // =========================
    // 🔹 ADVANCE REPAYMENT
    // =========================
    if (paymentType === 'advance_repayment') {
      const advanceId = meta.advance_id;

      if (advanceId) {
        await supabase.from('wallet_advance_repayments').insert([
          {
            advance_id: advanceId,
            user_email: email,
            amount,
            status: 'paid',
          },
        ]);
      }

      return NextResponse.redirect(
        'https://spinbyte.app/wallet-plus/dashboard?payment=success'
      );
    }

    // =========================
    // 🔹 ADVERTISER TASK CREATION
    // =========================
    if (paymentType === 'advert_task') {
      await supabase.from('tasks').insert([
        {
          title: meta.title,
          link: meta.link,
          reward: 5,
          max_completions: meta.max_completions,
          current_completions: 0,
          status: 'active',
          advertiser_email: email,
          proof_required: true,
        },
      ]);

      return NextResponse.redirect('https://spinbyte.app/tasks');
    }

    // =========================
    // 🔹 DEFAULT FALLBACK
    // =========================
    return NextResponse.redirect(
      'https://spinbyte.app/wallet-plus/dashboard?payment=success'
    );
  } catch (error) {
    console.error(error);

    return NextResponse.redirect(
      'https://spinbyte.app/wallet-plus/dashboard?payment=error'
    );
  }
}