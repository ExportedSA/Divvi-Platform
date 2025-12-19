/**
 * Stripe Payment Service
 * 
 * Server-side payment processing with Stripe.
 * All payment logic is server-side - no client-side trust assumptions.
 */

import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

// =============================================================================
// STRIPE CLIENT INITIALIZATION
// =============================================================================

// Lazy initialization - only create Stripe client when actually needed at runtime
let stripeInstance: Stripe | null = null

export function getStripe(): Stripe | null {
  // During build time, return null to avoid requiring env vars
  if (typeof window !== 'undefined' || !process.env.STRIPE_SECRET_KEY) {
    return stripeInstance
  }

  if (stripeInstance) {
    return stripeInstance
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  const stripeApiVersion = (process.env.STRIPE_API_VERSION || '2025-11-17') as any

  stripeInstance = new Stripe(stripeSecretKey, {
    apiVersion: stripeApiVersion,
    typescript: true,
  })

  return stripeInstance
}

// Export stripe - lazily initialized, safe for build time
export const stripe = getStripe()

// =============================================================================
// TYPES
// =============================================================================

export interface PaymentAmounts {
  rentalAmount: number
  platformFeeAmount: number
  platformFeePercent: number
  ownerAmount: number
  totalAmount: number
  bondAmount?: number
  currency: 'NZD' | 'AUD'
}

export interface CreatePaymentIntentParams {
  bookingId: string
  amounts: PaymentAmounts
  customerId?: string
  metadata?: Record<string, string>
}

export interface PaymentIntentResult {
  success: boolean
  paymentIntentId?: string
  clientSecret?: string
  error?: string
}

export interface DepositPaymentParams {
  bookingId: string
  depositPercent: number // e.g., 20 for 20%
}

export type PaymentMode = 'FULL' | 'DEPOSIT' | 'DEPOSIT_THEN_BALANCE'

// =============================================================================
// PLATFORM FEE CONFIGURATION
// =============================================================================

const PLATFORM_FEE_PERCENT = 1.5 // 1.5% platform fee

/**
 * Calculate payment amounts for a booking
 */
export function calculatePaymentAmounts(
  rentalTotal: number,
  bondAmount: number = 0,
  currency: 'NZD' | 'AUD' = 'NZD'
): PaymentAmounts {
  const rentalAmount = Math.round(rentalTotal * 100) / 100
  const platformFeeAmount = Math.round(rentalAmount * (PLATFORM_FEE_PERCENT / 100) * 100) / 100
  const ownerAmount = Math.round((rentalAmount - platformFeeAmount) * 100) / 100
  const totalAmount = rentalAmount // Bond is handled separately

  return {
    rentalAmount,
    platformFeeAmount,
    platformFeePercent: PLATFORM_FEE_PERCENT,
    ownerAmount,
    totalAmount,
    bondAmount: bondAmount > 0 ? bondAmount : undefined,
    currency,
  }
}

/**
 * Calculate deposit amount
 */
export function calculateDepositAmount(
  totalAmount: number,
  depositPercent: number = 20
): { depositAmount: number; balanceAmount: number } {
  const depositAmount = Math.round(totalAmount * (depositPercent / 100) * 100) / 100
  const balanceAmount = Math.round((totalAmount - depositAmount) * 100) / 100
  
  return { depositAmount, balanceAmount }
}

// =============================================================================
// PAYMENT INTENT CREATION
// =============================================================================

/**
 * Create a Stripe payment intent for a booking
 * Server-side only - never trust client-provided amounts
 */
export async function createPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<PaymentIntentResult> {
  if (!stripe) {
    return { success: false, error: 'Stripe not configured' }
  }

  const { bookingId, amounts, customerId, metadata } = params

  try {
    // Verify booking exists and is in correct state
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        bookingStatus: true,
        renterId: true,
        ownerId: true,
        rentalTotal: true,
        currency: true,
        listing: {
          select: {
            title: true,
            bondAmount: true,
          },
        },
        paymentIntent: true,
        owner: {
          select: {
            payoutAccount: {
              select: {
                stripeAccountId: true,
                stripeOnboardingComplete: true,
              },
            },
          },
        },
      },
    })

    if (!booking) {
      return { success: false, error: 'Booking not found' }
    }

    if (booking.bookingStatus !== 'ACCEPTED') {
      return { success: false, error: 'Booking must be accepted before payment' }
    }

    // Verify owner has completed Stripe Connect onboarding
    const ownerStripeAccountId = booking.owner.payoutAccount?.stripeAccountId
    if (!ownerStripeAccountId) {
      return { success: false, error: 'Owner has not completed payment setup' }
    }

    if (!booking.owner.payoutAccount?.stripeOnboardingComplete) {
      return { success: false, error: 'Owner payment account is not fully verified' }
    }

    if (booking.paymentIntent) {
      // Return existing payment intent if already created
      return {
        success: true,
        paymentIntentId: booking.paymentIntent.stripePaymentIntentId || undefined,
        clientSecret: booking.paymentIntent.stripeClientSecret || undefined,
      }
    }

    // SERVER-SIDE AMOUNT CALCULATION - Never trust client amounts
    const serverCalculatedAmounts = calculatePaymentAmounts(
      Number(booking.rentalTotal),
      booking.listing.bondAmount ? Number(booking.listing.bondAmount) : 0,
      booking.currency
    )

    // Convert to cents for Stripe
    const amountInCents = Math.round(serverCalculatedAmounts.totalAmount * 100)
    const platformFeeInCents = Math.round(serverCalculatedAmounts.platformFeeAmount * 100)

    // Create Stripe payment intent with Connect routing
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: serverCalculatedAmounts.currency.toLowerCase(),
      customer: customerId,
      
      // CRITICAL: Platform fee - collected by Divvi
      application_fee_amount: platformFeeInCents,
      
      // CRITICAL: Route funds to owner's Connect account
      transfer_data: {
        destination: ownerStripeAccountId,
      },
      
      metadata: {
        bookingId,
        renterId: booking.renterId,
        ownerId: booking.ownerId,
        listingTitle: booking.listing.title,
        ...metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
      // Capture immediately - no manual capture for rental payments
      capture_method: 'automatic',
    })

    // Store payment intent in database
    await prisma.paymentIntent.create({
      data: {
        bookingId,
        stripePaymentIntentId: paymentIntent.id,
        stripeClientSecret: paymentIntent.client_secret,
        currency: serverCalculatedAmounts.currency,
        rentalAmount: new Decimal(serverCalculatedAmounts.rentalAmount),
        platformFeeAmount: new Decimal(serverCalculatedAmounts.platformFeeAmount),
        platformFeePercent: new Decimal(serverCalculatedAmounts.platformFeePercent),
        ownerAmount: new Decimal(serverCalculatedAmounts.ownerAmount),
        totalAmount: new Decimal(serverCalculatedAmounts.totalAmount),
        status: 'PENDING',
        isInEscrow: true,
      },
    })

    return {
      success: true,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret || undefined,
    }
  } catch (error) {
    console.error('Failed to create payment intent:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create payment intent',
    }
  }
}

