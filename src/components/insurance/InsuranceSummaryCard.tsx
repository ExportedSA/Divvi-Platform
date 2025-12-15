'use client'

import Link from 'next/link'
import { Shield, AlertTriangle, ExternalLink, Info } from 'lucide-react'

// ============================================
// TYPES
// ============================================

export type InsuranceMode = 'OWNER_PROVIDED' | 'RENTER_PROVIDED' | 'NONE'

export interface InsuranceSummaryListing {
  insuranceMode: InsuranceMode
  bondAmount?: number | null
  insuranceNotes?: string | null
  damageExcessNotes?: string | null
}

export interface InsuranceSummaryCardProps {
  listing: InsuranceSummaryListing
  policyVersion?: number
  variant?: 'default' | 'compact' | 'detailed'
  showPolicyLink?: boolean
  className?: string
}

// ============================================
// CONSTANTS
// ============================================

const INSURANCE_MODE_CONFIG: Record<InsuranceMode, {
  label: string
  description: string
  icon: 'shield' | 'alert' | 'info'
  color: 'green' | 'blue' | 'amber'
}> = {
  OWNER_PROVIDED: {
    label: 'Owner-Provided Insurance',
    description: 'The owner\'s insurance covers this rental. Review the notes for coverage details.',
    icon: 'shield',
    color: 'green',
  },
  RENTER_PROVIDED: {
    label: 'Renter-Provided Insurance',
    description: 'You must arrange your own insurance before the rental begins.',
    icon: 'info',
    color: 'blue',
  },
  NONE: {
    label: 'No Insurance',
    description: 'No insurance is provided. You bear full risk for any damage or loss.',
    icon: 'alert',
    color: 'amber',
  },
}

const DAMAGE_RESPONSIBILITY_MESSAGE = 
  'You are responsible for any damage beyond fair wear and tear, subject to the platform and owner terms.'

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function getIconComponent(icon: 'shield' | 'alert' | 'info') {
  switch (icon) {
    case 'shield':
      return Shield
    case 'alert':
      return AlertTriangle
    case 'info':
    default:
      return Info
  }
}

function getColorClasses(color: 'green' | 'blue' | 'amber') {
  switch (color) {
    case 'green':
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: 'text-green-600',
        badge: 'bg-green-100 text-green-800',
      }
    case 'blue':
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: 'text-blue-600',
        badge: 'bg-blue-100 text-blue-800',
      }
    case 'amber':
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        icon: 'text-amber-600',
        badge: 'bg-amber-100 text-amber-800',
      }
  }
}

// ============================================
// COMPONENT
// ============================================

export function InsuranceSummaryCard({
  listing,
  policyVersion = 1,
  variant = 'default',
  showPolicyLink = true,
  className = '',
}: InsuranceSummaryCardProps) {
  const config = INSURANCE_MODE_CONFIG[listing.insuranceMode]
  const colors = getColorClasses(config.color)
  const IconComponent = getIconComponent(config.icon)

  // Compact variant - minimal display
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-3 p-3 rounded-lg ${colors.bg} ${colors.border} border ${className}`}>
        <IconComponent className={`w-5 h-5 ${colors.icon} flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-gray-900">{config.label}</span>
          {listing.bondAmount && listing.bondAmount > 0 && (
            <span className="text-sm text-gray-600 ml-2">
              · Bond: {formatCurrency(listing.bondAmount)}
            </span>
          )}
        </div>
        {showPolicyLink && (
          <Link 
            href="/policy/insurance-damage" 
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <span>v{policyVersion}</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </div>
    )
  }

  // Detailed variant - full information
  if (variant === 'detailed') {
    return (
      <div className={`rounded-lg ${colors.bg} ${colors.border} border overflow-hidden ${className}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200/50">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${colors.badge}`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{config.label}</h3>
              <p className="text-sm text-gray-600 mt-0.5">{config.description}</p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="p-4 space-y-3">
          {/* Bond Amount */}
          {listing.bondAmount && listing.bondAmount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Security Bond</span>
              <span className="font-semibold text-gray-900">{formatCurrency(listing.bondAmount)}</span>
            </div>
          )}

          {/* Insurance Notes */}
          {listing.insuranceNotes && (
            <div className="pt-2 border-t border-gray-200/50">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Coverage Notes:</span> {listing.insuranceNotes}
              </p>
            </div>
          )}

          {/* Damage Excess Notes */}
          {listing.damageExcessNotes && (
            <div className="pt-2 border-t border-gray-200/50">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Excess/Deductible:</span> {listing.damageExcessNotes}
              </p>
            </div>
          )}

          {/* Damage Responsibility */}
          <div className="pt-2 border-t border-gray-200/50">
            <p className="text-sm text-gray-700 italic">
              {DAMAGE_RESPONSIBILITY_MESSAGE}
            </p>
          </div>
        </div>

        {/* Footer with Policy Link */}
        {showPolicyLink && (
          <div className="px-4 py-3 bg-white/50 border-t border-gray-200/50">
            <Link 
              href="/policy/insurance-damage" 
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1.5"
            >
              <span>Full details: Insurance & Damage Policy (v{policyVersion})</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    )
  }

  // Default variant - balanced display
  return (
    <div className={`rounded-lg ${colors.bg} ${colors.border} border p-4 ${className}`}>
      {/* Header Row */}
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${colors.badge}`}>
          <IconComponent className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">{config.label}</h3>
            {listing.bondAmount && listing.bondAmount > 0 && (
              <span className={`text-sm font-medium px-2 py-0.5 rounded ${colors.badge}`}>
                Bond: {formatCurrency(listing.bondAmount)}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">{config.description}</p>
        </div>
      </div>

      {/* Insurance Notes (if provided) */}
      {listing.insuranceNotes && (
        <p className="text-sm text-gray-600 mt-3 pl-11">
          <span className="font-medium">Note:</span> {listing.insuranceNotes}
        </p>
      )}

      {/* Damage Responsibility Line */}
      <p className="text-sm text-gray-700 mt-3 pl-11 italic">
        {DAMAGE_RESPONSIBILITY_MESSAGE}
      </p>

      {/* Policy Link */}
      {showPolicyLink && (
        <div className="mt-3 pl-11">
          <Link 
            href="/policy/insurance-damage" 
            className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1"
          >
            <span>Full details: Insurance & Damage Policy (v{policyVersion})</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  )
}

// ============================================
// SKELETON LOADER
// ============================================

export function InsuranceSummaryCardSkeleton({ variant = 'default' }: { variant?: 'default' | 'compact' | 'detailed' }) {
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-100 border border-gray-200 animate-pulse">
        <div className="w-5 h-5 bg-gray-300 rounded" />
        <div className="flex-1">
          <div className="h-4 bg-gray-300 rounded w-32" />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-gray-100 border border-gray-200 p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 bg-gray-300 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-gray-300 rounded w-40" />
          <div className="h-4 bg-gray-300 rounded w-full" />
        </div>
      </div>
      <div className="mt-3 pl-11 space-y-2">
        <div className="h-4 bg-gray-300 rounded w-3/4" />
        <div className="h-4 bg-gray-300 rounded w-1/2" />
      </div>
    </div>
  )
}

// ============================================
// EXPORTS
// ============================================

export default InsuranceSummaryCard
