/**
 * Structured Logging Utility
 * 
 * Provides consistent, structured logging across the application with:
 * - Log levels (debug, info, warn, error)
 * - Structured JSON output in production
 * - Pretty printing in development
 * - Automatic PII sanitization
 * - Request context tracking
 */

import { sanitizeObject, sanitizeString } from './sanitize'

// =============================================================================
// TYPES
// =============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  requestId?: string
  userId?: string
  sessionId?: string
  path?: string
  method?: string
  [key: string]: unknown
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  data?: Record<string, unknown>
  error?: {
    name: string
    message: string
    stack?: string
  }
  duration?: number
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

function getMinLogLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel
  if (envLevel && LOG_LEVELS[envLevel] !== undefined) {
    return envLevel
  }
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug'
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[getMinLogLevel()]
}

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

// =============================================================================
// FORMATTING
// =============================================================================

/**
 * Format log entry as JSON for production
 */
function formatJson(entry: LogEntry): string {
  return JSON.stringify(entry)
}

/**
 * Format log entry for human-readable development output
 */
function formatPretty(entry: LogEntry): string {
  const levelColors: Record<LogLevel, string> = {
    debug: '\x1b[36m', // cyan
    info: '\x1b[32m',  // green
    warn: '\x1b[33m',  // yellow
    error: '\x1b[31m', // red
  }
  const reset = '\x1b[0m'
  const dim = '\x1b[2m'
  
  const color = levelColors[entry.level]
  const levelStr = entry.level.toUpperCase().padEnd(5)
  const time = new Date(entry.timestamp).toLocaleTimeString()
  
  let output = `${dim}${time}${reset} ${color}${levelStr}${reset} ${entry.message}`
  
  if (entry.context?.requestId) {
    output += ` ${dim}[${entry.context.requestId}]${reset}`
  }
  
  if (entry.data && Object.keys(entry.data).length > 0) {
    output += `\n${dim}  data: ${JSON.stringify(entry.data, null, 2).replace(/\n/g, '\n  ')}${reset}`
  }
  
  if (entry.error) {
    output += `\n${color}  error: ${entry.error.name}: ${entry.error.message}${reset}`
    if (entry.error.stack) {
      output += `\n${dim}${entry.error.stack}${reset}`
    }
  }
  
  if (entry.duration !== undefined) {
    output += ` ${dim}(${entry.duration}ms)${reset}`
  }
  
  return output
}

// =============================================================================
// LOGGER CLASS
// =============================================================================

class Logger {
  private context: LogContext = {}
  
  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    const child = new Logger()
    child.context = { ...this.context, ...context }
    return child
  }
  
  /**
   * Set context for this logger instance
   */
  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context }
  }
  
  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>,
    error?: Error
  ): void {
    if (!shouldLog(level)) {
      return
    }
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: sanitizeString(message),
      context: Object.keys(this.context).length > 0 
        ? sanitizeObject(this.context) 
        : undefined,
      data: data ? sanitizeObject(data) : undefined,
      error: error ? {
        name: error.name,
        message: sanitizeString(error.message),
        stack: error.stack,
      } : undefined,
    }
    
    const output = isProduction() ? formatJson(entry) : formatPretty(entry)
    
    switch (level) {
      case 'error':
        console.error(output)
        break
      case 'warn':
        console.warn(output)
        break
      case 'debug':
        console.debug(output)
        break
      default:
        console.log(output)
    }
  }
  
  /**
   * Debug level - detailed information for debugging
   */
  debug(message: string, data?: Record<string, unknown>): void {
    this.log('debug', message, data)
  }
  
  /**
   * Info level - general operational information
   */
  info(message: string, data?: Record<string, unknown>): void {
    this.log('info', message, data)
  }
  
  /**
   * Warn level - potentially problematic situations
   */
  warn(message: string, data?: Record<string, unknown>): void {
    this.log('warn', message, data)
  }
  
  /**
   * Error level - error events that might still allow the application to continue
   */
  error(message: string, error?: Error | unknown, data?: Record<string, unknown>): void {
    const err = error instanceof Error ? error : undefined
    const extraData = error instanceof Error ? data : { ...(error as Record<string, unknown>), ...data }
    this.log('error', message, extraData, err)
  }
  
  /**
   * Log with timing information
   */
  timed<T>(
    message: string,
    fn: () => T | Promise<T>,
    data?: Record<string, unknown>
  ): T | Promise<T> {
    const start = Date.now()
    
    const logCompletion = (result: T) => {
      const duration = Date.now() - start
      this.info(`${message} completed`, { ...data, duration })
      return result
    }
    
    const logError = (error: Error) => {
      const duration = Date.now() - start
      this.error(`${message} failed`, error, { ...data, duration })
      throw error
    }
    
    try {
      const result = fn()
      
      if (result instanceof Promise) {
        return result.then(logCompletion).catch(logError)
      }
      
      return logCompletion(result)
    } catch (error) {
      logError(error as Error)
      throw error // TypeScript needs this even though logError throws
    }
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

/**
 * Default logger instance
 */
export const logger = new Logger()

/**
 * Create a logger with request context
 */
export function createRequestLogger(request: {
  headers?: { get?: (name: string) => string | null }
  url?: string
  method?: string
}): Logger {
  const requestId = request.headers?.get?.('x-request-id') || 
                    request.headers?.get?.('x-vercel-id') ||
                    generateRequestId()
  
  let path: string | undefined
  try {
    path = request.url ? new URL(request.url).pathname : undefined
  } catch {
    path = undefined
  }
  
  return logger.child({
    requestId,
    path,
    method: request.method,
  })
}

/**
 * Generate a simple request ID
 */
function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Create a logger for a specific module/component
 */
export function createModuleLogger(moduleName: string): Logger {
  return logger.child({ module: moduleName })
}
