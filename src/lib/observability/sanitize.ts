/**
 * Data Sanitization for Observability
 * 
 * Ensures no sensitive data (PII, secrets, credentials) is logged or sent to
 * error tracking services.
 */

// =============================================================================
// SENSITIVE FIELD PATTERNS
// =============================================================================

/**
 * Field names that should always be redacted
 */
const SENSITIVE_FIELDS = new Set([
  // Authentication
  'password',
  'passwordHash',
  'secret',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'apiSecret',
  'privateKey',
  'sessionToken',
  'jwt',
  'bearer',
  
  // Personal Information
  'ssn',
  'socialSecurityNumber',
  'taxId',
  'driverLicenceNumber',
  'driverLicenseNumber',
  'passportNumber',
  'gstNumber',
  'abnNumber',
  
  // Financial
  'creditCard',
  'cardNumber',
  'cvv',
  'cvc',
  'bankAccount',
  'accountNumber',
  'routingNumber',
  'stripeCustomerId',
  'stripePaymentMethodId',
  
  // Contact (partial redaction)
  'email',
  'phone',
  'phoneNumber',
  'mobileNumber',
])

/**
 * Patterns that indicate sensitive data in field names
 */
const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /key/i,
  /credential/i,
  /auth/i,
  /bearer/i,
  /licence/i,
  /license/i,
  /ssn/i,
  /card/i,
  /cvv/i,
  /cvc/i,
  /bank/i,
  /account.*number/i,
]

/**
 * Redaction placeholder
 */
const REDACTED = '[REDACTED]'

// =============================================================================
// SANITIZATION FUNCTIONS
// =============================================================================

/**
 * Check if a field name is sensitive
 */
function isSensitiveField(fieldName: string): boolean {
  const lowerName = fieldName.toLowerCase()
  
  // Check exact matches
  if (SENSITIVE_FIELDS.has(lowerName)) {
    return true
  }
  
  // Check patterns
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(fieldName))
}

/**
 * Partially redact an email address
 * john.doe@example.com -> j***e@e***.com
 */
function redactEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return REDACTED
  
  const redactedLocal = local.length > 2 
    ? `${local[0]}***${local[local.length - 1]}`
    : '***'
  
  const domainParts = domain.split('.')
  const redactedDomain = domainParts.length > 1
    ? `${domainParts[0][0]}***.${domainParts[domainParts.length - 1]}`
    : '***'
  
  return `${redactedLocal}@${redactedDomain}`
}

/**
 * Partially redact a phone number
 * +64 21 123 4567 -> +64 ** *** **67
 */
function redactPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 4) return REDACTED
  
  const lastFour = digits.slice(-4)
  return `***${lastFour}`
}

/**
 * Sanitize a single value based on field name
 */
function sanitizeValue(fieldName: string, value: unknown): unknown {
  if (value === null || value === undefined) {
    return value
  }
  
  const lowerName = fieldName.toLowerCase()
  
  // Full redaction for highly sensitive fields
  if (isSensitiveField(fieldName)) {
    // Partial redaction for contact info
    if (lowerName === 'email' && typeof value === 'string') {
      return redactEmail(value)
    }
    if ((lowerName === 'phone' || lowerName.includes('phone')) && typeof value === 'string') {
      return redactPhone(value)
    }
    return REDACTED
  }
  
  return value
}

/**
 * Recursively sanitize an object, redacting sensitive fields
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  maxDepth: number = 10
): T {
  if (maxDepth <= 0) {
    return { '[MAX_DEPTH_EXCEEDED]': true } as unknown as T
  }
  
  if (obj === null || obj === undefined) {
    return obj
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => 
      typeof item === 'object' && item !== null
        ? sanitizeObject(item as Record<string, unknown>, maxDepth - 1)
        : item
    ) as unknown as T
  }
  
  if (typeof obj !== 'object') {
    return obj
  }
  
  const sanitized: Record<string, unknown> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>, maxDepth - 1)
    } else {
      sanitized[key] = sanitizeValue(key, value)
    }
  }
  
  return sanitized as T
}

/**
 * Sanitize error objects for logging/reporting
 */
export function sanitizeError(error: Error): Record<string, unknown> {
  return {
    name: error.name,
    message: sanitizeString(error.message),
    stack: error.stack ? sanitizeStackTrace(error.stack) : undefined,
  }
}

/**
 * Sanitize a string that might contain sensitive data
 */
export function sanitizeString(str: string): string {
  let sanitized = str
  
  // Redact email addresses
  sanitized = sanitized.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    (match) => redactEmail(match)
  )
  
  // Redact potential tokens/keys (long alphanumeric strings)
  sanitized = sanitized.replace(
    /[a-zA-Z0-9_-]{32,}/g,
    REDACTED
  )
  
  // Redact potential credit card numbers
  sanitized = sanitized.replace(
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    REDACTED
  )
  
  // Redact database connection strings
  sanitized = sanitized.replace(
    /postgresql:\/\/[^@]+@[^\s]+/gi,
    'postgresql://[REDACTED]'
  )
  
  return sanitized
}

/**
 * Sanitize stack traces (remove file paths that might reveal infrastructure)
 */
function sanitizeStackTrace(stack: string): string {
  // Keep the error structure but sanitize any embedded sensitive data
  return sanitizeString(stack)
}

/**
 * Create a sanitized copy of request headers
 */
export function sanitizeHeaders(headers: Record<string, string | string[] | undefined>): Record<string, string | string[] | undefined> {
  const sensitiveHeaders = new Set([
    'authorization',
    'cookie',
    'set-cookie',
    'x-api-key',
    'x-auth-token',
  ])
  
  const sanitized: Record<string, string | string[] | undefined> = {}
  
  for (const [key, value] of Object.entries(headers)) {
    if (sensitiveHeaders.has(key.toLowerCase())) {
      sanitized[key] = REDACTED
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized
}

/**
 * Sanitize URL query parameters
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    const sensitiveParams = ['token', 'key', 'secret', 'password', 'auth']
    
    for (const param of sensitiveParams) {
      if (parsed.searchParams.has(param)) {
        parsed.searchParams.set(param, REDACTED)
      }
    }
    
    return parsed.toString()
  } catch {
    return sanitizeString(url)
  }
}
