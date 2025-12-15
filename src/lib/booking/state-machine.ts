/**
 * Booking Lifecycle State Machine
 * 
 * Defines valid booking states and transitions with server-side enforcement.
 * This is the single source of truth for booking status transitions.
 */

import { BookingStatus, UserRole } from '@prisma/client'

// =============================================================================
// STATE DEFINITIONS
// =============================================================================

/**
 * All valid booking statuses
 */
export const BOOKING_STATES = [
  'PENDING',
  'ACCEPTED',
  'DECLINED',
  'CANCELLED',
  'AWAITING_PICKUP',
  'IN_USE',
  'AWAITING_RETURN_INSPECTION',
  'IN_DISPUTE',
  'COMPLETED',
] as const

export type BookingState = typeof BOOKING_STATES[number]

/**
 * Terminal states - bookings in these states cannot transition further
 */
export const TERMINAL_STATES: BookingState[] = [
  'DECLINED',
  'CANCELLED',
  'COMPLETED',
]

/**
 * Active states - bookings that are "in progress"
 */
export const ACTIVE_STATES: BookingState[] = [
  'ACCEPTED',
  'AWAITING_PICKUP',
  'IN_USE',
  'AWAITING_RETURN_INSPECTION',
  'IN_DISPUTE',
]

// =============================================================================
// TRANSITION DEFINITIONS
// =============================================================================

/**
 * Who can trigger each transition
 */
export type TransitionActor = 'RENTER' | 'OWNER' | 'ADMIN' | 'SYSTEM'

/**
 * Transition definition
 */
export interface StateTransition {
  from: BookingState
  to: BookingState
  allowedActors: TransitionActor[]
  requiresPayment?: boolean
  requiresInspection?: boolean
  description: string
}

/**
 * All valid state transitions
 * 
 * State Machine Diagram:
 * 
 *                    ┌─────────────┐
 *                    │   PENDING   │
 *                    └──────┬──────┘
 *                           │
 *          ┌────────────────┼────────────────┐
 *          │                │                │
 *          ▼                ▼                ▼
 *    ┌──────────┐    ┌──────────┐    ┌───────────┐
 *    │ DECLINED │    │ ACCEPTED │    │ CANCELLED │
 *    └──────────┘    └────┬─────┘    └───────────┘
 *                         │
 *                         ▼ (payment)
 *                ┌─────────────────┐
 *                │ AWAITING_PICKUP │◄────────────┐
 *                └────────┬────────┘             │
 *                         │                      │
 *                         ▼                      │
 *                    ┌─────────┐                 │
 *                    │  IN_USE │                 │
 *                    └────┬────┘                 │
 *                         │                      │
 *                         ▼                      │
 *          ┌──────────────────────────┐          │
 *          │ AWAITING_RETURN_INSPECTION│          │
 *          └────────────┬─────────────┘          │
 *                       │                        │
 *          ┌────────────┼────────────┐           │
 *          │            │            │           │
 *          ▼            ▼            ▼           │
 *    ┌───────────┐ ┌───────────┐ ┌──────────┐   │
 *    │ COMPLETED │ │IN_DISPUTE │ │CANCELLED │───┘
 *    └───────────┘ └─────┬─────┘ └──────────┘
 *                        │
 *                        ▼
 *                  ┌───────────┐
 *                  │ COMPLETED │
 *                  └───────────┘
 */
