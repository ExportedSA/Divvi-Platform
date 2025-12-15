/**
 * Seed Script for System Configuration
 * Run with: npx ts-node prisma/seed-config.ts
 * 
 * ⚠️ IMPORTANT: Policy content is PLACEHOLDER COPY for development only.
 * All legal content must be reviewed by qualified professionals before production use.
 * See prisma/seed-content/policy-templates.ts for content templates.
 */

import { PrismaClient } from '@prisma/client'
import { POLICY_TEMPLATES } from './seed-content/policy-templates'

const prisma = new PrismaClient()

async function seedSystemConfig() {
  console.log('Seeding system configuration...')

  // High-risk asset threshold
  await prisma.systemConfig.upsert({
    where: { key: 'high_risk_asset_threshold' },
    update: {},
    create: {
      key: 'high_risk_asset_threshold',
      value: { threshold: 100000 }, // $100,000
      description: 'Estimated replacement value threshold for flagging listings as high-risk assets',
    },
  })

  // Listing approval settings
  await prisma.systemConfig.upsert({
    where: { key: 'listing_approval_settings' },
    update: {},
    create: {
      key: 'listing_approval_settings',
      value: {
        requireApprovalForHighValue: true,
        requireApprovalForNewOwners: false,
        autoApproveVerifiedOwners: true,
      },
      description: 'Settings for listing approval workflow',
    },
  })

  // Platform fee settings (for reference)
  await prisma.systemConfig.upsert({
    where: { key: 'platform_fee_settings' },
    update: {},
    create: {
      key: 'platform_fee_settings',
      value: {
        feeRate: 0.015, // 1.5%
        feeDisplay: '1.5%',
      },
      description: 'Platform fee configuration',
    },
  })

  // Damage negotiation window
  await prisma.systemConfig.upsert({
    where: { key: 'damage_negotiation_window_days' },
    update: {},
    create: {
      key: 'damage_negotiation_window_days',
      value: { days: 7 }, // 7 days for negotiation
      description: 'Number of days for damage report negotiation window before admin intervention',
    },
  })

  // Bond release settings
  await prisma.systemConfig.upsert({
    where: { key: 'bond_release_settings' },
    update: {},
    create: {
      key: 'bond_release_settings',
      value: {
        autoReleaseDays: 7, // Auto-release after 7 days if no damage reported
        holdDaysAfterDamageReport: 30, // Hold bond for 30 days after damage report
      },
      description: 'Settings for automatic bond release timing',
    },
  })

  console.log('System configuration seeded successfully!')
}

async function seedPolicyContent() {
  console.log('Seeding policy content...')
  console.log('⚠️  Note: Policy content is PLACEHOLDER COPY - requires legal review before production use.')

  // Seed all policy templates
  for (const [slug, template] of Object.entries(POLICY_TEMPLATES)) {
    console.log(`  Seeding: ${slug}`)
    await prisma.staticPage.upsert({
      where: { slug },
      update: {}, // Don't overwrite existing content (allows CMS edits to persist)
      create: {
        slug,
        title: template.title,
        shortSummary: template.shortSummary,
        category: template.category as any,
        content: template.content,
        version: 1,
        isPublished: true,
      },
    })
  }

  // Owner Listing Confirmations (structured data for CMS)
  console.log('  Seeding: owner-listing-confirmations')
  await prisma.staticPage.upsert({
    where: { slug: 'owner-listing-confirmations' },
    update: {},
    create: {
      slug: 'owner-listing-confirmations',
      title: 'Owner Listing Confirmations',
      shortSummary: 'Confirmation text shown to owners when publishing listings. PLACEHOLDER - requires legal review.',
      category: 'LEGAL',
      content: JSON.stringify({
        _notice: 'PLACEHOLDER CONTENT - Requires legal review before production use.',
        maintenanceResponsibility: {
          id: 'confirmMaintenanceResponsibility',
          label: 'Maintenance & Safety Responsibility',
          text: 'I confirm that I am responsible for maintaining this machinery in safe working condition and compliance with applicable regulations. I understand this is a legal obligation and I should seek my own legal advice.',
          required: true,
        },
        insuranceAccuracy: {
          id: 'confirmInsuranceAccuracy',
          label: 'Insurance Information Accuracy',
          text: 'I confirm that the insurance information I have provided is accurate to the best of my knowledge. I understand I should verify my coverage with my insurer.',
          required: true,
        },
        platformDisclaimer: {
          id: 'acknowledgePlatformRole',
          label: 'Platform Role Acknowledgement',
          text: 'I understand that Lendit is a marketplace platform only and does not provide insurance, legal advice, or verify the adequacy of any coverage.',
          required: true,
        },
      }),
      version: 1,
      isPublished: true,
    },
  })

  console.log('Policy content seeded successfully!')
  console.log('⚠️  Remember: All policy content requires legal review before production use.')
}

async function main() {
  try {
    await seedSystemConfig()
    await seedPolicyContent()
    console.log('All seeds completed!')
  } catch (error) {
    console.error('Seed error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
