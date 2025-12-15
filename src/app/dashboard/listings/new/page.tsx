'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { NZ_REGIONS, AU_STATES } from '@/lib/constants'

const CATEGORIES = [
  { value: 'TRACTOR', label: 'Tractor' },
  { value: 'DIGGER', label: 'Digger / Excavator' },
  { value: 'LOADER', label: 'Loader' },
  { value: 'SPRAYER', label: 'Sprayer' },
  { value: 'IMPLEMENT', label: 'Implement' },
  { value: 'TRUCK', label: 'Truck' },
  { value: 'OTHER', label: 'Other' },
]

const INSURANCE_MODES = [
  { value: 'OWNER_PROVIDED', label: 'Owner provides insurance' },
  { value: 'RENTER_PROVIDED', label: 'Renter must provide insurance' },
  { value: 'NONE', label: 'No insurance required' },
]

const DELIVERY_MODES = [
  { value: 'PICKUP_ONLY', label: 'Pickup only' },
  { value: 'DELIVERY_AVAILABLE', label: 'Delivery available' },
  { value: 'DELIVERY_ONLY', label: 'Delivery only' },
]

export default function NewListingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    brand: '',
    model: '',
    year: '',
    country: 'NZ' as 'NZ' | 'AU',
    region: '',
    localArea: '',
    pricePerDay: '',
    pricePerWeek: '',
    currency: 'NZD' as 'NZD' | 'AUD',
    minimumRentalDays: '',
    bondAmount: '',
    insuranceMode: '',
    insuranceNotes: '',
    safetyNotes: '',
    deliveryMode: 'PICKUP_ONLY',
    deliveryFlatFee: '',
    deliveryRadiusKm: '',
    pickupAddress: '',
    enginePowerHP: '',
    workingWidthM: '',
    operatingWeightKg: '',
  })

  const regions = formData.country === 'NZ' ? NZ_REGIONS : AU_STATES

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Auto-update currency when country changes
    if (field === 'country') {
      setFormData(prev => ({
        ...prev,
        country: value as 'NZ' | 'AU',
        currency: value === 'NZ' ? 'NZD' : 'AUD',
        region: '', // Reset region when country changes
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create listing')
        return
      }

      // Redirect to edit page to add photos and submit for review
      router.push(`/dashboard/listings/${data.listing.id}`)
    } catch (err) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Create New Listing</CardTitle>
          <CardDescription>
            Add your equipment details. You can save as draft and add photos later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Basic Details</h3>
              
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="e.g., John Deere 6120M Tractor"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Describe your equipment, its condition, and any special features..."
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(v) => handleChange('category', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      type="number"
                      value={formData.year}
                      onChange={(e) => handleChange('year', e.target.value)}
                      placeholder="e.g., 2020"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => handleChange('brand', e.target.value)}
                      placeholder="e.g., John Deere"
                    />
                  </div>
                  <div>
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => handleChange('model', e.target.value)}
                      placeholder="e.g., 6120M"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Location</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Select value={formData.country} onValueChange={(v) => handleChange('country', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NZ">New Zealand</SelectItem>
                      <SelectItem value="AU">Australia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="region">Region *</Label>
                  <Select value={formData.region} onValueChange={(v) => handleChange('region', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map(r => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="localArea">Local Area</Label>
                <Input
                  id="localArea"
                  value={formData.localArea}
                  onChange={(e) => handleChange('localArea', e.target.value)}
                  placeholder="e.g., Ashburton"
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Pricing</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pricePerDay">Price per Day ({formData.currency}) *</Label>
                  <Input
                    id="pricePerDay"
                    type="number"
                    value={formData.pricePerDay}
                    onChange={(e) => handleChange('pricePerDay', e.target.value)}
                    placeholder="e.g., 500"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="pricePerWeek">Price per Week ({formData.currency})</Label>
                  <Input
                    id="pricePerWeek"
                    type="number"
                    value={formData.pricePerWeek}
                    onChange={(e) => handleChange('pricePerWeek', e.target.value)}
                    placeholder="e.g., 2500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bondAmount">Bond Amount ({formData.currency})</Label>
                  <Input
                    id="bondAmount"
                    type="number"
                    value={formData.bondAmount}
                    onChange={(e) => handleChange('bondAmount', e.target.value)}
                    placeholder="e.g., 2000"
                  />
                </div>
                <div>
                  <Label htmlFor="minimumRentalDays">Minimum Rental Days</Label>
                  <Input
                    id="minimumRentalDays"
                    type="number"
                    value={formData.minimumRentalDays}
                    onChange={(e) => handleChange('minimumRentalDays', e.target.value)}
                    placeholder="e.g., 1"
                  />
                </div>
              </div>
            </div>

            {/* Insurance */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Insurance & Safety</h3>
              
              <div>
                <Label htmlFor="insuranceMode">Insurance Mode *</Label>
                <Select value={formData.insuranceMode} onValueChange={(v) => handleChange('insuranceMode', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select insurance mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {INSURANCE_MODES.map(mode => (
                      <SelectItem key={mode.value} value={mode.value}>{mode.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="insuranceNotes">Insurance Notes</Label>
                <Textarea
                  id="insuranceNotes"
                  value={formData.insuranceNotes}
                  onChange={(e) => handleChange('insuranceNotes', e.target.value)}
                  placeholder="Any specific insurance requirements or coverage details..."
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="safetyNotes">Safety Notes</Label>
                <Textarea
                  id="safetyNotes"
                  value={formData.safetyNotes}
                  onChange={(e) => handleChange('safetyNotes', e.target.value)}
                  placeholder="Any safety requirements or operator qualifications needed..."
                  rows={2}
                />
              </div>
            </div>

            {/* Delivery */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Delivery & Pickup</h3>
              
              <div>
                <Label htmlFor="deliveryMode">Delivery Mode</Label>
                <Select value={formData.deliveryMode} onValueChange={(v) => handleChange('deliveryMode', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DELIVERY_MODES.map(mode => (
                      <SelectItem key={mode.value} value={mode.value}>{mode.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="pickupAddress">Pickup Address</Label>
                <Input
                  id="pickupAddress"
                  value={formData.pickupAddress}
                  onChange={(e) => handleChange('pickupAddress', e.target.value)}
                  placeholder="Address for equipment pickup"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Creating...' : 'Create Listing (Draft)'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