export const STATE_TRANSITIONS: StateTransition[] = [
  // From PENDING
  {
    from: 'PENDING',
    to: 'ACCEPTED',
    allowedActors: ['OWNER', 'ADMIN'],
    description: 'Owner accepts booking request',
  },
  {
    from: 'PENDING',
    to: 'DECLINED',
    allowedActors: ['OWNER', 'ADMIN'],
    description: 'Owner declines booking request',
  },
  {
    from: 'PENDING',
    to: 'CANCELLED',
    allowedActors: ['RENTER', 'ADMIN'],
    description: 'Renter cancels pending request',
  },
  
  // From ACCEPTED
  {
    from: 'ACCEPTED',
    to: 'AWAITING_PICKUP',
    allowedActors: ['SYSTEM', 'ADMIN'],
    requiresPayment: true,
    description: 'Payment confirmed, ready for pickup',
  },
  {
    from: 'ACCEPTED',
    to: 'CANCELLED',
    allowedActors: ['RENTER', 'OWNER', 'ADMIN'],
    description: 'Booking cancelled before payment',
  },
  
  // From AWAITING_PICKUP
  {
    from: 'AWAITING_PICKUP',
    to: 'IN_USE',
    allowedActors: ['OWNER', 'ADMIN'],
    description: 'Equipment picked up, rental started',
  },
  {
    from: 'AWAITING_PICKUP',
    to: 'CANCELLED',
    allowedActors: ['ADMIN'],
    description: 'Admin cancels after payment (requires refund)',
  },
  
  // From IN_USE
  {
    from: 'IN_USE',
    to: 'AWAITING_RETURN_INSPECTION',
    allowedActors: ['OWNER', 'RENTER', 'ADMIN'],
    description: 'Equipment returned, pending inspection',
  },
  
  // From AWAITING_RETURN_INSPECTION
  {
    from: 'AWAITING_RETURN_INSPECTION',
    to: 'COMPLETED',
    allowedActors: ['OWNER', 'ADMIN'],
    requiresInspection: true,
    description: 'Inspection passed, rental completed',
  },
  {
    from: 'AWAITING_RETURN_INSPECTION',
    to: 'IN_DISPUTE',
    allowedActors: ['OWNER', 'RENTER', 'ADMIN'],
    description: 'Dispute raised during inspection',
  },
  
  // From IN_DISPUTE
  {
    from: 'IN_DISPUTE',
    to: 'COMPLETED',
    allowedActors: ['ADMIN'],
    description: 'Dispute resolved, rental completed',
  },
  {
    from: 'IN_DISPUTE',
    to: 'AWAITING_RETURN_INSPECTION',
    allowedActors: ['ADMIN'],
    description: 'Dispute withdrawn, back to inspection',
  },
]

// =============================================================================
// TRANSITION VALIDATION
// =============================================================================

/**
 * Build a lookup map for fast transition validation
 */
const transitionMap = new Map<string, StateTransition>()
for (const transition of STATE_TRANSITIONS) {
  const key = `${transition.from}->${transition.to}`
  transitionMap.set(key, transition)
}

/**
 * Check if a transition is valid
 */
export function isValidTransition(
  from: BookingState,
  to: BookingState
): boolean {
  const key = `${from}->${to}`
  return transitionMap.has(key)
}

/**
 * Get transition details if valid
 */
export function getTransition(
  from: BookingState,
  to: BookingState
): StateTransition | null {
  const key = `${from}->${to}`
  return transitionMap.get(key) || null
}

/**
 * Get all valid next states from current state
 */
export function getValidNextStates(currentState: BookingState): BookingState[] {
  return STATE_TRANSITIONS
    .filter(t => t.from === currentState)
    .map(t => t.to)
}

/**
 * Check if an actor can perform a transition
 */
export function canActorPerformTransition(
  from: BookingState,
  to: BookingState,
  actorRole: UserRole | 'SYSTEM'
): boolean {
  const transition = getTransition(from, to)
  if (!transition) return false
  
  // Map UserRole to TransitionActor
  const actor: TransitionActor = actorRole === 'SYSTEM' ? 'SYSTEM' : actorRole
  
  return transition.allowedActors.includes(actor)
}

/**
 * Validation result type
 */
export interface TransitionValidationResult {
  valid: boolean
  error?: string
  transition?: StateTransition
}

/**
 * Validate a state transition with full context
 */
