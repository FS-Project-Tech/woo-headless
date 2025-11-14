// Client-side cookie utilities for wishlist

const WISHLIST_COOKIE = 'wishlist_guest';

/**
 * Get wishlist from cookies (client-side only)
 */
export function getWishlistFromCookie(): number[] {
  if (typeof document === 'undefined') return [];
  
  const cookies = document.cookie.split(';');
  const wishlistCookie = cookies.find(c => c.trim().startsWith(`${WISHLIST_COOKIE}=`));
  
  if (!wishlistCookie) return [];
  
  try {
    const value = wishlistCookie.split('=')[1];
    const decoded = decodeURIComponent(value);
    const parsed = JSON.parse(decoded);
    return Array.isArray(parsed) ? parsed.filter((id): id is number => typeof id === 'number' && id > 0) : [];
  } catch {
    return [];
  }
}

/**
 * Save wishlist to cookies (client-side only)
 */
export function saveWishlistToCookie(wishlist: number[]): void {
  if (typeof document === 'undefined') return;
  
  // Limit to 100 items to avoid cookie size issues (4KB limit)
  const limited = wishlist.slice(0, 100);
  const value = JSON.stringify(limited);
  const encoded = encodeURIComponent(value);
  
  // Set cookie with 1 year expiration
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  
  document.cookie = `${WISHLIST_COOKIE}=${encoded}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
}

/**
 * Clear wishlist cookie (client-side only)
 */
export function clearWishlistCookie(): void {
  if (typeof document === 'undefined') return;
  
  document.cookie = `${WISHLIST_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

