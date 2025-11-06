import { redirect } from 'next/navigation';
import wcAPI from '@/lib/woocommerce';
import { getAuthToken } from '@/lib/auth';

export default async function AccountPage() {
  const token = getAuthToken();
  if (!token) redirect('/auth/login');
  let user: any = null;
  try {
    const api = process.env.NEXT_PUBLIC_WC_API_URL || '';
    const u = new URL(api);
    const wpBase = `${u.protocol}//${u.host}`;
    const res = await fetch(`${wpBase}/wp-json/wp/v2/users/me`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (res.ok) user = await res.json();
  } catch {}

  return (
    <div className="min-h-screen py-12">
      <div className="mx-auto w-[85vw] px-4 sm:px-6 lg:px-8">
        <h1 className="mb-4 text-2xl font-semibold text-gray-900">Dashboard</h1>
        {user ? (
          <div className="rounded-lg bg-white p-6">
            <div className="text-gray-900">Welcome{user.name ? `, ${user.name}` : ''}!</div>
            <div className="mt-2 text-sm text-gray-600">Email: {user.email || user.user_email || 'N/A'}</div>
            <form action="/api/auth/logout" method="POST" className="mt-6">
              <button className="rounded bg-gray-900 px-4 py-2 text-white hover:bg-black">Logout</button>
            </form>
          </div>
        ) : (
          <div className="rounded-lg bg-white p-6">Loading user…</div>
        )}
      </div>
    </div>
  );
}


