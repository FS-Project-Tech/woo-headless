# Hydration Issues - Causes & Fixes

## Why Hydration Errors Happen

Hydration errors occur when the HTML rendered on the **server** doesn't match the HTML rendered on the **client**. This causes React to warn about mismatches.

### Common Causes:

1. **Browser-Only APIs (localStorage, window, document)**
   - Server can't access `localStorage`, `window`, `document`
   - Client can access these immediately
   - **Fix**: Use `useEffect` to access browser APIs only after mount

2. **Random/Dynamic Values**
   - `Math.random()`, `Date.now()`, `new Date()`
   - Server and client generate different values
   - **Fix**: Use consistent initial values, update in `useEffect`

3. **Browser Extensions**
   - Extensions like BitDefender add attributes (`bis_skin_checked`)
   - Can't be prevented, but can be suppressed
   - **Fix**: Use `suppressHydrationWarning` on affected elements

4. **State Initialization**
   - State initialized from localStorage during render
   - Server has empty state, client has localStorage data
   - **Fix**: Initialize with empty state, hydrate in `useEffect`

5. **Conditional Rendering Based on Client-Only Data**
   - Components render differently based on `window.location`
   - Server doesn't know client's location
   - **Fix**: Use `isMounted` state, render after mount

## Solutions Applied

### 1. CartProvider Fix
- Added `isHydrated` state
- Only access localStorage in `useEffect` after mount
- Only save to localStorage after hydration completes
- Added `suppressHydrationWarning` to context provider

### 2. HydrationGuard Component
- Created reusable component to prevent hydration mismatches
- Only renders children after client mount
- Use for components that access browser APIs

### 3. Layout Suppression
- Added `suppressHydrationWarning` to `<html>` and `<body>`
- Suppresses warnings from browser extensions

## Best Practices

1. **Always use `useEffect` for browser APIs**
   ```tsx
   useEffect(() => {
     if (typeof window === 'undefined') return;
     // Access localStorage, window, etc. here
   }, []);
   ```

2. **Use `isMounted` pattern for conditional rendering**
   ```tsx
   const [isMounted, setIsMounted] = useState(false);
   useEffect(() => setIsMounted(true), []);
   if (!isMounted) return null; // or fallback
   ```

3. **Initialize state consistently**
   ```tsx
   // ❌ Bad: Different server/client state
   const [items, setItems] = useState(() => {
     if (typeof window !== 'undefined') {
       return JSON.parse(localStorage.getItem('items') || '[]');
     }
     return [];
   });

   // ✅ Good: Consistent initial state
   const [items, setItems] = useState([]);
   useEffect(() => {
     if (typeof window !== 'undefined') {
       const saved = localStorage.getItem('items');
       if (saved) setItems(JSON.parse(saved));
     }
   }, []);
   ```

4. **Use suppressHydrationWarning sparingly**
   - Only on elements affected by browser extensions
   - Don't use to hide real issues
   - Use on root elements when necessary

## Testing Hydration

1. Check browser console for hydration warnings
2. Use React DevTools to inspect component tree
3. Test with browser extensions disabled
4. Test with different browsers
5. Check server logs for errors

## Remaining Issues

- Browser extensions (like BitDefender) will always cause warnings
- These are external and can't be fixed in code
- Use `suppressHydrationWarning` to suppress them
- They don't affect functionality