/**
 * Create a deposit payment intent (partial payment)
 */
export async function createDepositPaymentIntent(
  params: DepositPaymentParams
): Promise<PaymentIntentResult> {
  if (!stripe) {
    return { success: false, error: 'Stripe not configured' }
  }

  const { bookingId, depositPercent } = params

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        bookingStatus: true,
        renterId: true,
        ownerId: true,
        rentalTotal: true,
        currency: true,
        listing: {
          select: { title: true },
        },
        owner: {
          select: {
            payoutAccount: {
              select: {
                stripeAccountId: true,
                stripeOnboardingComplete: true,
              },
            },
          },
        },
      },
    })

    if (!booking) {
      return { success: false, error: 'Booking not found' }
    }

    if (booking.bookingStatus !== 'ACCEPTED') {
      return { success: false, error: 'Booking must be accepted before payment' }
    }

    // Verify owner has completed Stripe Connect onboarding
    const ownerStripeAccountId = booking.owner.payoutAccount?.stripeAccountId
    if (!ownerStripeAccountId) {
      return { success: false, error: 'Owner has not completed payment setup' }
    }

    if (!booking.owner.payoutAccount?.stripeOnboardingComplete) {
      return { success: false, error: 'Owner payment account is not fully verified' }
    }

    const totalAmount = Number(booking.rentalTotal)
    const { depositAmount } = calculateDepositAmount(totalAmount, depositPercent)
    const amounts = calculatePaymentAmounts(depositAmount, 0, booking.currency)
    const amountInCents = Math.round(depositAmount * 100)
    const platformFeeInCents = Math.round(amounts.platformFeeAmount * 100)

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: booking.currency.toLowerCase(),
      
      // CRITICAL: Platform fee - collected by Divvi
      application_fee_amount: platformFeeInCents,
      
      // CRITICAL: Route funds to owner's Connect account
      transfer_data: {
        destination: ownerStripeAccountId,
      },
      
      metadata: {
        bookingId,
        renterId: booking.renterId,
        ownerId: booking.ownerId,
        paymentType: 'DEPOSIT',
        depositPercent: String(depositPercent),
        totalAmount: String(totalAmount),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    // Store as pending deposit payment (reuse amounts calculated above)
    await prisma.paymentIntent.create({
      data: {
        bookingId,
        stripePaymentIntentId: paymentIntent.id,
        stripeClientSecret: paymentIntent.client_secret,
        currency: booking.currency,
        rentalAmount: new Decimal(depositAmount),
        platformFeeAmount: new Decimal(amounts.platformFeeAmount),
        platformFeePercent: new Decimal(amounts.platformFeePercent),
        ownerAmount: new Decimal(amounts.ownerAmount),
        totalAmount: new Decimal(depositAmount),
        status: 'PENDING',
        isInEscrow: true,
      },
    })

    return {
      success: true,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret || undefined,
    }
  } catch (error) {
    console.error('Failed to create deposit payment intent:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create deposit payment',
    }
  }
}

