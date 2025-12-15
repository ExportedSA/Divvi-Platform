/**
 * Sentry Error Tracking Integration
 * 
 * Provides error tracking and monitoring with:
 * - Automatic error capture
 * - User context tracking
 * - Performance monitoring
 * - PII filtering before sending
 */

import { sanitizeObject, sanitizeString, sanitizeHeaders } from './sanitize'

// =============================================================================
// TYPES
// =============================================================================

export interface SentryUser {
  id?: string
  email?: string
  role?: string
}

export interface SentryContext {
  tags?: Record<string, string>
  extra?: Record<string, unknown>
  user?: SentryUser
}

export interface SentryBreadcrumb {
  category: string
  message: string
  level: 'debug' | 'info' | 'warning' | 'error'
  data?: Record<string, unknown>
  timestamp?: number
}

// =============================================================================
// MOCK SENTRY CLIENT (Replace with real Sentry SDK in production)
// =============================================================================

/**
 * Sentry-compatible error tracking client
 * 
 * In production, replace this with the actual Sentry SDK:
 * import * as Sentry from '@sentry/nextjs'
 * 
 * This implementation provides the same interface for development
 * and can be swapped out without changing application code.
 */
class SentryClient {
  private initialized = false
  private dsn: string | null = null
  private environment: string = 'development'
  private release: string | null = null
  private user: SentryUser | null = null
  private tags: Record<string, string> = {}
  private breadcrumbs: SentryBreadcrumb[] = []
  private maxBreadcrumbs = 100
  
  /**
   * Initialize Sentry with configuration
   */
  init(options: {
    dsn?: string
    environment?: string
    release?: string
    tracesSampleRate?: number
    beforeSend?: (event: unknown) => unknown | null
  }): void {
    this.dsn = options.dsn || process.env.SENTRY_DSN || null
    this.environment = options.environment || process.env.NODE_ENV || 'development'
    this.release = options.release || process.env.VERCEL_GIT_COMMIT_SHA || null
    
    if (!this.dsn) {
      console.warn('[Sentry] No DSN configured - error tracking disabled')
      return
    }
    
    this.initialized = true
    console.info(`[Sentry] Initialized for ${this.environment}`)
    
    // In production, initialize real Sentry SDK here:
    // Sentry.init({
    //   dsn: this.dsn,
    //   environment: this.environment,
    //   release: this.release,
    //   tracesSampleRate: options.tracesSampleRate ?? 0.1,
    //   beforeSend: this.beforeSend.bind(this),
    // })
  }
  
  /**
   * Check if Sentry is initialized and ready
   */
  isInitialized(): boolean {
    return this.initialized
  }
  
  /**
   * Set user context for error tracking
   */
  setUser(user: SentryUser | null): void {
    if (user) {
      // Sanitize user data before storing
      this.user = {
        id: user.id,
        email: user.email ? sanitizeString(user.email) : undefined,
        role: user.role,
      }
    } else {
      this.user = null
    }
    
    // In production: Sentry.setUser(this.user)
  }
  
  /**
   * Set global tags
   */
  setTag(key: string, value: string): void {
    this.tags[key] = value
    // In production: Sentry.setTag(key, value)
  }
  
  /**
   * Set multiple tags at once
   */
  setTags(tags: Record<string, string>): void {
    for (const [key, value] of Object.entries(tags)) {
      this.setTag(key, value)
    }
  }
  
