/**
 * KYC (Know Your Customer) Service
 * 
 * Handles document upload, validation, and verification status tracking.
 * All file handling is server-side with strict validation.
 */

import { prisma } from '@/lib/prisma'
import { VerificationStatus, VerificationDocType } from '@prisma/client'

// =============================================================================
// TYPES
// =============================================================================

export interface DocumentUploadParams {
  userId: string
  documentType: VerificationDocType
  documentNumber?: string
  documentExpiry?: Date
  fileUrl: string
  additionalUrls?: string[]
  listingId?: string // For equipment ownership verification
}

export interface UploadResult {
  success: boolean
  verificationRequestId?: string
  error?: string
}

export interface VerificationResult {
  success: boolean
  status?: VerificationStatus
  error?: string
}

export interface KYCStatus {
  userId: string
  overallStatus: VerificationStatus
  isFullyVerified: boolean
  canAccessSensitiveRoutes: boolean
  documents: Array<{
    id: string
    type: VerificationDocType
    status: VerificationStatus
    submittedAt: Date
    reviewedAt: Date | null
    rejectionReason: string | null
  }>
  missingDocuments: VerificationDocType[]
  pendingDocuments: VerificationDocType[]
}

// =============================================================================
// FILE VALIDATION
// =============================================================================

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const DOCUMENT_REQUIREMENTS: Record<VerificationDocType, {
  required: boolean
  forRoles: ('RENTER' | 'OWNER' | 'ADMIN')[]
  description: string
}> = {
  DRIVER_LICENCE: {
    required: true,
    forRoles: ['RENTER', 'OWNER'],
    description: 'Valid driver licence (front and back)',
  },
  PASSPORT: {
    required: false,
    forRoles: ['RENTER', 'OWNER'],
    description: 'Valid passport (photo page)',
  },
  GST_CERTIFICATE: {
    required: false,
    forRoles: ['OWNER'],
    description: 'GST registration certificate',
  },
  BUSINESS_REGISTRATION: {
    required: false,
    forRoles: ['OWNER'],
    description: 'Business registration document',
  },
  PROOF_OF_OWNERSHIP: {
    required: false,
    forRoles: ['OWNER'],
    description: 'Proof of equipment ownership',
  },
  EQUIPMENT_INVOICE: {
    required: false,
    forRoles: ['OWNER'],
    description: 'Equipment purchase invoice',
  },
  EQUIPMENT_REGISTRATION: {
    required: false,
    forRoles: ['OWNER'],
    description: 'Equipment registration document',
  },
  INSURANCE_CERTIFICATE: {
    required: false,
    forRoles: ['OWNER'],
    description: 'Insurance certificate',
  },
  OTHER: {
    required: false,
    forRoles: ['RENTER', 'OWNER'],
    description: 'Other supporting document',
  },
}

/**
 * Validate file metadata (server-side validation)
 */
export function validateFileMetadata(
  mimeType: string,
  fileSize: number
): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
    }
  }

  if (fileSize > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    }
  }

  return { valid: true }
}

/**
 * Validate document type for user role
 */
export function validateDocumentTypeForRole(
  documentType: VerificationDocType,
  userRole: 'RENTER' | 'OWNER' | 'ADMIN'
): { valid: boolean; error?: string } {
  const requirement = DOCUMENT_REQUIREMENTS[documentType]
  
  if (!requirement) {
    return { valid: false, error: 'Invalid document type' }
  }

  if (!requirement.forRoles.includes(userRole)) {
    return {
      valid: false,
      error: `Document type ${documentType} is not applicable for ${userRole}`,
    }
  }

  return { valid: true }
}

/**
 * Sanitize file URL to prevent path traversal
 */
