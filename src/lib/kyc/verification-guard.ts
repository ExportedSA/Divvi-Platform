/**
 * Verification Guard
 * 
 * Middleware and utilities for restricting routes based on KYC status.
 */

import { prisma } from '@/lib/prisma'
import { VerificationStatus } from '@prisma/client'

// =============================================================================
// TYPES
// =============================================================================

export interface VerificationCheck {
  isVerified: boolean
  status: VerificationStatus
  canProceed: boolean
  reason?: string
}

export type RequiredVerificationLevel = 
  | 'none'           // No verification required
  | 'email'          // Email verified
  | 'identity'       // Driver licence or passport verified
  | 'business'       // Business documents verified (owners only)
  | 'full'           // All required documents verified

// =============================================================================
// ROUTE CONFIGURATION
// =============================================================================

/**
 * Routes that require specific verification levels
 */
export const PROTECTED_ROUTES: Record<string, RequiredVerificationLevel> = {
  // Booking routes - require identity verification
  '/api/bookings': 'identity',
  '/api/bookings/create': 'identity',
  '/bookings/new': 'identity',
  
  // Listing routes - require identity for owners
  '/api/listings/create': 'identity',
  '/listings/new': 'identity',
  '/listings/edit': 'identity',
  
  // Payment routes - require identity
  '/api/payments/create-intent': 'identity',
  '/api/payments/confirm': 'identity',
  
  // Payout routes - require business verification for owners
  '/api/payouts': 'business',
  '/api/payouts/onboarding': 'identity',
  
  // High-value operations
  '/api/listings/publish': 'identity',
}

/**
 * Routes that are completely blocked for unverified users
 */
export const BLOCKED_ROUTES_UNVERIFIED = [
  '/api/bookings',
  '/api/payments/create-intent',
  '/api/payouts',
]

// =============================================================================
// VERIFICATION CHECKS
// =============================================================================

/**
 * Check user's verification status
 */
export async function checkVerificationStatus(
  userId: string
): Promise<VerificationCheck> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      verificationStatus: true,
      isEmailVerified: true,
      driverLicenceVerified: true,
      businessVerified: true,
      isSuspended: true,
    },
  })

  if (!user) {
    return {
      isVerified: false,
      status: 'UNVERIFIED',
      canProceed: false,
      reason: 'User not found',
    }
  }

  if (user.isSuspended) {
    return {
      isVerified: false,
      status: user.verificationStatus,
      canProceed: false,
      reason: 'Account is suspended',
    }
  }

  const isVerified = user.verificationStatus === 'VERIFIED'

  return {
    isVerified,
    status: user.verificationStatus,
    canProceed: isVerified || user.driverLicenceVerified,
    reason: isVerified ? undefined : 'Verification required',
  }
}

/**
 * Check if user meets required verification level
 */
export async function meetsVerificationLevel(
  userId: string,
  requiredLevel: RequiredVerificationLevel
): Promise<{ meets: boolean; reason?: string }> {
  if (requiredLevel === 'none') {
    return { meets: true }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      verificationStatus: true,
      isEmailVerified: true,
      driverLicenceVerified: true,
      businessVerified: true,
      isSuspended: true,
    },
  })

  if (!user) {
    return { meets: false, reason: 'User not found' }
  }

  if (user.isSuspended) {
    return { meets: false, reason: 'Account is suspended' }
  }

  switch (requiredLevel) {
    case 'email':
      if (!user.isEmailVerified) {
        return { meets: false, reason: 'Email verification required' }
      }
      return { meets: true }

    case 'identity':
      if (!user.driverLicenceVerified && user.verificationStatus !== 'VERIFIED') {
        return { meets: false, reason: 'Identity verification required' }
      }
      return { meets: true }

    case 'business':
      if (user.role === 'OWNER' && !user.businessVerified) {
        return { meets: false, reason: 'Business verification required' }
      }
      // Non-owners don't need business verification
      if (user.role !== 'OWNER') {
        return { meets: true }
      }
      return { meets: user.businessVerified }

    case 'full':
      if (user.verificationStatus !== 'VERIFIED') {
        return { meets: false, reason: 'Full verification required' }
      }
      if (user.role === 'OWNER' && !user.businessVerified) {
        return { meets: false, reason: 'Business verification required' }
      }
      return { meets: true }

    default:
      return { meets: false, reason: 'Unknown verification level' }
  }
}

/**
 * Get required verification level for a route
 */
export function getRequiredVerificationLevel(
  pathname: string
): RequiredVerificationLevel {
  // Check exact match first
  if (PROTECTED_ROUTES[pathname]) {
    return PROTECTED_ROUTES[pathname]
  }

  // Check prefix matches
  for (const [route, level] of Object.entries(PROTECTED_ROUTES)) {
    if (pathname.startsWith(route)) {
      return level
    }
  }

  return 'none'
}

/**
 * Check if route is blocked for unverified users
 */
export function isRouteBlockedForUnverified(pathname: string): boolean {
  return BLOCKED_ROUTES_UNVERIFIED.some(route => pathname.startsWith(route))
}

// =============================================================================
// GUARD FUNCTIONS
// =============================================================================

/**
 * Guard function for API routes
 * Returns error response if verification fails
 */
export async function guardApiRoute(
  userId: string,
  pathname: string
): Promise<{ allowed: boolean; error?: string; statusCode?: number }> {
  const requiredLevel = getRequiredVerificationLevel(pathname)
  
  if (requiredLevel === 'none') {
    return { allowed: true }
  }

  const check = await meetsVerificationLevel(userId, requiredLevel)
  
  if (!check.meets) {
    // Determine appropriate status code
    const statusCode = isRouteBlockedForUnverified(pathname) ? 403 : 400
    
    return {
      allowed: false,
      error: check.reason || 'Verification required',
      statusCode,
    }
  }

  return { allowed: true }
}

/**
 * Get verification requirements for a user
 */
export async function getVerificationRequirements(
  userId: string
): Promise<{
  required: RequiredVerificationLevel[]
  completed: RequiredVerificationLevel[]
  pending: RequiredVerificationLevel[]
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      isEmailVerified: true,
      driverLicenceVerified: true,
      businessVerified: true,
      verificationStatus: true,
    },
  })

  if (!user) {
    return { required: [], completed: [], pending: [] }
  }

  const required: RequiredVerificationLevel[] = ['email', 'identity']
  if (user.role === 'OWNER') {
    required.push('business')
  }

  const completed: RequiredVerificationLevel[] = []
  const pending: RequiredVerificationLevel[] = []

  if (user.isEmailVerified) {
    completed.push('email')
  } else {
    pending.push('email')
  }

  if (user.driverLicenceVerified || user.verificationStatus === 'VERIFIED') {
    completed.push('identity')
  } else {
    pending.push('identity')
  }

  if (user.role === 'OWNER') {
    if (user.businessVerified) {
      completed.push('business')
    } else {
      pending.push('business')
    }
  }

  if (completed.length === required.length) {
    completed.push('full')
  }

  return { required, completed, pending }
}
