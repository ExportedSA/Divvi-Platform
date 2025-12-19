'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Sparkles, TrendingUp, MapPin } from 'lucide-react'

interface Listing {
  id: string
  title: string
  description: string
  category: string
  country: string
  region: string
  pricePerDay: number
  currency: string
  photos: Array<{
    url: string
  }>
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('')
  const [recentListings, setRecentListings] = useState<Listing[]>([])
  const [popularListings, setPopularListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchListings()
  }, [])

  const fetchListings = async () => {
    try {
      // Fetch recent listings
      const response = await fetch('/api/listings?sort=newest')
      const data = await response.json()
      if (data.listings) {
        setRecentListings(data.listings.slice(0, 5))
        setPopularListings(data.listings.slice(0, 5)) // For now, use same data
      }
    } catch (error) {
      console.error('Error fetching listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (searchQuery) params.append('search', searchQuery)
    if (selectedCategory) params.append('category', selectedCategory)
    if (selectedCountry) params.append('country', selectedCountry)
    
    router.push(`/browse?${params.toString()}`)
  }

  const ListingCard = ({ listing }: { listing: Listing }) => (
    <Link href={`/listings/${listing.id}`} className="group">
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="aspect-video bg-gray-200 relative overflow-hidden">
          {listing.photos[0] ? (
            <img 
              src={listing.photos[0].url} 
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No image
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-900 group-hover:text-amber-700 transition-colors line-clamp-1 flex-1">
              {listing.title}
            </h3>
            <Badge variant="secondary" className="ml-2 flex-shrink-0 text-xs">
              {listing.category}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {listing.description}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-500">
              <MapPin className="h-3 w-3 mr-1" />
              {listing.region}
            </div>
            <div className="text-lg font-bold text-gray-900">
              ${listing.pricePerDay}
              <span className="text-sm font-normal text-gray-500">/day</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )

  return (
    <div className="min-h-screen">
      {/* Hero Section with Background */}
      <section 
        className="relative py-20 md:py-32 bg-cover bg-center"
        style={{ backgroundImage: 'url(/images/hero-background.png)' }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-100/80 via-amber-50/70 to-white/90" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Smaller Logo */}
            <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-3 tracking-tight">
              Divvi
            </h1>
            <p className="text-lg md:text-xl text-amber-700 font-semibold mb-4">
              Rent with confidence
            </p>
            
            <p className="text-sm md:text-base text-gray-600 mb-8 max-w-2xl mx-auto">
              The trusted marketplace for renting equipment, tools, and vehicles across New Zealand & Australia.
            </p>
            
            {/* Compact Search Box */}
            <div className="bg-white rounded-lg shadow-lg p-4 max-w-3xl mx-auto mb-6">
              <div className="flex flex-col md:flex-row gap-2">
                <Input 
                  placeholder="Search equipment, tools, vehicles..." 
                  className="flex-1 h-11"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Select value={selectedCategory || undefined} onValueChange={(v) => setSelectedCategory(v === 'all' ? '' : v)}>
                  <SelectTrigger className="h-11 md:w-36">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="TRACTOR">Tractors</SelectItem>
                    <SelectItem value="HARVESTER">Harvesters</SelectItem>
                    <SelectItem value="LOADER">Loaders</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedCountry || undefined} onValueChange={(v) => setSelectedCountry(v === 'all' ? '' : v)}>
                  <SelectTrigger className="h-11 md:w-32">
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="NZ">NZ</SelectItem>
                    <SelectItem value="AU">AU</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleSearch}
                  className="h-11 bg-gray-900 hover:bg-gray-800 px-6"
                >
                  <Search className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Search</span>
                </Button>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                asChild
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                <Link href="/browse">Browse All Machinery</Link>
              </Button>
              <Button 
                asChild
                variant="outline"
                className="border-gray-900 text-gray-900 hover:bg-gray-50"
              >
                <Link href="/dashboard/listings/new">List Your Equipment</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* What's New Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-600" />
              <h2 className="text-2xl font-bold text-gray-900">What's New</h2>
            </div>
            <Link href="/browse?sort=newest" className="text-sm text-gray-600 hover:text-gray-900">
              View all
            </Link>
          </div>
          <p className="text-gray-600 mb-6 text-sm">Check out the latest equipment added to Divvi</p>
          
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-gray-100 rounded-lg h-64 animate-pulse" />
              ))}
            </div>
          ) : recentListings.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {recentListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No recent listings available</p>
          )}
        </div>
      </section>

      {/* Most Popular Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-600" />
              <h2 className="text-2xl font-bold text-gray-900">Most Popular</h2>
            </div>
            <Link href="/browse" className="text-sm text-gray-600 hover:text-gray-900">
              View all
            </Link>
          </div>
          <p className="text-gray-600 mb-6 text-sm">Top most rented items on Divvi</p>
          
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-gray-100 rounded-lg h-64 animate-pulse" />
              ))}
            </div>
          ) : popularListings.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {popularListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No popular listings available yet</p>
          )}
        </div>
      </section>
    </div>
  )
}
