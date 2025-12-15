import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = (session.user as any).id

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if already an owner or admin
    if (user.role === 'OWNER' || user.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'User is already an owner or admin' },
        { status: 400 }
      )
    }

    // Upgrade user to OWNER role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: 'OWNER' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Successfully upgraded to owner',
      user: updatedUser
    })
  } catch (error) {
    console.error('Upgrade to owner error:', error)
    return NextResponse.json(
      { error: 'Failed to upgrade to owner' },
      { status: 500 }
    )
  }
}
