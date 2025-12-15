/**
 * Checklist Template & Handover Service
 * Business logic for managing checklist templates and handover processes
 */

import { prisma } from '@/lib/prisma'

// Types
export type ChecklistItemType = 'PHOTO_REQUIRED' | 'CHECKBOX' | 'NUMBER_INPUT' | 'TEXT_INPUT' | 'CONDITION_RATING'
export type HandoverType = 'PICKUP' | 'RETURN'

export interface ChecklistTemplateItem {
  label: string
  description?: string
  itemType: ChecklistItemType
  forPickup: boolean
  forReturn: boolean
  isRequired: boolean
  position: number
}

// Default checklist items for new listings
export const DEFAULT_CHECKLIST_ITEMS: ChecklistTemplateItem[] = [
  {
    label: 'Overall Equipment Condition',
    description: 'Take photos showing the overall condition of the equipment',
    itemType: 'PHOTO_REQUIRED',
    forPickup: true,
    forReturn: true,
    isRequired: true,
    position: 0,
  },
  {
    label: 'Engine Hours',
    description: 'Record the current engine hour meter reading',
    itemType: 'NUMBER_INPUT',
    forPickup: true,
    forReturn: true,
    isRequired: true,
    position: 1,
  },
  {
    label: 'Fuel Level (%)',
    description: 'Estimate the current fuel level as a percentage',
    itemType: 'NUMBER_INPUT',
    forPickup: true,
    forReturn: true,
    isRequired: true,
    position: 2,
  },
  {
    label: 'Visible Damage Check',
    description: 'Confirm you have inspected for any visible damage',
    itemType: 'CHECKBOX',
    forPickup: true,
    forReturn: true,
    isRequired: true,
    position: 3,
  },
  {
    label: 'Damage Photos (if any)',
    description: 'Take photos of any existing damage or issues',
    itemType: 'PHOTO_REQUIRED',
    forPickup: true,
    forReturn: true,
    isRequired: false,
    position: 4,
  },
  {
    label: 'Tyres/Tracks Condition',
    description: 'Rate the condition of tyres or tracks (1-5)',
    itemType: 'CONDITION_RATING',
    forPickup: true,
    forReturn: true,
    isRequired: false,
    position: 5,
  },
  {
    label: 'Lights & Indicators Working',
    description: 'Confirm all lights and indicators are functional',
    itemType: 'CHECKBOX',
    forPickup: true,
    forReturn: true,
    isRequired: false,
    position: 6,
  },
  {
    label: 'Additional Notes',
    description: 'Any other observations or notes',
    itemType: 'TEXT_INPUT',
    forPickup: true,
    forReturn: true,
    isRequired: false,
    position: 7,
  },
]

// ============================================
// CHECKLIST TEMPLATE MANAGEMENT
// ============================================

/**
 * Get checklist template for a listing
 */
export async function getChecklistTemplate(listingId: string) {
  const template = await prisma.checklistTemplate.findUnique({
    where: { listingId },
    include: {
      items: {
        orderBy: { position: 'asc' },
      },
    },
  })

  return template
}

/**
 * Create or update checklist template for a listing
 */
export async function upsertChecklistTemplate(
  listingId: string,
  ownerId: string,
  items: ChecklistTemplateItem[],
  name?: string
) {
  // Verify ownership
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { ownerId: true },
  })

  if (!listing) {
    throw new Error('Listing not found')
  }

  if (listing.ownerId !== ownerId) {
    throw new Error('Not authorized to modify this listing')
  }

  // Upsert template
  const template = await prisma.checklistTemplate.upsert({
    where: { listingId },
    create: {
      listingId,
      name: name || 'Default Checklist',
      isActive: true,
      items: {
        create: items.map((item, index) => ({
          ...item,
          position: item.position ?? index,
        })),
      },
    },
    update: {
      name: name || undefined,
      updatedAt: new Date(),
      // Delete existing items and recreate
      items: {
        deleteMany: {},
      },
    },
    include: {
      items: true,
    },
  })

  // If updating, create new items
  if (template.items.length === 0) {
    await prisma.checklistTemplateItem.createMany({
      data: items.map((item, index) => ({
        templateId: template.id,
        ...item,
        position: item.position ?? index,
      })),
    })
  }

  return getChecklistTemplate(listingId)
}

/**
 * Create default checklist template for a listing
 */
export async function createDefaultChecklistTemplate(listingId: string, ownerId: string) {
  return upsertChecklistTemplate(listingId, ownerId, DEFAULT_CHECKLIST_ITEMS, 'Default Checklist')
}

/**
 * Delete checklist template
 */
export async function deleteChecklistTemplate(listingId: string, ownerId: string) {
  // Verify ownership
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { ownerId: true },
  })

  if (!listing) {
    throw new Error('Listing not found')
  }

  if (listing.ownerId !== ownerId) {
    throw new Error('Not authorized to modify this listing')
  }

  await prisma.checklistTemplate.delete({
    where: { listingId },
  })

  return { success: true }
}

// ============================================
// HANDOVER CHECKLIST COMPLETION
// ============================================

export interface HandoverChecklistItemInput {
  templateItemId?: string
  label: string
  itemType: ChecklistItemType
  checkboxValue?: boolean
  numberValue?: number
  textValue?: string
  ratingValue?: number
  photoUrls?: string[]
  notes?: string
  hasIssue?: boolean
  issueDescription?: string
}

