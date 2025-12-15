'use client'

import { useState, useCallback } from 'react'
import { InsuranceSummaryCard, type InsuranceSummaryListing } from '@/components/insurance'
import { BookingAcknowledgements, type AcknowledgementState } from './BookingAcknowledgements'
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'

// ============================================
// TYPES
// ============================================

export interface BookingConfirmationPanelProps {
  listing: InsuranceSummaryListing & {
    id: string
    title: string
  }
  policyVersion: number
  onConfirm: (acknowledgements: AcknowledgementState) => Promise<void>
  isSubmitting?: boolean
  className?: string
}

// ============================================
// MAIN COMPONENT
// ============================================

export function BookingConfirmationPanel({
  listing,
  policyVersion,
  onConfirm,
  isSubmitting = false,
  className = '',
}: BookingConfirmationPanelProps) {
  const [acknowledgements, setAcknowledgements] = useState<AcknowledgementState>({
    acceptPlatformPolicy: false,
    acceptOwnerTerms: false,
    acceptDamageResponsibility: false,
    confirmCompetency: false,
    confirmRenterInsurance: false,
    acceptHighRiskRequirements: false,
  })
  const [error, setError] = useState<string | null>(null)

  const isValid = 
    acknowledgements.acceptPlatformPolicy && 
    acknowledgements.acceptOwnerTerms && 
    acknowledgements.acceptDamageResponsibility

  const handleConfirm = useCallback(async () => {
    if (!isValid) return
    
    setError(null)
    try {
      await onConfirm(acknowledgements)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm booking')
    }
  }, [isValid, acknowledgements, onConfirm])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Insurance Summary */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Insurance & Damage Terms
        </h3>
        <InsuranceSummaryCard
          listing={listing}
          policyVersion={policyVersion}
          variant="detailed"
          showPolicyLink={true}
        />
      </div>

      {/* Acknowledgements */}
      <div className="pt-4 border-t">
        <BookingAcknowledgements
          listing={listing}
          policyVersion={policyVersion}
          onChange={setAcknowledgements}
          disabled={isSubmitting}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Confirm Button */}
      <div className="pt-4">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!isValid || isSubmitting}
          className={`
            w-full py-3 px-4 rounded-lg font-medium text-white
            flex items-center justify-center gap-2
            transition-all duration-200
            ${isValid && !isSubmitting
              ? 'bg-green-600 hover:bg-green-700 shadow-sm hover:shadow'
              : 'bg-gray-300 cursor-not-allowed'
            }
          `}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : isValid ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Confirm Booking
            </>
          ) : (
            'Accept all terms to continue'
          )}
        </button>

        {/* Helper text */}
        <p className="text-xs text-gray-500 text-center mt-2">
          By confirming, you agree to the platform and listing terms above.
        </p>
      </div>
    </div>
  )
}

// ============================================
// SKELETON LOADER
// ============================================

export function BookingConfirmationPanelSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Insurance Summary Skeleton */}
      <div>
        <div className="h-6 bg-gray-200 rounded w-48 mb-3"></div>
        <div className="rounded-lg bg-gray-100 border border-gray-200 p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-gray-300 rounded-lg"></div>
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-gray-300 rounded w-40"></div>
              <div className="h-4 bg-gray-300 rounded w-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Acknowledgements Skeleton */}
      <div className="pt-4 border-t space-y-3">
        <div className="h-5 bg-gray-200 rounded w-40"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-3 rounded-lg border border-gray-200">
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 bg-gray-300 rounded mt-0.5"></div>
              <div className="flex-1 h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Button Skeleton */}
      <div className="pt-4">
        <div className="h-12 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  )
}

// ============================================
// EXPORTS
// ============================================

export default BookingConfirmationPanel
