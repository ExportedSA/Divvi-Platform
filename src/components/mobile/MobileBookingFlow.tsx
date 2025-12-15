'use client'

/**
 * Mobile-Optimized Booking Flow Component
 * Large touch targets, reduced friction, step-by-step wizard
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Check,
  MapPin,
  Truck,
  CreditCard,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react'

interface MobileBookingFlowProps {
  listing: {
    id: string
    title: string
    pricePerDay: number
    currency: string
    minDays?: number
    maxDays?: number
    location: string
    imageUrl?: string
  }
  onComplete?: (bookingId: string) => void
  onCancel?: () => void
}

type BookingStep = 'dates' | 'delivery' | 'review' | 'payment'

export function MobileBookingFlow({ listing, onComplete, onCancel }: MobileBookingFlowProps) {
  const router = useRouter()
  const [step, setStep] = useState<BookingStep>('dates')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Booking state
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [deliveryOption, setDeliveryOption] = useState<'pickup' | 'delivery'>('pickup')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [promoDiscount, setPromoDiscount] = useState(0)

  // Calculate rental details
  const rentalDays = startDate && endDate
    ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 0
  const subtotal = rentalDays * listing.pricePerDay
  const deliveryFee = deliveryOption === 'delivery' ? 150 : 0 // Simplified
  const total = subtotal + deliveryFee - promoDiscount

  const steps: { key: BookingStep; label: string; icon: React.ReactNode }[] = [
    { key: 'dates', label: 'Dates', icon: <Calendar className="h-5 w-5" /> },
    { key: 'delivery', label: 'Pickup', icon: <Truck className="h-5 w-5" /> },
    { key: 'review', label: 'Review', icon: <Check className="h-5 w-5" /> },
    { key: 'payment', label: 'Pay', icon: <CreditCard className="h-5 w-5" /> },
  ]

  const currentStepIndex = steps.findIndex(s => s.key === step)

  const canProceed = () => {
    switch (step) {
      case 'dates':
        return startDate && endDate && rentalDays >= (listing.minDays || 1)
      case 'delivery':
        return deliveryOption === 'pickup' || deliveryAddress.length > 10
      case 'review':
        return true
      case 'payment':
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (!canProceed()) return
    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex].key)
    }
  }

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setStep(steps[prevIndex].key)
    } else {
      onCancel?.()
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing.id,
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
          deliveryOption,
          deliveryAddress: deliveryOption === 'delivery' ? deliveryAddress : undefined,
          promoCode: promoCode || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create booking')
      }

      const data = await res.json()
      onComplete?.(data.booking.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 safe-area-top">
        <button
          onClick={handleBack}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200"
        >
          {currentStepIndex === 0 ? <X className="h-6 w-6" /> : <ChevronLeft className="h-6 w-6" />}
        </button>
        <div className="flex-1">
          <h1 className="font-semibold text-gray-900">Book Equipment</h1>
          <p className="text-sm text-gray-500 truncate">{listing.title}</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="px-4 py-3 bg-gray-50 border-b">
        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                  i < currentStepIndex
                    ? 'bg-green-500 text-white'
                    : i === currentStepIndex
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {i < currentStepIndex ? <Check className="h-5 w-5" /> : s.icon}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`w-8 h-1 mx-1 rounded ${
                    i < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Step: Dates */}
        {step === 'dates' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Select Dates</h2>
              <p className="text-gray-500">When do you need the equipment?</p>
            </div>

            {/* Date Picker - Large Touch Targets */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate?.toISOString().split('T')[0] || ''}
                  onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full h-14 px-4 text-lg border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={endDate?.toISOString().split('T')[0] || ''}
                  onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                  min={startDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]}
                  className="w-full h-14 px-4 text-lg border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            {/* Duration Summary */}
            {rentalDays > 0 && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-green-800">Rental Duration</span>
                    <span className="text-xl font-bold text-green-700">{rentalDays} days</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-green-700">Estimated Total</span>
                    <span className="text-lg font-semibold text-green-800">
                      ${subtotal.toLocaleString()} {listing.currency}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {listing.minDays && rentalDays > 0 && rentalDays < listing.minDays && (
              <p className="text-sm text-red-500 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Minimum rental is {listing.minDays} days
              </p>
            )}
          </div>
        )}

        {/* Step: Delivery */}
        {step === 'delivery' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Pickup or Delivery?</h2>
              <p className="text-gray-500">How would you like to receive the equipment?</p>
            </div>

            {/* Large Option Cards */}
            <div className="space-y-3">
              <button
                onClick={() => setDeliveryOption('pickup')}
                className={`w-full p-5 rounded-xl border-2 text-left transition-all ${
                  deliveryOption === 'pickup'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-full ${
                    deliveryOption === 'pickup' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">I'll Pick Up</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Collect from: {listing.location}
                    </p>
                    <p className="text-green-600 font-medium mt-2">Free</p>
                  </div>
                  {deliveryOption === 'pickup' && (
                    <Check className="h-6 w-6 text-green-500" />
                  )}
                </div>
              </button>

              <button
                onClick={() => setDeliveryOption('delivery')}
                className={`w-full p-5 rounded-xl border-2 text-left transition-all ${
                  deliveryOption === 'delivery'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-full ${
                    deliveryOption === 'delivery' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <Truck className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Deliver to Me</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Equipment delivered to your location
                    </p>
                    <p className="text-green-600 font-medium mt-2">From $150</p>
                  </div>
                  {deliveryOption === 'delivery' && (
                    <Check className="h-6 w-6 text-green-500" />
                  )}
                </div>
              </button>
            </div>

            {/* Delivery Address */}
            {deliveryOption === 'delivery' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Address
                </label>
                <textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Enter your full delivery address..."
                  className="w-full h-24 p-4 text-lg border rounded-xl resize-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            )}
          </div>
        )}

        {/* Step: Review */}
        {step === 'review' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Review Booking</h2>
              <p className="text-gray-500">Please confirm your booking details</p>
            </div>

            {/* Booking Summary */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                  {listing.imageUrl && (
                    <img
                      src={listing.imageUrl}
                      alt={listing.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">{listing.title}</h3>
                    <p className="text-sm text-gray-500">{listing.location}</p>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dates</span>
                    <span className="font-medium">
                      {startDate?.toLocaleDateString()} - {endDate?.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-medium">{rentalDays} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {deliveryOption === 'pickup' ? 'Pickup' : 'Delivery'}
                    </span>
                    <span className="font-medium">
                      {deliveryOption === 'pickup' ? listing.location : deliveryAddress}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      ${listing.pricePerDay}/day × {rentalDays} days
                    </span>
                    <span>${subtotal.toLocaleString()}</span>
                  </div>
                  {deliveryFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery Fee</span>
                      <span>${deliveryFee}</span>
                    </div>
                  )}
                  {promoDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Promo Discount</span>
                      <span>-${promoDiscount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total</span>
                    <span>${total.toLocaleString()} {listing.currency}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Promo Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Promo Code (optional)
              </label>
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Enter code"
                className="w-full h-12 px-4 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
        )}

        {/* Step: Payment */}
        {step === 'payment' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment</h2>
              <p className="text-gray-500">Complete your booking</p>
            </div>

            <Card className="bg-gray-50">
              <CardContent className="p-4 text-center">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">
                  You'll be redirected to our secure payment page to complete your booking.
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-4">
                  ${total.toLocaleString()} {listing.currency}
                </p>
              </CardContent>
            </Card>

            <p className="text-xs text-gray-500 text-center">
              By proceeding, you agree to our Terms of Service and Rental Agreement.
              A security bond may be required.
            </p>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="border-t bg-white px-4 py-4 safe-area-bottom">
        {step === 'payment' ? (
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5 mr-2" />
                Pay ${total.toLocaleString()}
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
          >
            Continue
            <ChevronRight className="h-5 w-5 ml-2" />
          </Button>
        )}
      </div>
    </div>
  )
}
