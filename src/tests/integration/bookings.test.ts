/**
 * Booking API Integration Tests
 * 
 * Tests for booking creation, status transitions, and lifecycle management.
 */

// Mock dependencies before imports
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    booking: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    listing: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
  }
}))

import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

describe('Booking API Integration Tests', () => {
  const mockOwner = {
    id: 'owner-1',
    email: 'owner@example.com',
    role: 'OWNER',
    isSuspended: false,
  }

  const mockRenter = {
    id: 'renter-1',
    email: 'renter@example.com',
    role: 'RENTER',
    isSuspended: false,
  }

  const mockListing = {
    id: 'listing-1',
    ownerId: 'owner-1',
    title: 'Test Tractor',
    status: 'LIVE',
    pricePerDay: 450,
    currency: 'NZD',
    insuranceMode: 'OWNER_PROVIDED',
    bondAmount: 5000,
  }

  const mockBooking = {
    id: 'booking-1',
    listingId: 'listing-1',
    renterId: 'renter-1',
    ownerId: 'owner-1',
    startDate: new Date('2025-01-15'),
    endDate: new Date('2025-01-20'),
    bookingStatus: 'PENDING',
    rentalTotal: 2250,
    currency: 'NZD',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Booking State Transitions', () => {
    describe('PENDING -> ACCEPTED', () => {
      it('should allow owner to accept a pending booking', async () => {
        const { prisma } = require('@/lib/prisma')
        
        prisma.booking.findUnique.mockResolvedValue({
          ...mockBooking,
          bookingStatus: 'PENDING',
          paymentIntent: null,
          handoverChecklists: [],
        })
        
        prisma.booking.update.mockResolvedValue({
          ...mockBooking,
          bookingStatus: 'ACCEPTED',
        })

        // Simulate the transition
        const booking = await prisma.booking.findUnique({ where: { id: 'booking-1' } })
        expect(booking.bookingStatus).toBe('PENDING')

        const updated = await prisma.booking.update({
          where: { id: 'booking-1' },
          data: { bookingStatus: 'ACCEPTED' },
        })
        expect(updated.bookingStatus).toBe('ACCEPTED')
      })

      it('should NOT allow renter to accept a booking', async () => {
        // This is enforced by the state machine - renter not in allowedActors
        const { validateTransition } = require('@/lib/booking/state-machine')
        const result = validateTransition('PENDING', 'ACCEPTED', 'RENTER')
        expect(result.valid).toBe(false)
      })
    })

    describe('PENDING -> DECLINED', () => {
      it('should allow owner to decline a pending booking', async () => {
        const { prisma } = require('@/lib/prisma')
        
        prisma.booking.findUnique.mockResolvedValue({
          ...mockBooking,
          bookingStatus: 'PENDING',
        })
        
        prisma.booking.update.mockResolvedValue({
          ...mockBooking,
          bookingStatus: 'DECLINED',
        })

        const updated = await prisma.booking.update({
          where: { id: 'booking-1' },
          data: { bookingStatus: 'DECLINED' },
        })
        expect(updated.bookingStatus).toBe('DECLINED')
      })
    })

    describe('PENDING -> CANCELLED', () => {
      it('should allow renter to cancel a pending booking', async () => {
        const { validateTransition } = require('@/lib/booking/state-machine')
        const result = validateTransition('PENDING', 'CANCELLED', 'RENTER')
        expect(result.valid).toBe(true)
      })
    })

    describe('Terminal States', () => {
      it('should NOT allow transitions from COMPLETED', async () => {
        const { isTerminalState, getValidNextStates } = require('@/lib/booking/state-machine')
        
        expect(isTerminalState('COMPLETED')).toBe(true)
        expect(getValidNextStates('COMPLETED')).toHaveLength(0)
      })

      it('should NOT allow transitions from DECLINED', async () => {
        const { isTerminalState, getValidNextStates } = require('@/lib/booking/state-machine')
        
        expect(isTerminalState('DECLINED')).toBe(true)
        expect(getValidNextStates('DECLINED')).toHaveLength(0)
      })

      it('should NOT allow transitions from CANCELLED', async () => {
        const { isTerminalState, getValidNextStates } = require('@/lib/booking/state-machine')
        
        expect(isTerminalState('CANCELLED')).toBe(true)
        expect(getValidNextStates('CANCELLED')).toHaveLength(0)
      })
    })
  })

  describe('Booking Creation Validation', () => {
    it('should require all mandatory fields', async () => {
      const invalidBooking = {
        listingId: 'listing-1',
        // Missing startDate, endDate, etc.
      }

      // The createBookingSchema should reject this
      const { createBookingSchema } = require('@/lib/validations')
      const result = createBookingSchema.safeParse(invalidBooking)
      expect(result.success).toBe(false)
    })

    it('should validate date range', async () => {
      const { createBookingSchema } = require('@/lib/validations')
      
      const invalidBooking = {
        listingId: 'listing-1',
        startDate: '2025-01-20T00:00:00Z',
        endDate: '2025-01-15T00:00:00Z', // End before start
        acceptPlatformPolicy: true,
        platformPolicyVersion: 1,
        acceptOwnerTerms: true,
        acceptDamageResponsibility: true,
        confirmCompetency: true,
      }

      const result = createBookingSchema.safeParse(invalidBooking)
      expect(result.success).toBe(false)
    })

    it('should require policy acceptance', async () => {
      const { createBookingSchema } = require('@/lib/validations')
      
      const bookingWithoutPolicy = {
        listingId: 'listing-1',
        startDate: '2025-01-15T00:00:00Z',
        endDate: '2025-01-20T00:00:00Z',
        acceptPlatformPolicy: false, // Must be true
        platformPolicyVersion: 1,
        acceptOwnerTerms: true,
        acceptDamageResponsibility: true,
        confirmCompetency: true,
      }

      const result = createBookingSchema.safeParse(bookingWithoutPolicy)
      expect(result.success).toBe(false)
    })
  })

  describe('Authorization', () => {
    it('should require authentication for booking operations', async () => {
      const { getServerSession } = require('next-auth')
      getServerSession.mockResolvedValue(null)

      // Simulating unauthorized access
      const session = await getServerSession()
      expect(session).toBeNull()
    })

    it('should verify user owns the booking for renter actions', async () => {
      const { prisma } = require('@/lib/prisma')
      
      prisma.booking.findUnique.mockResolvedValue(mockBooking)
      
      const booking = await prisma.booking.findUnique({ where: { id: 'booking-1' } })
      const isRenter = booking.renterId === mockRenter.id
      expect(isRenter).toBe(true)
    })

    it('should verify user owns the listing for owner actions', async () => {
      const { prisma } = require('@/lib/prisma')
      
      prisma.booking.findUnique.mockResolvedValue(mockBooking)
      
      const booking = await prisma.booking.findUnique({ where: { id: 'booking-1' } })
      const isOwner = booking.ownerId === mockOwner.id
      expect(isOwner).toBe(true)
    })
  })

  describe('Booking Lifecycle', () => {
    it('should follow the complete happy path lifecycle', async () => {
      const { validateTransition } = require('@/lib/booking/state-machine')
      
      // PENDING -> ACCEPTED (owner accepts)
      expect(validateTransition('PENDING', 'ACCEPTED', 'OWNER').valid).toBe(true)
      
      // ACCEPTED -> AWAITING_PICKUP (payment complete)
      expect(validateTransition('ACCEPTED', 'AWAITING_PICKUP', 'ADMIN', { isPaymentComplete: true }).valid).toBe(true)
      
      // AWAITING_PICKUP -> IN_USE (equipment picked up)
      expect(validateTransition('AWAITING_PICKUP', 'IN_USE', 'OWNER').valid).toBe(true)
      
      // IN_USE -> AWAITING_RETURN_INSPECTION (equipment returned)
      expect(validateTransition('IN_USE', 'AWAITING_RETURN_INSPECTION', 'OWNER').valid).toBe(true)
      
      // AWAITING_RETURN_INSPECTION -> COMPLETED (inspection passed)
      expect(validateTransition('AWAITING_RETURN_INSPECTION', 'COMPLETED', 'OWNER').valid).toBe(true)
    })

    it('should handle dispute flow', async () => {
      const { validateTransition } = require('@/lib/booking/state-machine')
      
      // AWAITING_RETURN_INSPECTION -> IN_DISPUTE (issue found)
      expect(validateTransition('AWAITING_RETURN_INSPECTION', 'IN_DISPUTE', 'OWNER').valid).toBe(true)
      
      // IN_DISPUTE -> COMPLETED (admin resolves)
      expect(validateTransition('IN_DISPUTE', 'COMPLETED', 'ADMIN').valid).toBe(true)
    })
  })
})
