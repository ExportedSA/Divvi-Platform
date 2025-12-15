# MachineryRentals

A production-ready machinery rental marketplace for New Zealand and Australia. Built with Next.js, TypeScript, Prisma, and PostgreSQL.

## Features

### Core Functionality
- **Two-sided marketplace**: Owners list machinery, renters search and book
- **Comprehensive listings**: Multi-step listing creation with photos, pricing, and availability
- **Booking system**: Request-based bookings with owner approval
- **Insurance & damage policies**: Clear terms and disclaimers surfaced throughout the platform
- **User authentication**: Secure email/password auth with NextAuth
- **Regional support**: NZ and Australia with appropriate regions and currencies
- **Admin dashboard**: User management, listing moderation, and content management

### User Roles
- **Anonymous visitors**: Browse and search listings
- **Renters**: Create bookings, leave reviews, manage rental history
- **Owners/Listers**: Create and manage listings, handle bookings, track revenue
- **Admins**: Moderate content, manage users, update policies

### Key Pages
- Home page with search and category browsing
- Browse/search with filters
- Listing details with availability calendar
- Multi-step listing creation flow
- User dashboard (bookings, listings, profile)
- Admin panel
- Static content pages (Insurance Policy, Terms, How It Works)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Validation**: Zod

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- PostgreSQL database (local or hosted)

### Installation

1. **Clone and navigate to the project**:
   ```bash
   cd C:\Users\GGPC\CascadeProjects\machinery-rentals
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/machinery_rentals?schema=public"
   
   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   
   # App
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

   **Generate NEXTAUTH_SECRET**:
   ```bash
   openssl rand -base64 32
   ```

4. **Set up the database**:
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # Seed with sample data
   npm run db:seed
   ```

5. **Run the development server**:
   ```bash
   npm run dev
   ```

6. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Sample Credentials

After seeding, you can log in with:

**Admin User**:
- Email: `admin@machineryrentals.com`
- Password: `admin123`

**Regular Users**:
- Email: `john@farm.co.nz` / Password: `password123`
- Email: `sarah@equipment.com.au` / Password: `password123`

## Project Structure

```
machinery-rentals/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed data
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   ├── browse/            # Browse/search pages
│   │   ├── listings/          # Listing management
│   │   ├── dashboard/         # User dashboard
│   │   ├── admin/             # Admin panel
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   ├── navigation.tsx     # Main navigation
│   │   └── providers.tsx      # Context providers
│   └── lib/
│       ├── auth.ts            # NextAuth configuration
│       ├── prisma.ts          # Prisma client
│       ├── utils.ts           # Utility functions
│       ├── validations.ts     # Zod schemas
│       └── constants.ts       # App constants
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## Database Schema

### Key Models
- **User**: Authentication and profile data
- **Listing**: Machinery listings with pricing and availability
- **ListingPhoto**: Photos associated with listings
- **Booking**: Rental bookings with status tracking
- **Review**: Ratings and reviews for completed rentals
- **StaticPage**: CMS for policy and informational pages

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Create and run migrations
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Prisma Studio
```

## Key Features Implementation

### Listing Creation Flow
Multi-step process with validation:
1. Basic details (title, category, specs)
2. Pricing & availability
3. Insurance & safety terms
4. Photos & media
5. Review & publish with explicit acknowledgements

### Insurance & Damage Policy
- Global policy page accessible from navigation
- Listing-level insurance type selection
- Explicit acknowledgement checkboxes on listing creation and booking
- Clear bond and excess information

### Booking Flow
1. Renter selects dates and views cost breakdown
2. Renter acknowledges insurance and damage terms
3. Owner receives notification and can accept/decline
4. Confirmed bookings appear in both dashboards

### Search & Discovery
- Keyword search across titles and descriptions
- Filter by category, region, country, price range
- Sort by relevance, date, price, rating
- Availability date filtering

## Extending the Platform

### Adding Payment Integration
The booking model is structured to support payment integration:
- Add Stripe/payment provider SDK
- Implement payment capture on booking confirmation
- Add webhook handlers for payment events
- Update booking status based on payment

### Adding Real-time Features
- Implement WebSocket or Server-Sent Events for notifications
- Add real-time booking updates
- Implement chat between owners and renters

### Adding Photo Upload
Currently uses placeholder URLs. To add real uploads:
- Integrate with cloud storage (AWS S3, Cloudinary, etc.)
- Add file upload API route
- Update listing creation form with file input
- Store URLs in ListingPhoto model

## Production Considerations

### Before Deploying
1. **Environment Variables**: Set all production env vars
2. **Database**: Use managed PostgreSQL (e.g., Supabase, Neon, AWS RDS)
3. **Authentication**: Review and harden NextAuth configuration
4. **Legal Content**: Replace placeholder policy text with proper legal terms
5. **Email**: Integrate email service for notifications
6. **Analytics**: Add analytics tracking
7. **Error Monitoring**: Integrate Sentry or similar
8. **Rate Limiting**: Add API rate limiting
9. **Image Optimization**: Configure Next.js image domains
10. **SEO**: Add metadata and sitemap

### Deployment Options
- **Vercel**: Easiest for Next.js (automatic deployments)
- **AWS/GCP/Azure**: Full control with container deployment
- **Railway/Render**: Simple managed hosting

### Security Checklist
- [ ] Use strong NEXTAUTH_SECRET in production
- [ ] Enable HTTPS only
- [ ] Implement CSRF protection
- [ ] Add input sanitization
- [ ] Rate limit API endpoints
- [ ] Implement proper error handling (don't expose internals)
- [ ] Regular security audits
- [ ] Keep dependencies updated

## Architecture Decisions

### Why Next.js App Router?
- Server components for better performance
- Built-in API routes
- File-based routing
- Excellent TypeScript support

### Why Prisma?
- Type-safe database access
- Excellent migrations
- Intuitive schema definition
- Great developer experience

### Why Request-based Bookings?
- Allows owner vetting of renters
- Flexibility for custom arrangements
- Easier to implement initially
- Can evolve to instant booking later

## Support & Contribution

This is a production-ready MVP. Key areas for enhancement:
- Real-time notifications
- Advanced search (Elasticsearch/Algolia)
- Mobile app (React Native/Expo)
- Payment processing integration
- Photo upload and management
- Messaging system
- Review moderation
- Advanced analytics

## License

This project is provided as-is for educational and commercial use.

## Contact

For questions or support, please open an issue or contact the development team.

---

**Built with ❤️ for the NZ & Australian agricultural community**
