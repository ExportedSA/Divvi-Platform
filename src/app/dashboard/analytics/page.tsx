'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Calendar,
  Download,
  RefreshCw,
  MapPin,
  Users,
  Star,
  Clock,
} from 'lucide-react'

interface OwnerDashboardData {
  revenue: {
    totalRevenue: number
    thisMonth: number
    lastMonth: number
    growthRate: number
    byMonth: Array<{
      year: number
      month: number
      revenue: number
      bookingCount: number
      platformFees: number
      netRevenue: number
    }>
    byListing: Array<{
      listingId: string
      listingTitle: string
      revenue: number
      bookingCount: number
    }>
    averageOrderValue: number
    currency: string
  }
  listings: Array<{
    listingId: string
    title: string
    category: string
    status: string
    pricePerDay: number
    totalBookings: number
    totalRevenue: number
    utilisationRate: number
    averageRating: number | null
    reviewCount: number
    lastBookingDate: string | null
    daysListed: number
  }>
  renterLocations: {
    byCountry: Array<{ country: string; bookingCount: number; revenue: number }>
    byRegion: Array<{ region: string; country: string; bookingCount: number; revenue: number }>
    topRenters: Array<{
      renterId: string
      renterName: string
      bookingCount: number
      totalSpent: number
    }>
  }
  bookings: {
    total: number
    pending: number
    accepted: number
    completed: number
    cancelled: number
    inDispute: number
    acceptanceRate: number
    cancellationRate: number
    averageResponseTime: number
    byMonth: Array<{ year: number; month: number; total: number; accepted: number }>
  }
  generatedAt: string
}