export function sanitizeFileUrl(url: string): string {
  // Remove any path traversal attempts
  const sanitized = url
    .replace(/\.\./g, '')
    .replace(/\/\//g, '/')
    .trim()

  // Ensure URL starts with expected prefix (S3, Cloudinary, etc.)
  const allowedPrefixes = [
    'https://res.cloudinary.com/',
    'https://s3.',
    'https://storage.googleapis.com/',
    process.env.NEXT_PUBLIC_UPLOAD_URL || '',
  ].filter(Boolean)

  const isAllowed = allowedPrefixes.some(prefix => sanitized.startsWith(prefix))
  
  if (!isAllowed && !sanitized.startsWith('/uploads/')) {
    throw new Error('Invalid file URL')
  }

  return sanitized
}

// =============================================================================
// DOCUMENT UPLOAD
// =============================================================================

/**
 * Submit a document for KYC verification
 */
export async function submitDocument(
  params: DocumentUploadParams
): Promise<UploadResult> {
  const {
    userId,
    documentType,
    documentNumber,
    documentExpiry,
    fileUrl,
    additionalUrls = [],
    listingId,
  } = params

  try {
    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, isSuspended: true },
    })

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    if (user.isSuspended) {
      return { success: false, error: 'Account is suspended' }
    }

    // Validate document type for role
    const roleValidation = validateDocumentTypeForRole(
      documentType,
      user.role as 'RENTER' | 'OWNER' | 'ADMIN'
    )
    if (!roleValidation.valid) {
      return { success: false, error: roleValidation.error }
    }

    // Sanitize URLs
    const sanitizedUrl = sanitizeFileUrl(fileUrl)
    const sanitizedAdditionalUrls = additionalUrls.map(sanitizeFileUrl)

    // Check for existing pending request of same type
    const existingPending = await prisma.verificationRequest.findFirst({
      where: {
        userId,
        documentType,
        status: 'PENDING',
      },
    })

    if (existingPending) {
      return {
        success: false,
        error: 'You already have a pending verification request for this document type',
      }
    }

    // Create verification request
    const verificationRequest = await prisma.verificationRequest.create({
      data: {
        userId,
        documentType,
        documentNumber,
        documentExpiry,
        documentUrl: sanitizedUrl,
        additionalUrls: sanitizedAdditionalUrls,
        listingId,
        status: 'PENDING',
      },
    })

    // Update user verification status to PENDING if currently UNVERIFIED
    await prisma.user.updateMany({
      where: {
        id: userId,
        verificationStatus: 'UNVERIFIED',
      },
      data: {
        verificationStatus: 'PENDING',
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'USER_VERIFICATION_SUBMITTED',
        description: `KYC document submitted: ${documentType}`,
        actorId: userId,
        targetType: 'User',
        targetId: userId,
        targetUserId: userId,
        metadata: {
          documentType,
          verificationRequestId: verificationRequest.id,
        },
      },
    })

    // Create notification for admin
    // (In production, you'd notify admins through a queue or admin dashboard)

    return {
      success: true,
      verificationRequestId: verificationRequest.id,
    }
  } catch (error) {
    console.error('Failed to submit document:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit document',
    }
  }
}

// =============================================================================
// VERIFICATION STATUS
// =============================================================================

/**
 * Get KYC status for a user
 */
export async function getKYCStatus(userId: string): Promise<KYCStatus | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      verificationStatus: true,
      driverLicenceVerified: true,
      businessVerified: true,
      verificationRequests: {
        orderBy: { submittedAt: 'desc' },
        select: {
          id: true,
          documentType: true,
          status: true,
          submittedAt: true,
          reviewedAt: true,
          rejectionReason: true,
        },
      },
    },
  })

  if (!user) {
    return null
  }

  // Get required documents for this user's role
  const requiredDocs = Object.entries(DOCUMENT_REQUIREMENTS)
    .filter(([_, req]) => req.required && req.forRoles.includes(user.role as any))
    .map(([type]) => type as VerificationDocType)

  // Find missing and pending documents
  const submittedTypes = new Set(user.verificationRequests.map(r => r.documentType))
  const approvedTypes = new Set(
    user.verificationRequests
      .filter(r => r.status === 'VERIFIED')
      .map(r => r.documentType)
  )
  const pendingTypes = user.verificationRequests
    .filter(r => r.status === 'PENDING')
    .map(r => r.documentType)

  const missingDocuments = requiredDocs.filter(type => !submittedTypes.has(type))

  // Determine if fully verified
  const hasAllRequired = requiredDocs.every(type => approvedTypes.has(type))
  const isFullyVerified = user.verificationStatus === 'VERIFIED' && hasAllRequired

  // Can access sensitive routes if verified or has at least driver licence verified
  const canAccessSensitiveRoutes = 
    isFullyVerified || 
    user.driverLicenceVerified ||
    user.verificationStatus === 'VERIFIED'

  return {
    userId: user.id,
    overallStatus: user.verificationStatus,
    isFullyVerified,
    canAccessSensitiveRoutes,
    documents: user.verificationRequests.map(r => ({
      id: r.id,
      type: r.documentType,
      status: r.status,
      submittedAt: r.submittedAt,
      reviewedAt: r.reviewedAt,
      rejectionReason: r.rejectionReason,
    })),
    missingDocuments,
    pendingDocuments: pendingTypes,
  }
}

/**
 * Check if user can access sensitive routes
 */
export async function canAccessSensitiveRoute(userId: string): Promise<boolean> {
  const status = await getKYCStatus(userId)
  return status?.canAccessSensitiveRoutes ?? false
}

// =============================================================================
// ADMIN REVIEW
// =============================================================================

/**
 * Approve a verification request (admin only)
 */
