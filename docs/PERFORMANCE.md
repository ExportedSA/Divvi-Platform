# Performance Optimization Guide

This document outlines the performance optimizations implemented in the LendIt platform.

## Overview

Performance improvements focus on four key areas:
1. **SSR Optimization** - Efficient server-side rendering patterns
2. **Query Optimization** - Prisma query best practices
3. **Caching** - In-memory caching for frequently accessed data
4. **Bundle Size** - Client-side JavaScript reduction

---

## 1. SSR Optimization

### Location: `src/lib/ssr/`

### React `cache()` for Request Deduplication

React's `cache()` function deduplicates identical requests within a single render:

```typescript
import { cache } from 'react'

export const getListingById = cache(async (id: string) => {
  return prisma.listing.findUnique({ where: { id } })
})
```

**Benefits:**
- Multiple components requesting the same data only trigger one database query
- Automatic cleanup after request completes
- Zero configuration required

### Parallel Data Fetching

Fetch independent data in parallel using `Promise.all()`:

```typescript
export async function getListingPageData(slug: string) {
  const listing = await getListingBySlug(slug)
  
  // Fetch related data in parallel
  const [ownerProfile, similarListings] = await Promise.all([
    getOwnerProfile(listing.ownerId),
    getSimilarListings(listing.id, listing.category, 4),
  ])

  return { listing, ownerProfile, similarListings }
}
```

**Benefits:**
- Reduces waterfall requests
- Total time = max(individual times) instead of sum

### Available SSR Helpers

| Function | Description | Caching |
|----------|-------------|---------|
| `getListingById(id)` | Single listing by ID | Request-scoped |
| `getListingBySlug(slug)` | Single listing by slug | Request-scoped |
| `getUserById(id)` | User by ID | Request-scoped |
| `getFeaturedListings(limit)` | Homepage listings | 5 min TTL |
| `getListingsByCategory(cat, page)` | Category listings | 30 sec TTL |
| `getOwnerProfile(id)` | Owner with listings | 5 min TTL |
| `getHomepageData()` | All homepage data | Mixed |
| `searchListings(query, filters)` | Search results | No cache |

---

## 2. Query Optimization (Prisma)

### Location: `src/lib/db/`

### Select Only Needed Fields

Reduce payload size by ~70% using optimized select objects:

```typescript
// ❌ Bad - fetches all fields
const listings = await prisma.listing.findMany()

// ✅ Good - fetches only needed fields
import { listingListSelect } from '@/lib/db'

const listings = await prisma.listing.findMany({
  select: listingListSelect,
})
```

### Pre-defined Select Objects

| Select Object | Use Case | Fields Included |
|---------------|----------|-----------------|
| `listingListSelect` | List views | id, title, slug, price, image, owner name |
| `bookingListSelect` | Booking lists | id, status, dates, listing title, parties |
| `userPublicSelect` | Public profiles | id, name, region, verification status |
| `ownerProfileSelect` | Owner pages | Public + listings + stats |

### Pagination Helpers

```typescript
import { getOffsetPagination, buildPaginatedResponse } from '@/lib/db'

const { skip, take, page, limit } = getOffsetPagination({ page: 2, limit: 20 })

const [data, total] = await Promise.all([
  prisma.listing.findMany({ skip, take }),
  prisma.listing.count(),
])

return buildPaginatedResponse(data, total, page, limit)
```

### Common Where Clauses

```typescript
import { activeListingWhere, availableListingWhere } from '@/lib/db'

// Active listings (not draft, owner not suspended)
const listings = await prisma.listing.findMany({
  where: activeListingWhere,
})

// Available in date range
const available = await prisma.listing.findMany({
  where: availableListingWhere(startDate, endDate),
})
```

### Query Batching

```typescript
import { batchIds } from '@/lib/db'

// ❌ Bad - N+1 queries
for (const id of ids) {
  await prisma.listing.findUnique({ where: { id } })
}

// ✅ Good - Single query
const uniqueIds = batchIds(ids)
const listings = await prisma.listing.findMany({
  where: { id: { in: uniqueIds } },
})
```

