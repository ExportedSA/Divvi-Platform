/**
 * Stripe Webhook Handler
 * 
 * Comprehensive webhook handling with:
 * - Signature verification
 * - Idempotent event processing
 * - Booking state synchronization
 * - Logging and retry safety
 * - Event storage for reconciliation
 */

import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'
import { stripe } from './stripe-service'

// =============================================================================
// TYPES
// =============================================================================

export interface WebhookResult {
  success: boolean
  eventId: string
  eventType: string
  processed: boolean
  skipped?: boolean
  error?: string
}

export interface WebhookEventRecord {
  id: string
  stripeEventId: string
  eventType: string
  processedAt: Date | null
  status: 'PENDING' | 'PROCESSED' | 'FAILED' | 'SKIPPED'
  attempts: number
  lastError: string | null
  payload: any
}

// =============================================================================
// WEBHOOK SIGNATURE VERIFICATION
// =============================================================================

/**
 * Verify Stripe webhook signature
 * Returns null if verification fails - NEVER trust unverified webhooks
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event | null {
  if (!stripe) {
    console.error('[Webhook] Stripe not configured')
    return null
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[Webhook] STRIPE_WEBHOOK_SECRET not configured')
    return null
  }

  try {
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)
    console.log(`[Webhook] Signature verified for event ${event.id} (${event.type})`)
    return event
  } catch (error) {
    console.error('[Webhook] Signature verification failed:', error)
    return null
  }
}

// =============================================================================
// IDEMPOTENCY - EVENT DEDUPLICATION
// =============================================================================

/**
 * Check if event has already been processed (idempotency)
 */
async function hasEventBeenProcessed(eventId: string): Promise<boolean> {
  const existing = await prisma.webhookEvent.findUnique({
    where: { stripeEventId: eventId },
    select: { status: true },
  })

  return existing?.status === 'PROCESSED'
}

/**
 * Record webhook event for idempotency and audit
 */
async function recordWebhookEvent(
  event: Stripe.Event,
  status: 'PENDING' | 'PROCESSED' | 'FAILED' | 'SKIPPED',
  error?: string
): Promise<void> {
  await prisma.webhookEvent.upsert({
    where: { stripeEventId: event.id },
    create: {
      stripeEventId: event.id,
      eventType: event.type,
      status,
      attempts: 1,
      lastError: error || null,
      payload: event.data.object as any,
      processedAt: status === 'PROCESSED' ? new Date() : null,
    },
    update: {
      status,
      attempts: { increment: 1 },
      lastError: error || null,
      processedAt: status === 'PROCESSED' ? new Date() : undefined,
    },
  })
}

// =============================================================================
// BOOKING STATE SYNCHRONIZATION
// =============================================================================

/**
 * Sync booking state based on payment state
 * This is the authoritative state sync - webhooks drive booking status
 */
