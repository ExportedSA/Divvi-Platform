/**
 * Platform Fee Configuration
 * Central configuration for all platform fees
 */

// Platform service fee rate (1.5%)
export const PLATFORM_FEE_RATE = 0.015

// Fee display text
export const PLATFORM_FEE_DISPLAY = '1.5%'

// Fee description for UI
export const PLATFORM_FEE_DESCRIPTION = 'Platform service fee'

// Legal text for terms
export const PLATFORM_FEE_LEGAL_TEXT = `Lendit applies a ${PLATFORM_FEE_DISPLAY} service fee to all rentals, deducted from owner payouts.`

/**
 * Booking fee calculation result
 */
export interface BookingFeeBreakdown {
  // Input amounts
  rentalCost: number
  deliveryFee: number
  bondAmount: number
  
  // Calculated amounts
  rentalSubtotal: number      // rentalCost + deliveryFee
  platformFeeRate: number     // 0.015 (1.5%)
  platformFee: number         // rentalSubtotal * platformFeeRate
  ownerPayoutAmount: number   // rentalSubtotal - platformFee
  totalCharged: number        // rentalSubtotal + platformFee + bondAmount
  
  // For display
  platformFeePercent: string  // "1.5%"
}

/**
 * Calculate all fees for a booking
 * 
 * Formula:
 * - rentalSubtotal = rentalCost + deliveryFee
 * - platformFee = rentalSubtotal * PLATFORM_FEE_RATE
 * - ownerPayoutAmount = rentalSubtotal - platformFee
 * - totalCharged = rentalSubtotal + platformFee + bondAmount
 */
export function calculateBookingFees(
  rentalCost: number,
  deliveryFee: number = 0,
  bondAmount: number = 0
): BookingFeeBreakdown {
  // Calculate subtotal (rental + delivery)
  const rentalSubtotal = roundToTwoDecimals(rentalCost + deliveryFee)
  
  // Calculate platform fee (1.5% of subtotal)
  const platformFee = roundToTwoDecimals(rentalSubtotal * PLATFORM_FEE_RATE)
  
  // Calculate owner payout (subtotal minus platform fee)
  const ownerPayoutAmount = roundToTwoDecimals(rentalSubtotal - platformFee)
  
  // Calculate total charged to renter (subtotal + platform fee + bond)
  const totalCharged = roundToTwoDecimals(rentalSubtotal + platformFee + bondAmount)
  
  return {
    rentalCost,
    deliveryFee,
    bondAmount,
    rentalSubtotal,
    platformFeeRate: PLATFORM_FEE_RATE,
    platformFee,
    ownerPayoutAmount,
    totalCharged,
    platformFeePercent: PLATFORM_FEE_DISPLAY,
  }
}

/**
 * Round to 2 decimal places for currency
 */
function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Format currency for display
 */
export function formatFee(amount: number, currency: 'NZD' | 'AUD' = 'NZD'): string {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency,
  }).format(amount)
}

/**
 * Get fee breakdown text for display
 */
export function getFeeBreakdownText(breakdown: BookingFeeBreakdown, currency: 'NZD' | 'AUD' = 'NZD'): string[] {
  const lines: string[] = []
  
  lines.push(`Rental cost: ${formatFee(breakdown.rentalCost, currency)}`)
  
  if (breakdown.deliveryFee > 0) {
    lines.push(`Delivery fee: ${formatFee(breakdown.deliveryFee, currency)}`)
  }
  
  lines.push(`Subtotal: ${formatFee(breakdown.rentalSubtotal, currency)}`)
  lines.push(`Platform fee (${breakdown.platformFeePercent}): ${formatFee(breakdown.platformFee, currency)}`)
  
  if (breakdown.bondAmount > 0) {
    lines.push(`Security bond (authorised): ${formatFee(breakdown.bondAmount, currency)}`)
  }
  
  lines.push(`Total: ${formatFee(breakdown.totalCharged, currency)}`)
  
  return lines
}
