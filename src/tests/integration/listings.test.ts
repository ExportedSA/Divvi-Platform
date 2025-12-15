import request from 'supertest'

// Mock Next.js environment
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}))

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    listing: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    user: {
      findUnique: jest.fn()
    }
  }
}))

// Global mock data for all tests
const mockOwner = {
  id: 'owner-1',
  email: 'owner@example.com',
  name: 'John Owner',
  role: 'OWNER'
}

const mockListing = {
  id: 'listing-1',
  ownerId: 'owner-1',
  title: 'John Deere 5075E Tractor',
  description: 'Well-maintained tractor perfect for various farming tasks',
  category: 'TRACTOR',
  brand: 'John Deere',
  model: '5075E',
  year: 2020,
  enginePowerHP: 75,
  pricePerDay: 500,
  pricePerWeek: 3000,
  minimumRentalDays: 1,
  bondAmount: 1000,
  status: 'LIVE',
  averageRating: 4.5,
  createdAt: new Date(),
  updatedAt: new Date()
}

const mockRenter = {
  id: 'renter-1',
  email: 'renter@example.com',
  name: 'Jane Renter',
  role: 'RENTER'
}

const mockBooking = {
  id: 'booking-1',
  listingId: 'listing-1',
  renterId: 'renter-1',
  ownerId: 'owner-1',
  startDate: new Date('2024-02-01'),
  endDate: new Date('2024-02-03'),
  status: 'PENDING',
  rentalTotal: 1000,
  bondAmountAtBooking: 500,
  createdAt: new Date()
}

describe('Listings API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/listings', () => {
    it('should return paginated listings', async () => {
      const { prisma } = require('@/lib/prisma')
      prisma.listing.findMany.mockResolvedValue([mockListing])

      const response = await request('http://localhost:3000')
        .get('/api/listings')
        .expect(200)

      expect(response.body).toHaveProperty('listings')
      expect(response.body).toHaveProperty('pagination')
      expect(response.body.listings).toHaveLength(1)
      expect(response.body.listings[0]).toHaveProperty('id', 'listing-1')
    })

    it('should filter listings by category', async () => {
      const { prisma } = require('@/lib/prisma')
      prisma.listing.findMany.mockResolvedValue([mockListing])

      const response = await request('http://localhost:3000')
        .get('/api/listings?category=TRACTOR')
        .expect(200)

      expect(prisma.listing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: 'TRACTOR'
          })
        })
      )
    })

    it('should filter listings by price range', async () => {
      const { prisma } = require('@/lib/prisma')
      prisma.listing.findMany.mockResolvedValue([mockListing])

      const response = await request('http://localhost:3000')
        .get('/api/listings?minPrice=300&maxPrice=600')
        .expect(200)

      expect(prisma.listing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            pricePerDay: {
              gte: 300,
              lte: 600
            }
          })
        })
      )
    })

    it('should handle search queries', async () => {
      const { prisma } = require('@/lib/prisma')
      prisma.listing.findMany.mockResolvedValue([mockListing])

      const response = await request('http://localhost:3000')
        .get('/api/listings?q=John Deere')
        .expect(200)

      expect(prisma.listing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                title: {
                  contains: 'John Deere',
                  mode: 'insensitive'
                }
              })
            ])
          })
        })
      )
    })

    it('should validate query parameters', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/listings?minPrice=-100')
        .expect(400)

      expect(response.body).toHaveProperty('error', 'Validation failed')
    })
  })

  describe('GET /api/listings/:id', () => {
    it('should return a specific listing', async () => {
      const { prisma } = require('@/lib/prisma')
      prisma.listing.findUnique.mockResolvedValue(mockListing)

      const response = await request('http://localhost:3000')
        .get('/api/listings/listing-1')
        .expect(200)

      expect(response.body).toHaveProperty('listing')
      expect(response.body.listing).toHaveProperty('id', 'listing-1')
    })

    it('should return 404 for non-existent listing', async () => {
      const { prisma } = require('@/lib/prisma')
      prisma.listing.findUnique.mockResolvedValue(null)

      const response = await request('http://localhost:3000')
        .get('/api/listings/nonexistent')
        .expect(404)

      expect(response.body).toHaveProperty('error', 'Listing not found')
    })
  })

  describe('POST /api/listings', () => {
    it('should create a new listing when authenticated as owner', async () => {
      const { getServerSession } = require('next-auth')
      const { prisma } = require('@/lib/prisma')
      
      getServerSession.mockResolvedValue({ user: mockOwner })
      prisma.listing.create.mockResolvedValue(mockListing)

      const newListing = {
        title: 'New Tractor',
        description: 'A great tractor',
        category: 'TRACTOR',
        brand: 'John Deere',
        model: '5075E',
        year: 2021,
        pricePerDay: 450,
        minimumRentalDays: 1,
        bondAmount: 900
      }

      const response = await request('http://localhost:3000')
        .post('/api/listings')
        .send(newListing)
        .expect(201)

      expect(response.body).toHaveProperty('message', 'Listing created successfully')
      expect(response.body.listing).toHaveProperty('id', 'listing-1')
    })

    it('should reject listing creation when not authenticated', async () => {
      const { getServerSession } = require('next-auth')
      getServerSession.mockResolvedValue(null)

      const response = await request('http://localhost:3000')
        .post('/api/listings')
        .send({
          title: 'New Tractor',
          description: 'A great tractor'
        })
        .expect(401)

      expect(response.body).toHaveProperty('error', 'Unauthorized')
    })

    it('should reject listing creation when not an owner', async () => {
      const { getServerSession } = require('next-auth')
      getServerSession.mockResolvedValue({
        user: { ...mockOwner, role: 'RENTER' }
      })

      const response = await request('http://localhost:3000')
        .post('/api/listings')
        .send({
          title: 'New Tractor',
          description: 'A great tractor'
        })
        .expect(403)

      expect(response.body).toHaveProperty('error', 'Forbidden - Owner access required')
    })

    it('should validate listing data', async () => {
      const { getServerSession } = require('next-auth')
      getServerSession.mockResolvedValue({ user: mockOwner })

      const invalidListing = {
        title: '', // Empty title
        pricePerDay: -100 // Negative price
      }

      const response = await request('http://localhost:3000')
        .post('/api/listings')
        .send(invalidListing)
        .expect(400)

      expect(response.body).toHaveProperty('error', 'Validation failed')
    })
  })

  describe('PUT /api/listings/:id', () => {
    it('should update listing when authenticated as owner', async () => {
      const { getServerSession } = require('next-auth')
      const { prisma } = require('@/lib/prisma')
      
      getServerSession.mockResolvedValue({ user: mockOwner })
      prisma.listing.findUnique.mockResolvedValue(mockListing)
      prisma.listing.update.mockResolvedValue({
        ...mockListing,
        title: 'Updated Tractor'
      })

      const updateData = {
        title: 'Updated Tractor',
        description: 'Updated description'
      }

      const response = await request('http://localhost:3000')
        .put('/api/listings/listing-1')
        .send(updateData)
        .expect(200)

      expect(response.body).toHaveProperty('message', 'Listing updated successfully')
      expect(response.body.listing.title).toBe('Updated Tractor')
    })

    it('should reject update when user does not own listing', async () => {
      const { getServerSession } = require('next-auth')
      const { prisma } = require('@/lib/prisma')
      
      getServerSession.mockResolvedValue({
        user: { ...mockOwner, id: 'different-owner' }
      })
      prisma.listing.findUnique.mockResolvedValue(mockListing)

      const response = await request('http://localhost:3000')
        .put('/api/listings/listing-1')
        .send({ title: 'Updated Tractor' })
        .expect(403)

      expect(response.body).toHaveProperty('error', 'Forbidden - You can only edit your own listings')
    })
  })
})

