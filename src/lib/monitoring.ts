/**
 * Production Monitoring System
 * 
 * Provides comprehensive monitoring for:
 * - API latency tracking with percentiles
 * - Job failure tracking and alerting
 * - Error rate monitoring with thresholds
 * - CloudWatch/Prometheus metrics export
 */

import { logger, metrics } from './observability'

// =============================================================================
// Types
// =============================================================================

interface LatencyBucket {
  count: number
  sum: number
  min: number
  max: number
  p50: number[]
  p95: number[]
  p99: number[]
}

interface ErrorBucket {
  count: number
  byType: Record<string, number>
  byPath: Record<string, number>
  lastOccurred: string
}

interface JobMetrics {
  name: string
  totalRuns: number
  successCount: number
  failureCount: number
  lastRunAt: string | null
  lastSuccessAt: string | null
  lastFailureAt: string | null
  lastError: string | null
  avgDurationMs: number
  durations: number[]
}

interface AlertConfig {
  name: string
  condition: () => boolean
  threshold: number
  windowMs: number
  cooldownMs: number
  severity: 'warning' | 'critical'
  lastTriggered?: number
}

// =============================================================================
// Latency Monitor
// =============================================================================

class LatencyMonitor {
  private buckets: Map<string, LatencyBucket> = new Map()
  private windowMs: number = 60000 // 1 minute windows
  private maxSamples: number = 1000

  record(path: string, method: string, statusCode: number, durationMs: number) {
    const key = `${method}:${this.normalizePath(path)}:${Math.floor(statusCode / 100)}xx`
    
    let bucket = this.buckets.get(key)
    if (!bucket) {
      bucket = {
        count: 0,
        sum: 0,
        min: Infinity,
        max: 0,
        p50: [],
        p95: [],
        p99: []
      }
      this.buckets.set(key, bucket)
    }

    bucket.count++
    bucket.sum += durationMs
    bucket.min = Math.min(bucket.min, durationMs)
    bucket.max = Math.max(bucket.max, durationMs)

    // Keep samples for percentile calculation
    bucket.p50.push(durationMs)
    if (bucket.p50.length > this.maxSamples) {
      bucket.p50.shift()
    }

    // Record to metrics collector
    metrics.recordLatency(path, method, statusCode, durationMs)

    // Log slow requests
    if (durationMs > 1000) {
      logger.warn('Slow API request detected', {
        path,
        method,
        statusCode,
        durationMs,
        threshold: 1000
      })
    }
  }

  private normalizePath(path: string): string {
    // Replace dynamic segments with placeholders
    return path
      .replace(/\/[a-f0-9-]{36}/gi, '/:id')
      .replace(/\/\d+/g, '/:id')
      .replace(/\?.*$/, '')
  }

  getStats(key?: string): Record<string, any> {
    if (key) {
      const bucket = this.buckets.get(key)
      if (!bucket) return {}
      return this.calculateStats(key, bucket)
    }

    const stats: Record<string, any> = {}
    Array.from(this.buckets.entries()).forEach(([k, bucket]) => {
      stats[k] = this.calculateStats(k, bucket)
    })
    return stats
  }

  private calculateStats(key: string, bucket: LatencyBucket) {
    const sorted = [...bucket.p50].sort((a, b) => a - b)
    const len = sorted.length

    return {
      key,
      count: bucket.count,
      avg: bucket.count > 0 ? Math.round(bucket.sum / bucket.count) : 0,
      min: bucket.min === Infinity ? 0 : bucket.min,
      max: bucket.max,
      p50: len > 0 ? sorted[Math.floor(len * 0.5)] : 0,
      p95: len > 0 ? sorted[Math.floor(len * 0.95)] : 0,
      p99: len > 0 ? sorted[Math.floor(len * 0.99)] : 0
    }
  }

