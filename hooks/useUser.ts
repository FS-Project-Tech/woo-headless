"use client";

import { useAuth } from '@/components/AuthProvider';

/**
 * useUser hook - Simple wrapper around useAuth
 * Provides user data, loading state, and logout function
 */
export function useUser() {
  const { user, loading, logout, refresh } = useAuth();
  
  return {
    user,
    loading,
    logout,
    refresh,
    isAuthenticated: !!user,
  };
}