describe('Bookings API Integration Tests', () => {
  describe('POST /api/bookings', () => {
    it('should create a booking when authenticated as renter', async () => {
      const { getServerSession } = require('next-auth')
      const { prisma } = require('@/lib/prisma')
      
      getServerSession.mockResolvedValue({ user: mockRenter })
      prisma.listing.findUnique.mockResolvedValue(mockListing)
      prisma.booking.findMany.mockResolvedValue([]) // No conflicts
      prisma.booking.create.mockResolvedValue(mockBooking)

      const bookingData = {
        listingId: 'listing-1',
        startDate: '2024-02-01',
        endDate: '2024-02-03',
        notes: 'Need tractor for plowing'
      }

      const response = await request('http://localhost:3000')
        .post('/api/bookings')
        .send(bookingData)
        .expect(201)

      expect(response.body).toHaveProperty('message', 'Booking created successfully')
      expect(response.body.booking).toHaveProperty('id', 'booking-1')
    })

    it('should reject booking with conflicting dates', async () => {
      const { getServerSession } = require('next-auth')
      const { prisma } = require('@/lib/prisma')
      
      getServerSession.mockResolvedValue({ user: mockRenter })
      prisma.listing.findUnique.mockResolvedValue(mockListing)
      prisma.booking.findMany.mockResolvedValue([mockBooking]) // Existing booking conflicts

      const bookingData = {
        listingId: 'listing-1',
        startDate: '2024-02-02', // Overlaps with existing booking
        endDate: '2024-02-04'
      }

      const response = await request('http://localhost:3000')
        .post('/api/bookings')
        .send(bookingData)
        .expect(409)

      expect(response.body).toHaveProperty('error', 'Requested dates are not available')
    })

    it('should validate booking dates', async () => {
      const { getServerSession } = require('next-auth')
      getServerSession.mockResolvedValue({ user: mockRenter })

      const invalidBooking = {
        listingId: 'listing-1',
        startDate: '2024-02-03',
        endDate: '2024-02-01', // End before start
        notes: 'Invalid dates'
      }

      const response = await request('http://localhost:3000')
        .post('/api/bookings')
        .send(invalidBooking)
        .expect(400)

      expect(response.body).toHaveProperty('error', 'Validation failed')
    })
  })

  describe('PATCH /api/bookings/:id/status', () => {
    it('should allow owner to accept booking', async () => {
      const { getServerSession } = require('next-auth')
      const { prisma } = require('@/lib/prisma')
      
      getServerSession.mockResolvedValue({ user: mockOwner })
      prisma.booking.findUnique.mockResolvedValue(mockBooking)
      prisma.booking.update.mockResolvedValue({
        ...mockBooking,
        status: 'ACCEPTED'
      })

      const response = await request('http://localhost:3000')
        .patch('/api/bookings/booking-1/status')
        .send({ status: 'ACCEPTED' })
        .expect(200)

      expect(response.body).toHaveProperty('message', 'Booking status updated successfully')
      expect(response.body.booking.status).toBe('ACCEPTED')
    })

    it('should reject status change by unauthorized user', async () => {
      const { getServerSession } = require('next-auth')
      const { prisma } = require('@/lib/prisma')
      
      getServerSession.mockResolvedValue({
        user: { ...mockRenter, id: 'unauthorized-user' }
      })
      prisma.booking.findUnique.mockResolvedValue(mockBooking)

      const response = await request('http://localhost:3000')
        .patch('/api/bookings/booking-1/status')
        .send({ status: 'ACCEPTED' })
        .expect(403)

      expect(response.body).toHaveProperty('error', 'Forbidden - You can only modify bookings you are involved in')
    })
  })
})
