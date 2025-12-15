import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory rate limiter for development
// In production, use Redis or a proper rate limiting service
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
  message?: string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

export class RateLimit {
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = {
      message: 'Too many requests, please try again later.',
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config
    }
  }

  check(key: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now()
    const windowStart = now - this.config.windowMs

    // Clean up expired entries
    for (const [k, v] of Array.from(rateLimitStore.entries())) {
      if (v.resetTime < now) {
        rateLimitStore.delete(k)
      }
    }

    const record = rateLimitStore.get(key)

    if (!record || record.resetTime < now) {
      // New window
      const newRecord = {
        count: 1,
        resetTime: now + this.config.windowMs
      }
      rateLimitStore.set(key, newRecord)
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: newRecord.resetTime
      }
    }

    if (record.count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime
      }
    }

    record.count++
    return {
      allowed: true,
      remaining: this.config.maxRequests - record.count,
      resetTime: record.resetTime
    }
  }

  middleware() {
    return async (request: NextRequest) => {
      // Generate unique key for rate limiting
      const ip = request.ip || 'unknown'
      const userAgent = request.headers.get('user-agent') || 'unknown'
      const key = `${ip}:${userAgent}`

      const result = this.check(key)

      if (!result.allowed) {
        return NextResponse.json(
          { 
            error: this.config.message,
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
          },
          { 
            status: 429,
            headers: {
              'X-RateLimit-Limit': this.config.maxRequests.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
              'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
            }
          }
        )
      }

      return null // Allow request to proceed
    }
  }
}

// Predefined rate limit configurations
export const rateLimits = {
  // Auth endpoints - stricter limits
  auth: new RateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts, please try again later.'
  }),

  // General API limits
  api: new RateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per 15 minutes
    message: 'API rate limit exceeded, please try again later.'
  }),

  // Sensitive operations - very strict
  sensitive: new RateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 operations per hour
    message: 'Too many sensitive operations, please try again later.'
  }),

  // File upload limits
  upload: new RateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20, // 20 uploads per hour
    message: 'Upload limit exceeded, please try again later.'
  })
}

// Rate limiting middleware wrapper
export function withRateLimit(rateLimiter: RateLimit, handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const rateLimitResult = await rateLimiter.middleware()(request)
    
    if (rateLimitResult) {
      return rateLimitResult
    }

    return handler(request)
  }
}

// Security headers middleware
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  // Enable XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Content Security Policy (basic)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'"
  )
  
  // HSTS (only in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  
  return response
}

// Input sanitization utilities
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Basic XSS prevention
    return input
      .replace(/[<>]/g, '') // Remove basic HTML tags
      .trim()
      .substring(0, 10000) // Limit length
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput)
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value)
    }
    return sanitized
  }
  
  return input
}

// Validation helpers
export const securityValidators = {
  // Validate email format
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  // Validate password strength
  password: (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = []
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  },

  // Validate phone number (basic)
  phone: (phone: string): boolean => {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/
    return phoneRegex.test(phone)
  },

  // Validate dates are not in the past for bookings
  futureDate: (dateString: string): boolean => {
    const date = new Date(dateString)
    const now = new Date()
    return date > now
  },

  // Validate date range
  dateRange: (startDate: string, endDate: string): boolean => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    return start < end
  },

  // Validate positive numbers
  positiveNumber: (value: number): boolean => {
    return value > 0 && isFinite(value)
  },

  // Validate rating range
  rating: (rating: number): boolean => {
    return rating >= 1 && rating <= 5 && Number.isInteger(rating)
  }
}

// CORS configuration
// Origins are determined by environment variables or sensible defaults
function getCorsOrigins(): string[] {
  // Check for explicit CORS_ALLOWED_ORIGINS env var
  const envOrigins = process.env.CORS_ALLOWED_ORIGINS
  if (envOrigins) {
    return envOrigins.split(',').map((s: string) => s.trim())
  }
  
  // Production: use the app URL
  if (process.env.NODE_ENV === 'production') {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    return appUrl ? [appUrl] : []
  }
  
  // Development: allow localhost variants
  return ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000']
}

export const corsConfig = {
  origin: getCorsOrigins(),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400, // 24 hours
}

export function addCorsHeaders(response: NextResponse, origin?: string): NextResponse {
  if (origin && corsConfig.origin.includes(origin) || corsConfig.origin.includes('*')) {
    response.headers.set('Access-Control-Allow-Origin', origin || '*')
  }
  
  response.headers.set('Access-Control-Allow-Methods', corsConfig.methods.join(', '))
  response.headers.set('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '))
  response.headers.set('Access-Control-Allow-Credentials', corsConfig.credentials.toString())
  response.headers.set('Access-Control-Max-Age', corsConfig.maxAge.toString())
  
  return response
}
