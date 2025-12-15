/**
 * Admin Stats API
 * 
 * Returns dashboard statistics for admin overview.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/stats
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Fetch stats in parallel
    const [pendingKyc, pendingListings, activeDisputes, suspendedUsers] = await Promise.all([
      // Pending KYC requests
      prisma.verificationRequest.count({
        where: { status: 'PENDING' },
      }),
      // Pending listing reviews
      prisma.listing.count({
        where: { status: 'PENDING_REVIEW' },
      }),
      // Active disputes (bookings in dispute)
      prisma.booking.count({
        where: { bookingStatus: 'IN_DISPUTE' },
      }),
      // Suspended users
      prisma.user.count({
        where: { isSuspended: true },
      }),
    ])

    return NextResponse.json({
      pendingKyc,
      pendingListings,
      activeDisputes,
      suspendedUsers,
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
