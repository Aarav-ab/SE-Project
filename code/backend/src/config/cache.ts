const CACHE_TTL_MS = 15_000;

type CacheEntry = {
  data: unknown;
  expiresAt: number;
};

const store = new Map<string, CacheEntry>();

export function getCached<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() >= entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCached(key: string, data: unknown, ttlMs = CACHE_TTL_MS): void {
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function invalidateCacheByPrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key);
    }
  }
}

export function invalidateAllOperationalCaches(): void {
  invalidateCacheByPrefix("complaints:");
  invalidateCacheByPrefix("workers:");
  invalidateCacheByPrefix("analytics:");
}
