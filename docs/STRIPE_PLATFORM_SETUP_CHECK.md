# Divvi Stripe Platform Setup Audit

## Executive Summary

This document audits Divvi's Stripe platform account configuration for go-live readiness against:
- Marketplace rental model requirements
- Stripe Connect compliance
- NZ/AU regional requirements and allowed use cases

**Audit Date:** December 2024  
**Platform:** Divvi (Machinery/Equipment Rental Marketplace)  
**Markets:** New Zealand, Australia

---

## 1. Business Model Classification

### Divvi's Model
| Attribute | Value | Stripe Classification |
|-----------|-------|----------------------|
| Business Type | Equipment rental marketplace | **Marketplace/Platform** |
| Revenue Model | Platform fee (1-1.5%) on transactions | Application fee model |
| Payment Flow | Renter → Platform → Owner (minus fee) | Destination charges |
| Connected Accounts | Equipment owners | Express accounts |

### ✅ Allowed Use Case Verification

**Equipment rental is NOT on Stripe's prohibited or restricted business list.**

Divvi's model is similar to approved platforms like:
- Airbnb (home rentals)
- Turo (vehicle rentals)
- Fat Llama (equipment rentals)

**Status:** ✅ **APPROVED USE CASE** - No pre-approval required

---

## 2. Stripe Connect Configuration Audit

### 2.1 Account Type Selection

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| Account Type | Express | ✅ Correct |
| Onboarding | Stripe-hosted | ✅ Correct |
| Identity Verification | Handled by Stripe | ✅ Correct |

**Code Reference:** `@/src/app/api/stripe/connect/route.ts:119-137`
```typescript
const account = await stripe.accounts.create({
  type: 'express',
  country: user.country === 'NZ' ? 'NZ' : 'AU',
  capabilities: {
    card_payments: { requested: true },
    transfers: { requested: true },
  },
  business_type: 'individual',
  // ...
})
```

**Finding:** Express accounts are the correct choice for Divvi's marketplace model. They provide:
- Stripe-hosted onboarding (reduces PCI scope)
- Automatic identity verification
- Stripe-managed tax reporting
- Lower integration complexity

### 2.2 Capabilities Configuration

| Capability | Requested | Required For |
|------------|-----------|--------------|
| `card_payments` | ✅ Yes | Accepting card payments |
| `transfers` | ✅ Yes | Receiving payouts |

**Status:** ✅ **CORRECT** - Both required capabilities are requested

### 2.3 Charge Type Implementation

| Aspect | Implementation | Status |
|--------|----------------|--------|
| Charge Type | Destination charges | ✅ Correct |
| Application Fee | `application_fee_amount` | ✅ Correct |
| Transfer Routing | `transfer_data.destination` | ✅ Correct |

**Code Reference:** `@/src/app/api/bookings/[id]/payment/route.ts:143-150`
```typescript
if (ownerConnectAccount?.stripeAccountId && ownerConnectAccount.stripeOnboardingComplete) {
  paymentIntentParams.application_fee_amount = toCents(platformFeeAmount)
  paymentIntentParams.transfer_data = {
    destination: ownerConnectAccount.stripeAccountId
  }
}
```

**Finding:** Destination charges are appropriate for Divvi because:
- Platform collects payment on behalf of owner
- Automatic split of funds (owner payout minus platform fee)
- Single charge appears on customer statement
- Platform handles refunds centrally

---

## 3. NZ/AU Regional Compliance

### 3.1 Platform Country Support

| Requirement | Status |
|-------------|--------|
| Platform based in NZ or AU | ⬜ **VERIFY** |
| Express accounts supported | ✅ Yes (both NZ & AU) |
| Cross-border NZ ↔ AU | ✅ Supported |

**Action Required:** Confirm Divvi's Stripe platform account is registered in NZ or AU.

### 3.2 Currency Configuration

| Market | Currency | Implementation | Status |
|--------|----------|----------------|--------|
| New Zealand | NZD | ✅ Configured | ✅ |
| Australia | AUD | ✅ Configured | ✅ |

**Code Reference:** `@/src/lib/stripe.ts:64-66`
```typescript
export function getStripeCurrency(country: 'NZ' | 'AU'): string {
  return country === 'NZ' ? 'nzd' : 'aud'
}
```

### 3.3 Connected Account Country Handling

| Aspect | Implementation | Status |
|--------|----------------|--------|
| Country detection | From user profile | ✅ |
| Account creation | Country-specific | ✅ |

**Code Reference:** `@/src/app/api/stripe/connect/route.ts:122`
```typescript
country: user.country === 'NZ' ? 'NZ' : 'AU',
```

**Finding:** ✅ Correctly routes owners to appropriate country-specific Stripe accounts.

---

## 4. Webhook Configuration Audit

### 4.1 Required Webhooks