async function syncBookingWithPaymentState(
  bookingId: string,
  paymentStatus: 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'REFUNDED'
): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      bookingStatus: true,
      renterId: true,
      ownerId: true,
      listing: {
        select: { title: true },
      },
    },
  })

  if (!booking) {
    console.warn(`[Webhook] Booking ${bookingId} not found for state sync`)
    return
  }

  const currentStatus = booking.bookingStatus

  // Determine new booking status based on payment status
  let newStatus: string | null = null
  let notificationType: string | null = null
  let notificationRecipient: string | null = null

  switch (paymentStatus) {
    case 'SUCCEEDED':
      // Only transition if booking is in ACCEPTED state (awaiting payment)
      if (currentStatus === 'ACCEPTED') {
        newStatus = 'AWAITING_PICKUP'
        notificationType = 'PAYMENT_RECEIVED'
        notificationRecipient = booking.ownerId
      }
      break

    case 'FAILED':
      // Payment failed - notify renter to retry
      notificationType = 'PAYMENT_FAILED'
      notificationRecipient = booking.renterId
      break

    case 'CANCELLED':
      // Payment cancelled - may need to cancel booking
      if (currentStatus === 'ACCEPTED') {
        // Keep booking in ACCEPTED, renter can retry payment
        notificationType = 'PAYMENT_CANCELLED'
        notificationRecipient = booking.renterId
      }
      break

    case 'REFUNDED':
      // Full refund - may indicate cancellation
      if (currentStatus !== 'CANCELLED' && currentStatus !== 'COMPLETED') {
        newStatus = 'CANCELLED'
        notificationType = 'BOOKING_REFUNDED'
        notificationRecipient = booking.renterId
      }
      break
  }

  // Update booking status if needed
  if (newStatus && newStatus !== currentStatus) {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { bookingStatus: newStatus as any },
    })

    console.log(`[Webhook] Booking ${bookingId} status updated: ${currentStatus} -> ${newStatus}`)

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'BOOKING_STATUS_CHANGED',
        description: `Booking status changed from ${currentStatus} to ${newStatus} due to payment ${paymentStatus}`,
        targetType: 'Booking',
        targetId: bookingId,
        bookingId,
        metadata: {
          previousStatus: currentStatus,
          newStatus,
          paymentStatus,
          trigger: 'webhook',
        },
      },
    })
  }

  // Create notification if needed
  if (notificationType && notificationRecipient) {
    await prisma.notification.create({
      data: {
        userId: notificationRecipient,
        type: notificationType as any,
        payload: {
          bookingId,
          listingTitle: booking.listing.title,
          paymentStatus,
        },
      },
    })
  }
}

// =============================================================================
// EVENT HANDLERS
// =============================================================================

/**
 * Handle payment_intent.succeeded
 */
async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  console.log(`[Webhook] Processing payment_intent.succeeded: ${paymentIntent.id}`)

  const dbPaymentIntent = await prisma.paymentIntent.findUnique({
    where: { stripePaymentIntentId: paymentIntent.id },
    select: { id: true, bookingId: true, status: true },
  })

  if (!dbPaymentIntent) {
    console.warn(`[Webhook] PaymentIntent ${paymentIntent.id} not found in database`)
    return
  }

  // Skip if already processed (idempotency at record level)
  if (dbPaymentIntent.status === 'SUCCEEDED') {
    console.log(`[Webhook] PaymentIntent ${paymentIntent.id} already marked as succeeded`)
    return
  }

  // Update payment intent status
  await prisma.paymentIntent.update({
    where: { id: dbPaymentIntent.id },
    data: {
      status: 'SUCCEEDED',
      paidAt: new Date(),
    },
  })

  // Create transaction record
  await prisma.transaction.create({
    data: {
      type: 'RENTAL_PAYMENT',
      referenceId: dbPaymentIntent.bookingId,
      referenceType: 'Booking',
      currency: (paymentIntent.currency.toUpperCase() as 'NZD' | 'AUD'),
      amount: new Decimal(paymentIntent.amount / 100),
      stripeChargeId: paymentIntent.latest_charge as string || undefined,
      paymentIntentId: dbPaymentIntent.id,
      description: `Rental payment for booking ${dbPaymentIntent.bookingId}`,
    },
  })

  // Sync booking state
  await syncBookingWithPaymentState(dbPaymentIntent.bookingId, 'SUCCEEDED')

  console.log(`[Webhook] Successfully processed payment_intent.succeeded: ${paymentIntent.id}`)
}

/**
 * Handle payment_intent.payment_failed
 */
