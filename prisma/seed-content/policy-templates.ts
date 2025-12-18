/**
 * Policy Content Templates
 * 
 * ⚠️ IMPORTANT LEGAL DISCLAIMER ⚠️
 * 
 * The content in this file is a POLICY OUTLINE requiring legal review.
 * It is NOT intended as final legal wording and should NOT be used in production
 * without review by qualified legal counsel familiar with NZ/AUS law.
 * 
 * Before going live:
 * 1. Have all policy content reviewed by a qualified NZ/AUS legal professional
 * 2. Ensure compliance with Consumer Law, Fair Trading Act, and relevant regulations
 * 3. Update content through the CMS UI or by modifying this seed file
 * 4. Consider jurisdiction-specific requirements (NZ Privacy Act, Australian Consumer Law, etc.)
 * 
 * Lendit acts as a MARKETPLACE FACILITATOR ONLY - not as an insurer, broker, or legal advisor.
 */

// ============================================
// STANDARD DISCLAIMERS
// ============================================

export const LEGAL_DISCLAIMER = `
---

## Disclaimer

This policy is an operational framework only. It is not legal advice. All parties should seek independent legal or insurance advice.

---
`.trim()

export const DRAFT_NOTICE = `
> **DRAFT FOR NZ/AUS LEGAL REVIEW** - This document is a policy outline requiring legal review. 
> It is not intended as final legal wording.
`.trim()

// ============================================
// INSURANCE & DAMAGE POLICY (NZ/AUS COUNSEL-READY)
// ============================================