// =============================================================================
// PAYMENT CONFIRMATION (SERVER-SIDE)
// =============================================================================

/**
 * Confirm payment status from Stripe (server-side verification)
 * NEVER trust client-side payment confirmation
 */
export async function confirmPaymentStatus(
  paymentIntentId: string
): Promise<{
  success: boolean
  status: 'succeeded' | 'processing' | 'requires_action' | 'failed' | 'canceled'
  error?: string
}> {
  if (!stripe) {
    return { success: false, status: 'failed', error: 'Stripe not configured' }
  }

  try {
    // Retrieve payment intent directly from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    // Update our database based on Stripe's authoritative status
    const dbPaymentIntent = await prisma.paymentIntent.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
      select: { id: true, bookingId: true },
    })

    if (dbPaymentIntent) {
      let dbStatus: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' = 'PENDING'
      
      switch (paymentIntent.status) {
        case 'succeeded':
          dbStatus = 'SUCCEEDED'
          break
        case 'processing':
          dbStatus = 'PROCESSING'
          break
        case 'canceled':
          dbStatus = 'CANCELLED'
          break
        case 'requires_payment_method':
        case 'requires_confirmation':
        case 'requires_action':
          dbStatus = 'PENDING'
          break
        default:
          dbStatus = 'FAILED'
      }

      await prisma.paymentIntent.update({
        where: { id: dbPaymentIntent.id },
        data: {
          status: dbStatus,
          paidAt: dbStatus === 'SUCCEEDED' ? new Date() : undefined,
          failedAt: dbStatus === 'FAILED' ? new Date() : undefined,
          failureReason: paymentIntent.last_payment_error?.message,
        },
      })

      // If payment succeeded, update booking status
      if (dbStatus === 'SUCCEEDED') {
        await prisma.booking.update({
          where: { id: dbPaymentIntent.bookingId },
          data: { bookingStatus: 'AWAITING_PICKUP' },
        })

        // Create transaction record
        await prisma.transaction.create({
          data: {
            type: 'RENTAL_PAYMENT',
            referenceId: dbPaymentIntent.bookingId,
            referenceType: 'Booking',
            currency: paymentIntent.currency.toUpperCase() as 'NZD' | 'AUD',
            amount: new Decimal(paymentIntent.amount / 100),
            stripeChargeId: paymentIntent.latest_charge as string,
            paymentIntentId: dbPaymentIntent.id,
            description: `Rental payment for booking ${dbPaymentIntent.bookingId}`,
          },
        })
      }
    }

    const statusMap: Record<string, 'succeeded' | 'processing' | 'requires_action' | 'failed' | 'canceled'> = {
      succeeded: 'succeeded',
      processing: 'processing',
      requires_action: 'requires_action',
      requires_payment_method: 'failed',
      canceled: 'canceled',
    }

    return {
      success: paymentIntent.status === 'succeeded',
      status: statusMap[paymentIntent.status] || 'failed',
    }
  } catch (error) {
    console.error('Failed to confirm payment status:', error)
    return {
      success: false,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Failed to confirm payment',
    }
  }
}

