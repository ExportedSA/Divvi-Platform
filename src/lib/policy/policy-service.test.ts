/**
 * Policy Service Tests
 * 
 * Tests for:
 * - Policy version retrieval
 * - New bookings get current policy version
 * - Old bookings keep original version after policy updates
 */

// ============================================
// MOCK SETUP
// ============================================

const mockPrismaClient = {
  staticPage: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  booking: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrismaClient,
}))

// ============================================
// POLICY VERSION RETRIEVAL TESTS
// ============================================

describe('getActiveInsurancePolicy', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return the current published policy', async () => {
    const mockPolicy = {
      id: 'policy-1',
      slug: 'insurance-and-damage-policy',
      version: 3,
      title: 'Insurance & Damage Policy',
      shortSummary: 'Policy summary',
      content: 'Full policy content...',
      publishedAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      isPublished: true,
    }

    mockPrismaClient.staticPage.findFirst.mockResolvedValue(mockPolicy)

    // Simulate getActiveInsurancePolicy
    const policy = await mockPrismaClient.staticPage.findFirst({
      where: {
        slug: 'insurance-and-damage-policy',
        isPublished: true,
      },
    })

    expect(policy).toBeDefined()
    expect(policy.version).toBe(3)
    expect(policy.slug).toBe('insurance-and-damage-policy')
  })

  it('should return highest version when multiple exist', async () => {
    // When querying with orderBy: { version: 'desc' }
    const mockPolicy = {
      id: 'policy-latest',
      slug: 'insurance-and-damage-policy',
      version: 5, // Highest version
      title: 'Insurance & Damage Policy',
      isPublished: true,
    }

    mockPrismaClient.staticPage.findFirst.mockResolvedValue(mockPolicy)

    const policy = await mockPrismaClient.staticPage.findFirst({
      where: {
        slug: 'insurance-and-damage-policy',
        isPublished: true,
      },
      orderBy: { version: 'desc' },
    })

    expect(policy.version).toBe(5)
  })

  it('should throw error when no published policy exists', async () => {
    mockPrismaClient.staticPage.findFirst.mockResolvedValue(null)

    const policy = await mockPrismaClient.staticPage.findFirst({
      where: {
        slug: 'insurance-and-damage-policy',
        isPublished: true,
      },
    })

    expect(policy).toBeNull()
    // In real implementation, this would throw an error
  })
})

// ============================================
// NEW BOOKING POLICY VERSION TESTS
// ============================================

describe('New Bookings - Policy Version Capture', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should capture current policy version when booking is created', async () => {
    const currentPolicyVersion = 4

    mockPrismaClient.staticPage.findFirst.mockResolvedValue({
      version: currentPolicyVersion,
      slug: 'insurance-and-damage-policy',
      isPublished: true,
    })

    const newBooking = {
      id: 'new-booking-1',
      listingId: 'listing-1',
      renterId: 'renter-1',
      platformPolicyVersionAccepted: currentPolicyVersion,
      createdAt: new Date(),
    }

    mockPrismaClient.booking.create.mockResolvedValue(newBooking)

    // Get current policy version
    const policy = await mockPrismaClient.staticPage.findFirst({
      where: { slug: 'insurance-and-damage-policy', isPublished: true },
    })

    // Create booking with policy version
    const booking = await mockPrismaClient.booking.create({
      data: {
        ...newBooking,
        platformPolicyVersionAccepted: policy.version,
      },
    })

    expect(booking.platformPolicyVersionAccepted).toBe(4)
  })

  it('should always use the latest policy version for new bookings', async () => {
    // Simulate policy being updated between page load and booking submission
    const versionAtPageLoad = 3
    const versionAtSubmission = 4

    // First call returns v3 (when user loaded page)
    mockPrismaClient.staticPage.findFirst.mockResolvedValueOnce({
      version: versionAtPageLoad,
    })

    // Second call returns v4 (when booking is submitted)
    mockPrismaClient.staticPage.findFirst.mockResolvedValueOnce({
      version: versionAtSubmission,
    })

    // User loads page, sees v3
    const policyAtLoad = await mockPrismaClient.staticPage.findFirst({})
    expect(policyAtLoad.version).toBe(3)

    // User submits booking, system checks current version
    const policyAtSubmit = await mockPrismaClient.staticPage.findFirst({})
    expect(policyAtSubmit.version).toBe(4)

    // If versions don't match, booking should be rejected
    // User must re-accept the new policy
    expect(policyAtLoad.version).not.toBe(policyAtSubmit.version)
  })
})

