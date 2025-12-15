'use client'

/**
 * Mobile Bottom Navigation Component
 * Fixed bottom navigation with large touch targets
 */

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Home,
  Search,
  Calendar,
  MessageSquare,
  User,
  Truck,
  Plus,
} from 'lucide-react'

interface NavItem {
  icon: React.ReactNode
  activeIcon?: React.ReactNode
  label: string
  href: string
  badge?: number
}

interface MobileBottomNavProps {
  variant?: 'renter' | 'owner'
  unreadMessages?: number
}

export function MobileBottomNav({ variant = 'renter', unreadMessages = 0 }: MobileBottomNavProps) {
  const pathname = usePathname()

  const renterNav: NavItem[] = [
    {
      icon: <Home className="h-6 w-6" />,
      label: 'Home',
      href: '/',
    },
    {
      icon: <Search className="h-6 w-6" />,
      label: 'Search',
      href: '/search',
    },
    {
      icon: <Truck className="h-6 w-6" />,
      label: 'Rentals',
      href: '/dashboard/rentals',
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      label: 'Messages',
      href: '/dashboard/messages',
      badge: unreadMessages,
    },
    {
      icon: <User className="h-6 w-6" />,
      label: 'Account',
      href: '/dashboard',
    },
  ]

  const ownerNav: NavItem[] = [
    {
      icon: <Calendar className="h-6 w-6" />,
      label: 'Today',
      href: '/field/today',
    },
    {
      icon: <Truck className="h-6 w-6" />,
      label: 'Bookings',
      href: '/dashboard/bookings',
    },
    {
      icon: (
        <div className="relative">
          <div className="absolute inset-0 bg-green-500 rounded-full scale-110" />
          <Plus className="h-6 w-6 relative text-white" />
        </div>
      ),
      label: 'List',
      href: '/listings/new',
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      label: 'Messages',
      href: '/dashboard/messages',
      badge: unreadMessages,
    },
    {
      icon: <User className="h-6 w-6" />,
      label: 'Account',
      href: '/dashboard',
    },
  ]

  const navItems = variant === 'owner' ? ownerNav : renterNav

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full touch-manipulation transition-colors ${
                active ? 'text-green-600' : 'text-gray-500'
              }`}
            >
              <div className="relative">
                {item.icon}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 ${active ? 'font-medium' : ''}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

// Floating Action Button for mobile
interface MobileFABProps {
  icon?: React.ReactNode
  label?: string
  href?: string
  onClick?: () => void
}

export function MobileFAB({ icon, label, href, onClick }: MobileFABProps) {
  const content = (
    <div className="flex items-center gap-2 px-5 py-3 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 active:bg-green-800 transition-colors">
      {icon || <Plus className="h-5 w-5" />}
      {label && <span className="font-medium">{label}</span>}
    </div>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="fixed bottom-20 right-4 z-40 touch-manipulation"
      >
        {content}
      </Link>
    )
  }

  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 z-40 touch-manipulation"
    >
      {content}
    </button>
  )
}
