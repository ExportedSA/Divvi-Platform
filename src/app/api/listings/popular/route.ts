import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/listings/popular
 * Fetch top 10 most rented listings based on completed bookings
 */
export async function GET() {
  try {
    // Get all live listings with their booking counts
    const listings = await prisma.listing.findMany({
      where: {
        status: 'LIVE',
        isDeleted: false,
        isHidden: false,
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            farmName: true,
          },
        },
        photos: {
          orderBy: {
            position: 'asc',
          },
          take: 1,
        },
        bookings: {
          where: {
            bookingStatus: 'COMPLETED',
          },
          select: {
            id: true,
          },
        },
      },
      take: 50, // Get more than needed to sort
    })

    // Sort by booking count and take top 10
    const sortedListings = listings
      .map(listing => ({
        ...listing,
        bookingCount: listing.bookings.length,
      }))
      .sort((a, b) => b.bookingCount - a.bookingCount)
      .slice(0, 10)
      .map(({ bookings, ...listing }) => listing) // Remove bookings array from response

    return NextResponse.json({
      success: true,
      listings: sortedListings,
    })
  } catch (error) {
    console.error('Error fetching popular listings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch popular listings' },
      { status: 500 }
    )
  }
}
