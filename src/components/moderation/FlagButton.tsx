'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Flag, X, AlertTriangle, Check } from 'lucide-react'

interface FlagButtonProps {
  contentType: 'LISTING' | 'REVIEW' | 'MESSAGE' | 'USER' | 'PHOTO'
  contentId: string
  variant?: 'icon' | 'text' | 'full'
  className?: string
}

const FLAG_REASONS = [
  { value: 'INAPPROPRIATE', label: 'Inappropriate content', description: 'Offensive, vulgar, or inappropriate' },
  { value: 'MISLEADING', label: 'Misleading information', description: 'False or deceptive claims' },
  { value: 'UNSAFE', label: 'Safety concern', description: 'Equipment safety issue' },
  { value: 'SPAM', label: 'Spam', description: 'Promotional or spam content' },
  { value: 'SCAM', label: 'Suspected scam', description: 'Potential fraud or scam' },
  { value: 'DUPLICATE', label: 'Duplicate listing', description: 'Same equipment listed multiple times' },
  { value: 'WRONG_CATEGORY', label: 'Wrong category', description: 'Listed in incorrect category' },
  { value: 'FAKE_REVIEW', label: 'Fake review', description: 'Suspected fake or paid review' },
  { value: 'HARASSMENT', label: 'Harassment', description: 'Harassment or threatening behavior' },
  { value: 'OTHER', label: 'Other', description: 'Other issue not listed' },
]

export function FlagButton({
  contentType,
  contentId,
  variant = 'icon',
  className = '',
}: FlagButtonProps) {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedReason, setSelectedReason] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!selectedReason) {
      setError('Please select a reason')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType,
          contentId,
          reason: selectedReason,
          description: description || undefined,
        }),
      })

      if (res.ok) {
        setSubmitted(true)
        setTimeout(() => {
          setIsOpen(false)
          setSubmitted(false)
          setSelectedReason('')
          setDescription('')
        }, 2000)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to submit flag')
      }
    } catch (err) {
      setError('Failed to submit flag')
    } finally {
      setSubmitting(false)
    }
  }

  if (!session) {
    return null // Don't show flag button to non-logged in users
  }

  return (
    <>
      {/* Flag Button */}
      {variant === 'icon' && (
        <button
          onClick={() => setIsOpen(true)}
          className={`p-2 text-gray-400 hover:text-red-500 transition-colors ${className}`}
          title="Report this content"
        >
          <Flag className="h-4 w-4" />
        </button>
      )}

      {variant === 'text' && (
        <button
          onClick={() => setIsOpen(true)}
          className={`text-sm text-gray-500 hover:text-red-500 flex items-center gap-1 ${className}`}
        >
          <Flag className="h-3 w-3" />
          Report
        </button>
      )}

      {variant === 'full' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(true)}
          className={`text-gray-500 hover:text-red-500 ${className}`}
        >
          <Flag className="h-4 w-4 mr-1" />
          Report Content
        </Button>
      )}

      {/* Flag Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <h3 className="font-semibold">Report Content</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              {submitted ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="h-6 w-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Report Submitted
                  </h4>
                  <p className="text-sm text-gray-500">
                    Thank you for helping keep our platform safe. Our team will review this content.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-4">
                    Help us understand what's wrong with this content. Your report will be reviewed by our moderation team.
                  </p>

                  {/* Reason Selection */}
                  <div className="space-y-2 mb-4">
                    <label className="block text-sm font-medium">
                      Why are you reporting this? <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2 max-h-48 overflow-auto">
                      {FLAG_REASONS.map((reason) => (
                        <label
                          key={reason.value}
                          className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedReason === reason.value
                              ? 'border-lendit-green bg-green-50'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="reason"
                            value={reason.value}
                            checked={selectedReason === reason.value}
                            onChange={(e) => setSelectedReason(e.target.value)}
                            className="mt-0.5"
                          />
                          <div>
                            <p className="font-medium text-sm">{reason.label}</p>
                            <p className="text-xs text-gray-500">{reason.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      Additional details (optional)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Provide any additional context..."
                      className="w-full p-2 border rounded-lg text-sm h-20 resize-none"
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-400 text-right">
                      {description.length}/500
                    </p>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting || !selectedReason}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                      {submitting ? 'Submitting...' : 'Submit Report'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
