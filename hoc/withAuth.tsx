"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

interface WithAuthProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Higher-Order Component to protect routes that require authentication
 * Redirects to login if user is not authenticated
 */
export default function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  redirectTo: string = "/account/"
) {
  return function AuthenticatedComponent(props: P) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
      if (!loading) {
        if (!user) {
          router.push(redirectTo);
        } else {
          setIsChecking(false);
        }
      }
    }, [user, loading, router]);

    if (loading || isChecking) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    if (!user) {
      return null; // Will redirect
    }

    return <Component {...props} />;
  };
}

/**
 * Alternative: Hook-based route protection
 */
export function useRequireAuth(redirectTo: string = "/") {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  return { user, loading };
}

