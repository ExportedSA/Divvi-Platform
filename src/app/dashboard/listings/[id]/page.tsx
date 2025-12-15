'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { NZ_REGIONS, AU_STATES } from '@/lib/constants'
import { Send, Pause, Play, Save, Trash2 } from 'lucide-react'

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

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PENDING_REVIEW: 'bg-yellow-100 text-yellow-800',
  LIVE: 'bg-green-100 text-green-800',
  PAUSED: 'bg-orange-100 text-orange-800',
  REJECTED: 'bg-red-100 text-red-800',
}

export default function EditListingPage() {
  const router = useRouter()
  const params = useParams()
  const listingId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [listing, setListing] = useState<any>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    brand: '',
    model: '',
    year: '',
    region: '',
    localArea: '',
    pricePerDay: '',
    pricePerWeek: '',
    minimumRentalDays: '',
    bondAmount: '',
    insuranceMode: '',
    insuranceNotes: '',
    safetyNotes: '',
    pickupAddress: '',
  })

  useEffect(() => {
    fetchListing()
  }, [listingId])

  const fetchListing = async () => {
    try {
      const response = await fetch(`/api/listings/${listingId}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to fetch listing')
        return
      }

      setListing(data.listing)
      setFormData({
        title: data.listing.title || '',
        description: data.listing.description || '',
        category: data.listing.category || '',
        brand: data.listing.brand || '',
        model: data.listing.model || '',
        year: data.listing.year?.toString() || '',
        region: data.listing.region || '',
        localArea: data.listing.localArea || '',
        pricePerDay: data.listing.pricePerDay?.toString() || '',
        pricePerWeek: data.listing.pricePerWeek?.toString() || '',
        minimumRentalDays: data.listing.minimumRentalDays?.toString() || '',
        bondAmount: data.listing.bondAmount?.toString() || '',
        insuranceMode: data.listing.insuranceMode || '',
        insuranceNotes: data.listing.insuranceNotes || '',
        safetyNotes: data.listing.safetyNotes || '',
        pickupAddress: data.listing.pickupAddress || '',
      })
    } catch (err) {
      setError('Failed to load listing')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to save')
        return
      }

      setSuccess('Changes saved')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    setSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/listings/${listingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update status')
        return
      }

      setListing((prev: any) => ({ ...prev, status: newStatus }))
      setSuccess(data.message)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this listing?')) return

    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to delete')
        return
      }

      router.push('/dashboard/listings')
    } catch (err) {
      setError('Something went wrong')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Loading...</p>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Listing not found</p>
      </div>
    )
  }

  const regions = listing.country === 'NZ' ? NZ_REGIONS : AU_STATES
  const currency = listing.currency || 'NZD'

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Status Bar */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge className={statusColors[listing.status]}>
                {listing.status.replace('_', ' ')}
              </Badge>
            </div>
            
            <div className="flex gap-2">
              {/* Status Actions based on current status */}
              {listing.status === 'DRAFT' && (
                <Button 
                  size="sm" 
                  onClick={() => handleStatusChange('PENDING_REVIEW')}
                  disabled={saving}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Submit for Review
                </Button>
              )}
              
              {listing.status === 'PENDING_REVIEW' && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleStatusChange('DRAFT')}
                  disabled={saving}
                >
                  Withdraw Submission
                </Button>
              )}
              
              {listing.status === 'LIVE' && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleStatusChange('PAUSED')}
                  disabled={saving}
                >
                  <Pause className="mr-2 h-4 w-4" />
                  Pause Listing
                </Button>
              )}
              
              {listing.status === 'PAUSED' && (
                <>
                  <Button 
                    size="sm"
                    onClick={() => handleStatusChange('LIVE')}
                    disabled={saving}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Go Live
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleStatusChange('PENDING_REVIEW')}
                    disabled={saving}
                  >
                    Resubmit for Review
                  </Button>
                </>
              )}
              
              {listing.status === 'REJECTED' && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleStatusChange('DRAFT')}
                  disabled={saving}
                >
                  Edit & Resubmit
                </Button>
              )}
            </div>
          </div>
          
          {listing.status === 'REJECTED' && listing.hiddenReason && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              <strong>Rejection reason:</strong> {listing.hiddenReason}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Listing</CardTitle>
          <CardDescription>Update your equipment details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Basic Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Basic Details</h3>
              
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(v) => handleChange('category', v)}>
                    <SelectTrigger>
                      <SelectValue />
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
                  />
                </div>
                <div>
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => handleChange('model', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Pricing</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pricePerDay">Price per Day ({currency})</Label>
                  <Input
                    id="pricePerDay"
                    type="number"
                    value={formData.pricePerDay}
                    onChange={(e) => handleChange('pricePerDay', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="pricePerWeek">Price per Week ({currency})</Label>
                  <Input
                    id="pricePerWeek"
                    type="number"
                    value={formData.pricePerWeek}
                    onChange={(e) => handleChange('pricePerWeek', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bondAmount">Bond Amount ({currency})</Label>
                  <Input
                    id="bondAmount"
                    type="number"
                    value={formData.bondAmount}
                    onChange={(e) => handleChange('bondAmount', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="minimumRentalDays">Minimum Rental Days</Label>
                  <Input
                    id="minimumRentalDays"
                    type="number"
                    value={formData.minimumRentalDays}
                    onChange={(e) => handleChange('minimumRentalDays', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Insurance */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Insurance & Safety</h3>
              
              <div>
                <Label htmlFor="insuranceMode">Insurance Mode</Label>
                <Select value={formData.insuranceMode} onValueChange={(v) => handleChange('insuranceMode', v)}>
                  <SelectTrigger>
                    <SelectValue />
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
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="safetyNotes">Safety Notes</Label>
                <Textarea
                  id="safetyNotes"
                  value={formData.safetyNotes}
                  onChange={(e) => handleChange('safetyNotes', e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 text-green-700 rounded-lg">
                {success}
              </div>
            )}

            <div className="flex gap-4">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button 
                type="button" 
                variant="destructive" 
                onClick={handleDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
