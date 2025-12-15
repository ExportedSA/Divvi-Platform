# Divvi Platform - Security Audit Report

**Document Version:** 1.0  
**Audit Date:** December 15, 2024  
**Auditor Role:** Security Engineer  
**Classification:** Internal - Confidential  

---

## Executive Summary

This security audit evaluates the Divvi platform against industry-standard security frameworks including OWASP Top 10 (2021), authentication best practices, API security guidelines, and data protection requirements. The audit identifies **5 critical**, **8 high**, **6 medium**, and **4 low** severity findings that must be addressed before production launch.

**Overall Security Posture: 🔴 NOT READY FOR PRODUCTION**

---

## 1. OWASP Top 10 (2021) Assessment

### A01:2021 - Broken Access Control

| Finding | Severity | Status |
|---------|----------|--------|
| **BAC-01**: Security middleware exists but not applied to API routes | 🔴 CRITICAL | VULNERABLE |
| **BAC-02**: No Next.js middleware.ts for route-level protection | 🟠 HIGH | VULNERABLE |
| **BAC-03**: Admin routes lack server-side role verification | 🟠 HIGH | VULNERABLE |
| **BAC-04**: Listing GET endpoint exposes all listings without ownership check | 🟢 LOW | By Design (public) |

**Evidence (BAC-01):**
```typescript
// src/lib/security-middleware.ts - EXISTS but NOT USED
export const securityConfigs = {
  authenticated: new SecurityMiddleware({ requireAuth: true, ... }),
  adminOnly: new SecurityMiddleware({ requireAuth: true, requireRole: ['ADMIN'], ... }),
}

// src/app/api/listings/route.ts - NO SECURITY MIDDLEWARE APPLIED
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)  // Manual check only
  // ...
}
```

**Evidence (BAC-02):**
- No `middleware.ts` file exists at project root or `src/` directory
- Route protection relies entirely on per-page `getServerSession()` checks
- Missing routes can be accessed without authentication

**Evidence (BAC-03):**
- Navigation shows admin link based on client-side role check: `(session.user as any)?.role === 'ADMIN'`
- No `/admin` route files found - admin functionality incomplete
- Client-side role checks can be bypassed

---

### A02:2021 - Cryptographic Failures

| Finding | Severity | Status |
|---------|----------|--------|
| **CF-01**: NEXTAUTH_SECRET is placeholder value | 🔴 CRITICAL | VULNERABLE |
| **CF-02**: Database credentials committed to repository | 🔴 CRITICAL | VULNERABLE |
| **CF-03**: Password hashing uses bcrypt with cost factor 12 | 🟢 PASS | SECURE |
| **CF-04**: No encryption at rest for PII fields | 🟡 MEDIUM | VULNERABLE |

**Evidence (CF-01):**
```
# .env file contains:
NEXTAUTH_SECRET=your-secret-key-here-generate-with-openssl-rand-base64-32
```
This placeholder secret allows session token prediction and forgery.

**Evidence (CF-02):**
```
# .env file contains production database URL:
DATABASE_URL=postgresql://neondb_owner:npg_wRIMj1HvBiX6@ep-green-math-a7b1c96x-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require
```
Database credentials are exposed in the repository.

**Evidence (CF-03):**
```typescript
// src/app/api/auth/register/route.ts
const passwordHash = await bcrypt.hash(password, 12)  // Cost factor 12 is acceptable
```

---

### A03:2021 - Injection

| Finding | Severity | Status |
|---------|----------|--------|
| **INJ-01**: SQL injection prevented by Prisma ORM | 🟢 PASS | SECURE |
| **INJ-02**: NoSQL injection N/A (PostgreSQL only) | 🟢 PASS | N/A |
| **INJ-03**: Command injection N/A (no shell execution) | 🟢 PASS | N/A |
| **INJ-04**: XSS via user input in listings | 🟡 MEDIUM | PARTIAL |

**Evidence (INJ-01):**
```typescript
// All database queries use Prisma parameterized queries
const listing = await prisma.listing.findUnique({
  where: { id: params.id },  // Parameterized, safe from SQL injection
})
```

