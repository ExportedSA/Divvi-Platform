# Divvi Platform - Launch Readiness Definition

**Document Version:** 1.0  
**Date:** December 15, 2024  
**Status:** Draft  

---

## Executive Summary

This document defines the **Launch-Ready MVP** for the Divvi platform - a two-sided marketplace for farm machinery rentals across New Zealand and Australia. It establishes clear boundaries between required launch features and post-launch enhancements, along with non-functional requirements and explicit go/no-go criteria.

---

## 1. Required Features for Launch (MVP Scope)

### 1.1 Authentication & User Management

| Feature | Description | Status |
|---------|-------------|--------|
| ✅ User registration | Email/password signup with role selection | Built |
| ✅ User login/logout | Secure session management via NextAuth | Built |
| ✅ Password hashing | bcrypt with appropriate rounds | Built |
| ⚠️ Email verification | Verify email ownership before full access | **NOT BUILT** |
| ✅ User profile management | Edit name, contact, region | Built |
| ✅ Role system | RENTER, OWNER, ADMIN roles | Built |
| ⚠️ Password reset | Self-service password recovery | **NOT BUILT** |

### 1.2 Listing Management (Owner)

| Feature | Description | Status |
|---------|-------------|--------|
| ✅ Create listing | Multi-field form with validation | Built |
| ✅ Edit listing | Update all listing fields | Built |
| ✅ Soft delete listing | Mark as deleted without data loss | Built |
| ✅ Listing status workflow | DRAFT → PENDING_REVIEW → LIVE → PAUSED | Built |
| ⚠️ Photo upload | Upload and manage listing images | **NOT BUILT** |
| ✅ Pricing configuration | Daily/weekly rates, bond amount | Built |
| ✅ Insurance mode selection | Owner-provided, renter-provided, none | Built |
| ✅ Delivery options | Pickup only, delivery, or both | Built |
| ✅ Availability blocking | Mark dates as unavailable | Built |

### 1.3 Search & Discovery (Renter)

| Feature | Description | Status |
|---------|-------------|--------|
| ✅ Browse listings | View all live listings | Built |
| ✅ Search by keyword | Title, description, brand, model | Built |
| ✅ Filter by category | Tractor, harvester, loader, etc. | Built |
| ✅ Filter by location | Country and region | Built |
| ✅ Filter by price range | Min/max price per day | Built |
| ✅ Sort results | Newest, price ascending/descending | Built |
| ✅ Listing detail view | Full listing information | Built |

### 1.4 Booking Flow

| Feature | Description | Status |
|---------|-------------|--------|
| ✅ Date selection | Pick start and end dates | Built |
| ✅ Cost calculation | Rental + delivery + platform fee + bond | Built |
| ✅ Policy acknowledgements | Accept platform and owner terms | Built |
| ✅ Booking request submission | Create pending booking | Built |
| ✅ Owner approval/decline | Accept or reject booking requests | Built |
| ⚠️ Payment processing | Collect payment on acceptance | **NOT BUILT** |
| ⚠️ Bond authorization | Hold bond amount on card | **NOT BUILT** |
| ✅ Booking status tracking | View booking state | Built |

### 1.5 Dashboard

| Feature | Description | Status |
|---------|-------------|--------|
| ✅ Renter dashboard | View my bookings | Built |
| ✅ Owner dashboard | View my listings, incoming bookings | Built |
| ✅ Booking management | Accept/decline/cancel bookings | Built |
| ✅ Listing management | View and edit my listings | Built |

### 1.6 Admin Capabilities

| Feature | Description | Status |
|---------|-------------|--------|
| ⚠️ Admin dashboard | Central admin interface | **PARTIAL** |
| ✅ User management schema | Suspend users, view details | Schema only |
| ✅ Listing moderation schema | Hide/remove listings | Schema only |
| ⚠️ Admin UI | Functional admin pages | **NOT BUILT** |

### 1.7 Static Content

| Feature | Description | Status |
|---------|-------------|--------|
| ✅ Home page | Hero, search, categories, CTA | Built |
| ✅ How It Works page | User education | Built |
| ✅ Insurance & Damage Policy | Legal/policy content | Built |
| ✅ Terms of Service | Legal terms | Built |
| ✅ Footer with links | Navigation and legal links | Built |

### 1.8 Security (CRITICAL)

| Feature | Description | Status |
|---------|-------------|--------|
| ⚠️ Secure secrets management | No secrets in repo | **NOT DONE** |
| ⚠️ Production NEXTAUTH_SECRET | Cryptographic random secret | **NOT DONE** |
| ⚠️ API route protection | Security middleware applied | **NOT DONE** |
| ⚠️ Production rate limiting | Redis-based rate limiting | **NOT DONE** |
| ✅ Input validation | Zod schemas for all inputs | Built |
| ✅ SQL injection protection | Prisma parameterized queries | Built |
| ✅ XSS protection | Input sanitization | Built |
| ✅ CSRF protection | NextAuth built-in | Built |

