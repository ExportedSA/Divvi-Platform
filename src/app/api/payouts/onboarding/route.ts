/**
 * Stripe Connect Onboarding API
 * 
 * Endpoints for owner payout account setup.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  createStripeConnectAccount,
  refreshStripeAccountStatus,
} from '@/lib/payments/payout-service'

// POST /api/payouts/onboarding - Start Stripe Connect onboarding
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const userEmail = (session.user as any).email

    // Verify user is an owner
    const { prisma } = await import('@/lib/prisma')
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, country: true },
    })

    if (!user || (user.role !== 'OWNER' && user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Only owners can set up payout accounts' },
        { status: 403 }
      )
    }

    // Create Stripe Connect account
    const result = await createStripeConnectAccount(
      userId,
      userEmail,
      user.country as 'NZ' | 'AU'
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create account' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      accountId: result.accountId,
      onboardingUrl: result.onboardingUrl,
    })
  } catch (error) {
    console.error('Onboarding error:', error)
    return NextResponse.json(
      { error: 'Failed to start onboarding' },
      { status: 500 }
    )
  }
}

// GET /api/payouts/onboarding - Check onboarding status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Refresh status from Stripe
    const result = await refreshStripeAccountStatus(userId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to check status' },
        { status: 400 }
      )
    }

    // Get full account details
    const { prisma } = await import('@/lib/prisma')
    const payoutAccount = await prisma.ownerPayoutAccount.findUnique({
      where: { userId },
      select: {
        stripeAccountId: true,
        stripeAccountStatus: true,
        stripeOnboardingComplete: true,
        isVerified: true,
        bankName: true,
        accountLastFour: true,
        payoutSchedule: true,
        minimumPayoutAmount: true,
      },
    })

    return NextResponse.json({
      success: true,
      status: result.status,
      account: payoutAccount,
    })
  } catch (error) {
    console.error('Check onboarding status error:', error)
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    )
  }
}
