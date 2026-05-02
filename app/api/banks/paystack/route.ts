import { NextResponse } from 'next/server';

type PaystackBank = {
  name: string;
  code: string;
  active: boolean;
};

export async function GET() {
  try {
    const paystackKey = process.env.PAYSTACK_SECRET_KEY;

    if (!paystackKey) {
      return NextResponse.json(
        { status: false, error: 'Missing PAYSTACK_SECRET_KEY' },
        { status: 500 }
      );
    }

    // 🔹 Fetch banks from Paystack
    const response = await fetch(
      'https://api.paystack.co/bank?country=nigeria&perPage=100',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${paystackKey}`,
          'Content-Type': 'application/json',
        },
        // ⚡ Cache for 1 hour (improves speed & reduces API calls)
        next: { revalidate: 3600 },
      }
    );

    const data = await response.json();

    if (!response.ok || !data.status) {
      return NextResponse.json(
        {
          status: false,
          error: data.message || 'Unable to fetch banks from Paystack',
        },
        { status: 500 }
      );
    }

    // 🔹 Clean + filter banks
    const banks = (data.data as PaystackBank[])
      .filter((bank) => bank.active && bank.code)
      .map((bank) => ({
        name: bank.name.trim(),
        code: bank.code.trim(),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // 🔹 Optional: Add popular banks first (UX improvement)
    const priorityBanks = [
      'Access Bank',
      'GTBank',
      'First Bank of Nigeria',
      'UBA',
      'Zenith Bank',
      'Opay',
      'Moniepoint',
      'Kuda Bank',
    ];

    const sortedBanks = [
      ...banks.filter((b) =>
        priorityBanks.some((p) =>
          b.name.toLowerCase().includes(p.toLowerCase())
        )
      ),
      ...banks.filter(
        (b) =>
          !priorityBanks.some((p) =>
            b.name.toLowerCase().includes(p.toLowerCase())
          )
      ),
    ];

    return NextResponse.json({
      status: true,
      count: sortedBanks.length,
      banks: sortedBanks,
    });
  } catch (error: any) {
    console.error('Bank fetch error:', error);

    return NextResponse.json(
      {
        status: false,
        error: error.message || 'Bank fetch failed',
      },
      { status: 500 }
    );
  }
}