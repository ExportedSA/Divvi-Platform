'use client'

/**
 * PWA Install Prompt Component
 * Shows a native-feeling install prompt for the PWA
 */

import { useState, useEffect } from 'react'
import { X, Download, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    setIsStandalone(standalone)

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Show prompt after a delay (don't interrupt immediately)
      const dismissed = localStorage.getItem('pwa-prompt-dismissed')
      const lastDismissed = dismissed ? new Date(dismissed) : null
      const daysSinceDismissed = lastDismissed 
        ? (Date.now() - lastDismissed.getTime()) / (1000 * 60 * 60 * 24)
        : Infinity

      // Show if never dismissed or dismissed more than 7 days ago
      if (daysSinceDismissed > 7) {
        setTimeout(() => setShowPrompt(true), 3000)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // Show iOS prompt if not installed
    if (iOS && !standalone) {
      const dismissed = localStorage.getItem('pwa-ios-prompt-dismissed')
      const lastDismissed = dismissed ? new Date(dismissed) : null
      const daysSinceDismissed = lastDismissed 
        ? (Date.now() - lastDismissed.getTime()) / (1000 * 60 * 60 * 24)
        : Infinity

      if (daysSinceDismissed > 7) {
        setTimeout(() => setShowPrompt(true), 3000)
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setShowPrompt(false)
    }

    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem(
      isIOS ? 'pwa-ios-prompt-dismissed' : 'pwa-prompt-dismissed',
      new Date().toISOString()
    )
  }

  // Don't show if already installed
  if (isStandalone || !showPrompt) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-white rounded-2xl shadow-xl border p-4">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-100 rounded-xl">
            <Smartphone className="h-8 w-8 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Install FarmGear</h3>
            <p className="text-sm text-gray-500 mt-1">
              {isIOS
                ? 'Add to your home screen for quick access and offline support.'
                : 'Install our app for a better experience with offline support.'}
            </p>
          </div>
        </div>

        {isIOS ? (
          <div className="mt-4 p-3 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-600">
              Tap <span className="inline-flex items-center mx-1">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L12 14M12 2L8 6M12 2L16 6M4 14V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </span> then <strong>"Add to Home Screen"</strong>
            </p>
          </div>
        ) : (
          <div className="mt-4 flex gap-3">
            <Button
              variant="outline"
              onClick={handleDismiss}
              className="flex-1"
            >
              Not Now
            </Button>
            <Button
              onClick={handleInstall}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Install
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
