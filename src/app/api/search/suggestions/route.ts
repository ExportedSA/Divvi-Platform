/**
 * Search Suggestions API
 * 
 * Returns autocomplete suggestions for search queries.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSearchSuggestions } from '@/lib/search'

// GET /api/search/suggestions?q=trac
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 10)

    if (query.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    const suggestions = await getSearchSuggestions(query, limit)

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Suggestions error:', error)
    return NextResponse.json(
      { error: 'Failed to get suggestions' },
      { status: 500 }
    )
  }
}
