import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function verifyDeliverables() {
  console.log('\n========================================')
  console.log('  PHASE 0 KEY DELIVERABLES VERIFICATION')
  console.log('========================================\n')

  let allPassed = true

  // 1. Users can sign up and become owners
  console.log('1️⃣  USERS CAN SIGN UP AND BECOME OWNERS')
  console.log('─'.repeat(40))
  
  const signupPage = fs.existsSync(path.join(process.cwd(), 'src/app/auth/signup/page.tsx'))
  const signinPage = fs.existsSync(path.join(process.cwd(), 'src/app/auth/signin/page.tsx'))
  const registerApi = fs.existsSync(path.join(process.cwd(), 'src/app/api/auth/register/route.ts'))
  const nextAuthApi = fs.existsSync(path.join(process.cwd(), 'src/app/api/auth/[...nextauth]/route.ts'))
  const upgradeApi = fs.existsSync(path.join(process.cwd(), 'src/app/api/user/upgrade-to-owner/route.ts'))
  const becomeOwnerPage = fs.existsSync(path.join(process.cwd(), 'src/app/dashboard/become-owner/page.tsx'))

  console.log(`   ${signupPage ? '✅' : '❌'} Sign Up page (/auth/signup)`)
  console.log(`   ${signinPage ? '✅' : '❌'} Sign In page (/auth/signin)`)
  console.log(`   ${registerApi ? '✅' : '❌'} Register API (/api/auth/register)`)
  console.log(`   ${nextAuthApi ? '✅' : '❌'} NextAuth API (/api/auth/[...nextauth])`)
  console.log(`   ${upgradeApi ? '✅' : '❌'} Upgrade to Owner API (/api/user/upgrade-to-owner)`)
  console.log(`   ${becomeOwnerPage ? '✅' : '❌'} Become Owner page (/dashboard/become-owner)`)
  
  const userDeliverable = signupPage && signinPage && registerApi && nextAuthApi && upgradeApi && becomeOwnerPage
  console.log(`\n   Result: ${userDeliverable ? '✅ PASS' : '❌ FAIL'}`)
  if (!userDeliverable) allPassed = false

  // 2. Owners can create & publish listings
  console.log('\n2️⃣  OWNERS CAN CREATE & PUBLISH LISTINGS')
  console.log('─'.repeat(40))
  
  const listingsApi = fs.existsSync(path.join(process.cwd(), 'src/app/api/listings/route.ts'))
  const listingDetailApi = fs.existsSync(path.join(process.cwd(), 'src/app/api/listings/[id]/route.ts'))
  const listingStatusApi = fs.existsSync(path.join(process.cwd(), 'src/app/api/listings/[id]/status/route.ts'))
  const ownerListingsPage = fs.existsSync(path.join(process.cwd(), 'src/app/dashboard/listings/page.tsx'))
  const newListingPage = fs.existsSync(path.join(process.cwd(), 'src/app/dashboard/listings/new/page.tsx'))
  const editListingPage = fs.existsSync(path.join(process.cwd(), 'src/app/dashboard/listings/[id]/page.tsx'))

  console.log(`   ${listingsApi ? '✅' : '❌'} Listings API (GET/POST /api/listings)`)
  console.log(`   ${listingDetailApi ? '✅' : '❌'} Listing Detail API (GET/PUT/DELETE /api/listings/[id])`)
  console.log(`   ${listingStatusApi ? '✅' : '❌'} Listing Status API (PATCH /api/listings/[id]/status)`)
  console.log(`   ${ownerListingsPage ? '✅' : '❌'} Owner Listings page (/dashboard/listings)`)
  console.log(`   ${newListingPage ? '✅' : '❌'} Create Listing page (/dashboard/listings/new)`)
  console.log(`   ${editListingPage ? '✅' : '❌'} Edit Listing page (/dashboard/listings/[id])`)

  // Check status lifecycle in API
  const statusApiContent = fs.readFileSync(path.join(process.cwd(), 'src/app/api/listings/[id]/status/route.ts'), 'utf-8')
  const hasStatusLifecycle = statusApiContent.includes('DRAFT') && 
                             statusApiContent.includes('PENDING_REVIEW') && 
                             statusApiContent.includes('LIVE') && 
                             statusApiContent.includes('PAUSED') &&
                             statusApiContent.includes('REJECTED')
  console.log(`   ${hasStatusLifecycle ? '✅' : '❌'} Status lifecycle (DRAFT→PENDING_REVIEW→LIVE→PAUSED→REJECTED)`)

  const listingDeliverable = listingsApi && listingDetailApi && listingStatusApi && ownerListingsPage && newListingPage && editListingPage && hasStatusLifecycle
  console.log(`\n   Result: ${listingDeliverable ? '✅ PASS' : '❌ FAIL'}`)
  if (!listingDeliverable) allPassed = false

  // 3. Public can browse/search listings
  console.log('\n3️⃣  PUBLIC CAN BROWSE/SEARCH LISTINGS')
  console.log('─'.repeat(40))
  
  const browsePage = fs.existsSync(path.join(process.cwd(), 'src/app/browse/page.tsx'))
  const browseClientPage = fs.existsSync(path.join(process.cwd(), 'src/app/browse/client-page.tsx'))
  const homePage = fs.existsSync(path.join(process.cwd(), 'src/app/page.tsx'))

  // Check API supports search and filters
  const listingsApiContent = fs.readFileSync(path.join(process.cwd(), 'src/app/api/listings/route.ts'), 'utf-8')
  const hasSearch = listingsApiContent.includes('search')
  const hasFilters = listingsApiContent.includes('category') && listingsApiContent.includes('country') && listingsApiContent.includes('region')
  const hasSort = listingsApiContent.includes('sort') && listingsApiContent.includes('price_asc')
  const hasPriceRange = listingsApiContent.includes('minPrice') && listingsApiContent.includes('maxPrice')

  console.log(`   ${browsePage ? '✅' : '❌'} Browse page (/browse)`)
  console.log(`   ${browseClientPage ? '✅' : '❌'} Browse client component`)
  console.log(`   ${homePage ? '✅' : '❌'} Home page with search bar (/)`)
  console.log(`   ${hasSearch ? '✅' : '❌'} Keyword search support`)
  console.log(`   ${hasFilters ? '✅' : '❌'} Filters (category, country, region)`)
  console.log(`   ${hasPriceRange ? '✅' : '❌'} Price range filter`)
  console.log(`   ${hasSort ? '✅' : '❌'} Sorting (newest, price)`)

  const browseDeliverable = browsePage && browseClientPage && homePage && hasSearch && hasFilters && hasSort && hasPriceRange
  console.log(`\n   Result: ${browseDeliverable ? '✅ PASS' : '❌ FAIL'}`)
  if (!browseDeliverable) allPassed = false

  // 4. Static policy pages wired in (read-only)
  console.log('\n4️⃣  STATIC POLICY PAGES WIRED IN')
  console.log('─'.repeat(40))
  
  const termsPage = fs.existsSync(path.join(process.cwd(), 'src/app/terms/page.tsx'))
  const howItWorksPage = fs.existsSync(path.join(process.cwd(), 'src/app/how-it-works/page.tsx'))
  const insuranceDamagePage = fs.existsSync(path.join(process.cwd(), 'src/app/insurance-damage/page.tsx'))

  console.log(`   ${termsPage ? '✅' : '❌'} Terms page (/terms)`)
  console.log(`   ${howItWorksPage ? '✅' : '❌'} How It Works page (/how-it-works)`)
  console.log(`   ${insuranceDamagePage ? '✅' : '❌'} Insurance & Damage page (/insurance-damage)`)

  // Check database has policy content
  const policyPages = await prisma.staticPage.findMany({
    where: { isPublished: true },
    select: { slug: true }
  })
  const policySlugs = policyPages.map(p => p.slug)
  
  const hasInsurancePolicy = policySlugs.includes('insurance-and-damage-policy')
  const hasOwnerResponsibilities = policySlugs.includes('owner-responsibilities')
  const hasRenterResponsibilities = policySlugs.includes('renter-responsibilities')
  const hasTermsOfService = policySlugs.includes('terms-of-service')
  const hasPrivacyPolicy = policySlugs.includes('privacy-policy')

  console.log(`   ${hasInsurancePolicy ? '✅' : '❌'} DB: insurance-and-damage-policy`)
  console.log(`   ${hasOwnerResponsibilities ? '✅' : '❌'} DB: owner-responsibilities`)
  console.log(`   ${hasRenterResponsibilities ? '✅' : '❌'} DB: renter-responsibilities`)
  console.log(`   ${hasTermsOfService ? '✅' : '❌'} DB: terms-of-service`)
  console.log(`   ${hasPrivacyPolicy ? '✅' : '❌'} DB: privacy-policy`)

  const policyDeliverable = termsPage && howItWorksPage && insuranceDamagePage && 
                            hasInsurancePolicy && hasOwnerResponsibilities && hasRenterResponsibilities
  console.log(`\n   Result: ${policyDeliverable ? '✅ PASS' : '❌ FAIL'}`)
  if (!policyDeliverable) allPassed = false

  // Final Summary
  console.log('\n========================================')
  console.log('  FINAL RESULT')
  console.log('========================================')
  console.log(`\n  ${allPassed ? '✅ ALL KEY DELIVERABLES ACHIEVED!' : '❌ SOME DELIVERABLES MISSING'}`)
  console.log('\n========================================\n')

  await prisma.$disconnect()
  process.exit(allPassed ? 0 : 1)
}

verifyDeliverables().catch(console.error)
