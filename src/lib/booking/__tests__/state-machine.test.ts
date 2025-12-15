/**
 * Booking State Machine Unit Tests
 * 
 * Tests for state transitions, validation, and business rules.
 */

import {
  BOOKING_STATES,
  TERMINAL_STATES,
  ACTIVE_STATES,
  isValidTransition,
  getTransition,
  getValidNextStates,
  canActorPerformTransition,
  validateTransition,
  isTerminalState,
  isActiveState,
  canBeCancelled,
  STATE_LABELS,
  createTransitionEvent,
} from '../state-machine'

describe('Booking State Machine', () => {
  describe('State Definitions', () => {
    it('should have all expected states defined', () => {
      expect(BOOKING_STATES).toContain('PENDING')
      expect(BOOKING_STATES).toContain('ACCEPTED')
      expect(BOOKING_STATES).toContain('DECLINED')
      expect(BOOKING_STATES).toContain('CANCELLED')
      expect(BOOKING_STATES).toContain('AWAITING_PICKUP')
      expect(BOOKING_STATES).toContain('IN_USE')
      expect(BOOKING_STATES).toContain('AWAITING_RETURN_INSPECTION')
      expect(BOOKING_STATES).toContain('IN_DISPUTE')
      expect(BOOKING_STATES).toContain('COMPLETED')
      expect(BOOKING_STATES).toHaveLength(9)
    })

    it('should have correct terminal states', () => {
      expect(TERMINAL_STATES).toContain('DECLINED')
      expect(TERMINAL_STATES).toContain('CANCELLED')
      expect(TERMINAL_STATES).toContain('COMPLETED')
      expect(TERMINAL_STATES).toHaveLength(3)
    })

    it('should have correct active states', () => {
      expect(ACTIVE_STATES).toContain('ACCEPTED')
      expect(ACTIVE_STATES).toContain('AWAITING_PICKUP')
      expect(ACTIVE_STATES).toContain('IN_USE')
      expect(ACTIVE_STATES).toContain('AWAITING_RETURN_INSPECTION')
      expect(ACTIVE_STATES).toContain('IN_DISPUTE')
      expect(ACTIVE_STATES).toHaveLength(5)
    })

    it('should have labels for all states', () => {
      BOOKING_STATES.forEach(state => {
        expect(STATE_LABELS[state]).toBeDefined()
        expect(typeof STATE_LABELS[state]).toBe('string')
      })
    })
  })

  describe('Valid Transitions', () => {
    describe('From PENDING', () => {
      it('should allow transition to ACCEPTED', () => {
        expect(isValidTransition('PENDING', 'ACCEPTED')).toBe(true)
      })

      it('should allow transition to DECLINED', () => {
        expect(isValidTransition('PENDING', 'DECLINED')).toBe(true)
      })

      it('should allow transition to CANCELLED', () => {
        expect(isValidTransition('PENDING', 'CANCELLED')).toBe(true)
      })

      it('should NOT allow direct transition to COMPLETED', () => {
        expect(isValidTransition('PENDING', 'COMPLETED')).toBe(false)
      })

      it('should NOT allow direct transition to IN_USE', () => {
        expect(isValidTransition('PENDING', 'IN_USE')).toBe(false)
      })
    })

    describe('From ACCEPTED', () => {
      it('should allow transition to AWAITING_PICKUP', () => {
        expect(isValidTransition('ACCEPTED', 'AWAITING_PICKUP')).toBe(true)
      })

      it('should allow transition to CANCELLED', () => {
        expect(isValidTransition('ACCEPTED', 'CANCELLED')).toBe(true)
      })

      it('should NOT allow transition back to PENDING', () => {
        expect(isValidTransition('ACCEPTED', 'PENDING')).toBe(false)
      })
    })

    describe('From AWAITING_PICKUP', () => {
      it('should allow transition to IN_USE', () => {
        expect(isValidTransition('AWAITING_PICKUP', 'IN_USE')).toBe(true)
      })

      it('should allow admin cancellation', () => {
        expect(isValidTransition('AWAITING_PICKUP', 'CANCELLED')).toBe(true)
      })
    })

    describe('From IN_USE', () => {
      it('should allow transition to AWAITING_RETURN_INSPECTION', () => {
        expect(isValidTransition('IN_USE', 'AWAITING_RETURN_INSPECTION')).toBe(true)
      })

      it('should NOT allow direct transition to COMPLETED', () => {
        expect(isValidTransition('IN_USE', 'COMPLETED')).toBe(false)
      })
    })

    describe('From AWAITING_RETURN_INSPECTION', () => {
      it('should allow transition to COMPLETED', () => {
        expect(isValidTransition('AWAITING_RETURN_INSPECTION', 'COMPLETED')).toBe(true)
      })

      it('should allow transition to IN_DISPUTE', () => {
        expect(isValidTransition('AWAITING_RETURN_INSPECTION', 'IN_DISPUTE')).toBe(true)
      })
    })

    describe('From IN_DISPUTE', () => {
      it('should allow transition to COMPLETED', () => {
        expect(isValidTransition('IN_DISPUTE', 'COMPLETED')).toBe(true)
      })

      it('should allow transition back to AWAITING_RETURN_INSPECTION', () => {
        expect(isValidTransition('IN_DISPUTE', 'AWAITING_RETURN_INSPECTION')).toBe(true)
      })
    })

    describe('Terminal States', () => {
      it('should NOT allow transitions from DECLINED', () => {
        BOOKING_STATES.forEach(state => {
          expect(isValidTransition('DECLINED', state)).toBe(false)
        })
      })

      it('should NOT allow transitions from CANCELLED', () => {
        BOOKING_STATES.forEach(state => {
          expect(isValidTransition('CANCELLED', state)).toBe(false)
        })
      })

      it('should NOT allow transitions from COMPLETED', () => {
        BOOKING_STATES.forEach(state => {
          expect(isValidTransition('COMPLETED', state)).toBe(false)
        })
      })
    })
  })

  describe('getTransition', () => {
    it('should return transition details for valid transitions', () => {
      const transition = getTransition('PENDING', 'ACCEPTED')
      expect(transition).not.toBeNull()
      expect(transition?.from).toBe('PENDING')
      expect(transition?.to).toBe('ACCEPTED')
      expect(transition?.allowedActors).toContain('OWNER')
    })

    it('should return null for invalid transitions', () => {
      const transition = getTransition('PENDING', 'COMPLETED')
      expect(transition).toBeNull()
    })
  })

  describe('getValidNextStates', () => {
    it('should return correct next states from PENDING', () => {
      const nextStates = getValidNextStates('PENDING')
      expect(nextStates).toContain('ACCEPTED')
      expect(nextStates).toContain('DECLINED')
      expect(nextStates).toContain('CANCELLED')
      expect(nextStates).toHaveLength(3)
    })

    it('should return empty array for terminal states', () => {
      expect(getValidNextStates('COMPLETED')).toHaveLength(0)
      expect(getValidNextStates('DECLINED')).toHaveLength(0)
      expect(getValidNextStates('CANCELLED')).toHaveLength(0)
    })
  })

  describe('Actor Permissions', () => {
    describe('canActorPerformTransition', () => {
      it('should allow OWNER to accept booking', () => {
        expect(canActorPerformTransition('PENDING', 'ACCEPTED', 'OWNER')).toBe(true)
      })

      it('should allow OWNER to decline booking', () => {
        expect(canActorPerformTransition('PENDING', 'DECLINED', 'OWNER')).toBe(true)
      })

      it('should allow RENTER to cancel pending booking', () => {
        expect(canActorPerformTransition('PENDING', 'CANCELLED', 'RENTER')).toBe(true)
      })

      it('should NOT allow RENTER to accept booking', () => {
        expect(canActorPerformTransition('PENDING', 'ACCEPTED', 'RENTER')).toBe(false)
      })

      it('should allow ADMIN to perform any valid transition', () => {
        expect(canActorPerformTransition('PENDING', 'ACCEPTED', 'ADMIN')).toBe(true)
        expect(canActorPerformTransition('PENDING', 'DECLINED', 'ADMIN')).toBe(true)
        expect(canActorPerformTransition('PENDING', 'CANCELLED', 'ADMIN')).toBe(true)
      })

      it('should only allow ADMIN to resolve disputes', () => {
        expect(canActorPerformTransition('IN_DISPUTE', 'COMPLETED', 'ADMIN')).toBe(true)
        expect(canActorPerformTransition('IN_DISPUTE', 'COMPLETED', 'OWNER')).toBe(false)
        expect(canActorPerformTransition('IN_DISPUTE', 'COMPLETED', 'RENTER')).toBe(false)
      })
    })
  })

  describe('validateTransition', () => {
    it('should return valid for allowed transitions', () => {
      const result = validateTransition('PENDING', 'ACCEPTED', 'OWNER')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
      expect(result.transition).toBeDefined()
    })

    it('should return invalid for disallowed transitions', () => {
      const result = validateTransition('PENDING', 'COMPLETED', 'OWNER')
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error).toContain('Invalid transition')
    })

    it('should return invalid when actor not allowed', () => {
      const result = validateTransition('PENDING', 'ACCEPTED', 'RENTER')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('not allowed')
    })

    it('should check payment requirement', () => {
      const result = validateTransition('ACCEPTED', 'AWAITING_PICKUP', 'ADMIN', {
        isPaymentComplete: false,
      })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('payment')
    })

    it('should pass when payment is complete', () => {
      const result = validateTransition('ACCEPTED', 'AWAITING_PICKUP', 'ADMIN', {
        isPaymentComplete: true,
      })
      expect(result.valid).toBe(true)
    })
  })

  describe('State Helpers', () => {
    describe('isTerminalState', () => {
      it('should return true for terminal states', () => {
        expect(isTerminalState('DECLINED')).toBe(true)
        expect(isTerminalState('CANCELLED')).toBe(true)
        expect(isTerminalState('COMPLETED')).toBe(true)
      })

      it('should return false for non-terminal states', () => {
        expect(isTerminalState('PENDING')).toBe(false)
        expect(isTerminalState('ACCEPTED')).toBe(false)
        expect(isTerminalState('IN_USE')).toBe(false)
      })
    })

    describe('isActiveState', () => {
      it('should return true for active states', () => {
        expect(isActiveState('ACCEPTED')).toBe(true)
        expect(isActiveState('AWAITING_PICKUP')).toBe(true)
        expect(isActiveState('IN_USE')).toBe(true)
      })

      it('should return false for non-active states', () => {
        expect(isActiveState('PENDING')).toBe(false)
        expect(isActiveState('COMPLETED')).toBe(false)
      })
    })

    describe('canBeCancelled', () => {
      it('should allow renter to cancel PENDING booking', () => {
        expect(canBeCancelled('PENDING', 'RENTER')).toBe(true)
      })

      it('should allow owner to cancel ACCEPTED booking', () => {
        expect(canBeCancelled('ACCEPTED', 'OWNER')).toBe(true)
      })

      it('should NOT allow renter to cancel IN_USE booking', () => {
        expect(canBeCancelled('IN_USE', 'RENTER')).toBe(false)
      })

      it('should NOT allow cancellation of COMPLETED booking', () => {
        expect(canBeCancelled('COMPLETED', 'ADMIN')).toBe(false)
      })
    })
  })

  describe('createTransitionEvent', () => {
    it('should create a valid transition event', () => {
      const event = createTransitionEvent(
        'booking-123',
        'PENDING',
        'ACCEPTED',
        'user-456',
        'OWNER',
        'Accepted booking request'
      )

      expect(event.bookingId).toBe('booking-123')
      expect(event.from).toBe('PENDING')
      expect(event.to).toBe('ACCEPTED')
      expect(event.actorId).toBe('user-456')
      expect(event.actorRole).toBe('OWNER')
      expect(event.reason).toBe('Accepted booking request')
      expect(event.timestamp).toBeInstanceOf(Date)
    })

    it('should include metadata when provided', () => {
      const event = createTransitionEvent(
        'booking-123',
        'IN_USE',
        'AWAITING_RETURN_INSPECTION',
        'user-456',
        'OWNER',
        'Equipment returned',
        { engineHoursAtReturn: 150 }
      )

      expect(event.metadata).toEqual({ engineHoursAtReturn: 150 })
    })
  })
})
