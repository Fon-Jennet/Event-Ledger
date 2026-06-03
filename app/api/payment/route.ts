// app/api/payment/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { amount, phoneNumber, description } = await req.json();

  if (!process.env.CAMPAY_API_TOKEN) {
    return NextResponse.json(
      { error: 'Missing CAMPAY_API_TOKEN env var' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch('https://demo.campay.net/api/collect/', {
      method: 'POST',
      headers: {
        Authorization: `Token ${process.env.CAMPAY_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        from: phoneNumber,
        description,
        external_reference: `ticket_${Date.now()}`,
      }),
    });

    const text = await response.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error: 'Campay payment initiation failed',
          status: response.status,
          data,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Payment initiation failed', details: String(error) },
      { status: 500 }
    );
  }
}