export function validateTransition(
  from: BookingState,
  to: BookingState,
  actorRole: UserRole | 'SYSTEM',
  context?: {
    isPaymentComplete?: boolean
    isInspectionComplete?: boolean
    isOwner?: boolean
    isRenter?: boolean
  }
): TransitionValidationResult {
  // Check if transition exists
  const transition = getTransition(from, to)
  if (!transition) {
    return {
      valid: false,
      error: `Invalid transition: ${from} -> ${to}. Allowed transitions from ${from}: ${getValidNextStates(from).join(', ') || 'none'}`,
    }
  }
  
  // Check if actor is allowed
  const actor: TransitionActor = actorRole === 'SYSTEM' ? 'SYSTEM' : actorRole
  if (!transition.allowedActors.includes(actor)) {
    return {
      valid: false,
      error: `${actor} is not allowed to perform transition ${from} -> ${to}. Allowed: ${transition.allowedActors.join(', ')}`,
    }
  }
  
  // Check payment requirement
  if (transition.requiresPayment && context && !context.isPaymentComplete) {
    return {
      valid: false,
      error: `Transition ${from} -> ${to} requires payment to be complete`,
    }
  }
  
  // Check inspection requirement
  if (transition.requiresInspection && context && !context.isInspectionComplete) {
    return {
      valid: false,
      error: `Transition ${from} -> ${to} requires inspection to be complete`,
    }
  }
  
  return {
    valid: true,
    transition,
  }
}

// =============================================================================
// STATE HELPERS
// =============================================================================

/**
 * Check if booking is in a terminal state
 */
export function isTerminalState(state: BookingState): boolean {
  return TERMINAL_STATES.includes(state)
}

/**
 * Check if booking is active (in progress)
 */
export function isActiveState(state: BookingState): boolean {
  return ACTIVE_STATES.includes(state)
}

/**
 * Check if booking can be cancelled
 */
export function canBeCancelled(
  state: BookingState,
  actorRole: UserRole
): boolean {
  return canActorPerformTransition(state, 'CANCELLED', actorRole)
}

/**
 * Get human-readable state label
 */
export const STATE_LABELS: Record<BookingState, string> = {
  PENDING: 'Pending Approval',
  ACCEPTED: 'Accepted - Awaiting Payment',
  DECLINED: 'Declined',
  CANCELLED: 'Cancelled',
  AWAITING_PICKUP: 'Ready for Pickup',
  IN_USE: 'In Use',
  AWAITING_RETURN_INSPECTION: 'Returned - Pending Inspection',
  IN_DISPUTE: 'In Dispute',
  COMPLETED: 'Completed',
}

/**
 * Get state color for UI
 */
export const STATE_COLORS: Record<BookingState, string> = {
  PENDING: 'yellow',
  ACCEPTED: 'blue',
  DECLINED: 'red',
  CANCELLED: 'gray',
  AWAITING_PICKUP: 'purple',
  IN_USE: 'green',
  AWAITING_RETURN_INSPECTION: 'orange',
  IN_DISPUTE: 'red',
  COMPLETED: 'green',
}

// =============================================================================
// TRANSITION HISTORY
// =============================================================================

/**
 * Transition event for audit logging
 */
export interface TransitionEvent {
  bookingId: string
  from: BookingState
  to: BookingState
  actorId: string
  actorRole: UserRole | 'SYSTEM'
  timestamp: Date
  reason?: string
  metadata?: Record<string, unknown>
}

/**
 * Create a transition event for logging
 */
export function createTransitionEvent(
  bookingId: string,
  from: BookingState,
  to: BookingState,
  actorId: string,
  actorRole: UserRole | 'SYSTEM',
  reason?: string,
  metadata?: Record<string, unknown>
): TransitionEvent {
  return {
    bookingId,
    from,
    to,
    actorId,
    actorRole,
    timestamp: new Date(),
    reason,
    metadata,
  }
}
