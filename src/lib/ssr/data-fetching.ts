/**
 * SSR Data Fetching Utilities
 * 
 * Optimized patterns for server-side data fetching in Next.js App Router.
 * Includes deduplication, parallel fetching, and error boundaries.
 */

import { cache } from 'react'
import { prisma } from '@/lib/prisma'
import { ListingCategory } from '@prisma/client'
import { 
  listingListSelect, 
  bookingListSelect,
  userPublicSelect,
  getOffsetPagination,
  buildPaginatedResponse,
  activeListingWhere,
} from '@/lib/db'
import { cached, CacheKeys, CacheTags, CacheTTL } from '@/lib/cache'

// =============================================================================
// REACT CACHE WRAPPERS
// React's cache() deduplicates requests within a single render
// =============================================================================

/**
 * Get listing by ID - deduplicated per request
 */
export const getListingById = cache(async (id: string) => {
  return prisma.listing.findUnique({
    where: { id },
    include: {
      owner: { select: userPublicSelect },
      photos: { orderBy: { position: 'asc' } },
    },
  })
})

/**
 * Get listing by ID with full details - deduplicated per request
 */
export const getListingWithDetails = cache(async (id: string) => {
  return prisma.listing.findUnique({
    where: { id },
    include: {
      owner: { select: userPublicSelect },
      photos: { orderBy: { position: 'asc' } },
    },
  })
})

/**
 * Get user by ID - deduplicated per request
 */
export const getUserById = cache(async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    select: userPublicSelect,
  })
})

/**
 * Get booking by ID - deduplicated per request
 */
export const getBookingById = cache(async (id: string) => {
  return prisma.booking.findUnique({
    where: { id },
    select: bookingListSelect,
  })
})

// =============================================================================
// CACHED DATA FETCHERS
// These use the application cache layer for cross-request caching
// =============================================================================

/**
 * Get featured listings (cached)
 */
export async function getFeaturedListings(limit: number = 8) {
  return cached(
    CacheKeys.featuredListings(),
    async () => {
      const listings = await prisma.listing.findMany({
        where: activeListingWhere,
        select: listingListSelect,
        orderBy: { createdAt: 'desc' },
        take: limit,
      })
      return listings
    },
    { ttl: CacheTTL.MEDIUM, tags: [CacheTags.listings] }
  )
}

/**
 * Get listings by category (cached)
 */
