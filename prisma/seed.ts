import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@machineryrentals.com' },
    update: {},
    create: {
      email: 'admin@machineryrentals.com',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      country: 'NZ',
      region: 'Auckland',
    },
  })
  console.log('Created admin user:', admin.email)

  // Create sample users
  const userPassword = await bcrypt.hash('password123', 10)
  
  const user1 = await prisma.user.upsert({
    where: { email: 'john@farm.co.nz' },
    update: {},
    create: {
      email: 'john@farm.co.nz',
      passwordHash: userPassword,
      firstName: 'John',
      lastName: 'Smith',
      farmName: 'Smith Family Farm',
      phone: '+64 21 123 4567',
      role: 'OWNER',
      country: 'NZ',
      region: 'Canterbury',
    },
  })
  console.log('Created user:', user1.email)

  const user2 = await prisma.user.upsert({
    where: { email: 'sarah@equipment.com.au' },
    update: {},
    create: {
      email: 'sarah@equipment.com.au',
      passwordHash: userPassword,
      firstName: 'Sarah',
      lastName: 'Johnson',
      farmName: 'Johnson Equipment Hire',
      phone: '+61 400 123 456',
      role: 'OWNER',
      country: 'AU',
      region: 'Victoria',
    },
  })
  console.log('Created user:', user2.email)

  // Create sample listings
  const listing1 = await prisma.listing.create({
    data: {
      ownerId: user1.id,
      title: 'John Deere 6150R Tractor - 150HP',
      description: 'Well-maintained John Deere 6150R tractor with 150 horsepower. Perfect for plowing, tilling, and general farm work. Includes front loader attachment. Regularly serviced and in excellent condition. Ideal for medium to large-scale farming operations.',
      category: 'TRACTOR',
      brand: 'John Deere',
      model: '6150R',
      year: 2019,
      enginePowerHP: 150,
      operatingWeightKg: 7200,
      country: 'NZ',
      region: 'Canterbury',
      localArea: 'Ashburton',
      currency: 'NZD',
      pricePerDay: 450,
      pricePerWeek: 2500,
      minimumRentalDays: 1,
      bondAmount: 2000,
      insuranceMode: 'OWNER_PROVIDED',
      insuranceNotes: 'Comprehensive insurance included in rental price. Covers accidental damage during normal operation.',
      safetyNotes: 'Operator must hold valid tractor license. PPE required: hard hat, steel-toe boots, high-vis vest.',
      status: 'LIVE',
    },
  })
  console.log('Created listing:', listing1.title)

  const listing2 = await prisma.listing.create({
    data: {
      ownerId: user2.id,
      title: 'Caterpillar 320 Excavator - 20 Tonne',
      description: 'CAT 320 hydraulic excavator, 20-tonne class. Equipped with standard digging bucket and quick hitch. GPS grade control system included. Perfect for earthmoving, trenching, and site preparation. Recent full service completed.',
      category: 'DIGGER',
      brand: 'Caterpillar',
      model: '320',
      year: 2020,
      enginePowerHP: 121,
      operatingWeightKg: 20000,
      workingWidthM: 1.0,
      country: 'AU',
      region: 'Victoria',
      localArea: 'Bendigo',
      currency: 'AUD',
      pricePerDay: 850,
      pricePerWeek: 4500,
      minimumRentalDays: 2,
      bondAmount: 5000,
      insuranceMode: 'RENTER_PROVIDED',
      insuranceNotes: 'Renter must provide proof of insurance covering equipment damage and public liability.',
      safetyNotes: 'Operator must have excavator certification. Site preparation required before delivery. Minimum 2 years experience. Safety induction mandatory.',
      status: 'LIVE',
    },
  })
  console.log('Created listing:', listing2.title)

  const listing3 = await prisma.listing.create({
    data: {
      ownerId: user1.id,
      title: 'Hardi Ranger 3000 Crop Sprayer',
      description: 'Hardi Ranger 3000 trailed crop sprayer with 3000L tank capacity. 24-meter boom width. Electronic rate control and GPS mapping. Ideal for large-scale crop protection applications. Well-maintained and calibrated.',
      category: 'SPRAYER',
      brand: 'Hardi',
      model: 'Ranger 3000',
      year: 2021,
      workingWidthM: 24,
      country: 'NZ',
      region: 'Canterbury',
      localArea: 'Ashburton',
      currency: 'NZD',
      pricePerDay: 350,
      pricePerWeek: 1800,
      minimumRentalDays: 1,
      bondAmount: 1500,
      insuranceMode: 'OWNER_PROVIDED',
      insuranceNotes: 'Insurance included. Renter responsible for chemical handling compliance.',
      safetyNotes: 'Valid AgriChem qualification required. Must follow all chemical safety protocols.',
    },
  })
  console.log('Created listing:', listing3.title)

  // Create static pages
  const insurancePage = await prisma.staticPage.upsert({
    where: { slug: 'insurance-damage' },
    update: {},
    create: {
      slug: 'insurance-damage',
      title: 'Insurance & Damage Policy',
      content: `
# Insurance & Damage Policy

## Platform Role

MachineryRentals operates as a marketplace platform connecting machinery owners with renters. We facilitate connections but are not responsible for the machinery, insurance coverage, or any incidents that occur during rentals.

## Owner Responsibilities

### Insurance Options
Owners must clearly specify their insurance arrangement:
- **Owner-Provided Insurance**: Owner includes comprehensive insurance in the rental price
- **Renter-Required Insurance**: Renter must provide proof of their own insurance
- **No Insurance Provided**: Renter assumes full responsibility (not recommended)

### Machinery Condition
- Maintain machinery in safe, working condition
- Conduct pre-rental safety checks
- Provide accurate specifications and limitations
- Disclose any known issues or defects

## Renter Responsibilities

### Due Diligence
- Inspect machinery before accepting rental
- Verify insurance coverage and terms
- Understand and follow all safety requirements
- Operate machinery within specified parameters

### Damage and Liability
- Report any damage immediately
- Pay applicable excess/deductible as agreed
- Cover costs for damage caused by negligence or misuse
- Return machinery in the same condition as received

## Bonds and Excess

### Security Bonds
- Held to cover potential damage or excess charges
- Refunded after successful return and inspection
- May be used to cover cleaning, repairs, or missing items

### Damage Excess
- The amount renter pays before insurance coverage applies
- Clearly stated in each listing
- Payable for any damage during rental period

## Dispute Resolution

In case of disputes regarding damage or liability:
1. Document the issue with photos and descriptions
2. Contact the other party to discuss resolution
3. If unresolved, contact MachineryRentals support
4. May require independent assessment or mediation

## Safety and Compliance

### On-Farm Safety
- Renters responsible for workplace safety compliance
- Must follow all relevant health and safety regulations
- Provide appropriate supervision and training
- Maintain safe operating environment

### Maintenance and Breakdowns
- Report mechanical issues immediately
- Do not attempt unauthorized repairs
- Owner responsible for maintenance-related breakdowns
- Renter responsible for damage from misuse

## Important Notes

- This policy provides general guidance only
- Specific terms in each listing take precedence
- Seek independent legal and insurance advice
- Both parties should maintain adequate insurance coverage

**Last Updated**: December 2024
      `,
      isPublished: true,
    },
  })
  console.log('Created static page:', insurancePage.slug)

  const termsPage = await prisma.staticPage.upsert({
    where: { slug: 'terms' },
    update: {},
    create: {
      slug: 'terms',
      title: 'Terms of Use',
      content: `
# Terms of Use

## Acceptance of Terms

By accessing and using MachineryRentals, you agree to be bound by these Terms of Use. If you do not agree, please do not use our platform.

## Platform Service

MachineryRentals provides a marketplace platform for machinery rental listings. We do not own, operate, or control the machinery listed on our platform.

## User Accounts

- You must provide accurate information
- Keep your password secure
- You are responsible for all account activity
- Notify us immediately of unauthorized access

## Listing Requirements

Owners must:
- Provide accurate machinery descriptions
- Maintain machinery in safe condition
- Comply with all applicable laws
- Honor confirmed bookings

## Booking and Payments

- Payment terms are set by individual owners
- Platform may facilitate payment processing
- Cancellation policies vary by listing
- Disputes should be resolved between parties

## Prohibited Activities

Users must not:
- Provide false or misleading information
- Engage in fraudulent activities
- Violate any laws or regulations
- Harass or harm other users

## Limitation of Liability

MachineryRentals is not liable for:
- Machinery condition or safety
- Accidents or injuries during rentals
- Disputes between owners and renters
- Loss or damage to property

## Modifications

We reserve the right to modify these terms at any time. Continued use constitutes acceptance of modified terms.

**Last Updated**: December 2024
      `,
      isPublished: true,
    },
  })
  console.log('Created static page:', termsPage.slug)

  const howItWorksPage = await prisma.staticPage.upsert({
    where: { slug: 'how-it-works' },
    update: {},
    create: {
      slug: 'how-it-works',
      title: 'How It Works',
      content: `
# How MachineryRentals Works

## For Renters

### 1. Search & Browse
- Browse machinery by category, location, or keyword
- Filter by price, availability, and specifications
- View detailed listings with photos and descriptions

### 2. Review Details
- Check pricing (daily/weekly rates)
- Review insurance and safety requirements
- Verify availability calendar
- Read owner ratings and reviews

### 3. Request Booking
- Select your rental dates
- Review total cost including bonds and fees
- Agree to insurance and damage terms
- Submit booking request to owner

### 4. Confirmation
- Owner reviews and approves request
- Arrange pickup or delivery
- Complete any required documentation
- Pay according to agreed terms

### 5. Use & Return
- Inspect machinery before use
- Operate safely and responsibly
- Report any issues immediately
- Return in same condition

## For Owners

### 1. Create Listing
- Provide machinery details and specifications
- Upload quality photos
- Set pricing and availability
- Specify insurance arrangements

### 2. Set Terms
- Define minimum rental periods
- Set bond and excess amounts
- Specify safety requirements
- Choose pickup/delivery options

### 3. Manage Bookings
- Receive booking requests
- Review renter profiles
- Accept or decline requests
- Communicate arrangements

### 4. Handover
- Inspect machinery with renter
- Provide operating instructions
- Document condition with photos
- Confirm insurance coverage

### 5. Completion
- Inspect returned machinery
- Process bond refund if applicable
- Leave review for renter
- Track rental history

## Safety First

- All users must prioritize safety
- Follow manufacturer guidelines
- Maintain proper licensing
- Use appropriate PPE

## Support

Need help? Contact our support team for assistance with bookings, disputes, or platform questions.
      `,
      isPublished: true,
    },
  })
  console.log('Created static page:', howItWorksPage.slug)

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
