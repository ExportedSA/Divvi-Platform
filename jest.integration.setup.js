import { jest } from '@jest/globals'

// Mock Prisma for integration tests
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    listing: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    booking: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    review: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    notification: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    conversation: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    message: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    staticPage: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    policy: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    policyAcknowledgement: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

// Mock NextAuth for integration tests
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

// Mock bcrypt for integration tests
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}))

// Mock file system operations
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  writeFile: jest.fn(),
  readFile: jest.fn(),
}))

// Mock fetch for API calls
global.fetch = jest.fn()

// Mock environment variables for integration tests
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db'
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-integration-tests'
process.env.NEXTAUTH_URL = 'http://localhost:3000'

// Integration test timeout
jest.setTimeout(30000)

// Global test data for integration tests
global.testData = {
  users: {
    owner: {
      id: 'test-owner-id',
      email: 'owner@test.com',
      name: 'Test Owner',
      role: 'OWNER',
    },
    renter: {
      id: 'test-renter-id',
      email: 'renter@test.com',
      name: 'Test Renter',
      role: 'RENTER',
    },
    admin: {
      id: 'test-admin-id',
      email: 'admin@test.com',
      name: 'Test Admin',
      role: 'ADMIN',
    },
  },
  listings: {
    tractor: {
      id: 'test-listing-id',
      title: 'Test Tractor',
      description: 'A test tractor for integration testing',
      category: 'TRACTOR',
      brand: 'Test Brand',
      model: 'Test Model',
      year: 2023,
      pricePerDay: 500,
      pricePerWeek: 3000,
      minimumRentalDays: 1,
      bondAmount: 1000,
      status: 'LIVE',
    },
  },
  bookings: {
    pending: {
      id: 'test-booking-id',
      status: 'PENDING',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-02-03'),
      rentalTotal: 1000,
      bondAmountAtBooking: 500,
    },
  },
}

// Helper functions for integration tests
global.helpers = {
  createMockSession: (user) => ({
    user: {
      ...user,
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    expires: '2024-12-31T23:59:59.999Z',
  }),
  
  createMockRequest: (method = 'GET', body = {}, headers = {}) => ({
    method,
    body,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    json: async () => body,
    text: async () => JSON.stringify(body),
    clone: () => ({ ...global.helpers.createMockRequest(method, body, headers) }),
  }),
  
  createMockResponse: () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      headers: new Map(),
      setHeader: jest.fn((key, value) => {
        res.headers.set(key, value)
        return res
      }),
    }
    return res
  },
}

// Setup and teardown for integration tests
beforeAll(async () => {
  // Any setup that needs to run before all integration tests
  console.log('Starting integration test suite...')
})

afterAll(async () => {
  // Any cleanup that needs to run after all integration tests
  console.log('Integration test suite completed.')
})

beforeEach(() => {
  // Clear all mocks before each integration test
  jest.clearAllMocks()
  
  // Reset fetch mock
  if (global.fetch) {
    global.fetch.mockClear()
  }
})
