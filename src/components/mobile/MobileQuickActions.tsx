'use client'

/**
 * Mobile Quick Actions Component
 * One-tap access to common actions with large touch targets
 */

import Link from 'next/link'
import {
  Calendar,
  MessageSquare,
  Camera,
  MapPin,
  Phone,
  Navigation,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Truck,
} from 'lucide-react'

interface QuickAction {
  icon: React.ReactNode
  label: string
  href?: string
  onClick?: () => void
  color: string
  bgColor: string
  badge?: number
}

interface MobileQuickActionsProps {
  actions: QuickAction[]
  columns?: 2 | 3 | 4
}

export function MobileQuickActions({ actions, columns = 4 }: MobileQuickActionsProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  }

  return (
    <div className={`grid ${gridCols[columns]} gap-3`}>
      {actions.map((action, index) => {
        const content = (
          <div className="flex flex-col items-center">
            <div
              className={`relative w-14 h-14 rounded-2xl flex items-center justify-center ${action.bgColor}`}
            >
              <span className={action.color}>{action.icon}</span>
              {action.badge !== undefined && action.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {action.badge > 9 ? '9+' : action.badge}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-600 mt-2 text-center">{action.label}</span>
          </div>
        )

        if (action.href) {
          return (
            <Link
              key={index}
              href={action.href}
              className="p-2 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
            >
              {content}
            </Link>
          )
        }

        return (
          <button
            key={index}
            onClick={action.onClick}
            className="p-2 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
          >
            {content}
          </button>
        )
      })}
    </div>
  )
}

// Pre-built action sets for common use cases

export function OwnerQuickActions({ unreadMessages = 0 }: { unreadMessages?: number }) {
  const actions: QuickAction[] = [
    {
      icon: <Calendar className="h-6 w-6" />,
      label: "Today",
      href: '/field/today',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      icon: <Truck className="h-6 w-6" />,
      label: 'Bookings',
      href: '/dashboard/bookings',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      label: 'Messages',
      href: '/dashboard/messages',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      badge: unreadMessages,
    },
    {
      icon: <FileText className="h-6 w-6" />,
      label: 'Listings',
      href: '/dashboard/listings',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ]

  return <MobileQuickActions actions={actions} />
}

export function RenterQuickActions({ unreadMessages = 0 }: { unreadMessages?: number }) {
  const actions: QuickAction[] = [
    {
      icon: <Truck className="h-6 w-6" />,
      label: 'My Rentals',
      href: '/dashboard/rentals',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      label: 'Messages',
      href: '/dashboard/messages',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      badge: unreadMessages,
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      label: 'Schedule',
      href: '/field/today',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      icon: <MapPin className="h-6 w-6" />,
      label: 'Search',
      href: '/search',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ]

  return <MobileQuickActions actions={actions} />
}

// Booking-specific quick actions
interface BookingQuickActionsProps {
  bookingId: string
  type: 'pickup' | 'return'
  phone?: string
  address: string
  lat?: number
  lng?: number
  checklistCompleted?: boolean
}

export function BookingQuickActions({
  bookingId,
  type,
  phone,
  address,
  lat,
  lng,
  checklistCompleted,
}: BookingQuickActionsProps) {
  const openMaps = () => {
    let url: string
    if (lat && lng) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    } else {
      url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
    }
    window.open(url, '_blank')
  }

  const callPhone = () => {
    if (phone) {
      window.location.href = `tel:${phone}`
    }
  }

  const actions: QuickAction[] = [
    {
      icon: <Navigation className="h-6 w-6" />,
      label: 'Navigate',
      onClick: openMaps,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
  ]

  if (phone) {
    actions.push({
      icon: <Phone className="h-6 w-6" />,
      label: 'Call',
      onClick: callPhone,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    })
  }

  actions.push({
    icon: <MessageSquare className="h-6 w-6" />,
    label: 'Message',
    href: `/dashboard/messages?booking=${bookingId}`,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  })

  actions.push({
    icon: checklistCompleted ? <CheckCircle className="h-6 w-6" /> : <Camera className="h-6 w-6" />,
    label: checklistCompleted ? 'Done' : 'Checklist',
    href: `/field/checklist/${bookingId}?type=${type}`,
    color: checklistCompleted ? 'text-green-600' : 'text-orange-600',
    bgColor: checklistCompleted ? 'bg-green-100' : 'bg-orange-100',
  })

  return <MobileQuickActions actions={actions} columns={phone ? 4 : 3} />
}
