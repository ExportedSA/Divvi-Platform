import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ListingStatus } from '@prisma/client'

// Valid status transitions for owners
const OWNER_TRANSITIONS: Record<ListingStatus, ListingStatus[]> = {
  DRAFT: ['PENDING_REVIEW'],
  PENDING_REVIEW: ['DRAFT'], // Can withdraw submission
  LIVE: ['PAUSED'],
  PAUSED: ['LIVE', 'PENDING_REVIEW'], // Can go live again or resubmit
  REJECTED: ['DRAFT'], // Can edit and resubmit
}

// Admin can set any status
const ADMIN_STATUSES: ListingStatus[] = ['DRAFT', 'PENDING_REVIEW', 'LIVE', 'PAUSED', 'REJECTED']

// PATCH /api/listings/[id]/status - Update listing status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const userRole = (session.user as any).role

    const body = await request.json()
    const { status: newStatus, reason } = body

    if (!newStatus) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    // Get current listing
    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
      select: { ownerId: true, status: true, title: true }
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    const isOwner = listing.ownerId === userId
    const isAdmin = userRole === 'ADMIN'

    // Check authorization
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Validate status transition
    if (isAdmin) {
      if (!ADMIN_STATUSES.includes(newStatus)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
    } else {
      // Owner - check valid transitions
      const allowedTransitions = OWNER_TRANSITIONS[listing.status as ListingStatus] || []
      if (!allowedTransitions.includes(newStatus)) {
        return NextResponse.json(
          { error: `Cannot transition from ${listing.status} to ${newStatus}` },
          { status: 400 }
        )
      }
    }

    // Update status
    const updatedListing = await prisma.listing.update({
      where: { id: params.id },
      data: {
        status: newStatus,
        // If rejected by admin, store reason
        ...(newStatus === 'REJECTED' && reason ? { hiddenReason: reason } : {}),
      },
      select: {
        id: true,
        title: true,
        status: true,
      }
    })

    // Status-specific messages
    const messages: Record<ListingStatus, string> = {
      DRAFT: 'Listing moved to draft',
      PENDING_REVIEW: 'Listing submitted for review',
      LIVE: 'Listing is now live',
      PAUSED: 'Listing paused',
      REJECTED: 'Listing rejected',
    }

    return NextResponse.json({
      success: true,
      message: messages[newStatus as ListingStatus],
      listing: updatedListing
    })
  } catch (error) {
    console.error('Update listing status error:', error)
    return NextResponse.json(
      { error: 'Failed to update listing status' },
      { status: 500 }
    )
  }
}
