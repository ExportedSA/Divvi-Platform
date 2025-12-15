import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { rateLimits, addSecurityHeaders, addCorsHeaders, sanitizeInput, securityValidators } from './rate-limit'

interface SecurityConfig {
  requireAuth?: boolean
  requireRole?: ('OWNER' | 'RENTER' | 'ADMIN')[]
  rateLimit?: keyof typeof rateLimits
  sanitizeInput?: boolean
  validateInput?: Record<string, (value: any) => boolean>
  cors?: boolean
  maxBodySize?: number // in bytes
}

export class SecurityMiddleware {
  private config: SecurityConfig

  constructor(config: SecurityConfig = {}) {
    this.config = {
      requireAuth: true,
      sanitizeInput: true,
      cors: true,
      ...config
    }
  }

  async applyMiddleware(request: NextRequest, handler: (req: NextRequest) => Promise<NextResponse>) {
    try {
      // 1. CORS handling
      const origin = request.headers.get('origin')
      if (this.config.cors && request.method === 'OPTIONS') {
        const response = new NextResponse(null, { status: 200 })
        return addCorsHeaders(response, origin || undefined)
      }

      // 2. Rate limiting
      if (this.config.rateLimit) {
        const rateLimiter = rateLimits[this.config.rateLimit]
        const rateLimitResult = await rateLimiter.middleware()(request)
        
        if (rateLimitResult) {
          return rateLimitResult
        }
      }

      // 3. Authentication check
      let session = null
      if (this.config.requireAuth) {
        session = await getServerSession(authOptions)
        
        if (!session?.user?.id) {
          return NextResponse.json(
            { error: 'Unauthorized - Authentication required' },
            { status: 401 }
          )
        }

        // 4. Role-based access control
        if (this.config.requireRole && this.config.requireRole.length > 0) {
          if (!session.user.role || !this.config.requireRole.includes(session.user.role as any)) {
            return NextResponse.json(
              { 
                error: 'Forbidden - Insufficient permissions',
                required: this.config.requireRole,
                current: session.user.role
              },
              { status: 403 }
            )
          }
        }
      }

      // 5. Request body size validation
      if (this.config.maxBodySize && request.method !== 'GET' && request.method !== 'HEAD') {
        const contentLength = request.headers.get('content-length')
        if (contentLength && parseInt(contentLength) > this.config.maxBodySize) {
          return NextResponse.json(
            { error: 'Request entity too large' },
            { status: 413 }
          )
        }
      }

      // 6. Input sanitization and validation
      let processedRequest = request
      if (this.config.sanitizeInput || this.config.validateInput) {
        const body = await request.clone().json().catch(() => ({}))
        
        let sanitizedBody = body
        if (this.config.sanitizeInput) {
          sanitizedBody = sanitizeInput(body)
        }

        if (this.config.validateInput) {
          const validationErrors: string[] = []
          
          for (const [field, validator] of Object.entries(this.config.validateInput)) {
            const value = sanitizedBody[field]
            // For date validation, we need access to other fields
            if (field === 'endDate' && typeof validator === 'function') {
              if (!(validator as (v: any, ctx: any) => boolean)(value, sanitizedBody)) {
                validationErrors.push(`Invalid ${field}`)
              }
            } else if (typeof validator === 'function' && !validator(value)) {
              validationErrors.push(`Invalid ${field}`)
            }
          }

          if (validationErrors.length > 0) {
            return NextResponse.json(
              { error: 'Validation failed', details: validationErrors },
              { status: 400 }
            )
          }
        }

        // Create a new request with sanitized body
        const newBody = JSON.stringify(sanitizedBody)
        processedRequest = new NextRequest(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.method !== 'GET' && request.method !== 'HEAD' ? newBody : undefined,
        }) as NextRequest
      }

      // 7. Execute the handler
      const response = await handler(processedRequest)

      // 8. Apply security headers
      let secureResponse = addSecurityHeaders(response)

      // 9. Apply CORS headers
      if (this.config.cors) {
        secureResponse = addCorsHeaders(secureResponse, origin || undefined)
      }

      // 10. Add security metadata to response
      secureResponse.headers.set('X-Content-Security-Policy', 'active')
      if (session) {
        secureResponse.headers.set('X-User-Role', session.user.role)
      }

      return secureResponse

    } catch (error) {
      console.error('Security middleware error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

// Predefined security configurations
export const securityConfigs = {
  // Public endpoints - no auth required
  public: new SecurityMiddleware({
    requireAuth: false,
    rateLimit: 'api',
    sanitizeInput: true,
    cors: true
  }),

  // Authentication endpoints - strict rate limiting
  auth: new SecurityMiddleware({
    requireAuth: false,
    rateLimit: 'auth',
    sanitizeInput: true,
    cors: true,
    validateInput: {
      email: securityValidators.email,
      password: (value: string) => securityValidators.password(value).valid
    }
  }),

  // Standard authenticated endpoints
  authenticated: new SecurityMiddleware({
    requireAuth: true,
    rateLimit: 'api',
    sanitizeInput: true,
    cors: true
  }),

  // Owner-only endpoints
  ownerOnly: new SecurityMiddleware({
    requireAuth: true,
    requireRole: ['OWNER', 'ADMIN'], // Admins can access owner endpoints
    rateLimit: 'api',
    sanitizeInput: true,
    cors: true
  }),

  // Renter-only endpoints
  renterOnly: new SecurityMiddleware({
    requireAuth: true,
    requireRole: ['RENTER', 'ADMIN'], // Admins can access renter endpoints
    rateLimit: 'api',
    sanitizeInput: true,
    cors: true
  }),

  // Admin-only endpoints
  adminOnly: new SecurityMiddleware({
    requireAuth: true,
    requireRole: ['ADMIN'],
    rateLimit: 'sensitive',
    sanitizeInput: true,
    cors: true
  }),

  // Sensitive operations (like booking, payments)
  sensitive: new SecurityMiddleware({
    requireAuth: true,
    rateLimit: 'sensitive',
    sanitizeInput: true,
    cors: true,
    validateInput: {
      startDate: securityValidators.futureDate,
      endDate: (value: any) => {
        // For endDate validation, we need to access the startDate from the context
        // This is a simplified validation - in practice, you'd want to pass the full context
        return typeof value === 'string' && new Date(value) > new Date()
      }
    }
  }),

  // File upload endpoints
  upload: new SecurityMiddleware({
    requireAuth: true,
    rateLimit: 'upload',
    maxBodySize: 10 * 1024 * 1024, // 10MB
    sanitizeInput: true,
    cors: true
  })
}

// Higher-order function to apply security to API routes
export function withSecurity(config: keyof typeof securityConfigs | SecurityConfig) {
  const middleware = typeof config === 'string' ? securityConfigs[config] : new SecurityMiddleware(config)
  
  return (handler: (req: NextRequest) => Promise<NextResponse>) => {
    return async (request: NextRequest) => {
      return await middleware.applyMiddleware(request, handler)
    }
  }
}

// Utility functions for common security checks
export const securityUtils = {
  // Check if user owns a resource
  async checkResourceOwnership(userId: string, resourceOwnerId: string): Promise<boolean> {
    return userId === resourceOwnerId
  },

  // Check if user can access booking
  async canAccessBooking(userId: string, booking: { renterId: string; ownerId: string }, userRole: string): Promise<boolean> {
    return booking.renterId === userId || 
           booking.ownerId === userId || 
           userRole === 'ADMIN'
  },

  // Check if user can access listing
  async canAccessListing(userId: string, listing: { ownerId: string }, userRole: string): Promise<boolean> {
    return listing.ownerId === userId || userRole === 'ADMIN'
  },

  // Validate booking dates
  validateBookingDates(startDate: string, endDate: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (!securityValidators.futureDate(startDate)) {
      errors.push('Start date must be in the future')
    }
    
    if (!securityValidators.dateRange(startDate, endDate)) {
      errors.push('End date must be after start date')
    }
    
    // Check if booking duration is reasonable (max 30 days)
    const start = new Date(startDate)
    const end = new Date(endDate)
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff > 30) {
      errors.push('Booking duration cannot exceed 30 days')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  },

  // Validate pricing
  validatePricing(pricePerDay: number, bondAmount?: number): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (!securityValidators.positiveNumber(pricePerDay)) {
      errors.push('Price per day must be a positive number')
    }
    
    if (pricePerDay > 10000) {
      errors.push('Price per day cannot exceed $10,000')
    }
    
    if (bondAmount !== undefined) {
      if (!securityValidators.positiveNumber(bondAmount)) {
        errors.push('Bond amount must be a positive number')
      }
      
      if (bondAmount > pricePerDay * 7) {
        errors.push('Bond amount cannot exceed 7 days of rental price')
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
}

// Audit logging utility
export class AuditLogger {
  static log(action: string, userId: string, resource?: string, details?: any) {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      action,
      userId,
      resource,
      details,
      ip: 'unknown', // Would be extracted from request
      userAgent: 'unknown' // Would be extracted from request
    }
    
    console.log('AUDIT:', auditEntry)
    
    // In production, send to audit logging service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Implement proper audit logging
    }
  }
}
