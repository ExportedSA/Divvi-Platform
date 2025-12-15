/**
 * Unit Tests for Fee Configuration
 * Tests fee calculation scenarios for various pricing models
 */

import {
  PLATFORM_FEE_RATE,
  PLATFORM_FEE_DISPLAY,
  calculateBookingFees,
  formatFee,
  type BookingFeeBreakdown,
} from '../fee-config'

describe('Fee Configuration', () => {
  describe('Constants', () => {
    it('should have correct platform fee rate', () => {
      expect(PLATFORM_FEE_RATE).toBe(0.015)
    })

    it('should have correct display string', () => {
      expect(PLATFORM_FEE_DISPLAY).toBe('1.5%')
    })
  })

  describe('calculateBookingFees', () => {
    it('should calculate fees for simple rental', () => {
      const result = calculateBookingFees(100, 0, 0)

      expect(result.rentalCost).toBe(100)
      expect(result.deliveryFee).toBe(0)
      expect(result.bondAmount).toBe(0)
      expect(result.rentalSubtotal).toBe(100)
      expect(result.platformFeeRate).toBe(0.015)
      expect(result.platformFee).toBe(1.5)
      expect(result.ownerPayoutAmount).toBe(98.5)
      expect(result.totalCharged).toBe(101.5)
      expect(result.platformFeePercent).toBe('1.5%')
    })

    it('should calculate fees with delivery', () => {
      const result = calculateBookingFees(500, 50, 0)

      expect(result.rentalCost).toBe(500)
      expect(result.deliveryFee).toBe(50)
      expect(result.rentalSubtotal).toBe(550)
      expect(result.platformFee).toBe(8.25) // 550 * 0.015
      expect(result.ownerPayoutAmount).toBe(541.75) // 550 - 8.25
      expect(result.totalCharged).toBe(558.25) // 550 + 8.25
    })

    it('should calculate fees with bond', () => {
      const result = calculateBookingFees(500, 0, 200)

      expect(result.rentalCost).toBe(500)
      expect(result.bondAmount).toBe(200)
      expect(result.rentalSubtotal).toBe(500)
      expect(result.platformFee).toBe(7.5) // 500 * 0.015
      expect(result.ownerPayoutAmount).toBe(492.5) // 500 - 7.5
      expect(result.totalCharged).toBe(707.5) // 500 + 7.5 + 200
    })

    it('should calculate fees with delivery and bond', () => {
      const result = calculateBookingFees(500, 50, 200)

      expect(result.rentalCost).toBe(500)
      expect(result.deliveryFee).toBe(50)
      expect(result.bondAmount).toBe(200)
      expect(result.rentalSubtotal).toBe(550)
      expect(result.platformFee).toBe(8.25) // 550 * 0.015
      expect(result.ownerPayoutAmount).toBe(541.75) // 550 - 8.25
      expect(result.totalCharged).toBe(758.25) // 550 + 8.25 + 200
    })

    it('should handle large rental amounts', () => {
      const result = calculateBookingFees(10000, 500, 2000)

      expect(result.rentalSubtotal).toBe(10500)
      expect(result.platformFee).toBe(157.5) // 10500 * 0.015
      expect(result.ownerPayoutAmount).toBe(10342.5) // 10500 - 157.5
      expect(result.totalCharged).toBe(12657.5) // 10500 + 157.5 + 2000
    })

    it('should handle small rental amounts', () => {
      const result = calculateBookingFees(50, 0, 0)

      expect(result.platformFee).toBe(0.75) // 50 * 0.015
      expect(result.ownerPayoutAmount).toBe(49.25)
      expect(result.totalCharged).toBe(50.75)
    })

    it('should round to 2 decimal places', () => {
      // 333 * 0.015 = 4.995, should round to 5.00
      const result = calculateBookingFees(333, 0, 0)

      expect(result.platformFee).toBe(5) // Rounded
      expect(result.ownerPayoutAmount).toBe(328) // 333 - 5
      expect(result.totalCharged).toBe(338) // 333 + 5
    })

    it('should handle zero rental amount', () => {
      const result = calculateBookingFees(0, 0, 0)

      expect(result.rentalSubtotal).toBe(0)
      expect(result.platformFee).toBe(0)
      expect(result.ownerPayoutAmount).toBe(0)
      expect(result.totalCharged).toBe(0)
    })

    it('should handle delivery-only scenario', () => {
      const result = calculateBookingFees(0, 100, 0)

      expect(result.rentalSubtotal).toBe(100)
      expect(result.platformFee).toBe(1.5)
      expect(result.ownerPayoutAmount).toBe(98.5)
      expect(result.totalCharged).toBe(101.5)
    })
  })

  describe('formatFee', () => {
    it('should format NZD correctly', () => {
      expect(formatFee(100, 'NZD')).toMatch(/\$100\.00/)
    })

    it('should format AUD correctly', () => {
      expect(formatFee(100, 'AUD')).toMatch(/\$100\.00/)
    })

    it('should handle decimal amounts', () => {
      expect(formatFee(99.99, 'NZD')).toMatch(/\$99\.99/)
    })

    it('should handle large amounts', () => {
      expect(formatFee(10000, 'NZD')).toMatch(/10,000\.00/)
    })
  })

  describe('Fee Verification', () => {
    it('should verify owner always receives rental minus fee', () => {
      const testCases = [
        { rental: 100, delivery: 0 },
        { rental: 500, delivery: 50 },
        { rental: 1000, delivery: 100 },
        { rental: 5000, delivery: 200 },
      ]

      for (const tc of testCases) {
        const result = calculateBookingFees(tc.rental, tc.delivery, 0)
        const expectedOwnerAmount = result.rentalSubtotal - result.platformFee

        expect(result.ownerPayoutAmount).toBe(expectedOwnerAmount)
      }
    })

    it('should verify total charged equals subtotal + fee + bond', () => {
      const testCases = [
        { rental: 100, delivery: 0, bond: 50 },
        { rental: 500, delivery: 50, bond: 200 },
        { rental: 1000, delivery: 100, bond: 500 },
      ]

      for (const tc of testCases) {
        const result = calculateBookingFees(tc.rental, tc.delivery, tc.bond)
        const expectedTotal = result.rentalSubtotal + result.platformFee + result.bondAmount

        expect(result.totalCharged).toBe(expectedTotal)
      }
    })

    it('should verify platform fee is exactly 1.5% of subtotal', () => {
      const testCases = [100, 200, 500, 1000, 2500, 5000, 10000]

      for (const rental of testCases) {
        const result = calculateBookingFees(rental, 0, 0)
        const expectedFee = Math.round(rental * 0.015 * 100) / 100

        expect(result.platformFee).toBe(expectedFee)
      }
    })
  })
})
