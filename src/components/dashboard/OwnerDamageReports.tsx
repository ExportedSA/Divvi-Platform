'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  AlertTriangle, 
  ChevronRight, 
  Image as ImageIcon, 
  FileText, 
  Clock,
  DollarSign,
  ExternalLink
} from 'lucide-react'
import { DamageStatusBadge, ReportStatusBadge, SeverityBadge } from './DamageStatusBadge'
import type { DamageStatus, DamageReportStatus, DamageSeverity } from './DamageStatusBadge'

// ============================================
// TYPES
// ============================================

interface DamageReport {
  id: string
  summary: string
  description: string
  reportedSeverity: DamageSeverity
  status: DamageReportStatus
  reportedByRole: 'OWNER' | 'RENTER' | 'ADMIN'
  createdAt: string
  resolvedAt?: string | null
  bondAmountApplied?: number | null
  photoCount: number
}

interface BookingWithDamage {
  id: string
  listingId: string
  listingTitle: string
  renterName: string
  startDate: string
  endDate: string
  damageStatus: DamageStatus
  bondAmount: number | null
  damageReports: DamageReport[]
}

interface OwnerDamageReportsProps {
  bookings?: BookingWithDamage[]
  isLoading?: boolean
  onViewReport?: (reportId: string, bookingId: string) => void
  className?: string
}

// ============================================
// COMPONENT
// ============================================

export function OwnerDamageReports({
  bookings = [],
  isLoading = false,
  onViewReport,
  className = '',
}: OwnerDamageReportsProps) {
  // Filter to only bookings with damage reports
  const bookingsWithDamage = bookings.filter(
    b => b.damageStatus !== 'NONE_REPORTED' || b.damageReports.length > 0
  )

  if (isLoading) {
    return <OwnerDamageReportsSkeleton />
  }

  if (bookingsWithDamage.length === 0) {
    return (
      <div className={`bg-white rounded-lg border p-6 text-center ${className}`}>
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-6 h-6 text-green-600" />
        </div>
        <h3 className="font-medium text-gray-900">No Damage Reports</h3>
        <p className="text-sm text-gray-500 mt-1">
          None of your bookings have damage reports.
        </p>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border overflow-hidden ${className}`}>
      <div className="px-4 py-3 border-b bg-gray-50">
        <h3 className="font-medium text-gray-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Damage Reports
          <span className="text-sm font-normal text-gray-500">
            ({bookingsWithDamage.length} booking{bookingsWithDamage.length !== 1 ? 's' : ''})
          </span>
        </h3>
      </div>

      <div className="divide-y">
        {bookingsWithDamage.map((booking) => (
          <BookingDamageCard
            key={booking.id}
            booking={booking}
            onViewReport={onViewReport}
          />
        ))}
      </div>
    </div>
  )
}

// ============================================
// BOOKING CARD
// ============================================

interface BookingDamageCardProps {
  booking: BookingWithDamage
  onViewReport?: (reportId: string, bookingId: string) => void
}

function BookingDamageCard({ booking, onViewReport }: BookingDamageCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const latestReport = booking.damageReports[0]

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-NZ', {
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="p-4">
      {/* Header Row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link 
              href={`/listings/${booking.listingId}`}
              className="font-medium text-gray-900 hover:text-blue-600 truncate"
            >
              {booking.listingTitle}
            </Link>
            <DamageStatusBadge status={booking.damageStatus} />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Renter: {booking.renterName} · {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
          </p>
        </div>

        {booking.bondAmount && (
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-gray-500">Bond</p>
            <p className="font-medium text-gray-900">
              ${booking.bondAmount.toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Reports Summary */}
      {booking.damageReports.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full text-left"
          >
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">
                  {booking.damageReports.length} Report{booking.damageReports.length !== 1 ? 's' : ''}
                </span>
                {latestReport && (
                  <>
                    <ReportStatusBadge status={latestReport.status} />
                    <SeverityBadge severity={latestReport.reportedSeverity} />
                  </>
                )}
              </div>
              <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </div>
          </button>

          {/* Expanded Reports List */}
          {isExpanded && (
            <div className="mt-2 space-y-2">
              {booking.damageReports.map((report) => (
                <DamageReportRow
                  key={report.id}
                  report={report}
                  bookingId={booking.id}
                  onView={onViewReport}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-3 flex items-center gap-2">
        <Link
          href={`/bookings/${booking.id}`}
          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          View Booking
          <ExternalLink className="w-3 h-3" />
        </Link>
        {booking.damageReports.length > 0 && (
          <>
            <span className="text-gray-300">·</span>
            <Link
              href={`/bookings/${booking.id}/damage`}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              All Reports
              <ExternalLink className="w-3 h-3" />
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

// ============================================
// REPORT ROW
// ============================================

interface DamageReportRowProps {
  report: DamageReport
  bookingId: string
  onView?: (reportId: string, bookingId: string) => void
}

function DamageReportRow({ report, bookingId, onView }: DamageReportRowProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-NZ', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="p-3 bg-white border rounded-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {report.summary}
          </p>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{formatDate(report.createdAt)}</span>
            <span>·</span>
            <span>by {report.reportedByRole}</span>
            {report.photoCount > 0 && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" />
                  {report.photoCount}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ReportStatusBadge status={report.status} />
          
          {report.bondAmountApplied && report.bondAmountApplied > 0 && (
            <span className="text-xs font-medium text-red-600 flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              {report.bondAmountApplied.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={() => onView?.(report.id, bookingId)}
        className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
      >
        View Details →
      </button>
    </div>
  )
}

// ============================================
// SKELETON
// ============================================

function OwnerDamageReportsSkeleton() {
  return (
    <div className="bg-white rounded-lg border overflow-hidden animate-pulse">
      <div className="px-4 py-3 border-b bg-gray-50">
        <div className="h-5 bg-gray-200 rounded w-40" />
      </div>
      <div className="divide-y">
        {[1, 2].map((i) => (
          <div key={i} className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="h-5 bg-gray-200 rounded w-48" />
                <div className="h-4 bg-gray-200 rounded w-32" />
              </div>
              <div className="h-6 bg-gray-200 rounded w-16" />
            </div>
            <div className="mt-3 h-12 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default OwnerDamageReports
