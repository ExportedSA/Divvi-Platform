/**
 * Listing Service
 * Business logic for listing creation, publishing, and risk management
 */

import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

// ============================================
// CONFIGURATION
// ============================================

// Default high-risk asset threshold (configurable via SystemConfig)
const DEFAULT_HIGH_RISK_THRESHOLD = 100000 // $100,000

// Listing statuses that require admin approval
const STATUSES_REQUIRING_APPROVAL = ['PENDING_REVIEW']

// ============================================
// TYPES
// ============================================

export interface OwnerConfirmations {
  confirmMaintenanceResponsibility: boolean
  confirmInsuranceAccuracy: boolean
}

export interface PublishListingParams {
  listingId: string
  ownerId: string
  confirmations: OwnerConfirmations
}

export interface PublishValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  requiresAdminApproval: boolean
  isHighRiskAsset: boolean
}

export interface ListingRiskAssessment {
  isHighRiskAsset: boolean
  isHighValue: boolean
  requiresVerification: boolean
  requiresAdminApproval: boolean
  reasons: string[]
}

// ============================================
// CONFIGURATION HELPERS
// ============================================

/**
 * Get the high-risk asset threshold from system config
 */
export async function getHighRiskThreshold(): Promise<number> {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'high_risk_asset_threshold' },
    })
    
    if (config?.value) {
      const value = config.value as { threshold?: number }
      return value.threshold ?? DEFAULT_HIGH_RISK_THRESHOLD
    }
  } catch {
    // Config not found, use default
  }
  return DEFAULT_HIGH_RISK_THRESHOLD
}

/**
 * Check if high-value listings require admin approval
 */
export async function requiresAdminApprovalForHighValue(): Promise<boolean> {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'listing_approval_settings' },
    })
    
    if (config?.value) {
      const value = config.value as { requireApprovalForHighValue?: boolean }
      return value.requireApprovalForHighValue ?? true
    }
  } catch {
    // Config not found, use default
  }
  return true // Default: require approval for high-value
}

// ============================================
// RISK ASSESSMENT
// ============================================

/**
 * Assess the risk level of a listing
 */
export async function assessListingRisk(
  estimatedReplacementValue?: number | null,
  estimatedValue?: number | null
): Promise<ListingRiskAssessment> {
  const threshold = await getHighRiskThreshold()
  const requireApproval = await requiresAdminApprovalForHighValue()
  
  const reasons: string[] = []
  let isHighRiskAsset = false
  let isHighValue = false
  let requiresVerification = false
  let requiresAdminApproval = false

  // Check replacement value against threshold
  if (estimatedReplacementValue && estimatedReplacementValue >= threshold) {
    isHighRiskAsset = true
    isHighValue = true
    requiresVerification = true
    reasons.push(`Estimated replacement value ($${estimatedReplacementValue.toLocaleString()}) exceeds threshold ($${threshold.toLocaleString()})`)
    
    if (requireApproval) {
      requiresAdminApproval = true
      reasons.push('High-value listings require admin approval before going live')
    }
  }

  // Also check estimated value if replacement value not provided
  if (!estimatedReplacementValue && estimatedValue && estimatedValue >= threshold) {
    isHighValue = true
    requiresVerification = true
    reasons.push(`Estimated value ($${estimatedValue.toLocaleString()}) exceeds threshold ($${threshold.toLocaleString()})`)
    
    if (requireApproval) {
      requiresAdminApproval = true
    }
  }

  return {
    isHighRiskAsset,
    isHighValue,
    requiresVerification,
    requiresAdminApproval,
    reasons,
  }
}

// ============================================
// PUBLISH VALIDATION
// ============================================

/**
 * Validate a listing for publishing
 */
export async function validateListingForPublish(
  listingId: string,
  confirmations: OwnerConfirmations
): Promise<PublishValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  // Get listing
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      insuranceMode: true,
      bondAmount: true,
      estimatedValue: true,
      estimatedReplacementValue: true,
      insuranceNotes: true,
      status: true,
    },
  })

  if (!listing) {
    return {
      isValid: false,
      errors: ['Listing not found'],
      warnings: [],
      requiresAdminApproval: false,
      isHighRiskAsset: false,
    }
  }

  // Check required fields
  if (!listing.insuranceMode) {
    errors.push('Insurance mode must be selected')
  }

  if (listing.bondAmount === null || listing.bondAmount === undefined) {
    errors.push('Bond amount must be explicitly set (can be $0)')
  }

  // Check owner confirmations
  if (!confirmations.confirmMaintenanceResponsibility) {
    errors.push('You must confirm that you are responsible for maintaining this machinery in safe working condition and compliance with applicable regulations')
  }

  if (!confirmations.confirmInsuranceAccuracy) {
    errors.push('You must confirm that the insurance information provided is accurate to the best of your knowledge')
  }

  // Warnings for optional but recommended fields
  if (!listing.insuranceNotes && listing.insuranceMode !== 'NONE') {
    warnings.push('Consider adding insurance notes to help renters understand coverage details')
  }

  // Assess risk
  const riskAssessment = await assessListingRisk(
    listing.estimatedReplacementValue ? Number(listing.estimatedReplacementValue) : null,
    listing.estimatedValue ? Number(listing.estimatedValue) : null
  )

  if (riskAssessment.isHighRiskAsset) {
    warnings.push(...riskAssessment.reasons)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    requiresAdminApproval: riskAssessment.requiresAdminApproval,
    isHighRiskAsset: riskAssessment.isHighRiskAsset,
  }
}

