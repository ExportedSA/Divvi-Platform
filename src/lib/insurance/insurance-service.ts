/**
 * Insurance & Damage Service
 * Handles insurance snapshots, damage reporting, and bond management
 */

import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

// ============================================
// TYPES
// ============================================

export type InsuranceMode = 'OWNER_PROVIDED' | 'RENTER_PROVIDED' | 'NONE'
export type DamageStatus = 
  | 'NONE_REPORTED'
  | 'POTENTIAL_DAMAGE_REPORTED'
  | 'CONFIRMED_DAMAGE'
  | 'RESOLVED_NO_CHARGE'
  | 'RESOLVED_BOND_PARTIALLY_USED'
  | 'RESOLVED_BOND_FULLY_USED'

export type DamageSeverity = 'MINOR' | 'MODERATE' | 'MAJOR' | 'TOTAL_LOSS'
export type DamageReportStatus = 
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'AWAITING_MORE_INFO'
  | 'RESOLVED_NO_ACTION'
  | 'RESOLVED_BOND_PARTIAL'
  | 'RESOLVED_BOND_FULL'
  | 'ESCALATED'

export type ReporterRole = 'OWNER' | 'RENTER' | 'ADMIN'

export interface InsuranceSnapshot {
  insuranceMode: InsuranceMode
  insuranceNotes: string | null
  estimatedReplacementValue: number | null
  bondAmount: number | null
  damageExcessNotes: string | null
  safeUseRequirements: string | null
  maintenanceResponsibilityOwner: boolean
}

export interface CreateDamageReportParams {
  bookingId: string
  createdById: string
  reportedByRole: ReporterRole
  summary: string
  description: string
  estimatedRepairCost?: number
  reportedSeverity: DamageSeverity
  photoUrls?: { url: string; caption?: string }[]
}

export interface ResolveDamageReportParams {
  reportId: string
  reviewerId: string
  status: DamageReportStatus
  adminNotes?: string
  bondAmountApplied?: number
  resolutionNotes?: string
}

// ============================================
// INSURANCE SNAPSHOT
// ============================================

/**
 * Create an immutable insurance snapshot from a listing for a booking
 */
export async function createInsuranceSnapshot(listingId: string): Promise<InsuranceSnapshot> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      insuranceMode: true,
      insuranceNotes: true,
      estimatedReplacementValue: true,
      bondAmount: true,
      damageExcessNotes: true,
      safeUseRequirements: true,
      maintenanceResponsibilityOwner: true,
    },
  })

  if (!listing) {
    throw new Error('Listing not found')
  }

  return {
    insuranceMode: listing.insuranceMode as InsuranceMode,
    insuranceNotes: listing.insuranceNotes,
    estimatedReplacementValue: listing.estimatedReplacementValue 
      ? Number(listing.estimatedReplacementValue) 
      : null,
    bondAmount: listing.bondAmount ? Number(listing.bondAmount) : null,
    damageExcessNotes: listing.damageExcessNotes,
    safeUseRequirements: listing.safeUseRequirements,
    maintenanceResponsibilityOwner: listing.maintenanceResponsibilityOwner,
  }
}

/**
 * Get the current platform insurance policy version
 */
export async function getCurrentPolicyVersion(): Promise<{ version: number; content: string } | null> {
  const policy = await prisma.staticPage.findFirst({
    where: {
      slug: 'insurance-and-damage-policy',
      isPublished: true,
    },
    select: {
      version: true,
      content: true,
    },
  })

  return policy
}

/**
 * Apply insurance snapshot to a booking
 */
export async function applyInsuranceSnapshotToBooking(
  bookingId: string,
  snapshot: InsuranceSnapshot,
  policyVersion: number,
  ownerTermsAcknowledged: boolean,
  renterResponsibilityAcknowledged: boolean
) {
  return prisma.booking.update({
    where: { id: bookingId },
    data: {
      insuranceModeSnapshot: snapshot.insuranceMode,
      insuranceNotesSnapshot: snapshot.insuranceNotes,
      estimatedReplacementValueSnapshot: snapshot.estimatedReplacementValue 
        ? new Decimal(snapshot.estimatedReplacementValue) 
        : null,
      platformPolicyVersionAccepted: policyVersion,
      ownerTermsAcknowledged,
      renterResponsibilityAcknowledged,
      // Also store as JSON for backward compatibility
      insuranceSnapshot: snapshot as any,
    },
  })
}

