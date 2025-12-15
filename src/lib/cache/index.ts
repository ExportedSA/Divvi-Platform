/**
 * Caching Layer
 * 
 * In-memory cache with TTL support for frequently accessed data.
 * Reduces database load for hot paths like listing searches and user profiles.
 */

// =============================================================================
// TYPES
// =============================================================================

interface CacheEntry<T> {
  data: T
  expiresAt: number
  tags: string[]
}

interface CacheOptions {
  ttl?: number // Time to live in seconds
  tags?: string[] // Tags for cache invalidation
}

// =============================================================================
// CACHE CONFIGURATION
// =============================================================================

const DEFAULT_TTL = 60 // 1 minute default
const MAX_CACHE_SIZE = 1000 // Maximum entries

// TTL presets for different data types
export const CacheTTL = {
  SHORT: 30, // 30 seconds - for rapidly changing data
  MEDIUM: 60 * 5, // 5 minutes - for moderately changing data
  LONG: 60 * 15, // 15 minutes - for stable data
  HOUR: 60 * 60, // 1 hour - for rarely changing data
  DAY: 60 * 60 * 24, // 24 hours - for static data
} as const

// =============================================================================
// IN-MEMORY CACHE
// =============================================================================

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private tagIndex = new Map<string, Set<string>>() // tag -> keys

  /**
   * Get item from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Set item in cache
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = options.ttl ?? DEFAULT_TTL
    const tags = options.tags ?? []

    // Enforce max cache size (LRU-style eviction)
    if (this.cache.size >= MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.delete(firstKey)
      }
    }

    const entry: CacheEntry<T> = {
      data,
      expiresAt: Date.now() + ttl * 1000,
      tags,
    }

    this.cache.set(key, entry)

    // Update tag index
    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set())
      }
      this.tagIndex.get(tag)!.add(key)
    }
  }

  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return false
    }

    // Remove from tag index
    for (const tag of entry.tags) {
      const tagKeys = this.tagIndex.get(tag)
      if (tagKeys) {
        tagKeys.delete(key)
        if (tagKeys.size === 0) {
          this.tagIndex.delete(tag)
        }
      }
    }

    return this.cache.delete(key)
  }

  /**
   * Invalidate all entries with a specific tag
   */
  invalidateTag(tag: string): number {
    const keys = this.tagIndex.get(tag)
    
    if (!keys) {
      return 0
    }

    let count = 0
    for (const key of keys) {
      if (this.delete(key)) {
        count++
      }
    }

    return count
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear()
    this.tagIndex.clear()
  }

  /**
   * Get cache stats
   */
  stats(): { size: number; tags: number } {
    return {
      size: this.cache.size,
      tags: this.tagIndex.size,
    }
  }
}

// Singleton instance
const cache = new MemoryCache()

// =============================================================================
// CACHE HELPERS
// =============================================================================

/**
 * Get or set pattern - fetch from cache or execute function
 */
export async function cached<T>(
  key: string,
  fn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  // Try cache first
  const cachedData = cache.get<T>(key)
  if (cachedData !== null) {
    return cachedData
  }

  // Execute function and cache result
  const data = await fn()
  cache.set(key, data, options)
  
  return data
}

/**
 * Invalidate cache entries by tag
 */
export function invalidateCache(tag: string): number {
  return cache.invalidateTag(tag)
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  cache.clear()
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return cache.stats()
}

// =============================================================================
// CACHE KEY BUILDERS
// =============================================================================

export const CacheKeys = {
  // Listing keys
  listing: (id: string) => `listing:${id}`,
  listingsByCategory: (category: string, page: number) => `listings:cat:${category}:p${page}`,
  listingsByRegion: (region: string, page: number) => `listings:reg:${region}:p${page}`,
  listingSearch: (query: string, page: number) => `listings:search:${query}:p${page}`,
  featuredListings: () => 'listings:featured',

  // User keys
  user: (id: string) => `user:${id}`,
  userProfile: (id: string) => `user:profile:${id}`,
  ownerListings: (ownerId: string) => `owner:listings:${ownerId}`,

  // Booking keys
  booking: (id: string) => `booking:${id}`,
  userBookings: (userId: string, role: string) => `bookings:${role}:${userId}`,

  // System keys
  categories: () => 'system:categories',
  regions: () => 'system:regions',
  systemConfig: (key: string) => `system:config:${key}`,
} as const

// =============================================================================
// CACHE TAGS
// =============================================================================

export const CacheTags = {
  // Entity tags
  listing: (id: string) => `listing:${id}`,
  user: (id: string) => `user:${id}`,
  booking: (id: string) => `booking:${id}`,

  // Collection tags
  listings: 'listings',
  users: 'users',
  bookings: 'bookings',

  // Category/region tags
  category: (cat: string) => `category:${cat}`,
  region: (reg: string) => `region:${reg}`,
} as const

// =============================================================================
// REVALIDATION HELPERS
// =============================================================================

/**
 * Invalidate listing-related caches
 */
export function revalidateListing(listingId: string, category?: string, region?: string): void {
  invalidateCache(CacheTags.listing(listingId))
  invalidateCache(CacheTags.listings)
  
  if (category) {
    invalidateCache(CacheTags.category(category))
  }
  if (region) {
    invalidateCache(CacheTags.region(region))
  }
}

/**
 * Invalidate user-related caches
 */
export function revalidateUser(userId: string): void {
  invalidateCache(CacheTags.user(userId))
}

/**
 * Invalidate booking-related caches
 */
export function revalidateBooking(bookingId: string, renterId: string, ownerId: string): void {
  invalidateCache(CacheTags.booking(bookingId))
  invalidateCache(CacheTags.bookings)
  invalidateCache(CacheTags.user(renterId))
  invalidateCache(CacheTags.user(ownerId))
}

// Export cache instance for direct access if needed
export { cache }