export const INSURANCE_POLICY_CONTENT = `
# Lendit – Insurance & Damage Policy (Draft)

**Version:** 0.1  
**Last updated:** ${new Date().toLocaleDateString('en-NZ', { year: 'numeric', month: 'long', day: 'numeric' })}

> This policy is an operational framework only and does not constitute legal advice.
> Final wording is subject to review by qualified legal counsel in New Zealand and Australia.

## 1. Purpose of this Policy

- Define risk allocation, insurance expectations, and damage responsibilities for all rentals conducted through the Lendit platform.
- Clarify the respective duties of Owners and Renters operating in New Zealand and Australia.
- Communicate how bonds, insurance, claims, and dispute resolution processes operate within the platform's framework.

---

## 2. Platform Role & Legal Position

- **Divvi is a marketplace facilitator only.**
- Divvi does not own, operate, maintain, or insure the machinery listed on the platform.
- All rental agreements are between the Owner and the Renter, with Divvi providing the digital infrastructure that enables the transaction.
- Divvi facilitates payment processing via Stripe, bond authorisations, and dispute facilitation, but is not a party to the underlying rental contract.
- Divvi does not hold funds in escrow. Payments are processed directly via Stripe Connect.

---

## 3. Insurance Arrangements

*This section outlines the three insurance modes an Owner may select for each listing. Legal counsel should refine for enforceability in NZ/AUS jurisdictions.*

### 3.1 Owner-Provided Insurance

The Owner states that they hold an active insurance policy that covers rental or hire use of the machinery (if applicable).

The Owner acknowledges responsibility for ensuring:
- The policy is valid, adequate, and accurately disclosed.
- Any specific insurer requirements (e.g., operator licensing, use restrictions) are communicated to the Renter.

**Lendit does not verify insurance validity and accepts no liability for misrepresentation.**

### 3.2 Renter-Provided Insurance

- The Renter is responsible for obtaining and maintaining insurance cover appropriate for the machinery and the intended use.
- The Owner may require proof of cover prior to releasing the machinery.
- Failure to secure adequate cover does not limit the Renter's liability for loss or damage.

### 3.3 No Insurance Provided

Where neither the Owner nor Renter provides insurance, the Renter assumes full financial responsibility for:
- Loss
- Theft
- Damage (excluding fair wear and tear)

*Legal counsel should consider local Consumer Law obligations and limitations for NZ/AUS.*

---

## 4. Security Bonds

### 4.1 Purpose

Bonds function as a security deposit to cover potential damage, misuse, cleaning fees, recovery costs, or unpaid rental charges.

### 4.2 Amount

- The bond amount is set by the Owner and displayed clearly on the listing.
- High-value machinery may require elevated bond thresholds.

### 4.3 Authorisation & Capture

Divvi will:
- Authorise the bond amount at time of booking via Stripe.
- Bond authorisations are valid for up to 7 days. For longer rentals, re-authorisation may be required.
- Capture all or part of the bond only where damage or other charges apply and are agreed.

### 4.4 Release & Refunds

Where no charge applies, the bond authorisation is released after the Owner confirms satisfactory return. 
Refunds (where applicable) are processed back to the original payment method and may take 5-10 business days to appear.

---

## 5. Damage, Wear & Tear, and Loss

### 5.1 Renter Responsibilities

Renters are responsible for:
- Operating machinery safely, competently, and within the agreed scope.
- Returning the machinery in the same condition as at pickup, except for fair wear and tear.
- Notifying the Owner immediately of:
  - Accidents
  - Mechanical failures
  - Incidents resulting in damage or risk to people/property

### 5.2 Owner Responsibilities

Owners must:
- Provide machinery that is:
  - Mechanically sound
  - Compliant with relevant safety standards
  - Capable of performing its intended use
- Disclose:
  - Known defects
  - Operational risks
  - Maintenance requirements

### 5.3 Fair Wear & Tear

*Counsel should draft precise definitions for:*
- Normal mechanical deterioration
- Expected paint/chassis scuffing
- Tyre tread consumption

*Exclusions (treated as damage, not wear) may include:*
- Impact damage
- Panel deformation
- Hydraulic failure from misuse
- PTO/shaft breakage due to overload
- Electrical system damage from improper connection
- Water/contamination inside engine, fuel tank, electrics

### 5.4 Total Loss or Theft

Liability structure varies depending on:
- Insurance mode
- Market value
- Criminal involvement (e.g., theft without negligence)

*Legal counsel should define limits and liability caps for NZ/AUS context.*

---

## 6. Pre-Rental and Post-Rental Condition Checks

### 6.1 Pickup Checklist

Renter and Owner must jointly verify (where practical):
- Baseline photos
- Fuel level
- Engine hours
- Tyres, hydraulics, lighting, safety guards
- Any pre-existing damage

### 6.2 Return Checklist

Owner may record:
- New damage
- Fuel shortage
- Excessive wear or misuse indicators
- Engine-hour surcharges (if applicable)

### 6.3 Evidence Requirements

Lendit may require photographic/video evidence to process disputes or bond usage.

---

## 7. Damage Reporting & Claims Process

### 7.1 Reporting a Damage Incident

Either party may lodge a Damage Report through the platform.

Reports should include:
- Summary of damage
- Description of events
- Photos/video
- Estimated repair cost (if reasonably known)

### 7.2 Review & Negotiation Period

A structured negotiation window (e.g., 7 days) applies for both parties to provide additional evidence.

### 7.3 Lendit Review (Administrative Assessment Only)

Lendit may review evidence and:
- Facilitate communication
- Provide non-binding guidance
- Apply bond deductions if both parties agree

**Lendit does not adjudicate legal liability** and may escalate matters to independent dispute resolution if no agreement is reached.

### 7.4 Bond Application

Outcomes may include:
- **No charge** (bond released)
- **Partial charge** (portion of bond retained)
- **Full charge** (bond fully retained)
- **Escalation** to insurer, legal process, or external dispute resolution channel

---

## 8. High-Risk Machinery

*Counsel should define equipment considered high-risk, e.g.:*
- Forestry harvesters
- High-horsepower tractors
- Excavators above a specific tonnage
- Elevated work platforms
- On-road vehicle machinery that requires licences

Owners may be required to:
- Provide higher bond amounts
- Confirm compliance certifications
- Provide operational training notes

---

## 9. Renter Competency & Licensing

Where required by law or insurer conditions:
- Renters must hold relevant endorsements/licences (e.g., NZ W endorsement for wheels, Australian HR/HC for heavy vehicles).
- Owners may request proof prior to release.

*Failure to meet competency requirements may void insurance (counsel to refine this section carefully).*

---

## 10. Excluded Uses

*Define prohibited or restricted uses, e.g.:*
- Commercial road transport without appropriate registration/insurance
- Use in conditions beyond manufacturer specification
- Sub-hiring or transferring control to third parties
- Illegal activities
- Overloading or improper implement attachment

---

## 11. Dispute Resolution Pathway

*Counsel can refine this to comply with NZ/AUS consumer and civil law.*

### 11.1 Direct Negotiation

Owner and Renter make reasonable efforts to resolve the issue between themselves.

### 11.2 Platform-Facilitated Review

Lendit:
- Reviews evidence
- Suggests non-binding resolution outcomes
- Manages bond release/retention only with mutual agreement

### 11.3 Escalation

If unresolved, referred to:
- Applicable insurer
- Fair Trading (NZ), ACC considerations where relevant
- State/Territory Consumer Affairs (AUS)
- Civil disputes tribunal (e.g., New Zealand Disputes Tribunal, Australian small claims courts)

Lendit may temporarily hold bond authorisation pending third-party outcome.

---

## 12. Changes to This Policy

- Lendit may update this policy periodically.
- The version number and "last updated" date will be displayed at the top of the page.
- Bookings retain the policy version snapshot accepted at time of booking for audit and fairness.

---

## 13. Definitions

*Suggested definitions for counsel to refine:*

- **Owner**: The individual/entity offering machinery for rent.
- **Renter**: The individual/entity hiring machinery through the platform.
- **Machinery**: Any listed equipment including tractors, excavators, implements, and associated attachments.
- **Bond**: Security deposit authorised to cover damage, misuse, or unpaid charges.
- **Damage**: Any harm outside normal wear and tear.
- **Wear and Tear**: Natural deterioration occurring through ordinary, intended use.
- **Policy Version**: The version of this Insurance & Damage Policy accepted by the Renter at booking time.

---

${LEGAL_DISCLAIMER}
`.trim()

