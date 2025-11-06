# Hydration Mismatch Fix Guide

## What is Hydration Mismatch?

Hydration mismatch occurs when the HTML rendered on the server doesn't match what React expects on the client side. This happens when:

1. **Browser-only APIs** are used during SSR
2. **Dynamic content** differs between server and client
3. **Random values** or **timestamps** are generated during render
4. **Client-side state** affects initial render

## Common Causes & Solutions

### 1. Window Object Usage

**Problem:** Using `window` object during SSR
```tsx
// ❌ This will cause hydration mismatch
const isMobile = window.innerWidth < 768;
```

**Solution:** Check if window exists
```tsx
// ✅ Safe approach
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
```

### 2. Scroll-based State

**Problem:** Scroll position affects initial render
```tsx
// ❌ This will cause hydration mismatch
const [isScrolled, setIsScrolled] = useState(window.scrollY > 10);
```

**Solution:** Use our custom hook
```tsx
// ✅ Safe approach
import { useIsScrolled } from '@/hooks/useClient';
const isScrolled = useIsScrolled(10);
```

### 3. Dynamic Content

**Problem:** Content that changes between server and client
```tsx
// ❌ This will cause hydration mismatch
const currentTime = new Date().toLocaleString();
```

**Solution:** Use ClientOnly wrapper
```tsx
// ✅ Safe approach
import ClientOnly from '@/components/ui/ClientOnly';

<ClientOnly fallback={<div>Loading...</div>}>
  <div>{new Date().toLocaleString()}</div>
</ClientOnly>
```

### 4. React Query DevTools

**Problem:** DevTools in production
```tsx
// ❌ This will cause hydration mismatch
<ReactQueryDevtools initialIsOpen={false} />
```

**Solution:** Only show in development
```tsx
// ✅ Safe approach
{process.env.NODE_ENV === 'development' && (
  <ReactQueryDevtools initialIsOpen={false} />
)}
```

## Fixes Applied

### 1. Header Component
- Added `suppressHydrationWarning` to header element
- Used `useIsScrolled` hook instead of direct window access
- Added window existence check for scroll listener

### 2. Product Detail Page
- Added window existence check for `window.open()`
- Protected browser-only functionality

### 3. Query Provider
- DevTools only show in development mode
- Prevents production hydration issues

### 4. Layout Component
- Added `suppressHydrationWarning` to main layout
- Handles any remaining hydration warnings

## Prevention Tips

### 1. Use Client-Side Hooks
```tsx
import { useIsClient } from '@/hooks/useClient';

function MyComponent() {
  const isClient = useIsClient();
  
  if (!isClient) {
    return <div>Loading...</div>;
  }
  
  return <div>{/* Client-only content */}</div>;
}
```

### 2. Use suppressHydrationWarning Sparingly
Only use when you're certain the mismatch is expected and safe:
```tsx
<div suppressHydrationWarning>
  {/* Content that intentionally differs between server and client */}
</div>
```

### 3. Use Dynamic Imports for Client-Only Components
```tsx
import dynamic from 'next/dynamic';

const ClientOnlyComponent = dynamic(
  () => import('./ClientOnlyComponent'),
  { ssr: false }
);
```

### 4. Check for Browser APIs
Always check if browser APIs exist before using them:
```tsx
if (typeof window !== 'undefined') {
  // Safe to use window, document, etc.
}
```

## Testing for Hydration Issues

### 1. Development Mode
Run in development and check browser console for hydration warnings:
```bash
npm run dev
```

### 2. Production Build
Test production build locally:
```bash
npm run build
npm start
```

### 3. Browser DevTools
Look for hydration mismatch warnings in the console.

## Additional Resources

- [Next.js Hydration Documentation](https://nextjs.org/docs/messages/react-hydration-error)
- [React Hydration Guide](https://react.dev/reference/react-dom/client/hydrateRoot)
- [Common Hydration Issues](https://nextjs.org/docs/messages/react-hydration-error)

## Quick Checklist

- [ ] No direct `window` object usage during SSR
- [ ] All browser APIs are properly guarded
- [ ] Dynamic content uses ClientOnly wrapper
- [ ] DevTools only in development
- [ ] Random values don't affect initial render
- [ ] Client-side state doesn't affect SSR
- [ ] Use `suppressHydrationWarning` only when necessary

