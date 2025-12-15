import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Eye, Pause, Play } from 'lucide-react'

export const dynamic = 'force-dynamic'

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PENDING_REVIEW: 'bg-yellow-100 text-yellow-800',
  LIVE: 'bg-green-100 text-green-800',
  PAUSED: 'bg-orange-100 text-orange-800',
  REJECTED: 'bg-red-100 text-red-800',
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  PENDING_REVIEW: 'Pending Review',
  LIVE: 'Live',
  PAUSED: 'Paused',
  REJECTED: 'Rejected',
}

export default async function OwnerListingsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const userId = (session.user as any).id
  const userRole = (session.user as any).role

  // Check if user is an owner
  if (userRole !== 'OWNER' && userRole !== 'ADMIN') {
    redirect('/dashboard/become-owner')
  }

  const listings = await prisma.listing.findMany({
    where: {
      ownerId: userId,
      isDeleted: false,
    },
    select: {
      id: true,
      title: true,
      category: true,
      status: true,
      pricePerDay: true,
      currency: true,
      region: true,
      createdAt: true,
      photos: {
        where: { isPrimary: true },
        take: 1,
        select: { url: true }
      }
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Listings</h1>
          <p className="text-muted-foreground">Manage your equipment listings</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/listings/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Listing
          </Link>
        </Button>
      </div>

      {listings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              You haven&apos;t created any listings yet.
            </p>
            <Button asChild>
              <Link href="/dashboard/listings/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Listing
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {listings.map((listing) => (
            <Card key={listing.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                      {listing.photos[0]?.url ? (
                        <img 
                          src={listing.photos[0].url} 
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl">🚜</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{listing.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {listing.category} • {listing.region}
                      </p>
                      <p className="text-sm font-medium">
                        ${Number(listing.pricePerDay).toFixed(0)}/day
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Badge className={statusColors[listing.status]}>
                      {statusLabels[listing.status]}
                    </Badge>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/listings/${listing.id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      {listing.status === 'LIVE' && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/listings/${listing.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