export const INSURANCE_POLICY_SHORT_SUMMARY = 
  'Defines risk allocation, insurance expectations, and damage responsibilities for rentals on Lendit. ' +
  'Covers bonds, claims, and dispute resolution for NZ/AUS. ' +
  'This is a policy outline requiring legal review - not legal advice.'

// ============================================
// OWNER RESPONSIBILITIES
// ============================================

export const OWNER_RESPONSIBILITIES_CONTENT = `
# Owner Responsibilities

**Version:** 0.1  
**Last Updated:** ${new Date().toLocaleDateString('en-NZ', { year: 'numeric', month: 'long', day: 'numeric' })}

> This document is an operational framework. Final legal wording must be reviewed by qualified counsel in New Zealand and Australia.

---

## 1. General Obligations

Owners must ensure the machinery they list on Lendit is:

- **Accurately described**, including age, condition, model, attachments, and capabilities
- **Safe, compliant, and mechanically sound** at the time of pickup
- **Free of undisclosed defects** that may affect safe operation or performance
- **Fit for purpose**, consistent with the description in the listing

---

## 2. Insurance & Risk Disclosures

Owners must:

- **Clearly specify the insurance mode** (Owner-provided, Renter-provided, or No insurance)
- **State any insurance conditions**, such as:
  - Operator experience or licensing requirements
  - Restricted uses or environments
  - Excess amounts or repair processes
- **Notify renters of any known exclusions** or policy limitations
- **Not misrepresent the existence or applicability** of an insurance policy

Owners acknowledge that Lendit does not verify insurance validity.

---

## 3. Bond & Excess Requirements

- Owners may set a bond amount, visible on the listing
- Owners must specify any damage excess expectations and ensure they are reasonable and lawful
- Owners must not add undisclosed charges outside the platform workflow

---

## 4. Pre-Rental Requirements

Before releasing machinery, Owners must:

- Ensure the machinery has been maintained in accordance with manufacturer guidelines
- Record a Pickup Condition Checklist, including:
  - Machine exterior and interior
  - Tyres, hydraulics, hoses, PTO, guards, lights
  - Fuel level, engine hours
  - Photos documenting condition
- Provide safe-use guidance or manuals where relevant

---

## 5. During Rental

Owners must:

- Remain contactable for operational questions, faults, or incidents
- Address any pre-existing issues that cause safety or reliability concerns
- Not require renters to operate machinery illegally or unsafely

---

## 6. Return & Inspection

Upon return, Owners must:

- Complete a Return Condition Checklist and compare it against the pickup records
- Identify new damage (if any) and record:
  - Notes
  - Photos
  - Impacted components
  - Estimated costs (if known)
- Submit a Damage Report promptly if damage is suspected

Owners must act reasonably and in good faith when assessing damage.

---

## 7. Damage, Repair & Bond Usage

Owners may:

- Request bond deductions for:
  - Damage beyond fair wear and tear
  - Missing attachments or accessories
  - Excessive cleaning requirements
  - Misuse or unsafe operation
- Submit supporting evidence

Owners may not:

- Charge renters for normal wear and tear
- Inflate repair costs or apply arbitrary penalties

---

## 8. High-Risk Machinery

For machinery exceeding certain value or safety thresholds (as defined by Lendit policy), Owners may be required to:

- Provide additional proof of maintenance
- Provide compliance certifications
- Hold higher insurance coverage

---

## 9. Legal Compliance

Owners must:

- Comply with applicable NZ/AUS laws for plant hire, safety, insurance, and licensing
- Not offer machinery that is unsafe, unregistered (if road use is required), or prohibited by law

---

## 10. Definitions

(Refer to the Lendit Insurance & Damage Policy for shared definitions.)

---

${LEGAL_DISCLAIMER}
`.trim()

