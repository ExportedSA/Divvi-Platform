# Divvi Platform — Launch Tasks 1.0-2.4 Breakdown

**Generated:** December 19, 2025  
**Status:** Pre-Launch Audit

---

## Summary

| Section | Task | Status | Blocker Level |
|---------|------|--------|---------------|
| 1.1 | Production Build Check | 🔴 BLOCKED | **CRITICAL** |
| 1.2 | Environment Variable Audit | ✅ COMPLETE | None |
| 2.1 | Switch Stripe to Live Mode | ⬜ MANUAL | None |
| 2.2 | Configure Production Webhook | ⬜ MANUAL | None |
| 2.3 | Stripe Connect Settings | ⬜ MANUAL | None |
| 2.4 | Live $1 Smoke Test | 🔴 BLOCKED | **CRITICAL** |

---

## 1.1 Production Build Check

### Status: 🔴 BLOCKED

**Command:** `npm run build`

### Issues Found

| File | Issue | Status |
|------|-------|--------|
| `src/lib/observability.ts` | Missing file | ✅ FIXED - Created |
| `src/lib/booking/booking-service.ts` | `type` → `handoverType`, `succeeded` → `SUCCEEDED` | ✅ FIXED |
| `src/lib/cache/index.ts` | Set iteration error | ✅ FIXED |
| `src/lib/db/query-utils.ts` | `slug`, `primaryImageUrl`, `ACTIVE` → `LIVE` | ✅ FIXED |
| `src/lib/observability/sanitize.ts` | Type casting | ✅ FIXED |
| `src/lib/payments/payout-service.ts` | `completedAt`, `ownerPayoutAccount`, AuditAction | ✅ FIXED |
| `src/lib/payments/stripe-service.ts` | API version | ✅ FIXED → `2025-11-17.clover` |
| `src/lib/payments/webhook-handler.ts` | `DISPUTE_CREATED` AuditAction | ✅ FIXED |
| `src/lib/search/search-service.ts` | `slug`, `primaryImageUrl`, `availabilityBlocks` | 🔴 **NEEDS FIX** |
| `src/lib/payments/webhook-handler.ts` | `prisma.webhookEvent` not recognized | 🔴 **NEEDS FIX** |

### Remaining Build Errors

1. **`search-service.ts`** — Multiple schema mismatches:
   - `slug` field doesn't exist on Listing
   - `primaryImageUrl` field doesn't exist on Listing
   - `availabilityBlocks` should be `availability`
   - `INCLUDED` is not a valid InsuranceMode
   - `availabilityBlock` model doesn't exist

2. **`webhook-handler.ts`** — TypeScript not recognizing `webhookEvent` model
   - Model exists in schema but TS cache may be stale
   - Try: Restart TS server or `npx prisma generate`

### Action Required

```bash
# 1. Fix search-service.ts schema mismatches
# 2. Regenerate Prisma client
npx prisma generate

# 3. Restart TypeScript server in IDE

# 4. Run build again
npm run build
```

---

## 1.2 Environment Variable Audit

### Status: ✅ COMPLETE

All required variables are documented in `.env.example`.

### Production Environment Variables (Vercel)

| Variable | Required | Status |
|----------|----------|--------|
| `DATABASE_URL` | ✅ | Documented |
| `NEXTAUTH_SECRET` | ✅ | Documented |
| `NEXTAUTH_URL` | ✅ | Documented |
| `STRIPE_SECRET_KEY` | ✅ | Documented |
| `STRIPE_WEBHOOK_SECRET` | ✅ | Documented |
| `STRIPE_CONNECT_CLIENT_ID` | ✅ | ✅ **ADDED** |
| `STRIPE_API_VERSION` | ✅ | ✅ **ADDED** |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ | Documented |
| `NEXT_PUBLIC_APP_URL` | ✅ | Documented |

### Action Required

- [ ] Set all variables in Vercel Production environment
- [ ] Generate `NEXTAUTH_SECRET` with `openssl rand -base64 32`
- [ ] Use **LIVE** Stripe keys for production

---

## 2.1 Switch Stripe to Live Mode

### Status: ⬜ MANUAL TASK

### Steps

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Toggle to **Live mode** (top-right)
3. Navigate to **Developers → API Keys**
4. Copy:
   - Live Secret Key (`sk_live_...`)
   - Live Publishable Key (`pk_live_...`)
5. Set in Vercel Production environment

### Action Required

- [ ] Toggle Stripe to Live mode
- [ ] Copy Live Secret Key → `STRIPE_SECRET_KEY`
- [ ] Copy Live Publishable Key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] Keep test keys in non-production environments

---

## 2.2 Configure Production Webhook Endpoint

### Status: ⬜ MANUAL TASK

### Webhook Endpoint URL

```
https://YOURDOMAIN/api/payments/webhook
```

⚠️ **Note:** The endpoint is `/api/payments/webhook` (not `/api/stripe/webhook`)

### Required Events

| Event | Purpose | Code Status |
|-------|---------|-------------|
| `payment_intent.succeeded` | Payment completed | ✅ Handled |
| `payment_intent.payment_failed` | Payment failed | ✅ Handled |
| `payment_intent.canceled` | Payment cancelled | ✅ Handled |
| `account.updated` | Connect account status | ⚠️ **NEEDS HANDLER** |
| `payout.paid` | Owner payout completed | ✅ Handled |
| `payout.failed` | Owner payout failed | ✅ Handled |
| `charge.refunded` | Refund processed | ✅ Handled |
| `charge.dispute.created` | Chargeback opened | ✅ Handled |

