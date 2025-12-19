/**
 * Owner Payout Service
 * 
 * Handles owner payouts with:
 * - Platform fee tracking
 * - Payout delay until booking completion
 * - Refund and dispute handling
 * - Stripe Connect integration
 */

import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'
import { stripe } from './stripe-service'

// =============================================================================
// TYPES
// =============================================================================

export interface PayoutEligibleBooking {
  bookingId: string
  listingTitle: string
  completedAt: Date
  rentalAmount: number
  platformFee: number
  ownerAmount: number
  currency: 'NZD' | 'AUD'
  refundedAmount: number
  netOwnerAmount: number
}

export interface OwnerPayoutSummary {
  ownerId: string
  ownerName: string
  payoutAccountId: string | null
  stripeAccountId: string | null
  isPayoutReady: boolean
  currency: 'NZD' | 'AUD'
  eligibleBookings: PayoutEligibleBooking[]
  totalGrossAmount: number
  totalPlatformFees: number
  totalRefunds: number
  totalNetAmount: number
  minimumPayoutAmount: number
  meetsMinimum: boolean
}

export interface CreatePayoutResult {
  success: boolean
  payoutId?: string
  stripePayoutId?: string
  error?: string
}

export interface PayoutSchedule {
  schedule: 'daily' | 'weekly' | 'monthly' | 'manual'
  nextPayoutDate: Date | null
  minimumAmount: number
}

// =============================================================================
// PLATFORM FEE CONFIGURATION
// =============================================================================

const DEFAULT_PLATFORM_FEE_PERCENT = 1.5

/**
 * Get platform fee percentage from config
 */
export async function getPlatformFeePercent(): Promise<number> {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'platform_fee_percent' },
    })
    
    if (config?.value) {
      const value = config.value as { percent?: number }
      return value.percent ?? DEFAULT_PLATFORM_FEE_PERCENT
    }
  } catch {
    // Config not found, use default
  }
  return DEFAULT_PLATFORM_FEE_PERCENT
}

/**
 * Calculate platform fee for an amount
 */
export function calculatePlatformFee(
  amount: number,
  feePercent: number = DEFAULT_PLATFORM_FEE_PERCENT
): { platformFee: number; ownerAmount: number } {
  const platformFee = Math.round(amount * (feePercent / 100) * 100) / 100
  const ownerAmount = Math.round((amount - platformFee) * 100) / 100
  return { platformFee, ownerAmount }
}

// =============================================================================
// PAYOUT ELIGIBILITY
// =============================================================================

/**
 * Get bookings eligible for payout (completed, paid, not yet paid out)
 * Payouts are only released after booking completion
 */
export async function getEligibleBookingsForPayout(
  ownerId: string
): Promise<PayoutEligibleBooking[]> {
  const bookings = await prisma.booking.findMany({
    where: {
      ownerId,
      bookingStatus: 'COMPLETED', // Only completed bookings
      paymentIntent: {
        status: 'SUCCEEDED',
        isInEscrow: true, // Still in escrow (not yet paid out)
      },
    },
    select: {
      id: true,
      actualReturnTime: true,
      updatedAt: true,
      listing: {
        select: { title: true },
      },
      paymentIntent: {
        select: {
          rentalAmount: true,
          platformFeeAmount: true,
          ownerAmount: true,
          currency: true,
          refundedAmount: true,
        },
      },
    },
    orderBy: { updatedAt: 'asc' },
  })

  return bookings
    .filter(b => b.paymentIntent !== null)
    .map(booking => {
      const pi = booking.paymentIntent!
      const rentalAmount = Number(pi.rentalAmount)
      const platformFee = Number(pi.platformFeeAmount)
      const ownerAmount = Number(pi.ownerAmount)
      const refundedAmount = Number(pi.refundedAmount)
      
      // Calculate net owner amount after refunds
      // If refund occurred, proportionally reduce owner amount
      const refundRatio = refundedAmount / rentalAmount
      const ownerRefundDeduction = ownerAmount * refundRatio
      const netOwnerAmount = Math.round((ownerAmount - ownerRefundDeduction) * 100) / 100

      return {
        bookingId: booking.id,
        listingTitle: booking.listing.title,
        completedAt: booking.actualReturnTime || booking.updatedAt,
        rentalAmount,
        platformFee,
        ownerAmount,
        currency: pi.currency,
        refundedAmount,
        netOwnerAmount,
      }
    })
}

