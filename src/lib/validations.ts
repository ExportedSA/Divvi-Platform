import { z } from 'zod'
import { LISTING_CATEGORIES, USER_ROLES, BOOKING_STATUS, LISTING_STATUS, INSURANCE_MODE, REVIEW_TARGET_TYPE, NOTIFICATION_TYPE } from './constants'

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  farmName: z.string().optional(),
  phone: z.string().optional(),
  country: z.enum(['NZ', 'AU'], { required_error: 'Country is required' }),
  region: z.string().min(1, 'Region is required'),
  localArea: z.string().optional(),
  driverLicenceNumber: z.string().optional(),
  role: z.enum(USER_ROLES).default('RENTER')
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
})

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  farmName: z.string().optional(),
  phone: z.string().optional(),
  region: z.string().min(1, 'Region is required'),
  localArea: z.string().optional(),
  driverLicenceNumber: z.string().optional()
})

// Listing schemas - base fields
const listingBaseFields = {
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description must be less than 2000 characters'),
  category: z.enum(LISTING_CATEGORIES, { required_error: 'Category is required' }),
  brand: z.string().optional(),
  model: z.string().optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  enginePowerHP: z.number().int().positive().optional(),
  workingWidthM: z.number().positive().optional(),
  operatingWeightKg: z.number().int().positive().optional(),
  country: z.enum(['NZ', 'AU'], { required_error: 'Country is required' }),
  region: z.string().min(1, 'Region is required'),
  localArea: z.string().optional(),
  currency: z.enum(['NZD', 'AUD'], { required_error: 'Currency is required' }),
  pricePerDay: z.number().positive('Price per day must be positive'),
  pricePerWeek: z.number().positive().optional(),
  minimumRentalDays: z.number().int().positive().optional(),
  // Bond amount is required (can be 0 but must be explicit)
  bondAmount: z.number().nonnegative('Bond amount must be 0 or greater'),
  // Insurance mode is required
  insuranceMode: z.enum(INSURANCE_MODE, { required_error: 'Insurance mode is required' }),
  insuranceNotes: z.string().max(2000).optional(),
  safetyNotes: z.string().max(2000).optional(),
  damageExcessNotes: z.string().max(2000).optional(),
  // Insurance & risk fields
  safeUseRequirements: z.string().max(2000).optional(),
  maintenanceResponsibilityOwner: z.boolean().default(true),
  estimatedReplacementValue: z.number().positive().optional(),
}

// Schema for creating a draft listing (less strict)
export const createListingSchema = z.object(listingBaseFields)

// Schema for publishing a listing (requires owner confirmations)
export const publishListingSchema = z.object({
  ...listingBaseFields,
  // Required confirmations for publishing
  confirmMaintenanceResponsibility: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm maintenance responsibility to publish' }),
  }),
  confirmInsuranceAccuracy: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm insurance information accuracy to publish' }),
  }),
}).refine(
  (data) => data.bondAmount !== undefined && data.bondAmount !== null,
  { message: 'Bond amount must be explicitly set (can be 0)', path: ['bondAmount'] }
)

export const updateListingSchema = createListingSchema.partial()

export const updateListingStatusSchema = z.object({
  status: z.enum(LISTING_STATUS, { required_error: 'Status is required' })
})

// Booking schemas
export const createBookingSchema = z.object({
  listingId: z.string().min(1, 'Listing ID is required'),
  startDate: z.string().datetime('Invalid start date'),
  endDate: z.string().datetime('Invalid end date'),
  renterNotes: z.string().max(500).optional(),
  
  // Delivery options
  isDelivery: z.boolean().optional(),
  deliveryAddress: z.string().optional(),
  deliveryFee: z.number().nonnegative().optional(),
  deliveryDistanceKm: z.number().nonnegative().optional(),
  
  // ============================================
  // RENTER ACKNOWLEDGEMENTS (required)
  // ============================================
  
  // Platform policy acceptance
  acceptPlatformPolicy: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the platform Insurance & Damage Policy' }),
  }),
  platformPolicyVersion: z.number().int().positive('Platform policy version is required'),
  
  // Owner terms acceptance
  acceptOwnerTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the owner\'s insurance & damage terms for this listing' }),
  }),
  
  // Damage responsibility acceptance
  acceptDamageResponsibility: z.literal(true, {
    errorMap: () => ({ message: 'You must acknowledge damage responsibility' }),
  }),
  
  // Competency confirmation
  confirmCompetency: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm you are legally permitted and competent to operate this machinery' }),
  }),
  
  // Renter insurance confirmation (conditional - will be validated in API)
  confirmRenterInsurance: z.boolean().default(false),
  
  // High-risk requirements acknowledgment (conditional - will be validated in API)
  acceptHighRiskRequirements: z.boolean().default(false),
  
  // Legacy field for backward compatibility
  policyVersionAccepted: z.string().optional(),
}).refine((data) => new Date(data.startDate) < new Date(data.endDate), {
  message: 'End date must be after start date',
  path: ['endDate']
})