**Evidence (INJ-04):**
```typescript
// src/lib/rate-limit.ts - Basic sanitization exists
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input
      .replace(/[<>]/g, '')  // Only removes < and > characters
      .trim()
      .substring(0, 10000)
  }
  // ...
}
```
Sanitization is minimal - does not handle all XSS vectors (event handlers, javascript: URLs, etc.)

---

### A04:2021 - Insecure Design

| Finding | Severity | Status |
|---------|----------|--------|
| **ID-01**: No email verification before account activation | 🟠 HIGH | VULNERABLE |
| **ID-02**: No password reset functionality | 🟠 HIGH | MISSING |
| **ID-03**: No account lockout after failed login attempts | 🟠 HIGH | VULNERABLE |
| **ID-04**: Booking flow lacks payment before confirmation | 🟡 MEDIUM | INCOMPLETE |

**Evidence (ID-01):**
```typescript
// src/app/api/auth/register/route.ts
const user = await prisma.user.create({
  data: {
    // ...
    // isEmailVerified defaults to false but no verification flow exists
  },
})
// User can immediately log in without email verification
```

**Evidence (ID-03):**
```typescript
// src/lib/auth.ts - No lockout mechanism
async authorize(credentials) {
  // No tracking of failed attempts
  // No lockout after N failures
  if (!isCorrectPassword) {
    throw new Error("Invalid credentials")  // Just returns error
  }
}
```

---

### A05:2021 - Security Misconfiguration

| Finding | Severity | Status |
|---------|----------|--------|
| **SM-01**: CSP allows 'unsafe-inline' and 'unsafe-eval' | 🟡 MEDIUM | VULNERABLE |
| **SM-02**: Image domains allow wildcard '**' | 🟡 MEDIUM | VULNERABLE |
| **SM-03**: CORS allows localhost in production config | 🟢 LOW | DEV ONLY |
| **SM-04**: Debug/verbose error messages in API responses | 🟢 LOW | ACCEPTABLE |

**Evidence (SM-01):**
```typescript
// src/lib/rate-limit.ts
response.headers.set(
  'Content-Security-Policy',
  "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; ..."
)
```

**Evidence (SM-02):**
```javascript
// next.config.js
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '**',  // Allows ANY hostname - security risk
    },
  ],
},
```

---

### A06:2021 - Vulnerable and Outdated Components

| Finding | Severity | Status |
|---------|----------|--------|
| **VOC-01**: Dependencies appear reasonably current | 🟢 PASS | ACCEPTABLE |
| **VOC-02**: No automated dependency scanning configured | 🟡 MEDIUM | MISSING |

**Evidence:**
```json
// package.json - Key dependencies
"next": "^14.2.33",        // Current
"next-auth": "^4.24.5",    // Current
"@prisma/client": "^5.22.0", // Current
"bcryptjs": "^2.4.3",      // Current
```

**Recommendation:** Add `npm audit` to CI/CD pipeline and consider Dependabot/Snyk.

---

### A07:2021 - Identification and Authentication Failures

| Finding | Severity | Status |
|---------|----------|--------|
| **IAF-01**: Rate limiting is in-memory only | 🔴 CRITICAL | VULNERABLE |
| **IAF-02**: No MFA/2FA support | 🟡 MEDIUM | MISSING |
| **IAF-03**: Session tokens use JWT with proper signing | 🟢 PASS | SECURE |
| **IAF-04**: Password policy enforced (8+ chars) | 🟢 PASS | MINIMAL |

**Evidence (IAF-01):**
```typescript
// src/lib/rate-limit.ts
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
// In-memory storage - resets on server restart, not shared across instances
```

**Evidence (IAF-04):**
```typescript
// src/lib/validations.ts
password: z.string().min(8, 'Password must be at least 8 characters'),
// No complexity requirements (uppercase, numbers, special chars)
```

---

### A08:2021 - Software and Data Integrity Failures

| Finding | Severity | Status |
|---------|----------|--------|
| **SDIF-01**: No subresource integrity (SRI) for CDN assets | 🟢 LOW | ACCEPTABLE |
| **SDIF-02**: CI/CD pipeline not audited | 🟢 LOW | OUT OF SCOPE |

---

### A09:2021 - Security Logging and Monitoring Failures

