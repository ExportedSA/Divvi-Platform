import { prisma } from '@/lib/prisma'
import { VerificationStatus, VerificationDocType, UserRole } from '@prisma/client'
import { logVerificationSubmitted, logVerificationApproved, logVerificationRejected } from './audit'

// High-value thresholds (configurable via SystemConfig)
const DEFAULT_HIGH_VALUE_THRESHOLDS = {
  // Bond amount thresholds (in respective currency)
  bondThresholdNZD: 5000,
  bondThresholdAUD: 5000,
  // Estimated value thresholds
  valueThresholdNZD: 50000,
  valueThresholdAUD: 50000,
  // Daily rate thresholds
  dailyRateThresholdNZD: 1000,
  dailyRateThresholdAUD: 1000,
}

/**
 * Get high-value thresholds from system config
 */
export async function getHighValueThresholds() {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'high_value_thresholds' },
    })
    if (config?.value) {
      return { ...DEFAULT_HIGH_VALUE_THRESHOLDS, ...(config.value as object) }
    }
  } catch (error) {
    console.error('Failed to get high-value thresholds:', error)
  }
  return DEFAULT_HIGH_VALUE_THRESHOLDS
}

/**
 * Check if a listing should be flagged as high-value
 */
export async function checkHighValueListing(listing: {
  bondAmount?: number | null
  pricePerDay: number
  estimatedValue?: number | null
  currency: 'NZD' | 'AUD'
}): Promise<{ isHighValue: boolean; reason?: string }> {
  const thresholds = await getHighValueThresholds()
  const currencySuffix = listing.currency

  // Check bond amount
  const bondThreshold = thresholds[`bondThreshold${currencySuffix}` as keyof typeof thresholds] as number
  if (listing.bondAmount && listing.bondAmount >= bondThreshold) {
    return {
      isHighValue: true,
      reason: `Bond amount ($${listing.bondAmount}) exceeds threshold ($${bondThreshold})`,
    }
  }

  // Check estimated value
  const valueThreshold = thresholds[`valueThreshold${currencySuffix}` as keyof typeof thresholds] as number
  if (listing.estimatedValue && listing.estimatedValue >= valueThreshold) {
    return {
      isHighValue: true,
      reason: `Estimated value ($${listing.estimatedValue}) exceeds threshold ($${valueThreshold})`,
    }
  }

  // Check daily rate
  const dailyRateThreshold = thresholds[`dailyRateThreshold${currencySuffix}` as keyof typeof thresholds] as number
  if (listing.pricePerDay >= dailyRateThreshold) {
    return {
      isHighValue: true,
      reason: `Daily rate ($${listing.pricePerDay}) exceeds threshold ($${dailyRateThreshold})`,
    }
  }

  return { isHighValue: false }
}

/**
 * Get required verification documents for a user role
 */
export function getRequiredDocuments(role: UserRole): VerificationDocType[] {
  switch (role) {
    case 'RENTER':
      return ['DRIVER_LICENCE']
    case 'OWNER':
      return ['DRIVER_LICENCE', 'GST_CERTIFICATE']
    case 'ADMIN':
      return []
    default:
      return ['DRIVER_LICENCE']
  }
}

/**
 * Get required documents for high-value listings
 */
export function getHighValueListingDocuments(): VerificationDocType[] {
  return ['PROOF_OF_OWNERSHIP', 'EQUIPMENT_INVOICE', 'INSURANCE_CERTIFICATE']
}

/**
 * Check if user has all required verifications
 */
export async function checkUserVerificationStatus(userId: string): Promise<{
  isFullyVerified: boolean
  missingDocuments: VerificationDocType[]
  pendingDocuments: VerificationDocType[]
  verifiedDocuments: VerificationDocType[]
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      verificationRequests: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!user) {
    throw new Error('User not found')
  }

  const requiredDocs = getRequiredDocuments(user.role)
  const verifiedDocs: VerificationDocType[] = []
  const pendingDocs: VerificationDocType[] = []
  const missingDocs: VerificationDocType[] = []

  for (const docType of requiredDocs) {
    const latestRequest = user.verificationRequests.find(
      (r) => r.documentType === docType
    )

    if (!latestRequest) {
      missingDocs.push(docType)
    } else if (latestRequest.status === 'VERIFIED') {
      verifiedDocs.push(docType)
    } else if (latestRequest.status === 'PENDING') {
      pendingDocs.push(docType)
    } else {
      // REJECTED or EXPIRED - needs resubmission
      missingDocs.push(docType)
    }
  }

  return {
    isFullyVerified: missingDocs.length === 0 && pendingDocs.length === 0,
    missingDocuments: missingDocs,
    pendingDocuments: pendingDocs,
    verifiedDocuments: verifiedDocs,
  }
}

/**
 * Submit a verification request
 */
export async function submitVerificationRequest(params: {
  userId: string
  userEmail: string
  documentType: VerificationDocType
  documentNumber?: string
  documentExpiry?: Date
  documentUrl: string
  additionalUrls?: string[]
  listingId?: string
}) {
  // Check for existing pending request
  const existingPending = await prisma.verificationRequest.findFirst({
    where: {
      userId: params.userId,
      documentType: params.documentType,
      status: 'PENDING',
    },
  })

  if (existingPending) {
    throw new Error('A pending verification request already exists for this document type')
  }

  const request = await prisma.verificationRequest.create({
    data: {
      userId: params.userId,
      documentType: params.documentType,
      documentNumber: params.documentNumber,
      documentExpiry: params.documentExpiry,
      documentUrl: params.documentUrl,
      additionalUrls: params.additionalUrls || [],
      listingId: params.listingId,
      status: 'PENDING',
    },
  })

  // Log the submission
  await logVerificationSubmitted(
    params.userId,
    params.userEmail,
    params.documentType,
    request.id
  )

  return request
}

