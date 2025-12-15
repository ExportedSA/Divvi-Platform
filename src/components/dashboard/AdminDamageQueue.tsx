'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  AlertTriangle, 
  Filter,
  Search,
  ChevronDown,
  ExternalLink,
  Image as ImageIcon,
  MessageSquare,
  FileText,
  DollarSign,
  Clock,
  CheckSquare,
  User,
  ArrowUpRight
} from 'lucide-react'
import { ReportStatusBadge, SeverityBadge } from './DamageStatusBadge'
import type { DamageReportStatus, DamageSeverity } from './DamageStatusBadge'

// ============================================
// TYPES
// ============================================

interface DamageReportItem {
  id: string
  bookingId: string
  listingId: string
  listingTitle: string
  listingCategory: string
  ownerName: string
  ownerId: string
  renterName: string
  renterId: string
  summary: string
  reportedSeverity: DamageSeverity
  status: DamageReportStatus
  reportedByRole: 'OWNER' | 'RENTER' | 'ADMIN'
  createdAt: string
  bondAmount: number | null
  photoCount: number
  hasUnreadMessages: boolean
  daysOpen: number
}

interface AdminDamageQueueProps {
  reports?: DamageReportItem[]
  isLoading?: boolean
  onSelectReport?: (report: DamageReportItem) => void
  className?: string
}

interface FilterState {
  status: DamageReportStatus[]
  severity: DamageSeverity[]
  category: string[]
  search: string
}

// ============================================
// FILTER OPTIONS
// ============================================

const STATUS_OPTIONS: { value: DamageReportStatus; label: string }[] = [
  { value: 'OPEN', label: 'Open' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'AWAITING_MORE_INFO', label: 'Awaiting Info' },
  { value: 'NEGOTIATION', label: 'Negotiation' },
  { value: 'ESCALATED', label: 'Escalated' },
  { value: 'RESOLVED_NO_ACTION', label: 'Resolved - No Action' },
  { value: 'RESOLVED_BOND_PARTIAL', label: 'Resolved - Partial' },
  { value: 'RESOLVED_BOND_FULL', label: 'Resolved - Full' },
]

const SEVERITY_OPTIONS: { value: DamageSeverity; label: string }[] = [
  { value: 'MINOR', label: 'Minor' },
  { value: 'MODERATE', label: 'Moderate' },
  { value: 'MAJOR', label: 'Major' },
  { value: 'TOTAL_LOSS', label: 'Total Loss' },
]

// ============================================
// COMPONENT
// ============================================