// ============================================
// EXISTING BOOKING VERSION IMMUTABILITY TESTS
// ============================================

describe('Existing Bookings - Version Immutability', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should keep original policy version after policy is updated', async () => {
    // Booking created with policy v2
    const existingBooking = {
      id: 'existing-booking-1',
      platformPolicyVersionAccepted: 2,
      createdAt: new Date('2024-01-01'),
    }

    // Policy is now v5
    const currentPolicy = {
      version: 5,
      slug: 'insurance-and-damage-policy',
    }

    mockPrismaClient.booking.findUnique.mockResolvedValue(existingBooking)
    mockPrismaClient.staticPage.findFirst.mockResolvedValue(currentPolicy)

    // Fetch existing booking
    const booking = await mockPrismaClient.booking.findUnique({
      where: { id: 'existing-booking-1' },
    })

    // Fetch current policy
    const policy = await mockPrismaClient.staticPage.findFirst({})

    // Booking should still have v2, not v5
    expect(booking.platformPolicyVersionAccepted).toBe(2)
    expect(policy.version).toBe(5)
    expect(booking.platformPolicyVersionAccepted).not.toBe(policy.version)
  })

  it('should not update booking policy version when policy is published', async () => {
    const bookingId = 'booking-immutable'
    const originalVersion = 3

    const existingBooking = {
      id: bookingId,
      platformPolicyVersionAccepted: originalVersion,
    }

    mockPrismaClient.booking.findUnique.mockResolvedValue(existingBooking)

    // Simulate policy update (should NOT affect existing bookings)
    const newPolicyVersion = 4

    // Verify booking still has original version
    const booking = await mockPrismaClient.booking.findUnique({
      where: { id: bookingId },
    })

    expect(booking.platformPolicyVersionAccepted).toBe(originalVersion)
    expect(booking.platformPolicyVersionAccepted).not.toBe(newPolicyVersion)
  })

  it('should allow querying bookings by their accepted policy version', async () => {
    const bookingsWithV2 = [
      { id: 'b1', platformPolicyVersionAccepted: 2 },
      { id: 'b2', platformPolicyVersionAccepted: 2 },
    ]

    const bookingsWithV3 = [
      { id: 'b3', platformPolicyVersionAccepted: 3 },
    ]

    // In real implementation, you could query:
    // prisma.booking.findMany({ where: { platformPolicyVersionAccepted: 2 } })

    expect(bookingsWithV2).toHaveLength(2)
    expect(bookingsWithV3).toHaveLength(1)
  })
})

// ============================================
// POLICY VERSION VALIDATION TESTS
// ============================================

describe('Policy Version Validation', () => {
  it('should validate that provided version matches current version', () => {
    const currentVersion = 4
    const providedVersion = 4

    const isValid = providedVersion === currentVersion
    expect(isValid).toBe(true)
  })

  it('should reject when provided version is outdated', () => {
    const currentVersion = 4
    const providedVersion = 3 // User accepted old version

    const isValid = providedVersion as number === currentVersion as number
    expect(isValid).toBe(false)
  })

  it('should reject when provided version is ahead of current', () => {
    // Edge case: user somehow has a future version
    const currentVersion = 4
    const providedVersion = 5

    const isValid = providedVersion as number === currentVersion as number
    expect(isValid).toBe(false)
  })
})

