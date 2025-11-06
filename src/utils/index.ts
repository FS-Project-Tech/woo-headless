import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: string | number, currency: string = 'USD'): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(numPrice);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function getImageUrl(src: string, size: string = 'medium'): string {
  if (!src) return '/placeholder-image.jpg';
  
  // If it's already a full URL, return as is
  if (src.startsWith('http')) return src;
  
  // If it's a WordPress image, try to get the size variant
  if (src.includes('wp-content/uploads')) {
    const baseUrl = src.replace(/-\d+x\d+\./, '.');
    const extension = baseUrl.split('.').pop();
    const nameWithoutExt = baseUrl.replace(/\.[^/.]+$/, '');
    
    switch (size) {
      case 'thumbnail':
        return `${nameWithoutExt}-150x150.${extension}`;
      case 'medium':
        return `${nameWithoutExt}-300x300.${extension}`;
      case 'large':
        return `${nameWithoutExt}-1024x1024.${extension}`;
      default:
        return baseUrl;
    }
  }
  
  return src;
}

export function calculateDiscountPercentage(regularPrice: string, salePrice: string): number {
  const regular = parseFloat(regularPrice);
  const sale = parseFloat(salePrice);
  
  if (regular <= 0 || sale >= regular) return 0;
  
  return Math.round(((regular - sale) / regular) * 100);
}

export function getProductRatingStars(rating: number): string[] {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  for (let i = 0; i < fullStars; i++) {
    stars.push('full');
  }
  
  if (hasHalfStar) {
    stars.push('half');
  }
  
  const emptyStars = 5 - stars.length;
  for (let i = 0; i < emptyStars; i++) {
    stars.push('empty');
  }
  
  return stars;
}

export function scrollToTop(): void {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
}

export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

export function isTablet(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= 768 && window.innerWidth < 1024;
}

export function isDesktop(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= 1024;
}

