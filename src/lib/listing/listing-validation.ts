/**
 * Listing Validation Service
 * 
 * Server-side validation for listing creation, updates, and publishing.
 * All validation rules are enforced here - UI validation is for UX only.
 */

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { LISTING_CATEGORIES, INSURANCE_MODE } from '@/lib/constants'

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

/**
 * Base listing fields with strict validation
 */
const listingFieldsSchema = z.object({
  // Required fields
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-&',()]+$/, 'Title contains invalid characters'),
  
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(5000, 'Description must be less than 5000 characters'),
  
  category: z.enum(LISTING_CATEGORIES as unknown as [string, ...string[]], {
    required_error: 'Category is required',
    invalid_type_error: 'Invalid category',
  }),
  
  country: z.enum(['NZ', 'AU'], {
    required_error: 'Country is required',
  }),
  
  region: z
    .string()
    .min(1, 'Region is required')
    .max(100, 'Region name too long'),
  
  currency: z.enum(['NZD', 'AUD'], {
    required_error: 'Currency is required',
  }),
  
  // Pricing - required
  pricePerDay: z
    .number()
    .positive('Price per day must be positive')
    .max(100000, 'Price per day exceeds maximum'),
  
  // Insurance - required
  insuranceMode: z.enum(INSURANCE_MODE as unknown as [string, ...string[]], {
    required_error: 'Insurance mode is required',
  }),
  
  // Optional fields
  brand: z.string().max(100).optional().nullable(),
  model: z.string().max(100).optional().nullable(),
  year: z
    .number()
    .int()
    .min(1900, 'Year must be 1900 or later')
    .max(new Date().getFullYear() + 1, 'Year cannot be in the future')
    .optional()
    .nullable(),
  
  localArea: z.string().max(100).optional().nullable(),
  
  pricePerWeek: z
    .number()
    .positive('Weekly price must be positive')
    .max(500000, 'Weekly price exceeds maximum')
    .optional()
    .nullable(),
  
  minimumRentalDays: z
    .number()
    .int()
    .min(1, 'Minimum rental must be at least 1 day')
    .max(365, 'Minimum rental cannot exceed 365 days')
    .optional()
    .nullable(),
  
  bondAmount: z
    .number()
    .nonnegative('Bond amount cannot be negative')
    .max(1000000, 'Bond amount exceeds maximum')
    .optional()
    .nullable(),
  
  insuranceNotes: z.string().max(2000).optional().nullable(),
  safetyNotes: z.string().max(2000).optional().nullable(),
  
  // Delivery options
  deliveryMode: z.enum(['PICKUP_ONLY', 'DELIVERY_ONLY', 'PICKUP_OR_DELIVERY']).optional(),
  deliveryFlatFee: z.number().nonnegative().max(10000).optional().nullable(),
  deliveryRadiusKm: z.number().int().positive().max(1000).optional().nullable(),
  pickupAddress: z.string().max(500).optional().nullable(),
  
  // Equipment specs
  enginePowerHP: z.number().int().positive().max(10000).optional().nullable(),
  workingWidthM: z.number().positive().max(100).optional().nullable(),
  operatingWeightKg: z.number().int().positive().max(1000000).optional().nullable(),
  
  // Value for risk assessment
  estimatedReplacementValue: z.number().positive().max(10000000).optional().nullable(),
})

/**
 * Schema for creating a new listing (draft)
 */
export const createListingSchema = listingFieldsSchema.extend({
  // Photos are optional for draft
  photos: z.array(z.object({
    url: z.string().url(),
    isPrimary: z.boolean().optional(),
  })).optional(),
})

/**
 * Schema for publishing a listing (stricter requirements)
 */
export const publishListingSchema = listingFieldsSchema.extend({
  // Bond must be explicitly set for publishing
  bondAmount: z
    .number()
    .nonnegative('Bond amount cannot be negative')
    .max(1000000, 'Bond amount exceeds maximum'),
  
  // Must have at least one photo
  photos: z.array(z.object({
    url: z.string().url(),
    isPrimary: z.boolean().optional(),
  })).min(1, 'At least one photo is required to publish'),
  
  // Owner confirmations required
  confirmMaintenanceResponsibility: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm maintenance responsibility' }),
  }),
  confirmInsuranceAccuracy: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm insurance accuracy' }),
  }),
})

/**
 * Schema for updating a listing
 */
export const updateListingSchema = listingFieldsSchema.partial()

// =============================================================================
// VALIDATION TYPES
// =============================================================================

export type CreateListingInput = z.infer<typeof createListingSchema>
export type PublishListingInput = z.infer<typeof publishListingSchema>
export type UpdateListingInput = z.infer<typeof updateListingSchema>

export interface ValidationResult {
  valid: boolean
  errors: Array<{
    field: string
    message: string
  }>
  warnings: Array<{
    field: string
    message: string
  }>
}

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validate listing creation input
 */
