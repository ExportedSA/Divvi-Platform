/**
 * Listing Availability API
 * 
 * Check availability for specific listings and dates.
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkListingAvailability, getListingAvailability } from '@/lib/search'

// GET /api/search/availability?listingId=xxx&startDate=xxx&endDate=xxx
// GET /api/search/availability?listingId=xxx&year=2024&month=1
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const listingId = searchParams.get('listingId')

    if (!listingId) {
      return NextResponse.json(
        { error: 'listingId is required' },
        { status: 400 }
      )
    }

    // Check specific date range
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (startDate && endDate) {
      const result = await checkListingAvailability(
        listingId,
        new Date(startDate),
        new Date(endDate)
      )
      return NextResponse.json(result)
    }

    // Get monthly availability calendar
    const year = searchParams.get('year')
    const month = searchParams.get('month')

    if (year && month) {
      const availability = await getListingAvailability(
        listingId,
        parseInt(year),
        parseInt(month)
      )
      return NextResponse.json({ listingId, year, month, availability })
    }

    return NextResponse.json(
      { error: 'Provide either startDate/endDate or year/month' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Availability check error:', error)
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    )
  }
}
