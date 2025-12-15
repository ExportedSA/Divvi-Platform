'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MapPin, Navigation, ExternalLink, Copy, Check } from 'lucide-react'

interface LocationMapProps {
  address: string
  lat?: number
  lng?: number
  label?: string
  className?: string
}

export function LocationMap({
  address,
  lat,
  lng,
  label = 'Location',
  className = '',
}: LocationMapProps) {
  const [copied, setCopied] = useState(false)

  const openGoogleMaps = () => {
    let url: string
    if (lat && lng) {
      url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    } else {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    }
    window.open(url, '_blank')
  }

  const openDirections = () => {
    let url: string
    if (lat && lng) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    } else {
      url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
    }
    window.open(url, '_blank')
  }

  const openAppleMaps = () => {
    let url: string
    if (lat && lng) {
      url = `https://maps.apple.com/?daddr=${lat},${lng}`
    } else {
      url = `https://maps.apple.com/?daddr=${encodeURIComponent(address)}`
    }
    window.open(url, '_blank')
  }

  const copyAddress = async () => {
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Generate static map preview URL (using OpenStreetMap tiles)
  const getStaticMapUrl = () => {
    if (lat && lng) {
      // Using OpenStreetMap static map service
      return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=14&size=400x200&markers=${lat},${lng},red`
    }
    return null
  }

  const staticMapUrl = getStaticMapUrl()

  return (
    <div className={`bg-white rounded-lg border overflow-hidden ${className}`}>
      {/* Map Preview */}
      {staticMapUrl ? (
        <div
          className="h-32 bg-gray-200 bg-cover bg-center cursor-pointer"
          style={{ backgroundImage: `url(${staticMapUrl})` }}
          onClick={openGoogleMaps}
        />
      ) : (
        <div
          className="h-32 bg-gray-100 flex items-center justify-center cursor-pointer"
          onClick={openGoogleMaps}
        >
          <div className="text-center text-gray-500">
            <MapPin className="h-8 w-8 mx-auto mb-1" />
            <p className="text-sm">View on map</p>
          </div>
        </div>
      )}

      {/* Address & Actions */}
      <div className="p-3">
        <div className="flex items-start gap-2 mb-3">
          <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-0.5">{label}</p>
            <p className="text-sm text-gray-900">{address}</p>
          </div>
          <button
            onClick={copyAddress}
            className="p-1.5 hover:bg-gray-100 rounded"
            title="Copy address"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4 text-gray-400" />
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={openDirections}
            className="w-full"
          >
            <Navigation className="h-4 w-4 mr-1" />
            Directions
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={openGoogleMaps}
            className="w-full"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Open Map
          </Button>
        </div>

        {/* Alternative Maps */}
        <div className="mt-2 flex justify-center">
          <button
            onClick={openAppleMaps}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Open in Apple Maps
          </button>
        </div>
      </div>
    </div>
  )
}

// Compact version for inline use
export function LocationLink({
  address,
  lat,
  lng,
}: {
  address: string
  lat?: number
  lng?: number
}) {
  const openDirections = () => {
    let url: string
    if (lat && lng) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    } else {
      url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
    }
    window.open(url, '_blank')
  }

  return (
    <button
      onClick={openDirections}
      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
    >
      <Navigation className="h-3.5 w-3.5" />
      Get Directions
    </button>
  )
}
