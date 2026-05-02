import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

export async function POST(req: Request) {
  try {
    const { withdrawalId } = await req.json();

    if (!withdrawalId) {
      return NextResponse.json(
        { status: false, error: 'Withdrawal ID is required' },
        { status: 400 }
      );
    }

    const paystackKey = process.env.PAYSTACK_SECRET_KEY;

    if (!paystackKey) {
      return NextResponse.json(
        { status: false, error: 'Missing PAYSTACK_SECRET_KEY' },
        { status: 500 }
      );
    }

    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('id', withdrawalId)
      .maybeSingle();

    if (withdrawalError || !withdrawal) {
      return NextResponse.json(
        { status: false, error: 'Withdrawal not found' },
        { status: 404 }
      );
    }

    if (withdrawal.status !== 'approved') {
      return NextResponse.json(
        { status: false, error: 'Withdrawal must be approved first' },
        { status: 400 }
      );
    }

    if (withdrawal.transfer_status === 'success') {
      return NextResponse.json(
        { status: false, error: 'Withdrawal already processed' },
        { status: 400 }
      );
    }

    const { data: user, error: userError } = await supabase
      .from('waitlist_users')
      .select('*')
      .eq('email', withdrawal.user_email)
      .maybeSingle();

    if (userError || !user) {
      return NextResponse.json(
        { status: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.fraud_status && user.fraud_status !== 'clear') {
      return NextResponse.json(
        { status: false, error: 'User is flagged for fraud review' },
        { status: 403 }
      );
    }

    if (Number(user.balance_naira || 0) < Number(withdrawal.amount || 0)) {
      return NextResponse.json(
        { status: false, error: 'Insufficient user balance' },
        { status: 400 }
      );
    }

    const recipientResponse = await fetch(
      'https://api.paystack.co/transferrecipient',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${paystackKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'nuban',
          name: withdrawal.account_name,
          account_number: withdrawal.account_number,
          bank_code: withdrawal.bank_code,
          currency: 'NGN',
        }),
      }
    );

    const recipientData = await recipientResponse.json();

    if (!recipientResponse.ok || !recipientData.status) {
      await supabase
        .from('withdrawals')
        .update({
          transfer_status: 'failed',
          transfer_error:
            recipientData.message || 'Transfer recipient creation failed',
        })
        .eq('id', withdrawalId);

      return NextResponse.json(
        {
          status: false,
          error: recipientData.message || 'Recipient creation failed',
        },
        { status: 400 }
      );
    }

    const transferResponse = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'balance',
        amount: Number(withdrawal.amount) * 100,
        recipient: recipientData.data.recipient_code,
        reason: `SpinEarn withdrawal for ${withdrawal.user_email}`,
      }),
    });

    const transferData = await transferResponse.json();

    if (!transferResponse.ok || !transferData.status) {
      await supabase
        .from('withdrawals')
        .update({
          transfer_status: 'failed',
          transfer_error: transferData.message || 'Transfer failed',
        })
        .eq('id', withdrawalId);

      return NextResponse.json(
        { status: false, error: transferData.message || 'Transfer failed' },
        { status: 400 }
      );
    }

    const newBalance =
      Number(user.balance_naira || 0) - Number(withdrawal.amount || 0);

    await supabase
      .from('waitlist_users')
      .update({
        balance_naira: newBalance,
      })
      .eq('email', withdrawal.user_email);

    await supabase
      .from('withdrawals')
      .update({
        transfer_status: 'processing',
        transfer_reference: transferData.data.reference,
        recipient_code: recipientData.data.recipient_code,
        processed_at: new Date().toISOString(),
      })
      .eq('id', withdrawalId);

    await supabase.from('notifications').insert([
      {
        user_email: withdrawal.user_email,
        title: 'Withdrawal Processing',
        message: `Your withdrawal of ₦${Number(
          withdrawal.amount
        ).toLocaleString()} is now being processed.`,
      },
    ]);

    return NextResponse.json({
      status: true,
      message: 'Withdrawal sent to Paystack successfully',
      reference: transferData.data.reference,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: false, error: error.message || 'Withdrawal processing failed' },
      { status: 500 }
    );
  }
}