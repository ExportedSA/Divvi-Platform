'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ExternalLink, X, AlertTriangle, CheckCircle2, Info } from 'lucide-react'

// ============================================
// TYPES
// ============================================

export interface ListingInsuranceTerms {
  insuranceMode: 'OWNER_PROVIDED' | 'RENTER_PROVIDED' | 'NONE'
  insuranceNotes?: string | null
  damageExcessNotes?: string | null
  bondAmount?: number | null
  isHighRiskAsset?: boolean
}

export interface AcknowledgementState {
  acceptPlatformPolicy: boolean
  acceptOwnerTerms: boolean
  acceptDamageResponsibility: boolean
  confirmCompetency: boolean
  confirmRenterInsurance: boolean
  acceptHighRiskRequirements: boolean
}

export interface BookingAcknowledgementsProps {
  listing: ListingInsuranceTerms
  policyVersion: number
  onChange: (state: AcknowledgementState) => void
  initialState?: Partial<AcknowledgementState>
  disabled?: boolean
  className?: string
}

// ============================================
// CONSTANTS
// ============================================

const INSURANCE_MODE_LABELS: Record<string, string> = {
  OWNER_PROVIDED: 'Owner-Provided Insurance',
  RENTER_PROVIDED: 'Renter-Provided Insurance',
  NONE: 'No Insurance Provided',
}

// ============================================
// MODAL COMPONENT
// ============================================

interface TermsModalProps {
  isOpen: boolean
  onClose: () => void
  listing: ListingInsuranceTerms
}