async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  console.log(`[Webhook] Processing payment_intent.payment_failed: ${paymentIntent.id}`)

  const dbPaymentIntent = await prisma.paymentIntent.findUnique({
    where: { stripePaymentIntentId: paymentIntent.id },
    select: { id: true, bookingId: true },
  })

  if (!dbPaymentIntent) {
    console.warn(`[Webhook] PaymentIntent ${paymentIntent.id} not found in database`)
    return
  }

  const failureMessage = paymentIntent.last_payment_error?.message || 'Payment failed'

  await prisma.paymentIntent.update({
    where: { id: dbPaymentIntent.id },
    data: {
      status: 'FAILED',
      failedAt: new Date(),
      failureReason: failureMessage,
    },
  })

  // Sync booking state
  await syncBookingWithPaymentState(dbPaymentIntent.bookingId, 'FAILED')

  console.log(`[Webhook] Processed payment_intent.payment_failed: ${paymentIntent.id}`)
}

/**
 * Handle payment_intent.canceled
 */
async function handlePaymentIntentCanceled(
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  console.log(`[Webhook] Processing payment_intent.canceled: ${paymentIntent.id}`)

  const dbPaymentIntent = await prisma.paymentIntent.findUnique({
    where: { stripePaymentIntentId: paymentIntent.id },
    select: { id: true, bookingId: true },
  })

  if (!dbPaymentIntent) {
    console.warn(`[Webhook] PaymentIntent ${paymentIntent.id} not found in database`)
    return
  }

  await prisma.paymentIntent.update({
    where: { id: dbPaymentIntent.id },
    data: {
      status: 'CANCELLED',
    },
  })

  // Sync booking state
  await syncBookingWithPaymentState(dbPaymentIntent.bookingId, 'CANCELLED')

  console.log(`[Webhook] Processed payment_intent.canceled: ${paymentIntent.id}`)
}

/**
 * Handle charge.refunded
 */
async function handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
  console.log(`[Webhook] Processing charge.refunded: ${charge.id}`)

  if (!charge.payment_intent) {
    console.warn(`[Webhook] Charge ${charge.id} has no payment_intent`)
    return
  }

  const dbPaymentIntent = await prisma.paymentIntent.findUnique({
    where: { stripePaymentIntentId: charge.payment_intent as string },
    select: { id: true, bookingId: true, totalAmount: true },
  })

  if (!dbPaymentIntent) {
    console.warn(`[Webhook] PaymentIntent for charge ${charge.id} not found`)
    return
  }

  const refundedAmount = charge.amount_refunded / 100
  const totalAmount = Number(dbPaymentIntent.totalAmount)
  const isFullRefund = refundedAmount >= totalAmount

  await prisma.paymentIntent.update({
    where: { id: dbPaymentIntent.id },
    data: {
      refundedAmount: new Decimal(refundedAmount),
      status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
    },
  })

  // Sync booking state for full refunds
  if (isFullRefund) {
    await syncBookingWithPaymentState(dbPaymentIntent.bookingId, 'REFUNDED')
  }

  console.log(`[Webhook] Processed charge.refunded: ${charge.id} (${isFullRefund ? 'full' : 'partial'})`)
}

/**
 * Handle charge.dispute.created
 */
async function handleDisputeCreated(dispute: Stripe.Dispute): Promise<void> {
  console.log(`[Webhook] Processing charge.dispute.created: ${dispute.id}`)

  const charge = dispute.charge as Stripe.Charge
  if (!charge?.payment_intent) {
    console.warn(`[Webhook] Dispute ${dispute.id} has no associated payment_intent`)
    return
  }

  const dbPaymentIntent = await prisma.paymentIntent.findUnique({
    where: { stripePaymentIntentId: charge.payment_intent as string },
    select: { id: true, bookingId: true },
  })

  if (!dbPaymentIntent) {
    console.warn(`[Webhook] PaymentIntent for dispute ${dispute.id} not found`)
    return
  }

  // Update booking to IN_DISPUTE if not already terminal
  const booking = await prisma.booking.findUnique({
    where: { id: dbPaymentIntent.bookingId },
    select: { bookingStatus: true, ownerId: true },
  })

  if (booking && !['COMPLETED', 'CANCELLED', 'DECLINED'].includes(booking.bookingStatus)) {
    await prisma.booking.update({
      where: { id: dbPaymentIntent.bookingId },
      data: { bookingStatus: 'IN_DISPUTE' },
    })

    // Notify owner
    await prisma.notification.create({
      data: {
        userId: booking.ownerId,
        type: 'DISPUTE_RAISED' as any,
        payload: {
          bookingId: dbPaymentIntent.bookingId,
          disputeId: dispute.id,
          reason: dispute.reason,
          amount: dispute.amount / 100,
        },
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'DISPUTE_CREATED',
        description: `Payment dispute created: ${dispute.reason}`,
        targetType: 'Booking',
        targetId: dbPaymentIntent.bookingId,
        bookingId: dbPaymentIntent.bookingId,
        metadata: {
          disputeId: dispute.id,
          reason: dispute.reason,
          amount: dispute.amount / 100,
        },
      },
    })
  }

  console.log(`[Webhook] Processed charge.dispute.created: ${dispute.id}`)
}

