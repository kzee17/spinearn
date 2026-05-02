import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { accountNumber, bankCode } = await req.json();

    if (!accountNumber || !bankCode) {
      return NextResponse.json(
        { status: false, error: 'Account number and bank code are required' },
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

    const response = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${paystackKey}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok || !data.status) {
      return NextResponse.json(
        { status: false, error: data.message || 'Account resolution failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      status: true,
      account_name: data.data.account_name,
      account_number: data.data.account_number,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: false, error: error.message || 'Account resolve failed' },
      { status: 500 }
    );
  }
}