### Action Required

- [ ] Create webhook endpoint in Stripe Dashboard (Live mode)
- [ ] Subscribe to all required events
- [ ] Copy Signing Secret → `STRIPE_WEBHOOK_SECRET`
- [ ] **IMPLEMENT:** Add `account.updated` webhook handler

---

## 2.3 Stripe Connect Settings

### Status: ⬜ MANUAL TASK

### Dashboard Location

**Stripe Dashboard → Settings → Connect**

### Verification Checklist

- [ ] Express accounts enabled
- [ ] Transfers enabled
- [ ] Platform fee visible (1.5% configured in code)
- [ ] Payouts enabled (manual or scheduled)

### Code Configuration

```typescript
// Platform fee: 1.5%
const PLATFORM_FEE_PERCENT = 1.5

// Express accounts with transfers
const account = await stripe.accounts.create({
  type: 'express',
  capabilities: { transfers: { requested: true } },
})
```

### Action Required

- [ ] Verify all Connect settings in Stripe Dashboard

---

## 2.4 Live $1 Smoke Test

### Status: 🔴 BLOCKED

### Critical Blocker: Missing Connect Routing

The `createPaymentIntent` function is **MISSING**:

```typescript
// MISSING - Platform fee collection
application_fee_amount: Math.round(platformFeeAmount * 100),

// MISSING - Fund routing to owner
transfer_data: {
  destination: ownerStripeAccountId,
},
```

**Location:** `src/lib/payments/stripe-service.ts:173-189`

### Impact on Smoke Test

| Check | Current Status |
|-------|----------------|
| Payment captured | ✅ Will work |
| Platform fee deducted | ❌ **WILL FAIL** |
| Funds routed to owner | ❌ **WILL FAIL** |
| Payout scheduled/visible | ❌ **WILL FAIL** |
| Webhook events received | ✅ Will work |

### Required Implementation

```typescript
// 1. Fetch owner's Stripe account ID
const ownerPayoutAccount = await prisma.ownerPayoutAccount.findUnique({
  where: { userId: booking.ownerId },
  select: { stripeAccountId: true },
})

// 2. Create PaymentIntent with Connect routing
const paymentIntent = await stripe.paymentIntents.create({
  amount: amountInCents,
  currency: currency.toLowerCase(),
  customer: customerId,
  
  // CRITICAL: Platform fee
  application_fee_amount: Math.round(platformFeeAmount * 100),
  
  // CRITICAL: Route to owner
  transfer_data: {
    destination: ownerPayoutAccount.stripeAccountId,
  },
  
  metadata: { ... },
  automatic_payment_methods: { enabled: true },
})
```

### Action Required

- [ ] **IMPLEMENT:** Add `application_fee_amount` to PaymentIntent
- [ ] **IMPLEMENT:** Add `transfer_data.destination` to PaymentIntent
- [ ] **IMPLEMENT:** Fetch owner's Stripe account ID before creating PaymentIntent
- [ ] Update `createDepositPaymentIntent` with same changes

---

## Priority Action Items

### 🔴 CRITICAL (Blocks Launch)

1. **Fix `createPaymentIntent`** — Add `application_fee_amount` and `transfer_data.destination`
2. **Fix remaining build errors** — `search-service.ts` schema mismatches
3. **Regenerate Prisma client** — `npx prisma generate`

### 🟡 HIGH (Required for Smoke Test)

4. **Add `account.updated` webhook handler** — For Connect account status updates
5. **Set all production environment variables** — In Vercel

### 🟢 MANUAL (Dashboard Tasks)

6. **Switch Stripe to Live mode**
7. **Create production webhook endpoint**
8. **Verify Connect settings**
9. **Run live $1 smoke test**

---

## Recommended Order of Operations

```
1. Fix createPaymentIntent (CRITICAL)
   ↓
2. Fix search-service.ts build errors
   ↓
3. npx prisma generate
   ↓
4. npm run build (verify passes)
   ↓
5. Add account.updated webhook handler
   ↓
6. Deploy to production
   ↓
7. Set production env vars in Vercel
   ↓
8. Switch Stripe to Live mode
   ↓
9. Create production webhook endpoint
   ↓
10. Verify Connect settings
   ↓
11. Run live $1 smoke test
   ↓
12. ✅ LAUNCH READY
```

---

## Files Requiring Changes

| File | Changes Needed |
|------|----------------|
| `src/lib/payments/stripe-service.ts` | Add `application_fee_amount`, `transfer_data.destination` |
| `src/lib/search/search-service.ts` | Remove `slug`, `primaryImageUrl`, fix `availabilityBlocks` |
| `src/lib/payments/webhook-handler.ts` | Add `account.updated` handler |

---

## Estimated Effort

| Task | Effort |
|------|--------|
| Fix `createPaymentIntent` | 30 min |
| Fix `search-service.ts` | 45 min |
| Add `account.updated` handler | 20 min |
| Manual Stripe configuration | 30 min |
| Smoke test | 30 min |
| **Total** | **~2.5 hours** |
