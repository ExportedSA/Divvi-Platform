'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('')
  const router = useRouter()

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (searchQuery) params.append('search', searchQuery)
    if (selectedCategory) params.append('category', selectedCategory)
    if (selectedCountry) params.append('country', selectedCountry)
    
    router.push(`/browse?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            {/* Main Heading */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-gray-900 mb-4 tracking-tight">
              Divvi
            </h1>
            <p className="text-xl md:text-2xl text-amber-700 font-semibold mb-6">
              Rent with confidence
            </p>
            
            <p className="text-base md:text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
              The trusted marketplace for renting equipment, tools, and vehicles across New Zealand & Australia.
            </p>
            
            {/* Search Box */}
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-3xl mx-auto">
              <p className="text-sm text-gray-500 mb-4">Find the equipment you need</p>
              <div className="flex flex-col md:flex-row gap-3">
                <Input 
                  placeholder="Search equipment, tools, vehicles..." 
                  className="flex-1 h-12"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-12 md:w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="TRACTOR">Tractors</SelectItem>
                    <SelectItem value="HARVESTER">Harvesters</SelectItem>
                    <SelectItem value="LOADER">Loaders</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger className="h-12 md:w-40">
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NZ">New Zealand</SelectItem>
                    <SelectItem value="AU">Australia</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleSearch}
                  className="h-12 bg-gray-900 hover:bg-gray-800 px-8"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Button 
                asChild
                size="lg"
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                <Link href="/browse">Browse All Machinery</Link>
              </Button>
              <Button 
                asChild
                size="lg"
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
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-amber-600" />
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">What's New</h2>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="rounded-full">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-gray-600 mb-8">Check out the latest equipment added to Divvi</p>
          
          {/* Placeholder for equipment carousel - will be populated dynamically */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-100 rounded-lg h-64 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
