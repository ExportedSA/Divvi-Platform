'use client'

import { formatFee, PLATFORM_FEE_DISPLAY } from '@/lib/fees'

interface BookingCostBreakdownProps {
  rentalCost: number
  deliveryFee?: number
  platformFee: number
  bondAmount?: number
  totalCharged: number
  currency?: 'NZD' | 'AUD'
  showOwnerPayout?: boolean
  ownerPayoutAmount?: number
  className?: string
}

/**
 * Booking cost breakdown component for checkout and confirmation screens
 */
export function BookingCostBreakdown({
  rentalCost,
  deliveryFee = 0,
  platformFee,
  bondAmount = 0,
  totalCharged,
  currency = 'NZD',
  showOwnerPayout = false,
  ownerPayoutAmount = 0,
  className = '',
}: BookingCostBreakdownProps) {
  const rentalSubtotal = rentalCost + deliveryFee

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Rental Cost */}
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Rental cost</span>
        <span className="font-medium">{formatFee(rentalCost, currency)}</span>
      </div>

      {/* Delivery Fee */}
      {deliveryFee > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Delivery fee</span>
          <span className="font-medium">{formatFee(deliveryFee, currency)}</span>
        </div>
      )}

      {/* Subtotal */}
      {deliveryFee > 0 && (
        <div className="flex justify-between text-sm border-t pt-2">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">{formatFee(rentalSubtotal, currency)}</span>
        </div>
      )}

      {/* Platform Fee */}
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">
          Platform service fee ({PLATFORM_FEE_DISPLAY})
        </span>
        <span className="font-medium">{formatFee(platformFee, currency)}</span>
      </div>

      {/* Bond */}
      {bondAmount > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            Security bond <span className="text-xs text-gray-400">(authorised, not charged)</span>
          </span>
          <span className="font-medium">{formatFee(bondAmount, currency)}</span>
        </div>
      )}

      {/* Total */}
      <div className="flex justify-between text-base font-semibold border-t pt-3 mt-3">
        <span>Total</span>
        <span className="text-lendit-green">{formatFee(totalCharged, currency)}</span>
      </div>

      {/* Owner Payout (for owner dashboard) */}
      {showOwnerPayout && ownerPayoutAmount > 0 && (
        <div className="bg-green-50 rounded-lg p-3 mt-4">
          <div className="flex justify-between text-sm">
            <span className="text-green-700">Your earnings (after platform fee)</span>
            <span className="font-semibold text-green-700">{formatFee(ownerPayoutAmount, currency)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default BookingCostBreakdown
