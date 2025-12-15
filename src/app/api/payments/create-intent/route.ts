/**
 * Payment Intent Creation API
 * 
 * Creates a Stripe payment intent for a booking.
 * All amount calculations are done server-side - never trust client amounts.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPaymentIntent, createDepositPaymentIntent } from '@/lib/payments'

// POST /api/payments/create-intent
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const { bookingId, paymentMode = 'FULL', depositPercent = 20 } = body

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      )
    }

    // Verify user is the renter for this booking
    const { prisma } = await import('@/lib/prisma')
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { renterId: true, bookingStatus: true },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    if (booking.renterId !== userId) {
      return NextResponse.json(
        { error: 'You are not authorized to pay for this booking' },
        { status: 403 }
      )
    }

    if (booking.bookingStatus !== 'ACCEPTED') {
      return NextResponse.json(
        { error: 'Booking must be accepted before payment' },
        { status: 400 }
      )
    }

    // Create payment intent based on mode
    let result
    if (paymentMode === 'DEPOSIT') {
      result = await createDepositPaymentIntent({
        bookingId,
        depositPercent: Math.min(Math.max(depositPercent, 10), 50), // Clamp between 10-50%
      })
    } else {
      result = await createPaymentIntent({
        bookingId,
        amounts: {} as any, // Amounts calculated server-side
      })
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create payment intent' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId,
    })
  } catch (error) {
    console.error('Create payment intent error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}
