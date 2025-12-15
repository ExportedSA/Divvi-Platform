import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

// GET /api/listings/[id] - Get a single listing
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            farmName: true,
            region: true,
            country: true,
          }
        },
        photos: {
          orderBy: { position: 'asc' }
        }
      }
    })

    if (!listing || listing.isDeleted) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    return NextResponse.json({ listing })
  } catch (error) {
    console.error('Get listing error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch listing' },
      { status: 500 }
    )
  }
}

// PUT /api/listings/[id] - Update a listing (owner only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Check ownership
    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
      select: { ownerId: true, status: true }
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    if (listing.ownerId !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      description,
      category,
      brand,
      model,
      year,
      region,
      localArea,
      pricePerDay,
      pricePerWeek,
      minimumRentalDays,
      bondAmount,
      insuranceMode,
      insuranceNotes,
      safetyNotes,
      deliveryMode,
      deliveryFlatFee,
      deliveryRadiusKm,
      pickupAddress,
      enginePowerHP,
      workingWidthM,
      operatingWeightKg,
    } = body

    const updateData: any = {}

    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (category !== undefined) updateData.category = category
    if (brand !== undefined) updateData.brand = brand || null
    if (model !== undefined) updateData.model = model || null
    if (year !== undefined) updateData.year = year ? parseInt(year) : null
    if (region !== undefined) updateData.region = region
    if (localArea !== undefined) updateData.localArea = localArea || null
    if (pricePerDay !== undefined) updateData.pricePerDay = new Decimal(pricePerDay)
    if (pricePerWeek !== undefined) updateData.pricePerWeek = pricePerWeek ? new Decimal(pricePerWeek) : null
    if (minimumRentalDays !== undefined) updateData.minimumRentalDays = minimumRentalDays ? parseInt(minimumRentalDays) : null
    if (bondAmount !== undefined) updateData.bondAmount = bondAmount ? new Decimal(bondAmount) : null
    if (insuranceMode !== undefined) updateData.insuranceMode = insuranceMode
    if (insuranceNotes !== undefined) updateData.insuranceNotes = insuranceNotes || null
    if (safetyNotes !== undefined) updateData.safetyNotes = safetyNotes || null
    if (deliveryMode !== undefined) updateData.deliveryMode = deliveryMode
    if (deliveryFlatFee !== undefined) updateData.deliveryFlatFee = deliveryFlatFee ? new Decimal(deliveryFlatFee) : null
    if (deliveryRadiusKm !== undefined) updateData.deliveryRadiusKm = deliveryRadiusKm ? parseInt(deliveryRadiusKm) : null
    if (pickupAddress !== undefined) updateData.pickupAddress = pickupAddress || null
    if (enginePowerHP !== undefined) updateData.enginePowerHP = enginePowerHP ? parseInt(enginePowerHP) : null
    if (workingWidthM !== undefined) updateData.workingWidthM = workingWidthM ? parseFloat(workingWidthM) : null
    if (operatingWeightKg !== undefined) updateData.operatingWeightKg = operatingWeightKg ? parseInt(operatingWeightKg) : null

    const updatedListing = await prisma.listing.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        title: true,
        status: true,
      }
    })

    return NextResponse.json({
      success: true,
      listing: updatedListing
    })
  } catch (error) {
    console.error('Update listing error:', error)
    return NextResponse.json(
      { error: 'Failed to update listing' },
      { status: 500 }
    )
  }
}

// DELETE /api/listings/[id] - Soft delete a listing (owner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Check ownership
    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
      select: { ownerId: true }
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    if (listing.ownerId !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Soft delete
    await prisma.listing.update({
      where: { id: params.id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedById: userId,
        status: 'PAUSED',
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Listing deleted'
    })
  } catch (error) {
    console.error('Delete listing error:', error)
    return NextResponse.json(
      { error: 'Failed to delete listing' },
      { status: 500 }
    )
  }
}
