'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Tag,
  Plus,
  Percent,
  Calendar,
  Copy,
  Check,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'

interface Promotion {
  id: string
  code: string
  name: string
  description?: string
  discountType: string
  discountValue: number
  validFrom: string
  validUntil: string
  maxUses: number | null
  currentUses: number
  isActive: boolean
  redemptionCount: number
}

export default function OwnerPromotionsPage() {
  const { data: session, status } = useSession()
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Quick promotion form
  const [quickForm, setQuickForm] = useState({
    name: '',
    discountPercent: 10,
    durationDays: 14,
  })

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPromotions()
    }
  }, [status])

  const fetchPromotions = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/promotions')
      const data = await res.json()
      setPromotions(data.promotions || [])
    } catch (error) {
      console.error('Failed to fetch promotions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateQuickPromotion = async () => {
    if (!quickForm.name.trim()) {
      alert('Please enter a promotion name')
      return
    }

    setCreating(true)
    try {
      const res = await fetch('/api/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_quick',
          ...quickForm,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setShowCreate(false)
        setQuickForm({ name: '', discountPercent: 10, durationDays: 14 })
        fetchPromotions()
      } else {
        alert(data.error || 'Failed to create promotion')
      }
    } catch (error) {
      alert('Failed to create promotion')
    } finally {
      setCreating(false)
    }
  }

  const handleTogglePromotion = async (promotionId: string, currentActive: boolean) => {
    try {
      if (currentActive) {
        await fetch('/api/promotions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'deactivate',
            promotionId,
          }),
        })
      } else {
        await fetch('/api/promotions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update',
            promotionId,
            isActive: true,
          }),
        })
      }
      fetchPromotions()
    } catch (error) {
      console.error('Failed to toggle promotion:', error)
    }
  }

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const isExpired = (validUntil: string) => new Date(validUntil) < new Date()
  const isUpcoming = (validFrom: string) => new Date(validFrom) > new Date()

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lendit-green"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-lendit-green">My Promotions</h1>
            <p className="mt-2 text-gray-600">
              Create discount codes to attract more renters to your listings
            </p>
          </div>
          <Button
            onClick={() => setShowCreate(true)}
            className="bg-lendit-green hover:bg-lendit-green-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Promotion
          </Button>
        </div>

        {/* Create Promotion Modal */}
        {showCreate && (
          <Card className="mb-8 border-2 border-lendit-green">
            <CardHeader>
              <CardTitle>Create Quick Promotion</CardTitle>
              <CardDescription>
                Set up a time-limited discount for your listings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Promotion Name
                </label>
                <Input
                  value={quickForm.name}
                  onChange={(e) => setQuickForm({ ...quickForm, name: e.target.value })}
                  placeholder="e.g., Spring Special, Early Bird Discount"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Percentage
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="5"
                      max="50"
                      value={quickForm.discountPercent}
                      onChange={(e) =>
                        setQuickForm({ ...quickForm, discountPercent: parseInt(e.target.value) })
                      }
                      className="w-24"
                    />
                    <span className="text-gray-500">%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Between 5% and 50%</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      max="90"
                      value={quickForm.durationDays}
                      onChange={(e) =>
                        setQuickForm({ ...quickForm, durationDays: parseInt(e.target.value) })
                      }
                      className="w-24"
                    />
                    <span className="text-gray-500">days</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleCreateQuickPromotion}
                  disabled={creating}
                  className="bg-lendit-green hover:bg-lendit-green-600"
                >
                  {creating ? 'Creating...' : 'Create Promotion'}
                </Button>
                <Button variant="outline" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Promotions List */}
        {promotions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Tag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No promotions yet
              </h3>
              <p className="text-gray-500 mb-4">
                Create your first promotion to attract more renters
              </p>
              <Button
                onClick={() => setShowCreate(true)}
                className="bg-lendit-green hover:bg-lendit-green-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Promotion
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {promotions.map((promo) => {
              const expired = isExpired(promo.validUntil)
              const upcoming = isUpcoming(promo.validFrom)

              return (
                <Card
                  key={promo.id}
                  className={`${!promo.isActive || expired ? 'opacity-60' : ''}`}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{promo.name}</h3>
                          {expired && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                              Expired
                            </span>
                          )}
                          {upcoming && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                              Upcoming
                            </span>
                          )}
                          {!expired && !upcoming && promo.isActive && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                              Active
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <span className="flex items-center gap-1">
                            <Percent className="h-4 w-4" />
                            {promo.discountValue}% off
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(promo.validFrom).toLocaleDateString()} -{' '}
                            {new Date(promo.validUntil).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <code className="px-3 py-1 bg-gray-100 rounded font-mono text-sm">
                            {promo.code}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyCode(promo.code)}
                          >
                            {copiedCode === promo.code ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-lendit-green">
                            {promo.redemptionCount}
                          </p>
                          <p className="text-xs text-gray-500">
                            {promo.maxUses ? `of ${promo.maxUses}` : 'uses'}
                          </p>
                        </div>

                        {!expired && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTogglePromotion(promo.id, promo.isActive)}
                          >
                            {promo.isActive ? (
                              <>
                                <ToggleRight className="h-5 w-5 text-green-500 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="h-5 w-5 text-gray-400 mr-1" />
                                Inactive
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Tips */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Promotion Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-lendit-green">•</span>
                <span>
                  <strong>Time-limited offers</strong> create urgency - try 1-2 week promotions
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-lendit-green">•</span>
                <span>
                  <strong>10-15% discounts</strong> are effective without cutting too deep into margins
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-lendit-green">•</span>
                <span>
                  <strong>Share your code</strong> on social media or with local farming groups
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-lendit-green">•</span>
                <span>
                  <strong>Seasonal promotions</strong> work well during quieter periods
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
