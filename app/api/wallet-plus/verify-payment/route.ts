import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://spinbyte.app';

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

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
        headers: { Authorization: `Bearer ${paystackSecretKey}` },
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

    await supabase.from('notifications').insert([
      {
        user_email: email,
        title: 'Payment Successful',
        message: `Your payment of ₦${paidAmount.toLocaleString()} was successful.`,
      },
    ]);

    if (paymentType === 'wallet_activation') {
      const referredBy = meta.referred_by || null;

      const referralCode = `WP-${email
        .split('@')[0]
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 6)
        .toUpperCase()}-${Math.floor(Math.random() * 10000)}`;

      await supabase.from('wallet_members').upsert({
        user_email: email,
        membership_paid: true,
        agreed_to_policy: true,
        membership_status: 'active',
        referral_code: referralCode,
        referred_by: referredBy,
      });

      return NextResponse.redirect(`${siteUrl}/wallet-plus/dashboard?payment=success`);
    }

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

      const { error } = await supabase.from('tasks').insert([
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

      if (error) {
        return NextResponse.redirect(
          `${siteUrl}/wallet-plus/dashboard?payment=task_insert_failed`
        );
      }

      return NextResponse.redirect(`${siteUrl}/tasks`);
    }

    return NextResponse.redirect(`${siteUrl}/wallet-plus/dashboard?payment=success`);
  } catch (error) {
    console.error('Verify payment error:', error);
    return NextResponse.redirect(`${siteUrl}/wallet-plus/dashboard?payment=error`);
  }
}