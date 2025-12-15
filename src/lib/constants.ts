export const LISTING_CATEGORIES = [
  'TRACTOR',
  'HARVESTER',
  'PLOUGH',
  'SEEDER',
  'SPRAYER',
  'IRRIGATION',
  'TILLAGE',
  'BALER',
  'LOADER',
  'OTHER'
] as const

export const MACHINERY_CATEGORIES = LISTING_CATEGORIES

export const LISTING_CATEGORY_LABELS = {
  TRACTOR: 'Tractors',
  HARVESTER: 'Harvesters',
  PLOUGH: 'Ploughs & Tillage',
  SEEDER: 'Seeders & Planters',
  SPRAYER: 'Sprayers',
  IRRIGATION: 'Irrigation Equipment',
  TILLAGE: 'Tillage Equipment',
  BALER: 'Balers',
  LOADER: 'Loaders & Backhoes',
  OTHER: 'Other Machinery'
} as const

export const USER_ROLES = [
  'RENTER',
  'OWNER',
  'ADMIN'
] as const

export const USER_ROLE_LABELS = {
  RENTER: 'Renter',
  OWNER: 'Owner',
  ADMIN: 'Admin'
} as const

export const NZ_REGIONS = [
  'Northland',
  'Auckland',
  'Waikato',
  'Bay of Plenty',
  'Gisborne',
  "Hawke's Bay",
  'Taranaki',
  "Manawatū-Whanganui",
  'Wellington',
  'Tasman',
  'Nelson',
  'Marlborough',
  'West Coast',
  'Canterbury',
  'Otago',
  'Southland'
] as const

export const AU_STATES = [
  'New South Wales',
  'Victoria',
  'Queensland',
  'South Australia',
  'Western Australia',
  'Tasmania',
  'Northern Territory',
  'Australian Capital Territory'
] as const

export const LISTING_STATUS = [
  'DRAFT',
  'PENDING_REVIEW',
  'LIVE',
  'PAUSED',
  'REJECTED'
] as const

export const LISTING_STATUS_LABELS = {
  DRAFT: 'Draft',
  PENDING_REVIEW: 'Pending Review',
  LIVE: 'Live',
  PAUSED: 'Paused',
  REJECTED: 'Rejected'
} as const

export const BOOKING_STATUS = [
  'PENDING',
  'ACCEPTED',
  'DECLINED',
  'CANCELLED',
  'COMPLETED'
] as const

export const BOOKING_STATUS_LABELS = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed'
} as const

export const INSURANCE_MODE = [
  'OWNER_PROVIDED',
  'RENTER_PROVIDED',
  'NONE'
] as const

export const INSURANCE_MODE_LABELS = {
  OWNER_PROVIDED: 'Owner Provides Insurance',
  RENTER_PROVIDED: 'Renter Provides Insurance',
  NONE: 'No Insurance'
} as const

export const NOTIFICATION_TYPE = [
  'BOOKING_REQUEST',
  'BOOKING_ACCEPTED',
  'BOOKING_DECLINED',
  'MESSAGE_RECEIVED',
  'LISTING_APPROVED'
] as const

export const NOTIFICATION_TYPE_LABELS = {
  BOOKING_REQUEST: 'New Booking Request',
  BOOKING_ACCEPTED: 'Booking Accepted',
  BOOKING_DECLINED: 'Booking Declined',
  MESSAGE_RECEIVED: 'New Message',
  LISTING_APPROVED: 'Listing Approved'
} as const

export const REVIEW_TARGET_TYPE = [
  'OWNER',
  'RENTER',
  'LISTING'
] as const

export const REVIEW_TARGET_LABELS = {
  OWNER: 'Owner',
  RENTER: 'Renter',
  LISTING: 'Listing'
} as const

export const CURRENCY_SYMBOLS = {
  NZD: 'NZ$',
  AUD: 'A$'
} as const

// Verification status constants
export const VERIFICATION_STATUS = [
  'UNVERIFIED',
  'PENDING',
  'VERIFIED',
  'REJECTED',
  'EXPIRED'
] as const

