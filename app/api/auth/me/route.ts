import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth';

export async function GET() {
  try {
    const token = getAuthToken();
    if (!token) return NextResponse.json({ user: null });
    const api = process.env.NEXT_PUBLIC_WC_API_URL || '';
    const u = new URL(api);
    const wpBase = `${u.protocol}//${u.host}`;
    const res = await fetch(`${wpBase}/wp-json/wp/v2/users/me`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return NextResponse.json({ user: null });
    const user = await res.json();
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null });
  }
}


