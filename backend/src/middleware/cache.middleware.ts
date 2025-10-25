import { Request, Response, NextFunction } from 'express';

interface CacheEntry {
  data: any;
  timestamp: number;
}

class SimpleCache {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly ttl: number; // Time to live in milliseconds

  constructor(ttlMinutes: number = 5) {
    this.ttl = ttlMinutes * 60 * 1000;

    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      // Clear all cache
      this.cache.clear();
      return;
    }

    // Clear entries matching pattern
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }

  getStats(): { size: number; ttl: number } {
    return {
      size: this.cache.size,
      ttl: this.ttl / 1000 / 60, // Convert back to minutes
    };
  }
}

// Create cache instances with different TTLs
export const shortCache = new SimpleCache(5); // 5 minutes for frequently changing data
export const mediumCache = new SimpleCache(15); // 15 minutes for semi-static data
export const longCache = new SimpleCache(60); // 1 hour for static reference data

/**
 * Cache middleware - caches GET requests
 * @param cache - Cache instance to use
 * @param generateKey - Optional function to generate cache key from request
 */
export const cacheMiddleware = (
  cache: SimpleCache,
  generateKey?: (req: Request) => string
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    const key = generateKey
      ? generateKey(req)
      : `${req.baseUrl}${req.url}`;

    // Check cache
    const cachedData = cache.get(key);
    if (cachedData) {
      console.log(`✅ Cache HIT: ${key}`);
      return res.json(cachedData);
    }

    console.log(`❌ Cache MISS: ${key}`);

    // Store the original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache the response
    res.json = (data: any) => {
      cache.set(key, data);
      return originalJson(data);
    };

    next();
  };
};

/**
 * Middleware to invalidate cache on data modifications
 * @param cache - Cache instance to invalidate
 * @param pattern - Pattern to match cache keys to invalidate
 */
export const invalidateCacheMiddleware = (
  cache: SimpleCache,
  pattern?: string
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only invalidate on POST, PUT, DELETE
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
      cache.invalidate(pattern);
      console.log(`🗑️  Cache invalidated: ${pattern || 'all'}`);
    }
    next();
  };
};

export default { shortCache, mediumCache, longCache, cacheMiddleware, invalidateCacheMiddleware };
