'use client'

import Link from 'next/link'
import { 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Image as ImageIcon,
  MessageSquare,
  ExternalLink,
  ArrowRight
} from 'lucide-react'
import { DamageStatusBadge, ReportStatusBadge, SeverityBadge } from './DamageStatusBadge'
import type { DamageReportStatus, DamageSeverity } from './DamageStatusBadge'

// ============================================
// TYPES
// ============================================

interface DamageReport {
  id: string
  bookingId: string
  listingTitle: string
  summary: string
  reportedSeverity: DamageSeverity
  status: DamageReportStatus
  reportedByRole: 'OWNER' | 'RENTER' | 'ADMIN'
  createdAt: string
  bondAmount: number | null
  bondAmountApplied?: number | null
  negotiationDeadline?: string | null
  canRespond: boolean
}

interface RenterDamageReportsProps {
  reports?: DamageReport[]
  isLoading?: boolean
  onRespond?: (reportId: string) => void
  className?: string
}

// ============================================
// COMPONENT
// ============================================

export function RenterDamageReports({
  reports = [],
  isLoading = false,
  onRespond,
  className = '',
}: RenterDamageReportsProps) {
  // Separate open and resolved reports
  const openReports = reports.filter(r => 
    ['OPEN', 'UNDER_REVIEW', 'AWAITING_MORE_INFO', 'NEGOTIATION'].includes(r.status)
  )
  const resolvedReports = reports.filter(r => 
    ['RESOLVED_NO_ACTION', 'RESOLVED_BOND_PARTIAL', 'RESOLVED_BOND_FULL', 'ESCALATED'].includes(r.status)
  )

  if (isLoading) {
    return <RenterDamageReportsSkeleton />
  }

  if (reports.length === 0) {
    return (
      <div className={`bg-white rounded-lg border p-6 text-center ${className}`}>
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle className="w-6 h-6 text-green-600" />
        </div>
        <h3 className="font-medium text-gray-900">No Damage Reports</h3>
        <p className="text-sm text-gray-500 mt-1">
          You don't have any damage reports on your rentals.
        </p>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Open Reports - Priority */}
      {openReports.length > 0 && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="px-4 py-3 border-b bg-amber-50">
            <h3 className="font-medium text-amber-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Open Damage Reports
              <span className="text-sm font-normal text-amber-700">
                ({openReports.length})
              </span>
            </h3>
            <p className="text-xs text-amber-700 mt-1">
              These reports require your attention. You may add photos or comments.
            </p>
          </div>

          <div className="divide-y">
            {openReports.map((report) => (
              <OpenReportCard
                key={report.id}
                report={report}
                onRespond={onRespond}
              />
            ))}
          </div>
        </div>
      )}

      {/* Resolved Reports */}
      {resolvedReports.length > 0 && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h3 className="font-medium text-gray-700 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-gray-400" />
              Resolved Reports
              <span className="text-sm font-normal text-gray-500">
                ({resolvedReports.length})
              </span>
            </h3>
          </div>

          <div className="divide-y">
            {resolvedReports.map((report) => (
              <ResolvedReportCard key={report.id} report={report} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// OPEN REPORT CARD
// ============================================

interface OpenReportCardProps {
  report: DamageReport
  onRespond?: (reportId: string) => void
}

function OpenReportCard({ report, onRespond }: OpenReportCardProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-NZ', {
      month: 'short',
      day: 'numeric',
    })
  }

  const daysUntilDeadline = report.negotiationDeadline
    ? Math.ceil((new Date(report.negotiationDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link 
              href={`/bookings/${report.bookingId}`}
              className="font-medium text-gray-900 hover:text-blue-600 truncate"
            >
              {report.listingTitle}
            </Link>
            <ReportStatusBadge status={report.status} />
            <SeverityBadge severity={report.reportedSeverity} />
          </div>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {report.summary}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Reported {formatDate(report.createdAt)}
            </span>
            <span>by {report.reportedByRole}</span>
          </div>
        </div>

        {report.bondAmount && (
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-gray-500">Bond at risk</p>
            <p className="font-semibold text-amber-600">
              ${report.bondAmount.toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Deadline Warning */}
      {daysUntilDeadline !== null && daysUntilDeadline <= 3 && daysUntilDeadline > 0 && (
        <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-md flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600" />
          <span className="text-sm text-amber-800">
            {daysUntilDeadline} day{daysUntilDeadline !== 1 ? 's' : ''} left to respond
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 flex items-center gap-3">
        <Link
          href={`/damage-reports/${report.id}`}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
        >
          View Report
          <ArrowRight className="w-3 h-3" />
        </Link>

        {report.canRespond && (
          <button
            onClick={() => onRespond?.(report.id)}
            className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 flex items-center gap-1"
          >
            <MessageSquare className="w-3 h-3" />
            Add Response
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================
// RESOLVED REPORT CARD
// ============================================

interface ResolvedReportCardProps {
  report: DamageReport
}

function ResolvedReportCard({ report }: ResolvedReportCardProps) {
  const getOutcomeText = () => {
    switch (report.status) {
      case 'RESOLVED_NO_ACTION':
        return { text: 'No charge - bond returned', color: 'text-green-600' }
      case 'RESOLVED_BOND_PARTIAL':
        return { 
          text: `$${report.bondAmountApplied?.toLocaleString() || 0} deducted from bond`, 
          color: 'text-amber-600' 
        }
      case 'RESOLVED_BOND_FULL':
        return { text: 'Full bond applied', color: 'text-red-600' }
      case 'ESCALATED':
        return { text: 'Escalated for external resolution', color: 'text-purple-600' }
      default:
        return { text: 'Resolved', color: 'text-gray-600' }
    }
  }

  const outcome = getOutcomeText()

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-700 truncate">
              {report.listingTitle}
            </span>
            <ReportStatusBadge status={report.status} />
          </div>
          <p className="text-sm text-gray-500 mt-1 truncate">
            {report.summary}
          </p>
        </div>

        <div className="text-right flex-shrink-0">
          <p className={`text-sm font-medium ${outcome.color}`}>
            {outcome.text}
          </p>
        </div>
      </div>

      <div className="mt-2">
        <Link
          href={`/damage-reports/${report.id}`}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          View Details →
        </Link>
      </div>
    </div>
  )
}

// ============================================
// SKELETON
// ============================================

function RenterDamageReportsSkeleton() {
  return (
    <div className="bg-white rounded-lg border overflow-hidden animate-pulse">
      <div className="px-4 py-3 border-b bg-gray-50">
        <div className="h-5 bg-gray-200 rounded w-40" />
      </div>
      <div className="divide-y">
        {[1, 2].map((i) => (
          <div key={i} className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-5 bg-gray-200 rounded w-48" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-32" />
              </div>
              <div className="h-6 bg-gray-200 rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RenterDamageReports
