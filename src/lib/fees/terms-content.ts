/**
 * Platform Fee Terms Content
 * This content should be included in the Terms of Use page
 */

import { PLATFORM_FEE_DISPLAY, PLATFORM_FEE_LEGAL_TEXT } from './fee-config'

export const PLATFORM_FEE_TERMS_SECTION = `
## Platform Service Fee

${PLATFORM_FEE_LEGAL_TEXT}

### How the Fee Works

1. **Fee Calculation**: A ${PLATFORM_FEE_DISPLAY} service fee is calculated on the rental subtotal (rental cost plus any delivery fees).

2. **Payment Processing**: When a renter makes a booking:
   - The renter pays the rental subtotal plus the platform service fee
   - Payments are processed securely via Stripe
   - The platform fee is automatically deducted
   - The remaining amount (owner payout) is transferred to the owner after rental completion

3. **Owner Payouts**: After successful completion of a rental:
   - The owner receives the rental subtotal minus the ${PLATFORM_FEE_DISPLAY} platform fee
   - Payouts are processed according to the owner's payout schedule

4. **Security Bonds**: Security bonds are separate from the platform fee:
   - Bonds are authorised (not charged) at the time of booking via Stripe
   - Bond authorisations are valid for up to 7 days; longer rentals may require re-authorisation
   - Bonds are only captured if damage is reported and agreed
   - No platform fee is applied to bond amounts

### Example Calculation

For a rental with:
- Rental cost: $500.00
- Delivery fee: $50.00
- Security bond: $200.00

The breakdown would be:
- Rental subtotal: $550.00
- Platform fee (${PLATFORM_FEE_DISPLAY}): $8.25
- Total charged to renter: $558.25 (plus $200 bond authorisation)
- Owner receives: $541.75

### Fee Changes

Divvi reserves the right to modify the platform service fee with reasonable notice to users. Any changes will be communicated via email and updated in these terms.
`

export const FULL_TERMS_TEMPLATE = `
# Divvi Terms of Use

Last updated: ${new Date().toLocaleDateString('en-NZ', { year: 'numeric', month: 'long', day: 'numeric' })}

## 1. Introduction

Welcome to Divvi, a peer-to-peer machinery rental platform connecting equipment owners with renters across New Zealand and Australia.

By using our platform, you agree to these Terms of Use. Please read them carefully.

## 2. User Accounts

### 2.1 Registration
- You must provide accurate and complete information when creating an account
- You are responsible for maintaining the security of your account credentials
- You must be at least 18 years old to use the platform

### 2.2 Account Types
- **Renters**: Users who rent equipment from owners
- **Owners**: Users who list equipment for rent
- Users may act as both renters and owners

${PLATFORM_FEE_TERMS_SECTION}

## 4. Bookings and Payments

### 4.1 Booking Process
- Renters submit booking requests through the platform
- Owners may accept or decline booking requests
- Payment is required to confirm a booking

### 4.2 Cancellation Policy
- Cancellation policies are set by individual owners
- Platform fees may be non-refundable depending on cancellation timing

### 4.3 Security Bonds
- Owners may require a security bond for their equipment
- Bonds are authorised at booking and captured only if damage occurs

## 5. Equipment and Liability

### 5.1 Equipment Condition
- Owners must accurately describe equipment condition
- Renters must return equipment in the same condition

### 5.2 Insurance
- Equipment insurance requirements vary by listing
- Renters should verify insurance coverage before booking

## 6. Disputes

### 6.1 Dispute Resolution
- Users should first attempt to resolve disputes directly
- Divvi provides a dispute resolution process for unresolved issues

## 7. Privacy

Your privacy is important to us. Please review our Privacy Policy for information about how we collect and use your data.

## 8. Contact

For questions about these terms, please contact us at support@divvi.co.nz
`
