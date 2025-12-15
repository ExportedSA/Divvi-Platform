/**
 * Search API Endpoint
 * 
 * Handles listing search with filtering, sorting, and availability.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  searchListings,
  searchAvailableListings,
  getSearchFacets,
  type SearchFilters,
  type SortOption,
} from '@/lib/search'

// GET /api/search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse filters from query params
    const filters: SearchFilters = {}

    // Text search
    const query = searchParams.get('q') || searchParams.get('query')
    if (query) {
      filters.query = query
    }

    // Category
    const category = searchParams.get('category')
    if (category) {
      filters.category = category
    }
    const categories = searchParams.get('categories')
    if (categories) {
      filters.categories = categories.split(',')
    }

    // Location
    const country = searchParams.get('country') as 'NZ' | 'AU' | null
    if (country) {
      filters.country = country
    }
    const region = searchParams.get('region')
    if (region) {
      filters.region = region
    }
    const regions = searchParams.get('regions')
    if (regions) {
      filters.regions = regions.split(',')
    }

    // Price range
    const minPrice = searchParams.get('minPrice')
    if (minPrice) {
      filters.minPrice = parseFloat(minPrice)
    }
    const maxPrice = searchParams.get('maxPrice')
    if (maxPrice) {
      filters.maxPrice = parseFloat(maxPrice)
    }
    const currency = searchParams.get('currency') as 'NZD' | 'AUD' | null
    if (currency) {
      filters.currency = currency
    }

    // Availability dates
    const availableFrom = searchParams.get('availableFrom')
    const availableTo = searchParams.get('availableTo')
    if (availableFrom) {
      filters.availableFrom = new Date(availableFrom)
    }
    if (availableTo) {
      filters.availableTo = new Date(availableTo)
    }

    // Equipment specs
    const minYear = searchParams.get('minYear')
    if (minYear) {
      filters.minYear = parseInt(minYear)
    }
    const maxYear = searchParams.get('maxYear')
    if (maxYear) {
      filters.maxYear = parseInt(maxYear)
    }
    const brand = searchParams.get('brand')
    if (brand) {
      filters.brand = brand
    }
    const brands = searchParams.get('brands')
    if (brands) {
      filters.brands = brands.split(',')
    }

    // Features
    if (searchParams.get('deliveryAvailable') === 'true') {
      filters.deliveryAvailable = true
    }
    if (searchParams.get('insuranceIncluded') === 'true') {
      filters.insuranceIncluded = true
    }
    if (searchParams.get('verifiedOwnersOnly') === 'true') {
      filters.verifiedOwnersOnly = true
    }

    // Owner filter
    const ownerId = searchParams.get('ownerId')
    if (ownerId) {
      filters.ownerId = ownerId
    }

    // Sorting
    const sort = (searchParams.get('sort') || 'relevance') as SortOption

    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

    // Include facets?
    const includeFacets = searchParams.get('facets') === 'true'

    // Use availability-aware search if dates provided
    const searchFn = filters.availableFrom && filters.availableTo
      ? searchAvailableListings
      : searchListings

    // Execute search
    const results = await searchFn({
      filters,
      sort,
      page,
      limit,
    })

    // Optionally include facets
    if (includeFacets) {
      const facets = await getSearchFacets(filters)
      return NextResponse.json({ ...results, facets })
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}
