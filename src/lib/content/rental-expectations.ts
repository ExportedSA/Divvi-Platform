/**
 * Rental Expectations Content
 * Static content for owner and renter responsibilities during rental
 * This content is surfaced on:
 * - Insurance & Damage Policy page
 * - Pre-booking confirmation
 * - Pickup checklist
 */

// ============================================
// OWNER RESPONSIBILITIES
// ============================================

export const OWNER_RESPONSIBILITIES = {
  title: 'Owner Responsibilities During Rental',
  summary: 'As the equipment owner, you are responsible for providing safe, compliant machinery.',
  
  items: [
    {
      id: 'mechanically-sound',
      title: 'Mechanically Sound Equipment',
      description: 'Provide machinery that is in good working condition and mechanically sound for the intended use.',
      icon: 'wrench',
      priority: 'required',
    },
    {
      id: 'compliance',
      title: 'Regulatory Compliance',
      description: 'Ensure the machinery complies with all applicable safety regulations, standards, and registration requirements.',
      icon: 'shield-check',
      priority: 'required',
    },
    {
      id: 'maintenance',
      title: 'Maintenance Standards',
      description: 'Maintain tyres, brakes, hydraulics, safety guards, lights, and all critical components to safe operating standards.',
      icon: 'settings',
      priority: 'required',
    },
    {
      id: 'ppe-guidance',
      title: 'PPE & Safety Guidance',
      description: 'Provide clear guidance on required Personal Protective Equipment (PPE) and safe operating procedures.',
      icon: 'hard-hat',
      priority: 'recommended',
    },
    {
      id: 'defect-disclosure',
      title: 'Disclose Known Defects',
      description: 'Disclose any known defects, limitations, or issues that may affect safe operation or the intended use.',
      icon: 'alert-triangle',
      priority: 'required',
    },
    {
      id: 'documentation',
      title: 'Provide Documentation',
      description: 'Supply relevant operating manuals, safety documentation, and any required certifications.',
      icon: 'file-text',
      priority: 'recommended',
    },
  ],
  
  legalNote: 'Owners who fail to meet these responsibilities may be liable for any resulting damage, injury, or loss.',
}

// ============================================
// RENTER RESPONSIBILITIES
// ============================================

export const RENTER_RESPONSIBILITIES = {
  title: 'Renter Responsibilities During Rental',
  summary: 'As the renter, you are responsible for safe operation and care of the equipment.',
  
  items: [
    {
      id: 'pickup-inspection',
      title: 'Inspect at Pickup',
      description: 'Thoroughly inspect the machinery at pickup. Document any existing damage or issues before taking possession.',
      icon: 'search',
      priority: 'required',
    },
    {
      id: 'agreed-scope',
      title: 'Operate Within Agreed Scope',
      description: 'Use the machinery only for the agreed purpose. Do not use on public roads if not road-legal, or exceed stated capacities.',
      icon: 'target',
      priority: 'required',
    },
    {
      id: 'safe-use-requirements',
      title: 'Follow Safe Use Requirements',
      description: 'Ensure all operators hold required licences, endorsements, or certifications as specified in the listing.',
      icon: 'award',
      priority: 'required',
    },
    {
      id: 'proper-operation',
      title: 'Proper Operation',
      description: 'Operate the machinery according to manufacturer guidelines and safe operating procedures.',
      icon: 'book-open',
      priority: 'required',
    },
    {
      id: 'report-issues',
      title: 'Report Issues Promptly',
      description: 'Immediately report any mechanical issues, damage, or safety concerns to the owner.',
      icon: 'phone',
      priority: 'required',
    },
    {
      id: 'return-condition',
      title: 'Return in Same Condition',
      description: 'Return the machinery in the same condition as received, allowing for fair wear and tear from agreed use.',
      icon: 'refresh-cw',
      priority: 'required',
    },
  ],
  
  legalNote: 'Renters who fail to meet these responsibilities may be liable for damage and may forfeit their bond.',
}

// ============================================
// COMBINED EXPECTATIONS (for policy page)
// ============================================

export const RENTAL_EXPECTATIONS = {
  title: 'Rental Expectations',
  introduction: `
Both owners and renters have responsibilities during the rental period to ensure safe, 
successful equipment hire. These expectations are designed to protect both parties and 
ensure machinery is used safely and returned in good condition.
  `.trim(),
  
  owner: OWNER_RESPONSIBILITIES,
  renter: RENTER_RESPONSIBILITIES,
  
  disputeNote: `
If either party fails to meet their responsibilities, this may be considered during any 
dispute resolution process. Document everything with photos and written communication.
  `.trim(),
}

// ============================================
// PRE-BOOKING SUMMARY (condensed version)
// ============================================