// =============================================================================
// BOND HANDLING
// =============================================================================

/**
 * Create a bond hold (authorization without capture)
 */
export async function createBondHold(
  bookingId: string,
  amount: number,
  currency: 'NZD' | 'AUD',
  paymentMethodId: string
): Promise<{
  success: boolean
  bondHoldId?: string
  error?: string
}> {
  if (!stripe) {
    return { success: false, error: 'Stripe not configured' }
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, renterId: true },
    })

    if (!booking) {
      return { success: false, error: 'Booking not found' }
    }

    const amountInCents = Math.round(amount * 100)

    // Create payment intent with manual capture for bond
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      payment_method: paymentMethodId,
      capture_method: 'manual', // Don't capture immediately
      confirm: true, // Authorize immediately
      metadata: {
        bookingId,
        type: 'BOND_HOLD',
      },
    })

    // Calculate expiry (7 days for authorization)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Store bond hold
    const bondHold = await prisma.bondHold.create({
      data: {
        bookingId,
        stripePaymentIntentId: paymentIntent.id,
        stripePaymentMethodId: paymentMethodId,
        currency,
        authorizedAmount: new Decimal(amount),
        status: 'AUTHORIZED',
        authorizedAt: new Date(),
        expiresAt,
      },
    })

    return {
      success: true,
      bondHoldId: bondHold.id,
    }
  } catch (error) {
    console.error('Failed to create bond hold:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create bond hold',
    }
  }
}

/**
 * Capture bond (for damage claims)
 */
