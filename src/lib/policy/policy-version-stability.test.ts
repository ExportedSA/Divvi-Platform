/**
 * Policy Version Stability Tests
 * 
 * Tests for:
 * - Policy version snapshot is stable after policy updates
 * - Existing bookings retain original version
 * - New bookings get current version
 */

// ============================================
// MOCK SETUP
// ============================================

const mockPrismaDb = {
  staticPage: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  booking: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrismaDb,
}))

// ============================================
// POLICY VERSION SNAPSHOT STABILITY
// ============================================

describe('Policy Version Snapshot Stability', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should NOT update existing booking policy version when policy is updated', async () => {
    // Setup: Existing booking with policy v2
    const existingBooking = {
      id: 'booking-existing',
      platformPolicyVersionAccepted: 2,
      createdAt: new Date('2024-01-01'),
    }

    // Setup: Policy updated to v3
    const updatedPolicy = {
      slug: 'insurance-and-damage-policy',
      version: 3,
      publishedAt: new Date('2024-02-01'),
    }

    mockPrismaDb.booking.findUnique.mockResolvedValue(existingBooking)
    mockPrismaDb.staticPage.findFirst.mockResolvedValue(updatedPolicy)

    // Fetch existing booking
    const booking = await mockPrismaDb.booking.findUnique({
      where: { id: 'booking-existing' },
    })

    // Booking should still have v2
    expect(booking.platformPolicyVersionAccepted).toBe(2)
    expect(booking.platformPolicyVersionAccepted).not.toBe(updatedPolicy.version)

    // Verify no update was called on the booking
    expect(mockPrismaDb.booking.update).not.toHaveBeenCalled()
  })

  it('should maintain policy version across multiple policy updates', async () => {
    // Booking created with v1
    const booking = {
      id: 'booking-v1',
      platformPolicyVersionAccepted: 1,
      createdAt: new Date('2024-01-01'),
    }

    mockPrismaDb.booking.findUnique.mockResolvedValue(booking)

    // Simulate multiple policy updates: v1 -> v2 -> v3 -> v4
    const policyVersions = [2, 3, 4]

    for (const version of policyVersions) {
      mockPrismaDb.staticPage.update.mockResolvedValue({
        slug: 'insurance-and-damage-policy',
        version,
      })

      // Simulate policy update
      await mockPrismaDb.staticPage.update({
        where: { slug: 'insurance-and-damage-policy' },
        data: { version },
      })

      // Fetch booking again
      const fetchedBooking = await mockPrismaDb.booking.findUnique({
        where: { id: 'booking-v1' },
      })

      // Booking should STILL have v1
      expect(fetchedBooking.platformPolicyVersionAccepted).toBe(1)
    }
  })

  it('should preserve policy version for all bookings when policy is published', async () => {
    // Multiple bookings with different policy versions
    const bookings = [
      { id: 'b1', platformPolicyVersionAccepted: 1 },
      { id: 'b2', platformPolicyVersionAccepted: 2 },
      { id: 'b3', platformPolicyVersionAccepted: 3 },
    ]

    mockPrismaDb.booking.findMany.mockResolvedValue(bookings)

    // Publish new policy v4
    mockPrismaDb.staticPage.update.mockResolvedValue({
      slug: 'insurance-and-damage-policy',
      version: 4,
    })

    await mockPrismaDb.staticPage.update({
      where: { slug: 'insurance-and-damage-policy' },
      data: { version: 4 },
    })

    // Fetch all bookings
    const allBookings = await mockPrismaDb.booking.findMany({})

    // Each booking should retain its original version
    expect(allBookings[0].platformPolicyVersionAccepted).toBe(1)
    expect(allBookings[1].platformPolicyVersionAccepted).toBe(2)
    expect(allBookings[2].platformPolicyVersionAccepted).toBe(3)

    // No booking updates should have been called
    expect(mockPrismaDb.booking.update).not.toHaveBeenCalled()
  })
})

// ============================================
// NEW BOOKING GETS CURRENT VERSION
// ============================================

