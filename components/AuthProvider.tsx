"use client";

import { createContext, useContext, useEffect, useState } from 'react';

type User = { id?: number; name?: string; email?: string } | null;

const AuthCtx = createContext<{ user: User; loading: boolean; refresh: () => void; logout: () => Promise<void>; } | null>(null);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(false); // Start as false to not block initial render

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const json = await res.json();
      setUser(json.user || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    // Load auth state after initial render to avoid blocking
    load(); 
  }, []);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    await load();
  };

  return <AuthCtx.Provider value={{ user, loading, refresh: load, logout }}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}