| Finding | Severity | Status |
|---------|----------|--------|
| **SLM-01**: Comprehensive audit logging exists | 🟢 PASS | GOOD |
| **SLM-02**: No centralized log aggregation | 🟡 MEDIUM | MISSING |
| **SLM-03**: No alerting on security events | 🟡 MEDIUM | MISSING |
| **SLM-04**: No Sentry/error monitoring configured | 🟡 MEDIUM | MISSING |

**Evidence (SLM-01):**
```typescript
// src/lib/audit.ts - Good audit logging implementation
export async function createAuditLog(params: AuditLogParams) {
  // Captures: action, actor, target, IP, user agent, previous/new values
}
```

---

### A10:2021 - Server-Side Request Forgery (SSRF)

| Finding | Severity | Status |
|---------|----------|--------|
| **SSRF-01**: No user-controlled URL fetching identified | 🟢 PASS | N/A |

---

## 2. Authentication & Session Handling Risks

### 2.1 Session Configuration

| Aspect | Current State | Risk Level |
|--------|---------------|------------|
| Session strategy | JWT | 🟢 Acceptable |
| Token storage | HTTP-only cookie (NextAuth default) | 🟢 Secure |
| Token expiration | Default (30 days) | 🟡 Consider reducing |
| Secret strength | **PLACEHOLDER VALUE** | 🔴 CRITICAL |
| Session invalidation | Not implemented | 🟡 Medium |

### 2.2 Authentication Flow Vulnerabilities

| Vulnerability | Description | Severity |
|---------------|-------------|----------|
| **AUTH-01** | No brute force protection | 🔴 CRITICAL |
| **AUTH-02** | No email verification | 🟠 HIGH |
| **AUTH-03** | No password reset flow | 🟠 HIGH |
| **AUTH-04** | No session revocation on password change | 🟡 MEDIUM |
| **AUTH-05** | Generic error messages (good for security) | 🟢 PASS |

**Brute Force Attack Vector:**
```
POST /api/auth/callback/credentials
- No rate limiting applied to NextAuth endpoint
- No account lockout mechanism
- Attacker can attempt unlimited password guesses
```

### 2.3 Authorization Gaps

| Gap | Description | Impact |
|-----|-------------|--------|
| **AUTHZ-01** | Role checks are client-side in navigation | UI bypass possible |
| **AUTHZ-02** | No middleware.ts for route protection | Unprotected routes accessible |
| **AUTHZ-03** | Security middleware exists but unused | All protections ineffective |
| **AUTHZ-04** | Admin functionality incomplete | Cannot moderate platform |

---

## 3. API Exposure & Access Control

### 3.1 API Endpoint Inventory

| Endpoint | Method | Auth Required | Rate Limited | Validation |
|----------|--------|---------------|--------------|------------|
| `/api/auth/[...nextauth]` | GET/POST | No | ❌ NO | NextAuth |
| `/api/auth/register` | POST | No | ❌ NO | Partial |
| `/api/listings` | GET | No | ❌ NO | Yes |
| `/api/listings` | POST | Yes | ❌ NO | Yes |
| `/api/listings/[id]` | GET | No | ❌ NO | Yes |
| `/api/listings/[id]` | PUT | Yes | ❌ NO | Yes |
| `/api/listings/[id]` | DELETE | Yes | ❌ NO | Yes |
| `/api/user/upgrade-to-owner` | POST | Yes | ❌ NO | Unknown |

### 3.2 API Security Issues

| Issue | Description | Severity |
|-------|-------------|----------|
| **API-01** | No rate limiting on any endpoint | 🔴 CRITICAL |
| **API-02** | No API versioning | 🟢 LOW |
| **API-03** | Verbose error messages in development | 🟢 LOW |
| **API-04** | No request size limits enforced | 🟡 MEDIUM |
| **API-05** | No API key authentication for external access | 🟢 N/A (no external API) |

### 3.3 Input Validation Assessment

| Endpoint | Validation Status | Issues |
|----------|-------------------|--------|
| Registration | Partial | No password complexity, no email format server-side |
| Listing creation | Good | Zod schema validation |
| Booking creation | Good | Comprehensive Zod schema |
| Search/filters | Partial | Type coercion but no sanitization |

**Evidence - Registration lacks server-side email validation:**
```typescript
// src/app/api/auth/register/route.ts
const { email, password, name, farmName, phone, region, country } = body

// Validate required fields - no email format validation
if (!email || !password || !name || !region || !country) {
  return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
}
```

