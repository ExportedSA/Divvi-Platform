/**
 * Payment Confirmation API
 * 
 * Server-side payment status verification.
 * NEVER trust client-side payment confirmation - always verify with Stripe.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { confirmPaymentStatus } from '@/lib/payments'

// POST /api/payments/confirm
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { paymentIntentId } = body

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      )
    }

    // Verify payment status directly with Stripe (server-side)
    const result = await confirmPaymentStatus(paymentIntentId)

    return NextResponse.json({
      success: result.success,
      status: result.status,
      error: result.error,
    })
  } catch (error) {
    console.error('Confirm payment error:', error)
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    )
  }
}
