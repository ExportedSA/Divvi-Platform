# Lendit Machinery Rentals - Production Setup Guide

## Phase 0: Database & Deployment Setup

### 1. Database Setup

Choose one of the following options:

#### Option A: Neon (Recommended)

```bash
# Install Neon CLI
npm install -g @neondatabase/serverless

# Create database
neon db create lendit-production

# Get connection string
neon db connection-string lendit-production
```

#### Option B: Supabase

```bash
# Create project at https://supabase.com
# Get connection string from Settings > Database
```

#### Option C: AWS RDS

```bash
# Create PostgreSQL instance via AWS Console
# Configure security groups to allow Vercel access
```

### 2. Environment Variables

Set these in Vercel dashboard or via CLI:

```bash
# Database
DATABASE_URL="your-production-database-url"

# NextAuth.js
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Stripe (skip for MVP)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Image Storage (skip for MVP)
UPLOAD_BUCKET_URL="https://your-bucket.s3.amazonaws.com"
UPLOAD_BUCKET_KEY_ID="your-access-key"
UPLOAD_BUCKET_SECRET="your-secret"
UPLOAD_BUCKET_REGION="ap-southeast-2"
UPLOAD_BUCKET_NAME="your-bucket"
```

### 3. Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Deploy schema to production
npx prisma db deploy

# Seed policy content
npx prisma db seed
```

### 4. Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Or use the automated script
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### 5. Post-Deployment Checklist

- [ ] Database accessible from Vercel
- [ ] Policy content seeded
- [ ] Authentication working
- [ ] Basic booking flow functional
- [ ] 6-checkbox acknowledgment system working

### 6. MVP Features Ready

✅ User authentication & profiles
✅ Equipment listings & search
✅ Booking flow with 6-checkbox acknowledgments
✅ Insurance policy system
✅ Damage reporting framework
✅ Admin dashboard basics

### 7. Next Phase Features

🔄 Stripe payment integration
🔄 Image upload & storage
🔄 Email notifications
🔄 Advanced search & filters
🔄 Mobile responsive design
🔄 Performance optimization