export const OWNER_RESPONSIBILITIES_SHORT_SUMMARY = 
  'Outlines Owner duties for equipment condition, insurance disclosure, and listing accuracy. ' +
  'Draft for NZ/AUS legal review - not legal advice.'

// ============================================
// RENTER RESPONSIBILITIES
// ============================================

export const RENTER_RESPONSIBILITIES_CONTENT = `
# Renter Responsibilities

**Version:** 0.1  
**Last Updated:** ${new Date().toLocaleDateString('en-NZ', { year: 'numeric', month: 'long', day: 'numeric' })}

> This outline is designed for legal refinement and counsel approval.

---

## 1. General Conduct

Renters must:

- **Operate machinery safely, competently, and within manufacturer and Owner guidelines**
- **Only operate machinery they are legally permitted to use**
- **Follow all licensing, endorsement, and competency requirements** (e.g., W, Wheels, Tracks, Rollers in NZ; state-based licensing in Australia)

---

## 2. Insurance Requirements

Depending on the listing's insurance mode, renters may be required to:

- **Provide proof of an active insurance policy covering:**
  - The machinery
  - The type of work performed
  - The region/state where used
- **Meet all insurer conditions** (experience, terrain, environment, etc.)

Failure to secure adequate insurance does not limit renter liability for damage.

---

## 3. Pre-Rental Inspection

Renters must:

- **Complete and agree to the Pickup Condition Checklist**
- **Inspect machinery for safety defects or pre-existing damage and notify the Owner**
- **Decline to operate machinery they believe is unsafe**

---

## 4. Safe & Lawful Use

Renters must:

- **Follow all legislation applicable to plant hire and machinery operation in NZ/AUS**

**Not:**
- Operate machinery under the influence
- Overload or overwork the machine
- Remove safety guards
- Use machinery for prohibited activities
- Sub-rent or allow third-party use
- Transport machinery illegally or operate on public roads unless legally permitted

---

## 5. During the Rental

Renters must:

- **Promptly report:**
  - Faults
  - Incidents
  - Accidents
  - New damage
- **Cease operation if machinery becomes unsafe**
- **Maintain reasonable care and custody of the equipment**

---

## 6. Return Obligations

Renters must:

- **Return machinery on time and in similar condition to pickup except for fair wear and tear**
- **Record a return checklist where required**
- **Refuel machinery to agreed levels (if specified)**
- **Return attachments/accessories clean and complete**

---

## 7. Damage Liability

Renters may be financially liable for:

- Damage beyond fair wear and tear
- Loss or theft of machinery
- Damage from unsafe operation
- Damage caused by improper licensing or lack of competency
- Contamination (fuel, hydraulics)
- Recovery costs if machinery becomes stuck or immobilised

---

## 8. Bond Usage

Renters acknowledge:

- Bonds may be partially or fully applied to repair costs, cleaning fees, or unpaid rental charges where justified
- Bond usage is determined by evidence, checklists, and dispute processes

---

## 9. Cooperation in Disputes

Renters must:

- **Provide information and evidence promptly when a damage claim is lodged**
- **Participate in negotiation and dispute resolution processes**

---

## 10. Legal Compliance

Renters must comply with all applicable:

- Health & Safety at Work Act (NZ)
- WHS regulations (AUS states/territories)
- Local licensing laws
- Road use rules where applicable

---

${LEGAL_DISCLAIMER}
`.trim()

export const RENTER_RESPONSIBILITIES_SHORT_SUMMARY = 
  'Outlines Renter duties for inspection, safe operation, damage liability, and insurance. ' +
  'Draft for NZ/AUS legal review - not legal advice.'

// ============================================
// TERMS OF SERVICE (PLACEHOLDER)
// ============================================

