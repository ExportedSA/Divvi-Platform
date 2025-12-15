'use client'

import { Info } from 'lucide-react'
import { PLATFORM_FEE_DISPLAY, PLATFORM_FEE_DESCRIPTION } from '@/lib/fees'

interface PlatformFeeNoticeProps {
  variant?: 'inline' | 'card' | 'tooltip'
  className?: string
}

/**
 * Platform fee notice component for listing and booking pages
 */
export function PlatformFeeNotice({ variant = 'inline', className = '' }: PlatformFeeNoticeProps) {
  if (variant === 'card') {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">
              {PLATFORM_FEE_DESCRIPTION}: {PLATFORM_FEE_DISPLAY}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              This fee helps us maintain the platform and provide support services.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'tooltip') {
    return (
      <span className={`inline-flex items-center gap-1 text-gray-500 ${className}`}>
        <Info className="h-4 w-4" />
        <span className="text-xs">{PLATFORM_FEE_DISPLAY} service fee applies</span>
      </span>
    )
  }

  // Default inline variant
  return (
    <p className={`text-sm text-gray-500 flex items-center gap-1 ${className}`}>
      <Info className="h-4 w-4" />
      {PLATFORM_FEE_DESCRIPTION}: {PLATFORM_FEE_DISPLAY} applies at checkout.
    </p>
  )
}

export default PlatformFeeNotice