  getSlowEndpoints(thresholdMs: number = 500): Array<{ endpoint: string; avgMs: number; count: number }> {
    const slow: Array<{ endpoint: string; avgMs: number; count: number }> = []
    
    Array.from(this.buckets.entries()).forEach(([key, bucket]) => {
      const avg = bucket.count > 0 ? bucket.sum / bucket.count : 0
      if (avg > thresholdMs) {
        slow.push({ endpoint: key, avgMs: Math.round(avg), count: bucket.count })
      }
    })

    return slow.sort((a, b) => b.avgMs - a.avgMs)
  }

  reset() {
    this.buckets.clear()
  }
}

// =============================================================================
// Error Rate Monitor
// =============================================================================

class ErrorRateMonitor {
  private errors: ErrorBucket = {
    count: 0,
    byType: {},
    byPath: {},
    lastOccurred: ''
  }
  private requestCount: number = 0
  private windowStart: number = Date.now()
  private windowMs: number = 60000 // 1 minute window
  private history: Array<{ timestamp: number; errorRate: number }> = []

  recordRequest() {
    this.maybeRotateWindow()
    this.requestCount++
  }

  recordError(errorType: string, path: string, message?: string) {
    this.maybeRotateWindow()
    
    this.errors.count++
    this.errors.byType[errorType] = (this.errors.byType[errorType] || 0) + 1
    this.errors.byPath[path] = (this.errors.byPath[path] || 0) + 1
    this.errors.lastOccurred = new Date().toISOString()

    metrics.recordError(errorType, path)

    logger.error('Error recorded', undefined, {
      errorType,
      path,
      message,
      currentErrorRate: this.getErrorRate()
    })
  }

  private maybeRotateWindow() {
    const now = Date.now()
    if (now - this.windowStart >= this.windowMs) {
      // Save to history
      if (this.requestCount > 0) {
        this.history.push({
          timestamp: this.windowStart,
          errorRate: this.getErrorRate()
        })
        // Keep last 60 windows (1 hour)
        if (this.history.length > 60) {
          this.history.shift()
        }
      }

      // Reset window
      this.errors = {
        count: 0,
        byType: {},
        byPath: {},
        lastOccurred: this.errors.lastOccurred
      }
      this.requestCount = 0
      this.windowStart = now
    }
  }

  getErrorRate(): number {
    if (this.requestCount === 0) return 0
    return (this.errors.count / this.requestCount) * 100
  }

  getStats() {
    return {
      currentWindow: {
        requests: this.requestCount,
        errors: this.errors.count,
        errorRate: this.getErrorRate().toFixed(2) + '%',
        byType: this.errors.byType,
        byPath: this.errors.byPath,
        lastError: this.errors.lastOccurred
      },
      history: this.history.slice(-10).map(h => ({
        timestamp: new Date(h.timestamp).toISOString(),
        errorRate: h.errorRate.toFixed(2) + '%'
      }))
    }
  }

  isAboveThreshold(thresholdPercent: number = 5): boolean {
    return this.getErrorRate() > thresholdPercent
  }
}

// =============================================================================
// Job Monitor
// =============================================================================

class JobMonitor {
  private jobs: Map<string, JobMetrics> = new Map()
  private maxDurations: number = 100

  startJob(jobName: string): () => void {
    const startTime = Date.now()
    
    return () => {
      const duration = Date.now() - startTime
      this.recordCompletion(jobName, true, duration)
    }
  }

  recordCompletion(jobName: string, success: boolean, durationMs: number, error?: string) {
    let job = this.jobs.get(jobName)
    if (!job) {
      job = {
        name: jobName,
        totalRuns: 0,
        successCount: 0,
        failureCount: 0,
        lastRunAt: null,
        lastSuccessAt: null,
        lastFailureAt: null,
        lastError: null,
        avgDurationMs: 0,
        durations: []
      }
      this.jobs.set(jobName, job)
    }

    const now = new Date().toISOString()
    job.totalRuns++
    job.lastRunAt = now
    job.durations.push(durationMs)

    if (job.durations.length > this.maxDurations) {
      job.durations.shift()
    }

    job.avgDurationMs = job.durations.reduce((a, b) => a + b, 0) / job.durations.length

    if (success) {
      job.successCount++
      job.lastSuccessAt = now
    } else {
      job.failureCount++
      job.lastFailureAt = now
      job.lastError = error || 'Unknown error'

      logger.error(`Job failed: ${jobName}`, undefined, {
        jobName,
        durationMs,
        error,
        failureCount: job.failureCount,
        successRate: this.getSuccessRate(jobName)
      })

      metrics.record('job.failure', 1, 'count', { job: jobName })
    }

    metrics.record('job.duration', durationMs, 'ms', { job: jobName, status: success ? 'success' : 'failure' })
  }