export const PRE_BOOKING_EXPECTATIONS = {
  title: 'What to Expect',
  
  ownerCommitments: [
    'Machinery will be mechanically sound and compliant',
    'All known defects will be disclosed',
    'Safety guidance and documentation provided',
  ],
  
  renterCommitments: [
    'Inspect machinery thoroughly at pickup',
    'Operate within agreed scope and requirements',
    'Hold required licences/endorsements',
    'Report any issues promptly',
    'Return in same condition (fair wear allowed)',
  ],
  
  callToAction: 'By booking, you agree to these expectations and the full terms in our Insurance & Damage Policy.',
}

// ============================================
// PICKUP CHECKLIST REMINDERS
// ============================================

export const PICKUP_CHECKLIST_EXPECTATIONS = {
  title: 'Before You Start',
  
  forRenter: {
    title: 'Renter Checklist',
    items: [
      {
        id: 'visual-inspection',
        text: 'Complete visual inspection of the machinery',
        required: true,
      },
      {
        id: 'document-condition',
        text: 'Document existing damage with photos',
        required: true,
      },
      {
        id: 'verify-operation',
        text: 'Verify all controls and safety features work',
        required: true,
      },
      {
        id: 'confirm-hours',
        text: 'Confirm and record engine hours/odometer',
        required: true,
      },
      {
        id: 'review-requirements',
        text: 'Review safe use requirements from listing',
        required: true,
      },
      {
        id: 'confirm-licences',
        text: 'Confirm you hold required licences/endorsements',
        required: true,
      },
      {
        id: 'understand-scope',
        text: 'Understand agreed scope of use',
        required: true,
      },
      {
        id: 'emergency-contact',
        text: 'Have owner contact details for emergencies',
        required: true,
      },
    ],
  },
  
  forOwner: {
    title: 'Owner Checklist',
    items: [
      {
        id: 'machinery-ready',
        text: 'Machinery is clean and ready for handover',
        required: true,
      },
      {
        id: 'full-service',
        text: 'Recent service/maintenance completed',
        required: false,
      },
      {
        id: 'safety-check',
        text: 'Safety features verified working',
        required: true,
      },
      {
        id: 'fuel-level',
        text: 'Fuel/fluid levels documented',
        required: true,
      },
      {
        id: 'documentation',
        text: 'Operating manual/safety docs provided',
        required: false,
      },
      {
        id: 'defects-disclosed',
        text: 'All known defects disclosed to renter',
        required: true,
      },
      {
        id: 'ppe-guidance',
        text: 'PPE requirements explained',
        required: true,
      },
      {
        id: 'contact-provided',
        text: 'Emergency contact details provided',
        required: true,
      },
    ],
  },
  
  reminder: 'Both parties should sign off on the handover checklist before the rental begins.',
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get owner responsibilities as simple text list
 */
export function getOwnerResponsibilitiesText(): string[] {
  return OWNER_RESPONSIBILITIES.items.map(item => item.description)
}

/**
 * Get renter responsibilities as simple text list
 */
export function getRenterResponsibilitiesText(): string[] {
  return RENTER_RESPONSIBILITIES.items.map(item => item.description)
}

/**
 * Get required items only
 */
export function getRequiredOwnerResponsibilities() {
  return OWNER_RESPONSIBILITIES.items.filter(item => item.priority === 'required')
}

export function getRequiredRenterResponsibilities() {
  return RENTER_RESPONSIBILITIES.items.filter(item => item.priority === 'required')
}

/**
 * Format expectations for display in a specific context
 */
export function formatExpectationsForContext(
  context: 'policy' | 'booking' | 'checklist'
) {
  switch (context) {
    case 'policy':
      return RENTAL_EXPECTATIONS
    case 'booking':
      return PRE_BOOKING_EXPECTATIONS
    case 'checklist':
      return PICKUP_CHECKLIST_EXPECTATIONS
    default:
      return RENTAL_EXPECTATIONS
  }
}

/**
 * Get markdown content for the Insurance & Damage Policy page
 */
export function getRentalExpectationsMarkdown(): string {
  return `
## During the Rental Period

${RENTAL_EXPECTATIONS.introduction}

### ${OWNER_RESPONSIBILITIES.title}

${OWNER_RESPONSIBILITIES.summary}

${OWNER_RESPONSIBILITIES.items.map(item => `- **${item.title}**: ${item.description}`).join('\n')}

*${OWNER_RESPONSIBILITIES.legalNote}*

### ${RENTER_RESPONSIBILITIES.title}

${RENTER_RESPONSIBILITIES.summary}

${RENTER_RESPONSIBILITIES.items.map(item => `- **${item.title}**: ${item.description}`).join('\n')}

*${RENTER_RESPONSIBILITIES.legalNote}*

---

${RENTAL_EXPECTATIONS.disputeNote}
  `.trim()
}
