/**
 * Search and Discovery Service
 * 
 * Provides advanced search with:
 * - Full-text search
 * - Multi-field filtering
 * - Flexible sorting
 * - Availability-aware results
 * - Performant queries
 */

import { prisma } from '@/lib/prisma'
import { Prisma, ListingCategory } from '@prisma/client'
import { 
  listingListSelect, 
  getOffsetPagination, 
  buildPaginatedResponse,
  activeListingWhere,
} from '@/lib/db'

// =============================================================================
// TYPES
// =============================================================================

export interface SearchFilters {
  // Text search
  query?: string
  
  // Category and location
  category?: string
  categories?: string[]
  country?: 'NZ' | 'AU'
  region?: string
  regions?: string[]
  
  // Price range
  minPrice?: number
  maxPrice?: number
  currency?: 'NZD' | 'AUD'
  
  // Availability
  availableFrom?: Date
  availableTo?: Date
  
  // Equipment specs
  minYear?: number
  maxYear?: number
  brand?: string
  brands?: string[]
  
  // Features
  deliveryAvailable?: boolean
  insuranceIncluded?: boolean
  
  // Owner
  ownerId?: string
  verifiedOwnersOnly?: boolean
}

export type SortOption = 
  | 'relevance'
  | 'newest'
  | 'oldest'
  | 'price_asc'
  | 'price_desc'
  | 'title_asc'
  | 'title_desc'

export interface SearchParams {
  filters: SearchFilters
  sort?: SortOption
  page?: number
  limit?: number
}

export interface SearchResult {
  id: string
  title: string
  category: string
  pricePerDay: number
  pricePerWeek: number | null
  currency: string
  country: string
  region: string
  localArea: string | null
  status: string
  brand: string | null
  model: string | null
  year: number | null
  deliveryMode: string
  owner: {
    id: string
    firstName: string
    lastName: string
    verificationStatus: string
  }
  // Computed fields
  isAvailable?: boolean
  relevanceScore?: number
}

export interface SearchResponse {
  results: SearchResult[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  facets?: SearchFacets
}

export interface SearchFacets {
  categories: Array<{ name: string; count: number }>
  regions: Array<{ name: string; country: string; count: number }>
  brands: Array<{ name: string; count: number }>
  priceRange: { min: number; max: number }
}

// =============================================================================
// SEARCH IMPLEMENTATION
// =============================================================================

/**
 * Main search function with filtering, sorting, and availability
 */
export async function searchListings(
  params: SearchParams
): Promise<SearchResponse> {
  const { filters, sort = 'relevance', page = 1, limit = 20 } = params
  const { skip, take } = getOffsetPagination({ page, limit })

  // Build where clause
  const where = buildWhereClause(filters)

  // Build order by clause
  const orderBy = buildOrderByClause(sort, filters.query)

  // Execute search query
  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      select: {
        ...listingListSelect,
        pricePerWeek: true,
        localArea: true,
        brand: true,
        model: true,
        year: true,
        deliveryMode: true,
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            verificationStatus: true,
          },
        },
      },
      orderBy,
      skip,
      take,
    }),
    prisma.listing.count({ where }),
  ])

  // Transform results
  const results: SearchResult[] = listings.map(listing => ({
    id: listing.id,
    title: listing.title,
    category: listing.category,
    pricePerDay: Number(listing.pricePerDay),
    pricePerWeek: listing.pricePerWeek ? Number(listing.pricePerWeek) : null,
    currency: listing.currency,
    country: listing.country,
    region: listing.region,
    localArea: listing.localArea,
    status: listing.status,
    brand: listing.brand,
    model: listing.model,
    year: listing.year,
    deliveryMode: listing.deliveryMode,
    owner: {
      id: listing.owner.id,
      firstName: listing.owner.firstName,
      lastName: listing.owner.lastName,
      verificationStatus: listing.owner.verificationStatus,
    },
  }))

  return {
    results,
    pagination: buildPaginatedResponse(results, total, page, limit).pagination,
  }
}

/**
 * Search with availability check for specific dates
 */
