'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Tractor, DollarSign, Shield } from 'lucide-react'

export default function BecomeOwnerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleUpgrade = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/user/upgrade-to-owner', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to upgrade')
        return
      }

      setSuccess(true)
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 2000)
    } catch (err) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">
              Welcome, Equipment Owner!
            </h2>
            <p className="text-green-700">
              You can now list your machinery for rent. Redirecting to dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Become an Equipment Owner</CardTitle>
          <CardDescription className="text-lg">
            Start earning by renting out your farm machinery
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Benefits */}
          <div className="grid gap-4">
            <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
              <DollarSign className="h-8 w-8 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-semibold">Earn Extra Income</h3>
                <p className="text-sm text-muted-foreground">
                  Turn idle equipment into a revenue stream. Set your own prices and availability.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
              <Tractor className="h-8 w-8 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-semibold">List Any Equipment</h3>
                <p className="text-sm text-muted-foreground">
                  Tractors, harvesters, implements, and more. If it helps on the farm, you can list it.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
              <Shield className="h-8 w-8 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-semibold">Protected Rentals</h3>
                <p className="text-sm text-muted-foreground">
                  Bond collection, damage policies, and renter verification keep your equipment safe.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg text-center">
              {error}
            </div>
          )}

          <Button 
            onClick={handleUpgrade} 
            disabled={loading}
            className="w-full text-lg py-6"
            size="lg"
          >
            {loading ? 'Upgrading...' : 'Become an Owner'}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By becoming an owner, you agree to our owner responsibilities and listing policies.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