export async function approveVerification(
  requestId: string,
  adminId: string,
  notes?: string
): Promise<VerificationResult> {
  try {
    const request = await prisma.verificationRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        userId: true,
        documentType: true,
        status: true,
      },
    })

    if (!request) {
      return { success: false, error: 'Verification request not found' }
    }

    if (request.status !== 'PENDING') {
      return { success: false, error: `Cannot approve request with status: ${request.status}` }
    }

    // Update request
    await prisma.verificationRequest.update({
      where: { id: requestId },
      data: {
        status: 'VERIFIED',
        reviewedAt: new Date(),
        reviewedBy: adminId,
        reviewNotes: notes,
      },
    })

    // Update user verification fields based on document type
    const updateData: any = {}
    
    if (request.documentType === 'DRIVER_LICENCE') {
      updateData.driverLicenceVerified = true
    } else if (['GST_CERTIFICATE', 'BUSINESS_REGISTRATION'].includes(request.documentType)) {
      updateData.businessVerified = true
    }

    // Check if user should be fully verified
    const allRequests = await prisma.verificationRequest.findMany({
      where: { userId: request.userId },
      select: { documentType: true, status: true },
    })

    const hasVerifiedLicence = allRequests.some(
      r => r.documentType === 'DRIVER_LICENCE' && r.status === 'VERIFIED'
    )

    if (hasVerifiedLicence) {
      updateData.verificationStatus = 'VERIFIED'
      updateData.verifiedAt = new Date()
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: request.userId },
        data: updateData,
      })
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'USER_VERIFICATION_APPROVED',
        description: `KYC document approved: ${request.documentType}`,
        actorId: adminId,
        targetType: 'User',
        targetId: request.userId,
        targetUserId: request.userId,
        metadata: {
          documentType: request.documentType,
          verificationRequestId: requestId,
          notes,
        },
      },
    })

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: request.userId,
        type: 'VERIFICATION_APPROVED',
        payload: {
          documentType: request.documentType,
          message: 'Your document has been verified',
        },
      },
    })

    return { success: true, status: 'VERIFIED' }
  } catch (error) {
    console.error('Failed to approve verification:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to approve',
    }
  }
}

/**
 * Reject a verification request (admin only)
 */
export async function rejectVerification(
  requestId: string,
  adminId: string,
  reason: string
): Promise<VerificationResult> {
  try {
    const request = await prisma.verificationRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        userId: true,
        documentType: true,
        status: true,
      },
    })

    if (!request) {
      return { success: false, error: 'Verification request not found' }
    }

    if (request.status !== 'PENDING') {
      return { success: false, error: `Cannot reject request with status: ${request.status}` }
    }

    // Update request
    await prisma.verificationRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        reviewedAt: new Date(),
        reviewedBy: adminId,
        rejectionReason: reason,
      },
    })

    // Check if user has any other pending or verified documents
    const otherRequests = await prisma.verificationRequest.findMany({
      where: {
        userId: request.userId,
        id: { not: requestId },
        status: { in: ['PENDING', 'VERIFIED'] },
      },
    })

    // If no other pending/verified, set user status to REJECTED
    if (otherRequests.length === 0) {
      await prisma.user.update({
        where: { id: request.userId },
        data: { verificationStatus: 'REJECTED' },
      })
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'USER_VERIFICATION_REJECTED',
        description: `KYC document rejected: ${request.documentType}`,
        actorId: adminId,
        targetType: 'User',
        targetId: request.userId,
        targetUserId: request.userId,
        metadata: {
          documentType: request.documentType,
          verificationRequestId: requestId,
          reason,
        },
      },
    })

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: request.userId,
        type: 'VERIFICATION_REJECTED',
        payload: {
          documentType: request.documentType,
          reason,
          message: 'Your document verification was not successful',
        },
      },
    })

    return { success: true, status: 'REJECTED' }
  } catch (error) {
    console.error('Failed to reject verification:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reject',
    }
  }
}

// =============================================================================
// ADMIN QUERIES
// =============================================================================

/**
 * Get pending verification requests for admin review
 */
export async function getPendingVerifications(
  limit: number = 50
): Promise<Array<{
  id: string
  userId: string
  userName: string
  userEmail: string
  documentType: VerificationDocType
  documentUrl: string
  submittedAt: Date
}>> {
  const requests = await prisma.verificationRequest.findMany({
    where: { status: 'PENDING' },
    orderBy: { submittedAt: 'asc' },
    take: limit,
    select: {
      id: true,
      userId: true,
      documentType: true,
      documentUrl: true,
      submittedAt: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  })

  return requests.map(r => ({
    id: r.id,
    userId: r.userId,
    userName: `${r.user.firstName} ${r.user.lastName}`,
    userEmail: r.user.email,
    documentType: r.documentType,
    documentUrl: r.documentUrl,
    submittedAt: r.submittedAt,
  }))
}

/**
 * Get verification request details
 */
export async function getVerificationDetails(requestId: string) {
  return prisma.verificationRequest.findUnique({
    where: { id: requestId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          country: true,
          region: true,
        },
      },
    },
  })
}
