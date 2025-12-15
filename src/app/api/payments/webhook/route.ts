/**
 * Stripe Webhook Handler
 * 
 * Handles Stripe webhook events for payment status updates.
 * This is the authoritative source for payment status - not client callbacks.
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature, handleWebhookEvent } from '@/lib/payments'

// POST /api/payments/webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    const event = verifyWebhookSignature(body, signature)

    if (!event) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      )
    }

    // Handle the event
    const result = await handleWebhookEvent(event)

    if (!result.success) {
      console.error('Webhook handling failed:', result.error)
      // Return 200 to prevent Stripe from retrying
      // Log the error for investigation
      return NextResponse.json({ received: true, error: result.error })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    // Return 200 to prevent infinite retries
    return NextResponse.json({ received: true, error: 'Internal error' })
  }
}

// Disable body parsing for webhook (need raw body for signature verification)
export const config = {
  api: {
    bodyParser: false,
  },
}