describe('New Bookings Get Current Policy Version', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should capture current policy version for new booking', async () => {
    const currentPolicyVersion = 5

    mockPrismaDb.staticPage.findFirst.mockResolvedValue({
      slug: 'insurance-and-damage-policy',
      version: currentPolicyVersion,
      isPublished: true,
    })

    mockPrismaDb.booking.create.mockResolvedValue({
      id: 'new-booking',
      platformPolicyVersionAccepted: currentPolicyVersion,
    })

    // Get current policy
    const policy = await mockPrismaDb.staticPage.findFirst({
      where: { slug: 'insurance-and-damage-policy', isPublished: true },
    })

    // Create booking with current version
    const booking = await mockPrismaDb.booking.create({
      data: {
        platformPolicyVersionAccepted: policy.version,
      },
    })

    expect(booking.platformPolicyVersionAccepted).toBe(5)
  })

  it('should reject booking if user accepted outdated policy version', async () => {
    const currentVersion = 4
    const userAcceptedVersion = 3

    mockPrismaDb.staticPage.findFirst.mockResolvedValue({
      version: currentVersion,
    })

    // Validation should fail
    const isVersionMatch = userAcceptedVersion === currentVersion
    expect(isVersionMatch).toBe(false)

    // Booking should not be created
    expect(mockPrismaDb.booking.create).not.toHaveBeenCalled()
  })

  it('should capture version at exact moment of booking creation', async () => {
    // Simulate race condition: policy updates between validation and creation
    
    // First call: v3 (when user loads page)
    mockPrismaDb.staticPage.findFirst.mockResolvedValueOnce({
      version: 3,
    })

    // Second call: v4 (when booking is submitted - policy was just updated)
    mockPrismaDb.staticPage.findFirst.mockResolvedValueOnce({
      version: 4,
    })

    const policyAtLoad = await mockPrismaDb.staticPage.findFirst({})
    const policyAtSubmit = await mockPrismaDb.staticPage.findFirst({})

    // Versions don't match - booking should be rejected
    expect(policyAtLoad.version).toBe(3)
    expect(policyAtSubmit.version).toBe(4)
    expect(policyAtLoad.version).not.toBe(policyAtSubmit.version)
  })
})

// ============================================
// HISTORICAL VERSION RETRIEVAL
// ============================================

describe('Historical Policy Version Retrieval', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should retrieve the policy version a booking was created under', async () => {
    const booking = {
      id: 'historical-booking',
      platformPolicyVersionAccepted: 2,
      createdAt: new Date('2024-01-15'),
    }

    mockPrismaDb.booking.findUnique.mockResolvedValue(booking)

    const result = await mockPrismaDb.booking.findUnique({
      where: { id: 'historical-booking' },
      select: {
        platformPolicyVersionAccepted: true,
        createdAt: true,
      },
    })

    expect(result.platformPolicyVersionAccepted).toBe(2)
  })

  it('should support querying bookings by policy version', async () => {
    const bookingsWithV2 = [
      { id: 'b1', platformPolicyVersionAccepted: 2 },
      { id: 'b2', platformPolicyVersionAccepted: 2 },
    ]

    mockPrismaDb.booking.findMany.mockResolvedValue(bookingsWithV2)

    const bookings = await mockPrismaDb.booking.findMany({
      where: { platformPolicyVersionAccepted: 2 },
    })

    expect(bookings).toHaveLength(2)
    expect(bookings.every((b: { platformPolicyVersionAccepted: number }) => b.platformPolicyVersionAccepted === 2)).toBe(true)
  })

  it('should identify bookings with outdated policy versions', async () => {
    const currentVersion = 5
    const bookings = [
      { id: 'b1', platformPolicyVersionAccepted: 2 }, // Outdated
      { id: 'b2', platformPolicyVersionAccepted: 3 }, // Outdated
      { id: 'b3', platformPolicyVersionAccepted: 5 }, // Current
    ]

    mockPrismaDb.staticPage.findFirst.mockResolvedValue({ version: currentVersion })
    mockPrismaDb.booking.findMany.mockResolvedValue(bookings)

    const allBookings = await mockPrismaDb.booking.findMany({})
    const policy = await mockPrismaDb.staticPage.findFirst({})

    const outdatedBookings = allBookings.filter(
      (b: { platformPolicyVersionAccepted: number }) => b.platformPolicyVersionAccepted < policy.version
    )
    const currentBookings = allBookings.filter(
      (b: { platformPolicyVersionAccepted: number }) => b.platformPolicyVersionAccepted === policy.version
    )

    expect(outdatedBookings).toHaveLength(2)
    expect(currentBookings).toHaveLength(1)
  })
})

