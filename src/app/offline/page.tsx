'use client'

import Link from 'next/link'
import { WifiOff, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
            <WifiOff className="h-10 w-10 text-gray-400" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          You're Offline
        </h1>
        <p className="text-gray-600 mb-6">
          It looks like you've lost your internet connection. Some features may be limited until you're back online.
        </p>

        <div className="space-y-3">
          <Button
            onClick={handleRetry}
            className="w-full bg-lendit-green hover:bg-lendit-green-600"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>

          <Link href="/field/today">
            <Button variant="outline" className="w-full">
              <Home className="h-4 w-4 mr-2" />
              View Cached Data
            </Button>
          </Link>
        </div>

        <div className="mt-8 p-4 bg-white rounded-lg text-left">
          <h2 className="font-semibold text-gray-900 mb-2">Available Offline:</h2>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• View cached bookings</li>
            <li>• View cached messages</li>
            <li>• Take photos for checklists</li>
            <li>• View today's activity</li>
          </ul>
          <p className="text-xs text-gray-500 mt-3">
            Changes will sync automatically when you're back online.
          </p>
        </div>
      </div>
    </div>
  )
}