export function validateCreateListing(input: unknown): ValidationResult {
  const result = createListingSchema.safeParse(input)
  
  if (result.success) {
    return {
      valid: true,
      errors: [],
      warnings: generateWarnings(result.data),
    }
  }
  
  return {
    valid: false,
    errors: result.error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    })),
    warnings: [],
  }
}

/**
 * Validate listing for publishing
 */
export function validatePublishListing(input: unknown): ValidationResult {
  const result = publishListingSchema.safeParse(input)
  
  if (result.success) {
    return {
      valid: true,
      errors: [],
      warnings: generateWarnings(result.data),
    }
  }
  
  return {
    valid: false,
    errors: result.error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    })),
    warnings: [],
  }
}

/**
 * Validate listing update input
 */
export function validateUpdateListing(input: unknown): ValidationResult {
  const result = updateListingSchema.safeParse(input)
  
  if (result.success) {
    return {
      valid: true,
      errors: [],
      warnings: generateWarnings(result.data),
    }
  }
  
  return {
    valid: false,
    errors: result.error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    })),
    warnings: [],
  }
}

/**
 * Generate warnings for optional but recommended fields
 */
function generateWarnings(data: Partial<CreateListingInput>): Array<{ field: string; message: string }> {
  const warnings: Array<{ field: string; message: string }> = []
  
  if (!data.brand) {
    warnings.push({ field: 'brand', message: 'Adding a brand helps renters find your listing' })
  }
  
  if (!data.model) {
    warnings.push({ field: 'model', message: 'Adding a model helps renters understand what they\'re renting' })
  }
  
  if (!data.year) {
    warnings.push({ field: 'year', message: 'Adding the year helps set renter expectations' })
  }
  
  if (!data.pricePerWeek && data.pricePerDay) {
    warnings.push({ field: 'pricePerWeek', message: 'Consider adding a weekly rate for longer rentals' })
  }
  
  if (data.insuranceMode !== 'NONE' && !data.insuranceNotes) {
    warnings.push({ field: 'insuranceNotes', message: 'Consider adding insurance details for renters' })
  }
  
  if (!data.safetyNotes) {
    warnings.push({ field: 'safetyNotes', message: 'Consider adding safety notes for renters' })
  }
  
  return warnings
}

// =============================================================================
// BUSINESS RULE VALIDATION
// =============================================================================

/**
 * Validate pricing consistency
 */
export function validatePricing(
  pricePerDay: number,
  pricePerWeek?: number | null,
  minimumRentalDays?: number | null
): ValidationResult {
  const errors: Array<{ field: string; message: string }> = []
  const warnings: Array<{ field: string; message: string }> = []
  
  // Weekly price should be less than 7x daily price (discount expected)
  if (pricePerWeek && pricePerWeek >= pricePerDay * 7) {
    warnings.push({
      field: 'pricePerWeek',
      message: 'Weekly price is not discounted from daily rate - consider offering a weekly discount',
    })
  }
  
  // Weekly price should be at least 3x daily price
  if (pricePerWeek && pricePerWeek < pricePerDay * 3) {
    errors.push({
      field: 'pricePerWeek',
      message: 'Weekly price seems too low - must be at least 3x daily rate',
    })
  }
  
  // Minimum rental days validation
  if (minimumRentalDays && minimumRentalDays > 30) {
    warnings.push({
      field: 'minimumRentalDays',
      message: 'High minimum rental period may reduce bookings',
    })
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate availability dates
 */
export function validateAvailability(
  startDate: Date,
  endDate: Date
): ValidationResult {
  const errors: Array<{ field: string; message: string }> = []
  const warnings: Array<{ field: string; message: string }> = []
  const now = new Date()
  
  // Start date must be in the future
  if (startDate < now) {
    errors.push({
      field: 'startDate',
      message: 'Availability start date must be in the future',
    })
  }
  
  // End date must be after start date
  if (endDate <= startDate) {
    errors.push({
      field: 'endDate',
      message: 'End date must be after start date',
    })
  }
  
  // Warn if availability is very short
  const durationDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  if (durationDays < 7) {
    warnings.push({
      field: 'endDate',
      message: 'Short availability window may limit bookings',
    })
  }
  
  // Warn if availability is very far in the future
  const daysFromNow = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  if (daysFromNow > 365) {
    warnings.push({
      field: 'startDate',
      message: 'Availability more than a year away may not be accurate',
    })
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate ownership - ensure user can create/modify listing
 */
export async function validateOwnership(
  userId: string,
  listingId?: string
): Promise<ValidationResult> {
  const errors: Array<{ field: string; message: string }> = []
  
  // Check user exists and has correct role
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      isSuspended: true,
      verificationStatus: true,
    },
  })
  
  if (!user) {
    errors.push({ field: 'userId', message: 'User not found' })
    return { valid: false, errors, warnings: [] }
  }
  
  if (user.isSuspended) {
    errors.push({ field: 'userId', message: 'Account is suspended' })
    return { valid: false, errors, warnings: [] }
  }
  
  if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
    errors.push({ field: 'userId', message: 'Only owners can create or modify listings' })
    return { valid: false, errors, warnings: [] }
  }
  
  // If updating existing listing, verify ownership
  if (listingId) {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { ownerId: true, isDeleted: true },
    })
    
    if (!listing) {
      errors.push({ field: 'listingId', message: 'Listing not found' })
      return { valid: false, errors, warnings: [] }
    }
    
    if (listing.isDeleted) {
      errors.push({ field: 'listingId', message: 'Listing has been deleted' })
      return { valid: false, errors, warnings: [] }
    }
    
    if (listing.ownerId !== userId && user.role !== 'ADMIN') {
      errors.push({ field: 'listingId', message: 'You do not own this listing' })
      return { valid: false, errors, warnings: [] }
    }
  }
  
  return { valid: true, errors: [], warnings: [] }
}

