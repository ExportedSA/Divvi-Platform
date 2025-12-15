/**
 * Performance Tracing
 * 
 * Provides basic performance monitoring and tracing:
 * - Request timing
 * - Database query timing
 * - Custom span tracking
 * - Performance metrics collection
 */

import { logger } from './logger'
import { sanitizeString } from './sanitize'

// =============================================================================
// TYPES
// =============================================================================

export interface SpanContext {
  traceId: string
  spanId: string
  parentSpanId?: string
}

export interface Span {
  name: string
  context: SpanContext
  startTime: number
  endTime?: number
  duration?: number
  status: 'ok' | 'error'
  attributes: Record<string, string | number | boolean>
  events: SpanEvent[]
}

export interface SpanEvent {
  name: string
  timestamp: number
  attributes?: Record<string, string | number | boolean>
}

export interface PerformanceMetric {
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'count' | 'percent'
  timestamp: number
  tags?: Record<string, string>
}

// =============================================================================
// TRACE CONTEXT
// =============================================================================

/**
 * Generate a trace ID
 */
function generateTraceId(): string {
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}-${Math.random().toString(16).slice(2, 10)}`
}

/**
 * Generate a span ID
 */
function generateSpanId(): string {
  return Math.random().toString(16).slice(2, 14)
}

// =============================================================================
// SPAN TRACKING
// =============================================================================

class SpanTracker {
  private activeSpans: Map<string, Span> = new Map()
  private completedSpans: Span[] = []
  private maxCompletedSpans = 1000
  
  /**
   * Start a new span
   */
  startSpan(
    name: string,
    parentContext?: SpanContext,
    attributes?: Record<string, string | number | boolean>
  ): Span {
    const context: SpanContext = {
      traceId: parentContext?.traceId || generateTraceId(),
      spanId: generateSpanId(),
      parentSpanId: parentContext?.spanId,
    }
    
    const span: Span = {
      name: sanitizeString(name),
      context,
      startTime: performance.now(),
      status: 'ok',
      attributes: attributes || {},
      events: [],
    }
    
    this.activeSpans.set(context.spanId, span)
    
    return span
  }
  
  /**
   * End a span
   */
  endSpan(span: Span, status?: 'ok' | 'error'): void {
    span.endTime = performance.now()
    span.duration = span.endTime - span.startTime
    span.status = status || span.status
    
    this.activeSpans.delete(span.context.spanId)
    this.completedSpans.push(span)
    
    // Keep completed spans under limit
    if (this.completedSpans.length > this.maxCompletedSpans) {
      this.completedSpans = this.completedSpans.slice(-this.maxCompletedSpans)
    }
    
    // Log slow spans
    if (span.duration > 1000) {
      logger.warn(`Slow span detected: ${span.name}`, {
        duration: span.duration,
        traceId: span.context.traceId,
        attributes: span.attributes,
      })
    }
  }
  
  /**
   * Add an event to a span
   */
  addEvent(
    span: Span,
    name: string,
    attributes?: Record<string, string | number | boolean>
  ): void {
    span.events.push({
      name: sanitizeString(name),
      timestamp: performance.now(),
      attributes,
    })
  }
  
  /**
   * Set an attribute on a span
   */
  setAttribute(span: Span, key: string, value: string | number | boolean): void {
    span.attributes[key] = value
  }
  
  /**
   * Get all completed spans for a trace
   */
  getTraceSpans(traceId: string): Span[] {
    return this.completedSpans.filter(s => s.context.traceId === traceId)
  }
  
  /**
   * Get recent completed spans
   */
  getRecentSpans(limit: number = 100): Span[] {
    return this.completedSpans.slice(-limit)
  }
  
  /**
   * Clear all spans
   */
  clear(): void {
    this.activeSpans.clear()
    this.completedSpans = []
  }
}

// =============================================================================
// METRICS COLLECTION
// =============================================================================

class MetricsCollector {
  private metrics: PerformanceMetric[] = []
  private maxMetrics = 10000
  
  /**
   * Record a metric
   */
  record(
    name: string,
    value: number,
    unit: 'ms' | 'bytes' | 'count' | 'percent',
    tags?: Record<string, string>
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      tags,
    }
    
    this.metrics.push(metric)
    
    // Keep metrics under limit
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }
  }
  
  /**
   * Record a timing metric
   */
  timing(name: string, durationMs: number, tags?: Record<string, string>): void {
    this.record(name, durationMs, 'ms', tags)
  }
  
  /**
   * Record a counter metric
   */
  increment(name: string, value: number = 1, tags?: Record<string, string>): void {
    this.record(name, value, 'count', tags)
  }
  
  /**
   * Get metrics by name
   */
  getMetrics(name: string, since?: number): PerformanceMetric[] {
    return this.metrics.filter(m => 
      m.name === name && (!since || m.timestamp >= since)
    )
  }
  
  /**
   * Get aggregated metrics
   */
  getAggregated(name: string, since?: number): {
    count: number
    sum: number
    avg: number
    min: number
    max: number
    p50: number
    p95: number
    p99: number
  } | null {
    const metrics = this.getMetrics(name, since)
    
    if (metrics.length === 0) {
      return null
    }
    
    const values = metrics.map(m => m.value).sort((a, b) => a - b)
    const sum = values.reduce((a, b) => a + b, 0)
    
    return {
      count: values.length,
      sum,
      avg: sum / values.length,
      min: values[0],
      max: values[values.length - 1],
      p50: values[Math.floor(values.length * 0.5)],
      p95: values[Math.floor(values.length * 0.95)],
      p99: values[Math.floor(values.length * 0.99)],
    }
  }
  
  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = []
  }
}

// =============================================================================
// SINGLETON INSTANCES
// =============================================================================

export const spanTracker = new SpanTracker()
export const metricsCollector = new MetricsCollector()

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Trace an async operation
 */
export async function trace<T>(
  name: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
  const span = spanTracker.startSpan(name, undefined, attributes)
  
  try {
    const result = await fn()
    spanTracker.endSpan(span, 'ok')
    metricsCollector.timing(`span.${name}`, span.duration || 0)
    return result
  } catch (error) {
    spanTracker.addEvent(span, 'error', {
      errorType: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? sanitizeString(error.message) : 'Unknown error',
    })
    spanTracker.endSpan(span, 'error')
    metricsCollector.timing(`span.${name}`, span.duration || 0, { status: 'error' })
    throw error
  }
}

/**
 * Trace a sync operation
 */
export function traceSync<T>(
  name: string,
  fn: () => T,
  attributes?: Record<string, string | number | boolean>
): T {
  const span = spanTracker.startSpan(name, undefined, attributes)
  
  try {
    const result = fn()
    spanTracker.endSpan(span, 'ok')
    metricsCollector.timing(`span.${name}`, span.duration || 0)
    return result
  } catch (error) {
    spanTracker.addEvent(span, 'error', {
      errorType: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? sanitizeString(error.message) : 'Unknown error',
    })
    spanTracker.endSpan(span, 'error')
    metricsCollector.timing(`span.${name}`, span.duration || 0, { status: 'error' })
    throw error
  }
}

/**
 * Create a request tracer for API routes
 */
export function createRequestTracer(request: {
  method?: string
  url?: string
}) {
  let path: string
  try {
    path = request.url ? new URL(request.url).pathname : 'unknown'
  } catch {
    path = 'unknown'
  }
  
  const span = spanTracker.startSpan('http.request', undefined, {
    'http.method': request.method || 'unknown',
    'http.path': path,
  })
  
  return {
    span,
    
    setStatus(statusCode: number): void {
      spanTracker.setAttribute(span, 'http.status_code', statusCode)
    },
    
    setUser(userId: string): void {
      spanTracker.setAttribute(span, 'user.id', userId)
    },
    
    addEvent(name: string, attributes?: Record<string, string | number | boolean>): void {
      spanTracker.addEvent(span, name, attributes)
    },
    
    end(statusCode?: number): void {
      if (statusCode) {
        spanTracker.setAttribute(span, 'http.status_code', statusCode)
      }
      
      const status = statusCode && statusCode >= 400 ? 'error' : 'ok'
      spanTracker.endSpan(span, status)
      
      metricsCollector.timing('http.request.duration', span.duration || 0, {
        method: request.method || 'unknown',
        path,
        status: String(statusCode || 200),
      })
    },
  }
}

/**
 * Time a database query
 */
export async function timeDbQuery<T>(
  queryName: string,
  fn: () => Promise<T>
): Promise<T> {
  return trace(`db.${queryName}`, fn, { 'db.type': 'postgresql' })
}

/**
 * Record a custom metric
 */
export function recordMetric(
  name: string,
  value: number,
  unit: 'ms' | 'bytes' | 'count' | 'percent' = 'count',
  tags?: Record<string, string>
): void {
  metricsCollector.record(name, value, unit, tags)
}

/**
 * Get performance summary
 */
export function getPerformanceSummary(): {
  recentSpans: Span[]
  httpMetrics: ReturnType<typeof metricsCollector.getAggregated>
  dbMetrics: ReturnType<typeof metricsCollector.getAggregated>
} {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
  
  return {
    recentSpans: spanTracker.getRecentSpans(50),
    httpMetrics: metricsCollector.getAggregated('http.request.duration', fiveMinutesAgo),
    dbMetrics: metricsCollector.getAggregated('db.query', fiveMinutesAgo),
  }
}