/**
 * Handle payout events for owner payouts
 */
async function handlePayoutEvent(
  payout: Stripe.Payout,
  eventType: string
): Promise<void> {
  console.log(`[Webhook] Processing ${eventType}: ${payout.id}`)

  const dbPayout = await prisma.payout.findUnique({
    where: { stripePayoutId: payout.id },
    select: { id: true, ownerPayoutAccountId: true },
  })

  if (!dbPayout) {
    console.log(`[Webhook] Payout ${payout.id} not found in database (may be external)`)
    return
  }

  let status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' = 'PENDING'
  
  switch (payout.status) {
    case 'paid':
      status = 'COMPLETED'
      break
    case 'pending':
      status = 'PENDING'
      break
    case 'in_transit':
      status = 'PROCESSING'
      break
    case 'canceled':
      status = 'CANCELLED'
      break
    case 'failed':
      status = 'FAILED'
      break
  }

  await prisma.payout.update({
    where: { id: dbPayout.id },
    data: {
      status,
      completedAt: status === 'COMPLETED' ? new Date() : undefined,
      failedAt: status === 'FAILED' ? new Date() : undefined,
      failureReason: payout.failure_message || undefined,
    },
  })

  console.log(`[Webhook] Processed ${eventType}: ${payout.id} -> ${status}`)
}

// =============================================================================
// MAIN WEBHOOK HANDLER
// =============================================================================

/**
 * Process a verified Stripe webhook event
 * Handles idempotency, logging, and retry safety
 */
export async function processWebhookEvent(
  event: Stripe.Event
): Promise<WebhookResult> {
  const result: WebhookResult = {
    success: false,
    eventId: event.id,
    eventType: event.type,
    processed: false,
  }

  try {
    // Check idempotency - skip if already processed
    const alreadyProcessed = await hasEventBeenProcessed(event.id)
    if (alreadyProcessed) {
      console.log(`[Webhook] Event ${event.id} already processed, skipping`)
      result.success = true
      result.skipped = true
      return result
    }

    // Record event as pending
    await recordWebhookEvent(event, 'PENDING')

    // Route to appropriate handler
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent)
        break

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge)
        break

      case 'charge.dispute.created':
        await handleDisputeCreated(event.data.object as Stripe.Dispute)
        break

      case 'payout.paid':
      case 'payout.failed':
      case 'payout.canceled':
        await handlePayoutEvent(event.data.object as Stripe.Payout, event.type)
        break

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`)
        await recordWebhookEvent(event, 'SKIPPED')
        result.success = true
        result.skipped = true
        return result
    }

    // Mark as processed
    await recordWebhookEvent(event, 'PROCESSED')
    result.success = true
    result.processed = true

    console.log(`[Webhook] Successfully processed event ${event.id} (${event.type})`)
    return result

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[Webhook] Failed to process event ${event.id}:`, error)

    // Record failure for retry tracking
    await recordWebhookEvent(event, 'FAILED', errorMessage)

    result.error = errorMessage
    return result
  }
}

