'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Tractor, 
  Shield, 
  Clock, 
  MapPin, 
  Search, 
  CheckCircle,
  Wheat,
  Droplets,
  Sprout,
  CircleDot,
  Package,
  Forklift,
  Cog,
  type LucideIcon
} from 'lucide-react'
import { MACHINERY_CATEGORIES, LISTING_CATEGORY_LABELS } from '@/lib/constants'
import { Logo } from '@/components/Logo'

// Map categories to appropriate icons
const categoryIcons: Record<string, LucideIcon> = {
  TRACTOR: Tractor,
  HARVESTER: Wheat,
  PLOUGH: Cog,
  SEEDER: Sprout,
  SPRAYER: Droplets,
  IRRIGATION: Droplets,
  TILLAGE: Cog,
  BALER: Package,
  LOADER: Forklift,
  OTHER: CircleDot,
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('')
  const router = useRouter()

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (searchQuery) params.append('search', searchQuery)
    if (selectedCategory) params.append('category', selectedCategory)
    if (selectedCountry) params.append('country', selectedCountry)
    if (selectedRegion) params.append('region', selectedRegion)
    
    router.push(`/browse?${params.toString()}`)
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section with Background Image */}
      <section 
        className="relative py-20 md:py-28 lg:py-32 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/images/hero-machinery.jpg)' }}
      >
        {/* Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-100/90 via-orange-50/85 to-white/95" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Divvi Logo - Big and Proud */}
            <div className="flex justify-center mb-6">
              <div className="flex flex-col items-center">
                <span className="text-7xl md:text-8xl lg:text-9xl font-black text-Divvi-green tracking-tight drop-shadow-lg">
                  Divvi
                </span>
                <span className="text-xl md:text-2xl text-Divvi-brown font-semibold mt-2 tracking-wide drop-shadow-sm">
                  Rent with confidence
                </span>
              </div>
            </div>
            
            <p className="text-lg md:text-xl text-gray-700 mb-10 max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
              The trusted marketplace connecting machinery owners with farmers and contractors across New Zealand & Australia.
            </p>
            
            {/* Search Bar */}
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-10 border border-orange-100">
              <p className="text-gray-500 text-sm mb-4">Find the equipment you need</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Input 
                  placeholder="Search tractors, diggers, loaders..." 
                  className="md:col-span-2 lg:col-span-2 h-12 text-base border-gray-200 focus:ring-Divvi-brown focus:border-Divvi-brown"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-12 border-gray-200">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {MACHINERY_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedCountry} onValueChange={(value) => {
                  setSelectedCountry(value)
                  setSelectedRegion('') // Reset region when country changes
                }}>
                  <SelectTrigger className="h-12 border-gray-200">
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NZ">New Zealand</SelectItem>
                    <SelectItem value="AU">Australia</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  size="lg" 
                  className="h-12 w-full bg-Divvi-brown hover:bg-Divvi-brown-600 text-white font-semibold" 
                  onClick={handleSearch}
                >
                  <Search className="mr-2 h-5 w-5" />
                  Search
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="h-12 px-8 bg-Divvi-green hover:bg-Divvi-green-600 font-semibold" asChild>
                <Link href="/browse">Browse All Machinery</Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="h-12 px-8 border-2 border-Divvi-green text-Divvi-green hover:bg-Divvi-green hover:text-white font-semibold transition-all" 
                asChild
              >
                <Link href="/listings/new">List Your Equipment</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-3 text-gray-800">Why Choose Divvi?</h2>
          <p className="text-center text-gray-500 mb-12 max-w-2xl mx-auto">
            We make machinery rental simple, safe, and transparent for both owners and renters.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-md hover:shadow-xl transition-all bg-gradient-to-br from-white to-amber-50">
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-Divvi-green/10 rounded-2xl flex items-center justify-center">
                  <Shield className="h-8 w-8 text-Divvi-green" />
                </div>
                <CardTitle className="text-gray-800 text-lg">Clear Insurance Terms</CardTitle>
                <CardDescription className="text-gray-500">
                  Transparent insurance and damage policies. Know your responsibilities before you rent.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="border-0 shadow-md hover:shadow-xl transition-all bg-gradient-to-br from-white to-orange-50">
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-Divvi-brown/10 rounded-2xl flex items-center justify-center">
                  <Clock className="h-8 w-8 text-Divvi-brown" />
                </div>
                <CardTitle className="text-gray-800 text-lg">Flexible Rental Periods</CardTitle>
                <CardDescription className="text-gray-500">
                  Rent by the day or week. Perfect for short-term projects or seasonal work.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="border-0 shadow-md hover:shadow-xl transition-all bg-gradient-to-br from-white to-amber-50">
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-Divvi-green/10 rounded-2xl flex items-center justify-center">
                  <MapPin className="h-8 w-8 text-Divvi-green" />
                </div>
                <CardTitle className="text-gray-800 text-lg">Local & Regional</CardTitle>
                <CardDescription className="text-gray-500">
                  Find machinery near you across New Zealand and Australia. Support local operators.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-gray-800">Trusted by Farmers & Contractors</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-start space-x-4 bg-white p-5 rounded-xl shadow-sm">
                <div className="w-10 h-10 bg-Divvi-brown/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-Divvi-brown" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Verified Users</h3>
                  <p className="text-gray-500 text-sm mt-1">All users undergo verification for safe transactions</p>
                </div>
              </div>
              <div className="flex items-start space-x-4 bg-white p-5 rounded-xl shadow-sm">
                <div className="w-10 h-10 bg-Divvi-green/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-Divvi-green" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Secure Payments</h3>
                  <p className="text-gray-500 text-sm mt-1">Protected transactions with bond management</p>
                </div>
              </div>
              <div className="flex items-start space-x-4 bg-white p-5 rounded-xl shadow-sm">
                <div className="w-10 h-10 bg-Divvi-brown/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-Divvi-brown" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Review System</h3>
                  <p className="text-gray-500 text-sm mt-1">Honest reviews from real rental experiences</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-3 text-gray-800">Browse by Category</h2>
          <p className="text-center text-gray-500 mb-12">Find the right equipment for your project</p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {MACHINERY_CATEGORIES.slice(0, 10).map((category) => {
              const IconComponent = categoryIcons[category] || CircleDot
              const label = LISTING_CATEGORY_LABELS[category as keyof typeof LISTING_CATEGORY_LABELS] || category
              return (
                <Link 
                  key={category}
                  href={`/browse?category=${encodeURIComponent(category)}`}
                  className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-all border border-gray-100 hover:border-Divvi-brown/30 group"
                >
                  <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl flex items-center justify-center group-hover:from-Divvi-brown/10 group-hover:to-Divvi-brown/5 transition-all">
                    <IconComponent className="h-6 w-6 text-Divvi-green group-hover:text-Divvi-brown transition-colors" />
                  </div>
                  <h3 className="font-medium text-sm text-gray-700 group-hover:text-Divvi-brown transition-colors">{label}</h3>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-Divvi-green to-Divvi-green-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to List Your Machinery?</h2>
          <p className="text-lg md:text-xl mb-8 text-white/80 max-w-xl mx-auto">
            Join hundreds of owners earning income from their idle equipment.
          </p>
          <Button 
            size="lg" 
            className="h-14 px-10 bg-Divvi-brown hover:bg-Divvi-brown-600 text-white font-semibold text-lg shadow-lg" 
            asChild
          >
            <Link href="/listings/new">Get Started Today</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div>
              <div className="mb-6">
                <span className="text-3xl font-black text-white">Divvi</span>
                <p className="text-Divvi-brown text-sm font-medium mt-1">Rent with confidence</p>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                The trusted marketplace for farm machinery rentals across New Zealand and Australia.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">For Renters</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><Link href="/browse" className="hover:text-Divvi-brown transition-colors">Browse Machinery</Link></li>
                <li><Link href="/how-it-works" className="hover:text-Divvi-brown transition-colors">How It Works</Link></li>
                <li><Link href="/insurance-damage" className="hover:text-Divvi-brown transition-colors">Insurance & Damage</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">For Owners</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><Link href="/listings/new" className="hover:text-Divvi-brown transition-colors">List Your Machinery</Link></li>
                <li><Link href="/dashboard" className="hover:text-Divvi-brown transition-colors">Owner Dashboard</Link></li>
                <li><Link href="/terms" className="hover:text-Divvi-brown transition-colors">Terms of Use</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Support</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><Link href="/contact" className="hover:text-Divvi-brown transition-colors">Contact Us</Link></li>
                <li><Link href="/faq" className="hover:text-Divvi-brown transition-colors">FAQ</Link></li>
                <li><Link href="/privacy" className="hover:text-Divvi-brown transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} Divvi. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

