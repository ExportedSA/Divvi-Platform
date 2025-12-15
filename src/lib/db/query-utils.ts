/**
 * Prisma Query Optimization Utilities
 * 
 * Provides optimized query patterns, pagination, and select helpers
 * to reduce database load and improve response times.
 */

import { Prisma } from '@prisma/client'

// =============================================================================
// PAGINATION
// =============================================================================

export interface PaginationParams {
  page?: number
  limit?: number
  cursor?: string
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
    nextCursor?: string
  }
}

/**
 * Calculate skip/take for offset pagination
 */
export function getOffsetPagination(params: PaginationParams) {
  const page = Math.max(1, params.page || 1)
  const limit = Math.min(100, Math.max(1, params.limit || 20))
  const skip = (page - 1) * limit

  return { skip, take: limit, page, limit }
}

/**
 * Build paginated response
 */
export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit)
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  }
}

// =============================================================================
// SELECT OPTIMIZATION - Only fetch needed fields
// =============================================================================

/**
 * Minimal listing select for list views (reduces payload by ~70%)
 */
export const listingListSelect = {
  id: true,
  title: true,
  slug: true,
  category: true,
  pricePerDay: true,
  currency: true,
  country: true,
  region: true,
  status: true,
  primaryImageUrl: true,
  owner: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  },
} satisfies Prisma.ListingSelect

/**
 * Minimal booking select for list views
 */
export const bookingListSelect = {
  id: true,
  bookingStatus: true,
  startDate: true,
  endDate: true,
  totalPrice: true,
  currency: true,
  createdAt: true,
  listing: {
    select: {
      id: true,
      title: true,
      primaryImageUrl: true,
    },
  },
  renter: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  },
  owner: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  },
} satisfies Prisma.BookingSelect

/**
 * Minimal user select for public display
 */
export const userPublicSelect = {
  id: true,
  firstName: true,
  lastName: true,
  farmName: true,
  region: true,
  country: true,
  verificationStatus: true,
  createdAt: true,
} satisfies Prisma.UserSelect

/**
 * User select for owner profile (includes ratings)
 */
export const ownerProfileSelect = {
  ...userPublicSelect,
  listings: {
    where: { status: 'ACTIVE' },
    select: listingListSelect,
    take: 10,
  },
  _count: {
    select: {
      listings: { where: { status: 'ACTIVE' } },
      bookingsAsOwner: { where: { bookingStatus: 'COMPLETED' } },
    },
  },
} satisfies Prisma.UserSelect

// =============================================================================
// QUERY BATCHING
// =============================================================================

/**
 * Batch multiple IDs into a single query
 * Use instead of multiple findUnique calls
 */
export function batchIds<T extends string>(ids: T[]): T[] {
  return [...new Set(ids)]
}

/**
 * Create IN clause for batch queries
 */
export function inClause<T>(field: string, values: T[]) {
  return { [field]: { in: values } }
}

// =============================================================================
// COMMON WHERE CLAUSES
// =============================================================================

/**
 * Active listings filter
 */
export const activeListingWhere = {
  status: 'ACTIVE',
  owner: {
    isSuspended: false,
  },
} satisfies Prisma.ListingWhereInput

/**
 * Available listings filter (not booked in date range)
 */
export function availableListingWhere(startDate: Date, endDate: Date) {
  return {
    ...activeListingWhere,
    bookings: {
      none: {
        AND: [
          { startDate: { lte: endDate } },
          { endDate: { gte: startDate } },
          { bookingStatus: { notIn: ['CANCELLED', 'DECLINED'] } },
        ],
      },
    },
  } satisfies Prisma.ListingWhereInput
}

/**
 * User's active bookings filter
 */
export function userActiveBookingsWhere(userId: string, role: 'renter' | 'owner') {
  const userField = role === 'renter' ? 'renterId' : 'ownerId'
  return {
    [userField]: userId,
    bookingStatus: {
      notIn: ['CANCELLED', 'DECLINED', 'COMPLETED'],
    },
  } satisfies Prisma.BookingWhereInput
}

// =============================================================================
// ORDER BY HELPERS
// =============================================================================

export type SortDirection = 'asc' | 'desc'

export const listingSortOptions = {
  newest: { createdAt: 'desc' },
  oldest: { createdAt: 'asc' },
  priceAsc: { pricePerDay: 'asc' },
  priceDesc: { pricePerDay: 'desc' },
  titleAsc: { title: 'asc' },
  titleDesc: { title: 'desc' },
} as const

export const bookingSortOptions = {
  newest: { createdAt: 'desc' },
  oldest: { createdAt: 'asc' },
  startDate: { startDate: 'asc' },
  endDate: { endDate: 'asc' },
} as const

// =============================================================================
// QUERY RESULT TRANSFORMERS
// =============================================================================

/**
 * Transform Decimal fields to numbers for JSON serialization
 */
export function transformDecimals<T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): T {
  const result = { ...obj }
  for (const field of fields) {
    if (result[field] !== null && result[field] !== undefined) {
      result[field] = Number(result[field]) as any
    }
  }
  return result
}

/**
 * Transform listing for API response
 */
export function transformListing<T extends { pricePerDay?: any; pricePerWeek?: any; bondAmount?: any }>(
  listing: T
): T {
  return transformDecimals(listing, ['pricePerDay', 'pricePerWeek', 'bondAmount'])
}

/**
 * Transform booking for API response
 */
export function transformBooking<T extends { totalPrice?: any; bondAmount?: any }>(
  booking: T
): T {
  return transformDecimals(booking, ['totalPrice', 'bondAmount'])
}
