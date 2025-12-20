import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/listings/recent
 * Fetch recently added listings
 */
export async function GET() {
  try {
    const recentListings = await prisma.listing.findMany({
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
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    })

    return NextResponse.json({
      success: true,
      listings: recentListings,
    })
  } catch (error) {
    console.error('Error fetching recent listings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recent listings' },
      { status: 500 }
    )
  }
}