/**
 * Check for potential orphaned listing (listing without required relations)
 */
export async function checkOrphanedListing(listingId: string): Promise<{
  isOrphaned: boolean
  issues: string[]
}> {
  const issues: string[] = []
  
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      ownerId: true,
      status: true,
      title: true,
      description: true,
      category: true,
      pricePerDay: true,
      insuranceMode: true,
      owner: {
        select: { id: true, isSuspended: true },
      },
      photos: {
        select: { id: true },
        take: 1,
      },
    },
  })
  
  if (!listing) {
    return { isOrphaned: true, issues: ['Listing not found'] }
  }
  
  // Check owner exists and is active
  if (!listing.owner) {
    issues.push('Owner account not found')
  } else if (listing.owner.isSuspended) {
    issues.push('Owner account is suspended')
  }
  
  // Check required fields for non-draft listings
  if (listing.status !== 'DRAFT') {
    if (!listing.title) issues.push('Missing title')
    if (!listing.description) issues.push('Missing description')
    if (!listing.category) issues.push('Missing category')
    if (!listing.pricePerDay) issues.push('Missing price')
    if (!listing.insuranceMode) issues.push('Missing insurance mode')
    if (listing.photos.length === 0) issues.push('No photos uploaded')
  }
  
  return {
    isOrphaned: issues.length > 0,
    issues,
  }
}

/**
 * Validate complete listing before status change
 */
export async function validateListingComplete(listingId: string): Promise<ValidationResult> {
  const errors: Array<{ field: string; message: string }> = []
  const warnings: Array<{ field: string; message: string }> = []
  
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: {
      photos: true,
      owner: {
        select: {
          verificationStatus: true,
          businessVerified: true,
        },
      },
    },
  })
  
  if (!listing) {
    errors.push({ field: 'listingId', message: 'Listing not found' })
    return { valid: false, errors, warnings }
  }
  
  // Required fields
  if (!listing.title || listing.title.length < 5) {
    errors.push({ field: 'title', message: 'Title is required (min 5 characters)' })
  }
  
  if (!listing.description || listing.description.length < 20) {
    errors.push({ field: 'description', message: 'Description is required (min 20 characters)' })
  }
  
  if (!listing.category) {
    errors.push({ field: 'category', message: 'Category is required' })
  }
  
  if (!listing.country || !listing.region) {
    errors.push({ field: 'location', message: 'Location (country and region) is required' })
  }
  
  if (!listing.pricePerDay || Number(listing.pricePerDay) <= 0) {
    errors.push({ field: 'pricePerDay', message: 'Price per day is required' })
  }
  
  if (!listing.currency) {
    errors.push({ field: 'currency', message: 'Currency is required' })
  }
  
  if (!listing.insuranceMode) {
    errors.push({ field: 'insuranceMode', message: 'Insurance mode is required' })
  }
  
  if (listing.bondAmount === null || listing.bondAmount === undefined) {
    errors.push({ field: 'bondAmount', message: 'Bond amount must be set (can be $0)' })
  }
  
  // Photos required for publishing
  if (listing.photos.length === 0) {
    errors.push({ field: 'photos', message: 'At least one photo is required' })
  }
  
  // Warnings
  if (listing.owner && listing.owner.verificationStatus !== 'VERIFIED') {
    warnings.push({ field: 'owner', message: 'Owner account is not verified - this may affect trust' })
  }
  
  if (listing.isHighValue && listing.owner && !listing.owner.businessVerified) {
    warnings.push({ field: 'owner', message: 'High-value listing but business not verified' })
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

// =============================================================================
// CURRENCY VALIDATION
// =============================================================================

/**
 * Validate currency matches country
 */
export function validateCurrencyCountryMatch(
  country: 'NZ' | 'AU',
  currency: 'NZD' | 'AUD'
): ValidationResult {
  const errors: Array<{ field: string; message: string }> = []
  const warnings: Array<{ field: string; message: string }> = []
  
  // Recommend matching currency to country
  if (country === 'NZ' && currency === 'AUD') {
    warnings.push({
      field: 'currency',
      message: 'Listing in New Zealand but using AUD - consider using NZD',
    })
  }
  
  if (country === 'AU' && currency === 'NZD') {
    warnings.push({
      field: 'currency',
      message: 'Listing in Australia but using NZD - consider using AUD',
    })
  }
  
  return { valid: true, errors, warnings }
}
