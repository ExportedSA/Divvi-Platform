import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { 
  metricsExporter, 
  getMonitoringStats,
  latencyMonitor,
  errorMonitor,
  jobMonitor,
  alertManager
} from '@/lib/monitoring'

/**
 * GET /api/metrics
 * 
 * Returns metrics in various formats:
 * - ?format=prometheus - Prometheus text format
 * - ?format=cloudwatch - CloudWatch JSON format
 * - ?format=json (default) - Full JSON stats
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Require admin for detailed metrics
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
      })
      
      if (user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
    } else {
      // Allow unauthenticated access for Prometheus scraping with secret
      const authHeader = request.headers.get('authorization')
      const metricsSecret = process.env.METRICS_SECRET
      
      if (metricsSecret && authHeader !== `Bearer ${metricsSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const format = request.nextUrl.searchParams.get('format') || 'json'

    switch (format) {
      case 'prometheus':
        return new NextResponse(metricsExporter.toPrometheus(), {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8'
          }
        })

      case 'cloudwatch':
        return NextResponse.json({
          metrics: metricsExporter.toCloudWatch(),
          timestamp: new Date().toISOString()
        })

      case 'json':
      default:
        return NextResponse.json({
          timestamp: new Date().toISOString(),
          ...getMonitoringStats()
        })
    }
  } catch (error) {
    console.error('Error fetching metrics:', error)
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 })
  }
}

/**
 * POST /api/metrics/alert
 * 
 * Manually trigger alert check (for testing)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const triggered = alertManager.check()

    return NextResponse.json({
      checked: true,
      triggeredAlerts: triggered,
      recentAlerts: alertManager.getTriggeredAlerts()
    })
  } catch (error) {
    console.error('Error checking alerts:', error)
    return NextResponse.json({ error: 'Failed to check alerts' }, { status: 500 })
  }
}
