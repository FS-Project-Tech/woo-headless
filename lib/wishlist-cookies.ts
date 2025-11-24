/**
 * Wishlist Cookie Utilities
 * Functions for managing wishlist data in cookies (client-side storage)
 */

const WISHLIST_COOKIE_NAME = "wishlist";
const WISHLIST_COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year

/**
 * Get wishlist from cookie
 * Returns array of product IDs
 */
export function getWishlistFromCookie(): number[] {
  if (typeof window === "undefined") return [];

  try {
    const cookies = document.cookie.split(";");
    const wishlistCookie = cookies.find((cookie) =>
      cookie.trim().startsWith(`${WISHLIST_COOKIE_NAME}=`)
    );

    if (!wishlistCookie) return [];

    const value = wishlistCookie.split("=")[1];
    if (!value) return [];

    const decoded = decodeURIComponent(value);
    const parsed = JSON.parse(decoded);
    
    if (Array.isArray(parsed)) {
      return parsed.filter((id) => typeof id === "number" && id > 0);
    }
    
    return [];
  } catch (error) {
    console.error("Failed to parse wishlist cookie:", error);
    return [];
  }
}

/**
 * Save wishlist to cookie
 */
export function saveWishlistToCookie(wishlist: number[]): void {
  if (typeof window === "undefined") return;

  try {
    const value = JSON.stringify(wishlist);
    const encoded = encodeURIComponent(value);
    const expires = new Date(Date.now() + WISHLIST_COOKIE_MAX_AGE * 1000).toUTCString();
    
    document.cookie = `${WISHLIST_COOKIE_NAME}=${encoded}; expires=${expires}; path=/; SameSite=Lax`;
  } catch (error) {
    console.error("Failed to save wishlist cookie:", error);
  }
}

/**
 * Clear wishlist cookie
 */
export function clearWishlistCookie(): void {
  if (typeof window === "undefined") return;

  try {
    document.cookie = `${WISHLIST_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  } catch (error) {
    console.error("Failed to clear wishlist cookie:", error);
  }
}

/**
 * Add product to wishlist cookie
 */
export function addToWishlistCookie(productId: number): void {
  const current = getWishlistFromCookie();
  if (!current.includes(productId)) {
    saveWishlistToCookie([...current, productId]);
  }
}

/**
 * Remove product from wishlist cookie
 */
export function removeFromWishlistCookie(productId: number): void {
  const current = getWishlistFromCookie();
  saveWishlistToCookie(current.filter((id) => id !== productId));
}

/**
 * Check if product is in wishlist cookie
 */
export function isInWishlistCookie(productId: number): boolean {
  return getWishlistFromCookie().includes(productId);
}