  recordFailure(jobName: string, error: Error | string, durationMs: number = 0) {
    const errorMessage = error instanceof Error ? error.message : error
    this.recordCompletion(jobName, false, durationMs, errorMessage)
  }

  getSuccessRate(jobName: string): number {
    const job = this.jobs.get(jobName)
    if (!job || job.totalRuns === 0) return 100
    return (job.successCount / job.totalRuns) * 100
  }

  getStats(jobName?: string): JobMetrics | Record<string, JobMetrics> | null {
    if (jobName) {
      return this.jobs.get(jobName) || null
    }

    const stats: Record<string, JobMetrics> = {}
    Array.from(this.jobs.entries()).forEach(([name, job]) => {
      stats[name] = { ...job }
    })
    return stats
  }

  getFailingJobs(thresholdPercent: number = 90): JobMetrics[] {
    const failing: JobMetrics[] = []
    
    Array.from(this.jobs.values()).forEach(job => {
      if (job.totalRuns >= 5 && this.getSuccessRate(job.name) < thresholdPercent) {
        failing.push(job)
      }
    })

    return failing
  }
}

// =============================================================================
// Alert Manager
// =============================================================================

class AlertManager {
  private alerts: AlertConfig[] = []
  private triggeredAlerts: Array<{ name: string; severity: string; timestamp: string; message: string }> = []

  constructor(
    private latencyMonitor: LatencyMonitor,
    private errorMonitor: ErrorRateMonitor,
    private jobMonitor: JobMonitor
  ) {
    this.setupDefaultAlerts()
  }

  private setupDefaultAlerts() {
    // High error rate alert
    this.addAlert({
      name: 'high_error_rate',
      condition: () => this.errorMonitor.getErrorRate() > 5,
      threshold: 5,
      windowMs: 60000,
      cooldownMs: 300000, // 5 min cooldown
      severity: 'critical'
    })

    // Critical error rate
    this.addAlert({
      name: 'critical_error_rate',
      condition: () => this.errorMonitor.getErrorRate() > 10,
      threshold: 10,
      windowMs: 60000,
      cooldownMs: 60000,
      severity: 'critical'
    })

    // Slow API response
    this.addAlert({
      name: 'slow_api_response',
      condition: () => {
        const slow = this.latencyMonitor.getSlowEndpoints(2000)
        return slow.length > 0
      },
      threshold: 2000,
      windowMs: 60000,
      cooldownMs: 300000,
      severity: 'warning'
    })

    // Job failures
    this.addAlert({
      name: 'job_failures',
      condition: () => {
        const failing = this.jobMonitor.getFailingJobs(80)
        return failing.length > 0
      },
      threshold: 80,
      windowMs: 300000,
      cooldownMs: 600000,
      severity: 'warning'
    })
  }

  addAlert(config: AlertConfig) {
    this.alerts.push(config)
  }

  check(): Array<{ name: string; severity: string; message: string }> {
    const triggered: Array<{ name: string; severity: string; message: string }> = []
    const now = Date.now()

    for (const alert of this.alerts) {
      // Check cooldown
      if (alert.lastTriggered && now - alert.lastTriggered < alert.cooldownMs) {
        continue
      }

      if (alert.condition()) {
        alert.lastTriggered = now
        
        const alertInfo = {
          name: alert.name,
          severity: alert.severity,
          timestamp: new Date().toISOString(),
          message: `Alert ${alert.name} triggered (threshold: ${alert.threshold})`
        }

        triggered.push(alertInfo)
        this.triggeredAlerts.push(alertInfo)

        // Keep last 100 alerts
        if (this.triggeredAlerts.length > 100) {
          this.triggeredAlerts.shift()
        }

        logger.warn(`Alert triggered: ${alert.name}`, {
          severity: alert.severity,
          threshold: alert.threshold
        })

        // Send to external alerting service
        this.sendAlert(alertInfo)
      }
    }

    return triggered
  }

