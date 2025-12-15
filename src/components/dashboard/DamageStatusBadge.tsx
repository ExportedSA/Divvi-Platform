'use client'

import { AlertTriangle, CheckCircle, Clock, XCircle, AlertCircle, Scale } from 'lucide-react'

// ============================================
// TYPES
// ============================================

export type DamageStatus = 
  | 'NONE_REPORTED'
  | 'POTENTIAL_DAMAGE_REPORTED'
  | 'CONFIRMED_DAMAGE'
  | 'RESOLVED_NO_CHARGE'
  | 'RESOLVED_BOND_PARTIALLY_USED'
  | 'RESOLVED_BOND_FULLY_USED'

export type DamageReportStatus = 
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'AWAITING_MORE_INFO'
  | 'NEGOTIATION'
  | 'RESOLVED_NO_ACTION'
  | 'RESOLVED_BOND_PARTIAL'
  | 'RESOLVED_BOND_FULL'
  | 'ESCALATED'

export type DamageSeverity = 'MINOR' | 'MODERATE' | 'MAJOR' | 'TOTAL_LOSS'

// ============================================
// CONFIGURATION
// ============================================

const DAMAGE_STATUS_CONFIG: Record<DamageStatus, {
  label: string
  color: 'gray' | 'amber' | 'red' | 'green' | 'blue'
  icon: typeof AlertTriangle
}> = {
  NONE_REPORTED: {
    label: 'No Damage',
    color: 'gray',
    icon: CheckCircle,
  },
  POTENTIAL_DAMAGE_REPORTED: {
    label: 'Damage Reported',
    color: 'amber',
    icon: AlertTriangle,
  },
  CONFIRMED_DAMAGE: {
    label: 'Damage Confirmed',
    color: 'red',
    icon: AlertCircle,
  },
  RESOLVED_NO_CHARGE: {
    label: 'Resolved - No Charge',
    color: 'green',
    icon: CheckCircle,
  },
  RESOLVED_BOND_PARTIALLY_USED: {
    label: 'Resolved - Partial Bond',
    color: 'blue',
    icon: Scale,
  },
  RESOLVED_BOND_FULLY_USED: {
    label: 'Resolved - Full Bond',
    color: 'red',
    icon: XCircle,
  },
}

const REPORT_STATUS_CONFIG: Record<DamageReportStatus, {
  label: string
  color: 'gray' | 'amber' | 'red' | 'green' | 'blue' | 'purple'
}> = {
  OPEN: { label: 'Open', color: 'amber' },
  UNDER_REVIEW: { label: 'Under Review', color: 'blue' },
  AWAITING_MORE_INFO: { label: 'Awaiting Info', color: 'purple' },
  NEGOTIATION: { label: 'Negotiation', color: 'blue' },
  RESOLVED_NO_ACTION: { label: 'No Action', color: 'green' },
  RESOLVED_BOND_PARTIAL: { label: 'Partial Bond', color: 'amber' },
  RESOLVED_BOND_FULL: { label: 'Full Bond', color: 'red' },
  ESCALATED: { label: 'Escalated', color: 'red' },
}

const SEVERITY_CONFIG: Record<DamageSeverity, {
  label: string
  color: 'green' | 'amber' | 'orange' | 'red'
}> = {
  MINOR: { label: 'Minor', color: 'green' },
  MODERATE: { label: 'Moderate', color: 'amber' },
  MAJOR: { label: 'Major', color: 'orange' },
  TOTAL_LOSS: { label: 'Total Loss', color: 'red' },
}

// ============================================
// COLOR UTILITIES
// ============================================

function getColorClasses(color: string) {
  const colors: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
    amber: 'bg-amber-100 text-amber-800 border-amber-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    green: 'bg-green-100 text-green-800 border-green-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    orange: 'bg-orange-100 text-orange-800 border-orange-200',
  }
  return colors[color] || colors.gray
}

// ============================================
// COMPONENTS
// ============================================

interface DamageStatusBadgeProps {
  status: DamageStatus
  size?: 'sm' | 'md'
  showIcon?: boolean
  className?: string
}

export function DamageStatusBadge({ 
  status, 
  size = 'sm', 
  showIcon = true,
  className = '' 
}: DamageStatusBadgeProps) {
  const config = DAMAGE_STATUS_CONFIG[status]
  if (!config) return null

  const Icon = config.icon
  const sizeClasses = size === 'sm' 
    ? 'text-xs px-2 py-0.5' 
    : 'text-sm px-2.5 py-1'

  return (
    <span className={`
      inline-flex items-center gap-1 rounded-full border font-medium
      ${getColorClasses(config.color)}
      ${sizeClasses}
      ${className}
    `}>
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />}
      {config.label}
    </span>
  )
}

interface ReportStatusBadgeProps {
  status: DamageReportStatus
  size?: 'sm' | 'md'
  className?: string
}

export function ReportStatusBadge({ 
  status, 
  size = 'sm',
  className = '' 
}: ReportStatusBadgeProps) {
  const config = REPORT_STATUS_CONFIG[status]
  if (!config) return null

  const sizeClasses = size === 'sm' 
    ? 'text-xs px-2 py-0.5' 
    : 'text-sm px-2.5 py-1'

  return (
    <span className={`
      inline-flex items-center rounded-full border font-medium
      ${getColorClasses(config.color)}
      ${sizeClasses}
      ${className}
    `}>
      {config.label}
    </span>
  )
}

interface SeverityBadgeProps {
  severity: DamageSeverity
  size?: 'sm' | 'md'
  className?: string
}

export function SeverityBadge({ 
  severity, 
  size = 'sm',
  className = '' 
}: SeverityBadgeProps) {
  const config = SEVERITY_CONFIG[severity]
  if (!config) return null

  const sizeClasses = size === 'sm' 
    ? 'text-xs px-2 py-0.5' 
    : 'text-sm px-2.5 py-1'

  return (
    <span className={`
      inline-flex items-center rounded-full border font-medium
      ${getColorClasses(config.color)}
      ${sizeClasses}
      ${className}
    `}>
      {config.label}
    </span>
  )
}

export default DamageStatusBadge
