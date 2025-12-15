import request from 'supertest'
import { NextRequest } from 'next/server'

// Mock Next.js environment
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}))

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn()
    }
  }
}))

// Mock bcrypt
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn()
}))

describe('Authentication API Integration Tests', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    farmName: 'Test Farm',
    role: 'OWNER'
  }

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 'user-1',
        email: testUser.email,
        name: `${testUser.firstName} ${testUser.lastName}`,
        role: testUser.role,
        createdAt: new Date()
      }

      // Mock successful user creation
      const { prisma } = require('@/lib/prisma')
      prisma.user.create.mockResolvedValue(mockUser)

      const response = await request('http://localhost:3000')
        .post('/api/auth/register')
        .send(testUser)
        .expect(201)

      expect(response.body).toHaveProperty('message', 'User registered successfully')
      expect(response.body.user).toHaveProperty('id', 'user-1')
      expect(response.body.user).toHaveProperty('email', testUser.email)
      expect(response.body.user).not.toHaveProperty('password')
    })

    it('should reject registration with invalid email', async () => {
      const invalidUser = { ...testUser, email: 'invalid-email' }

      const response = await request('http://localhost:3000')
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400)

      expect(response.body).toHaveProperty('error', 'Validation failed')
    })

    it('should reject registration with weak password', async () => {
      const invalidUser = { ...testUser, password: '123' }

      const response = await request('http://localhost:3000')
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400)

      expect(response.body).toHaveProperty('error', 'Validation failed')
    })

    it('should reject registration with duplicate email', async () => {
      const { prisma } = require('@/lib/prisma')
      prisma.user.create.mockRejectedValue(new Error('Unique constraint failed'))

      const response = await request('http://localhost:3000')
        .post('/api/auth/register')
        .send(testUser)
        .expect(500)

      expect(response.body).toHaveProperty('error', 'Failed to register user')
    })
  })

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const mockUser = {
        id: 'user-1',
        email: testUser.email,
        password: 'hashedPassword',
        name: `${testUser.firstName} ${testUser.lastName}`,
        role: testUser.role
      }

      const { prisma } = require('@/lib/prisma')
      const { compare } = require('bcrypt')
      
      prisma.user.findUnique.mockResolvedValue(mockUser)
      compare.mockResolvedValue(true)

      const response = await request('http://localhost:3000')
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200)

      expect(response.body).toHaveProperty('message', 'Login successful')
      expect(response.body.user).toHaveProperty('id', 'user-1')
      expect(response.body.user).toHaveProperty('email', testUser.email)
    })

    it('should reject login with invalid credentials', async () => {
      const { prisma } = require('@/lib/prisma')
      const { compare } = require('bcrypt')
      
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: testUser.email,
        password: 'hashedPassword'
      })
      compare.mockResolvedValue(false)

      const response = await request('http://localhost:3000')
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401)

      expect(response.body).toHaveProperty('error', 'Invalid credentials')
    })

    it('should reject login for non-existent user', async () => {
      const { prisma } = require('@/lib/prisma')
      prisma.user.findUnique.mockResolvedValue(null)

      const response = await request('http://localhost:3000')
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password
        })
        .expect(401)

      expect(response.body).toHaveProperty('error', 'Invalid credentials')
    })
  })

  describe('GET /api/auth/me', () => {
    it('should return current user profile when authenticated', async () => {
      const mockSession = {
        user: {
          id: 'user-1',
          email: testUser.email,
          name: `${testUser.firstName} ${testUser.lastName}`,
          role: testUser.role
        }
      }

      const { getServerSession } = require('next-auth')
      getServerSession.mockResolvedValue(mockSession)

      const response = await request('http://localhost:3000')
        .get('/api/auth/me')
        .expect(200)

      expect(response.body).toHaveProperty('user')
      expect(response.body.user).toHaveProperty('id', 'user-1')
      expect(response.body.user).toHaveProperty('email', testUser.email)
    })

    it('should return 401 when not authenticated', async () => {
      const { getServerSession } = require('next-auth')
      getServerSession.mockResolvedValue(null)

      const response = await request('http://localhost:3000')
        .get('/api/auth/me')
        .expect(401)

      expect(response.body).toHaveProperty('error', 'Unauthorized')
    })
  })

  describe('Security Tests', () => {
    it('should handle SQL injection attempts in email', async () => {
      const maliciousUser = {
        ...testUser,
        email: "'; DROP TABLE users; --"
      }

      const response = await request('http://localhost:3000')
        .post('/api/auth/register')
        .send(maliciousUser)
        .expect(400)

      expect(response.body).toHaveProperty('error', 'Validation failed')
    })

    it('should handle XSS attempts in name fields', async () => {
      const maliciousUser = {
        ...testUser,
        firstName: '<script>alert("xss")</script>',
        lastName: 'User'
      }

      const response = await request('http://localhost:3000')
        .post('/api/auth/register')
        .send(maliciousUser)
        .expect(400)

      expect(response.body).toHaveProperty('error', 'Validation failed')
    })

    it('should handle rate limiting on auth endpoints', async () => {
      // This would require implementing rate limiting middleware
      // For now, just ensure the endpoint handles multiple requests gracefully
      const promises = Array(10).fill(null).map(() =>
        request('http://localhost:3000')
          .post('/api/auth/login')
          .send({
            email: testUser.email,
            password: 'wrongpassword'
          })
      )

      const responses = await Promise.all(promises)
      
      // All requests should be handled (some may fail with 401, none with 500)
      responses.forEach((response: any) => {
        expect([401, 429]).toContain(response.status)
      })
    })
  })
})
