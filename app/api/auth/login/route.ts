import { NextResponse } from 'next/server';
import { setAuthCookie } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body || {};
    if (!username || !password) return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });

    const api = process.env.NEXT_PUBLIC_WC_API_URL || '';
    const u = new URL(api);
    const wpBase = `${u.protocol}//${u.host}`;
    const res = await fetch(`${wpBase}/wp-json/jwt-auth/v1/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      return NextResponse.json({ error: e?.message || 'Login failed' }, { status: 401 });
    }
    const json = await res.json();
    const token = json?.token as string | undefined;
    if (!token) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    setAuthCookie(token);
    return NextResponse.json({ ok: true, user: { name: json?.user_display_name, email: json?.user_email } });
  } catch (e) {
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}


