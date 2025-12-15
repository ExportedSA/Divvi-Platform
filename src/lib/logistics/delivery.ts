/**
 * Delivery Service
 * Business logic for delivery options and fee calculations
 */

import { prisma } from '@/lib/prisma'

export type DeliveryMode = 'PICKUP_ONLY' | 'DELIVERY_ONLY' | 'PICKUP_OR_DELIVERY'

export interface DeliveryOptions {
  deliveryMode: DeliveryMode
  deliveryFlatFee?: number
  deliveryRatePerKm?: number
  deliveryRadiusKm?: number
  deliveryNotes?: string
  pickupAddress?: string
  pickupInstructions?: string
}

export interface DeliveryFeeResult {
  fee: number
  distanceKm: number
  calculationMethod: 'flat' | 'per_km' | 'combined'
  breakdown: {
    flatFee: number
    distanceFee: number
  }
}

// ============================================
// DELIVERY FEE CALCULATION
// ============================================

/**
 * Calculate delivery fee based on listing settings and distance
 */
export function calculateDeliveryFee(
  deliveryFlatFee: number | null | undefined,
  deliveryRatePerKm: number | null | undefined,
  distanceKm: number
): DeliveryFeeResult {
  const flatFee = deliveryFlatFee || 0
  const ratePerKm = deliveryRatePerKm || 0
  const distanceFee = Math.round(ratePerKm * distanceKm * 100) / 100

  let calculationMethod: 'flat' | 'per_km' | 'combined' = 'flat'
  if (flatFee > 0 && ratePerKm > 0) {
    calculationMethod = 'combined'
  } else if (ratePerKm > 0) {
    calculationMethod = 'per_km'
  }

  return {
    fee: Math.round((flatFee + distanceFee) * 100) / 100,
    distanceKm,
    calculationMethod,
    breakdown: {
      flatFee,
      distanceFee,
    },
  }
}

/**
 * Validate if delivery address is within radius
 */
export function validateDeliveryAddress(
  deliveryRadiusKm: number | null | undefined,
  distanceKm: number
): { isValid: boolean; reason?: string } {
  if (!deliveryRadiusKm) {
    // No radius limit
    return { isValid: true }
  }

  if (distanceKm > deliveryRadiusKm) {
    return {
      isValid: false,
      reason: `Delivery address is ${distanceKm}km away, but maximum delivery radius is ${deliveryRadiusKm}km`,
    }
  }

  return { isValid: true }
}

/**
 * Get delivery options for a listing
 */
export async function getDeliveryOptions(listingId: string): Promise<DeliveryOptions | null> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      deliveryMode: true,
      deliveryFlatFee: true,
      deliveryRatePerKm: true,
      deliveryRadiusKm: true,
      deliveryNotes: true,
      pickupAddress: true,
      pickupInstructions: true,
    },
  })

  if (!listing) {
    return null
  }

  return {
    deliveryMode: listing.deliveryMode as DeliveryMode,
    deliveryFlatFee: listing.deliveryFlatFee ? Number(listing.deliveryFlatFee) : undefined,
    deliveryRatePerKm: listing.deliveryRatePerKm ? Number(listing.deliveryRatePerKm) : undefined,
    deliveryRadiusKm: listing.deliveryRadiusKm || undefined,
    deliveryNotes: listing.deliveryNotes || undefined,
    pickupAddress: listing.pickupAddress || undefined,
    pickupInstructions: listing.pickupInstructions || undefined,
  }
}

/**
 * Update delivery options for a listing
 */
export async function updateListingDeliveryOptions(
  listingId: string,
  ownerId: string,
  options: Partial<DeliveryOptions>
) {
  // Verify ownership
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { ownerId: true },
  })

  if (!listing) {
    throw new Error('Listing not found')
  }

  if (listing.ownerId !== ownerId) {
    throw new Error('Not authorized to modify this listing')
  }

  // Validate delivery mode requirements
  if (options.deliveryMode === 'DELIVERY_ONLY' || options.deliveryMode === 'PICKUP_OR_DELIVERY') {
    if (!options.deliveryFlatFee && !options.deliveryRatePerKm) {
      throw new Error('Delivery fee (flat or per km) is required when delivery is enabled')
    }
  }

  const updated = await prisma.listing.update({
    where: { id: listingId },
    data: {
      deliveryMode: options.deliveryMode,
      deliveryFlatFee: options.deliveryFlatFee,
      deliveryRatePerKm: options.deliveryRatePerKm,
      deliveryRadiusKm: options.deliveryRadiusKm,
      deliveryNotes: options.deliveryNotes,
      pickupAddress: options.pickupAddress,
      pickupInstructions: options.pickupInstructions,
    },
    select: {
      id: true,
      deliveryMode: true,
      deliveryFlatFee: true,
      deliveryRatePerKm: true,
      deliveryRadiusKm: true,
      deliveryNotes: true,
      pickupAddress: true,
      pickupInstructions: true,
    },
  })

  return {
    deliveryMode: updated.deliveryMode as DeliveryMode,
    deliveryFlatFee: updated.deliveryFlatFee ? Number(updated.deliveryFlatFee) : undefined,
    deliveryRatePerKm: updated.deliveryRatePerKm ? Number(updated.deliveryRatePerKm) : undefined,
    deliveryRadiusKm: updated.deliveryRadiusKm || undefined,
    deliveryNotes: updated.deliveryNotes || undefined,
    pickupAddress: updated.pickupAddress || undefined,
    pickupInstructions: updated.pickupInstructions || undefined,
  }
}

/**
 * Calculate delivery quote for a booking
 */
export async function getDeliveryQuote(
  listingId: string,
  deliveryDistanceKm: number
): Promise<{
  available: boolean
  fee?: number
  breakdown?: DeliveryFeeResult
  reason?: string
}> {
  const options = await getDeliveryOptions(listingId)

  if (!options) {
    return { available: false, reason: 'Listing not found' }
  }

  if (options.deliveryMode === 'PICKUP_ONLY') {
    return { available: false, reason: 'This listing is pickup only' }
  }

  // Validate distance
  const validation = validateDeliveryAddress(options.deliveryRadiusKm, deliveryDistanceKm)
  if (!validation.isValid) {
    return { available: false, reason: validation.reason }
  }

  // Calculate fee
  const feeResult = calculateDeliveryFee(
    options.deliveryFlatFee,
    options.deliveryRatePerKm,
    deliveryDistanceKm
  )

  return {
    available: true,
    fee: feeResult.fee,
    breakdown: feeResult,
  }
}
