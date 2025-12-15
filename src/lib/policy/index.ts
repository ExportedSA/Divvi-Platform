/**
 * Policy Module Exports
 */

export {
  // Main helper
  getActiveInsurancePolicy,
  getActivePolicyVersion,
  
  // Validation
  validatePolicyVersion,
  
  // Booking helpers
  getPolicyDataForBooking,
  getBookingPolicyVersion,
  isBookingPolicyOutdated,
  
  // Policy retrieval
  getPolicyBySlug,
  getHistoricalPolicyVersion,
  
  // Admin functions
  publishPolicyVersion,
  clearPolicyCache,
  
  // Utilities
  formatPolicyVersion,
  
  // Constants
  INSURANCE_POLICY_SLUG,
  RENTER_RESPONSIBILITIES_SLUG,
  OWNER_RESPONSIBILITIES_SLUG,
} from './policy-service'

export type {
  ActivePolicy,
  PolicyVersionInfo,
  PolicyValidation,
} from './policy-service'
