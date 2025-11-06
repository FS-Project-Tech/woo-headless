'use client';

import dynamic from 'next/dynamic';
import React, { ComponentType } from 'react';

// Higher-order component to prevent SSR for specific components
export function withNoSSR<T extends object>(
  Component: ComponentType<T>,
  fallback?: React.ReactNode
) {
  return dynamic(() => Promise.resolve(Component), {
    ssr: false,
    loading: () => fallback || <div>Loading...</div>,
  });
}

// Hook to check if we're on the client side
export function useIsomorphicLayoutEffect(
  effect: React.EffectCallback,
  deps?: React.DependencyList
) {
  const isClient = typeof window !== 'undefined';
  
  if (isClient) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useLayoutEffect(effect, deps);
  } else {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(effect, deps);
  }
}
