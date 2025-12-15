import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function checkPhase0() {
  console.log('\n=== Phase 0 Verification ===\n')
  
  // Check User accounts & roles
  console.log('👤 User Accounts & Roles:')
  
  const authRoutes = [
    'src/app/auth/signin/page.tsx',
    'src/app/auth/signup/page.tsx',
    'src/app/api/auth/register/route.ts',
    'src/app/api/auth/[...nextauth]/route.ts',
  ]
  
  for (const route of authRoutes) {
    const exists = fs.existsSync(path.join(process.cwd(), route))
    console.log(`   ${exists ? '✅' : '❌'} ${route}`)
  }
  
  // Check become owner upgrade path
  const upgradeRoute = 'src/app/api/user/upgrade-to-owner/route.ts'
  const upgradePage = 'src/app/dashboard/become-owner/page.tsx'
  console.log(`   ${fs.existsSync(path.join(process.cwd(), upgradeRoute)) ? '✅' : '❌'} Upgrade to Owner API`)
  console.log(`   ${fs.existsSync(path.join(process.cwd(), upgradePage)) ? '✅' : '❌'} Become Owner Page`)
  
  // Check User model fields in schema
  const schema = fs.readFileSync(path.join(process.cwd(), 'prisma/schema.prisma'), 'utf-8')
  console.log('\n📋 User Model Fields:')
  console.log(`   ${schema.includes('firstName') ? '✅' : '❌'} firstName`)
  console.log(`   ${schema.includes('lastName') ? '✅' : '❌'} lastName`)
  console.log(`   ${schema.includes('farmName') ? '✅' : '❌'} farmName`)
  console.log(`   ${schema.includes('region') ? '✅' : '❌'} region`)
  console.log(`   ${schema.includes('country') ? '✅' : '❌'} country`)
  
  console.log('\n🔐 UserRole Enum:')
  console.log(`   ${schema.includes('RENTER') ? '✅' : '❌'} RENTER`)
  console.log(`   ${schema.includes('OWNER') ? '✅' : '❌'} OWNER`)
  console.log(`   ${schema.includes('ADMIN') ? '✅' : '❌'} ADMIN`)

  // Check StaticPages
  const pages = await prisma.staticPage.findMany({
    select: { slug: true, title: true, isPublished: true }
  })
  
  console.log('✅ StaticPages seeded:')
  pages.forEach(p => console.log(`   - ${p.slug}: "${p.title}" (published: ${p.isPublished})`))

  // Check required pages
  const requiredPages = [
    'insurance-and-damage-policy',
    'owner-responsibilities', 
    'renter-responsibilities'
  ]
  
  console.log('\n📋 Required Phase 0 pages:')
  for (const slug of requiredPages) {
    const exists = pages.some(p => p.slug === slug)
    console.log(`   ${exists ? '✅' : '❌'} ${slug}`)
  }

  // Check SystemConfig
  const configs = await prisma.systemConfig.findMany({
    select: { key: true }
  })
  console.log('\n⚙️  SystemConfig entries:', configs.length)
  configs.forEach(c => console.log(`   - ${c.key}`))

  // Check table counts
  const userCount = await prisma.user.count()
  const listingCount = await prisma.listing.count()
  
  console.log('\n📊 Database status:')
  console.log(`   - Users: ${userCount}`)
  console.log(`   - Listings: ${listingCount}`)
  
  console.log('\n=== Phase 0 Complete ===\n')
  
  await prisma.$disconnect()
}

checkPhase0().catch(console.error)