// Schema for getting booking prerequisites (insurance panel data)
export const bookingPrerequisitesSchema = z.object({
  listingId: z.string().min(1, 'Listing ID is required'),
})

export const updateBookingStatusSchema = z.object({
  status: z.enum(BOOKING_STATUS, { required_error: 'Status is required' }),
  ownerNotes: z.string().max(500).optional()
})

// Review schemas
export const createReviewSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  targetType: z.enum(REVIEW_TARGET_TYPE),
  targetId: z.string().min(1, 'Target ID is required'),
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().optional(),
  isPublic: z.boolean().default(true)
})

// Message schemas
export const createMessageSchema = z.object({
  conversationId: z.string().min(1, 'Conversation ID is required'),
  content: z.string().min(1, 'Message cannot be empty').max(1000, 'Message must be less than 1000 characters')
})

// Static page schemas
export const createStaticPageSchema = z.object({
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  content: z.string().min(1, 'Content is required'),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  isPublished: z.boolean().default(true)
})

export const updateStaticPageSchema = createStaticPageSchema.partial()

// Query parameter schemas
export const listingsQuerySchema = z.object({
  q: z.string().optional(),
  category: z.enum(LISTING_CATEGORIES).optional(),
  country: z.enum(['NZ', 'AU']).optional(),
  region: z.string().optional(),
  minPrice: z.string().transform(Number).pipe(z.number().nonnegative()).optional(),
  maxPrice: z.string().transform(Number).pipe(z.number().nonnegative()).optional(),
  insuranceMode: z.enum(INSURANCE_MODE).optional(),
  status: z.enum(LISTING_STATUS).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sort: z.enum(['createdAt', 'price', 'rating']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  page: z.string().transform(Number).pipe(z.number().int().positive()).default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(50)).default('12')
})

export const bookingsQuerySchema = z.object({
  status: z.enum(BOOKING_STATUS).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.string().transform(Number).pipe(z.number().int().positive()).default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(50)).default('20')
})

// Notification schemas
export const updateNotificationSchema = z.object({
  isRead: z.boolean()
})

export const createNotificationSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  type: z.enum(NOTIFICATION_TYPE, { required_error: 'Notification type is required' }),
  payload: z.record(z.any())
})

// Availability schemas
export const createAvailabilitySchema = z.object({
  listingId: z.string().min(1, 'Listing ID is required'),
  startDate: z.string().datetime('Invalid start date'),
  endDate: z.string().datetime('Invalid end date'),
  type: z.enum(['UNAVAILABLE_BLOCK'], { required_error: 'Availability type is required' })
}).refine((data) => new Date(data.startDate) < new Date(data.endDate), {
  message: 'End date must be after start date',
  path: ['endDate']
})

export const updateAvailabilitySchema = z.object({
  listingId: z.string().min(1, 'Listing ID is required'),
  startDate: z.string().datetime('Invalid start date'),
  endDate: z.string().datetime('Invalid end date'),
  type: z.enum(['UNAVAILABLE_BLOCK'], { required_error: 'Availability type is required' })
}).refine((data) => new Date(data.startDate) < new Date(data.endDate), {
  message: 'End date must be after start date',
  path: ['endDate']
})

export const createAvailabilityPartialSchema = z.object({
  listingId: z.string().min(1, 'Listing ID is required').optional(),
  startDate: z.string().datetime('Invalid start date').optional(),
  endDate: z.string().datetime('Invalid end date').optional(),
  type: z.enum(['UNAVAILABLE_BLOCK'], { required_error: 'Availability type is required' }).optional()
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) < new Date(data.endDate)
  }
  return true
}, {
  message: 'End date must be after start date',
  path: ['endDate']
})

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type CreateListingInput = z.infer<typeof createListingSchema>
export type UpdateListingInput = z.infer<typeof updateListingSchema>
export type CreateBookingInput = z.infer<typeof createBookingSchema>
export type BookingPrerequisitesInput = z.infer<typeof bookingPrerequisitesSchema>
export type CreateReviewInput = z.infer<typeof createReviewSchema>
export type CreateMessageInput = z.infer<typeof createMessageSchema>
export type ListingsQuery = z.infer<typeof listingsQuerySchema>
export type BookingsQuery = z.infer<typeof bookingsQuerySchema>