---

## 3. Caching Layer

### Location: `src/lib/cache/`

### In-Memory Cache with TTL

```typescript
import { cached, CacheKeys, CacheTTL, CacheTags } from '@/lib/cache'

const listings = await cached(
  CacheKeys.listingsByCategory('tractors', 1),
  async () => prisma.listing.findMany({ ... }),
  { ttl: CacheTTL.SHORT, tags: [CacheTags.listings] }
)
```

### TTL Presets

| Preset | Duration | Use Case |
|--------|----------|----------|
| `SHORT` | 30 sec | Rapidly changing data |
| `MEDIUM` | 5 min | Moderately changing data |
| `LONG` | 15 min | Stable data |
| `HOUR` | 1 hour | Rarely changing data |
| `DAY` | 24 hours | Static data |

### Cache Invalidation

```typescript
import { revalidateListing, revalidateUser, invalidateCache } from '@/lib/cache'

// After listing update
revalidateListing(listingId, category, region)

// After user update
revalidateUser(userId)

// Manual tag invalidation
invalidateCache('listings')
```

### Cache Key Builders

```typescript
import { CacheKeys } from '@/lib/cache'

CacheKeys.listing(id)              // 'listing:{id}'
CacheKeys.listingsByCategory(cat)  // 'listings:cat:{cat}:p{page}'
CacheKeys.userProfile(id)          // 'user:profile:{id}'
CacheKeys.featuredListings()       // 'listings:featured'
```

---

## 4. Bundle Size Optimization

### Location: `next.config.js`

### Package Import Optimization

```javascript
experimental: {
  optimizePackageImports: [
    '@prisma/client',
    'lucide-react',
    'date-fns',
    'zod',
  ],
}
```

**Effect:** Only imports used exports, reducing bundle size significantly.

### Console Removal in Production

```javascript
compiler: {
  removeConsole: process.env.NODE_ENV === 'production' ? {
    exclude: ['error', 'warn'],
  } : false,
}
```

### Chunk Splitting

```javascript
webpack: (config, { isServer }) => {
  if (!isServer) {
    config.optimization.splitChunks.cacheGroups = {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all',
      },
      common: {
        minChunks: 2,
        reuseExistingChunk: true,
      },
    }
  }
}
```

**Benefits:**
- Vendor code cached separately from app code
- Common code shared between routes
- Better long-term caching

### Static Asset Caching Headers

```javascript
headers: [
  {
    source: '/_next/static/:path*',
    headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
  },
  {
    source: '/images/:path*',
    headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
  },
]
```

---

## Best Practices Summary

### Do's ✅

1. **Use `select` to limit fields** - Only fetch what you need
2. **Batch related queries** - Use `Promise.all()` for parallel fetching
3. **Cache stable data** - Categories, regions, featured listings
4. **Use React `cache()`** - Deduplicate within request
5. **Paginate large datasets** - Never fetch unbounded lists
6. **Transform Decimals** - Convert to numbers for JSON

### Don'ts ❌

1. **Don't fetch all fields** - Avoid `findMany()` without `select`
2. **Don't N+1 query** - Batch IDs into single query
3. **Don't cache user-specific data** - Security risk
4. **Don't cache search results** - Too dynamic
5. **Don't over-cache** - Stale data causes bugs

---

## Monitoring

### Cache Statistics

```typescript
import { getCacheStats } from '@/lib/cache'

const stats = getCacheStats()
console.log(`Cache size: ${stats.size}, Tags: ${stats.tags}`)
```

### Query Logging (Development)

Enable Prisma query logging in development:

```typescript
// prisma.ts
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'warn', 'error'] 
    : ['error'],
})
```

---

## Future Improvements

- [ ] Redis cache for multi-instance deployments
- [ ] Database connection pooling with PgBouncer
- [ ] Edge caching with Vercel Edge Config
- [ ] Image optimization with next/image blur placeholders
- [ ] Incremental Static Regeneration for listing pages
