/**
 * API Route Monitoring Wrapper
 * 
 * Wraps API route handlers to automatically track:
 * - Request latency
 * - Error rates
 * - Response status codes
 */

import { NextRequest, NextResponse } from 'next/server'
import { trackApiRequest, errorMonitor } from './monitoring'
import { logger } from './observability'

type RouteHandler = (
  request: NextRequest,
  context?: { params?: Record<string, string> }
) => Promise<NextResponse> | NextResponse

interface MonitoringOptions {
  name?: string
  trackLatency?: boolean
  trackErrors?: boolean
  slowThresholdMs?: number
}

/**
 * Wraps an API route handler with monitoring
 * 
 * @example
 * export const GET = withMonitoring(async (request) => {
 *   // Your handler logic
 *   return NextResponse.json({ data: 'example' })
 * }, { name: 'get-listings' })
 */
export function withMonitoring(
  handler: RouteHandler,
  options: MonitoringOptions = {}
): RouteHandler {
  const {
    name,
    trackLatency = true,
    trackErrors = true,
    slowThresholdMs = 1000
  } = options

  return async (request: NextRequest, context?: { params?: Record<string, string> }) => {
    const startTime = Date.now()
    const path = request.nextUrl.pathname
    const method = request.method

    // Track request
    errorMonitor.recordRequest()

    try {
      const response = await handler(request, context)
      const duration = Date.now() - startTime

      // Track latency and status
      if (trackLatency) {
        trackApiRequest(path, method, response.status, duration)
      }

      // Log slow requests
      if (duration > slowThresholdMs) {
        logger.warn('Slow API request', {
          path,
          method,
          duration,
          status: response.status,
          handler: name
        })
      }

      // Add timing header
      const headers = new Headers(response.headers)
      headers.set('X-Response-Time', `${duration}ms`)
      
      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      })
    } catch (error) {
      const duration = Date.now() - startTime
      const err = error as Error

      // Track error
      if (trackErrors) {
        errorMonitor.recordError(err.name || 'UnknownError', path, err.message)
        trackApiRequest(path, method, 500, duration)
      }

      logger.error('API route error', err, {
        path,
        method,
        duration,
        handler: name
      })

      // Re-throw to let Next.js handle the error
      throw error
    }
  }
}

/**
 * Higher-order function for creating monitored route handlers
 * 
 * @example
 * const monitoredHandler = createMonitoredHandler('bookings-api')
 * 
 * export const GET = monitoredHandler(async (request) => {
 *   return NextResponse.json({ bookings: [] })
 * })
 */
export function createMonitoredHandler(handlerName: string, defaultOptions: MonitoringOptions = {}) {
  return (handler: RouteHandler, options: MonitoringOptions = {}) => {
    return withMonitoring(handler, {
      name: handlerName,
      ...defaultOptions,
      ...options
    })
  }
}
