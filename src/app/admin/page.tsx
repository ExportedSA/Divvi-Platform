'use client'

/**
 * Admin Dashboard Home
 * 
 * Overview page with key metrics and quick actions.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface DashboardStats {
  pendingKyc: number
  pendingListings: number
  activeDisputes: number
  suspendedUsers: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-gray-500">
          Monitor platform compliance and user activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pending KYC"
          value={loading ? '...' : stats?.pendingKyc ?? 0}
          href="/admin/compliance/kyc"
          color="yellow"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
            </svg>
          }
        />
        <StatCard
          title="Pending Listings"
          value={loading ? '...' : stats?.pendingListings ?? 0}
          href="/admin/listings/pending"
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Active Disputes"
          value={loading ? '...' : stats?.activeDisputes ?? 0}
          href="/admin/bookings/disputes"
          color="red"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
        <StatCard
          title="Suspended Users"
          value={loading ? '...' : stats?.suspendedUsers ?? 0}
          href="/admin/users/suspended"
          color="gray"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          }
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickAction
            title="Review KYC Documents"
            description="Review pending identity verification requests"
            href="/admin/compliance/kyc"
            buttonText="Review Queue"
          />
          <QuickAction
            title="View Audit Trail"
            description="Monitor recent platform activity and changes"
            href="/admin/compliance/audit"
            buttonText="View Logs"
          />
          <QuickAction
            title="Manage Disputes"
            description="Handle active booking disputes"
            href="/admin/bookings/disputes"
            buttonText="View Disputes"
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  href,
  color,
  icon,
}: {
  title: string
  value: number | string
  href: string
  color: 'yellow' | 'blue' | 'red' | 'gray' | 'green'
  icon: React.ReactNode
}) {
  const colorClasses = {
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    gray: 'bg-gray-50 text-gray-600 border-gray-200',
    green: 'bg-green-50 text-green-600 border-green-200',
  }

  return (
    <Link href={href}>
      <div className={`rounded-lg border p-4 ${colorClasses[color]} hover:shadow-md transition-shadow cursor-pointer`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-75">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className="opacity-50">{icon}</div>
        </div>
      </div>
    </Link>
  )
}

function QuickAction({
  title,
  description,
  href,
  buttonText,
}: {
  title: string
  description: string
  href: string
  buttonText: string
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <h3 className="font-medium text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
      <Link
        href={href}
        className="mt-3 inline-block px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
      >
        {buttonText}
      </Link>
    </div>
  )
}