/**
 * Get payout summary for an owner
 */
export async function getOwnerPayoutSummary(
  ownerId: string
): Promise<OwnerPayoutSummary | null> {
  // Get owner details
  const owner = await prisma.user.findUnique({
    where: { id: ownerId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      payoutAccount: {
        select: {
          id: true,
          stripeAccountId: true,
          stripeOnboardingComplete: true,
          isVerified: true,
          minimumPayoutAmount: true,
        },
      },
    },
  })

  if (!owner) {
    return null
  }

  const eligibleBookings = await getEligibleBookingsForPayout(ownerId)

  // Calculate totals
  const totals = eligibleBookings.reduce(
    (acc, booking) => ({
      grossAmount: acc.grossAmount + booking.rentalAmount,
      platformFees: acc.platformFees + booking.platformFee,
      refunds: acc.refunds + booking.refundedAmount,
      netAmount: acc.netAmount + booking.netOwnerAmount,
    }),
    { grossAmount: 0, platformFees: 0, refunds: 0, netAmount: 0 }
  )

  const payoutAccount = owner.payoutAccount
  const minimumPayoutAmount = payoutAccount 
    ? Number(payoutAccount.minimumPayoutAmount) 
    : 50

  const isPayoutReady = !!(
    payoutAccount?.stripeAccountId &&
    payoutAccount?.stripeOnboardingComplete &&
    payoutAccount?.isVerified
  )

  // Determine currency (use first booking's currency or default to NZD)
  const currency = eligibleBookings[0]?.currency || 'NZD'

  return {
    ownerId: owner.id,
    ownerName: `${owner.firstName} ${owner.lastName}`,
    payoutAccountId: payoutAccount?.id || null,
    stripeAccountId: payoutAccount?.stripeAccountId || null,
    isPayoutReady,
    currency,
    eligibleBookings,
    totalGrossAmount: Math.round(totals.grossAmount * 100) / 100,
    totalPlatformFees: Math.round(totals.platformFees * 100) / 100,
    totalRefunds: Math.round(totals.refunds * 100) / 100,
    totalNetAmount: Math.round(totals.netAmount * 100) / 100,
    minimumPayoutAmount,
    meetsMinimum: totals.netAmount >= minimumPayoutAmount,
  }
}

// =============================================================================
// DISPUTE AND REFUND HANDLING
// =============================================================================

/**
 * Check if booking has active disputes that block payout
 */
export async function hasActiveDispute(bookingId: string): Promise<boolean> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { bookingStatus: true },
  })

  return booking?.bookingStatus === 'IN_DISPUTE'
}

/**
 * Calculate adjusted payout amount after refunds
 */
export function calculateAdjustedPayoutAmount(
  originalOwnerAmount: number,
  rentalAmount: number,
  refundedAmount: number
): number {
  if (refundedAmount === 0) {
    return originalOwnerAmount
  }

  // Proportionally reduce owner amount based on refund
  const refundRatio = refundedAmount / rentalAmount
  const ownerRefundDeduction = originalOwnerAmount * refundRatio
  
  return Math.round((originalOwnerAmount - ownerRefundDeduction) * 100) / 100
}

/**
 * Hold payout for disputed booking
 */
