import { prisma } from '@/lib/prisma'
import { AuditAction, UserRole } from '@prisma/client'
import { headers } from 'next/headers'

// Types for audit logging
interface AuditLogParams {
  action: AuditAction
  description: string
  actorId?: string
  actorEmail?: string
  actorRole?: UserRole
  targetType: 'User' | 'Listing' | 'Booking' | 'Review' | 'Policy' | 'System'
  targetId: string
  targetUserId?: string
  listingId?: string
  bookingId?: string
  previousValue?: Record<string, any>
  newValue?: Record<string, any>
  metadata?: Record<string, any>
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(params: AuditLogParams) {
  try {
    // Get request context
    const headersList = headers()
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'

    const auditLog = await prisma.auditLog.create({
      data: {
        action: params.action,
        description: params.description,
        actorId: params.actorId,
        actorEmail: params.actorEmail,
        actorRole: params.actorRole,
        targetType: params.targetType,
        targetId: params.targetId,
        targetUserId: params.targetUserId,
        listingId: params.listingId,
        bookingId: params.bookingId,
        previousValue: params.previousValue,
        newValue: params.newValue,
        metadata: params.metadata,
        ipAddress,
        userAgent,
      },
    })

    return auditLog
  } catch (error) {
    console.error('Failed to create audit log:', error)
    // Don't throw - audit logging should not break the main operation
    return null
  }
}

/**
 * Log user registration
 */
export async function logUserRegistration(userId: string, email: string) {
  return createAuditLog({
    action: 'USER_REGISTERED',
    description: `New user registered: ${email}`,
    targetType: 'User',
    targetId: userId,
    targetUserId: userId,
    newValue: { email },
  })
}

/**
 * Log user profile update
 */
export async function logUserUpdate(
  actorId: string,
  actorEmail: string,
  actorRole: UserRole,
  userId: string,
  previousValue: Record<string, any>,
  newValue: Record<string, any>
) {
  return createAuditLog({
    action: 'USER_UPDATED',
    description: `User profile updated`,
    actorId,
    actorEmail,
    actorRole,
    targetType: 'User',
    targetId: userId,
    targetUserId: userId,
    previousValue,
    newValue,
  })
}

/**
 * Log verification submission
 */
export async function logVerificationSubmitted(
  userId: string,
  userEmail: string,
  documentType: string,
  requestId: string
) {
  return createAuditLog({
    action: 'USER_VERIFICATION_SUBMITTED',
    description: `Verification request submitted: ${documentType}`,
    actorId: userId,
    actorEmail: userEmail,
    targetType: 'User',
    targetId: userId,
    targetUserId: userId,
    metadata: { documentType, requestId },
  })
}

/**
 * Log verification approval
 */
export async function logVerificationApproved(
  adminId: string,
  adminEmail: string,
  userId: string,
  requestId: string,
  documentType: string
) {
  return createAuditLog({
    action: 'USER_VERIFICATION_APPROVED',
    description: `Verification approved: ${documentType}`,
    actorId: adminId,
    actorEmail: adminEmail,
    actorRole: 'ADMIN',
    targetType: 'User',
    targetId: userId,
    targetUserId: userId,
    metadata: { documentType, requestId },
  })
}

/**
 * Log verification rejection
 */
export async function logVerificationRejected(
  adminId: string,
  adminEmail: string,
  userId: string,
  requestId: string,
  documentType: string,
  reason: string
) {
  return createAuditLog({
    action: 'USER_VERIFICATION_REJECTED',
    description: `Verification rejected: ${documentType}`,
    actorId: adminId,
    actorEmail: adminEmail,
    actorRole: 'ADMIN',
    targetType: 'User',
    targetId: userId,
    targetUserId: userId,
    metadata: { documentType, requestId, reason },
  })
}

/**
 * Log listing creation
 */
export async function logListingCreated(
  ownerId: string,
  ownerEmail: string,
  listingId: string,
  title: string,
  isHighValue: boolean
) {
  return createAuditLog({
    action: 'LISTING_CREATED',
    description: `Listing created: ${title}`,
    actorId: ownerId,
    actorEmail: ownerEmail,
    actorRole: 'OWNER',
    targetType: 'Listing',
    targetId: listingId,
    listingId,
    metadata: { title, isHighValue },
  })
}

/**
 * Log listing update
 */
export async function logListingUpdated(
  actorId: string,
  actorEmail: string,
  actorRole: UserRole,
  listingId: string,
  previousValue: Record<string, any>,
  newValue: Record<string, any>
) {
  return createAuditLog({
    action: 'LISTING_UPDATED',
    description: `Listing updated`,
    actorId,
    actorEmail,
    actorRole,
    targetType: 'Listing',
    targetId: listingId,
    listingId,
    previousValue,
    newValue,
  })
}

/**
 * Log listing status change
 */
export async function logListingStatusChanged(
  actorId: string,
  actorEmail: string,
  actorRole: UserRole,
  listingId: string,
  previousStatus: string,
  newStatus: string
) {
  return createAuditLog({
    action: 'LISTING_STATUS_CHANGED',
    description: `Listing status changed: ${previousStatus} → ${newStatus}`,
    actorId,
    actorEmail,
    actorRole,
    targetType: 'Listing',
    targetId: listingId,
    listingId,
    previousValue: { status: previousStatus },
    newValue: { status: newStatus },
  })
}

/**
 * Log high-value listing flagged
 */
export async function logHighValueFlagged(
  listingId: string,
  reason: string,
  value?: number,
  bondAmount?: number
) {
  return createAuditLog({
    action: 'LISTING_HIGH_VALUE_FLAGGED',
    description: `Listing flagged as high-value: ${reason}`,
    targetType: 'Listing',
    targetId: listingId,
    listingId,
    metadata: { reason, value, bondAmount },
  })
}

/**
 * Log booking creation
 */
export async function logBookingCreated(
  renterId: string,
  renterEmail: string,
  bookingId: string,
  listingId: string,
  rentalTotal: number
) {
  return createAuditLog({
    action: 'BOOKING_CREATED',
    description: `Booking created`,
    actorId: renterId,
    actorEmail: renterEmail,
    actorRole: 'RENTER',
    targetType: 'Booking',
    targetId: bookingId,
    listingId,
    bookingId,
    metadata: { rentalTotal },
  })
}

/**
 * Log booking status change
 */
export async function logBookingStatusChanged(
  actorId: string,
  actorEmail: string,
  actorRole: UserRole,
  bookingId: string,
  listingId: string,
  previousStatus: string,
  newStatus: string
) {
  return createAuditLog({
    action: 'BOOKING_STATUS_CHANGED',
    description: `Booking status changed: ${previousStatus} → ${newStatus}`,
    actorId,
    actorEmail,
    actorRole,
    targetType: 'Booking',
    targetId: bookingId,
    listingId,
    bookingId,
    previousValue: { status: previousStatus },
    newValue: { status: newStatus },
  })
}

/**
 * Log review creation
 */
export async function logReviewCreated(
  authorId: string,
  authorEmail: string,
  reviewId: string,
  bookingId: string,
  listingId: string,
  rating: number
) {
  return createAuditLog({
    action: 'REVIEW_CREATED',
    description: `Review created with rating ${rating}`,
    actorId: authorId,
    actorEmail: authorEmail,
    targetType: 'Review',
    targetId: reviewId,
    listingId,
    bookingId,
    metadata: { rating },
  })
}

/**
 * Log policy update
 */
export async function logPolicyUpdated(
  adminId: string,
  adminEmail: string,
  policySlug: string,
  previousVersion: number,
  newVersion: number
) {
  return createAuditLog({
    action: 'POLICY_UPDATED',
    description: `Policy updated: ${policySlug}`,
    actorId: adminId,
    actorEmail: adminEmail,
    actorRole: 'ADMIN',
    targetType: 'Policy',
    targetId: policySlug,
    previousValue: { version: previousVersion },
    newValue: { version: newVersion },
  })
}

/**
 * Log admin user suspension
 */
export async function logUserSuspended(
  adminId: string,
  adminEmail: string,
  userId: string,
  reason: string
) {
  return createAuditLog({
    action: 'ADMIN_USER_SUSPENDED',
    description: `User suspended: ${reason}`,
    actorId: adminId,
    actorEmail: adminEmail,
    actorRole: 'ADMIN',
    targetType: 'User',
    targetId: userId,
    targetUserId: userId,
    metadata: { reason },
  })
}

/**
 * Get audit logs with filtering
 */
export async function getAuditLogs(params: {
  targetType?: string
  targetId?: string
  actorId?: string
  action?: AuditAction
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}) {
  const where: any = {}

  if (params.targetType) where.targetType = params.targetType
  if (params.targetId) where.targetId = params.targetId
  if (params.actorId) where.actorId = params.actorId
  if (params.action) where.action = params.action
  if (params.startDate || params.endDate) {
    where.createdAt = {}
    if (params.startDate) where.createdAt.gte = params.startDate
    if (params.endDate) where.createdAt.lte = params.endDate
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        targetUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
          },
        },
        booking: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: params.limit || 50,
      skip: params.offset || 0,
    }),
    prisma.auditLog.count({ where }),
  ])

  return { logs, total }
}
