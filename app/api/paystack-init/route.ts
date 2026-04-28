import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const paystackKey = process.env.PAYSTACK_SECRET_KEY!;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://spinbyte.app';

    if (!supabaseUrl || !serviceRoleKey || !paystackKey) {
      return NextResponse.json(
        { error: 'Missing environment variables' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { email, amount, payment_type, metadata } = body;

    if (!email || !amount || !payment_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 🔥 Generate unique reference
    const reference = `SE-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

    // 🔥 Save payment BEFORE redirect
    const { error: insertError } = await supabase.from('wallet_payments').insert([
      {
        user_email: email,
        payment_type,
        amount,
        reference,
        status: 'pending',
        metadata: metadata || {},
      },
    ]);

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    // 🔥 Call Paystack
    const response = await fetch(
      'https://api.paystack.co/transaction/initialize',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${paystackKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: amount * 100, // convert to kobo
          reference,
          callback_url: `${siteUrl}/api/wallet-plus/verify-payment`,
          metadata: {
            payment_type,
            ...metadata,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.status) {
      return NextResponse.json(
        { error: data.message || 'Paystack error' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      authorization_url: data.data.authorization_url,
      reference,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}