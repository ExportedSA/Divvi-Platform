/**
 * Stripe Webhook Handler
 * 
 * Handles Stripe webhook events for payment status updates.
 * This is the authoritative source for payment status - not client callbacks.
 * 
 * Features:
 * - Signature verification (rejects unverified webhooks)
 * - Idempotent handling (deduplicates events)
 * - Booking state synchronization
 * - Comprehensive logging
 * - Retry safety (always returns 200 to prevent infinite retries)
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature, processWebhookEvent } from '@/lib/payments/webhook-handler'

// POST /api/payments/webhook
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Get raw body for signature verification
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    // ==========================================================================
    // STEP 1: Validate signature header exists
    // ==========================================================================
    if (!signature) {
      console.error('[Webhook] Missing stripe-signature header')
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // ==========================================================================
    // STEP 2: Verify webhook signature (CRITICAL - never skip this)
    // ==========================================================================
    const event = verifyWebhookSignature(body, signature)

    if (!event) {
      console.error('[Webhook] Signature verification failed')
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      )
    }

    console.log(`[Webhook] Received event ${event.id} (${event.type})`)

    // ==========================================================================
    // STEP 3: Process event with idempotency
    // ==========================================================================
    const result = await processWebhookEvent(event)

    const duration = Date.now() - startTime

    if (result.skipped) {
      console.log(`[Webhook] Event ${event.id} skipped (already processed) in ${duration}ms`)
      return NextResponse.json({ 
        received: true, 
        eventId: event.id,
        skipped: true,
      })
    }

    if (!result.success) {
      // Log error but return 200 to prevent Stripe from retrying indefinitely
      // Failed events are stored in webhook_events table for manual retry
      console.error(`[Webhook] Event ${event.id} failed in ${duration}ms:`, result.error)
      return NextResponse.json({ 
        received: true, 
        eventId: event.id,
        error: result.error,
      })
    }

    console.log(`[Webhook] Event ${event.id} processed successfully in ${duration}ms`)
    return NextResponse.json({ 
      received: true, 
      eventId: event.id,
      processed: true,
    })

  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[Webhook] Unexpected error after ${duration}ms:`, error)
    
    // Always return 200 to prevent infinite retries
    // Errors are logged for investigation
    return NextResponse.json({ 
      received: true, 
      error: 'Internal error',
    })
  }
}

// Route segment config for App Router
// Dynamic forces dynamic rendering (not static)
export const dynamic = 'force-dynamic'

// Disable static optimization for webhooks
export const runtime = 'nodejs'