---

## 4. Data Handling Assessment

### 4.1 PII Inventory

| Data Type | Storage Location | Encrypted | Retention Policy |
|-----------|------------------|-----------|------------------|
| Email addresses | `users.email` | ❌ No | None defined |
| Password hashes | `users.password` | ✅ bcrypt | N/A |
| Phone numbers | `users.phone` | ❌ No | None defined |
| Driver licence numbers | `users.driverLicenceNumber` | ❌ No | None defined |
| GST/ABN numbers | `users.gstNumber` | ❌ No | None defined |
| Physical addresses | `listings.pickupAddress` | ❌ No | None defined |
| Bank account details | `owner_payout_accounts` | ❌ No (Stripe refs only) | N/A |

### 4.2 Document/Upload Handling

| Issue | Description | Severity |
|-------|-------------|----------|
| **DOC-01** | No file upload implementation | 🟠 HIGH (missing feature) |
| **DOC-02** | Verification documents stored as URLs only | 🟡 MEDIUM |
| **DOC-03** | No file type validation | 🟠 HIGH (when implemented) |
| **DOC-04** | No malware scanning | 🟠 HIGH (when implemented) |
| **DOC-05** | No signed URLs for document access | 🟡 MEDIUM |

### 4.3 Data Exposure Risks

| Risk | Description | Mitigation |
|------|-------------|------------|
| **EXP-01** | Owner details exposed in listing response | Intentional - public profile |
| **EXP-02** | User IDs exposed in API responses | Use UUIDs (current) - acceptable |
| **EXP-03** | No field-level access control | Implement response filtering |
| **EXP-04** | Audit logs contain PII | Restrict admin access |

---

## 5. Mandatory Fixes Before Launch

### 🔴 CRITICAL (Must Fix - Launch Blockers)

| ID | Finding | Remediation | Effort |
|----|---------|-------------|--------|
| **FIX-C1** | Placeholder NEXTAUTH_SECRET | Generate with `openssl rand -base64 32`, store in Vercel env vars only | 1 hour |
| **FIX-C2** | Database credentials in repo | Remove from `.env`, add to `.gitignore`, rotate credentials, use Vercel env vars | 2 hours |
| **FIX-C3** | In-memory rate limiting | Implement Redis-based rate limiting (Upstash recommended) | 4 hours |
| **FIX-C4** | Security middleware not applied | Apply `withSecurity()` to all API routes | 4 hours |
| **FIX-C5** | No brute force protection | Implement account lockout after 5 failed attempts | 4 hours |

### 🟠 HIGH (Must Fix - Pre-Launch)

| ID | Finding | Remediation | Effort |
|----|---------|-------------|--------|
| **FIX-H1** | No email verification | Implement email verification flow with token | 1 day |
| **FIX-H2** | No password reset | Implement password reset with secure token | 1 day |
| **FIX-H3** | No Next.js middleware | Create `middleware.ts` for route protection | 4 hours |
| **FIX-H4** | No account lockout | Track failed attempts, lock after threshold | 4 hours |
| **FIX-H5** | Admin routes unprotected | Implement server-side admin verification | 4 hours |
| **FIX-H6** | Wildcard image domains | Restrict to specific trusted domains | 1 hour |
| **FIX-H7** | No file upload security | Implement with type validation, size limits, malware scan | 2 days |
| **FIX-H8** | Registration lacks validation | Add Zod schema validation to registration endpoint | 2 hours |

### 🟡 MEDIUM (Should Fix - Post-Launch OK)

| ID | Finding | Remediation | Effort |
|----|---------|-------------|--------|
| **FIX-M1** | CSP allows unsafe-inline | Refactor to use nonces or hashes | 1 day |
| **FIX-M2** | No centralized logging | Integrate with logging service (Axiom, Logtail) | 4 hours |
| **FIX-M3** | No error monitoring | Integrate Sentry | 2 hours |
| **FIX-M4** | No dependency scanning | Add npm audit to CI, consider Snyk | 2 hours |
| **FIX-M5** | Weak password policy | Require uppercase, number, special char | 2 hours |
| **FIX-M6** | No MFA support | Implement TOTP-based 2FA | 2 days |

---

## 6. Recommended Security Tooling

### 6.1 Rate Limiting

**Recommended: Upstash Redis + @upstash/ratelimit**