// ============================================
// PUBLISH LISTING
// ============================================

/**
 * Publish a listing (transition from DRAFT to LIVE or PENDING_REVIEW)
 */
export async function publishListing(params: PublishListingParams) {
  const { listingId, ownerId, confirmations } = params

  // Validate
  const validation = await validateListingForPublish(listingId, confirmations)
  
  if (!validation.isValid) {
    return {
      success: false,
      errors: validation.errors,
      warnings: validation.warnings,
    }
  }

  // Get listing to verify ownership
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      ownerId: true,
      status: true,
      estimatedReplacementValue: true,
      estimatedValue: true,
    },
  })

  if (!listing) {
    return {
      success: false,
      errors: ['Listing not found'],
      warnings: [],
    }
  }

  if (listing.ownerId !== ownerId) {
    return {
      success: false,
      errors: ['You do not have permission to publish this listing'],
      warnings: [],
    }
  }

  if (listing.status !== 'DRAFT' && listing.status !== 'PAUSED' && listing.status !== 'REJECTED') {
    return {
      success: false,
      errors: [`Cannot publish listing with status: ${listing.status}`],
      warnings: [],
    }
  }

  // Determine target status
  const targetStatus = validation.requiresAdminApproval ? 'PENDING_REVIEW' : 'LIVE'

  // Update listing
  const updatedListing = await prisma.listing.update({
    where: { id: listingId },
    data: {
      status: targetStatus,
      isHighRiskAsset: validation.isHighRiskAsset,
      isHighValue: validation.isHighRiskAsset,
      requiresVerification: validation.isHighRiskAsset,
      // Store confirmations timestamp (could add dedicated fields if needed)
      updatedAt: new Date(),
    },
  })

  return {
    success: true,
    listing: {
      id: updatedListing.id,
      status: updatedListing.status,
    },
    requiresAdminApproval: validation.requiresAdminApproval,
    warnings: validation.warnings,
    message: validation.requiresAdminApproval
      ? 'Listing submitted for admin review due to high asset value'
      : 'Listing published successfully',
  }
}

// ============================================
// UPDATE RISK FLAGS
// ============================================

/**
 * Update listing risk flags when estimated value changes
 */
export async function updateListingRiskFlags(
  listingId: string,
  estimatedReplacementValue?: number
) {
  const riskAssessment = await assessListingRisk(estimatedReplacementValue)

  return prisma.listing.update({
    where: { id: listingId },
    data: {
      estimatedReplacementValue: estimatedReplacementValue 
        ? new Decimal(estimatedReplacementValue) 
        : undefined,
      isHighRiskAsset: riskAssessment.isHighRiskAsset,
      isHighValue: riskAssessment.isHighValue,
      requiresVerification: riskAssessment.requiresVerification,
    },
  })
}

// ============================================
// ADMIN APPROVAL
// ============================================

/**
 * Admin approves a listing (PENDING_REVIEW -> LIVE)
 */
export async function approveListingForPublish(
  listingId: string,
  adminId: string,
  notes?: string
) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, status: true },
  })

  if (!listing) {
    throw new Error('Listing not found')
  }

  if (listing.status !== 'PENDING_REVIEW') {
    throw new Error(`Cannot approve listing with status: ${listing.status}`)
  }

  return prisma.listing.update({
    where: { id: listingId },
    data: {
      status: 'LIVE',
      highValueReason: notes,
    },
  })
}

/**
 * Admin rejects a listing (PENDING_REVIEW -> REJECTED)
 */
export async function rejectListingForPublish(
  listingId: string,
  adminId: string,
  reason: string
) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, status: true },
  })

  if (!listing) {
    throw new Error('Listing not found')
  }

  if (listing.status !== 'PENDING_REVIEW') {
    throw new Error(`Cannot reject listing with status: ${listing.status}`)
  }

  return prisma.listing.update({
    where: { id: listingId },
    data: {
      status: 'REJECTED',
      highValueReason: reason,
    },
  })
}

// ============================================
// OWNER CONFIRMATION CONTENT
// ============================================

/**
 * Get the confirmation text for owner responsibilities
 * These are editable via CMS but have defaults
 */
export const OWNER_CONFIRMATIONS = {
  maintenanceResponsibility: {
    id: 'confirmMaintenanceResponsibility',
    label: 'Maintenance & Safety Responsibility',
    text: 'I am responsible for maintaining this machinery in safe working condition and compliance with applicable regulations.',
    required: true,
  },
  insuranceAccuracy: {
    id: 'confirmInsuranceAccuracy',
    label: 'Insurance Information Accuracy',
    text: 'The insurance information I have provided is accurate to the best of my knowledge.',
    required: true,
  },
}

/**
 * Get owner confirmation content (from CMS or defaults)
 */
export async function getOwnerConfirmationContent() {
  try {
    const page = await prisma.staticPage.findUnique({
      where: { slug: 'owner-listing-confirmations' },
      select: { content: true },
    })

    if (page?.content) {
      // Parse JSON content if stored as JSON
      try {
        return JSON.parse(page.content)
      } catch {
        // Not JSON, return defaults
      }
    }
  } catch {
    // Page not found, use defaults
  }

  return OWNER_CONFIRMATIONS
}
