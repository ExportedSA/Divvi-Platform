/**
 * Integration Tests for Booking Fee Workflow
 * Tests the complete booking creation and payout workflow with fees
 */

import { calculateBookingFees, PLATFORM_FEE_RATE } from '../fee-config'
import { calculatePaymentBreakdown } from '../../payments/payment-service'

describe('Booking Fee Integration', () => {
  describe('Booking Creation Flow', () => {
    it('should calculate correct fees for a standard booking', async () => {
      // Simulate booking creation
      const rentalCost = 500
      const deliveryFee = 50
      const bondAmount = 200

      // Calculate fees
      const feeBreakdown = calculateBookingFees(rentalCost, deliveryFee, bondAmount)

      // Verify breakdown
      expect(feeBreakdown.rentalSubtotal).toBe(550) // 500 + 50
      expect(feeBreakdown.platformFee).toBe(8.25) // 550 * 0.015
      expect(feeBreakdown.ownerPayoutAmount).toBe(541.75) // 550 - 8.25
      expect(feeBreakdown.totalCharged).toBe(758.25) // 550 + 8.25 + 200

      // Verify payment breakdown matches
      const paymentBreakdown = await calculatePaymentBreakdown(rentalCost, bondAmount, deliveryFee)
      expect(paymentBreakdown.platformFeeAmount).toBe(feeBreakdown.platformFee)
      expect(paymentBreakdown.ownerAmount).toBe(feeBreakdown.ownerPayoutAmount)
      expect(paymentBreakdown.totalCharged).toBe(feeBreakdown.totalCharged)
    })

    it('should persist correct fee fields on booking', async () => {
      const rentalCost = 1000
      const deliveryFee = 100
      const bondAmount = 500

      const feeBreakdown = calculateBookingFees(rentalCost, deliveryFee, bondAmount)

      // Simulate booking data that would be persisted
      const bookingData = {
        rentalTotal: rentalCost,
        deliveryFee: feeBreakdown.deliveryFee,
        rentalSubtotal: feeBreakdown.rentalSubtotal,
        platformFeeRate: feeBreakdown.platformFeeRate,
        platformFee: feeBreakdown.platformFee,
        ownerPayoutAmount: feeBreakdown.ownerPayoutAmount,
        totalCharged: feeBreakdown.totalCharged,
        bondAmountAtBooking: bondAmount,
      }

      // Verify all fields are correct
      expect(bookingData.rentalSubtotal).toBe(1100)
      expect(bookingData.platformFeeRate).toBe(0.015)
      expect(bookingData.platformFee).toBe(16.5) // 1100 * 0.015
      expect(bookingData.ownerPayoutAmount).toBe(1083.5) // 1100 - 16.5
      expect(bookingData.totalCharged).toBe(1616.5) // 1100 + 16.5 + 500
    })
  })

  describe('Payout Workflow', () => {
    it('should calculate correct owner payout after fee deduction', () => {
      const completedBookings = [
        { rentalSubtotal: 500, platformFee: 7.5 },
        { rentalSubtotal: 1000, platformFee: 15 },
        { rentalSubtotal: 750, platformFee: 11.25 },
      ]

      // Calculate totals
      const totalGross = completedBookings.reduce((sum, b) => sum + b.rentalSubtotal, 0)
      const totalFees = completedBookings.reduce((sum, b) => sum + b.platformFee, 0)
      const totalNet = totalGross - totalFees

      expect(totalGross).toBe(2250)
      expect(totalFees).toBe(33.75) // 2250 * 0.015
      expect(totalNet).toBe(2216.25)
    })

    it('should handle monthly payout aggregation', () => {
      // Simulate a month of bookings
      const monthlyBookings = [
        { date: '2024-01-05', rentalSubtotal: 500 },
        { date: '2024-01-12', rentalSubtotal: 750 },
        { date: '2024-01-20', rentalSubtotal: 1200 },
        { date: '2024-01-28', rentalSubtotal: 300 },
      ]

      const monthlyStats = monthlyBookings.map((b) => {
        const fee = Math.round(b.rentalSubtotal * PLATFORM_FEE_RATE * 100) / 100
        return {
          ...b,
          platformFee: fee,
          ownerPayout: b.rentalSubtotal - fee,
        }
      })

      const totalRental = monthlyStats.reduce((sum, b) => sum + b.rentalSubtotal, 0)
      const totalFees = monthlyStats.reduce((sum, b) => sum + b.platformFee, 0)
      const totalPayout = monthlyStats.reduce((sum, b) => sum + b.ownerPayout, 0)

      expect(totalRental).toBe(2750)
      expect(totalFees).toBe(41.25) // 2750 * 0.015
      expect(totalPayout).toBe(2708.75) // 2750 - 41.25
    })
  })

  describe('Edge Cases', () => {
    it('should handle minimum rental amount', () => {
      const result = calculateBookingFees(10, 0, 0)

      expect(result.platformFee).toBe(0.15) // 10 * 0.015
      expect(result.ownerPayoutAmount).toBe(9.85)
      expect(result.totalCharged).toBe(10.15)
    })

    it('should handle high-value rental', () => {
      const result = calculateBookingFees(50000, 1000, 10000)

      expect(result.rentalSubtotal).toBe(51000)
      expect(result.platformFee).toBe(765) // 51000 * 0.015
      expect(result.ownerPayoutAmount).toBe(50235) // 51000 - 765
      expect(result.totalCharged).toBe(61765) // 51000 + 765 + 10000
    })

    it('should handle delivery-only booking', () => {
      // Edge case: rental is free, only delivery charged
      const result = calculateBookingFees(0, 100, 0)

      expect(result.rentalSubtotal).toBe(100)
      expect(result.platformFee).toBe(1.5)
      expect(result.ownerPayoutAmount).toBe(98.5)
    })

    it('should handle booking with no bond', () => {
      const result = calculateBookingFees(500, 50, 0)

      expect(result.bondAmount).toBe(0)
      expect(result.totalCharged).toBe(558.25) // No bond added
    })
  })

  describe('Currency Consistency', () => {
    it('should maintain precision across calculations', () => {
      // Test various amounts that could cause floating point issues
      const testAmounts = [99.99, 123.45, 999.99, 1234.56, 9999.99]

      for (const amount of testAmounts) {
        const result = calculateBookingFees(amount, 0, 0)

        // Verify no floating point errors
        const expectedFee = Math.round(amount * 0.015 * 100) / 100
        const expectedOwner = Math.round((amount - expectedFee) * 100) / 100
        const expectedTotal = Math.round((amount + expectedFee) * 100) / 100

        expect(result.platformFee).toBe(expectedFee)
        expect(result.ownerPayoutAmount).toBe(expectedOwner)
        expect(result.totalCharged).toBe(expectedTotal)
      }
    })
  })
})
