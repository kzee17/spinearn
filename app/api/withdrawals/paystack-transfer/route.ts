import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const paystackKey = process.env.PAYSTACK_SECRET_KEY;

    if (!supabaseUrl || !serviceRoleKey || !paystackKey) {
      return NextResponse.json(
        { error: 'Missing environment variables' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { withdrawal_id } = await req.json();

    if (!withdrawal_id) {
      return NextResponse.json(
        { error: 'withdrawal_id is required' },
        { status: 400 }
      );
    }

    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('id', withdrawal_id)
      .maybeSingle();

    if (withdrawalError || !withdrawal) {
      return NextResponse.json(
        { error: 'Withdrawal request not found' },
        { status: 404 }
      );
    }

    if (withdrawal.status !== 'pending') {
      return NextResponse.json(
        { error: 'Withdrawal is not pending' },
        { status: 400 }
      );
    }

    const { data: user } = await supabase
      .from('waitlist_users')
      .select('*')
      .eq('email', withdrawal.user_email)
      .maybeSingle();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.fraud_status && user.fraud_status !== 'clear') {
      return NextResponse.json(
        { error: 'User is fraud flagged. Review before payout.' },
        { status: 403 }
      );
    }

    const amount = Number(withdrawal.amount || 0);
    const balance = Number(user.balance_naira || 0);

    if (amount <= 0 || balance < amount) {
      return NextResponse.json(
        { error: 'Insufficient user balance' },
        { status: 400 }
      );
    }

    if (
      !withdrawal.account_number ||
      !withdrawal.bank_code ||
      !withdrawal.account_name
    ) {
      return NextResponse.json(
        { error: 'Incomplete bank details' },
        { status: 400 }
      );
    }

    let recipientCode = withdrawal.recipient_code;

    if (!recipientCode) {
      const recipientRes = await fetch(
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

      const recipientData = await recipientRes.json();

      if (!recipientRes.ok || !recipientData.status) {
        return NextResponse.json(
          {
            error:
              recipientData.message || 'Failed to create Paystack recipient',
          },
          { status: 500 }
        );
      }

      recipientCode = recipientData.data.recipient_code;

      await supabase
        .from('withdrawals')
        .update({ recipient_code: recipientCode })
        .eq('id', withdrawal_id);
    }

    const transferReference = `wd_${Date.now()}_${Math.floor(
      Math.random() * 100000
    )}`;

    const transferRes = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'balance',
        amount: amount * 100,
        recipient: recipientCode,
        reference: transferReference,
        reason: 'SpinEarn withdrawal payout',
      }),
    });

    const transferData = await transferRes.json();

    if (!transferRes.ok || !transferData.status) {
      return NextResponse.json(
        { error: transferData.message || 'Transfer initiation failed' },
        { status: 500 }
      );
    }

    await supabase
      .from('withdrawals')
      .update({
        status: 'approved',
        transfer_status: transferData.data.status || 'queued',
        transfer_reference: transferReference,
      })
      .eq('id', withdrawal_id);

    await supabase
      .from('waitlist_users')
      .update({
        balance_naira: balance - amount,
      })
      .eq('email', withdrawal.user_email);

    await supabase.from('notifications').insert([
      {
        user_email: withdrawal.user_email,
        title: 'Withdrawal Approved',
        message: `Your withdrawal of ₦${amount.toLocaleString()} has been approved and sent for payout.`,
      },
    ]);

    return NextResponse.json({
      success: true,
      transfer_reference: transferReference,
      transfer_status: transferData.data.status,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Withdrawal transfer failed' },
      { status: 500 }
    );
  }
}