function TermsModal({ isOpen, onClose, listing }: TermsModalProps) {
  if (!isOpen) return null

  const hasNotes = listing.insuranceNotes || listing.damageExcessNotes

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              Listing Insurance & Damage Terms
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[60vh]">
            {/* Insurance Mode */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-1">Insurance Mode</h4>
              <p className="text-gray-900">
                {INSURANCE_MODE_LABELS[listing.insuranceMode] || listing.insuranceMode}
              </p>
            </div>

            {/* Bond Amount */}
            {listing.bondAmount && listing.bondAmount > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Security Bond</h4>
                <p className="text-gray-900">
                  {new Intl.NumberFormat('en-NZ', {
                    style: 'currency',
                    currency: 'NZD',
                  }).format(listing.bondAmount)}
                </p>
              </div>
            )}

            {/* Insurance Notes */}
            {listing.insuranceNotes && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Insurance Coverage Notes</h4>
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-md">
                  <p className="text-gray-800 text-sm whitespace-pre-wrap">
                    {listing.insuranceNotes}
                  </p>
                </div>
              </div>
            )}

            {/* Damage Excess Notes */}
            {listing.damageExcessNotes && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Damage Excess / Deductible</h4>
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-md">
                  <p className="text-gray-800 text-sm whitespace-pre-wrap">
                    {listing.damageExcessNotes}
                  </p>
                </div>
              </div>
            )}

            {/* No specific notes */}
            {!hasNotes && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-md text-center">
                <Info className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 text-sm">
                  The owner has not provided specific insurance or damage notes for this listing.
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Standard platform terms apply.
                </p>
              </div>
            )}

            {/* Warning for No Insurance */}
            {listing.insuranceMode === 'NONE' && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-800 font-medium text-sm">No Insurance Coverage</p>
                  <p className="text-amber-700 text-sm mt-1">
                    This listing has no insurance coverage. You bear full risk for any damage or loss during the rental period.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              I Understand
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// CHECKBOX COMPONENT
// ============================================

interface AcknowledgementCheckboxProps {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  children: React.ReactNode
  required?: boolean
}

function AcknowledgementCheckbox({
  id,
  checked,
  onChange,
  disabled,
  children,
  required = true,
}: AcknowledgementCheckboxProps) {
  return (
    <label
      htmlFor={id}
      className={`
        flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer
        ${checked 
          ? 'bg-green-50 border-green-200' 
          : 'bg-white border-gray-200 hover:border-gray-300'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <div className="flex-shrink-0 pt-0.5">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 focus:ring-offset-0"
          required={required}
        />
      </div>
      <div className="flex-1 text-sm">
        {children}
      </div>
      {checked && (
        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
      )}
    </label>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export function BookingAcknowledgements({
  listing,
  policyVersion,
  onChange,
  initialState = {},
  disabled = false,
  className = '',
}: BookingAcknowledgementsProps) {
  const [state, setState] = useState<AcknowledgementState>({
    acceptPlatformPolicy: initialState.acceptPlatformPolicy ?? false,
    acceptOwnerTerms: initialState.acceptOwnerTerms ?? false,
    acceptDamageResponsibility: initialState.acceptDamageResponsibility ?? false,
    confirmCompetency: initialState.confirmCompetency ?? false,
    confirmRenterInsurance: initialState.confirmRenterInsurance ?? false,
    acceptHighRiskRequirements: initialState.acceptHighRiskRequirements ?? false,
  })

  const [isModalOpen, setIsModalOpen] = useState(false)

  const updateState = useCallback((key: keyof AcknowledgementState, value: boolean) => {
    const newState = { ...state, [key]: value }
    setState(newState)
    onChange(newState)
  }, [state, onChange])

  // Determine which checkboxes are required
  const requiresRenterInsurance = listing.insuranceMode === 'RENTER_PROVIDED'
  const requiresHighRiskAcknowledgement = listing.isHighRiskAsset === true
  
  const allAccepted = 
    state.acceptPlatformPolicy && 
    state.acceptOwnerTerms && 
    state.acceptDamageResponsibility &&
    state.confirmCompetency &&
    (!requiresRenterInsurance || state.confirmRenterInsurance) &&
    (!requiresHighRiskAcknowledgement || state.acceptHighRiskRequirements)

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Required Acknowledgements</h3>
        {allAccepted && (
          <span className="text-xs text-green-600 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            All accepted
          </span>
        )}
      </div>

      {/* Checkbox 1: Platform Policy */}
      <AcknowledgementCheckbox
        id="accept-platform-policy"
        checked={state.acceptPlatformPolicy}
        onChange={(checked) => updateState('acceptPlatformPolicy', checked)}
        disabled={disabled}
      >
        <span className="text-gray-700">
          I have read and accept the{' '}
          <Link
            href="/policy/insurance-damage"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            Insurance & Damage Policy
            <ExternalLink className="w-3 h-3" />
          </Link>
          {' '}(version {policyVersion}).
        </span>
      </AcknowledgementCheckbox>

      {/* Checkbox 2: Owner Terms */}
      <AcknowledgementCheckbox
        id="accept-owner-terms"
        checked={state.acceptOwnerTerms}
        onChange={(checked) => updateState('acceptOwnerTerms', checked)}
        disabled={disabled}
      >
        <span className="text-gray-700">
          I have read and accept this listing's specific{' '}
          <button
            type="button"
            className="text-blue-600 hover:text-blue-800 font-medium underline"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsModalOpen(true)
            }}
          >
            insurance and damage terms
          </button>
          .
        </span>
      </AcknowledgementCheckbox>

      {/* Checkbox 3: Damage Responsibility */}
      <AcknowledgementCheckbox
        id="accept-damage-responsibility"
        checked={state.acceptDamageResponsibility}
        onChange={(checked) => updateState('acceptDamageResponsibility', checked)}
        disabled={disabled}
      >
        <span className="text-gray-700">
          I understand I am responsible for any damage beyond fair wear and tear during my rental period.
        </span>
      </AcknowledgementCheckbox>

      {/* Checkbox 4: Competency Confirmation */}
      <AcknowledgementCheckbox
        id="confirm-competency"
        checked={state.confirmCompetency}
        onChange={(checked) => updateState('confirmCompetency', checked)}
        disabled={disabled}
      >
        <span className="text-gray-700">
          I confirm I am legally permitted and competent to operate this machinery.
        </span>
      </AcknowledgementCheckbox>

      {/* Checkbox 5: Renter Insurance Confirmation (conditional) */}
      {requiresRenterInsurance && (
        <AcknowledgementCheckbox
          id="confirm-renter-insurance"
          checked={state.confirmRenterInsurance}
          onChange={(checked) => updateState('confirmRenterInsurance', checked)}
          disabled={disabled}
        >
          <span className="text-gray-700">
            I confirm I have an active insurance policy suitable for this machinery and intended use.
          </span>
        </AcknowledgementCheckbox>
      )}

      {/* Checkbox 6: High-Risk Requirements (conditional) */}
      {requiresHighRiskAcknowledgement && (
        <AcknowledgementCheckbox
          id="accept-high-risk-requirements"
          checked={state.acceptHighRiskRequirements}
          onChange={(checked) => updateState('acceptHighRiskRequirements', checked)}
          disabled={disabled}
        >
          <span className="text-gray-700">
            I understand additional risk and safety requirements apply to this machinery.
          </span>
        </AcknowledgementCheckbox>
      )}

      {/* Validation Message */}
      {!allAccepted && (
        <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          You must accept all acknowledgements to proceed with booking.
        </p>
      )}

      {/* Terms Modal */}
      <TermsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        listing={listing}
      />
    </div>
  )
}

// ============================================
// HELPER HOOK
// ============================================

export function useBookingAcknowledgements(policyVersion: number) {
  const [acknowledgements, setAcknowledgements] = useState<AcknowledgementState>({
    acceptPlatformPolicy: false,
    acceptOwnerTerms: false,
    acceptDamageResponsibility: false,
    confirmCompetency: false,
    confirmRenterInsurance: false,
    acceptHighRiskRequirements: false,
  })

  const isValid = acknowledgements.acceptPlatformPolicy && 
                  acknowledgements.acceptOwnerTerms && 
                  acknowledgements.acceptDamageResponsibility &&
                  acknowledgements.confirmCompetency &&
                  acknowledgements.confirmRenterInsurance &&
                  acknowledgements.acceptHighRiskRequirements

  const getBookingPayload = () => ({
    acceptPlatformPolicy: acknowledgements.acceptPlatformPolicy,
    platformPolicyVersion: policyVersion,
    acceptOwnerTerms: acknowledgements.acceptOwnerTerms,
    acceptDamageResponsibility: acknowledgements.acceptDamageResponsibility,
    confirmCompetency: acknowledgements.confirmCompetency,
    confirmRenterInsurance: acknowledgements.confirmRenterInsurance,
    acceptHighRiskRequirements: acknowledgements.acceptHighRiskRequirements,
  })

  return {
    acknowledgements,
    setAcknowledgements,
    isValid,
    getBookingPayload,
  }
}

// ============================================
// EXPORTS
// ============================================

export default BookingAcknowledgements
