// app/api/payment/status/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { reference } = await req.json();

  if (!process.env.CAMPAY_API_TOKEN) {
    return NextResponse.json(
      { error: 'Missing CAMPAY_API_TOKEN env var' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`https://demo.campay.net/api/transaction/${reference}/`, {
      method: 'GET',
      headers: {
        Authorization: `Token ${process.env.CAMPAY_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    // Pass through fields from Campay response so the UI can show more specific errors.
    // We intentionally keep the payload flexible because the provider's schema may vary.
    return NextResponse.json({
      ...data,
      _provider: "campay",
      _reference: reference,
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to verify transaction status', details: String(error) },
      { status: 500 }
    );
  }
}