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
    // Only fetch in browser environment
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get('/api/auth/me', {
        withCredentials: true,
        timeout: 10000, // 10 second timeout
      });
      if (response.data && response.data.user) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch (error: any) {
      // Network errors or connection issues - silently treat as not authenticated
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !error.response) {
        // Network error - likely API route not available or connection issue
        // Silently treat as not authenticated (don't log to avoid noise)
        setUser(null);
      }
      // 401 or 404 means not authenticated - this is expected
      else if (error.response?.status === 401 || error.response?.status === 404) {
        setUser(null);
      } 
      // Other HTTP errors - log but still treat as not authenticated
      else {
        console.error('Auth fetch error:', error.response?.status || error.message);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    // Always clear user state locally, even if API call fails
    setUser(null);
    
    try {
      await axios.post('/api/auth/logout', {}, {
        timeout: 5000,
      });
    } catch (error: any) {
      // Silently handle network errors - user is already logged out locally
      if (error.code !== 'ERR_NETWORK' && error.message !== 'Network Error') {
        console.error('Logout error:', error.response?.status || error.message);
      }
    }
  }, []);

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

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