| Event | Implemented | Handler |
|-------|-------------|---------|
| `payment_intent.succeeded` | ✅ | Updates booking status |
| `payment_intent.payment_failed` | ✅ | Records failure, notifies renter |
| `payment_intent.requires_action` | ✅ | Notifies for 3DS |
| `charge.refunded` | ✅ | Updates payment status |
| `charge.dispute.created` | ✅ | Flags for admin |
| `account.updated` | ❌ **MISSING** | Connect account status changes |
| `payout.failed` | ❌ **MISSING** | Owner payout failures |
| `payout.paid` | ❌ **MISSING** | Confirm owner payouts |

**Code Reference:** `@/src/app/api/stripe/webhook/route.ts`

### 4.2 Missing Webhook Handlers

**⚠️ RECOMMENDATION:** Add handlers for Connect-specific events:

```typescript
// Recommended additions
case 'account.updated': {
  // Update owner's Connect status when Stripe updates their account
  // Handle capability changes, verification status
}

case 'payout.failed': {
  // Notify owner of failed payout
  // Flag for admin review
}

case 'payout.paid': {
  // Confirm payout completed
  // Update financial records
}
```

### 4.3 Webhook Security

| Aspect | Implementation | Status |
|--------|----------------|--------|
| Signature verification | ✅ `constructEvent()` | ✅ |
| Idempotency handling | ✅ Duplicate check | ✅ |
| Error handling | ✅ Logged, returns 200 | ✅ |

---

## 5. Platform Fee Structure

### 5.1 Fee Configuration

| Tier | Rate | Threshold | Status |
|------|------|-----------|--------|
| Standard | 1.5% | < $5,000 | ✅ |
| High Value | 1.0% | ≥ $5,000 | ✅ |

**Code Reference:** `@/src/lib/stripe.ts:26-31`
```typescript
export const PLATFORM_FEE_STANDARD = 0.015 // 1.5%
export const PLATFORM_FEE_HIGH_VALUE = 0.01 // 1%
export const HIGH_VALUE_THRESHOLD = 5000
```

### 5.2 Fee Compliance

| Requirement | Status |
|-------------|--------|
| Fees clearly disclosed to users | ⬜ **VERIFY** in UI |
| Fees within Stripe limits | ✅ (no max limit) |
| Fee calculation accurate | ✅ Verified in code |

---

## 6. Bond/Authorization Handling

### 6.1 Implementation Review

| Aspect | Implementation | Status |
|--------|----------------|--------|
| Authorization method | `capture_method: 'manual'` | ✅ Correct |
| Hold duration | 7 days | ⚠️ **REVIEW** |
| Release mechanism | Cancel PaymentIntent | ⬜ **VERIFY** |
| Capture mechanism | Capture PaymentIntent | ⬜ **VERIFY** |

**Code Reference:** `@/src/app/api/bookings/[id]/payment/route.ts:179-195`

### 6.2 Authorization Limits

| Region | Max Auth Hold | Divvi Default | Status |
|--------|---------------|---------------|--------|
| NZ/AU | 7 days (cards) | 7 days | ✅ |

**⚠️ NOTE:** Authorization holds typically expire after 7 days. For longer rentals, consider:
- Re-authorizing before expiry
- Using incremental authorization
- Capturing and refunding if needed

---

## 7. Go-Live Checklist

### 7.1 Stripe Dashboard Configuration

| Item | Action | Status |
|------|--------|--------|
| Platform profile completed | Verify in Dashboard | ⬜ |
| Connect settings configured | Verify branding | ⬜ |
| Live mode API keys | Generate and configure | ⬜ |
| Webhook endpoints | Configure for production URL | ⬜ |
| Payout schedule | Set default (daily/weekly) | ⬜ |
| Statement descriptor | Set "DIVVI" or similar | ⬜ |

### 7.2 Environment Variables (Production)

| Variable | Purpose | Status |
|----------|---------|--------|
| `STRIPE_SECRET_KEY` | Live secret key (`sk_live_...`) | ⬜ |
| `STRIPE_PUBLISHABLE_KEY` | Live publishable key (`pk_live_...`) | ⬜ |
| `STRIPE_WEBHOOK_SECRET` | Live webhook secret (`whsec_...`) | ⬜ |

### 7.3 Testing Requirements

| Test | Description | Status |
|------|-------------|--------|
| End-to-end payment | Real card, real payout | ⬜ |
| Connect onboarding | Owner completes Stripe onboarding | ⬜ |
| Bond authorization | Hold and release | ⬜ |
| Bond capture | Partial/full damage claim | ⬜ |
| Refund flow | Full and partial refunds | ⬜ |
| 3D Secure | Test with 3DS-required card | ⬜ |
| Declined card | Verify error handling | ⬜ |
| Webhook delivery | All events received | ⬜ |

---

## 8. Risk & Compliance

### 8.1 Platform Liability

As a Connect platform, Divvi is responsible for:
- Losses from connected account fraud
- Negative balances on connected accounts
- Disputes and chargebacks (initially)

