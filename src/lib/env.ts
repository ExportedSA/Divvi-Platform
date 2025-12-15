/**
 * Environment Configuration & Validation
 * 
 * This module provides strict environment variable validation and type-safe access.
 * It ensures all required variables are present and correctly formatted before
 * the application starts.
 */

import { z } from 'zod'

// =============================================================================
// ENVIRONMENT SCHEMA DEFINITIONS
// =============================================================================

/**
 * Server-side environment variables (not exposed to client)
 */
const serverEnvSchema = z.object({
  // Database (REQUIRED)
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .url('DATABASE_URL must be a valid URL')
    .refine(
      (url) => url.startsWith('postgresql://') || url.startsWith('postgres://'),
      'DATABASE_URL must be a PostgreSQL connection string'
    ),

  // Authentication (REQUIRED)
  NEXTAUTH_SECRET: z
    .string()
    .min(32, 'NEXTAUTH_SECRET must be at least 32 characters for security')
    .refine(
      (secret) => !secret.includes('your-secret') && !secret.includes('placeholder'),
      'NEXTAUTH_SECRET cannot be a placeholder value - generate with: openssl rand -base64 32'
    ),
  NEXTAUTH_URL: z
    .string()
    .url('NEXTAUTH_URL must be a valid URL'),

  // Application
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  // Email (Optional - for notifications)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_SECURE: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),

  // File Storage (Optional - for uploads)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),

  // Redis (Optional - for rate limiting)
  REDIS_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Monitoring (Optional)
  SENTRY_DSN: z.string().url().optional(),

  // Security
  CORS_ALLOWED_ORIGINS: z
    .string()
    .transform((val) => val.split(',').map((s) => s.trim()))
    .optional(),
  SECURE_COOKIES: z
    .string()
    .transform((val) => val === 'true')
    .optional(),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),

  // Stripe (Optional - for payments)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
})

/**
 * Client-side environment variables (exposed to browser via NEXT_PUBLIC_ prefix)
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url('NEXT_PUBLIC_APP_URL must be a valid URL'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  NEXT_PUBLIC_GOOGLE_ANALYTICS_ID: z.string().optional(),
})

// =============================================================================
// ENVIRONMENT VALIDATION
// =============================================================================

type ServerEnv = z.infer<typeof serverEnvSchema>
type ClientEnv = z.infer<typeof clientEnvSchema>

/**
 * Validates server environment variables
 * Throws detailed error if validation fails
 */
function validateServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(process.env)

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    const errorMessages = Object.entries(errors)
      .map(([key, messages]) => `  ${key}: ${messages?.join(', ')}`)
      .join('\n')

    console.error('❌ Invalid server environment variables:\n' + errorMessages)
    
    // In development, provide helpful guidance
    if (process.env.NODE_ENV !== 'production') {
      console.error('\n📋 To fix this:')
      console.error('   1. Copy .env.example to .env')
      console.error('   2. Fill in all required values')
      console.error('   3. Generate NEXTAUTH_SECRET with: openssl rand -base64 32')
    }

    throw new Error('Invalid server environment configuration')
  }

  return parsed.data
}

/**
 * Validates client environment variables
 */
function validateClientEnv(): ClientEnv {
  const clientEnv = {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_GOOGLE_ANALYTICS_ID: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID,
  }

  const parsed = clientEnvSchema.safeParse(clientEnv)

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    const errorMessages = Object.entries(errors)
      .map(([key, messages]) => `  ${key}: ${messages?.join(', ')}`)
      .join('\n')

    console.error('❌ Invalid client environment variables:\n' + errorMessages)
    throw new Error('Invalid client environment configuration')
  }

  return parsed.data
}

// =============================================================================
// EXPORTED ENVIRONMENT OBJECTS
// =============================================================================

/**
 * Validated server environment variables
 * Access these instead of process.env directly
 */
export const serverEnv = validateServerEnv()

/**
 * Validated client environment variables
 * Safe to use in browser code
 */
export const clientEnv = validateClientEnv()

/**
 * Combined environment for convenience
 */
export const env = {
  ...serverEnv,
  ...clientEnv,
}

// =============================================================================
// ENVIRONMENT HELPERS
// =============================================================================

/**
 * Check if running in production
 */
export const isProduction = serverEnv.NODE_ENV === 'production'

/**
 * Check if running in development
 */
export const isDevelopment = serverEnv.NODE_ENV === 'development'

/**
 * Check if running in test
 */
export const isTest = serverEnv.NODE_ENV === 'test'

/**
 * Get CORS allowed origins based on environment
 */
export function getCorsOrigins(): string[] {
  if (serverEnv.CORS_ALLOWED_ORIGINS) {
    return serverEnv.CORS_ALLOWED_ORIGINS
  }
  
  if (isProduction) {
    // In production, only allow the app URL
    return [clientEnv.NEXT_PUBLIC_APP_URL]
  }
  
  // In development, allow localhost variants
  return [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
  ]
}

/**
 * Check if a feature is enabled based on env var presence
 */
export const features = {
  email: Boolean(serverEnv.SMTP_HOST && serverEnv.SMTP_USER),
  fileUpload: Boolean(serverEnv.AWS_ACCESS_KEY_ID && serverEnv.AWS_S3_BUCKET),
  redis: Boolean(serverEnv.REDIS_URL || serverEnv.UPSTASH_REDIS_REST_URL),
  sentry: Boolean(serverEnv.SENTRY_DSN),
  stripe: Boolean(serverEnv.STRIPE_SECRET_KEY),
}

/**
 * Log environment status (safe - no secrets)
 */
export function logEnvStatus(): void {
  console.log('🔧 Environment Configuration:')
  console.log(`   NODE_ENV: ${serverEnv.NODE_ENV}`)
  console.log(`   App URL: ${clientEnv.NEXT_PUBLIC_APP_URL}`)
  console.log(`   Features enabled:`)
  console.log(`     - Email: ${features.email ? '✅' : '❌'}`)
  console.log(`     - File Upload: ${features.fileUpload ? '✅' : '❌'}`)
  console.log(`     - Redis: ${features.redis ? '✅' : '❌'}`)
  console.log(`     - Sentry: ${features.sentry ? '✅' : '❌'}`)
  console.log(`     - Stripe: ${features.stripe ? '✅' : '❌'}`)
}