export function AdminDamageQueue({
  reports = [],
  isLoading = false,
  onSelectReport,
  className = '',
}: AdminDamageQueueProps) {
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    severity: [],
    category: [],
    search: '',
  })
  const [showFilters, setShowFilters] = useState(false)

  // Get unique categories from reports
  const categories = Array.from(new Set(reports.map(r => r.listingCategory))).filter(Boolean)

  // Apply filters
  const filteredReports = reports.filter(report => {
    if (filters.status.length > 0 && !filters.status.includes(report.status)) {
      return false
    }
    if (filters.severity.length > 0 && !filters.severity.includes(report.reportedSeverity)) {
      return false
    }
    if (filters.category.length > 0 && !filters.category.includes(report.listingCategory)) {
      return false
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      return (
        report.listingTitle.toLowerCase().includes(searchLower) ||
        report.summary.toLowerCase().includes(searchLower) ||
        report.ownerName.toLowerCase().includes(searchLower) ||
        report.renterName.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  // Stats
  const openCount = reports.filter(r => 
    ['OPEN', 'UNDER_REVIEW', 'AWAITING_MORE_INFO', 'NEGOTIATION'].includes(r.status)
  ).length
  const escalatedCount = reports.filter(r => r.status === 'ESCALATED').length
  const urgentCount = reports.filter(r => r.daysOpen >= 5 && r.status === 'OPEN').length

  if (isLoading) {
    return <AdminDamageQueueSkeleton />
  }

  return (
    <div className={`bg-white rounded-lg border overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Damage Report Queue
          </h3>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-amber-600 font-medium">{openCount} open</span>
            {escalatedCount > 0 && (
              <span className="text-red-600 font-medium">{escalatedCount} escalated</span>
            )}
            {urgentCount > 0 && (
              <span className="text-red-600 font-medium">{urgentCount} urgent</span>
            )}
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="px-4 py-3 border-b space-y-3">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search reports..."
              value={filters.search}
              onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
              className="w-full pl-9 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`
              flex items-center gap-2 px-3 py-2 border rounded-md text-sm
              ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'hover:bg-gray-50'}
            `}
          >
            <Filter className="w-4 h-4" />
            Filters
            {(filters.status.length + filters.severity.length + filters.category.length) > 0 && (
              <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                {filters.status.length + filters.severity.length + filters.category.length}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Filter Dropdowns */}
        {showFilters && (
          <div className="flex flex-wrap gap-3">
            {/* Status Filter */}
            <FilterDropdown
              label="Status"
              options={STATUS_OPTIONS}
              selected={filters.status}
              onChange={(values) => setFilters(f => ({ ...f, status: values as DamageReportStatus[] }))}
            />

            {/* Severity Filter */}
            <FilterDropdown
              label="Severity"
              options={SEVERITY_OPTIONS}
              selected={filters.severity}
              onChange={(values) => setFilters(f => ({ ...f, severity: values as DamageSeverity[] }))}
            />

            {/* Category Filter */}
            {categories.length > 0 && (
              <FilterDropdown
                label="Category"
                options={categories.map(c => ({ value: c, label: c }))}
                selected={filters.category}
                onChange={(values) => setFilters(f => ({ ...f, category: values }))}
              />
            )}

            {/* Clear Filters */}
            {(filters.status.length + filters.severity.length + filters.category.length) > 0 && (
              <button
                onClick={() => setFilters(f => ({ ...f, status: [], severity: [], category: [] }))}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear all
              </button>
            )}
          </div>
        )}
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-gray-500">No reports match your filters.</p>
        </div>
      ) : (
        <div className="divide-y max-h-[600px] overflow-y-auto">
          {filteredReports.map((report) => (
            <ReportRow
              key={report.id}
              report={report}
              onSelect={onSelectReport}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 border-t bg-gray-50 text-sm text-gray-500">
        Showing {filteredReports.length} of {reports.length} reports
      </div>
    </div>
  )
}

// ============================================
// FILTER DROPDOWN
// ============================================

interface FilterDropdownProps {
  label: string
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (values: string[]) => void
}

function FilterDropdown({ label, options, selected, onChange }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm hover:bg-gray-50"
      >
        {label}
        {selected.length > 0 && (
          <span className="bg-gray-200 text-gray-700 text-xs px-1.5 py-0.5 rounded">
            {selected.length}
          </span>
        )}
        <ChevronDown className="w-3 h-3" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg z-20 min-w-[150px]">
            {options.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  onChange={() => toggleOption(option.value)}
                  className="rounded text-blue-600"
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ============================================
// REPORT ROW
// ============================================

interface ReportRowProps {
  report: DamageReportItem
  onSelect?: (report: DamageReportItem) => void
}

function ReportRow({ report, onSelect }: ReportRowProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-NZ', {
      month: 'short',
      day: 'numeric',
    })
  }

  const isUrgent = report.daysOpen >= 5 && report.status === 'OPEN'

  return (
    <div 
      className={`p-4 hover:bg-gray-50 cursor-pointer ${isUrgent ? 'bg-red-50' : ''}`}
      onClick={() => onSelect?.(report)}
    >
      <div className="flex items-start gap-4">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-900 truncate">
              {report.listingTitle}
            </span>
            <ReportStatusBadge status={report.status} />
            <SeverityBadge severity={report.reportedSeverity} />
            {isUrgent && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                Urgent
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600 mt-1 truncate">
            {report.summary}
          </p>

          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {report.ownerName} → {report.renterName}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(report.createdAt)} ({report.daysOpen}d ago)
            </span>
            {report.photoCount > 0 && (
              <span className="flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
                {report.photoCount}
              </span>
            )}
            {report.hasUnreadMessages && (
              <span className="flex items-center gap-1 text-blue-600">
                <MessageSquare className="w-3 h-3" />
                New
              </span>
            )}
          </div>
        </div>

        {/* Bond & Actions */}
        <div className="flex-shrink-0 text-right">
          {report.bondAmount && (
            <p className="text-sm font-medium text-gray-900">
              ${report.bondAmount.toLocaleString()}
            </p>
          )}
          <p className="text-xs text-gray-500">{report.listingCategory}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-3 flex items-center gap-4 text-xs">
        <Link
          href={`/admin/damage-reports/${report.id}`}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <FileText className="w-3 h-3" />
          Report
        </Link>
        <Link
          href={`/admin/bookings/${report.bookingId}`}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <ArrowUpRight className="w-3 h-3" />
          Booking
        </Link>
        <Link
          href={`/admin/bookings/${report.bookingId}/checklist`}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <CheckSquare className="w-3 h-3" />
          Checklist
        </Link>
        <Link
          href={`/admin/bookings/${report.bookingId}/messages`}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <MessageSquare className="w-3 h-3" />
          Messages
        </Link>
        <Link
          href={`/admin/bookings/${report.bookingId}/bond`}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <DollarSign className="w-3 h-3" />
          Bond
        </Link>
      </div>
    </div>
  )
}

// ============================================
// SKELETON
// ============================================

function AdminDamageQueueSkeleton() {
  return (
    <div className="bg-white rounded-lg border overflow-hidden animate-pulse">
      <div className="px-4 py-3 border-b bg-gray-50">
        <div className="h-6 bg-gray-200 rounded w-48" />
      </div>
      <div className="px-4 py-3 border-b">
        <div className="h-10 bg-gray-200 rounded" />
      </div>
      <div className="divide-y">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4">
            <div className="flex items-start gap-4">
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 rounded w-48" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-32" />
              </div>
              <div className="h-6 bg-gray-200 rounded w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminDamageQueue
