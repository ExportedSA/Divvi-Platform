#!/bin/bash

# Lendit Machinery Rentals - Database Setup Script
# Phase 0: Initial database setup and seeding

set -e

echo "🗄️ Setting up Lendit database..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is required"
    echo "💡 Set it in your .env file or Vercel environment variables"
    exit 1
fi

# Generate Prisma client
echo "📦 Generating Prisma client..."
npm run db:generate

# Deploy database schema (for production)
echo "🏗️ Deploying database schema..."
npm run db:deploy

# Seed policy content and initial data
echo "🌱 Seeding policy content..."
npm run db:seed

echo "✅ Database setup complete!"
echo "📊 Database includes:"
echo "   - User authentication schema"
echo "   - Listings and categories"
echo "   - Bookings and availability"
echo "   - Insurance and damage reporting"
echo "   - Policy content (Insurance, Owner, Renter responsibilities)"
echo ""
echo "🎯 Next steps:"
echo "   1. Test the application at your deployed URL"
echo "   2. Configure Stripe webhook endpoints"
echo "   3. Set up image storage (S3/Supabase)"
