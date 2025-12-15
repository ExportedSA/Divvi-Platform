/**
 * Booking Lifecycle Service
 * 
 * Server-side service for managing booking state transitions with full validation.
 * All booking status changes MUST go through this service.
 */

import { prisma } from '@/lib/prisma'
import { BookingStatus, UserRole } from '@prisma/client'
import {
  BookingState,
  validateTransition,
  getValidNextStates,
  isTerminalState,
  createTransitionEvent,
  TransitionEvent,
  STATE_LABELS,
} from './state-machine'
import { logBookingStatusChanged } from '@/lib/audit'

// =============================================================================
// TYPES
// =============================================================================

export interface TransitionResult {
  success: boolean
  booking?: {
    id: string
    bookingStatus: BookingStatus
    previousStatus: BookingStatus
  }
  error?: string
  transitionEvent?: TransitionEvent
}

export interface BookingContext {
  bookingId: string
  actorId: string
  actorRole: UserRole
  actorEmail?: string
  reason?: string
  metadata?: Record<string, unknown>
}

// =============================================================================
// BOOKING LIFECYCLE SERVICE
// =============================================================================

/**
 * Transition a booking to a new status with full validation
 */
export async function transitionBookingStatus(
  context: BookingContext,
  newStatus: BookingState
): Promise<TransitionResult> {
  const { bookingId, actorId, actorRole, actorEmail, reason, metadata } = context

  // Fetch current booking
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      bookingStatus: true,
      renterId: true,
      ownerId: true,
      listingId: true,
      paymentIntent: {
        select: { status: true },
      },
      handoverChecklists: {
        where: { type: 'RETURN' },
        select: { completedAt: true },
      },
    },
  })

  if (!booking) {
    return {
      success: false,
      error: `Booking ${bookingId} not found`,
    }
  }

  const currentStatus = booking.bookingStatus as BookingState

  // Check if already in terminal state
  if (isTerminalState(currentStatus)) {
    return {
      success: false,
      error: `Booking is in terminal state ${currentStatus} and cannot be modified`,
    }
  }

  // Determine if actor is owner or renter
  const isOwner = booking.ownerId === actorId
  const isRenter = booking.renterId === actorId

  // Validate the transition
  const validation = validateTransition(
    currentStatus,
    newStatus,
    actorRole,
    {
      isPaymentComplete: booking.paymentIntent?.status === 'succeeded',
      isInspectionComplete: booking.handoverChecklists.some(c => c.completedAt !== null),
      isOwner,
      isRenter,
    }
  )

  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
    }
  }

  // Perform the transition
  try {
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        bookingStatus: newStatus as BookingStatus,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        bookingStatus: true,
      },
    })

    // Create transition event for audit
    const transitionEvent = createTransitionEvent(
      bookingId,
      currentStatus,
      newStatus,
      actorId,
      actorRole,
      reason,
      metadata
    )

    // Log to audit trail
    if (actorEmail) {
      await logBookingStatusChanged(
        actorId,
        actorEmail,
        actorRole,
        bookingId,
        booking.listingId,
        currentStatus,
        newStatus
      )
    }

    // Create notification for relevant parties
    await createStatusChangeNotification(
      booking,
      currentStatus,
      newStatus,
      actorId
    )

    return {
      success: true,
      booking: {
        id: updatedBooking.id,
        bookingStatus: updatedBooking.bookingStatus,
        previousStatus: currentStatus as BookingStatus,
      },
      transitionEvent,
    }
  } catch (error) {
    console.error('Failed to transition booking status:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update booking status',
    }
  }
}

/**
 * Create notification for status change
 */
async function createStatusChangeNotification(
  booking: { id: string; renterId: string; ownerId: string },
  fromStatus: BookingState,
  toStatus: BookingState,
  actorId: string
): Promise<void> {
  const notificationMap: Partial<Record<BookingState, { type: string; recipientId: string }>> = {
    ACCEPTED: { type: 'BOOKING_ACCEPTED', recipientId: booking.renterId },
    DECLINED: { type: 'BOOKING_DECLINED', recipientId: booking.renterId },
    CANCELLED: { 
      type: 'BOOKING_CANCELLED', 
      recipientId: actorId === booking.renterId ? booking.ownerId : booking.renterId 
    },
    AWAITING_PICKUP: { type: 'PICKUP_REMINDER', recipientId: booking.renterId },
    IN_USE: { type: 'HANDOVER_COMPLETED', recipientId: booking.renterId },
    AWAITING_RETURN_INSPECTION: { type: 'RETURN_REMINDER', recipientId: booking.ownerId },
    IN_DISPUTE: { type: 'DISPUTE_RAISED', recipientId: actorId === booking.renterId ? booking.ownerId : booking.renterId },
    COMPLETED: { type: 'BOOKING_COMPLETED', recipientId: booking.renterId },
  }

  const notification = notificationMap[toStatus]
  if (notification) {
    try {
      await prisma.notification.create({
        data: {
          userId: notification.recipientId,
          type: notification.type as any,
          payload: {
            bookingId: booking.id,
            fromStatus,
            toStatus,
            message: `Booking status changed to ${STATE_LABELS[toStatus]}`,
          },
        },
      })
    } catch (error) {
      // Don't fail the transition if notification fails
      console.error('Failed to create notification:', error)
    }
  }
}

// =============================================================================
// CONVENIENCE METHODS
// =============================================================================

/**
 * Accept a booking (owner action)
 */
