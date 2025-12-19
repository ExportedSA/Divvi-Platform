# Stripe Live Mode Activation Checklist

**Platform:** Divvi Machinery Rentals  
**Document Version:** 1.0  
**Last Updated:** December 2024

---

## Overview

This checklist guides the activation of Stripe live mode for production payments. Complete all items in order before processing real transactions.

**Estimated Time:** 2-4 hours  
**Required Access:** Stripe Dashboard (Admin), Deployment Platform (Admin)

---

## Pre-Activation Requirements

Before starting, ensure:

- [ ] All smoke tests pass in test mode
- [ ] Legal review of terms and refund policy complete
- [ ] Business bank account verified in Stripe
- [ ] Support team briefed on payment handling
- [ ] Monitoring and alerting configured

---

## Phase 1: Live API Keys Configuration

### 1.1 Obtain Live API Keys

1. Log in to [Stripe Dashboard](https://dashboard.stripe.com)
2. Toggle to **Live mode** (top-right switch)
3. Navigate to **Developers** → **API keys**
4. Copy the following keys:

| Key Type | Format | Location |
|----------|--------|----------|
| Secret Key | `sk_live_...` | Server-side only |
| Publishable Key | `pk_live_...` | Client-side safe |

### 1.2 Configure Environment Variables

Update your deployment platform (Vercel, AWS, etc.):

```bash
# Production Environment Variables
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxx  # Set in Phase 2
```

### 1.3 Verification

- [ ] `STRIPE_SECRET_KEY` starts with `sk_live_`
- [ ] `STRIPE_PUBLISHABLE_KEY` starts with `pk_live_`
- [ ] Keys are NOT committed to version control
- [ ] Keys are NOT shared in plain text (use secrets manager)

---

## Phase 2: Production Webhook Endpoint Setup

### 2.1 Create Live Webhook Endpoint

1. In Stripe Dashboard (Live mode), go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Configure:

| Setting | Value |
|---------|-------|
| Endpoint URL | `https://your-domain.com/api/stripe/webhook` |
| API Version | `2024-11-20.acacia` (match code) |
| Events | See list below |

### 2.2 Subscribe to Events

Select the following events:

```
✅ payment_intent.succeeded
✅ payment_intent.payment_failed
✅ payment_intent.canceled
✅ payment_intent.requires_action
✅ charge.refunded
✅ charge.dispute.created
✅ account.updated
```

### 2.3 Get Webhook Signing Secret

1. After creating endpoint, click on it
2. Under **Signing secret**, click **Reveal**
3. Copy the `whsec_...` value
4. Update environment variable:

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxx
```

### 2.4 Verification

- [ ] Webhook endpoint URL is correct (HTTPS, no trailing slash)
- [ ] All 7 events are subscribed
- [ ] Signing secret is configured in environment
- [ ] Endpoint shows "Active" status in Dashboard

---

## Phase 3: Dashboard Toggles & Settings

### 3.1 Connect Settings

Navigate to **Settings** → **Connect settings**:

- [ ] **Platform profile** is complete
- [ ] **Branding** configured (logo, colors, support email)
- [ ] **Express accounts** enabled
- [ ] **Payout schedule** set (recommend: 2-day rolling)

### 3.2 Payout Settings

Navigate to **Settings** → **Payouts**:

- [ ] Bank account verified and active
- [ ] Payout schedule configured
- [ ] Minimum payout amount set (if desired)

### 3.3 Capabilities

Verify platform capabilities in **Settings** → **Business settings**:

- [ ] **Card payments** enabled
- [ ] **Transfers** enabled (for Connect)
- [ ] **Platform payments** enabled

### 3.4 Tax Settings (if applicable)

Navigate to **Settings** → **Tax settings**:

- [ ] Tax ID configured (IRD for NZ, ABN for AU)
- [ ] Tax calculation settings reviewed

### 3.5 Verification

- [ ] All Connect settings configured
- [ ] Payouts enabled and bank verified
- [ ] Required capabilities active
- [ ] No pending verification requirements

---

## Phase 4: Test Live $1 Booking Flow

### 4.1 Prepare Test

1. Create a test owner account with completed Connect onboarding
2. Create a test listing with $1 rental price
3. Have a real credit card ready (will be charged $1 + fees)

### 4.2 Execute Test Flow

| Step | Action | Expected Result | ✓ |
|------|--------|-----------------|---|
| 1 | Create booking request | Booking in PENDING status | ☐ |
| 2 | Owner accepts booking | Booking in ACCEPTED status | ☐ |
| 3 | Renter initiates payment | Payment form displayed | ☐ |
| 4 | Complete payment ($1 + fee) | Payment succeeds | ☐ |
| 5 | Check Stripe Dashboard | PaymentIntent shows succeeded | ☐ |
| 6 | Verify webhook received | Audit log shows webhook event | ☐ |
| 7 | Check owner's Connect account | Transfer pending/completed | ☐ |
| 8 | Process refund | Refund succeeds | ☐ |
| 9 | Verify refund webhook | Audit log shows refund event | ☐ |

### 4.3 Bond Authorization Test

| Step | Action | Expected Result | ✓ |
|------|--------|-----------------|---|
| 1 | Create booking with bond | Bond authorization created | ☐ |
| 2 | Check card statement | Shows pending authorization | ☐ |
| 3 | Complete booking (no damage) | Bond released | ☐ |
| 4 | Verify authorization cancelled | No charge on card | ☐ |

### 4.4 Verification

- [ ] Payment succeeded and appears in Stripe Dashboard
- [ ] Webhook events received and processed
- [ ] Owner received funds (minus platform fee)
- [ ] Refund processed successfully
- [ ] Bond authorization and release worked

---

## Phase 5: Final Checks

### 5.1 Security Review

- [ ] API keys are live mode (`sk_live_`, `pk_live_`)
- [ ] Webhook secret is live mode (`whsec_`)
- [ ] No test mode keys in production environment
- [ ] HTTPS enforced on all payment pages

### 5.2 Monitoring Setup

- [ ] Error tracking configured (Sentry, etc.)
- [ ] Stripe webhook failure alerts enabled
- [ ] Payment success rate monitoring active
- [ ] On-call rotation established

### 5.3 Documentation

- [ ] Support team has payment troubleshooting guide
- [ ] Refund policy published and accessible
- [ ] Terms of service updated with payment terms

---

## Phase 6: Go Live

### 6.1 Deployment

```bash
# Deploy with live configuration
# (Platform-specific command)
vercel --prod
# or
git push origin main  # if auto-deploy configured
```

### 6.2 Post-Deployment Verification

- [ ] Application loads without errors
- [ ] Payment button/form renders correctly
- [ ] No console errors related to Stripe
- [ ] Webhook endpoint responding (check Stripe Dashboard)

### 6.3 Announce

- [ ] Notify team that live payments are active
- [ ] Update status page (if applicable)
- [ ] Begin monitoring period (recommend: 24-48 hours close watch)

---

## Rollback Steps

If critical issues are discovered after go-live:

### Immediate Rollback (< 5 minutes)

1. **Switch to test keys:**
   ```bash
   STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxx
   STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxx
   ```

2. **Deploy immediately:**
   ```bash
   vercel --prod
   ```

3. **Notify stakeholders:**
   - Alert team of rollback
   - Pause marketing/announcements

4. **Preserve evidence:**
   - Screenshot any errors
   - Export relevant logs
   - Note affected transactions

### Partial Rollback (Payments Only)

If only payment processing is affected:

1. **Add maintenance flag:**
   ```bash
   PAYMENTS_MAINTENANCE_MODE=true
   ```

2. **Display user message:**
   "Payments are temporarily unavailable. Please try again later."

3. **Allow browsing** but disable payment step

4. **Investigate and fix** the specific issue

5. **Re-enable payments** after verification

### Transaction Recovery

For any failed or stuck transactions:

1. Check Stripe Dashboard for transaction status
2. If payment succeeded but webhook failed:
   - Manually replay webhook from Dashboard
   - Or manually update database records
3. Contact affected users with status update
4. Process manual refunds if needed

### Connect Account Issues

If owner payouts are affected:

1. Payments will still succeed (to platform account)
2. Flag affected bookings for manual payout
3. Notify affected owners of delay
4. Process manual transfers once resolved

---

## Emergency Contacts

| Role | Contact | Availability |
|------|---------|--------------|
| Technical Lead | [Name/Phone] | 24/7 during launch |
| Stripe Support | Dashboard Chat | 24/7 |
| Platform Admin | [Name/Phone] | Business hours |

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Technical Lead | | | |
| Product Owner | | | |
| Operations | | | |

---

## Post-Launch Monitoring

### First 24 Hours

- [ ] Monitor payment success rate (target: >95%)
- [ ] Check webhook delivery rate (target: 100%)
- [ ] Review error logs hourly
- [ ] Verify first real customer transaction

### First Week

- [ ] Daily review of payment metrics
- [ ] Check for any disputes or chargebacks
- [ ] Verify owner payouts processing correctly
- [ ] Gather user feedback on payment experience

### Ongoing

- [ ] Weekly payment health review
- [ ] Monthly reconciliation with Stripe reports
- [ ] Quarterly security review of API keys

---

*This checklist should be completed in full before accepting real payments. Keep a copy of the completed checklist for compliance records.*
