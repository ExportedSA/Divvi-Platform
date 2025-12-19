# Stripe Platform Country Registration

**Platform:** Divvi Machinery Rentals  
**Supported Countries:** New Zealand (NZ), Australia (AU)  
**Last Verified:** December 2024

---

## Overview

This document verifies the Stripe platform account country registration and confirms alignment with tax, payout, and currency logic throughout the codebase.

---

## Platform Account Registration

### Primary Platform Account

The Divvi platform Stripe account should be registered in **New Zealand** as the primary jurisdiction, with the ability to process payments in both NZ and AU.

| Setting | Value |
|---------|-------|
| **Platform Country** | New Zealand (NZ) |
| **Business Entity** | Divvi Limited |
| **Supported Currencies** | NZD, AUD |
| **Connect Type** | Express Accounts |

### Stripe Dashboard Verification

To verify platform country registration:

1. Log in to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Settings** → **Business settings**
3. Confirm **Country** is set to `New Zealand` or `Australia`
4. Verify **Business name** matches legal entity

---

## Country Configuration in Code

### Currency Mapping

```typescript
// src/lib/stripe.ts
export function getStripeCurrency(country: 'NZ' | 'AU'): string {
  return country === 'NZ' ? 'nzd' : 'aud'
}
```

| User Country | Currency | Stripe Currency Code |
|--------------|----------|---------------------|
| NZ | New Zealand Dollar | `nzd` |
| AU | Australian Dollar | `aud` |

### Connected Account Creation

```typescript
// src/app/api/stripe/connect/route.ts
const account = await stripe.accounts.create({
  type: 'express',
  country: user.country === 'NZ' ? 'NZ' : 'AU',
  // ...
})
```

Connected accounts are created in the user's country (NZ or AU), ensuring:
- Local bank account support
- Correct tax reporting jurisdiction
- Appropriate KYC requirements

### Platform Bank Details

```typescript
// src/lib/wallet/wallet-service.ts
export function getPlatformBankDetails(country: 'NZ' | 'AU') {
  if (country === 'NZ') {
    return {
      bankName: 'ANZ Bank New Zealand',
      accountName: 'Divvi Limited',
      currency: 'NZD',
    }
  }
  return {
    bankName: 'ANZ Bank Australia',
    accountName: 'Divvi Pty Ltd',
    currency: 'AUD',
  }
}
```

---

## Tax and Compliance Alignment

### New Zealand

| Requirement | Status | Notes |
|-------------|--------|-------|
| GST Registration | Required if turnover > $60,000 | Platform fees may be subject to GST |
| IRD Number | Required | For tax reporting |
| AML/CFT | Stripe handles KYC | Express accounts |

### Australia

| Requirement | Status | Notes |
|-------------|--------|-------|
| GST Registration | Required if turnover > $75,000 | Platform fees may be subject to GST |
| ABN | Required | For business operations |
| AML/CTF | Stripe handles KYC | Express accounts |

### Cross-Border Considerations

- **NZ Platform → AU Users:** Payments processed in AUD, settled to AU bank accounts
- **AU Platform → NZ Users:** Payments processed in NZD, settled to NZ bank accounts
- **Platform Fees:** Collected in transaction currency, converted if needed

---

## Payout Logic Verification

### Destination Charges

All payments use Stripe Connect destination charges:

```typescript
// Payment flows to owner's Connect account
transfer_data: {
  destination: ownerConnectAccount.stripeAccountId
}

// Platform fee retained by Divvi
application_fee_amount: toCents(platformFee)
```

### Payout Schedule

| Account Type | Payout Schedule | Currency |
|--------------|-----------------|----------|
| NZ Connected Account | T+2 business days | NZD |
| AU Connected Account | T+2 business days | AUD |
| Platform Account | Per Stripe settings | NZD/AUD |

---

## Environment Variables

Ensure these are configured correctly for each environment:

```bash
# Stripe API Keys (country-agnostic)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Platform Bank Details (NZ)
DIVVI_NZ_BANK_NAME="ANZ Bank New Zealand"
DIVVI_NZ_ACCOUNT_NAME="Divvi Limited"
DIVVI_NZ_BANK_ACCOUNT="00-0000-0000000-00"

# Platform Bank Details (AU)
DIVVI_AU_BANK_NAME="ANZ Bank Australia"
DIVVI_AU_ACCOUNT_NAME="Divvi Pty Ltd"
DIVVI_AU_BSB="000-000"
DIVVI_AU_BANK_ACCOUNT="000000000"
```

---

## Verification Checklist

### Stripe Dashboard

- [ ] Platform account country is NZ or AU
- [ ] Business details match legal entity
- [ ] Bank account is in correct country
- [ ] Tax settings configured (GST if applicable)

### Codebase

- [x] Currency mapping correct (`getStripeCurrency`)
- [x] Connected accounts created in user's country
- [x] Platform bank details support both NZ and AU
- [x] Destination charges route to correct accounts

### Compliance

- [ ] Privacy policy reflects NZ/AU jurisdiction
- [ ] Terms of service reference correct legal entity
- [ ] Refund policy compliant with Consumer Guarantees Act (NZ) / Australian Consumer Law

---

## Multi-Country Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 DIVVI PLATFORM (NZ)                         │
│                 Stripe Platform Account                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐          ┌─────────────────┐          │
│  │   NZ OWNERS     │          │   AU OWNERS     │          │
│  │ Express Account │          │ Express Account │          │
│  │ Country: NZ     │          │ Country: AU     │          │
│  │ Currency: NZD   │          │ Currency: AUD   │          │
│  │ Bank: NZ Bank   │          │ Bank: AU Bank   │          │
│  └─────────────────┘          └─────────────────┘          │
│           │                            │                    │
│           ▼                            ▼                    │
│  ┌─────────────────┐          ┌─────────────────┐          │
│  │   NZ RENTERS    │          │   AU RENTERS    │          │
│  │ Pay in NZD      │          │ Pay in AUD      │          │
│  └─────────────────┘          └─────────────────┘          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## References

- [Stripe Connect Countries](https://stripe.com/docs/connect/cross-border-payouts)
- [Stripe NZ](https://stripe.com/nz)
- [Stripe AU](https://stripe.com/au)
- [NZ IRD - GST](https://www.ird.govt.nz/gst)
- [ATO - GST](https://www.ato.gov.au/business/gst/)

---

## Document History

| Date | Author | Changes |
|------|--------|---------|
| Dec 2024 | System | Initial verification document |
