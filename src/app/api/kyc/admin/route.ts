/**
 * KYC Admin API
 * 
 * Admin endpoints for reviewing and approving/rejecting KYC documents.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  getPendingVerifications,
  getVerificationDetails,
  approveVerification,
  rejectVerification,
} from '@/lib/kyc'

// GET /api/kyc/admin - Get pending verification requests
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role

    // Only admins can access
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get('id')

    // If specific ID requested, return details
    if (requestId) {
      const details = await getVerificationDetails(requestId)
      if (!details) {
        return NextResponse.json(
          { error: 'Verification request not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(details)
    }

    // Otherwise return pending list
    const limit = parseInt(searchParams.get('limit') || '50')
    const pending = await getPendingVerifications(limit)

    return NextResponse.json({
      pending,
      count: pending.length,
    })
  } catch (error) {
    console.error('Get pending verifications error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch verifications' },
      { status: 500 }
    )
  }
}

// POST /api/kyc/admin - Approve or reject a verification
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const userRole = (session.user as any).role

    // Only admins can approve/reject
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { requestId, action, reason, notes } = body

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      )
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    if (action === 'reject' && !reason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      )
    }

    let result
    if (action === 'approve') {
      result = await approveVerification(requestId, userId, notes)
    } else {
      result = await rejectVerification(requestId, userId, reason)
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || `Failed to ${action} verification` },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      action,
      status: result.status,
      message: `Verification ${action}d successfully`,
    })
  } catch (error) {
    console.error('Admin verification action error:', error)
    return NextResponse.json(
      { error: 'Failed to process verification' },
      { status: 500 }
    )
  }
}
