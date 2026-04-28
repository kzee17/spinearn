import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://spinbyte.app';

    if (!supabaseUrl || !serviceRoleKey || !paystackSecretKey) {
      return NextResponse.json(
        { error: 'Missing server environment variables' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();

    const {
      email,
      amount,
      payment_type,
      metadata,
    }: {
      email: string;
      amount: number;
      payment_type: 'wallet_activation' | 'savings_contribution' | 'advance_repayment';
      metadata?: any;
    } = body;

    if (!email || !amount || !payment_type) {
      return NextResponse.json(
        { error: 'Email, amount, and payment_type are required' },
        { status: 400 }
      );
    }

    const reference = `SE-${payment_type}-${Date.now()}-${Math.floor(
      Math.random() * 100000
    )}`;

    const { error: paymentError } = await supabase.from('wallet_payments').insert([
      {
        user_email: email,
        payment_type,
        amount,
        reference,
        status: 'pending',
        metadata: metadata || {},
      },
    ]);

    if (paymentError) {
      return NextResponse.json(
        { error: paymentError.message },
        { status: 500 }
      );
    }

    const paystackResponse = await fetch(
      'https://api.paystack.co/transaction/initialize',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: amount * 100,
          reference,
          callback_url: `${siteUrl}/api/wallet-plus/verify-payment`,
          metadata: {
            payment_type,
            ...metadata,
          },
        }),
      }
    );

    const paystackData = await paystackResponse.json();

    if (!paystackResponse.ok || !paystackData.status) {
      return NextResponse.json(
        { error: paystackData.message || 'Paystack initialization failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      authorization_url: paystackData.data.authorization_url,
      reference,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unexpected server error' },
      { status: 500 }
    );
  }
}