---

## 2. Excluded Features (Post-Launch)

The following features are **explicitly out of scope** for MVP launch:

### 2.1 Deferred to Phase 2 (1-3 months post-launch)

| Feature | Rationale |
|---------|-----------|
| **Real-time messaging** | Can use email notifications initially |
| **In-app notifications** | Email sufficient for MVP |
| **Review system UI** | Schema exists, UI can follow |
| **Advanced search (Algolia)** | Basic search sufficient for launch volume |
| **Handover checklists** | Manual process acceptable initially |
| **Dispute resolution UI** | Handle manually via support |
| **Owner earnings dashboard** | Basic booking view sufficient |
| **Referral program UI** | Schema exists, activate post-launch |
| **Promotion codes UI** | Schema exists, activate post-launch |

### 2.2 Deferred to Phase 3 (3-6 months post-launch)

| Feature | Rationale |
|---------|-----------|
| **Mobile app** | Responsive web is MVP |
| **White-label / B2B portal** | Schema exists, enterprise feature |
| **Smart pricing suggestions** | Requires usage data |
| **Utilisation analytics** | Requires historical data |
| **SEO landing pages** | Schema exists, content marketing phase |
| **Multi-language support** | English only for NZ/AU launch |

### 2.3 Not Planned

| Feature | Rationale |
|---------|-----------|
| **Instant booking** | Request-based model is intentional |
| **Equipment delivery tracking** | Out of platform scope |
| **Insurance brokerage** | Legal complexity, owner/renter responsibility |
| **Financing options** | Partnership required |

---

## 3. Non-Functional Requirements (NFRs)

### 3.1 Performance

| Requirement | Target | Measurement |
|-------------|--------|-------------|
| **Page load time** | < 3 seconds (LCP) | Lighthouse |
| **Time to Interactive** | < 5 seconds | Lighthouse |
| **API response time** | < 500ms (p95) | Vercel Analytics |
| **Database query time** | < 100ms (p95) | Prisma metrics |
| **Concurrent users** | 100 simultaneous | Load testing |

### 3.2 Security

| Requirement | Target | Verification |
|-------------|--------|--------------|
| **HTTPS only** | Enforced | Vercel default |
| **Secrets management** | No secrets in repo | Manual audit |
| **Authentication** | Secure session tokens | NextAuth config |
| **Authorization** | Role-based access control | Middleware check |
| **Rate limiting** | Auth: 5/15min, API: 100/15min | Redis implementation |
| **Input validation** | All user inputs validated | Zod schemas |
| **SQL injection** | Prevented | Prisma ORM |
| **XSS** | Prevented | React escaping + sanitization |
| **CSRF** | Prevented | NextAuth tokens |
| **Security headers** | HSTS, X-Frame-Options, CSP | Middleware |

### 3.3 Reliability

| Requirement | Target | Measurement |
|-------------|--------|-------------|
| **Uptime** | 99.5% | Vercel status |
| **Error rate** | < 1% of requests | Sentry |
| **Database availability** | 99.9% | Neon SLA |
| **Backup frequency** | Daily | Neon automatic |
| **Recovery time objective** | < 4 hours | Documented procedure |

### 3.4 Scalability

| Requirement | Target | Notes |
|-------------|--------|-------|
| **Users** | 1,000 registered | MVP target |
| **Listings** | 500 active | MVP target |
| **Bookings** | 100/month | MVP target |
| **Database size** | < 1GB | Neon free tier |
| **File storage** | < 10GB | Cloud storage |

### 3.5 Compliance

| Requirement | Status | Notes |
|-------------|--------|-------|
| **Privacy Policy** | Required | Must be published |
| **Terms of Service** | Required | Must be published |
| **Cookie consent** | Required | For analytics |
| **NZ Privacy Act 2020** | Required | Data handling compliance |
| **AU Privacy Act 1988** | Required | Data handling compliance |

---

## 4. Go/No-Go Criteria

### 4.1 MUST PASS (Launch Blockers)

All of the following **must be true** to proceed with launch:

#### Security Checklist
- [ ] **SEC-1**: `NEXTAUTH_SECRET` is a cryptographically random 32+ byte value
- [ ] **SEC-2**: No secrets (database URLs, API keys) committed to repository
- [ ] **SEC-3**: All environment variables configured in Vercel dashboard
- [ ] **SEC-4**: Security middleware (`withSecurity()`) applied to all API routes
- [ ] **SEC-5**: Rate limiting implemented with Redis (not in-memory)
- [ ] **SEC-6**: HTTPS enforced (Vercel default)