export async function getListingsByCategory(
  category: ListingCategory,
  page: number = 1,
  limit: number = 20
) {
  const cacheKey = CacheKeys.listingsByCategory(category, page)
  
  return cached(
    cacheKey,
    async () => {
      const { skip, take } = getOffsetPagination({ page, limit })
      
      const [listings, total] = await Promise.all([
        prisma.listing.findMany({
          where: { ...activeListingWhere, category },
          select: listingListSelect,
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        prisma.listing.count({
          where: { ...activeListingWhere, category },
        }),
      ])

      return buildPaginatedResponse(listings, total, page, limit)
    },
    { ttl: CacheTTL.SHORT, tags: [CacheTags.listings, CacheTags.category(category)] }
  )
}

/**
 * Get listings by region (cached)
 */
export async function getListingsByRegion(
  region: string,
  page: number = 1,
  limit: number = 20
) {
  const cacheKey = CacheKeys.listingsByRegion(region, page)
  
  return cached(
    cacheKey,
    async () => {
      const { skip, take } = getOffsetPagination({ page, limit })
      
      const [listings, total] = await Promise.all([
        prisma.listing.findMany({
          where: { ...activeListingWhere, region },
          select: listingListSelect,
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        prisma.listing.count({
          where: { ...activeListingWhere, region },
        }),
      ])

      return buildPaginatedResponse(listings, total, page, limit)
    },
    { ttl: CacheTTL.SHORT, tags: [CacheTags.listings, CacheTags.region(region)] }
  )
}

/**
 * Get owner profile with listings (cached)
 */
export async function getOwnerProfile(ownerId: string) {
  return cached(
    CacheKeys.userProfile(ownerId),
    async () => {
      const [user, listings, stats] = await Promise.all([
        prisma.user.findUnique({
          where: { id: ownerId },
          select: userPublicSelect,
        }),
        prisma.listing.findMany({
          where: { ownerId, status: 'LIVE' },
          select: listingListSelect,
          take: 10,
        }),
        prisma.booking.aggregate({
          where: { ownerId, bookingStatus: 'COMPLETED' },
          _count: true,
        }),
      ])

      return {
        user,
        listings,
        completedBookings: stats._count,
      }
    },
    { ttl: CacheTTL.MEDIUM, tags: [CacheTags.user(ownerId)] }
  )
}

// =============================================================================
// PARALLEL DATA FETCHING
// Fetch multiple independent resources in parallel
// =============================================================================

/**
 * Fetch homepage data in parallel
 */
export async function getHomepageData() {
  const [featuredListings, categories, regions] = await Promise.all([
    getFeaturedListings(8),
    getCategories(),
    getRegions(),
  ])

  return {
    featuredListings,
    categories,
    regions,
  }
}

/**
 * Fetch listing page data in parallel
 */
export async function getListingPageData(id: string) {
  const listing = await getListingWithDetails(id)
  
  if (!listing) {
    return null
  }

  const [ownerProfile, similarListings] = await Promise.all([
    getOwnerProfile(listing.ownerId),
    getSimilarListings(listing.id, listing.category, 4),
  ])

  return {
    listing,
    ownerProfile,
    similarListings,
  }
}

/**
 * Get similar listings (same category, different listing)
 */
async function getSimilarListings(
  excludeId: string,
  category: ListingCategory,
  limit: number
) {
  return prisma.listing.findMany({
    where: {
      ...activeListingWhere,
      category,
      id: { not: excludeId },
    },
    select: listingListSelect,
    take: limit,
    orderBy: { createdAt: 'desc' },
  })
}

// =============================================================================
// STATIC DATA (rarely changes)
// =============================================================================

/**
 * Get all categories (heavily cached)
 */
export async function getCategories() {
  return cached(
    CacheKeys.categories(),
    async () => {
      const categories = await prisma.listing.groupBy({
        by: ['category'],
        _count: { category: true },
        where: activeListingWhere,
        orderBy: { _count: { category: 'desc' } },
      })
      return categories.map(c => ({
        name: c.category,
        count: c._count.category,
      }))
    },
    { ttl: CacheTTL.HOUR, tags: [CacheTags.listings] }
  )
}

/**
 * Get all regions (heavily cached)
 */
export async function getRegions() {
  return cached(
    CacheKeys.regions(),
    async () => {
      const regions = await prisma.listing.groupBy({
        by: ['region', 'country'],
        _count: { region: true },
        where: activeListingWhere,
        orderBy: { _count: { region: 'desc' } },
      })
      return regions.map(r => ({
        region: r.region,
        country: r.country,
        count: r._count.region,
      }))
    },
    { ttl: CacheTTL.HOUR, tags: [CacheTags.listings] }
  )
}

// =============================================================================
// SEARCH (not cached - dynamic)
// =============================================================================

/**
 * Search listings - not cached due to dynamic nature
 */
export async function searchListings(
  query: string,
  filters: {
    category?: string
    region?: string
    minPrice?: number
    maxPrice?: number
  },
  page: number = 1,
  limit: number = 20
) {
  const { skip, take } = getOffsetPagination({ page, limit })

  const where: any = {
    ...activeListingWhere,
    OR: [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { brand: { contains: query, mode: 'insensitive' } },
      { model: { contains: query, mode: 'insensitive' } },
    ],
  }

  if (filters.category) {
    where.category = filters.category
  }
  if (filters.region) {
    where.region = filters.region
  }
  if (filters.minPrice !== undefined) {
    where.pricePerDay = { ...where.pricePerDay, gte: filters.minPrice }
  }
  if (filters.maxPrice !== undefined) {
    where.pricePerDay = { ...where.pricePerDay, lte: filters.maxPrice }
  }

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      select: listingListSelect,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.listing.count({ where }),
  ])

  return buildPaginatedResponse(listings, total, page, limit)
}
