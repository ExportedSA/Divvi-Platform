import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { FileText, Package, Calendar, TrendingUp } from 'lucide-react'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const userId = (session.user as any).id

  // Fetch user stats
  const [listingsCount, bookingsAsRenter, bookingsAsOwner] = await Promise.all([
    prisma.listing.count({
      where: { ownerId: userId },
    }),
    prisma.booking.count({
      where: { renterId: userId },
    }),
    prisma.booking.count({
      where: { ownerId: userId },
    }),
  ])

  // Fetch recent bookings
  const recentBookings = await prisma.booking.findMany({
    where: {
      OR: [
        { renterId: userId },
        { ownerId: userId },
      ],
    },
    select: {
      id: true,
      createdAt: true,
      startDate: true,
      endDate: true,
      bookingStatus: true,
      renterId: true,
      listing: {
        select: {
          title: true,
        },
      },
      renter: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      owner: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 5,
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user.name || session.user.email}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Listings</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{listingsCount}</div>
            <p className="text-xs text-muted-foreground">
              Active machinery listings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Rentals</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookingsAsRenter}</div>
            <p className="text-xs text-muted-foreground">
              Bookings as renter
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incoming Bookings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookingsAsOwner}</div>
            <p className="text-xs text-muted-foreground">
              Bookings for my machinery
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage your listings and bookings</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button asChild>
            <Link href="/listings/new">
              <Package className="mr-2 h-4 w-4" />
              Create New Listing
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/listings">
              <FileText className="mr-2 h-4 w-4" />
              View My Listings
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/bookings">
              <Calendar className="mr-2 h-4 w-4" />
              View My Bookings
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/browse">
              Browse Machinery
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
          <CardDescription>Your latest rental activity</CardDescription>
        </CardHeader>
        <CardContent>
          {recentBookings.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No bookings yet. Start by browsing machinery or creating a listing.
            </p>
          ) : (
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{booking.listing.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.renterId === userId
                        ? `Renting from ${booking.owner.firstName} ${booking.owner.lastName}`
                        : `Rented by ${booking.renter.firstName} ${booking.renter.lastName}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(booking.startDate).toLocaleDateString()} -{' '}
                      {new Date(booking.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary">
                      {booking.bookingStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