export const VERIFICATION_STATUS_LABELS = {
  UNVERIFIED: 'Not Verified',
  PENDING: 'Pending Review',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired'
} as const

export const VERIFICATION_DOC_TYPES = [
  'DRIVER_LICENCE',
  'PASSPORT',
  'GST_CERTIFICATE',
  'BUSINESS_REGISTRATION',
  'PROOF_OF_OWNERSHIP',
  'EQUIPMENT_INVOICE',
  'EQUIPMENT_REGISTRATION',
  'INSURANCE_CERTIFICATE',
  'OTHER'
] as const

export const VERIFICATION_DOC_LABELS = {
  DRIVER_LICENCE: 'Driver Licence',
  PASSPORT: 'Passport',
  GST_CERTIFICATE: 'GST Certificate',
  BUSINESS_REGISTRATION: 'Business Registration',
  PROOF_OF_OWNERSHIP: 'Proof of Ownership',
  EQUIPMENT_INVOICE: 'Equipment Invoice',
  EQUIPMENT_REGISTRATION: 'Equipment Registration',
  INSURANCE_CERTIFICATE: 'Insurance Certificate',
  OTHER: 'Other Document'
} as const

// High-value thresholds (defaults)
export const HIGH_VALUE_THRESHOLDS = {
  bondThresholdNZD: 5000,
  bondThresholdAUD: 5000,
  valueThresholdNZD: 50000,
  valueThresholdAUD: 50000,
  dailyRateThresholdNZD: 1000,
  dailyRateThresholdAUD: 1000
} as const

// Audit action types
export const AUDIT_ACTIONS = [
  'USER_REGISTERED',
  'USER_UPDATED',
  'USER_VERIFICATION_SUBMITTED',
  'USER_VERIFICATION_APPROVED',
  'USER_VERIFICATION_REJECTED',
  'LISTING_CREATED',
  'LISTING_UPDATED',
  'LISTING_STATUS_CHANGED',
  'LISTING_DELETED',
  'LISTING_HIGH_VALUE_FLAGGED',
  'BOOKING_CREATED',
  'BOOKING_STATUS_CHANGED',
  'BOOKING_CANCELLED',
  'REVIEW_CREATED',
  'REVIEW_UPDATED',
  'REVIEW_DELETED',
  'POLICY_CREATED',
  'POLICY_UPDATED',
  'POLICY_PUBLISHED',
  'ADMIN_USER_SUSPENDED',
  'ADMIN_LISTING_REMOVED',
  'ADMIN_DISPUTE_RESOLVED'
] as const

export const AUDIT_ACTION_LABELS = {
  USER_REGISTERED: 'User Registered',
  USER_UPDATED: 'User Updated',
  USER_VERIFICATION_SUBMITTED: 'Verification Submitted',
  USER_VERIFICATION_APPROVED: 'Verification Approved',
  USER_VERIFICATION_REJECTED: 'Verification Rejected',
  LISTING_CREATED: 'Listing Created',
  LISTING_UPDATED: 'Listing Updated',
  LISTING_STATUS_CHANGED: 'Listing Status Changed',
  LISTING_DELETED: 'Listing Deleted',
  LISTING_HIGH_VALUE_FLAGGED: 'High-Value Flagged',
  BOOKING_CREATED: 'Booking Created',
  BOOKING_STATUS_CHANGED: 'Booking Status Changed',
  BOOKING_CANCELLED: 'Booking Cancelled',
  REVIEW_CREATED: 'Review Created',
  REVIEW_UPDATED: 'Review Updated',
  REVIEW_DELETED: 'Review Deleted',
  POLICY_CREATED: 'Policy Created',
  POLICY_UPDATED: 'Policy Updated',
  POLICY_PUBLISHED: 'Policy Published',
  ADMIN_USER_SUSPENDED: 'User Suspended',
  ADMIN_LISTING_REMOVED: 'Listing Removed',
  ADMIN_DISPUTE_RESOLVED: 'Dispute Resolved'
} as const
