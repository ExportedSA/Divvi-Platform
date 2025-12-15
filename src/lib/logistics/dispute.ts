/**
 * Dispute Service
 * Business logic for managing disputes on bookings
 */

import { prisma } from '@/lib/prisma'

export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'AWAITING_RESPONSE' | 'RESOLVED' | 'ESCALATED'

export interface CreateDisputeParams {
  bookingId: string
  raisedById: string
  raisedByRole: 'OWNER' | 'RENTER'
  reason: string
  description: string
  evidenceUrls?: string[]
  claimedAmount?: number
}

export interface DisputeResponseParams {
  disputeId: string
  responderId: string
  responderRole: 'OWNER' | 'RENTER' | 'ADMIN'
  content: string
  attachmentUrls?: string[]
  isInternal?: boolean
}

export interface ResolveDisputeParams {
  disputeId: string
  resolvedById: string
  resolution: string
  resolutionNotes?: string
  finalAmount?: number
}

// ============================================
// DISPUTE MANAGEMENT
// ============================================

/**
 * Get dispute by ID
 */
export async function getDispute(disputeId: string) {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      booking: {
        include: {
          listing: {
            select: {
              id: true,
              title: true,
            },
          },
          renter: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
      responses: {
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  return dispute
}

/**
 * Get dispute by booking ID
 */
export async function getDisputesByBooking(bookingId: string) {
  const dispute = await prisma.dispute.findUnique({
    where: { bookingId },
    include: {
      responses: {
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  return dispute
}

/**
 * Add response to a dispute
 */
export async function addDisputeResponse(params: DisputeResponseParams) {
  const { disputeId, responderId, responderRole, content, attachmentUrls, isInternal } = params

  // Verify dispute exists and is not resolved
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
  })

  if (!dispute) {
    throw new Error('Dispute not found')
  }

  if (dispute.status === 'RESOLVED') {
    throw new Error('Cannot respond to a resolved dispute')
  }

  // Create response
  const response = await prisma.disputeResponse.create({
    data: {
      disputeId,
      responderId,
      responderRole,
      content,
      attachmentUrls: attachmentUrls || [],
      isInternal: isInternal || false,
    },
  })

  // Update dispute status if admin responded
  if (responderRole === 'ADMIN' && dispute.status === 'OPEN') {
    await prisma.dispute.update({
      where: { id: disputeId },
      data: { status: 'UNDER_REVIEW' },
    })
  }

  return response
}

/**
 * Update dispute status
 */
export async function updateDisputeStatus(
  disputeId: string,
  status: DisputeStatus,
  adminId?: string
) {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
  })

  if (!dispute) {
    throw new Error('Dispute not found')
  }

  if (dispute.status === 'RESOLVED') {
    throw new Error('Cannot update status of a resolved dispute')
  }

  const updated = await prisma.dispute.update({
    where: { id: disputeId },
    data: { status },
  })

  return updated
}

/**
 * Resolve a dispute
 */
export async function resolveDispute(params: ResolveDisputeParams) {
  const { disputeId, resolvedById, resolution, resolutionNotes, finalAmount } = params

  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: { booking: true },
  })

  if (!dispute) {
    throw new Error('Dispute not found')
  }

  if (dispute.status === 'RESOLVED') {
    throw new Error('Dispute is already resolved')
  }

  // Update dispute
  const resolved = await prisma.dispute.update({
    where: { id: disputeId },
    data: {
      status: 'RESOLVED',
      resolvedAt: new Date(),
      resolvedById,
      resolution,
      resolutionNotes,
      finalAmount,
    },
  })

  // Update booking status to COMPLETED
  await prisma.booking.update({
    where: { id: dispute.bookingId },
    data: { bookingStatus: 'COMPLETED' },
  })

  return resolved
}

/**
 * Get all open disputes (for admin)
 */
export async function getOpenDisputes(
  page: number = 0,
  limit: number = 20,
  status?: DisputeStatus
) {
  const where: any = {}
  if (status) {
    where.status = status
  } else {
    where.status = { not: 'RESOLVED' }
  }

  const [disputes, total] = await Promise.all([
    prisma.dispute.findMany({
      where,
      include: {
        booking: {
          include: {
            listing: {
              select: {
                id: true,
                title: true,
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
          },
        },
        responses: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: page * limit,
      take: limit,
    }),
    prisma.dispute.count({ where }),
  ])

  return {
    items: disputes,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

/**
 * Get disputes for a user (as owner or renter)
 */
export async function getUserDisputes(
  userId: string,
  page: number = 0,
  limit: number = 20
) {
  const [disputes, total] = await Promise.all([
    prisma.dispute.findMany({
      where: {
        OR: [
          { booking: { ownerId: userId } },
          { booking: { renterId: userId } },
        ],
      },
      include: {
        booking: {
          include: {
            listing: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        responses: {
          where: { isInternal: false },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: page * limit,
      take: limit,
    }),
    prisma.dispute.count({
      where: {
        OR: [
          { booking: { ownerId: userId } },
          { booking: { renterId: userId } },
        ],
      },
    }),
  ])

  return {
    items: disputes,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}
