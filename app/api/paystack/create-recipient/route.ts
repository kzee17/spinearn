import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { accountName, accountNumber, bankCode } = await req.json();

    if (!accountName || !accountNumber || !bankCode) {
      return NextResponse.json(
        { status: false, error: 'Missing recipient details' },
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

    const response = await fetch('https://api.paystack.co/transferrecipient', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'nuban',
        name: accountName,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: 'NGN',
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      return NextResponse.json(
        { status: false, error: data.message || 'Recipient creation failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      status: true,
      recipient_code: data.data.recipient_code,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: false, error: error.message || 'Recipient creation failed' },
      { status: 500 }
    );
  }
}