```typescript
// Recommended implementation
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
});
```

**Configuration:**
| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Authentication | 5 requests | 15 minutes |
| API (authenticated) | 100 requests | 15 minutes |
| API (public) | 30 requests | 15 minutes |
| File upload | 10 requests | 1 hour |

### 6.2 Security Headers

**Recommended: Next.js middleware + helmet-style headers**

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Strict CSP (production)
  response.headers.set('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self'; " +
    "style-src 'self' 'unsafe-inline'; " +  // Tailwind requires unsafe-inline
    "img-src 'self' data: https://your-cdn.com; " +
    "font-src 'self'; " +
    "connect-src 'self' https://api.stripe.com; " +
    "frame-ancestors 'none';"
  );
  
  return response;
}
```

### 6.3 Authentication Middleware

**Recommended: Centralized Next.js middleware**

```typescript
// middleware.ts
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/api/listings/:path*',
    '/api/bookings/:path*',
    '/api/user/:path*',
  ],
};

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  
  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }
  
  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!token || token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  return NextResponse.next();
}
```

### 6.4 Monitoring & Alerting

| Tool | Purpose | Priority |
|------|---------|----------|
| **Sentry** | Error tracking, performance monitoring | HIGH |
| **Vercel Analytics** | Web vitals, user analytics | MEDIUM |
| **Upstash Redis** | Rate limiting, session store | HIGH |
| **Axiom/Logtail** | Log aggregation | MEDIUM |
| **Snyk/Dependabot** | Dependency vulnerability scanning | MEDIUM |

### 6.5 File Upload Security (When Implemented)

**Recommended Stack:**
- **Storage:** AWS S3 or Cloudinary
- **Validation:** file-type package for magic number validation
- **Scanning:** ClamAV or cloud-based scanning
- **Access:** Signed URLs with expiration

```typescript
// Recommended file upload validation
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

async function validateUpload(file: File) {
  // Check file size
  if (file.size > MAX_SIZE) throw new Error('File too large');
  
  // Check MIME type (from magic numbers, not extension)
  const fileType = await fileTypeFromBuffer(await file.arrayBuffer());
  if (!fileType || !ALLOWED_TYPES.includes(fileType.mime)) {
    throw new Error('Invalid file type');
  }
  
  return true;
}
```

---

## 7. Security Checklist for Launch

### Pre-Launch Security Gate

- [ ] **SEC-01**: NEXTAUTH_SECRET is cryptographically random (32+ bytes)
- [ ] **SEC-02**: No secrets in repository (verified with git-secrets or similar)
- [ ] **SEC-03**: Database credentials rotated and stored in Vercel only
- [ ] **SEC-04**: Rate limiting implemented with Redis
- [ ] **SEC-05**: Security middleware applied to all API routes
- [ ] **SEC-06**: Next.js middleware.ts protecting routes
- [ ] **SEC-07**: Email verification flow operational
- [ ] **SEC-08**: Password reset flow operational
- [ ] **SEC-09**: Account lockout after failed attempts
- [ ] **SEC-10**: Admin routes server-side protected
- [ ] **SEC-11**: Image domains restricted in next.config.js
- [ ] **SEC-12**: Error monitoring configured (Sentry)
- [ ] **SEC-13**: Security headers verified (securityheaders.com)
- [ ] **SEC-14**: HTTPS enforced (Vercel default)
- [ ] **SEC-15**: Privacy Policy and Terms published

---

## 8. Appendix: Vulnerability Summary

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 Critical | 5 | Must fix before launch |
| 🟠 High | 8 | Must fix before launch |
| 🟡 Medium | 6 | Should fix, post-launch acceptable |
| 🟢 Low | 4 | Optional improvements |
| **Total** | **23** | |

### Critical Findings Summary

1. **NEXTAUTH_SECRET placeholder** - Session hijacking risk
2. **Database credentials exposed** - Full data breach risk
3. **In-memory rate limiting** - DDoS and brute force vulnerability
4. **Security middleware unused** - All API protections ineffective
5. **No brute force protection** - Account takeover risk

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-15 | Security Engineer | Initial audit |

---

**Classification:** Internal - Confidential  
**Distribution:** Development Team, Security Team, Product Owner  
**Next Review:** Prior to production deployment
