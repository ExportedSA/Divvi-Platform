import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'
import {
  validateCreateListing,
  validateOwnership,
  validatePricing,
  validateCurrencyCountryMatch,
} from '@/lib/listing/listing-validation'

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

    // ==========================================================================
    // STEP 1: Validate ownership and permissions
    // ==========================================================================
    const ownershipValidation = await validateOwnership(userId)
    if (!ownershipValidation.valid) {
      return NextResponse.json(
        { 
          error: ownershipValidation.errors[0]?.message || 'Permission denied',
          errors: ownershipValidation.errors,
        },
        { status: 403 }
      )
    }

    // ==========================================================================
    // STEP 2: Parse and validate input
    // ==========================================================================
    const body = await request.json()
    
    // Convert string numbers to actual numbers for validation
    const normalizedInput = {
      ...body,
      pricePerDay: body.pricePerDay ? Number(body.pricePerDay) : undefined,
      pricePerWeek: body.pricePerWeek ? Number(body.pricePerWeek) : undefined,
      year: body.year ? Number(body.year) : undefined,
      minimumRentalDays: body.minimumRentalDays ? Number(body.minimumRentalDays) : undefined,
      bondAmount: body.bondAmount !== undefined ? Number(body.bondAmount) : undefined,
      deliveryFlatFee: body.deliveryFlatFee ? Number(body.deliveryFlatFee) : undefined,
      deliveryRadiusKm: body.deliveryRadiusKm ? Number(body.deliveryRadiusKm) : undefined,
      enginePowerHP: body.enginePowerHP ? Number(body.enginePowerHP) : undefined,
      workingWidthM: body.workingWidthM ? Number(body.workingWidthM) : undefined,
      operatingWeightKg: body.operatingWeightKg ? Number(body.operatingWeightKg) : undefined,
      estimatedReplacementValue: body.estimatedReplacementValue ? Number(body.estimatedReplacementValue) : undefined,
    }

    // Validate listing fields
    const listingValidation = validateCreateListing(normalizedInput)
    if (!listingValidation.valid) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          errors: listingValidation.errors,
        },
        { status: 400 }
      )
    }

    // ==========================================================================
    // STEP 3: Validate pricing consistency
    // ==========================================================================
    if (normalizedInput.pricePerDay) {
      const pricingValidation = validatePricing(
        normalizedInput.pricePerDay,
        normalizedInput.pricePerWeek,
        normalizedInput.minimumRentalDays
      )
      if (!pricingValidation.valid) {
        return NextResponse.json(
          { 
            error: 'Pricing validation failed',
            errors: pricingValidation.errors,
          },
          { status: 400 }
        )
      }
    }

    // ==========================================================================
    // STEP 4: Validate currency matches country
    // ==========================================================================
    if (normalizedInput.country && normalizedInput.currency) {
      const currencyValidation = validateCurrencyCountryMatch(
        normalizedInput.country,
        normalizedInput.currency
      )
      // Currency mismatch is a warning, not an error - include in response
    }

    // ==========================================================================
    // STEP 5: Create the listing
    // ==========================================================================
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
      estimatedReplacementValue,
    } = normalizedInput

    const listing = await prisma.listing.create({
      data: {
        ownerId: userId,
        title,
        description,
        category,
        brand: brand || null,
        model: model || null,
        year: year || null,
        country,
        region,
        localArea: localArea || null,
        pricePerDay: new Decimal(pricePerDay),
        pricePerWeek: pricePerWeek ? new Decimal(pricePerWeek) : null,
        currency,
        minimumRentalDays: minimumRentalDays || null,
        bondAmount: bondAmount !== undefined ? new Decimal(bondAmount) : null,
        insuranceMode,
        insuranceNotes: insuranceNotes || null,
        safetyNotes: safetyNotes || null,
        deliveryMode: deliveryMode || 'PICKUP_ONLY',
        deliveryFlatFee: deliveryFlatFee ? new Decimal(deliveryFlatFee) : null,
        deliveryRadiusKm: deliveryRadiusKm || null,
        pickupAddress: pickupAddress || null,
        enginePowerHP: enginePowerHP || null,
        workingWidthM: workingWidthM || null,
        operatingWeightKg: operatingWeightKg || null,
        estimatedReplacementValue: estimatedReplacementValue ? new Decimal(estimatedReplacementValue) : null,
        status: 'DRAFT',
      },
      select: {
        id: true,
        title: true,
        status: true,
      }
    })

    // ==========================================================================
    // STEP 6: Return success with any warnings
    // ==========================================================================
    return NextResponse.json({
      success: true,
      listing,
      warnings: listingValidation.warnings,
    })
  } catch (error) {
    console.error('Create listing error:', error)
    return NextResponse.json(
      { error: 'Failed to create listing' },
      { status: 500 }
    )
  }
}