export async function acceptBooking(
  bookingId: string,
  ownerId: string,
  ownerEmail?: string
): Promise<TransitionResult> {
  return transitionBookingStatus(
    {
      bookingId,
      actorId: ownerId,
      actorRole: 'OWNER',
      actorEmail: ownerEmail,
      reason: 'Owner accepted booking request',
    },
    'ACCEPTED'
  )
}

/**
 * Decline a booking (owner action)
 */
export async function declineBooking(
  bookingId: string,
  ownerId: string,
  ownerEmail?: string,
  reason?: string
): Promise<TransitionResult> {
  return transitionBookingStatus(
    {
      bookingId,
      actorId: ownerId,
      actorRole: 'OWNER',
      actorEmail: ownerEmail,
      reason: reason || 'Owner declined booking request',
    },
    'DECLINED'
  )
}

/**
 * Cancel a booking (renter or owner action)
 */
export async function cancelBooking(
  bookingId: string,
  actorId: string,
  actorRole: UserRole,
  actorEmail?: string,
  reason?: string
): Promise<TransitionResult> {
  return transitionBookingStatus(
    {
      bookingId,
      actorId,
      actorRole,
      actorEmail,
      reason: reason || 'Booking cancelled',
    },
    'CANCELLED'
  )
}

/**
 * Mark booking as ready for pickup (after payment)
 */
export async function markReadyForPickup(
  bookingId: string,
  systemOrAdminId: string = 'SYSTEM'
): Promise<TransitionResult> {
  return transitionBookingStatus(
    {
      bookingId,
      actorId: systemOrAdminId,
      actorRole: systemOrAdminId === 'SYSTEM' ? 'ADMIN' : 'ADMIN',
      reason: 'Payment confirmed',
    },
    'AWAITING_PICKUP'
  )
}

/**
 * Start rental (equipment picked up)
 */
export async function startRental(
  bookingId: string,
  ownerId: string,
  ownerEmail?: string,
  engineHours?: number
): Promise<TransitionResult> {
  // Update engine hours if provided
  if (engineHours !== undefined) {
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        engineHoursAtPickup: engineHours,
        actualPickupTime: new Date(),
      },
    })
  }

  return transitionBookingStatus(
    {
      bookingId,
      actorId: ownerId,
      actorRole: 'OWNER',
      actorEmail: ownerEmail,
      reason: 'Equipment picked up',
      metadata: engineHours !== undefined ? { engineHoursAtPickup: engineHours } : undefined,
    },
    'IN_USE'
  )
}

/**
 * Mark equipment as returned (pending inspection)
 */
export async function markReturned(
  bookingId: string,
  actorId: string,
  actorRole: UserRole,
  actorEmail?: string,
  engineHours?: number
): Promise<TransitionResult> {
  // Update engine hours if provided
  if (engineHours !== undefined) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { engineHoursAtPickup: true },
    })

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        engineHoursAtReturn: engineHours,
        engineHoursUsed: booking?.engineHoursAtPickup 
          ? engineHours - booking.engineHoursAtPickup 
          : null,
        actualReturnTime: new Date(),
      },
    })
  }

  return transitionBookingStatus(
    {
      bookingId,
      actorId,
      actorRole,
      actorEmail,
      reason: 'Equipment returned',
      metadata: engineHours !== undefined ? { engineHoursAtReturn: engineHours } : undefined,
    },
    'AWAITING_RETURN_INSPECTION'
  )
}

/**
 * Complete booking (after successful inspection)
 */
export async function completeBooking(
  bookingId: string,
  ownerId: string,
  ownerEmail?: string
): Promise<TransitionResult> {
  return transitionBookingStatus(
    {
      bookingId,
      actorId: ownerId,
      actorRole: 'OWNER',
      actorEmail: ownerEmail,
      reason: 'Inspection passed, rental completed',
    },
    'COMPLETED'
  )
}

/**
 * Raise a dispute
 */
export async function raiseDispute(
  bookingId: string,
  actorId: string,
  actorRole: UserRole,
  actorEmail?: string,
  reason?: string
): Promise<TransitionResult> {
  return transitionBookingStatus(
    {
      bookingId,
      actorId,
      actorRole,
      actorEmail,
      reason: reason || 'Dispute raised',
    },
    'IN_DISPUTE'
  )
}

/**
 * Resolve a dispute (admin action)
 */
export async function resolveDispute(
  bookingId: string,
  adminId: string,
  adminEmail?: string,
  resolution?: string
): Promise<TransitionResult> {
  return transitionBookingStatus(
    {
      bookingId,
      actorId: adminId,
      actorRole: 'ADMIN',
      actorEmail: adminEmail,
      reason: resolution || 'Dispute resolved by admin',
    },
    'COMPLETED'
  )
}

// =============================================================================
// QUERY HELPERS
// =============================================================================

/**
 * Get valid next actions for a booking
 */
export async function getBookingActions(
  bookingId: string,
  actorId: string,
  actorRole: UserRole
): Promise<{
  currentStatus: BookingState
  availableTransitions: Array<{
    to: BookingState
    label: string
    description: string
  }>
}> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      bookingStatus: true,
      renterId: true,
      ownerId: true,
    },
  })

  if (!booking) {
    throw new Error(`Booking ${bookingId} not found`)
  }

  const currentStatus = booking.bookingStatus as BookingState
  const validNextStates = getValidNextStates(currentStatus)

  const availableTransitions = validNextStates
    .filter(nextState => {
      const validation = validateTransition(currentStatus, nextState, actorRole)
      return validation.valid
    })
    .map(nextState => ({
      to: nextState,
      label: STATE_LABELS[nextState],
      description: `Transition to ${STATE_LABELS[nextState]}`,
    }))

  return {
    currentStatus,
    availableTransitions,
  }
}