  /**
   * Add a breadcrumb for debugging context
   */
  addBreadcrumb(breadcrumb: SentryBreadcrumb): void {
    const sanitizedBreadcrumb: SentryBreadcrumb = {
      ...breadcrumb,
      message: sanitizeString(breadcrumb.message),
      data: breadcrumb.data ? sanitizeObject(breadcrumb.data) : undefined,
      timestamp: breadcrumb.timestamp || Date.now(),
    }
    
    this.breadcrumbs.push(sanitizedBreadcrumb)
    
    // Keep breadcrumbs under limit
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs)
    }
    
    // In production: Sentry.addBreadcrumb(sanitizedBreadcrumb)
  }
  
  /**
   * Capture an exception
   */
  captureException(
    error: Error | unknown,
    context?: SentryContext
  ): string {
    const eventId = this.generateEventId()
    
    if (!this.initialized) {
      console.error('[Sentry] Not initialized - logging error locally:', error)
      return eventId
    }
    
    const sanitizedContext = context ? {
      tags: context.tags,
      extra: context.extra ? sanitizeObject(context.extra) : undefined,
      user: context.user ? {
        id: context.user.id,
        role: context.user.role,
      } : undefined,
    } : undefined
    
    // Log locally in development
    if (this.environment === 'development') {
      console.error('[Sentry] Captured exception:', {
        error: error instanceof Error ? {
          name: error.name,
          message: sanitizeString(error.message),
          stack: error.stack,
        } : error,
        context: sanitizedContext,
        user: this.user,
        tags: this.tags,
        breadcrumbs: this.breadcrumbs.slice(-10),
        eventId,
      })
    }
    
    // In production: return Sentry.captureException(error, sanitizedContext)
    
    return eventId
  }
  
  /**
   * Capture a message
   */
  captureMessage(
    message: string,
    level: 'debug' | 'info' | 'warning' | 'error' = 'info',
    context?: SentryContext
  ): string {
    const eventId = this.generateEventId()
    
    if (!this.initialized) {
      console.log(`[Sentry] ${level.toUpperCase()}: ${message}`)
      return eventId
    }
    
    const sanitizedMessage = sanitizeString(message)
    
    if (this.environment === 'development') {
      console.log(`[Sentry] ${level.toUpperCase()}: ${sanitizedMessage}`, context)
    }
    
    // In production: return Sentry.captureMessage(sanitizedMessage, level)
    
    return eventId
  }
  
  /**
   * Create a new scope for isolated context
   */
  withScope(callback: (scope: SentryScope) => void): void {
    const scope = new SentryScope(this)
    callback(scope)
    // In production: Sentry.withScope(callback)
  }
  
  /**
   * Flush pending events (useful before process exit)
   */
  async flush(timeout: number = 2000): Promise<boolean> {
    // In production: return Sentry.flush(timeout)
    return true
  }
  
  /**
   * Close the Sentry client
   */
  async close(timeout: number = 2000): Promise<boolean> {
    // In production: return Sentry.close(timeout)
    this.initialized = false
    return true
  }
  
  /**
   * Before send hook - sanitize data before sending to Sentry
   */
  private beforeSend(event: Record<string, unknown>): Record<string, unknown> | null {
    // Sanitize the entire event
    return sanitizeObject(event)
  }
  
  /**
   * Generate a unique event ID
   */
  private generateEventId(): string {
    return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`
  }
}

/**
 * Sentry scope for isolated context
 */
class SentryScope {
  private client: SentryClient
  private scopeTags: Record<string, string> = {}
  private scopeExtra: Record<string, unknown> = {}
  private scopeUser: SentryUser | null = null
  
  constructor(client: SentryClient) {
    this.client = client
  }
  
  setTag(key: string, value: string): void {
    this.scopeTags[key] = value
  }
  
  setExtra(key: string, value: unknown): void {
    this.scopeExtra[key] = value
  }
  
  setUser(user: SentryUser | null): void {
    this.scopeUser = user
  }
  
  setLevel(level: 'debug' | 'info' | 'warning' | 'error'): void {
    this.scopeTags['level'] = level
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const sentry = new SentryClient()

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Initialize Sentry (call once at app startup)
 */
export function initSentry(options?: {
  dsn?: string
  environment?: string
  release?: string
  tracesSampleRate?: number
}): void {
  sentry.init(options || {})
}

/**
 * Capture an error with optional context
 */
export function captureError(
  error: Error | unknown,
  context?: SentryContext
): string {
  return sentry.captureException(error, context)
}

/**
 * Capture a message
 */
export function captureMessage(
  message: string,
  level?: 'debug' | 'info' | 'warning' | 'error'
): string {
  return sentry.captureMessage(message, level)
}

/**
 * Set the current user for error tracking
 */
export function setUser(user: SentryUser | null): void {
  sentry.setUser(user)
}

/**
 * Add a breadcrumb for debugging context
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>
): void {
  sentry.addBreadcrumb({
    category,
    message,
    level: 'info',
    data,
  })
}

/**
 * Wrap an async function with error tracking
 */
export function withErrorTracking<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  context?: SentryContext
): T {
  return (async (...args: unknown[]) => {
    try {
      return await fn(...args)
    } catch (error) {
      captureError(error, context)
      throw error
    }
  }) as T
}