/**
 * Approve a verification request (admin only)
 */
export async function approveVerificationRequest(
  requestId: string,
  adminId: string,
  adminEmail: string,
  notes?: string
) {
  const request = await prisma.verificationRequest.findUnique({
    where: { id: requestId },
    include: { user: true },
  })

  if (!request) {
    throw new Error('Verification request not found')
  }

  if (request.status !== 'PENDING') {
    throw new Error('Request is not pending')
  }

  // Update the request
  const updatedRequest = await prisma.verificationRequest.update({
    where: { id: requestId },
    data: {
      status: 'VERIFIED',
      reviewedAt: new Date(),
      reviewedBy: adminId,
      reviewNotes: notes,
    },
  })

  // Update user verification status based on document type
  const updateData: any = {}
  
  if (request.documentType === 'DRIVER_LICENCE') {
    updateData.driverLicenceVerified = true
    updateData.driverLicenceNumber = request.documentNumber
    updateData.driverLicenceExpiry = request.documentExpiry
  } else if (request.documentType === 'GST_CERTIFICATE') {
    updateData.businessVerified = true
    updateData.gstNumber = request.documentNumber
  }

  // Check if user is now fully verified
  const verificationStatus = await checkUserVerificationStatus(request.userId)
  if (verificationStatus.isFullyVerified) {
    updateData.verificationStatus = 'VERIFIED'
    updateData.verifiedAt = new Date()
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.user.update({
      where: { id: request.userId },
      data: updateData,
    })
  }

  // Log the approval
  await logVerificationApproved(
    adminId,
    adminEmail,
    request.userId,
    requestId,
    request.documentType
  )

  // Send notification to user
  await prisma.notification.create({
    data: {
      userId: request.userId,
      type: 'VERIFICATION_APPROVED',
      payload: {
        documentType: request.documentType,
        message: `Your ${request.documentType.replace(/_/g, ' ').toLowerCase()} has been verified.`,
      },
    },
  })

  return updatedRequest
}

/**
 * Reject a verification request (admin only)
 */
export async function rejectVerificationRequest(
  requestId: string,
  adminId: string,
  adminEmail: string,
  reason: string,
  notes?: string
) {
  const request = await prisma.verificationRequest.findUnique({
    where: { id: requestId },
    include: { user: true },
  })

  if (!request) {
    throw new Error('Verification request not found')
  }

  if (request.status !== 'PENDING') {
    throw new Error('Request is not pending')
  }

  // Update the request
  const updatedRequest = await prisma.verificationRequest.update({
    where: { id: requestId },
    data: {
      status: 'REJECTED',
      reviewedAt: new Date(),
      reviewedBy: adminId,
      reviewNotes: notes,
      rejectionReason: reason,
    },
  })

  // Update user verification status
  await prisma.user.update({
    where: { id: request.userId },
    data: {
      verificationStatus: 'REJECTED',
      verificationNotes: reason,
    },
  })

  // Log the rejection
  await logVerificationRejected(
    adminId,
    adminEmail,
    request.userId,
    requestId,
    request.documentType,
    reason
  )

  // Send notification to user
  await prisma.notification.create({
    data: {
      userId: request.userId,
      type: 'VERIFICATION_REJECTED',
      payload: {
        documentType: request.documentType,
        reason,
        message: `Your ${request.documentType.replace(/_/g, ' ').toLowerCase()} verification was rejected: ${reason}`,
      },
    },
  })

  return updatedRequest
}

/**
 * Get pending verification requests (admin)
 */
export async function getPendingVerificationRequests(params?: {
  documentType?: VerificationDocType
  limit?: number
  offset?: number
}) {
  const where: any = { status: 'PENDING' }
  if (params?.documentType) where.documentType = params.documentType

  const [requests, total] = await Promise.all([
    prisma.verificationRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            farmName: true,
          },
        },
      },
      orderBy: { submittedAt: 'asc' },
      take: params?.limit || 50,
      skip: params?.offset || 0,
    }),
    prisma.verificationRequest.count({ where }),
  ])

  return { requests, total }
}

/**
 * Check if user can book high-value listing
 */
export async function canBookHighValueListing(userId: string): Promise<{
  canBook: boolean
  reason?: string
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    return { canBook: false, reason: 'User not found' }
  }

  if (user.isSuspended) {
    return { canBook: false, reason: 'Account is suspended' }
  }

  if (user.verificationStatus !== 'VERIFIED') {
    return {
      canBook: false,
      reason: 'Account must be verified to book high-value equipment',
    }
  }

  if (!user.driverLicenceVerified) {
    return {
      canBook: false,
      reason: 'Driver licence must be verified to book high-value equipment',
    }
  }

  return { canBook: true }
}

/**
 * Check if owner can list high-value equipment
 */
export async function canListHighValueEquipment(userId: string): Promise<{
  canList: boolean
  reason?: string
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    return { canList: false, reason: 'User not found' }
  }

  if (user.isSuspended) {
    return { canList: false, reason: 'Account is suspended' }
  }

  if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
    return { canList: false, reason: 'Only owners can list equipment' }
  }

  if (user.verificationStatus !== 'VERIFIED') {
    return {
      canList: false,
      reason: 'Account must be verified to list high-value equipment',
    }
  }

  if (!user.businessVerified) {
    return {
      canList: false,
      reason: 'Business/GST must be verified to list high-value equipment',
    }
  }

  return { canList: true }
}
