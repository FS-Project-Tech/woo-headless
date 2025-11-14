/**
 * Client-side search index with IndexedDB caching
 * Provides blazing-fast local search without hitting the API every time
 */

export interface SearchIndexItem {
  key: string; // Composite key: `${type}_${id}`
  id: number;
  type: 'product' | 'category' | 'brand' | 'tag';
  name: string;
  slug: string;
  sku?: string;
  price?: string;
  regularPrice?: string;
  onSale?: boolean;
  image?: string;
  categoryIds?: number[];
  brandId?: number;
  searchableText: string; // Pre-combined text for fast search
  tokens: string[]; // Pre-tokenized for matching
}

class SearchIndexManager {
  private dbName = 'woocommerce_search_index';
  private dbVersion = 1;
  private storeName = 'index';
  private index: SearchIndexItem[] = [];
  private db: IDBDatabase | null = null;
  private initialized = false;
  private lastSyncTime = 0;
  private readonly SYNC_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Try to initialize IndexedDB
      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        try {
          this.db = await this.openDB();
        } catch {
          // IndexedDB not available, use localStorage fallback
          this.db = null;
        }
      }
      
      // Load index from cache
      const cached = await this.loadFromIndexedDB();
      if (cached && cached.length > 0) {
        this.index = cached;
        this.initialized = true;
        
        // Check if we need to refresh
        const lastSync = await this.getLastSyncTime();
        if (Date.now() - lastSync > this.SYNC_INTERVAL) {
          // Refresh in background
          this.syncWithAPI().catch(() => {});
        }
      } else {
        // Initial load from API
        await this.syncWithAPI();
      }
    } catch (error) {
      console.error('Search index initialization error:', error);
      // Continue with empty index
      this.index = [];
      this.initialized = true;
    }
  }

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !('indexedDB' in window)) {
        reject(new Error('IndexedDB not available'));
        return;
      }
      
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          // Use composite key string to avoid conflicts
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('name', 'name', { unique: false });
        }
      };
    });
  }

  private async loadFromIndexedDB(): Promise<SearchIndexItem[]> {
    if (!this.db) return [];
    
    try {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => {
          // Fallback to localStorage if IndexedDB fails
          resolve(this.loadFromLocalStorage());
        };
      });
    } catch {
      return this.loadFromLocalStorage();
    }
  }

  private loadFromLocalStorage(): SearchIndexItem[] {
    try {
      if (typeof window === 'undefined') return [];
      const stored = localStorage.getItem('search_index_cache');
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch {
      // Ignore errors
    }
    return [];
  }

  private async saveToIndexedDB(items: SearchIndexItem[]): Promise<void> {
    if (!this.db) {
      // Fallback to localStorage
      this.saveToLocalStorage(items);
      return;
    }
    
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        
        // Clear existing
        const clearReq = store.clear();
        clearReq.onsuccess = () => {
          // Add new items in batches to avoid overflow
          let index = 0;
          const batchSize = 100;
          
          const addBatch = () => {
            const batch = items.slice(index, index + batchSize);
            if (batch.length === 0) {
              this.setLastSyncTime(Date.now());
              resolve();
              return;
            }
            
            let completed = 0;
            let hasError = false;
            
            for (const item of batch) {
              const request = store.add(item);
              request.onsuccess = () => {
                completed++;
                if (completed === batch.length && !hasError) {
                  index += batchSize;
                  addBatch();
                }
              };
              request.onerror = () => {
                if (!hasError) {
                  hasError = true;
                  // Fallback to localStorage
                  this.saveToLocalStorage(items);
                  resolve();
                }
              };
            }
          };
          
          addBatch();
        };
        
        clearReq.onerror = () => {
          // Fallback to localStorage
          this.saveToLocalStorage(items);
          resolve();
        };
      });
    } catch (error) {
      // Fallback to localStorage
      this.saveToLocalStorage(items);
    }
  }

  private saveToLocalStorage(items: SearchIndexItem[]): void {
    try {
      if (typeof window !== 'undefined') {
        // Limit to 1000 items for localStorage
        const limited = items.slice(0, 1000);
        localStorage.setItem('search_index_cache', JSON.stringify(limited));
        this.setLastSyncTime(Date.now());
      }
    } catch {
      // Ignore localStorage errors (quota exceeded, etc.)
    }
  }

  private async getLastSyncTime(): Promise<number> {
    try {
      const stored = localStorage.getItem('search_index_sync_time');
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  }

  private async setLastSyncTime(time: number): Promise<void> {
    try {
      localStorage.setItem('search_index_sync_time', String(time));
    } catch {
      // Ignore localStorage errors
    }
  }

  async syncWithAPI(): Promise<void> {
    try {
      // Fetch all searchable data
      const response = await fetch('/api/search/index');
      if (!response.ok) throw new Error('Failed to fetch index');
      
      const data = await response.json();
      
      // Transform to search index format
      const items: SearchIndexItem[] = [];
      
      // Products
      if (Array.isArray(data.products)) {
        for (const p of data.products) {
          // Ensure SKU is properly stored (handle null/undefined/empty)
          const skuValue = p.sku && typeof p.sku === 'string' ? p.sku.trim() : '';
          
          // Include SKU prominently - also add variations without dashes/underscores for better matching
          const skuBase = skuValue.toLowerCase();
          const searchableText = [
            p.name || '',
            skuBase, // Original SKU
            skuBase ? skuBase.replace(/-/g, ' ') : '', // SKU without dashes
            skuBase ? skuBase.replace(/_/g, ' ') : '', // SKU without underscores
            p.description || '',
            ...(p.categories || []).map((c: any) => c.name || '').filter(Boolean),
            ...(p.attributes || []).flatMap((a: any) => a.options || []).filter(Boolean),
          ].filter(Boolean).join(' ').toLowerCase();
          
          const tokens = this.tokenize(searchableText);
          
          items.push({
            key: `product_${p.id}`,
            id: p.id,
            type: 'product',
            name: p.name,
            slug: p.slug,
            sku: skuValue || undefined, // Store as undefined if empty to avoid falsy checks
            price: p.price,
            regularPrice: p.regular_price,
            onSale: p.on_sale,
            image: p.images?.[0]?.src,
            categoryIds: (p.categories || []).map((c: any) => c.id),
            searchableText,
            tokens,
          });
        }
      }
      
      // Categories
      if (Array.isArray(data.categories)) {
        for (const c of data.categories) {
          const searchableText = [c.name || '', c.slug || ''].join(' ').toLowerCase();
          const tokens = this.tokenize(searchableText);
          
          items.push({
            key: `category_${c.id}`,
            id: c.id,
            type: 'category',
            name: c.name,
            slug: c.slug,
            searchableText,
            tokens,
          });
        }
      }
      
      // Brands (from attributes)
      if (Array.isArray(data.brands)) {
        for (const b of data.brands) {
          const searchableText = [b.name || '', b.slug || ''].join(' ').toLowerCase();
          const tokens = this.tokenize(searchableText);
          
          items.push({
            key: `brand_${b.id}`,
            id: b.id,
            type: 'brand',
            name: b.name,
            slug: b.slug,
            searchableText,
            tokens,
          });
        }
      }
      
      // Tags
      if (Array.isArray(data.tags)) {
        for (const t of data.tags) {
          const searchableText = [t.name || '', t.slug || ''].join(' ').toLowerCase();
          const tokens = this.tokenize(searchableText);
          
          items.push({
            key: `tag_${t.id}`,
            id: t.id,
            type: 'tag',
            name: t.name,
            slug: t.slug,
            searchableText,
            tokens,
          });
        }
      }
      
      this.index = items;
      await this.saveToIndexedDB(items);
      this.initialized = true;
    } catch (error) {
      console.error('Failed to sync search index:', error);
      // Use empty index if sync fails
      this.index = [];
    }
  }

  private tokenize(text: string): string[] {
    // Tokenize while preserving SKU patterns
    // First, try to preserve complete SKU-like patterns before splitting
    const tokens: string[] = [];
    const parts = text.toLowerCase().split(/\s+/);
    
    for (const part of parts) {
      // If it looks like a SKU (alphanumeric with possible dashes/underscores), keep it whole
      if (/^[a-z0-9_-]{2,}$/i.test(part)) {
        tokens.push(part);
        // Also add variations without dashes/underscores
        const noDash = part.replace(/[-_]/g, '');
        if (noDash !== part && noDash.length >= 2) {
          tokens.push(noDash);
        }
      } else {
        // For non-SKU text, split on special characters
        const subParts = part
          .replace(/[^a-z0-9\s_-]+/g, ' ')
          .split(/\s+/)
          .filter(p => p.length >= 1);
        tokens.push(...subParts);
      }
    }
    
    return tokens.filter(t => t.length >= 1);
  }

  search(query: string, limit: number = 50): SearchIndexItem[] {
    if (!this.initialized || !query.trim()) return [];
    
    const qLower = query.toLowerCase().trim();
    if (qLower.length < 1) return [];
    
    // Parse multiple SKUs from query (comma, space, or newline separated)
    const parseMultipleSKUs = (q: string): string[] => {
      // Split by comma, newline, or multiple spaces
      const skus = q
        .split(/[,\n\r]+|\s{2,}/)
        .map(s => s.trim())
        .filter(s => s.length >= 2 && /^[A-Z0-9_-]+$/i.test(s));
      return skus.length > 0 ? skus : [];
    };
    
    const multipleSKUs = parseMultipleSKUs(query);
    const isMultipleSKUSearch = multipleSKUs.length > 1;
    const isSKULikeQuery = /^[A-Z0-9_-]+$/i.test(query) && query.length >= 2;
    
    const qTokens = this.tokenize(qLower);
    
    // Score and rank all items
    const scored = this.index.map(item => {
      let score = 0;
      
      // Handle multiple SKU search
      if (isMultipleSKUSearch && item.sku) {
        const itemSKULower = (item.sku || '').toLowerCase();
        for (const sku of multipleSKUs) {
          const skuLower = sku.toLowerCase();
          if (itemSKULower === skuLower) {
            score = 2000; // Exact match - highest priority
            break;
          } else if (itemSKULower.includes(skuLower) || skuLower.includes(itemSKULower)) {
            score = Math.max(score, 1500); // Partial match
          }
        }
        // If we got a good SKU match, return it
        if (score >= 1500) {
          return { item, score };
        }
      }
      
      // For single SKU-like queries, prioritize direct SKU matching first
      if (isSKULikeQuery && !isMultipleSKUSearch && item.sku) {
        score = this.calculateDirectMatchScore(qLower, item);
        // If we got a good SKU match, return it immediately (don't need token matching)
        if (score >= 800) {
          return { item, score };
        }
      }
      
      // Try tokenized matching
      if (qTokens.length > 0) {
        const tokenScore = this.calculateScore(qLower, qTokens, item);
        if (tokenScore > score) {
          score = tokenScore;
        }
      }
      
      // If still no score and query is at least 2 chars, try direct matching
      if (score === 0 && qLower.length >= 2) {
        const directScore = this.calculateDirectMatchScore(qLower, item);
        if (directScore > score) {
          score = directScore;
        }
      }
      
      return { item, score };
    });
    
    // Filter items with score > 0 and sort by score
    const results = scored
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(x => x.item);
    
    // For multiple SKU search, prioritize exact matches and ensure we get results for each SKU
    if (isMultipleSKUSearch) {
      const exactMatches: SearchIndexItem[] = [];
      const partialMatches: SearchIndexItem[] = [];
      const otherMatches: SearchIndexItem[] = [];
      
      for (const item of results) {
        if (!item.sku) {
          otherMatches.push(item);
          continue;
        }
        
        const itemSKULower = item.sku.toLowerCase();
        let isExact = false;
        let isPartial = false;
        
        for (const sku of multipleSKUs) {
          const skuLower = sku.toLowerCase();
          if (itemSKULower === skuLower) {
            isExact = true;
            break;
          } else if (itemSKULower.includes(skuLower) || skuLower.includes(itemSKULower)) {
            isPartial = true;
          }
        }
        
        if (isExact) {
          exactMatches.push(item);
        } else if (isPartial) {
          partialMatches.push(item);
        } else {
          otherMatches.push(item);
        }
      }
      
      // Return exact matches first, then partial, then others
      return [...exactMatches, ...partialMatches, ...otherMatches].slice(0, limit);
    }
    
    return results;
  }

  private calculateDirectMatchScore(query: string, item: SearchIndexItem): number {
    const nameLower = item.name.toLowerCase();
    const skuLower = (item.sku || '').toLowerCase();
    const slugLower = item.slug.toLowerCase();
    let score = 0;
    
    // Detect if query looks like a SKU
    const isSKULikeQuery = /^[A-Z0-9_-]+$/i.test(query) && query.length >= 2;
    
    // SKU matching - highest priority (check even if skuLower is empty string, but skip if null/undefined)
    if (item.sku && skuLower && skuLower.length > 0) {
      // Exact SKU match - highest priority
      if (skuLower === query) {
        score += isSKULikeQuery ? 2000 : 1500;
      }
      // SKU starts with query
      else if (skuLower.startsWith(query)) {
        score += isSKULikeQuery ? 1200 : 700;
      }
      // SKU contains query
      else if (skuLower.includes(query)) {
        score += isSKULikeQuery ? 800 : 400;
      }
      // Partial SKU match for short queries (e.g., "A1" matches "ABC-123")
      else if (isSKULikeQuery && query.length >= 2 && query.length < 6) {
        // Remove dashes/underscores from SKU for comparison
        const skuNormalized = skuLower.replace(/[-_]/g, '');
        const queryNormalized = query.replace(/[-_]/g, '');
        if (skuNormalized.includes(queryNormalized)) {
          score += 600;
        }
      }
    }
    
    // Name matching
    if (nameLower === query) {
      score += 1000;
    } else if (nameLower.startsWith(query)) {
      score += 500;
    } else if (nameLower.includes(query)) {
      score += 200;
    }
    
    // Slug matching
    if (slugLower.includes(query)) {
      score += 150;
    }
    
    return score;
  }

  private calculateScore(query: string, qTokens: string[], item: SearchIndexItem): number {
    const nameLower = item.name.toLowerCase();
    const skuLower = (item.sku || '').toLowerCase();
    const slugLower = item.slug.toLowerCase();
    let score = 0;
    
    // Detect if query looks like a SKU (alphanumeric, often uppercase, no spaces or dashes in middle)
    const isSKULikeQuery = /^[A-Z0-9_-]+$/i.test(query) && query.length >= 2;
    
    // SKU matching (highest priority - check FIRST before other matching)
    if (item.sku && skuLower && skuLower.length > 0) {
      // Exact SKU match - highest priority
      if (skuLower === query) {
        score += isSKULikeQuery ? 2000 : 1000; // Boost if query looks like SKU
      }
      // SKU starts with query
      else if (skuLower.startsWith(query)) {
        score += isSKULikeQuery ? 1000 : 500;
      }
      // SKU contains query
      else if (skuLower.includes(query)) {
        score += isSKULikeQuery ? 600 : 300;
      }
      // Partial SKU match (case-insensitive, handles partial matches)
      else if (isSKULikeQuery && query.length >= 2) {
        // Try matching without case sensitivity and partial characters
        const queryChars = query.toLowerCase().split('');
        let matchedChars = 0;
        for (let i = 0, j = 0; i < skuLower.length && j < queryChars.length; i++) {
          if (skuLower[i] === queryChars[j]) {
            matchedChars++;
            j++;
          }
        }
        if (matchedChars >= Math.min(query.length, 3)) {
          score += 400 * (matchedChars / query.length);
        }
      }
    }
    
    // Exact name match
    if (nameLower === query) {
      score += 1000;
    }
    // Name starts with query
    else if (nameLower.startsWith(query)) {
      score += 500;
    }
    // Name contains query
    else if (nameLower.includes(query)) {
      score += 200;
    }
    
    // Slug match
    if (slugLower.includes(query)) {
      score += 150;
    }
    
    // Token-based fuzzy matching
    let tokenScore = 0;
    let matchedTokens = 0;
    
    for (const qt of qTokens) {
      if (qt.length < 2) continue;
      
      // Check name tokens
      for (const it of item.tokens) {
        if (it === qt) {
          tokenScore += 50;
          matchedTokens++;
          break;
        } else if (it.startsWith(qt)) {
          tokenScore += 25;
          matchedTokens++;
          break;
        } else if (it.includes(qt)) {
          tokenScore += 10;
          matchedTokens++;
          break;
        }
      }
    }
    
    // Bonus for matching all query tokens
    if (matchedTokens === qTokens.length && qTokens.length > 0) {
      tokenScore *= 1.5;
    }
    
    score += tokenScore;
    
    // Type-based weighting (Products > Categories > Brands > Tags)
    if (item.type === 'product') score += 5;
    else if (item.type === 'category') score += 2;
    else if (item.type === 'brand') score += 1;
    else if (item.type === 'tag') score += 1;
    
    // Fuzzy character matching (handles typos like "FMS Syrin" → "FMS Syringe")
    score += this.fuzzyMatch(query, nameLower) * 30;
    
    return score;
  }

  private fuzzyMatch(query: string, text: string): number {
    // Simple Levenshtein-like scoring for character similarity
    let matches = 0;
    let queryIdx = 0;
    
    for (let i = 0; i < text.length && queryIdx < query.length; i++) {
      if (text[i] === query[queryIdx]) {
        matches++;
        queryIdx++;
      }
    }
    
    // Return ratio of matched characters
    return query.length > 0 ? matches / query.length : 0;
  }

  getTotalCount(): number {
    return this.index.filter(i => i.type === 'product').length;
  }

  isReady(): boolean {
    return this.initialized && this.index.length > 0;
  }
}

// Singleton instance
export const searchIndex = new SearchIndexManager();

