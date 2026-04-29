import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://spinbyte.app';

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!supabaseUrl || !serviceRoleKey || !paystackSecretKey) {
      return NextResponse.redirect(
        `${siteUrl}/wallet-plus/dashboard?payment=env_error`
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { searchParams } = new URL(req.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.redirect(
        `${siteUrl}/wallet-plus/dashboard?payment=no_reference`
      );
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

      return NextResponse.redirect(
        `${siteUrl}/wallet-plus/dashboard?payment=failed`
      );
    }

    const email = verifyData.data.customer.email;
    const paidAmount = Number(verifyData.data.amount || 0) / 100;
    const meta = verifyData.data.metadata || {};
    const paymentType = meta.payment_type;

    const { data: existingPayment } = await supabase
      .from('wallet_payments')
      .select('*')
      .eq('reference', reference)
      .maybeSingle();

    if (existingPayment?.status === 'success') {
      if (paymentType === 'advert_task') {
        return NextResponse.redirect(`${siteUrl}/tasks`);
      }

      return NextResponse.redirect(
        `${siteUrl}/wallet-plus/dashboard?payment=already_verified`
      );
    }

    await supabase
      .from('wallet_payments')
      .update({ status: 'success' })
      .eq('reference', reference);

    // Wallet+ Activation
    if (paymentType === 'wallet_activation') {
      await supabase.from('wallet_members').upsert({
        user_email: email,
        membership_paid: true,
        agreed_to_policy: true,
        membership_status: 'active',
      });

      return NextResponse.redirect(
        `${siteUrl}/wallet-plus/dashboard?payment=success`
      );
    }

    // Savings Contribution
    if (paymentType === 'savings_contribution') {
      const savingsId = meta.savings_id;

      if (savingsId) {
        const { data: saving } = await supabase
          .from('wallet_savings')
          .select('*')
          .eq('id', savingsId)
          .maybeSingle();

        if (saving) {
          const newSaved = Number(saving.current_saved || 0) + paidAmount;
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

      return NextResponse.redirect(
        `${siteUrl}/wallet-plus/dashboard?payment=success`
      );
    }

    // Advance Repayment
    if (paymentType === 'advance_repayment') {
      const advanceId = meta.advance_id;

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

      return NextResponse.redirect(
        `${siteUrl}/wallet-plus/dashboard?payment=success`
      );
    }

    // Advertiser Paid Task
    if (paymentType === 'advert_task') {
      const title = meta.title || 'Advert Task';
      const link = meta.link;
      const reward = Number(meta.reward || 5);
      const maxCompletions = Number(meta.max_completions || 100);

      if (!link) {
        return NextResponse.redirect(
          `${siteUrl}/wallet-plus/dashboard?payment=missing_advert_link`
        );
      }

      const { error: taskInsertError } = await supabase.from('tasks').insert([
        {
          title,
          link,
          reward,
          max_completions: maxCompletions,
          current_completions: 0,
          status: 'active',
          advertiser_email: email,
          proof_required: true,
        },
      ]);

      if (taskInsertError) {
        console.error('Advert task insert error:', taskInsertError.message);

        return NextResponse.redirect(
          `${siteUrl}/wallet-plus/dashboard?payment=task_insert_failed`
        );
      }

      return NextResponse.redirect(`${siteUrl}/tasks`);
    }

    return NextResponse.redirect(
      `${siteUrl}/wallet-plus/dashboard?payment=success`
    );
  } catch (error) {
    console.error('Verify payment error:', error);

    return NextResponse.redirect(
      `${siteUrl}/wallet-plus/dashboard?payment=error`
    );
  }
}