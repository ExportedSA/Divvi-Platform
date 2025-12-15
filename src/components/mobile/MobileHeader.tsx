'use client'

/**
 * Mobile Header Component
 * Sticky header with back navigation and actions
 */

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, X, MoreVertical, Share, Bell } from 'lucide-react'

interface MobileHeaderProps {
  title: string
  subtitle?: string
  backHref?: string
  onBack?: () => void
  showClose?: boolean
  rightActions?: React.ReactNode
  transparent?: boolean
  className?: string
}

export function MobileHeader({
  title,
  subtitle,
  backHref,
  onBack,
  showClose,
  rightActions,
  transparent = false,
  className = '',
}: MobileHeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else if (backHref) {
      router.push(backHref)
    } else {
      router.back()
    }
  }

  return (
    <header
      className={`sticky top-0 z-40 safe-area-top ${
        transparent
          ? 'bg-transparent'
          : 'bg-white border-b'
      } ${className}`}
    >
      <div className="flex items-center h-14 px-2">
        {/* Back/Close Button */}
        <button
          onClick={handleBack}
          className="p-3 -ml-1 rounded-full hover:bg-black/5 active:bg-black/10 touch-manipulation"
          aria-label={showClose ? 'Close' : 'Go back'}
        >
          {showClose ? (
            <X className="h-6 w-6" />
          ) : (
            <ChevronLeft className="h-6 w-6" />
          )}
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0 px-2">
          <h1 className="font-semibold text-gray-900 truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs text-gray-500 truncate">{subtitle}</p>
          )}
        </div>

        {/* Right Actions */}
        {rightActions && (
          <div className="flex items-center">{rightActions}</div>
        )}
      </div>
    </header>
  )
}

// Pre-built header variants

interface ListingHeaderProps {
  title: string
  onShare?: () => void
  onBack?: () => void
}

export function ListingHeader({ title, onShare, onBack }: ListingHeaderProps) {
  return (
    <MobileHeader
      title={title}
      onBack={onBack}
      transparent
      rightActions={
        onShare && (
          <button
            onClick={onShare}
            className="p-3 rounded-full hover:bg-black/5 active:bg-black/10 touch-manipulation"
          >
            <Share className="h-5 w-5" />
          </button>
        )
      }
    />
  )
}

interface DashboardHeaderProps {
  title: string
  unreadNotifications?: number
}

export function DashboardHeader({ title, unreadNotifications = 0 }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b safe-area-top">
      <div className="flex items-center justify-between h-14 px-4">
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        <Link
          href="/notifications"
          className="relative p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
        >
          <Bell className="h-6 w-6 text-gray-600" />
          {unreadNotifications > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-medium">
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
          )}
        </Link>
      </div>
    </header>
  )
}

// Booking detail header with status
interface BookingHeaderProps {
  bookingId: string
  status: string
  onBack?: () => void
}

export function BookingHeader({ bookingId, status, onBack }: BookingHeaderProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_use':
      case 'active':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <MobileHeader
      title={`Booking #${bookingId.slice(-6).toUpperCase()}`}
      onBack={onBack}
      rightActions={
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
          {status.replace('_', ' ')}
        </span>
      }
    />
  )
}