// ============================================
// DAMAGE REPORTING
// ============================================

/**
 * Create a new damage report
 */
export async function createDamageReport(params: CreateDamageReportParams) {
  const { 
    bookingId, 
    createdById, 
    reportedByRole, 
    summary, 
    description, 
    estimatedRepairCost,
    reportedSeverity,
    photoUrls = [],
  } = params

  // Verify booking exists and is in a valid state
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { 
      id: true, 
      bookingStatus: true,
      damageStatus: true,
    },
  })

  if (!booking) {
    throw new Error('Booking not found')
  }

  // Create damage report with photos
  const report = await prisma.damageReport.create({
    data: {
      bookingId,
      createdById,
      reportedByRole,
      summary,
      description,
      estimatedRepairCost: estimatedRepairCost 
        ? new Decimal(estimatedRepairCost) 
        : null,
      reportedSeverity,
      photos: {
        create: photoUrls.map((photo) => ({
          url: photo.url,
          caption: photo.caption,
          takenByRole: reportedByRole,
        })),
      },
    },
    include: {
      photos: true,
    },
  })

  // Update booking damage status
  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      damageStatus: 'POTENTIAL_DAMAGE_REPORTED',
    },
  })

  return report
}

/**
 * Get damage reports for a booking
 */
export async function getDamageReportsForBooking(bookingId: string) {
  return prisma.damageReport.findMany({
    where: { bookingId },
    include: {
      photos: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Get a single damage report by ID
 */
export async function getDamageReport(reportId: string) {
  return prisma.damageReport.findUnique({
    where: { id: reportId },
    include: {
      photos: true,
      booking: {
        select: {
          id: true,
          listingId: true,
          renterId: true,
          ownerId: true,
          bondAmountAtBooking: true,
          damageStatus: true,
        },
      },
    },
  })
}

/**
 * Add photos to an existing damage report
 */
export async function addPhotosToReport(
  reportId: string,
  photos: { url: string; caption?: string; takenByRole: ReporterRole }[]
) {
  return prisma.damageReportPhoto.createMany({
    data: photos.map((photo) => ({
      damageReportId: reportId,
      url: photo.url,
      caption: photo.caption,
      takenByRole: photo.takenByRole,
    })),
  })
}

/**
 * Update damage report status (admin action)
 */
export async function updateDamageReportStatus(
  reportId: string,
  status: DamageReportStatus,
  reviewerId: string,
  adminNotes?: string
) {
  return prisma.damageReport.update({
    where: { id: reportId },
    data: {
      status,
      reviewedById: reviewerId,
      reviewedAt: new Date(),
      adminNotes,
    },
  })
}

/**
 * Resolve a damage report with bond application
 */
export async function resolveDamageReport(params: ResolveDamageReportParams) {
  const { reportId, reviewerId, status, adminNotes, bondAmountApplied, resolutionNotes } = params

  const report = await prisma.damageReport.findUnique({
    where: { id: reportId },
    include: {
      booking: {
        select: {
          id: true,
          bondAmountAtBooking: true,
        },
      },
    },
  })

  if (!report) {
    throw new Error('Damage report not found')
  }

  // Validate bond amount doesn't exceed booking bond
  if (bondAmountApplied && report.booking.bondAmountAtBooking) {
    if (bondAmountApplied > Number(report.booking.bondAmountAtBooking)) {
      throw new Error('Bond amount applied cannot exceed booking bond amount')
    }
  }

  // Update damage report
  const updatedReport = await prisma.damageReport.update({
    where: { id: reportId },
    data: {
      status,
      reviewedById: reviewerId,
      reviewedAt: new Date(),
      adminNotes,
      bondAmountApplied: bondAmountApplied ? new Decimal(bondAmountApplied) : null,
      resolvedAt: new Date(),
      resolutionNotes,
    },
  })

  // Update booking damage status based on resolution
  let bookingDamageStatus: DamageStatus = 'NONE_REPORTED'
  
  if (status === 'RESOLVED_NO_ACTION') {
    bookingDamageStatus = 'RESOLVED_NO_CHARGE'
  } else if (status === 'RESOLVED_BOND_PARTIAL') {
    bookingDamageStatus = 'RESOLVED_BOND_PARTIALLY_USED'
  } else if (status === 'RESOLVED_BOND_FULL') {
    bookingDamageStatus = 'RESOLVED_BOND_FULLY_USED'
  } else if (status === 'ESCALATED') {
    bookingDamageStatus = 'CONFIRMED_DAMAGE'
  }

  await prisma.booking.update({
    where: { id: report.bookingId },
    data: {
      damageStatus: bookingDamageStatus,
    },
  })

  return updatedReport
}

// ============================================
// ADMIN QUERIES
// ============================================

/**
 * Get all open damage reports (admin queue)
 */
export async function getOpenDamageReports(
  filters?: {
    status?: DamageReportStatus[]
    severity?: DamageSeverity[]
  },
  page: number = 0,
  limit: number = 20
) {
  const where: any = {}

  if (filters?.status && filters.status.length > 0) {
    where.status = { in: filters.status }
  } else {
    // Default to open reports
    where.status = { in: ['OPEN', 'UNDER_REVIEW', 'AWAITING_MORE_INFO'] }
  }

  if (filters?.severity && filters.severity.length > 0) {
    where.reportedSeverity = { in: filters.severity }
  }

  const [reports, total] = await Promise.all([
    prisma.damageReport.findMany({
      where,
      include: {
        photos: true,
        booking: {
          select: {
            id: true,
            listing: { select: { title: true } },
            renter: { select: { firstName: true, lastName: true } },
            owner: { select: { firstName: true, lastName: true } },
            bondAmountAtBooking: true,
          },
        },
      },
      orderBy: [
        { reportedSeverity: 'desc' }, // Most severe first
        { createdAt: 'asc' }, // Oldest first
      ],
      skip: page * limit,
      take: limit,
    }),
    prisma.damageReport.count({ where }),
  ])

  return {
    reports,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

/**
 * Get damage report statistics
 */
export async function getDamageReportStats() {
  const [
    totalOpen,
    totalResolved,
    bySeverity,
    totalBondApplied,
  ] = await Promise.all([
    prisma.damageReport.count({
      where: { status: { in: ['OPEN', 'UNDER_REVIEW', 'AWAITING_MORE_INFO'] } },
    }),
    prisma.damageReport.count({
      where: { status: { in: ['RESOLVED_NO_ACTION', 'RESOLVED_BOND_PARTIAL', 'RESOLVED_BOND_FULL'] } },
    }),
    prisma.damageReport.groupBy({
      by: ['reportedSeverity'],
      _count: true,
    }),
    prisma.damageReport.aggregate({
      where: { bondAmountApplied: { not: null } },
      _sum: { bondAmountApplied: true },
    }),
  ])

  return {
    totalOpen,
    totalResolved,
    bySeverity: bySeverity.map((s) => ({
      severity: s.reportedSeverity,
      count: s._count,
    })),
    totalBondApplied: totalBondApplied._sum.bondAmountApplied 
      ? Number(totalBondApplied._sum.bondAmountApplied) 
      : 0,
  }
}

// ============================================
// HIGH-RISK ASSET FLAGGING
// ============================================

/**
 * Check if a listing should be flagged as high-risk based on value threshold
 */
export async function checkHighRiskThreshold(
  estimatedReplacementValue: number
): Promise<boolean> {
  // Get threshold from system config
  const config = await prisma.systemConfig.findUnique({
    where: { key: 'high_risk_asset_threshold' },
  })

  const threshold = config?.value 
    ? (config.value as { threshold: number }).threshold 
    : 50000 // Default $50,000

  return estimatedReplacementValue >= threshold
}

/**
 * Update listing high-risk status based on value
 */
export async function updateListingRiskStatus(
  listingId: string,
  estimatedReplacementValue: number
) {
  const isHighRisk = await checkHighRiskThreshold(estimatedReplacementValue)

  return prisma.listing.update({
    where: { id: listingId },
    data: {
      estimatedReplacementValue: new Decimal(estimatedReplacementValue),
      isHighRiskAsset: isHighRisk,
    },
  })
}