export const TERMS_OF_SERVICE_CONTENT = `
# Terms of Service

${DRAFT_NOTICE}

${LEGAL_DISCLAIMER}

## About These Terms

These terms govern your use of the Lendit platform. **This is placeholder content for development purposes only.** Before production use, these terms must be reviewed and approved by qualified legal professionals.

## Platform Role

Lendit is a marketplace platform that:

- Connects machinery owners with renters
- Provides tools for listing, booking, and communication
- Facilitates payment processing
- Provides dispute resolution assistance

Lendit does NOT:

- Own or operate the machinery listed
- Provide insurance coverage
- Guarantee the condition or suitability of equipment
- Provide legal, financial, or insurance advice
- Verify the accuracy of user-provided information

## User Responsibilities

All users must:

- Provide accurate information
- Comply with applicable laws
- Respect other users
- Use the platform appropriately
- Maintain account security

## Limitation of Liability

**[PLACEHOLDER - Requires legal review]**

Lendit's liability is limited to the extent permitted by law. We are not liable for:

- Actions or omissions of users
- Equipment condition or suitability
- Damage, injury, or loss arising from rentals
- Accuracy of user-provided information
- Insurance coverage or claims

## Dispute Resolution

**[PLACEHOLDER - Requires legal review]**

We provide dispute resolution assistance but this does not replace legal proceedings. Users retain their legal rights.

## Changes to Terms

We may update these terms. Continued use constitutes acceptance.

${LEGAL_DISCLAIMER}

**[END OF PLACEHOLDER CONTENT - REQUIRES FULL LEGAL REVIEW]**
`.trim()

export const TERMS_OF_SERVICE_SHORT_SUMMARY = 
  'Terms governing use of the Lendit marketplace platform. ' +
  'Draft for NZ/AUS legal review - not legal advice.'

// ============================================
// PRIVACY POLICY (PLACEHOLDER)
// ============================================

export const PRIVACY_POLICY_CONTENT = `
# Privacy Policy

${DRAFT_NOTICE}

${LEGAL_DISCLAIMER}

## About This Policy

This policy explains how we collect, use, and protect your personal information. **This is placeholder content for development purposes only.** Before production use, this policy must be reviewed for compliance with applicable privacy laws (e.g., NZ Privacy Act, GDPR).

## Information We Collect

**[PLACEHOLDER - Requires privacy law review]**

We may collect:

- Account information (name, email, phone)
- Payment information
- Listing and booking details
- Communications between users
- Usage data and analytics

## How We Use Information

**[PLACEHOLDER - Requires privacy law review]**

We use information to:

- Provide and improve our services
- Process transactions
- Communicate with users
- Ensure platform safety
- Comply with legal obligations

## Information Sharing

**[PLACEHOLDER - Requires privacy law review]**

We may share information with:

- Other users (as necessary for transactions)
- Payment processors
- Service providers
- Legal authorities (when required)

## Your Rights

**[PLACEHOLDER - Requires privacy law review]**

You may have rights to:

- Access your information
- Correct inaccurate information
- Delete your information
- Object to processing
- Data portability

## Contact

For privacy inquiries, contact our privacy team.

${LEGAL_DISCLAIMER}

**[END OF PLACEHOLDER CONTENT - REQUIRES PRIVACY LAW REVIEW]**
`.trim()

export const PRIVACY_POLICY_SHORT_SUMMARY = 
  'How Lendit collects, uses, and protects personal information. ' +
  'Draft for NZ Privacy Act / AUS Privacy Act review - not legal advice.'

// ============================================
// EXPORT ALL TEMPLATES
// ============================================

export const POLICY_TEMPLATES = {
  'insurance-and-damage-policy': {
    title: 'Insurance & Damage Policy',
    content: INSURANCE_POLICY_CONTENT,
    shortSummary: INSURANCE_POLICY_SHORT_SUMMARY,
    category: 'LEGAL',
  },
  'owner-responsibilities': {
    title: 'Owner Responsibilities',
    content: OWNER_RESPONSIBILITIES_CONTENT,
    shortSummary: OWNER_RESPONSIBILITIES_SHORT_SUMMARY,
    category: 'GUIDE',
  },
  'renter-responsibilities': {
    title: 'Renter Responsibilities',
    content: RENTER_RESPONSIBILITIES_CONTENT,
    shortSummary: RENTER_RESPONSIBILITIES_SHORT_SUMMARY,
    category: 'GUIDE',
  },
  'terms-of-service': {
    title: 'Terms of Service',
    content: TERMS_OF_SERVICE_CONTENT,
    shortSummary: TERMS_OF_SERVICE_SHORT_SUMMARY,
    category: 'LEGAL',
  },
  'privacy-policy': {
    title: 'Privacy Policy',
    content: PRIVACY_POLICY_CONTENT,
    shortSummary: PRIVACY_POLICY_SHORT_SUMMARY,
    category: 'LEGAL',
  },
}

export default POLICY_TEMPLATES
