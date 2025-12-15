/**
 * Listing Module Exports
 */

export {
  // Configuration
  getHighRiskThreshold,
  requiresAdminApprovalForHighValue,
  
  // Risk assessment
  assessListingRisk,
  
  // Publish validation
  validateListingForPublish,
  publishListing,
  updateListingRiskFlags,
  
  // Admin actions
  approveListingForPublish,
  rejectListingForPublish,
  
  // Content
  OWNER_CONFIRMATIONS,
  getOwnerConfirmationContent,
} from './listing-service'

export type {
  OwnerConfirmations,
  PublishListingParams,
  PublishValidationResult,
  ListingRiskAssessment,
} from './listing-service'

// Listing validation exports
export {
  validateCreateListing,
  validatePublishListing,
  validateUpdateListing,
  validatePricing,
  validateAvailability,
  validateOwnership,
  validateListingComplete,
  validateCurrencyCountryMatch,
  checkOrphanedListing,
  createListingSchema,
  publishListingSchema,
  updateListingSchema,
} from './listing-validation'

export type {
  CreateListingInput,
  PublishListingInput,
  UpdateListingInput,
  ValidationResult,
} from './listing-validation'