export default function OwnerAnalyticsPage() {
  const { data: session, status } = useSession()
  const [data, setData] = useState<OwnerDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData()
    }
  }, [status])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/owner/analytics?view=dashboard')
      const result = await res.json()
      setData(result)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (type: string) => {
    setExporting(type)
    try {
      const res = await fetch('/api/owner/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exportType: type }),
      })

      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `my-${type}-export-${Date.now()}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        a.remove()
      }
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setExporting(null)
    }
  }

  const formatCurrency = (amount: number, currency: string = 'NZD') => {
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getMonthName = (month: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return months[month - 1]
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lendit-green"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Failed to load analytics</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-lendit-green">My Analytics</h1>
            <p className="mt-2 text-gray-600">
              Track your performance and insights
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <DollarSign className="h-8 w-8 text-green-500" />
                <span className={`text-xs px-2 py-1 rounded-full ${
                  data.revenue.growthRate >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {data.revenue.growthRate >= 0 ? '+' : ''}{data.revenue.growthRate}%
                </span>
              </div>
              <p className="text-2xl font-bold mt-2">
                {formatCurrency(data.revenue.thisMonth, data.revenue.currency)}
              </p>
              <p className="text-xs text-gray-500">Revenue This Month</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <Package className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-2xl font-bold mt-2">{data.listings.length}</p>
              <p className="text-xs text-gray-500">Total Listings</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <Calendar className="h-8 w-8 text-orange-500" />
              </div>
              <p className="text-2xl font-bold mt-2">{data.bookings.total}</p>
              <p className="text-xs text-gray-500">Total Bookings</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <Clock className="h-8 w-8 text-purple-500" />
              </div>
              <p className="text-2xl font-bold mt-2">{data.bookings.averageResponseTime}h</p>
              <p className="text-xs text-gray-500">Avg Response Time</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
            <CardDescription>Monthly revenue breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end gap-2">
              {data.revenue.byMonth.slice(-12).map((month, i) => {
                const maxRevenue = Math.max(...data.revenue.byMonth.map((m) => m.revenue))
                const height = maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0
                return (
                  <div key={i} className="flex-1 flex flex-col items-center group relative">
                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {formatCurrency(month.revenue, data.revenue.currency)}
                      <br />
                      {month.bookingCount} bookings
                    </div>
                    <div
                      className="w-full bg-lendit-green rounded-t hover:bg-lendit-green-600 transition-colors cursor-pointer"
                      style={{ height: `${height}%`, minHeight: month.revenue > 0 ? '4px' : '0' }}
                    />
                    <span className="text-xs text-gray-500 mt-2">
                      {getMonthName(month.month)}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-semibold text-lendit-green">
                  {formatCurrency(data.revenue.totalRevenue, data.revenue.currency)}
                </p>
                <p className="text-xs text-gray-500">Total Revenue</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-lendit-brown">
                  {formatCurrency(data.revenue.averageOrderValue, data.revenue.currency)}
                </p>
                <p className="text-xs text-gray-500">Avg Order Value</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-600">
                  {data.bookings.acceptanceRate}%
                </p>
                <p className="text-xs text-gray-500">Acceptance Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Listings Performance */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Listing Performance</CardTitle>
            <CardDescription>Revenue and utilisation by machine</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium text-gray-600">Listing</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-600">Price/Day</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-600">Bookings</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-600">Revenue</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-600">Utilisation</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-600">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {data.listings.map((listing) => (
                    <tr key={listing.listingId} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-2">
                        <div>
                          <p className="font-medium text-gray-900">{listing.title}</p>
                          <p className="text-xs text-gray-500">{listing.category.replace(/_/g, ' ')}</p>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right">
                        {formatCurrency(listing.pricePerDay, data.revenue.currency)}
                      </td>
                      <td className="py-3 px-2 text-right">{listing.totalBookings}</td>
                      <td className="py-3 px-2 text-right font-medium text-green-600">
                        {formatCurrency(listing.totalRevenue, data.revenue.currency)}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                listing.utilisationRate > 60 ? 'bg-green-500' :
                                listing.utilisationRate > 30 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${listing.utilisationRate}%` }}
                            />
                          </div>
                          <span className="text-sm">{listing.utilisationRate}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right">
                        {listing.averageRating ? (
                          <span className="flex items-center justify-end gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            {listing.averageRating.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Renter Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* By Location */}
          <Card>
            <CardHeader>
              <CardTitle>Renters by Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.renterLocations.byRegion.slice(0, 8).map((region, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 flex items-center">
                      <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                      {region.region}, {region.country}
                    </span>
                    <div className="text-right">
                      <span className="text-sm font-medium">{region.bookingCount}</span>
                      <span className="text-xs text-gray-400 ml-2">
                        {formatCurrency(region.revenue, data.revenue.currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Renters */}
          <Card>
            <CardHeader>
              <CardTitle>Top Renters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.renterLocations.topRenters.slice(0, 8).map((renter, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 flex items-center">
                      <Users className="h-3 w-3 mr-1 text-gray-400" />
                      {renter.renterName}
                    </span>
                    <div className="text-right">
                      <span className="text-sm font-medium">{renter.bookingCount} bookings</span>
                      <span className="text-xs text-green-600 ml-2">
                        {formatCurrency(renter.totalSpent, data.revenue.currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Booking Stats */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Booking Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{data.bookings.pending}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{data.bookings.accepted}</p>
                <p className="text-xs text-gray-500">Accepted</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{data.bookings.completed}</p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-600">{data.bookings.cancelled}</p>
                <p className="text-xs text-gray-500">Cancelled</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{data.bookings.inDispute}</p>
                <p className="text-xs text-gray-500">In Dispute</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{data.bookings.acceptanceRate}%</p>
                <p className="text-xs text-gray-500">Acceptance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle>Export Your Data</CardTitle>
            <CardDescription>Download CSV exports for your records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              <Button
                variant="outline"
                onClick={() => handleExport('bookings')}
                disabled={exporting === 'bookings'}
              >
                <Download className="h-4 w-4 mr-2" />
                {exporting === 'bookings' ? 'Exporting...' : 'My Bookings'}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport('listings')}
                disabled={exporting === 'listings'}
              >
                <Download className="h-4 w-4 mr-2" />
                {exporting === 'listings' ? 'Exporting...' : 'My Listings'}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport('summary')}
                disabled={exporting === 'summary'}
              >
                <Download className="h-4 w-4 mr-2" />
                {exporting === 'summary' ? 'Exporting...' : 'Summary Report'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
