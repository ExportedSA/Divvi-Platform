#!/bin/bash

# Lendit Machinery Rentals - Deployment Script
# Phase 0: Basic deployment to Vercel

set -e

echo "🚀 Starting Lendit deployment..."

# Check if required tools are installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

if ! command -v prisma &> /dev/null; then
    echo "❌ Prisma CLI not found. Installing..."
    npm install -g prisma
fi

# Generate Prisma client
echo "📦 Generating Prisma client..."
npm run db:generate

# Run type checking
echo "🔍 Running type check..."
npm run type-check

# Run linting
echo "🧹 Running linter..."
npm run lint

# Build the application
echo "🏗️ Building application..."
npm run build

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo "📝 Next steps:"
echo "   1. Set up production database (Neon/Supabase/RDS)"
echo "   2. Run database migrations: npm run db:deploy"
echo "   3. Seed policy content: npm run db:seed"
echo "   4. Configure Stripe webhook endpoints"
