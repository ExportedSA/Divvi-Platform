'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Gift,
  Users,
  DollarSign,
  Copy,
  Check,
  Share2,
  Clock,
  CheckCircle,
} from 'lucide-react'

interface ReferralStats {
  referralCode: string
  vanityCode: string | null
  referralLink: string
  stats: {
    timesUsed: number
    totalEarnings: number
    pendingReferrals: number
    completedReferrals: number
  }
  credits: {
    total: number
    available: number
    expiringSoon: number
    currency: string
  }
}

interface ReferralHistoryItem {
  id: string
  referredName: string
  status: string
  rewardAmount: number | null
  rewardPaid: boolean
  createdAt: string
}

export default function ReferralDashboardPage() {
  const { data: session, status } = useSession()
  const [data, setData] = useState<ReferralStats | null>(null)
  const [history, setHistory] = useState<ReferralHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [vanityCode, setVanityCode] = useState('')
  const [settingVanity, setSettingVanity] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData()
    }
  }, [status])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [statsRes, historyRes] = await Promise.all([
        fetch('/api/referrals?view=stats'),
        fetch('/api/referrals?view=history'),
      ])

      const statsData = await statsRes.json()
      const historyData = await historyRes.json()

      setData(statsData)
      setHistory(historyData.history || [])
    } catch (error) {
      console.error('Failed to fetch referral data:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    if (!data) return
    await navigator.clipboard.writeText(data.referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareReferral = async () => {
    if (!data) return
    if (navigator.share) {
      await navigator.share({
        title: 'Join Lendit',
        text: 'Rent farm equipment from local owners. Use my referral link to get started!',
        url: data.referralLink,
      })
    } else {
      copyToClipboard()
    }
  }

  const handleSetVanityCode = async () => {
    if (!vanityCode.trim()) return
    setSettingVanity(true)
    try {
      const res = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_vanity_code',
          vanityCode: vanityCode.trim(),
        }),
      })
      const result = await res.json()
      if (res.ok) {
        fetchData()
        setVanityCode('')
      } else {
        alert(result.error || 'Failed to set vanity code')
      }
    } catch (error) {
      alert('Failed to set vanity code')
    } finally {
      setSettingVanity(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      PENDING: { color: 'bg-gray-100 text-gray-700', label: 'Pending' },
      SIGNED_UP: { color: 'bg-blue-100 text-blue-700', label: 'Signed Up' },
      BOOKING_MADE: { color: 'bg-yellow-100 text-yellow-700', label: 'Booking Made' },
      REWARD_EARNED: { color: 'bg-green-100 text-green-700', label: 'Reward Earned' },
      REWARD_PAID: { color: 'bg-green-100 text-green-700', label: 'Paid' },
      EXPIRED: { color: 'bg-red-100 text-red-700', label: 'Expired' },
    }
    const badge = badges[status] || badges.PENDING
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    )
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
        <p className="text-gray-500">Failed to load referral data</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-lendit-green">Refer & Earn</h1>
          <p className="mt-2 text-gray-600">
            Share Lendit with friends and earn $50 credit for each successful referral
          </p>
        </div>

        {/* Referral Link Card */}
        <Card className="mb-8 border-lendit-green border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-lendit-green" />
              Your Referral Link
            </CardTitle>
            <CardDescription>
              Share this link with friends. When they complete their first booking, you both earn credit!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={data.referralLink}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                onClick={copyToClipboard}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                onClick={shareReferral}
                className="shrink-0 bg-lendit-green hover:bg-lendit-green-600"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>

            {/* Vanity Code */}
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600 mb-2">
                Want a custom code? Set your own vanity code:
              </p>
              <div className="flex gap-2">
                <Input
                  value={vanityCode}
                  onChange={(e) => setVanityCode(e.target.value.toUpperCase())}
                  placeholder={data.vanityCode || 'e.g., JOHNSFARM'}
                  className="max-w-xs uppercase"
                />
                <Button
                  variant="outline"
                  onClick={handleSetVanityCode}
                  disabled={settingVanity || !vanityCode.trim()}
                >
                  {settingVanity ? 'Setting...' : 'Set Code'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-4">
              <Users className="h-8 w-8 text-blue-500 mb-2" />
              <p className="text-2xl font-bold">{data.stats.timesUsed}</p>
              <p className="text-xs text-gray-500">Referrals Made</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <Clock className="h-8 w-8 text-yellow-500 mb-2" />
              <p className="text-2xl font-bold">{data.stats.pendingReferrals}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
              <p className="text-2xl font-bold">{data.stats.completedReferrals}</p>
              <p className="text-xs text-gray-500">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <DollarSign className="h-8 w-8 text-lendit-green mb-2" />
              <p className="text-2xl font-bold">${data.stats.totalEarnings}</p>
              <p className="text-xs text-gray-500">Total Earned</p>
            </CardContent>
          </Card>
        </div>

        {/* Credit Balance */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Credit Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">
                  ${data.credits.available}
                </p>
                <p className="text-sm text-gray-600">Available</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-3xl font-bold text-gray-600">
                  ${data.credits.total}
                </p>
                <p className="text-sm text-gray-600">Total Earned</p>
              </div>
              {data.credits.expiringSoon > 0 && (
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-3xl font-bold text-yellow-600">
                    ${data.credits.expiringSoon}
                  </p>
                  <p className="text-sm text-gray-600">Expiring Soon</p>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">
              Credits are automatically applied to your next booking
            </p>
          </CardContent>
        </Card>

        {/* Referral History */}
        <Card>
          <CardHeader>
            <CardTitle>Referral History</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No referrals yet</p>
                <p className="text-sm mt-2">Share your link to start earning!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{item.referredName}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {item.rewardAmount && item.rewardPaid && (
                        <span className="text-green-600 font-medium">
                          +${item.rewardAmount}
                        </span>
                      )}
                      {getStatusBadge(item.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-lendit-green text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                  1
                </div>
                <h3 className="font-semibold mb-2">Share Your Link</h3>
                <p className="text-sm text-gray-600">
                  Send your unique referral link to friends who could use equipment rental
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-lendit-green text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                  2
                </div>
                <h3 className="font-semibold mb-2">They Sign Up & Book</h3>
                <p className="text-sm text-gray-600">
                  Your friend creates an account and completes their first booking
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-lendit-green text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                  3
                </div>
                <h3 className="font-semibold mb-2">You Both Earn</h3>
                <p className="text-sm text-gray-600">
                  You get $50 credit, they get $25 credit to use on future bookings
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