export async function holdPayoutForDispute(
  bookingId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Mark payment intent as not ready for payout
    await prisma.paymentIntent.updateMany({
      where: { bookingId },
      data: {
        isInEscrow: true, // Keep in escrow
        // Add metadata to indicate dispute hold
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'BOOKING_STATUS_CHANGED',
        description: 'Payout held due to dispute',
        targetType: 'Booking',
        targetId: bookingId,
        bookingId,
        metadata: { reason: 'dispute' },
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to hold payout for dispute:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to hold payout',
    }
  }
}

/**
 * Release payout hold after dispute resolution
 */
export async function releaseDisputeHold(
  bookingId: string,
  resolution: 'owner_favor' | 'renter_favor' | 'split'
): Promise<{ success: boolean; error?: string }> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        paymentIntent: {
          select: {
            id: true,
            ownerAmount: true,
            rentalAmount: true,
            refundedAmount: true,
          },
        },
      },
    })

    if (!booking?.paymentIntent) {
      return { success: false, error: 'Payment intent not found' }
    }

    // Determine final owner amount based on resolution
    let finalOwnerAmount = Number(booking.paymentIntent.ownerAmount)
    
    if (resolution === 'renter_favor') {
      // Full refund to renter, no payout to owner
      finalOwnerAmount = 0
    } else if (resolution === 'split') {
      // 50/50 split
      finalOwnerAmount = finalOwnerAmount / 2
    }
    // owner_favor: full amount to owner

    // Update payment intent
    await prisma.paymentIntent.update({
      where: { id: booking.paymentIntent.id },
      data: {
        ownerAmount: new Decimal(finalOwnerAmount),
        // Keep in escrow until next payout cycle
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'ADMIN_DISPUTE_RESOLVED',
        description: `Dispute resolved: ${resolution}`,
        targetType: 'Booking',
        targetId: bookingId,
        bookingId,
        metadata: { resolution, finalOwnerAmount },
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to release dispute hold:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to release hold',
    }
  }
}

// =============================================================================
// PAYOUT CREATION
// =============================================================================

/**
 * Create a payout for an owner
 */
export async function createOwnerPayout(
  ownerId: string,
  bookingIds?: string[] // Optional: specific bookings to include
): Promise<CreatePayoutResult> {
  if (!stripe) {
    return { success: false, error: 'Stripe not configured' }
  }

  try {
    // Get payout summary
    const summary = await getOwnerPayoutSummary(ownerId)
    
    if (!summary) {
      return { success: false, error: 'Owner not found' }
    }

    if (!summary.isPayoutReady) {
      return { success: false, error: 'Payout account not ready' }
    }

    if (!summary.meetsMinimum) {
      return { 
        success: false, 
        error: `Minimum payout amount is ${summary.minimumPayoutAmount} ${summary.currency}` 
      }
    }

    // Filter bookings if specific IDs provided
    let bookingsToProcess = summary.eligibleBookings
    if (bookingIds && bookingIds.length > 0) {
      bookingsToProcess = bookingsToProcess.filter(b => 
        bookingIds.includes(b.bookingId)
      )
    }

    if (bookingsToProcess.length === 0) {
      return { success: false, error: 'No eligible bookings for payout' }
    }

    // Check for disputes
    for (const booking of bookingsToProcess) {
      if (await hasActiveDispute(booking.bookingId)) {
        return { 
          success: false, 
          error: `Booking ${booking.bookingId} has an active dispute` 
        }
      }
    }

    // Calculate totals for selected bookings
    const totals = bookingsToProcess.reduce(
      (acc, b) => ({
        gross: acc.gross + b.rentalAmount,
        fees: acc.fees + b.platformFee,
        net: acc.net + b.netOwnerAmount,
      }),
      { gross: 0, fees: 0, net: 0 }
    )

    const netAmountInCents = Math.round(totals.net * 100)

    // Create Stripe transfer to connected account
    const transfer = await stripe.transfers.create({
      amount: netAmountInCents,
      currency: summary.currency.toLowerCase(),
      destination: summary.stripeAccountId!,
      metadata: {
        ownerId,
        bookingCount: String(bookingsToProcess.length),
        bookingIds: bookingsToProcess.map(b => b.bookingId).join(','),
      },
    })

    // Get payout account
    const payoutAccount = await prisma.ownerPayoutAccount.findUnique({
      where: { userId: ownerId },
    })

    if (!payoutAccount) {
      return { success: false, error: 'Payout account not found' }
    }

    // Create payout record
    const payout = await prisma.payout.create({
      data: {
        ownerPayoutAccountId: payoutAccount.id,
        stripeTransferId: transfer.id,
        currency: summary.currency,
        grossAmount: new Decimal(totals.gross),
        platformFees: new Decimal(totals.fees),
        netAmount: new Decimal(totals.net),
        periodStart: bookingsToProcess[0].completedAt,
        periodEnd: bookingsToProcess[bookingsToProcess.length - 1].completedAt,
        bookingCount: bookingsToProcess.length,
        status: 'PROCESSING',
        processedAt: new Date(),
      },
    })

    // Create payout items for each booking
    for (const booking of bookingsToProcess) {
      await prisma.payoutItem.create({
        data: {
          payoutId: payout.id,
          bookingId: booking.bookingId,
          grossAmount: new Decimal(booking.rentalAmount),
          platformFee: new Decimal(booking.platformFee),
          netAmount: new Decimal(booking.netOwnerAmount),
        },
      })

      // Mark payment intent as released from escrow
      await prisma.paymentIntent.updateMany({
        where: { bookingId: booking.bookingId },
        data: {
          isInEscrow: false,
          escrowReleasedAt: new Date(),
        },
      })
    }

    // Create transaction record
    await prisma.transaction.create({
      data: {
        type: 'OWNER_PAYOUT',
        referenceId: payout.id,
        referenceType: 'Payout',
        currency: summary.currency,
        amount: new Decimal(totals.net),
        toUserId: ownerId,
        stripeTransferId: transfer.id,
        payoutId: payout.id,
        description: `Payout for ${bookingsToProcess.length} completed booking(s)`,
      },
    })

    // Create platform fee transaction
    await prisma.transaction.create({
      data: {
        type: 'PLATFORM_FEE',
        referenceId: payout.id,
        referenceType: 'Payout',
        currency: summary.currency,
        amount: new Decimal(totals.fees),
        fromUserId: ownerId,
        description: `Platform fees for payout ${payout.id}`,
      },
    })

    console.log(`[Payout] Created payout ${payout.id} for owner ${ownerId}: ${totals.net} ${summary.currency}`)

    return {
      success: true,
      payoutId: payout.id,
      stripePayoutId: transfer.id,
    }
  } catch (error) {
    console.error('Failed to create owner payout:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create payout',
    }
  }
}

