/**
 * KYC Module
 * 
 * Centralized exports for KYC document upload and verification.
 */

// KYC Service
export {
  validateFileMetadata,
  validateDocumentTypeForRole,
  sanitizeFileUrl,
  submitDocument,
  getKYCStatus,
  canAccessSensitiveRoute,
  approveVerification,
  rejectVerification,
  getPendingVerifications,
  getVerificationDetails,
} from './kyc-service'

export type {
  DocumentUploadParams,
  UploadResult,
  VerificationResult,
  KYCStatus,
} from './kyc-service'

// Verification Guard
export {
  checkVerificationStatus,
  meetsVerificationLevel,
  getRequiredVerificationLevel,
  isRouteBlockedForUnverified,
  guardApiRoute,
  getVerificationRequirements,
  PROTECTED_ROUTES,
  BLOCKED_ROUTES_UNVERIFIED,
} from './verification-guard'

export type {
  VerificationCheck,
  RequiredVerificationLevel,
} from './verification-guard'
