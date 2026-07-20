type CacheEntry<T> = { data: T; timestamp: number };

class CacheStore {
    private store = new Map<string, CacheEntry<unknown>>();
    private defaultTTL = 5 * 60 * 1000;

    get<T>(key: string, ttl?: number): T | null {
        const entry = this.store.get(key);
        if (!entry) return null;
        if (Date.now() - entry.timestamp > (ttl ?? this.defaultTTL)) {
            this.store.delete(key);
            return null;
        }
        return entry.data as T;
    }

    set<T>(key: string, data: T): void {
        this.store.set(key, { data, timestamp: Date.now() });
    }

    invalidate(pattern?: string): void {
        if (!pattern) {
            this.store.clear();
            return;
        }
        for (const key of this.store.keys()) {
            if (key.startsWith(pattern)) this.store.delete(key);
        }
    }
}

export const cache = new CacheStore();
