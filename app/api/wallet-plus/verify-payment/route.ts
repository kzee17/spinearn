import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://spinbyte.app';

    if (!supabaseUrl || !serviceRoleKey || !paystackSecretKey) {
      return NextResponse.redirect(`${siteUrl}/wallet-plus/dashboard?payment=env_error`);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { searchParams } = new URL(req.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.redirect(`${siteUrl}/wallet-plus/dashboard?payment=no_reference`);
    }

    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
      }
    );

    const verifyData = await verifyResponse.json();

    if (!verifyResponse.ok || verifyData?.data?.status !== 'success') {
      await supabase
        .from('wallet_payments')
        .update({ status: 'failed' })
        .eq('reference', reference);

      return NextResponse.redirect(`${siteUrl}/wallet-plus/dashboard?payment=failed`);
    }

    const paymentMeta = verifyData.data.metadata || {};
    const paymentType = paymentMeta.payment_type;
    const paidAmount = Number(verifyData.data.amount || 0) / 100;
    const email = verifyData.data.customer.email;

    const { data: paymentRecord } = await supabase
      .from('wallet_payments')
      .select('*')
      .eq('reference', reference)
      .maybeSingle();

    if (paymentRecord?.status === 'success') {
      return NextResponse.redirect(`${siteUrl}/wallet-plus/dashboard?payment=already_verified`);
    }

    await supabase
      .from('wallet_payments')
      .update({ status: 'success' })
      .eq('reference', reference);

    if (paymentType === 'wallet_activation') {
      await supabase.from('wallet_members').upsert({
        user_email: email,
        membership_paid: true,
        agreed_to_policy: true,
        membership_status: 'active',
      });
    }

    if (paymentType === 'savings_contribution') {
      const savingsId = paymentMeta.savings_id;

      if (savingsId) {
        const { data: saving } = await supabase
          .from('wallet_savings')
          .select('*')
          .eq('id', savingsId)
          .maybeSingle();

        if (saving) {
          const newSaved =
            Number(saving.current_saved || 0) + Number(paidAmount || 0);

          const targetAmount = Number(saving.target_amount || 0);
          const reachedTarget = targetAmount > 0 && newSaved >= targetAmount;

          await supabase
            .from('wallet_savings')
            .update({
              current_saved: newSaved,
              locked: reachedTarget ? false : saving.locked,
              status: reachedTarget ? 'completed' : saving.status,
            })
            .eq('id', savingsId);

          const pointsToAdd = Math.floor(paidAmount / 10000) * 10;

          if (pointsToAdd > 0) {
            const { data: member } = await supabase
              .from('wallet_members')
              .select('*')
              .eq('user_email', email)
              .maybeSingle();

            if (member) {
              await supabase
                .from('wallet_members')
                .update({
                  spin_points: Number(member.spin_points || 0) + pointsToAdd,
                })
                .eq('user_email', email);
            }
          }
        }
      }
    }

    if (paymentType === 'advance_repayment') {
      const advanceId = paymentMeta.advance_id;

      if (advanceId) {
        await supabase.from('wallet_advance_repayments').insert([
          {
            advance_id: advanceId,
            user_email: email,
            amount: paidAmount,
            status: 'paid',
          },
        ]);

        const { data: repayments } = await supabase
          .from('wallet_advance_repayments')
          .select('*')
          .eq('advance_id', advanceId)
          .eq('status', 'paid');

        const totalPaid =
          repayments?.reduce(
            (sum, item) => sum + Number(item.amount || 0),
            0
          ) || 0;

        const { data: advance } = await supabase
          .from('wallet_advances')
          .select('*')
          .eq('id', advanceId)
          .maybeSingle();

        if (advance && totalPaid >= Number(advance.total_repay || 0)) {
          await supabase
            .from('wallet_advances')
            .update({
              status: 'settled',
              settled: true,
            })
            .eq('id', advanceId);
        }
      }
    }

    return NextResponse.redirect(`${siteUrl}/wallet-plus/dashboard?payment=success`);
  } catch {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://spinbyte.app';
    return NextResponse.redirect(`${siteUrl}/wallet-plus/dashboard?payment=error`);
  }
}