export async function captureBond(
  bondHoldId: string,
  captureAmount: number,
  reason: string,
  capturedBy: string
): Promise<{
  success: boolean
  error?: string
}> {
  if (!stripe) {
    return { success: false, error: 'Stripe not configured' }
  }

  try {
    const bondHold = await prisma.bondHold.findUnique({
      where: { id: bondHoldId },
      select: {
        id: true,
        stripePaymentIntentId: true,
        authorizedAmount: true,
        status: true,
        bookingId: true,
      },
    })

    if (!bondHold) {
      return { success: false, error: 'Bond hold not found' }
    }

    if (bondHold.status !== 'AUTHORIZED') {
      return { success: false, error: `Cannot capture bond with status: ${bondHold.status}` }
    }

    if (!bondHold.stripePaymentIntentId) {
      return { success: false, error: 'No Stripe payment intent for bond' }
    }

    const authorizedAmount = Number(bondHold.authorizedAmount)
    if (captureAmount > authorizedAmount) {
      return { success: false, error: 'Capture amount exceeds authorized amount' }
    }

    const captureAmountInCents = Math.round(captureAmount * 100)

    // Capture the payment intent
    await stripe.paymentIntents.capture(bondHold.stripePaymentIntentId, {
      amount_to_capture: captureAmountInCents,
    })

    // Update bond hold status
    const isPartialCapture = captureAmount < authorizedAmount
    
    await prisma.bondHold.update({
      where: { id: bondHoldId },
      data: {
        status: isPartialCapture ? 'PARTIALLY_CAPTURED' : 'CAPTURED',
        capturedAmount: new Decimal(captureAmount),
        capturedAt: new Date(),
        captureReason: reason,
        capturedBy,
      },
    })

    // Create transaction record
    await prisma.transaction.create({
      data: {
        type: 'BOND_CAPTURE',
        referenceId: bondHold.bookingId,
        referenceType: 'Booking',
        currency: 'NZD', // TODO: Get from bond hold
        amount: new Decimal(captureAmount),
        bondHoldId: bondHold.id,
        description: `Bond captured: ${reason}`,
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to capture bond:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to capture bond',
    }
  }
}

/**
 * Release bond (return to renter)
 */
export async function releaseBond(
  bondHoldId: string
): Promise<{
  success: boolean
  error?: string
}> {
  if (!stripe) {
    return { success: false, error: 'Stripe not configured' }
  }

  try {
    const bondHold = await prisma.bondHold.findUnique({
      where: { id: bondHoldId },
      select: {
        id: true,
        stripePaymentIntentId: true,
        authorizedAmount: true,
        capturedAmount: true,
        status: true,
        bookingId: true,
      },
    })

    if (!bondHold) {
      return { success: false, error: 'Bond hold not found' }
    }

    if (bondHold.status !== 'AUTHORIZED' && bondHold.status !== 'PARTIALLY_CAPTURED') {
      return { success: false, error: `Cannot release bond with status: ${bondHold.status}` }
    }

    if (bondHold.stripePaymentIntentId) {
      // Cancel the payment intent to release the hold
      await stripe.paymentIntents.cancel(bondHold.stripePaymentIntentId)
    }

    const releasedAmount = Number(bondHold.authorizedAmount) - Number(bondHold.capturedAmount)

    await prisma.bondHold.update({
      where: { id: bondHoldId },
      data: {
        status: 'RELEASED',
        releasedAmount: new Decimal(releasedAmount),
        releasedAt: new Date(),
      },
    })

    // Create transaction record
    await prisma.transaction.create({
      data: {
        type: 'BOND_RELEASE',
        referenceId: bondHold.bookingId,
        referenceType: 'Booking',
        currency: 'NZD',
        amount: new Decimal(releasedAmount),
        bondHoldId: bondHold.id,
        description: 'Bond released to renter',
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to release bond:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to release bond',
    }
  }
}

// =============================================================================
// REFUNDS
// =============================================================================

/**
 * Process a refund
 */
export async function processRefund(
  paymentIntentId: string,
  amount: number,
  reason: string
): Promise<{
  success: boolean
  refundId?: string
  error?: string
}> {
  if (!stripe) {
    return { success: false, error: 'Stripe not configured' }
  }

  try {
    const dbPaymentIntent = await prisma.paymentIntent.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
      select: {
        id: true,
        bookingId: true,
        totalAmount: true,
        refundedAmount: true,
        currency: true,
      },
    })

    if (!dbPaymentIntent) {
      return { success: false, error: 'Payment intent not found' }
    }

    const totalAmount = Number(dbPaymentIntent.totalAmount)
    const alreadyRefunded = Number(dbPaymentIntent.refundedAmount)
    const maxRefundable = totalAmount - alreadyRefunded

    if (amount > maxRefundable) {
      return { success: false, error: `Maximum refundable amount is ${maxRefundable}` }
    }

    const amountInCents = Math.round(amount * 100)

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amountInCents,
      reason: 'requested_by_customer',
      metadata: {
        bookingId: dbPaymentIntent.bookingId,
        reason,
      },
    })

    const newRefundedAmount = alreadyRefunded + amount
    const isFullRefund = newRefundedAmount >= totalAmount

    await prisma.paymentIntent.update({
      where: { id: dbPaymentIntent.id },
      data: {
        refundedAmount: new Decimal(newRefundedAmount),
        refundReason: reason,
        status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
      },
    })

    // Create transaction record
    await prisma.transaction.create({
      data: {
        type: 'REFUND',
        referenceId: dbPaymentIntent.bookingId,
        referenceType: 'Booking',
        currency: dbPaymentIntent.currency,
        amount: new Decimal(amount),
        paymentIntentId: dbPaymentIntent.id,
        description: `Refund: ${reason}`,
      },
    })

    return {
      success: true,
      refundId: refund.id,
    }
  } catch (error) {
    console.error('Failed to process refund:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process refund',
    }
  }
}

// =============================================================================
// WEBHOOK HANDLING
// =============================================================================

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event | null {
  if (!stripe) {
    return null
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured')
    return null
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return null
  }
}

/**
 * Handle Stripe webhook events
 */
export async function handleWebhookEvent(
  event: Stripe.Event
): Promise<{ success: boolean; error?: string }> {
  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await confirmPaymentStatus(paymentIntent.id)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await prisma.paymentIntent.updateMany({
          where: { stripePaymentIntentId: paymentIntent.id },
          data: {
            status: 'FAILED',
            failedAt: new Date(),
            failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
          },
        })
        break
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await prisma.paymentIntent.updateMany({
          where: { stripePaymentIntentId: paymentIntent.id },
          data: {
            status: 'CANCELLED',
          },
        })
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        // Refund already handled in processRefund, but update if webhook arrives first
        if (charge.payment_intent) {
          const refundedAmount = charge.amount_refunded / 100
          await prisma.paymentIntent.updateMany({
            where: { stripePaymentIntentId: charge.payment_intent as string },
            data: {
              refundedAmount: new Decimal(refundedAmount),
              status: charge.refunded ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
            },
          })
        }
        break
      }

      default:
        console.log(`Unhandled webhook event type: ${event.type}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to handle webhook event:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to handle webhook',
    }
  }
}