export async function searchAvailableListings(
  params: SearchParams
): Promise<SearchResponse> {
  const { filters, sort = 'relevance', page = 1, limit = 20 } = params
  const { skip, take } = getOffsetPagination({ page, limit })

  // Build base where clause
  const baseWhere = buildWhereClause(filters)

  // Add availability filter if dates provided
  let where: Prisma.ListingWhereInput = baseWhere

  if (filters.availableFrom && filters.availableTo) {
    where = {
      ...baseWhere,
      // Exclude listings with conflicting bookings
      bookings: {
        none: {
          AND: [
            { startDate: { lte: filters.availableTo } },
            { endDate: { gte: filters.availableFrom } },
            { bookingStatus: { notIn: ['CANCELLED', 'DECLINED'] } },
          ],
        },
      },
      // Exclude listings with availability blocks
      availability: {
        none: {
          AND: [
            { startDate: { lte: filters.availableTo } },
            { endDate: { gte: filters.availableFrom } },
          ],
        },
      },
    }
  }

  const orderBy = buildOrderByClause(sort, filters.query)

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      select: {
        ...listingListSelect,
        pricePerWeek: true,
        localArea: true,
        brand: true,
        model: true,
        year: true,
        deliveryMode: true,
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            verificationStatus: true,
          },
        },
      },
      orderBy,
      skip,
      take,
    }),
    prisma.listing.count({ where }),
  ])

  const results: SearchResult[] = listings.map(listing => ({
    id: listing.id,
    title: listing.title,
    category: listing.category,
    pricePerDay: Number(listing.pricePerDay),
    pricePerWeek: listing.pricePerWeek ? Number(listing.pricePerWeek) : null,
    currency: listing.currency,
    country: listing.country,
    region: listing.region,
    localArea: listing.localArea,
    status: listing.status,
    brand: listing.brand,
    model: listing.model,
    year: listing.year,
    deliveryMode: listing.deliveryMode,
    owner: {
      id: listing.owner.id,
      firstName: listing.owner.firstName,
      lastName: listing.owner.lastName,
      verificationStatus: listing.owner.verificationStatus,
    },
    isAvailable: true, // All results are available for the requested dates
  }))

  return {
    results,
    pagination: buildPaginatedResponse(results, total, page, limit).pagination,
  }
}

/**
 * Get search facets for filtering UI
 */
export async function getSearchFacets(
  baseFilters?: Partial<SearchFilters>
): Promise<SearchFacets> {
  const baseWhere = baseFilters ? buildWhereClause(baseFilters) : activeListingWhere

  const [categories, regions, brands, priceStats] = await Promise.all([
    // Categories with counts
    prisma.listing.groupBy({
      by: ['category'],
      where: baseWhere,
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } },
    }),

    // Regions with counts
    prisma.listing.groupBy({
      by: ['region', 'country'],
      where: baseWhere,
      _count: { region: true },
      orderBy: { _count: { region: 'desc' } },
    }),

    // Brands with counts (non-null only)
    prisma.listing.groupBy({
      by: ['brand'],
      where: { ...baseWhere, brand: { not: null } },
      _count: { brand: true },
      orderBy: { _count: { brand: 'desc' } },
      take: 20,
    }),

    // Price range
    prisma.listing.aggregate({
      where: baseWhere,
      _min: { pricePerDay: true },
      _max: { pricePerDay: true },
    }),
  ])

  return {
    categories: categories.map(c => ({
      name: c.category,
      count: c._count.category,
    })),
    regions: regions.map(r => ({
      name: r.region,
      country: r.country,
      count: r._count.region,
    })),
    brands: brands
      .filter(b => b.brand !== null)
      .map(b => ({
        name: b.brand!,
        count: b._count.brand,
      })),
    priceRange: {
      min: priceStats._min.pricePerDay ? Number(priceStats._min.pricePerDay) : 0,
      max: priceStats._max.pricePerDay ? Number(priceStats._max.pricePerDay) : 0,
    },
  }
}

// =============================================================================
// QUERY BUILDERS
// =============================================================================

/**
 * Build Prisma where clause from filters
 */