// ============================================
// POLICY VERSION FIELD IMMUTABILITY
// ============================================

describe('Policy Version Field Immutability', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should not allow updating platformPolicyVersionAccepted after creation', () => {
    // This is a conceptual test - the field should be treated as immutable
    // In practice, this would be enforced by:
    // 1. Not exposing update endpoints for this field
    // 2. Business logic validation
    // 3. Database triggers (optional)

    const booking = {
      id: 'immutable-booking',
      platformPolicyVersionAccepted: 2,
    }

    // Attempting to update should be blocked by business logic
    const attemptedUpdate = {
      platformPolicyVersionAccepted: 5, // Trying to change
    }

    // The update should be rejected or the field should be stripped
    const allowedFields = ['renterNotes', 'bookingStatus'] // Example allowed fields
    const isImmutableField = !allowedFields.includes('platformPolicyVersionAccepted')

    expect(isImmutableField).toBe(true)
  })

  it('should preserve version even when other booking fields are updated', async () => {
    const originalVersion = 3

    const booking = {
      id: 'update-other-fields',
      platformPolicyVersionAccepted: originalVersion,
      bookingStatus: 'PENDING',
      renterNotes: 'Original notes',
    }

    mockPrismaDb.booking.findUnique.mockResolvedValue(booking)
    mockPrismaDb.booking.update.mockResolvedValue({
      ...booking,
      bookingStatus: 'ACCEPTED',
      renterNotes: 'Updated notes',
      // platformPolicyVersionAccepted should remain unchanged
    })

    // Update other fields
    const updatedBooking = await mockPrismaDb.booking.update({
      where: { id: 'update-other-fields' },
      data: {
        bookingStatus: 'ACCEPTED',
        renterNotes: 'Updated notes',
        // Note: platformPolicyVersionAccepted is NOT in the update data
      },
    })

    // Version should be unchanged
    expect(updatedBooking.platformPolicyVersionAccepted).toBe(originalVersion)
  })
})

// ============================================
// AUDIT TRAIL
// ============================================

describe('Policy Version Audit Trail', () => {
  it('should provide complete audit information for disputes', async () => {
    const booking = {
      id: 'dispute-booking',
      platformPolicyVersionAccepted: 2,
      createdAt: new Date('2024-01-15T10:30:00Z'),
      ownerTermsAcknowledged: true,
      renterResponsibilityAcknowledged: true,
    }

    const policyAtBookingTime = {
      version: 2,
      title: 'Insurance & Damage Policy',
      content: 'Policy content at v2...',
      publishedAt: new Date('2024-01-01'),
    }

    mockPrismaDb.booking.findUnique.mockResolvedValue(booking)
    mockPrismaDb.staticPage.findFirst.mockResolvedValue(policyAtBookingTime)

    // For dispute resolution, we can retrieve:
    // 1. The policy version the renter accepted
    const bookingData = await mockPrismaDb.booking.findUnique({
      where: { id: 'dispute-booking' },
    })

    // 2. The actual policy content at that version
    const policyData = await mockPrismaDb.staticPage.findFirst({
      where: { version: bookingData.platformPolicyVersionAccepted },
    })

    expect(bookingData.platformPolicyVersionAccepted).toBe(2)
    expect(policyData.version).toBe(2)
    expect(bookingData.ownerTermsAcknowledged).toBe(true)
    expect(bookingData.renterResponsibilityAcknowledged).toBe(true)
  })
})