**Mitigations in Place:**
- ✅ Owner verification via Stripe Express onboarding
- ✅ Bond/security deposit system
- ✅ Dispute handling webhook
- ⬜ **RECOMMEND:** Implement fraud scoring for high-value rentals

### 8.2 Regulatory Considerations

| Requirement | NZ | AU | Status |
|-------------|----|----|--------|
| AML/KYC | Handled by Stripe | Handled by Stripe | ✅ |
| Tax reporting | Stripe handles 1099s | Stripe handles | ✅ |
| Consumer protection | Platform T&Cs | Platform T&Cs | ⬜ **VERIFY** |

### 8.3 Data Handling

| Data Type | Storage | Compliance |
|-----------|---------|------------|
| Card numbers | Never stored (Stripe.js) | ✅ PCI compliant |
| Bank accounts | Stripe only | ✅ |
| Customer IDs | Database | ✅ |
| Payment history | Database + Stripe | ✅ |

---

## 9. Recommendations Summary

### Critical (Must Fix Before Go-Live)

| # | Issue | Priority |
|---|-------|----------|
| 1 | Add `account.updated` webhook handler | 🔴 High |
| 2 | Verify platform account is in NZ or AU | 🔴 High |
| 3 | Configure live mode API keys | 🔴 High |
| 4 | Set up production webhook endpoint | 🔴 High |

### Important (Should Fix)

| # | Issue | Priority |
|---|-------|----------|
| 5 | Add `payout.failed` webhook handler | 🟡 Medium |
| 6 | Add `payout.paid` webhook handler | 🟡 Medium |
| 7 | Implement bond re-authorization for long rentals | 🟡 Medium |
| 8 | Document fee structure in owner onboarding | 🟡 Medium |

### Nice to Have

| # | Issue | Priority |
|---|-------|----------|
| 9 | Add fraud scoring for high-value rentals | 🟢 Low |
| 10 | Implement Stripe Radar rules | 🟢 Low |
| 11 | Add payout tracking dashboard for owners | 🟢 Low |

---

## 10. Stripe Dashboard Setup Guide

### Step 1: Complete Platform Profile
1. Go to [Stripe Dashboard → Connect → Settings](https://dashboard.stripe.com/connect/settings)
2. Complete all required fields:
   - Business name: "Divvi"
   - Business URL: "https://divvi.co.nz"
   - Support email/phone
   - Platform description

### Step 2: Configure Connect Branding
1. Upload Divvi logo (icon and full logo)
2. Set brand color (#2D5A27 - Divvi green)
3. Configure redirect URLs

### Step 3: Enable Countries
1. Enable New Zealand for connected accounts
2. Enable Australia for connected accounts

### Step 4: Configure Webhooks
1. Add endpoint: `https://divvi.co.nz/api/stripe/webhook`
2. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.requires_action`
   - `charge.refunded`
   - `charge.dispute.created`
   - `account.updated`
   - `payout.failed`
   - `payout.paid`

### Step 5: Set Statement Descriptor
1. Go to Settings → Public details
2. Set statement descriptor: "DIVVI" (max 22 chars)
3. Set shortened descriptor: "DIVVI"

### Step 6: Switch to Live Mode
1. Complete all verification requirements
2. Generate live API keys
3. Update environment variables
4. Test with real transactions

---

## Appendix A: API Version Compatibility

**Current Implementation:** `apiVersion: '2025-11-17.clover'`

This is a future/beta API version. For production:
- Use stable API version (e.g., `2023-10-16`)
- Or remove to use account default

**Code Reference:** `@/src/lib/stripe.ts:11-14`

---

## Appendix B: Stripe Connect Flow Diagram

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  Renter │     │  Divvi  │     │ Stripe  │     │  Owner  │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │
     │ Book Equipment│               │               │
     │──────────────>│               │               │
     │               │               │               │
     │               │ Create PaymentIntent          │
     │               │ (destination charge)          │
     │               │──────────────>│               │
     │               │               │               │
     │ Pay (Stripe.js)               │               │
     │──────────────────────────────>│               │
     │               │               │               │
     │               │ Webhook: payment_intent.succeeded
     │               │<──────────────│               │
     │               │               │               │
     │               │               │ Auto-transfer │
     │               │               │ (minus fee)   │
     │               │               │──────────────>│
     │               │               │               │
     │               │               │ Payout to bank│
     │               │               │──────────────>│
     │               │               │               │
```

---

## Appendix C: Test Cards for Go-Live Testing

| Card Number | Scenario |
|-------------|----------|
| 4242424242424242 | Successful payment |
| 4000002500003155 | Requires 3D Secure |
| 4000000000000002 | Declined |
| 4000000000009995 | Insufficient funds |
| 4000000000000069 | Expired card |

---

*Document Version: 1.0*  
*Audit Conducted: December 2024*  
*Next Review: Before production launch*
