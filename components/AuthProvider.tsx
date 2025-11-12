"use client";

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import axios from 'axios';

interface User {
  id: number;
  email: string;
  name: string;
  username: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const response = await axios.get('/api/auth/me', {
        withCredentials: true,
      });
      if (response.data && response.data.user) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch (error: any) {
      // 401 or 404 means not authenticated - this is expected
      if (error.response?.status === 401 || error.response?.status === 404) {
        setUser(null);
      } else {
        console.error('Auth fetch error:', error);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await axios.post('/api/auth/logout');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  useEffect(() => {
    fetchUser();
    
    // Listen for storage events (login from another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'refreshToken' && e.newValue) {
        fetchUser();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically if user is logged in (every 5 minutes)
    const interval = setInterval(() => {
      if (!user) {
        fetchUser();
      }
    }, 5 * 60 * 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [fetchUser, user]);

  return (
    <AuthContext.Provider value={{ user, loading, refresh: fetchUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