  private async sendAlert(alert: { name: string; severity: string; message: string }) {
    // Integration points for alerting services
    try {
      // PagerDuty
      if (process.env.PAGERDUTY_ROUTING_KEY && alert.severity === 'critical') {
        await this.sendToPagerDuty(alert)
      }

      // Slack
      if (process.env.SLACK_WEBHOOK_URL) {
        await this.sendToSlack(alert)
      }

      // Email (via your email service)
      if (process.env.ALERT_EMAIL && alert.severity === 'critical') {
        // Email integration would go here
      }
    } catch (e) {
      logger.error('Failed to send alert', e as Error, { alert })
    }
  }

  private async sendToPagerDuty(alert: { name: string; severity: string; message: string }) {
    if (!process.env.PAGERDUTY_ROUTING_KEY) return

    try {
      await fetch('https://events.pagerduty.com/v2/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routing_key: process.env.PAGERDUTY_ROUTING_KEY,
          event_action: 'trigger',
          payload: {
            summary: alert.message,
            severity: alert.severity === 'critical' ? 'critical' : 'warning',
            source: 'machinery-rentals',
            custom_details: alert
          }
        })
      })
    } catch (e) {
      logger.error('Failed to send PagerDuty alert', e as Error)
    }
  }

  private async sendToSlack(alert: { name: string; severity: string; message: string }) {
    if (!process.env.SLACK_WEBHOOK_URL) return

    const color = alert.severity === 'critical' ? '#dc3545' : '#ffc107'

    try {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attachments: [{
            color,
            title: `🚨 ${alert.severity.toUpperCase()}: ${alert.name}`,
            text: alert.message,
            footer: 'Machinery Rentals Monitoring',
            ts: Math.floor(Date.now() / 1000)
          }]
        })
      })
    } catch (e) {
      logger.error('Failed to send Slack alert', e as Error)
    }
  }

  getTriggeredAlerts(limit: number = 20) {
    return this.triggeredAlerts.slice(-limit)
  }
}

// =============================================================================
// Metrics Exporter (Prometheus format)
// =============================================================================

class MetricsExporter {
  constructor(
    private latencyMonitor: LatencyMonitor,
    private errorMonitor: ErrorRateMonitor,
    private jobMonitor: JobMonitor
  ) {}

  toPrometheus(): string {
    const lines: string[] = []

    // API Latency metrics
    lines.push('# HELP api_request_duration_ms API request duration in milliseconds')
    lines.push('# TYPE api_request_duration_ms histogram')
    
    const latencyStats = this.latencyMonitor.getStats()
    for (const [key, stats] of Object.entries(latencyStats)) {
      const labels = this.parseKey(key)
      lines.push(`api_request_duration_ms_count{${labels}} ${stats.count}`)
      lines.push(`api_request_duration_ms_sum{${labels}} ${stats.avg * stats.count}`)
      lines.push(`api_request_duration_ms{${labels},quantile="0.5"} ${stats.p50}`)
      lines.push(`api_request_duration_ms{${labels},quantile="0.95"} ${stats.p95}`)
      lines.push(`api_request_duration_ms{${labels},quantile="0.99"} ${stats.p99}`)
    }

    // Error rate metrics
    lines.push('')
    lines.push('# HELP error_rate_percent Current error rate percentage')
    lines.push('# TYPE error_rate_percent gauge')
    const errorStats = this.errorMonitor.getStats()
    lines.push(`error_rate_percent ${errorStats.currentWindow.errorRate.replace('%', '')}`)
    lines.push(`error_count_total ${errorStats.currentWindow.errors}`)
    lines.push(`request_count_total ${errorStats.currentWindow.requests}`)

    // Job metrics
    lines.push('')
    lines.push('# HELP job_runs_total Total job runs')
    lines.push('# TYPE job_runs_total counter')
    lines.push('# HELP job_success_rate Job success rate percentage')
    lines.push('# TYPE job_success_rate gauge')
    
    const jobStats = this.jobMonitor.getStats() as Record<string, JobMetrics>
    for (const [name, job] of Object.entries(jobStats)) {
      lines.push(`job_runs_total{job="${name}"} ${job.totalRuns}`)
      lines.push(`job_success_total{job="${name}"} ${job.successCount}`)
      lines.push(`job_failure_total{job="${name}"} ${job.failureCount}`)
      lines.push(`job_duration_avg_ms{job="${name}"} ${Math.round(job.avgDurationMs)}`)
    }

    return lines.join('\n')
  }

