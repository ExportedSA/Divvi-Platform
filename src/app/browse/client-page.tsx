'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, MapPin, Star, DollarSign } from 'lucide-react'
import { MACHINERY_CATEGORIES, NZ_REGIONS, AU_STATES } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'

interface Listing {
  id: string
  title: string
  description: string
  category: string
  brand?: string
  model?: string
  year?: number
  country: 'NZ' | 'AU'
  region: string
  localArea?: string
  pricePerDay: number
  pricePerWeek?: number
  currency: string
  owner: {
    name: string
    farmName?: string
    region: string
    country: string
  }
  photos: Array<{
    id: string
    url: string
    isPrimary: boolean
  }>
  _count: {
    reviews: number
  }
}

export default function BrowseClientPage() {
  const searchParams = useSearchParams()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    country: searchParams.get('country') || '',
    region: searchParams.get('region') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort: searchParams.get('sort') || 'newest'
  })

  useEffect(() => {
    fetchListings()
  }, [filters])

  const fetchListings = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const response = await fetch(`/api/listings?${params}`)
      const data = await response.json()
      setListings(data.listings || [])
    } catch (error) {
      console.error('Error fetching listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const regions = filters.country === 'AU' ? AU_STATES : NZ_REGIONS

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="lg:w-1/4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <Input
                  placeholder="Search machinery..."
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select value={filters.category || 'all'} onValueChange={(value) => updateFilter('category', value === 'all' ? '' : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {MACHINERY_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Country</label>
                <Select value={filters.country || 'all'} onValueChange={(value) => {
                  updateFilter('country', value === 'all' ? '' : value)
                  updateFilter('region', '') // Reset region when country changes
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All countries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All countries</SelectItem>
                    <SelectItem value="NZ">New Zealand</SelectItem>
                    <SelectItem value="AU">Australia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Region</label>
                <Select value={filters.region || 'all'} onValueChange={(value) => updateFilter('region', value === 'all' ? '' : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All regions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All regions</SelectItem>
                    {regions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium mb-2 block">Min Price</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.minPrice}
                    onChange={(e) => updateFilter('minPrice', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Max Price</label>
                  <Input
                    type="number"
                    placeholder="1000"
                    value={filters.maxPrice}
                    onChange={(e) => updateFilter('maxPrice', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Sort By</label>
                <Select value={filters.sort} onValueChange={(value) => updateFilter('sort', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="price_asc">Price: Low to High</SelectItem>
                    <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setFilters({
                  search: '',
                  category: '',
                  country: '',
                  region: '',
                  minPrice: '',
                  maxPrice: '',
                  sort: 'newest'
                })}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Listings Grid */}
        <div className="lg:w-3/4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Browse Machinery</h1>
            <p className="text-muted-foreground">
              {listings.length} {listings.length === 1 ? 'listing' : 'listings'} found
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-muted rounded-t-lg" />
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">No listings found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or search terms
                </p>
                <Button onClick={() => setFilters({
                  search: '',
                  category: '',
                  country: '',
                  region: '',
                  minPrice: '',
                  maxPrice: '',
                  sort: 'newest'
                })}>
                  Clear all filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {listings.map((listing) => (
                <Link key={listing.id} href={`/listings/${listing.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="relative">
                      {listing.photos.length > 0 ? (
                        <img
                          src={listing.photos[0].url}
                          alt={listing.title}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                      ) : (
                        <div className="w-full h-48 bg-muted rounded-t-lg flex items-center justify-center">
                          <span className="text-muted-foreground">No photo</span>
                        </div>
                      )}
                      <Badge className="absolute top-2 right-2">
                        {listing.category}
                      </Badge>
                    </div>
                    <CardHeader>
                      <CardTitle className="line-clamp-1">{listing.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {listing.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold text-primary">
                            {formatCurrency(listing.pricePerDay, listing.currency)}
                            <span className="text-sm font-normal text-muted-foreground">/day</span>
                          </span>
                          {listing._count.reviews > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm">({listing._count.reviews})</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{listing.region}, {listing.country}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Listed by {listing.owner.farmName || listing.owner.name}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