// =============================================================================
// RECONCILIATION
// =============================================================================

/**
 * Get failed webhook events for manual reconciliation
 */
export async function getFailedWebhookEvents(
  limit: number = 100
): Promise<WebhookEventRecord[]> {
  const events = await prisma.webhookEvent.findMany({
    where: { status: 'FAILED' },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return events.map(e => ({
    id: e.id,
    stripeEventId: e.stripeEventId,
    eventType: e.eventType,
    processedAt: e.processedAt,
    status: e.status as 'PENDING' | 'PROCESSED' | 'FAILED' | 'SKIPPED',
    attempts: e.attempts,
    lastError: e.lastError,
    payload: e.payload,
  }))
}

/**
 * Retry a failed webhook event
 */
export async function retryWebhookEvent(
  eventId: string
): Promise<WebhookResult> {
  const dbEvent = await prisma.webhookEvent.findUnique({
    where: { id: eventId },
  })

  if (!dbEvent) {
    return {
      success: false,
      eventId,
      eventType: 'unknown',
      processed: false,
      error: 'Event not found',
    }
  }

  if (!stripe) {
    return {
      success: false,
      eventId: dbEvent.stripeEventId,
      eventType: dbEvent.eventType,
      processed: false,
      error: 'Stripe not configured',
    }
  }

  try {
    // Fetch fresh event from Stripe
    const event = await stripe.events.retrieve(dbEvent.stripeEventId)
    
    // Reset status and reprocess
    await prisma.webhookEvent.update({
      where: { id: eventId },
      data: { status: 'PENDING' },
    })

    return processWebhookEvent(event)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return {
      success: false,
      eventId: dbEvent.stripeEventId,
      eventType: dbEvent.eventType,
      processed: false,
      error: errorMessage,
    }
  }
}

/**
 * Reconcile payment states with Stripe
 * Use this for manual reconciliation of stuck payments
 */
export async function reconcilePaymentIntent(
  stripePaymentIntentId: string
): Promise<{ success: boolean; error?: string }> {
  if (!stripe) {
    return { success: false, error: 'Stripe not configured' }
  }

  try {
    // Fetch current state from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(stripePaymentIntentId)

    const dbPaymentIntent = await prisma.paymentIntent.findUnique({
      where: { stripePaymentIntentId },
      select: { id: true, bookingId: true, status: true },
    })

    if (!dbPaymentIntent) {
      return { success: false, error: 'Payment intent not found in database' }
    }

    // Map Stripe status to our status
    let newStatus: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' = 'PENDING'
    
    switch (paymentIntent.status) {
      case 'succeeded':
        newStatus = 'SUCCEEDED'
        break
      case 'processing':
        newStatus = 'PROCESSING'
        break
      case 'canceled':
        newStatus = 'CANCELLED'
        break
      case 'requires_payment_method':
      case 'requires_confirmation':
      case 'requires_action':
        newStatus = 'PENDING'
        break
      default:
        newStatus = 'FAILED'
    }

    // Update if different
    if (dbPaymentIntent.status !== newStatus) {
      await prisma.paymentIntent.update({
        where: { id: dbPaymentIntent.id },
        data: {
          status: newStatus,
          paidAt: newStatus === 'SUCCEEDED' ? new Date() : undefined,
        },
      })

      // Sync booking state
      if (newStatus === 'SUCCEEDED') {
        await syncBookingWithPaymentState(dbPaymentIntent.bookingId, 'SUCCEEDED')
      }

      console.log(`[Reconciliation] PaymentIntent ${stripePaymentIntentId} reconciled: ${dbPaymentIntent.status} -> ${newStatus}`)
    }

    return { success: true }
  } catch (error) {
    console.error('[Reconciliation] Failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Reconciliation failed',
    }
  }
}