  private parseKey(key: string): string {
    const [method, path, status] = key.split(':')
    return `method="${method}",path="${path}",status="${status}"`
  }

  toCloudWatch(): Array<{ MetricName: string; Value: number; Unit: string; Dimensions: Array<{ Name: string; Value: string }> }> {
    const metrics: Array<{ MetricName: string; Value: number; Unit: string; Dimensions: Array<{ Name: string; Value: string }> }> = []

    // Error rate
    const errorStats = this.errorMonitor.getStats()
    metrics.push({
      MetricName: 'ErrorRate',
      Value: parseFloat(errorStats.currentWindow.errorRate),
      Unit: 'Percent',
      Dimensions: [{ Name: 'Service', Value: 'machinery-rentals' }]
    })

    // Latency percentiles
    const latencyStats = this.latencyMonitor.getStats()
    for (const [key, stats] of Object.entries(latencyStats)) {
      const [method, path] = key.split(':')
      metrics.push({
        MetricName: 'APILatencyP95',
        Value: stats.p95,
        Unit: 'Milliseconds',
        Dimensions: [
          { Name: 'Service', Value: 'machinery-rentals' },
          { Name: 'Endpoint', Value: `${method} ${path}` }
        ]
      })
    }

    // Job failures
    const jobStats = this.jobMonitor.getStats() as Record<string, JobMetrics>
    for (const [name, job] of Object.entries(jobStats)) {
      metrics.push({
        MetricName: 'JobFailureCount',
        Value: job.failureCount,
        Unit: 'Count',
        Dimensions: [
          { Name: 'Service', Value: 'machinery-rentals' },
          { Name: 'JobName', Value: name }
        ]
      })
    }

    return metrics
  }
}

// =============================================================================
// Singleton Instances
// =============================================================================

export const latencyMonitor = new LatencyMonitor()
export const errorMonitor = new ErrorRateMonitor()
export const jobMonitor = new JobMonitor()
export const alertManager = new AlertManager(latencyMonitor, errorMonitor, jobMonitor)
export const metricsExporter = new MetricsExporter(latencyMonitor, errorMonitor, jobMonitor)

// Start periodic alert checking
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    alertManager.check()
  }, 30000) // Check every 30 seconds
}

// =============================================================================
// Convenience Functions
// =============================================================================

export function trackApiRequest(path: string, method: string, statusCode: number, durationMs: number) {
  errorMonitor.recordRequest()
  latencyMonitor.record(path, method, statusCode, durationMs)
  
  if (statusCode >= 500) {
    errorMonitor.recordError('ServerError', path)
  } else if (statusCode >= 400) {
    errorMonitor.recordError('ClientError', path)
  }
}

export function trackJobExecution<T>(jobName: string, fn: () => Promise<T>): Promise<T> {
  const complete = jobMonitor.startJob(jobName)
  
  return fn()
    .then(result => {
      complete()
      return result
    })
    .catch(error => {
      jobMonitor.recordFailure(jobName, error)
      throw error
    })
}

export function getMonitoringStats() {
  return {
    latency: latencyMonitor.getStats(),
    slowEndpoints: latencyMonitor.getSlowEndpoints(),
    errors: errorMonitor.getStats(),
    jobs: jobMonitor.getStats(),
    failingJobs: jobMonitor.getFailingJobs(),
    recentAlerts: alertManager.getTriggeredAlerts()
  }
}
