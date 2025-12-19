/**
 * Observability Module
 * 
 * Provides logging and metrics collection for the application.
 * This is a lightweight implementation for production monitoring.
 */

// =============================================================================
// LOGGER
// =============================================================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

class Logger {
  private level: LogLevel = 'info'
  private levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  }

  constructor() {
    const envLevel = process.env.LOG_LEVEL as LogLevel
    if (envLevel && this.levels[envLevel] !== undefined) {
      this.level = envLevel
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.level]
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` ${JSON.stringify(context)}` : ''
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context))
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context))
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context))
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const errorContext = error
        ? { ...context, error: error.message, stack: error.stack }
        : context
      console.error(this.formatMessage('error', message, errorContext))
    }
  }
}

// =============================================================================
// METRICS COLLECTOR
// =============================================================================

interface MetricData {
  name: string
  value: number
  unit: string
  tags: Record<string, string>
  timestamp: number
}

class MetricsCollector {
  private metrics: MetricData[] = []
  private maxMetrics: number = 10000

  record(name: string, value: number, unit: string = 'count', tags: Record<string, string> = {}): void {
    this.metrics.push({
      name,
      value,
      unit,
      tags,
      timestamp: Date.now(),
    })

    // Prevent memory leak
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics / 2)
    }
  }

  recordLatency(path: string, method: string, statusCode: number, durationMs: number): void {
    this.record('api.latency', durationMs, 'ms', {
      path: this.normalizePath(path),
      method,
      status: String(statusCode),
    })
  }

  recordError(errorType: string, path: string): void {
    this.record('api.error', 1, 'count', {
      type: errorType,
      path: this.normalizePath(path),
    })
  }

  private normalizePath(path: string): string {
    return path
      .replace(/\/[a-f0-9-]{36}/gi, '/:id')
      .replace(/\/\d+/g, '/:id')
      .replace(/\?.*$/, '')
  }

  getMetrics(since?: number): MetricData[] {
    if (since) {
      return this.metrics.filter(m => m.timestamp >= since)
    }
    return [...this.metrics]
  }

  clear(): void {
    this.metrics = []
  }
}

// =============================================================================
// SINGLETON EXPORTS
// =============================================================================

export const logger = new Logger()
export const metrics = new MetricsCollector()