// =============================================================================
// SCHEDULED PAYOUTS
// =============================================================================

/**
 * Get owners due for payout based on their schedule
 */
export async function getOwnersDueForPayout(
  schedule: 'daily' | 'weekly' | 'monthly'
): Promise<string[]> {
  const owners = await prisma.ownerPayoutAccount.findMany({
    where: {
      payoutSchedule: schedule,
      stripeOnboardingComplete: true,
      isVerified: true,
    },
    select: { userId: true },
  })

  const ownerIds: string[] = []

  for (const owner of owners) {
    const summary = await getOwnerPayoutSummary(owner.userId)
    if (summary && summary.meetsMinimum && summary.eligibleBookings.length > 0) {
      ownerIds.push(owner.userId)
    }
  }

  return ownerIds
}

/**
 * Process scheduled payouts for all eligible owners
 */
export async function processScheduledPayouts(
  schedule: 'daily' | 'weekly' | 'monthly'
): Promise<{
  processed: number
  failed: number
  errors: Array<{ ownerId: string; error: string }>
}> {
  const ownerIds = await getOwnersDueForPayout(schedule)
  
  let processed = 0
  let failed = 0
  const errors: Array<{ ownerId: string; error: string }> = []

  for (const ownerId of ownerIds) {
    const result = await createOwnerPayout(ownerId)
    
    if (result.success) {
      processed++
    } else {
      failed++
      errors.push({ ownerId, error: result.error || 'Unknown error' })
    }
  }

  console.log(`[Payout] Scheduled ${schedule} payouts: ${processed} processed, ${failed} failed`)

  return { processed, failed, errors }
}

// =============================================================================
// PAYOUT STATUS
// =============================================================================