function buildWhereClause(filters: SearchFilters): Prisma.ListingWhereInput {
  const conditions: Prisma.ListingWhereInput[] = [
    // Always include active listing base conditions
    activeListingWhere,
  ]

  // Text search across multiple fields
  if (filters.query && filters.query.trim()) {
    const searchTerms = filters.query.trim().toLowerCase()
    conditions.push({
      OR: [
        { title: { contains: searchTerms, mode: 'insensitive' } },
        { description: { contains: searchTerms, mode: 'insensitive' } },
        { brand: { contains: searchTerms, mode: 'insensitive' } },
        { model: { contains: searchTerms, mode: 'insensitive' } },
        // Note: category is an enum, can't use contains - search in other text fields only
      ],
    })
  }

  // Category filter
  if (filters.category) {
    conditions.push({ category: filters.category as ListingCategory })
  } else if (filters.categories && filters.categories.length > 0) {
    conditions.push({ category: { in: filters.categories as ListingCategory[] } })
  }

  // Country filter
  if (filters.country) {
    conditions.push({ country: filters.country })
  }

  // Region filter
  if (filters.region) {
    conditions.push({ region: filters.region })
  } else if (filters.regions && filters.regions.length > 0) {
    conditions.push({ region: { in: filters.regions } })
  }

  // Price range filter
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const priceCondition: Prisma.DecimalFilter = {}
    if (filters.minPrice !== undefined) {
      priceCondition.gte = filters.minPrice
    }
    if (filters.maxPrice !== undefined) {
      priceCondition.lte = filters.maxPrice
    }
    conditions.push({ pricePerDay: priceCondition })
  }

  // Currency filter
  if (filters.currency) {
    conditions.push({ currency: filters.currency })
  }

  // Year range filter
  if (filters.minYear !== undefined || filters.maxYear !== undefined) {
    const yearCondition: Prisma.IntNullableFilter = {}
    if (filters.minYear !== undefined) {
      yearCondition.gte = filters.minYear
    }
    if (filters.maxYear !== undefined) {
      yearCondition.lte = filters.maxYear
    }
    conditions.push({ year: yearCondition })
  }

  // Brand filter
  if (filters.brand) {
    conditions.push({ brand: { equals: filters.brand, mode: 'insensitive' } })
  } else if (filters.brands && filters.brands.length > 0) {
    conditions.push({ brand: { in: filters.brands, mode: 'insensitive' } })
  }

  // Delivery available filter
  if (filters.deliveryAvailable) {
    conditions.push({
      deliveryMode: { in: ['DELIVERY_ONLY', 'PICKUP_OR_DELIVERY'] },
    })
  }

  // Insurance included filter (owner provides insurance)
  if (filters.insuranceIncluded) {
    conditions.push({
      insuranceMode: 'OWNER_PROVIDED',
    })
  }

  // Owner filter
  if (filters.ownerId) {
    conditions.push({ ownerId: filters.ownerId })
  }

  // Verified owners only
  if (filters.verifiedOwnersOnly) {
    conditions.push({
      owner: { verificationStatus: 'VERIFIED' },
    })
  }

  return { AND: conditions }
}

/**
 * Build order by clause from sort option
 */
function buildOrderByClause(
  sort: SortOption,
  query?: string
): Prisma.ListingOrderByWithRelationInput | Prisma.ListingOrderByWithRelationInput[] {
  switch (sort) {
    case 'newest':
      return { createdAt: 'desc' }
    case 'oldest':
      return { createdAt: 'asc' }
    case 'price_asc':
      return { pricePerDay: 'asc' }
    case 'price_desc':
      return { pricePerDay: 'desc' }
    case 'title_asc':
      return { title: 'asc' }
    case 'title_desc':
      return { title: 'desc' }
    case 'relevance':
    default:
      // For relevance, prioritize newer listings when no query
      // When query exists, Prisma's text search handles relevance
      if (query) {
        return [{ createdAt: 'desc' }]
      }
      return { createdAt: 'desc' }
  }
}

// =============================================================================
// AVAILABILITY HELPERS
// =============================================================================

/**
 * Check if a specific listing is available for given dates
 */
export async function checkListingAvailability(
  listingId: string,
  startDate: Date,
  endDate: Date
): Promise<{ available: boolean; conflicts: string[] }> {
  const conflicts: string[] = []

  // Check for conflicting bookings
  const conflictingBookings = await prisma.booking.findMany({
    where: {
      listingId,
      AND: [
        { startDate: { lte: endDate } },
        { endDate: { gte: startDate } },
        { bookingStatus: { notIn: ['CANCELLED', 'DECLINED'] } },
      ],
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      bookingStatus: true,
    },
  })

  if (conflictingBookings.length > 0) {
    conflicts.push(
      ...conflictingBookings.map(
        b => `Booking ${b.id.slice(0, 8)}: ${b.startDate.toLocaleDateString()} - ${b.endDate.toLocaleDateString()}`
      )
    )
  }

  // Check for availability blocks
  const availabilityBlocks = await prisma.listingAvailability.findMany({
    where: {
      listingId,
      AND: [
        { startDate: { lte: endDate } },
        { endDate: { gte: startDate } },
      ],
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      type: true,
    },
  })

  if (availabilityBlocks.length > 0) {
    conflicts.push(
      ...availabilityBlocks.map(
        (b: { id: string; startDate: Date; endDate: Date; type: string }) => `Blocked: ${b.startDate.toLocaleDateString()} - ${b.endDate.toLocaleDateString()} (${b.type})`
      )
    )
  }

  return {
    available: conflicts.length === 0,
    conflicts,
  }
}