export interface CompleteHandoverParams {
  bookingId: string
  handoverType: HandoverType
  completedById: string
  completedByRole: 'OWNER' | 'RENTER'
  items: HandoverChecklistItemInput[]
  notes?: string
  overallPhotos?: string[]
  signature?: string
  latitude?: number
  longitude?: number
}

/**
 * Complete a handover checklist (pickup or return)
 */
export async function completeHandoverChecklist(params: CompleteHandoverParams) {
  const {
    bookingId,
    handoverType,
    completedById,
    completedByRole,
    items,
    notes,
    overallPhotos,
    signature,
    latitude,
    longitude,
  } = params

  // Get booking and verify
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: {
        include: {
          checklistTemplate: {
            include: { items: true },
          },
        },
      },
    },
  })

  if (!booking) {
    throw new Error('Booking not found')
  }

  // Verify user is part of this booking
  if (completedById !== booking.renterId && completedById !== booking.ownerId) {
    throw new Error('Not authorized for this booking')
  }

  // Check booking status is appropriate
  const validStatusesForPickup = ['AWAITING_PICKUP']
  const validStatusesForReturn = ['IN_USE']

  if (handoverType === 'PICKUP' && !validStatusesForPickup.includes(booking.bookingStatus)) {
    throw new Error(`Cannot complete pickup checklist. Booking status is ${booking.bookingStatus}`)
  }

  if (handoverType === 'RETURN' && !validStatusesForReturn.includes(booking.bookingStatus)) {
    throw new Error(`Cannot complete return checklist. Booking status is ${booking.bookingStatus}`)
  }

  // Create handover checklist
  const checklist = await prisma.handoverChecklist.create({
    data: {
      bookingId,
      handoverType,
      completedById,
      completedByRole,
      notes,
      overallPhotos: overallPhotos || [],
      signature,
      latitude,
      longitude,
      items: {
        create: items.map((item) => ({
          templateItemId: item.templateItemId,
          label: item.label,
          itemType: item.itemType,
          checkboxValue: item.checkboxValue,
          numberValue: item.numberValue,
          textValue: item.textValue,
          ratingValue: item.ratingValue,
          photoUrls: item.photoUrls || [],
          notes: item.notes,
          hasIssue: item.hasIssue || false,
          issueDescription: item.issueDescription,
        })),
      },
    },
    include: {
      items: true,
    },
  })

  // Update booking based on handover type
  if (handoverType === 'PICKUP') {
    // Extract engine hours from checklist
    const engineHoursItem = items.find((i) => i.label.toLowerCase().includes('engine hours'))
    
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        bookingStatus: 'IN_USE',
        actualPickupTime: new Date(),
        engineHoursAtPickup: engineHoursItem?.numberValue,
      },
    })
  } else if (handoverType === 'RETURN') {
    // Extract engine hours from checklist
    const engineHoursItem = items.find((i) => i.label.toLowerCase().includes('engine hours'))
    const hasIssues = items.some((i) => i.hasIssue)

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        bookingStatus: hasIssues ? 'AWAITING_RETURN_INSPECTION' : 'AWAITING_RETURN_INSPECTION',
        actualReturnTime: new Date(),
        engineHoursAtReturn: engineHoursItem?.numberValue,
        engineHoursUsed: engineHoursItem?.numberValue && booking.engineHoursAtPickup
          ? engineHoursItem.numberValue - booking.engineHoursAtPickup
          : null,
      },
    })
  }

  return checklist
}

/**
 * Get handover checklists for a booking
 */
export async function getHandoverChecklists(bookingId: string) {
  const checklists = await prisma.handoverChecklist.findMany({
    where: { bookingId },
    include: {
      items: true,
    },
    orderBy: { completedAt: 'asc' },
  })

  return checklists
}

/**
 * Get specific handover checklist
 */
export async function getHandoverChecklist(bookingId: string, handoverType: HandoverType) {
  const checklist = await prisma.handoverChecklist.findFirst({
    where: {
      bookingId,
      handoverType,
    },
    include: {
      items: true,
    },
  })

  return checklist
}

// ============================================
// BOOKING STATUS TRANSITIONS
// ============================================

/**
 * Approve return inspection and complete booking
 */
export async function approveReturnInspection(
  bookingId: string,
  adminId: string,
  notes?: string
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  })

  if (!booking) {
    throw new Error('Booking not found')
  }

  if (booking.bookingStatus !== 'AWAITING_RETURN_INSPECTION') {
    throw new Error('Booking is not awaiting return inspection')
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      bookingStatus: 'COMPLETED',
      ownerNotes: notes ? `${booking.ownerNotes || ''}\nInspection approved: ${notes}`.trim() : booking.ownerNotes,
    },
  })

  return { success: true, status: 'COMPLETED' }
}

/**
 * Raise dispute on return
 */
export async function raiseReturnDispute(
  bookingId: string,
  raisedById: string,
  raisedByRole: 'OWNER' | 'RENTER',
  reason: string,
  description: string,
  evidenceUrls?: string[],
  claimedAmount?: number
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  })

  if (!booking) {
    throw new Error('Booking not found')
  }

  if (!['AWAITING_RETURN_INSPECTION', 'IN_USE'].includes(booking.bookingStatus)) {
    throw new Error('Cannot raise dispute at this stage')
  }

  // Create dispute
  const dispute = await prisma.dispute.create({
    data: {
      bookingId,
      raisedById,
      raisedByRole,
      reason,
      description,
      evidenceUrls: evidenceUrls || [],
      claimedAmount,
      status: 'OPEN',
    },
  })

  // Update booking status
  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      bookingStatus: 'IN_DISPUTE',
    },
  })

  return dispute
}