/**
 * Get payout history for an owner
 */
export async function getOwnerPayoutHistory(
  ownerId: string,
  limit: number = 20
): Promise<Array<{
  id: string
  amount: number
  currency: string
  status: string
  bookingCount: number
  createdAt: Date
  completedAt: Date | null
}>> {
  const payoutAccount = await prisma.ownerPayoutAccount.findUnique({
    where: { userId: ownerId },
    select: { id: true },
  })

  if (!payoutAccount) {
    return []
  }

  const payouts = await prisma.payout.findMany({
    where: { ownerPayoutAccountId: payoutAccount.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      netAmount: true,
      currency: true,
      status: true,
      bookingCount: true,
      createdAt: true,
      completedAt: true,
    },
  })

  return payouts.map(p => ({
    id: p.id,
    amount: Number(p.netAmount),
    currency: p.currency,
    status: p.status,
    bookingCount: p.bookingCount,
    createdAt: p.createdAt,
    completedAt: p.completedAt,
  }))
}

/**
 * Update payout status from Stripe webhook
 */
export async function updatePayoutStatus(
  stripeTransferId: string,
  status: 'COMPLETED' | 'FAILED',
  failureReason?: string
): Promise<void> {
  await prisma.payout.updateMany({
    where: { stripeTransferId },
    data: {
      status,
      completedAt: status === 'COMPLETED' ? new Date() : undefined,
      failedAt: status === 'FAILED' ? new Date() : undefined,
      failureReason,
    },
  })
}

// =============================================================================
// STRIPE CONNECT ONBOARDING
// =============================================================================

/**
 * Create Stripe Connect account for owner
 */
export async function createStripeConnectAccount(
  ownerId: string,
  email: string,
  country: 'NZ' | 'AU'
): Promise<{ success: boolean; accountId?: string; onboardingUrl?: string; error?: string }> {
  if (!stripe) {
    return { success: false, error: 'Stripe not configured' }
  }

  try {
    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      country: country === 'NZ' ? 'NZ' : 'AU',
      email,
      capabilities: {
        transfers: { requested: true },
      },
      metadata: {
        ownerId,
      },
    })

    // Create or update payout account record
    await prisma.ownerPayoutAccount.upsert({
      where: { userId: ownerId },
      create: {
        userId: ownerId,
        stripeAccountId: account.id,
        stripeAccountStatus: 'pending',
      },
      update: {
        stripeAccountId: account.id,
        stripeAccountStatus: 'pending',
      },
    })

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/owner/payouts/onboarding?refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/owner/payouts/onboarding?success=true`,
      type: 'account_onboarding',
    })

    return {
      success: true,
      accountId: account.id,
      onboardingUrl: accountLink.url,
    }
  } catch (error) {
    console.error('Failed to create Stripe Connect account:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create account',
    }
  }
}

/**
 * Check and update Stripe Connect account status
 */
export async function refreshStripeAccountStatus(
  ownerId: string
): Promise<{ success: boolean; status?: string; error?: string }> {
  if (!stripe) {
    return { success: false, error: 'Stripe not configured' }
  }

  try {
    const payoutAccount = await prisma.ownerPayoutAccount.findUnique({
      where: { userId: ownerId },
      select: { id: true, stripeAccountId: true },
    })

    if (!payoutAccount?.stripeAccountId) {
      return { success: false, error: 'No Stripe account found' }
    }

    const account = await stripe.accounts.retrieve(payoutAccount.stripeAccountId)

    const isComplete = account.details_submitted && account.payouts_enabled
    const status = isComplete ? 'active' : 
                   account.details_submitted ? 'pending_verification' : 'pending'

    await prisma.ownerPayoutAccount.update({
      where: { id: payoutAccount.id },
      data: {
        stripeAccountStatus: status,
        stripeOnboardingComplete: isComplete,
        isVerified: isComplete,
        verifiedAt: isComplete ? new Date() : undefined,
      },
    })

    return { success: true, status }
  } catch (error) {
    console.error('Failed to refresh Stripe account status:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to refresh status',
    }
  }
}