#### Core Functionality Checklist
- [ ] **FUNC-1**: Users can register and log in
- [ ] **FUNC-2**: Email verification flow operational
- [ ] **FUNC-3**: Password reset flow operational
- [ ] **FUNC-4**: Owners can create listings with photos
- [ ] **FUNC-5**: Renters can search and view listings
- [ ] **FUNC-6**: Renters can submit booking requests
- [ ] **FUNC-7**: Owners can accept/decline bookings
- [ ] **FUNC-8**: Payment processing operational (Stripe)
- [ ] **FUNC-9**: Bond authorization operational (Stripe)

#### Content Checklist
- [ ] **CONT-1**: Privacy Policy published and linked
- [ ] **CONT-2**: Terms of Service published and linked
- [ ] **CONT-3**: Insurance & Damage Policy finalized (legal review)
- [ ] **CONT-4**: All placeholder content replaced
- [ ] **CONT-5**: "Lendit" renamed to "Divvi" throughout

#### Quality Checklist
- [ ] **QA-1**: No critical bugs in core user flows
- [ ] **QA-2**: Mobile responsive design verified
- [ ] **QA-3**: Cross-browser testing passed (Chrome, Safari, Firefox)
- [ ] **QA-4**: Error monitoring configured (Sentry)
- [ ] **QA-5**: Production database seeded with test data removed

### 4.2 SHOULD PASS (Launch Warnings)

The following are **strongly recommended** but not absolute blockers:

- [ ] **WARN-1**: Admin dashboard functional for user/listing moderation
- [ ] **WARN-2**: Email notifications for booking status changes
- [ ] **WARN-3**: Lighthouse performance score > 80
- [ ] **WARN-4**: Integration tests passing
- [ ] **WARN-5**: Analytics configured (Vercel Analytics or GA)

### 4.3 Decision Matrix

| Criteria Category | Pass Threshold | Current Status |
|-------------------|----------------|----------------|
| **Security (SEC-*)** | 6/6 must pass | 🔴 0/6 |
| **Functionality (FUNC-*)** | 9/9 must pass | 🟡 7/9 |
| **Content (CONT-*)** | 5/5 must pass | 🟡 3/5 |
| **Quality (QA-*)** | 5/5 must pass | 🔴 1/5 |
| **Warnings (WARN-*)** | 3/5 recommended | 🔴 0/5 |

### 4.4 Launch Decision

| Status | Meaning |
|--------|---------|
| 🟢 **GO** | All MUST PASS criteria met, 3+ warnings addressed |
| 🟡 **CONDITIONAL GO** | All MUST PASS criteria met, <3 warnings addressed |
| 🔴 **NO-GO** | Any MUST PASS criteria not met |

**Current Status: 🔴 NO-GO**

---

## 5. MVP Launch Checklist Summary

### Pre-Launch (T-2 weeks)

- [ ] Complete all Phase 1 security hardening
- [ ] Implement Stripe payment integration
- [ ] Implement file upload for listing photos
- [ ] Implement email verification
- [ ] Implement password reset
- [ ] Build basic admin dashboard
- [ ] Rename "Lendit" → "Divvi" throughout codebase

### Pre-Launch (T-1 week)

- [ ] Legal review of Terms and Policies
- [ ] End-to-end testing of all user flows
- [ ] Load testing (100 concurrent users)
- [ ] Security audit (manual penetration testing)
- [ ] Configure production environment variables
- [ ] Set up error monitoring (Sentry)
- [ ] Set up analytics

### Launch Day (T-0)

- [ ] Final go/no-go decision meeting
- [ ] Deploy to production
- [ ] Smoke test all critical paths
- [ ] Monitor error rates and performance
- [ ] Support team briefed and ready

### Post-Launch (T+1 week)

- [ ] Daily monitoring of errors and performance
- [ ] User feedback collection
- [ ] Bug triage and hotfix process
- [ ] Phase 2 planning kickoff

---

## 6. Appendix: Feature Priority Matrix

| Feature | User Value | Technical Effort | Launch Priority |
|---------|------------|------------------|-----------------|
| Payment processing | Critical | High | **P0 - Blocker** |
| Photo upload | Critical | Medium | **P0 - Blocker** |
| Email verification | High | Low | **P0 - Blocker** |
| Security hardening | Critical | Medium | **P0 - Blocker** |
| Password reset | High | Low | **P0 - Blocker** |
| Admin dashboard | Medium | Medium | **P1 - Required** |
| Email notifications | Medium | Medium | **P1 - Required** |
| Review system | Medium | Medium | **P2 - Post-launch** |
| Real-time messaging | Medium | High | **P2 - Post-launch** |
| Mobile app | High | Very High | **P3 - Future** |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-15 | Architecture Audit | Initial definition |

---

**Next Steps:** Address all 🔴 NO-GO items before scheduling launch date.
