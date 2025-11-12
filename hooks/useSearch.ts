"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type SearchKind = 'product' | 'category' | 'brand';
export type SearchItem = {
  id: number;
  kind: SearchKind;
  name: string;
  slug: string;
  extra?: any;
  tokens: string[];
};

export interface UseSearchResult {
  loading: boolean;
  results: SearchItem[];
  search: (q: string) => Promise<SearchItem[]>;
}

function tokenize(s: string): string[] {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function buildIndex(raw: any): SearchItem[] {
  const items: SearchItem[] = [];
  const prods = Array.isArray(raw.products) ? raw.products : [];
  const cats = Array.isArray(raw.categories) ? raw.categories : [];
  const brands = Array.isArray(raw.brands) ? raw.brands : [];

  for (const p of prods) {
    const fields = [p.name, p.slug, ...(p.categories?.map((c: any) => c?.name) || []), p.sku].filter(Boolean);
    const tokens = unique(fields.flatMap(tokenize));
    items.push({ id: p.id, kind: 'product', name: p.name, slug: p.slug, extra: p, tokens });
  }
  for (const c of cats) {
    const fields = [c.name, c.slug].filter(Boolean);
    const tokens = unique(fields.flatMap(tokenize));
    items.push({ id: c.id, kind: 'category', name: c.name, slug: c.slug, extra: c, tokens });
  }
  for (const b of brands) {
    const fields = [b.name, b.slug].filter(Boolean);
    const tokens = unique(fields.flatMap(tokenize));
    items.push({ id: b.id, kind: 'brand', name: b.name, slug: b.slug, extra: b, tokens });
  }
  return items;
}

function scoreItem(q: string, qTokens: string[], item: SearchItem): number {
  const qLower = q.toLowerCase();
  const nameLower = item.name.toLowerCase();
  const slugLower = item.slug.toLowerCase();
  
  let score = 0;
  
  // Exact name match (highest priority)
  if (nameLower === qLower) {
    score += 100;
  }
  // Name starts with query
  else if (nameLower.startsWith(qLower)) {
    score += 50;
  }
  // Name contains query
  else if (nameLower.includes(qLower)) {
    score += 30;
  }
  
  // Slug match
  if (slugLower.includes(qLower)) {
    score += 20;
  }
  
  // Token-based scoring (more lenient - matches if ANY token matches)
  let tokenScore = 0;
  for (const qt of qTokens) {
    if (qt.length < 1) continue;
    
    for (const it of item.tokens) {
      // Exact token match
      if (it === qt) {
        tokenScore += 10;
        break;
      }
      // Token starts with query token
      if (it.startsWith(qt)) {
        tokenScore += 5;
        break;
      }
      // Token contains query token
      if (it.includes(qt)) {
        tokenScore += 2;
        break;
      }
    }
  }
  
  // If at least one token matched, add the token score
  if (tokenScore > 0) {
    score += tokenScore;
  }
  
  // Kind-based boost
  if (item.kind === 'product') score += 1;
  if (item.kind === 'category') score += 0.5;
  
  return score;
}

export function useSearch(): UseSearchResult {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchItem[]>([]);
  const inflight = useRef<AbortController | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    return () => { mounted.current = false; };
  }, []);

  const search = useCallback(async (q: string): Promise<SearchItem[]> => {
    const query = q.trim();
    if (!query) { setResults([]); return []; }

    inflight.current?.abort();
    const ctrl = new AbortController();
    inflight.current = ctrl;

    setLoading(true);
    try {
      const res = await fetch(`/api/search-unified?q=${encodeURIComponent(query)}`, { signal: ctrl.signal, cache: 'no-store' });
      if (!res.ok) {
        if (mounted.current && inflight.current === ctrl) setResults([]);
        return [];
      }
      const data = await res.json();
      const items = buildIndex(data);
      
      // If no items from API, return empty
      if (items.length === 0) {
        if (mounted.current && inflight.current === ctrl) setResults([]);
        return [];
      }
      
      const qTokens = tokenize(query.toLowerCase());
      const ranked = items
        .map((it) => ({ it, s: scoreItem(query, qTokens, it) }))
        .filter((x) => x.s > 0) // Include any item with a score > 0
        .sort((a, b) => b.s - a.s)
        .slice(0, 15) // Return top 15, then we'll limit per group
        .map((x) => x.it);
      
      if (mounted.current && inflight.current === ctrl) setResults(ranked);
      return ranked;
    } catch (err: any) {
      // Ignore abort errors quietly
      if (err && (err.name === 'AbortError' || err.code === 20)) {
        return [];
      }
      if (mounted.current && inflight.current === ctrl) setResults([]);
      return [];
    } finally {
      if (mounted.current && inflight.current === ctrl) setLoading(false);
    }
  }, []);

  return { loading, results, search };
}
