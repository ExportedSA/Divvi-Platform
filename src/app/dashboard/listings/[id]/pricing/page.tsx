'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Percent,
  Lightbulb,
  Check,
  X,
  Plus,
  Settings,
  BarChart3,
  ArrowLeft,
} from 'lucide-react'

interface PricingRule {
  id: string
  name: string
  description?: string
  ruleType: string
  multiplier: number
  startDate?: string
  endDate?: string
  daysOfWeek?: number[]
  minimumDays?: number
  daysThreshold?: number
  priority: number
  isActive: boolean
}

interface Suggestion {
  id: string
  type: string
  title: string
  description: string
  currentRate: number
  suggestedRate: number
  changePercent: number
  confidence: number
  applicablePeriod?: string
}

interface UtilisationSummary {
  currentMonth: { utilisationRate: number; bookedDays: number; revenue: number }
  lastMonth: { utilisationRate: number; bookedDays: number; revenue: number }
  yearToDate: { utilisationRate: number; totalBookings: number; totalRevenue: number }
  trend: 'up' | 'down' | 'stable'
}

export default function ListingPricingPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const listingId = params.id as string

  const [listing, setListing] = useState<any>(null)
  const [rules, setRules] = useState<PricingRule[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [utilisation, setUtilisation] = useState<UtilisationSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddRule, setShowAddRule] = useState(false)
  const [processing, setProcessing] = useState(false)

  // New rule form
  const [newRule, setNewRule] = useState({
    name: '',
    ruleType: 'SEASONAL',
    multiplier: 1.0,
    startDate: '',
    endDate: '',
    daysOfWeek: [] as number[],
    minimumDays: 7,
    daysThreshold: 30,
  })

  useEffect(() => {
    if (status === 'authenticated' && listingId) {
      fetchData()
    }
  }, [status, listingId])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch pricing rules
      const rulesRes = await fetch(`/api/listings/${listingId}/pricing?view=rules`)
      const rulesData = await rulesRes.json()
      setListing({ basePrice: rulesData.basePrice, currency: rulesData.currency })
      setRules(rulesData.rules || [])

      // Fetch utilisation summary
      const analyticsRes = await fetch(`/api/listings/${listingId}/analytics?view=summary`)
      const analyticsData = await analyticsRes.json()
      setUtilisation(analyticsData)

      // Fetch suggestions
      const suggestionsRes = await fetch(`/api/listings/${listingId}/analytics?view=suggestions`)
      const suggestionsData = await suggestionsRes.json()
      setSuggestions(suggestionsData.suggestions || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRule = async () => {
    setProcessing(true)
    try {
      const res = await fetch(`/api/listings/${listingId}/pricing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          ...newRule,
        }),
      })

      if (res.ok) {
        setShowAddRule(false)
        setNewRule({
          name: '',
          ruleType: 'SEASONAL',
          multiplier: 1.0,
          startDate: '',
          endDate: '',
          daysOfWeek: [],
          minimumDays: 7,
          daysThreshold: 30,
        })
        fetchData()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to create rule')
      }
    } catch (error) {
      alert('Failed to create rule')
    } finally {
      setProcessing(false)
    }
  }

  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      await fetch(`/api/listings/${listingId}/pricing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          ruleId,
          isActive: !isActive,
        }),
      })
      fetchData()
    } catch (error) {
      console.error('Failed to toggle rule:', error)
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Delete this pricing rule?')) return

    try {
      await fetch(`/api/listings/${listingId}/pricing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          ruleId,
        }),
      })
      fetchData()
    } catch (error) {
      console.error('Failed to delete rule:', error)
    }
  }

  const handleApplyPresets = async (presets: string[]) => {
    setProcessing(true)
    try {
      await fetch(`/api/listings/${listingId}/pricing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply_presets',
          presets,
        }),
      })
      fetchData()
    } catch (error) {
      console.error('Failed to apply presets:', error)
    } finally {
      setProcessing(false)
    }
  }

  const handleSuggestionAction = async (suggestionId: string, action: 'accept' | 'dismiss') => {
    try {
      await fetch(`/api/listings/${listingId}/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action === 'accept' ? 'accept_suggestion' : 'dismiss_suggestion',
          suggestionId,
        }),
      })
      fetchData()
    } catch (error) {
      console.error('Failed to process suggestion:', error)
    }
  }

  const handleGenerateSuggestions = async () => {
    setProcessing(true)
    try {
      await fetch(`/api/listings/${listingId}/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_suggestions' }),
      })
      fetchData()
    } catch (error) {
      console.error('Failed to generate suggestions:', error)
    } finally {
      setProcessing(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: listing?.currency || 'NZD',
    }).format(amount)
  }

  const getRuleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      SEASONAL: 'Seasonal',
      DAY_OF_WEEK: 'Day of Week',
      MINIMUM_DURATION: 'Long Rental',
      LAST_MINUTE: 'Last Minute',
      EARLY_BIRD: 'Early Bird',
    }
    return labels[type] || type
  }

  const getDayNames = (days: number[]) => {
    const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return days.map((d) => names[d]).join(', ')
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lendit-green"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Listing
          </Button>
          <h1 className="text-3xl font-bold text-lendit-green">Smart Pricing</h1>
          <p className="mt-2 text-gray-600">
            Optimize your pricing to maximize bookings and revenue
          </p>
        </div>

        {/* Utilisation Stats */}
        {utilisation && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Base Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-lendit-green">
                  {formatCurrency(listing?.basePrice || 0)}
                </div>
                <p className="text-xs text-gray-500">per day</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Utilisation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-lendit-brown">
                    {utilisation.currentMonth.utilisationRate.toFixed(0)}%
                  </span>
                  {utilisation.trend === 'up' && <TrendingUp className="h-5 w-5 text-green-500" />}
                  {utilisation.trend === 'down' && <TrendingDown className="h-5 w-5 text-red-500" />}
                </div>
                <p className="text-xs text-gray-500">this month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">YTD Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(utilisation.yearToDate.totalRevenue)}
                </div>
                <p className="text-xs text-gray-500">{utilisation.yearToDate.totalBookings} bookings</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-700">
                  {rules.filter((r) => r.isActive).length}
                </div>
                <p className="text-xs text-gray-500">of {rules.length} total</p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pricing Rules */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Pricing Rules</CardTitle>
                    <CardDescription>Configure dynamic pricing for your listing</CardDescription>
                  </div>
                  <Button
                    onClick={() => setShowAddRule(true)}
                    className="bg-lendit-green hover:bg-lendit-green-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Rule
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {rules.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No pricing rules configured</p>
                    <p className="text-sm mt-2">Add rules to optimize your pricing</p>
                    <div className="mt-4 flex gap-2 justify-center flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApplyPresets(['weekend'])}
                      >
                        + Weekend Premium
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApplyPresets(['long_rental'])}
                      >
                        + Long Rental Discount
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApplyPresets(['early_bird'])}
                      >
                        + Early Bird
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rules.map((rule) => (
                      <div
                        key={rule.id}
                        className={`p-4 border rounded-lg ${
                          rule.isActive ? 'bg-white' : 'bg-gray-50 opacity-60'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{rule.name}</h4>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">
                                {getRuleTypeLabel(rule.ruleType)}
                              </span>
                            </div>
                            {rule.description && (
                              <p className="text-sm text-gray-500 mt-1">{rule.description}</p>
                            )}
                            <div className="mt-2 text-sm text-gray-600">
                              {rule.ruleType === 'DAY_OF_WEEK' && rule.daysOfWeek && (
                                <span>Days: {getDayNames(rule.daysOfWeek)}</span>
                              )}
                              {rule.ruleType === 'SEASONAL' && rule.startDate && (
                                <span>
                                  {new Date(rule.startDate).toLocaleDateString()} -{' '}
                                  {new Date(rule.endDate!).toLocaleDateString()}
                                </span>
                              )}
                              {rule.ruleType === 'MINIMUM_DURATION' && (
                                <span>{rule.minimumDays}+ days</span>
                              )}
                              {(rule.ruleType === 'EARLY_BIRD' || rule.ruleType === 'LAST_MINUTE') && (
                                <span>{rule.daysThreshold} days threshold</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className={`text-lg font-semibold ${
                                rule.multiplier > 1 ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {rule.multiplier > 1 ? '+' : ''}
                              {((rule.multiplier - 1) * 100).toFixed(0)}%
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleRule(rule.id, rule.isActive)}
                            >
                              {rule.isActive ? 'Disable' : 'Enable'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500"
                              onClick={() => handleDeleteRule(rule.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Suggestions */}
          <div>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    Smart Suggestions
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateSuggestions}
                    disabled={processing}
                  >
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {suggestions.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <BarChart3 className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No suggestions available</p>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={handleGenerateSuggestions}
                      disabled={processing}
                    >
                      Generate suggestions
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {suggestions.map((suggestion) => (
                      <div key={suggestion.id} className="p-3 border rounded-lg bg-amber-50 border-amber-200">
                        <h4 className="font-medium text-gray-900">{suggestion.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="text-sm">
                            <span className="text-gray-500">
                              {formatCurrency(suggestion.currentRate)} →{' '}
                            </span>
                            <span className="font-semibold text-lendit-green">
                              {formatCurrency(suggestion.suggestedRate)}
                            </span>
                            <span
                              className={`ml-2 ${
                                suggestion.changePercent > 0 ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              ({suggestion.changePercent > 0 ? '+' : ''}
                              {suggestion.changePercent}%)
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-green-600"
                              onClick={() => handleSuggestionAction(suggestion.id, 'accept')}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-gray-400"
                              onClick={() => handleSuggestionAction(suggestion.id, 'dismiss')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-lendit-green rounded-full"
                              style={{ width: `${suggestion.confidence}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{suggestion.confidence}% confidence</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Add Rule Modal */}
        {showAddRule && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Add Pricing Rule</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name</label>
                  <Input
                    value={newRule.name}
                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                    placeholder="e.g., Harvest Season Premium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rule Type</label>
                  <select
                    value={newRule.ruleType}
                    onChange={(e) => setNewRule({ ...newRule, ruleType: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:ring-lendit-green focus:border-lendit-green"
                  >
                    <option value="SEASONAL">Seasonal (Date Range)</option>
                    <option value="DAY_OF_WEEK">Day of Week</option>
                    <option value="MINIMUM_DURATION">Minimum Duration</option>
                    <option value="EARLY_BIRD">Early Bird</option>
                    <option value="LAST_MINUTE">Last Minute</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price Multiplier
                  </label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      step="0.05"
                      min="0.5"
                      max="3"
                      value={newRule.multiplier}
                      onChange={(e) =>
                        setNewRule({ ...newRule, multiplier: parseFloat(e.target.value) })
                      }
                      className="w-24"
                    />
                    <span className="text-gray-600">
                      = {((newRule.multiplier - 1) * 100).toFixed(0)}%{' '}
                      {newRule.multiplier > 1 ? 'increase' : 'discount'}
                    </span>
                  </div>
                </div>

                {newRule.ruleType === 'SEASONAL' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <Input
                        type="date"
                        value={newRule.startDate}
                        onChange={(e) => setNewRule({ ...newRule, startDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <Input
                        type="date"
                        value={newRule.endDate}
                        onChange={(e) => setNewRule({ ...newRule, endDate: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {newRule.ruleType === 'DAY_OF_WEEK' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Days
                    </label>
                    <div className="flex gap-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const days = newRule.daysOfWeek.includes(i)
                              ? newRule.daysOfWeek.filter((d) => d !== i)
                              : [...newRule.daysOfWeek, i]
                            setNewRule({ ...newRule, daysOfWeek: days })
                          }}
                          className={`w-10 h-10 rounded-full text-sm font-medium ${
                            newRule.daysOfWeek.includes(i)
                              ? 'bg-lendit-green text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {newRule.ruleType === 'MINIMUM_DURATION' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Days
                    </label>
                    <Input
                      type="number"
                      min="2"
                      value={newRule.minimumDays}
                      onChange={(e) =>
                        setNewRule({ ...newRule, minimumDays: parseInt(e.target.value) })
                      }
                      className="w-24"
                    />
                  </div>
                )}

                {(newRule.ruleType === 'EARLY_BIRD' || newRule.ruleType === 'LAST_MINUTE') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Days Threshold
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={newRule.daysThreshold}
                      onChange={(e) =>
                        setNewRule({ ...newRule, daysThreshold: parseInt(e.target.value) })
                      }
                      className="w-24"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {newRule.ruleType === 'EARLY_BIRD'
                        ? 'Applies to bookings made this many days in advance'
                        : 'Applies to bookings starting within this many days'}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowAddRule(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateRule}
                  disabled={!newRule.name || processing}
                  className="bg-lendit-green hover:bg-lendit-green-600"
                >
                  Create Rule
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
