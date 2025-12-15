/**
 * Policy Service
 * Handles policy versioning and retrieval for booking and listing flows
 * 
 * Key principles:
 * - New bookings capture the current policy version at booking time
 * - Existing bookings retain their original version for audit (no retroactive overwrite)
 * - Policy version is immutable once stored in a booking
 */

import { prisma } from '@/lib/prisma'

// ============================================
// TYPES
// ============================================

export interface ActivePolicy {
  id: string
  slug: string
  version: number
  title: string
  shortSummary: string | null
  content: string
  publishedAt: Date
  updatedAt: Date
}

export interface PolicyVersionInfo {
  version: number
  title: string
  shortSummary: string | null
  publishedAt: Date
}

export interface PolicyValidation {
  isValid: boolean
  currentVersion: number
  providedVersion: number
  error?: string
}

// ============================================
// CONSTANTS
// ============================================

export const INSURANCE_POLICY_SLUG = 'insurance-and-damage-policy'
export const RENTER_RESPONSIBILITIES_SLUG = 'renter-responsibilities'
export const OWNER_RESPONSIBILITIES_SLUG = 'owner-responsibilities'

// Cache for policy lookups (simple in-memory cache)
let policyCache: { policy: ActivePolicy; cachedAt: number } | null = null
const CACHE_TTL_MS = 60 * 1000 // 1 minute cache

// ============================================
// MAIN FUNCTIONS
// ============================================

/**
 * Get the active (published) Insurance & Damage Policy
 * This is the primary helper for booking and listing flows
 * 
 * @returns The active policy with slug, version, title, shortSummary, and content
 * @throws Error if no published policy exists
 */
export async function getActiveInsurancePolicy(): Promise<ActivePolicy> {
  // Check cache first
  if (policyCache && Date.now() - policyCache.cachedAt < CACHE_TTL_MS) {
    return policyCache.policy
  }

  const policy = await prisma.staticPage.findFirst({
    where: {
      slug: INSURANCE_POLICY_SLUG,
      isPublished: true,
    },
    select: {
      id: true,
      slug: true,
      version: true,
      title: true,
      shortSummary: true,
      content: true,
      publishedAt: true,
      updatedAt: true,
    },
    orderBy: {
      version: 'desc', // Get highest version if multiple exist
    },
  })

  if (!policy) {
    throw new Error('Insurance & Damage Policy not found. Please ensure the policy is published.')
  }

  const activePolicy: ActivePolicy = {
    id: policy.id,
    slug: policy.slug,
    version: policy.version,
    title: policy.title,
    shortSummary: policy.shortSummary,
    content: policy.content,
    publishedAt: policy.publishedAt,
    updatedAt: policy.updatedAt,
  }

  // Update cache
  policyCache = {
    policy: activePolicy,
    cachedAt: Date.now(),
  }

  return activePolicy
}

/**
 * Get just the version info for the active policy (lightweight)
 * Useful for UI display without fetching full content
 */
export async function getActivePolicyVersion(): Promise<PolicyVersionInfo> {
  const policy = await getActiveInsurancePolicy()
  
  return {
    version: policy.version,
    title: policy.title,
    shortSummary: policy.shortSummary,
    publishedAt: policy.publishedAt,
  }
}

/**
 * Validate that a provided policy version matches the current active version
 * Used during booking creation to ensure renter accepted the current policy
 * 
 * @param providedVersion - The version the user claims to have accepted
 * @returns Validation result with current version info
 */
export async function validatePolicyVersion(providedVersion: number): Promise<PolicyValidation> {
  const policy = await getActiveInsurancePolicy()
  
  if (providedVersion !== policy.version) {
    return {
      isValid: false,
      currentVersion: policy.version,
      providedVersion,
      error: `Policy version mismatch. You accepted version ${providedVersion}, but the current version is ${policy.version}. Please review and accept the updated policy.`,
    }
  }

  return {
    isValid: true,
    currentVersion: policy.version,
    providedVersion,
  }
}

/**
 * Get policy data formatted for booking creation
 * Returns the data needed to store in the booking record
 */
export async function getPolicyDataForBooking(): Promise<{
  policyVersion: number
  policyTitle: string
  policySlug: string
}> {
  const policy = await getActiveInsurancePolicy()
  
  return {
    policyVersion: policy.version,
    policyTitle: policy.title,
    policySlug: policy.slug,
  }
}

/**
 * Get a specific policy by slug
 * Used for displaying policy pages
 */
