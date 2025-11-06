"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Login failed');
        router.push('/account');
        router.refresh();
      } else {
        const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, email, password }) });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Registration failed');
        setMode('login');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="mx-auto w-[85vw] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left: Auth */}
          <div className="rounded-lg bg-white p-6">
            <h1 className="mb-4 text-xl font-semibold text-gray-900">{mode === 'login' ? 'Login' : 'Create account'}</h1>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-gray-700">Username</label>
                <input className="w-full rounded border px-3 py-2" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
              {mode === 'register' && (
                <div>
                  <label className="mb-1 block text-sm text-gray-700">Email</label>
                  <input type="email" className="w-full rounded border px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm text-gray-700">Password</label>
                <input type="password" className="w-full rounded border px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              {error && <div className="text-sm text-red-600">{error}</div>}
              <button disabled={loading} className="w-full rounded bg-gray-900 px-4 py-2 text-white hover:bg-black disabled:opacity-60">{loading ? (mode === 'login' ? 'Signing in…' : 'Creating…') : (mode === 'login' ? 'Sign in' : 'Create account')}</button>
            </form>
            <div className="mt-4 text-sm text-gray-700">
              {mode === 'login' ? (
                <button onClick={() => setMode('register')} className="text-blue-600 hover:text-blue-700">Don’t have an account? Create one</button>
              ) : (
                <button onClick={() => setMode('login')} className="text-blue-600 hover:text-blue-700">Already have an account? Sign in</button>
              )}
            </div>
          </div>

          {/* Right: Promo / Advertisement */}
          <div className="relative overflow-hidden rounded-lg bg-white">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white" />
            <div className="relative p-6">
              <div className="aspect-[4/5] w-full overflow-hidden rounded-lg">
                <img src="https://picsum.photos/900/1200?random=52" alt="Advertisement" className="h-full w-full object-cover" />
              </div>
              <div className="mt-4 text-center">
                <h2 className="text-lg font-semibold text-gray-900">Welcome back</h2>
                <p className="mt-1 text-sm text-gray-600">Sign in to access your orders and saved items.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


