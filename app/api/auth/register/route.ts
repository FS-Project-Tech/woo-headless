import { NextResponse } from 'next/server';
import wcAPI from '@/lib/woocommerce';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { username, email, password } = body || {};
    if (!email || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    if (!username) username = email;

    // Create WooCommerce customer via REST (uses basic auth from wcAPI client)
    const res = await wcAPI.post('/customers', { email, username, password });
    const customer = res.data;
    return NextResponse.json({ ok: true, userId: customer?.id });
  } catch (e: any) {
    const msg = e?.response?.data?.message || 'Registration failed';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}


