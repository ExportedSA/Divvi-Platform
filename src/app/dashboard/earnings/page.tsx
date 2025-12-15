'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  ArrowRight, 
  Calendar,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react'

interface EarningsSummary {
  totalGross: number
  totalFees: number
  totalNet: number
  pendingPayout: number
  completedPayouts: number
  bookingCount: number
}

interface Transaction {
  id: string
  bookingId: string
  listingTitle: string
  renterName: string
  startDate: string
  endDate: string
  grossAmount: number
  platformFee: number
  netAmount: number
  currency: string
  paidAt: string
  isInEscrow: boolean
  status: string
}

interface PayoutAccount {
  id: string
  stripeAccountId: string | null
  status: string | null
  isOnboarded: boolean
  isVerified: boolean
  bankName: string | null
  accountLastFour: string | null
  payoutSchedule: string
  minimumPayoutAmount: number
}

export default function EarningsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [account, setAccount] = useState<PayoutAccount | null>(null)
  const [dashboardUrl, setDashboardUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [onboarding, setOnboarding] = useState(false)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData()
    }
  }, [status, page])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch earnings summary
      const earningsRes = await fetch('/api/owner/earnings?view=summary')
      const earningsData = await earningsRes.json()
      setEarnings(earningsData.earnings)

      // Fetch transactions
      const transactionsRes = await fetch(`/api/owner/earnings?view=details&page=${page}&limit=10`)
      const transactionsData = await transactionsRes.json()
      setTransactions(transactionsData.transactions || [])
      setTotalPages(transactionsData.pagination?.totalPages || 0)

      // Fetch payout account
      const accountRes = await fetch('/api/owner/payouts?view=account')
      const accountData = await accountRes.json()
      setAccount(accountData.account)
      setDashboardUrl(accountData.dashboardUrl)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOnboarding = async () => {
    setOnboarding(true)
    try {
      const res = await fetch('/api/owner/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'onboard' }),
      })
      const data = await res.json()
      
      if (data.onboardingUrl) {
        window.location.href = data.onboardingUrl
      } else {
        alert('Failed to start onboarding')
      }
    } catch (error) {
      alert('Failed to start onboarding')
    } finally {
      setOnboarding(false)
    }
  }

  const handleRefreshStatus = async () => {
    try {
      const res = await fetch('/api/owner/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh' }),
      })
      const data = await res.json()
      
      if (data.success) {
        fetchData()
      }
    } catch (error) {
      console.error('Failed to refresh status:', error)
    }
  }

  const formatCurrency = (amount: number, currency: string = 'NZD') => {
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      dateStyle: 'medium',
    })
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-lendit-green">Earnings & Payouts</h1>
          <p className="mt-2 text-gray-600">
            Track your rental income and manage payouts
          </p>
        </div>

        {/* Payout Account Status */}
        {account && !account.isOnboarded && (
          <Card className="mb-8 border-orange-200 bg-orange-50">
            <CardContent className="py-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <AlertCircle className="h-6 w-6 text-orange-500 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Set Up Payouts</h3>
                    <p className="text-gray-600 mt-1">
                      Connect your bank account to receive payouts from your rentals.
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={handleOnboarding}
                  disabled={onboarding}
                  className="bg-lendit-brown hover:bg-lendit-brown-600"
                >
                  {onboarding ? 'Starting...' : 'Set Up Now'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {account && account.isOnboarded && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardContent className="py-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Payouts Active</h3>
                    <p className="text-gray-600 mt-1">
                      {account.bankName && `${account.bankName} ending in ${account.accountLastFour}`}
                      {!account.bankName && 'Bank account connected'}
                      {' • '}{account.payoutSchedule} payouts
                    </p>
                  </div>
                </div>
                {dashboardUrl && (
                  <Button 
                    variant="outline"
                    onClick={() => window.open(dashboardUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Stripe Dashboard
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Earnings Stats */}
        {earnings && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Earnings</CardTitle>
                <DollarSign className="h-5 w-5 text-lendit-green" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-lendit-green">
                  {formatCurrency(earnings.totalGross)}
                </div>
                <p className="text-xs text-gray-500">Gross rental income</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Platform Fees</CardTitle>
                <TrendingUp className="h-5 w-5 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">
                  {formatCurrency(earnings.totalFees)}
                </div>
                <p className="text-xs text-gray-500">10% commission</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Net Earnings</CardTitle>
                <CreditCard className="h-5 w-5 text-lendit-brown" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-lendit-brown">
                  {formatCurrency(earnings.totalNet)}
                </div>
                <p className="text-xs text-gray-500">Your take-home</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Paid Out</CardTitle>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(earnings.completedPayouts)}
                </div>
                <p className="text-xs text-gray-500">{earnings.bookingCount} bookings</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>Your rental earnings by booking</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No transactions yet</p>
                <p className="text-sm mt-2">Earnings will appear here after your first rental</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Listing</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Renter</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Period</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">Gross</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">Fee</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">Net</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900">{tx.listingTitle}</div>
                          <div className="text-sm text-gray-500">
                            Paid {tx.paidAt ? formatDate(tx.paidAt) : 'N/A'}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-600">{tx.renterName}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                            {formatDate(tx.startDate)} - {formatDate(tx.endDate)}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right text-gray-900">
                          {formatCurrency(tx.grossAmount, tx.currency)}
                        </td>
                        <td className="py-4 px-4 text-right text-gray-500">
                          -{formatCurrency(tx.platformFee, tx.currency)}
                        </td>
                        <td className="py-4 px-4 text-right font-semibold text-lendit-green">
                          {formatCurrency(tx.netAmount, tx.currency)}
                        </td>
                        <td className="py-4 px-4">
                          {tx.isInEscrow ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <Clock className="h-3 w-3 mr-1" />
                              In Escrow
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Released
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <span className="py-2 px-4 text-gray-600">
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