/**
 * Get available dates for a listing in a given month
 */
export async function getListingAvailability(
  listingId: string,
  year: number,
  month: number
): Promise<{ date: string; available: boolean }[]> {
  const startOfMonth = new Date(year, month - 1, 1)
  const endOfMonth = new Date(year, month, 0)

  // Get all bookings and blocks for the month
  const [bookings, blocks] = await Promise.all([
    prisma.booking.findMany({
      where: {
        listingId,
        AND: [
          { startDate: { lte: endOfMonth } },
          { endDate: { gte: startOfMonth } },
          { bookingStatus: { notIn: ['CANCELLED', 'DECLINED'] } },
        ],
      },
      select: { startDate: true, endDate: true },
    }),
    prisma.listingAvailability.findMany({
      where: {
        listingId,
        AND: [
          { startDate: { lte: endOfMonth } },
          { endDate: { gte: startOfMonth } },
        ],
      },
      select: { startDate: true, endDate: true },
    }),
  ])

  // Build unavailable date set
  const unavailableDates = new Set<string>()

  const addDateRange = (start: Date, end: Date) => {
    const current = new Date(Math.max(start.getTime(), startOfMonth.getTime()))
    const rangeEnd = new Date(Math.min(end.getTime(), endOfMonth.getTime()))
    
    while (current <= rangeEnd) {
      unavailableDates.add(current.toISOString().split('T')[0])
      current.setDate(current.getDate() + 1)
    }
  }

  bookings.forEach((b: { startDate: Date; endDate: Date }) => addDateRange(b.startDate, b.endDate))
  blocks.forEach((b: { startDate: Date; endDate: Date }) => addDateRange(b.startDate, b.endDate))

  // Generate all dates in month with availability
  const result: { date: string; available: boolean }[] = []
  const current = new Date(startOfMonth)

  while (current <= endOfMonth) {
    const dateStr = current.toISOString().split('T')[0]
    result.push({
      date: dateStr,
      available: !unavailableDates.has(dateStr),
    })
    current.setDate(current.getDate() + 1)
  }

  return result
}

// =============================================================================
// SUGGESTIONS
// =============================================================================

/**
 * Get search suggestions based on partial query
 */
export async function getSearchSuggestions(
  query: string,
  limit: number = 5
): Promise<string[]> {
  if (!query || query.length < 2) {
    return []
  }

  const searchTerm = query.toLowerCase()

  // Search in titles and brands
  const [titleMatches, brandMatches, categoryMatches] = await Promise.all([
    prisma.listing.findMany({
      where: {
        ...activeListingWhere,
        title: { contains: searchTerm, mode: 'insensitive' },
      },
      select: { title: true },
      distinct: ['title'],
      take: limit,
    }),
    prisma.listing.findMany({
      where: {
        ...activeListingWhere,
        brand: { contains: searchTerm, mode: 'insensitive' },
      },
      select: { brand: true },
      distinct: ['brand'],
      take: limit,
    }),
    // Category is an enum - get distinct categories from active listings instead
    prisma.listing.findMany({
      where: activeListingWhere,
      select: { category: true },
      distinct: ['category'],
      take: limit,
    }),
  ])

  // Combine and deduplicate
  const suggestions = new Set<string>()
  
  titleMatches.forEach(m => suggestions.add(m.title))
  brandMatches.forEach(m => m.brand && suggestions.add(m.brand))
  // Filter categories that match the search term
  categoryMatches
    .filter(m => m.category.toLowerCase().includes(searchTerm.toLowerCase()))
    .forEach(m => suggestions.add(m.category))

  return Array.from(suggestions).slice(0, limit)
}