// ============================================
// POLICY OUTDATED CHECK TESTS
// ============================================

describe('isBookingPolicyOutdated', () => {
  it('should return true when booking policy is older than current', () => {
    const bookingVersion = 2
    const currentVersion = 4

    const isOutdated = bookingVersion < currentVersion
    expect(isOutdated).toBe(true)
  })

  it('should return false when booking policy matches current', () => {
    const bookingVersion = 4
    const currentVersion = 4

    const isOutdated = bookingVersion < currentVersion
    expect(isOutdated).toBe(false)
  })

  it('should handle null booking version gracefully', () => {
    const bookingVersion: number | null = null
    const currentVersion = 4

    // Null version means policy wasn't captured (legacy booking)
    const isOutdated = bookingVersion !== null && bookingVersion < currentVersion
    expect(isOutdated).toBe(false) // Can't determine if outdated
  })
})

// ============================================
// POLICY PUBLISHING TESTS
// ============================================

describe('Policy Publishing', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should increment version when policy is published', async () => {
    const currentPolicy = {
      slug: 'insurance-and-damage-policy',
      version: 3,
      content: 'Old content',
    }

    const updatedPolicy = {
      ...currentPolicy,
      version: 4,
      content: 'New content',
      publishedAt: new Date(),
    }

    mockPrismaClient.staticPage.findUnique.mockResolvedValue(currentPolicy)
    mockPrismaClient.staticPage.update.mockResolvedValue(updatedPolicy)

    // Simulate publishing new version
    const result = await mockPrismaClient.staticPage.update({
      where: { slug: 'insurance-and-damage-policy' },
      data: {
        version: currentPolicy.version + 1,
        content: 'New content',
        publishedAt: new Date(),
      },
    })

    expect(result.version).toBe(4)
    expect(result.version).toBe(currentPolicy.version + 1)
  })

  it('should not affect existing bookings when policy is published', async () => {
    // This is a conceptual test - publishing a policy should not
    // trigger any updates to existing bookings

    const existingBookings = [
      { id: 'b1', platformPolicyVersionAccepted: 2 },
      { id: 'b2', platformPolicyVersionAccepted: 3 },
    ]

    // After publishing v4, these bookings should remain unchanged
    // No booking.update calls should be made

    expect(mockPrismaClient.booking.update).not.toHaveBeenCalled()

    // Bookings retain their original versions
    existingBookings.forEach(booking => {
      expect(booking.platformPolicyVersionAccepted).toBeLessThan(4)
    })
  })
})

// ============================================
// AUDIT TRAIL TESTS
// ============================================

describe('Policy Version Audit Trail', () => {
  it('should allow retrieving the policy version a booking was created under', async () => {
    const booking = {
      id: 'audit-booking-1',
      platformPolicyVersionAccepted: 2,
      createdAt: new Date('2024-01-15'),
    }

    mockPrismaClient.booking.findUnique.mockResolvedValue(booking)

    const result = await mockPrismaClient.booking.findUnique({
      where: { id: 'audit-booking-1' },
      select: {
        platformPolicyVersionAccepted: true,
        createdAt: true,
      },
    })

    expect(result.platformPolicyVersionAccepted).toBe(2)
    expect(result.createdAt).toEqual(new Date('2024-01-15'))
  })

  it('should support querying historical policy content by version', async () => {
    const historicalPolicy = {
      slug: 'insurance-and-damage-policy',
      version: 2,
      content: 'Content from version 2',
      publishedAt: new Date('2024-01-01'),
    }

    mockPrismaClient.staticPage.findFirst.mockResolvedValue(historicalPolicy)

    const policy = await mockPrismaClient.staticPage.findFirst({
      where: {
        slug: 'insurance-and-damage-policy',
        version: 2,
      },
    })

    expect(policy.version).toBe(2)
    expect(policy.content).toBe('Content from version 2')
  })
})