export async function getPolicyBySlug(slug: string): Promise<ActivePolicy | null> {
  const policy = await prisma.staticPage.findFirst({
    where: {
      slug,
      isPublished: true,
    },
    select: {
      id: true,
      slug: true,
      version: true,
      title: true,
      shortSummary: true,
      content: true,
      publishedAt: true,
      updatedAt: true,
    },
  })

  if (!policy) {
    return null
  }

  return {
    id: policy.id,
    slug: policy.slug,
    version: policy.version,
    title: policy.title,
    shortSummary: policy.shortSummary,
    content: policy.content,
    publishedAt: policy.publishedAt,
    updatedAt: policy.updatedAt,
  }
}

/**
 * Get the policy version that was accepted for a specific booking
 * Used for audit and dispute resolution
 */
export async function getBookingPolicyVersion(bookingId: string): Promise<{
  version: number | null
  acceptedAt: Date | null
} | null> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      platformPolicyVersionAccepted: true,
      createdAt: true,
    },
  })

  if (!booking) {
    return null
  }

  return {
    version: booking.platformPolicyVersionAccepted,
    acceptedAt: booking.createdAt,
  }
}

/**
 * Get historical policy content for a specific version
 * Note: This requires storing historical versions, which may not be implemented yet
 * For now, returns the current policy if version matches, null otherwise
 */
export async function getHistoricalPolicyVersion(version: number): Promise<ActivePolicy | null> {
  const policy = await prisma.staticPage.findFirst({
    where: {
      slug: INSURANCE_POLICY_SLUG,
      version,
    },
    select: {
      id: true,
      slug: true,
      version: true,
      title: true,
      shortSummary: true,
      content: true,
      publishedAt: true,
      updatedAt: true,
    },
  })

  if (!policy) {
    return null
  }

  return {
    id: policy.id,
    slug: policy.slug,
    version: policy.version,
    title: policy.title,
    shortSummary: policy.shortSummary,
    content: policy.content,
    publishedAt: policy.publishedAt,
    updatedAt: policy.updatedAt,
  }
}

// ============================================
// ADMIN FUNCTIONS
// ============================================

/**
 * Publish a new version of a policy
 * Increments version number and sets publishedAt
 * 
 * @param slug - Policy slug to publish
 * @param content - New content
 * @param title - Optional new title
 * @param shortSummary - Optional new summary
 * @returns The updated policy
 */
export async function publishPolicyVersion(
  slug: string,
  content: string,
  title?: string,
  shortSummary?: string
): Promise<ActivePolicy> {
  // Get current policy
  const currentPolicy = await prisma.staticPage.findUnique({
    where: { slug },
  })

  if (!currentPolicy) {
    throw new Error(`Policy with slug "${slug}" not found`)
  }

  // Increment version and update
  const updatedPolicy = await prisma.staticPage.update({
    where: { slug },
    data: {
      content,
      title: title || currentPolicy.title,
      shortSummary: shortSummary !== undefined ? shortSummary : currentPolicy.shortSummary,
      version: currentPolicy.version + 1,
      isPublished: true,
      publishedAt: new Date(),
    },
    select: {
      id: true,
      slug: true,
      version: true,
      title: true,
      shortSummary: true,
      content: true,
      publishedAt: true,
      updatedAt: true,
    },
  })

  // Invalidate cache
  policyCache = null

  return {
    id: updatedPolicy.id,
    slug: updatedPolicy.slug,
    version: updatedPolicy.version,
    title: updatedPolicy.title,
    shortSummary: updatedPolicy.shortSummary,
    content: updatedPolicy.content,
    publishedAt: updatedPolicy.publishedAt,
    updatedAt: updatedPolicy.updatedAt,
  }
}

/**
 * Clear the policy cache
 * Call this after any policy updates
 */
export function clearPolicyCache(): void {
  policyCache = null
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format policy version for display
 * e.g., "v1.0" or "Version 1"
 */
export function formatPolicyVersion(version: number, format: 'short' | 'long' = 'short'): string {
  if (format === 'long') {
    return `Version ${version}`
  }
  return `v${version}`
}

/**
 * Check if a booking's policy version is outdated
 * Useful for showing notices to users about policy updates
 */
export async function isBookingPolicyOutdated(bookingId: string): Promise<{
  isOutdated: boolean
  bookingVersion: number | null
  currentVersion: number
}> {
  const [bookingPolicy, currentPolicy] = await Promise.all([
    getBookingPolicyVersion(bookingId),
    getActiveInsurancePolicy(),
  ])

  const bookingVersion = bookingPolicy?.version ?? null
  
  return {
    isOutdated: bookingVersion !== null && bookingVersion < currentPolicy.version,
    bookingVersion,
    currentVersion: currentPolicy.version,
  }
}
