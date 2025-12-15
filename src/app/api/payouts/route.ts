/**
 * Owner Payouts API
 * 
 * Endpoints for managing owner payouts.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  getOwnerPayoutSummary,
  getOwnerPayoutHistory,
  createOwnerPayout,
} from '@/lib/payments/payout-service'

// GET /api/payouts - Get payout summary and history for current owner
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Get payout summary (eligible bookings, totals)
    const summary = await getOwnerPayoutSummary(userId)

    if (!summary) {
      return NextResponse.json(
        { error: 'Owner not found' },
        { status: 404 }
      )
    }

    // Get payout history
    const history = await getOwnerPayoutHistory(userId)

    return NextResponse.json({
      summary,
      history,
    })
  } catch (error) {
    console.error('Get payouts error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payout information' },
      { status: 500 }
    )
  }
}

// POST /api/payouts - Request a payout
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const { bookingIds } = body // Optional: specific bookings to include

    // Verify user is an owner
    const { prisma } = await import('@/lib/prisma')
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (!user || (user.role !== 'OWNER' && user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Only owners can request payouts' },
        { status: 403 }
      )
    }

    // Create payout
    const result = await createOwnerPayout(userId, bookingIds)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create payout' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      payoutId: result.payoutId,
      stripePayoutId: result.stripePayoutId,
    })
  } catch (error) {
    console.error('Create payout error:', error)
    return NextResponse.json(
      { error: 'Failed to create payout' },
      { status: 500 }
    )
  }
}
