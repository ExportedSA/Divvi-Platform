import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

// GET /api/listings - Get all listings (public, filtered)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const country = searchParams.get('country')
    const region = searchParams.get('region')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const sort = searchParams.get('sort') || 'newest'

    const where: any = {
      status: 'LIVE',
      isDeleted: false,
      isHidden: false,
    }

    // Search by keyword (title, description, brand, model)
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (category) where.category = category
    if (country) where.country = country
    if (region) where.region = region
    if (minPrice) where.pricePerDay = { ...where.pricePerDay, gte: new Decimal(minPrice) }
    if (maxPrice) where.pricePerDay = { ...where.pricePerDay, lte: new Decimal(maxPrice) }

    // Sorting options
    let orderBy: any = { createdAt: 'desc' } // default: newest
    if (sort === 'price_asc') orderBy = { pricePerDay: 'asc' }
    if (sort === 'price_desc') orderBy = { pricePerDay: 'desc' }

    const listings = await prisma.listing.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        brand: true,
        model: true,
        year: true,
        country: true,
        region: true,
        pricePerDay: true,
        pricePerWeek: true,
        currency: true,
        averageRating: true,
        owner: {
          select: {
            firstName: true,
            lastName: true,
            farmName: true,
          }
        },
        photos: {
          where: { isPrimary: true },
          take: 1,
          select: { url: true }
        }
      },
      orderBy,
      take: 50,
    })

    return NextResponse.json({ listings })
  } catch (error) {
    console.error('Get listings error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    )
  }
}

// POST /api/listings - Create a new listing (owner only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Check user is an owner
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (!user || (user.role !== 'OWNER' && user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Only owners can create listings' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      title,
      description,
      category,
      brand,
      model,
      year,
      country,
      region,
      localArea,
      pricePerDay,
      pricePerWeek,
      currency,
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

    // Validate required fields
    if (!title || !description || !category || !country || !region || !pricePerDay || !currency || !insuranceMode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const listing = await prisma.listing.create({
      data: {
        ownerId: userId,
        title,
        description,
        category,
        brand: brand || null,
        model: model || null,
        year: year ? parseInt(year) : null,
        country,
        region,
        localArea: localArea || null,
        pricePerDay: new Decimal(pricePerDay),
        pricePerWeek: pricePerWeek ? new Decimal(pricePerWeek) : null,
        currency,
        minimumRentalDays: minimumRentalDays ? parseInt(minimumRentalDays) : null,
        bondAmount: bondAmount ? new Decimal(bondAmount) : null,
        insuranceMode,
        insuranceNotes: insuranceNotes || null,
        safetyNotes: safetyNotes || null,
        deliveryMode: deliveryMode || 'PICKUP_ONLY',
        deliveryFlatFee: deliveryFlatFee ? new Decimal(deliveryFlatFee) : null,
        deliveryRadiusKm: deliveryRadiusKm ? parseInt(deliveryRadiusKm) : null,
        pickupAddress: pickupAddress || null,
        enginePowerHP: enginePowerHP ? parseInt(enginePowerHP) : null,
        workingWidthM: workingWidthM ? parseFloat(workingWidthM) : null,
        operatingWeightKg: operatingWeightKg ? parseInt(operatingWeightKg) : null,
        status: 'DRAFT',
      },
      select: {
        id: true,
        title: true,
        status: true,
      }
    })

    return NextResponse.json({
      success: true,
      listing
    })
  } catch (error) {
    console.error('Create listing error:', error)
    return NextResponse.json(
      { error: 'Failed to create listing' },
      { status: 500 }
    )
  }
}
