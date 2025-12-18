import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { Mail } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TermsPage() {
  const page = await prisma.staticPage.findUnique({
    where: { slug: 'terms' },
  })

  if (!page) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Quick Navigation */}
          <div className="bg-white rounded-xl border p-6 mb-8">
            <h2 className="font-semibold text-gray-900 mb-4">Quick Navigation</h2>
            <div className="grid md:grid-cols-3 gap-2 text-sm">
              {[
                { num: 1, title: 'Introduction & Scope' },
                { num: 2, title: 'Membership & Eligibility' },
                { num: 3, title: 'Listings, Bookings & Rental' },
                { num: 4, title: 'Fees, Payments & Payouts' },
                { num: 5, title: 'User Conduct & Rules' },
                { num: 6, title: 'Disclaimers & Liability' },
                { num: 7, title: 'Compliance & Verification' },
                { num: 8, title: 'Reporting & Disputes' },
                { num: 9, title: 'Intellectual Property' },
                { num: 10, title: 'Privacy & Data' },
                { num: 11, title: 'Changes to Terms' },
                { num: 12, title: 'Governing Law' },
              ].map((item) => (
                <a 
                  key={item.num} 
                  href={`#section-${item.num}`}
                  className="text-blue-600 hover:underline"
                >
                  {item.num}. {item.title}
                </a>
              ))}
            </div>
          </div>

          {/* Section 1: Introduction */}
          <section id="section-1" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-divvi-green text-white rounded-full flex items-center justify-center text-sm">1</span>
              Introduction & Scope
            </h2>
            
            <div className="bg-white rounded-xl border p-6 space-y-4">
              <div>
                <p className="text-gray-700 mb-3">
                  <strong>1.1</strong> These Terms & Conditions (&quot;Terms&quot;) govern your access to and use of the Divvi platform — 
                  including listing, booking, rental, payment, bond, insurance, damage-reporting, compliance, and related services.
                </p>
              </div>
              
              <div>
                <p className="text-gray-700 mb-3">
                  <strong>1.2</strong> By registering an account, listing machinery, or making a booking via Divvi, you confirm that 
                  you have read, understood, and agree to be bound by these Terms (and any related policies: Insurance & Damage, 
                  AML/KYC, Safety & Conduct, Account Restrictions, etc.).
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  <strong>1.3 Important:</strong> Divvi acts as a <strong>marketplace facilitator only</strong> — Divvi does not own, 
                  rent, or operate the machinery. All rental agreements are between the listing Owner and the Renter. Divvi provides 
                  the digital infrastructure, payment facilitation (including bonds & fees), compliance framework (e.g. insurance, AML/KYC), 
                  and dispute-support mechanisms.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Membership */}
          <section id="section-2" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-divvi-green text-white rounded-full flex items-center justify-center text-sm">2</span>
              Membership & Eligibility
            </h2>
            
            <div className="bg-white rounded-xl border p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">2.1 Eligibility</h3>
                <p className="text-gray-700 mb-2">To use Divvi, you must:</p>
                <ul className="list-disc ml-6 text-gray-700 space-y-1">
                  <li>Be at least 18 years old and legally capable of entering contracts</li>
                  <li>Be resident in New Zealand or Australia (or another jurisdiction only with explicit Divvi consent) — 
                      as machinery rental laws, insurance and compliance requirements vary by region</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">2.2 Registration</h3>
                <p className="text-gray-700">
                  During sign-up you must provide true, correct and up-to-date personal information, and complete any required 
                  identity / business / AML-KYC verification before being allowed to list, rent or receive payouts.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">2.3 Account Integrity</h3>
                <p className="text-gray-700">
                  You are responsible for all activity occurring on your account. You must keep login credentials secure, 
                  not share them, and notify Divvi immediately if you suspect unauthorised access.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Listings & Bookings */}
          <section id="section-3" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-divvi-green text-white rounded-full flex items-center justify-center text-sm">3</span>
              Listings, Bookings & Rental Process
            </h2>
            
            <div className="bg-white rounded-xl border p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">3.1 Listings</h3>
                <p className="text-gray-700">
                  Owners may list machinery for rental, specifying all required details: description, condition, pricing, 
                  insurance/bond parameters, risk attributes, and safety compliance. Listings must be accurate, honest and 
                  comply with Divvi&apos;s Listing Policies.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">3.2 Listing Review</h3>
                <p className="text-gray-700">
                  Divvi (or Divvi&apos;s admin) reserves the right to review, approve, reject, pause or remove any listing 
                  at any time — especially if information is missing, false, high risk, or non-compliant with policies.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">3.3 Bookings</h3>
                <p className="text-gray-700">
                  Renters submit a booking request for listed machinery. Bookings must respect availability, status, rental 
                  duration, and any listing-specific constraints (e.g. licence requirements, bond amount, insurance mode, 
                  high-risk asset conditions).
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">3.4 Booking Acceptance & Fees</h3>
                <p className="text-gray-700">
                  Upon Owner acceptance, the Renter commits to payment: rental cost + platform fee + bond authorisation 
                  (where applicable). Failure to pay may void the booking.
                </p>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="font-semibold text-amber-800 mb-2">3.5 Rental Agreement</h3>
                <p className="text-amber-700 text-sm">
                  The rental agreement (machinery hire) is between Owner and Renter. Divvi is not a party to the hire contract, 
                  but provides the framework (payment, bond, insurance terms, damage reporting, dispute support).
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">3.6 Insurance, Bonds, Damage & Return Conditions</h3>
                <p className="text-gray-700">
                  Rentals are subject to the terms laid out in Divvi&apos;s Insurance & Damage Policy. Renter must return 
                  machinery in agreed condition; bond may be used to cover damage, loss or breach.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: Fees & Payments */}
          <section id="section-4" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-divvi-green text-white rounded-full flex items-center justify-center text-sm">4</span>
              Fees, Payments & Payouts
            </h2>
            
            <div className="bg-white rounded-xl border p-6 space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">4.1 Platform Fee</h3>
                <p className="text-green-700">
                  Divvi charges a tiered platform fee: <strong>1.5%</strong> for rentals under $5,000, and <strong>1%</strong> for 
                  rentals $5,000 and above (excluding bond).
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">4.2 Charges</h3>
                <p className="text-gray-700">
                  At booking acceptance: rental + fee is charged via Stripe; bond is authorised (not charged yet). Bond authorisations 
                  are valid for up to 7 days. Upon rental completion and inspection: bond is released or captured (in part or full) 
                  depending on damage report outcome.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">4.3 Payouts</h3>
                <p className="text-gray-700">
                  For Owners, net payout (after fee) is transferred via Stripe Connect after successful rental completion unless 
                  there are damage or claim disputes. Refunds are processed to the original payment method and may take 5-10 business days.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">4.4 Negative Balances & Debts</h3>
                <p className="text-gray-700">
                  If a User owes Divvi money (e.g. from damage, chargebacks, unpaid fees), Divvi may suspend listing, 
                  booking or payout privileges until debt is resolved.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5: User Conduct */}
          <section id="section-5" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-divvi-green text-white rounded-full flex items-center justify-center text-sm">5</span>
              User Conduct & Listing / Booking Rules
            </h2>
            
            <div className="bg-white rounded-xl border p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">5.1 Compliance</h3>
                <p className="text-gray-700">
                  All Users (Owners, Renters, Admins) must comply with applicable laws (safety, licensing, machinery operation), 
                  Divvi policies (Insurance & Damage, Safety, Conduct), and community standards.
                </p>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 mb-2">5.2 Prohibited Content & Misconduct</h3>
                <p className="text-red-700 text-sm">
                  Listings or communication that are fraudulent, misleading, abusive, hateful, discriminatory, unsafe or 
                  otherwise harmful are prohibited. Divvi may remove or disable content or accounts at its discretion.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">5.3 Reporting & Enforcement</h3>
                <p className="text-gray-700">
                  Users can report scams, abuse, harmful communication, or non-compliance. Divvi&apos;s Trust & Safety team 
                  may review, and impose warnings, restrictions, suspensions or bans as per the 
                  <Link href="/policy/account-restrictions" className="text-blue-600 hover:underline"> Account Restrictions Policy</Link>.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Disclaimers & Liability */}
          <section id="section-6" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-divvi-green text-white rounded-full flex items-center justify-center text-sm">6</span>
              Disclaimers, Liability & Risk Allocation
            </h2>
            
            <div className="bg-white rounded-xl border p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">6.1 No Warranty of Machinery Condition</h3>
                <p className="text-gray-700">
                  Divvi does not guarantee the condition, suitability or fitness for purpose of any listed machinery. 
                  Owners are responsible for accurate listing and safe condition; Renters must inspect on pickup.
                </p>
              </div>
              
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h3 className="font-semibold text-slate-800 mb-2">6.2 No Platform Liability for Rental Contract</h3>
                <p className="text-slate-700 text-sm mb-2">
                  Because the rental agreement is between Owner and Renter, Divvi is not liable for:
                </p>
                <ul className="list-disc ml-6 text-slate-700 text-sm space-y-1">
                  <li>Defects or breakdowns</li>
                  <li>Injury, damage, or loss arising from machinery use</li>
                  <li>Disputes around operation, misuse, or third-party liability</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">6.3 Insurance & Bond</h3>
                <p className="text-gray-700">
                  Where insurance is provided (owner- or renter-specified), coverage depends on Owner/Renter&apos;s policy terms. 
                  Divvi assumes no responsibility for policy validity or claim outcomes.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">6.4 Limitation of Liability</h3>
                <p className="text-gray-700">
                  Except where prohibited by law, Divvi&apos;s total liability to any user for any loss or claim arising 
                  from platform use is limited to direct, proven damages up to the total fees paid by that user for the 
                  relevant transaction.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">6.5 Indemnification</h3>
                <p className="text-gray-700">
                  Users agree to indemnify and hold harmless Divvi, its officers, employees and agents from any claims, 
                  losses or liability arising out of their use of the platform, rental, listing or breach of Terms.
                </p>
              </div>
            </div>
          </section>

          {/* Section 7: Compliance */}
          <section id="section-7" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-divvi-green text-white rounded-full flex items-center justify-center text-sm">7</span>
              Compliance, Verification & Account Restrictions
            </h2>
            
            <div className="bg-white rounded-xl border p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">7.1 AML / KYC & Verification</h3>
                <p className="text-gray-700">
                  Owners (and possibly Renters) must complete identity or business verification, provide proof of address / 
                  incorporation, and comply with AML/CFT requirements before listing or receiving payouts. Non-verified 
                  accounts may be restricted or suspended.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">7.2 Safety & Risk</h3>
                <p className="text-gray-700">
                  Listings involving high-risk machinery must meet additional safety, insurance, bond or compliance 
                  requirements (licences, documentation, maintenance proof).
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">7.3 Enforcement</h3>
                <p className="text-gray-700">
                  Divvi reserves the right to restrict, suspend or ban accounts (temporarily or permanently) for violations 
                  of Terms, repeated verified reports (scam, abuse, safety), or failure to comply with verification / 
                  compliance obligations.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">7.4 User Notification and Appeals</h3>
                <p className="text-gray-700">
                  Where restrictions or suspensions occur, Divvi will notify the user (in-app and via email), state the 
                  general reason, and may provide remediation or appeal instructions (e.g. complete KYC, submit missing docs).
                </p>
              </div>
            </div>
          </section>

          {/* Section 8: Reporting & Disputes */}
          <section id="section-8" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-divvi-green text-white rounded-full flex items-center justify-center text-sm">8</span>
              Reporting, Dispute & Damage Procedures
            </h2>
            
            <div className="bg-white rounded-xl border p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">8.1 Dispute Framework</h3>
                <p className="text-gray-700">
                  For damage, misuse, loss, or disagreements: users should follow Divvi&apos;s dispute & damage reporting 
                  procedure — including condition checklists, photographic evidence, claim submission, negotiation window, 
                  and possible bond capture.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">8.2 Safe & Responsible Communication</h3>
                <p className="text-gray-700">
                  All communications (messages, booking discussions, listing questions) must comply with Divvi&apos;s 
                  <Link href="/policy/harmful-communications" className="text-blue-600 hover:underline"> Safety & Conduct rules</Link>. 
                  Users may report harmful communication; repeated or serious violations may result in account restriction / suspension.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">8.3 Scam / Fraud & Vulnerability Reporting</h3>
                <p className="text-gray-700">
                  Users are encouraged to report any suspected scams, fraud, off-platform payment requests or 
                  <Link href="/security/report-vulnerability" className="text-blue-600 hover:underline"> security vulnerabilities</Link>. 
                  Reports will be reviewed; users may face suspension, listings removal or account closure.
                </p>
              </div>
            </div>
          </section>

          {/* Section 9: Intellectual Property */}
          <section id="section-9" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-divvi-green text-white rounded-full flex items-center justify-center text-sm">9</span>
              Intellectual Property & Use of Content
            </h2>
            
            <div className="bg-white rounded-xl border p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">9.1 Platform Content</h3>
                <p className="text-gray-700">
                  All trademarks, logos, UI, code, documentation and content on Divvi belong to Divvi (or its licensors).
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">9.2 User Content</h3>
                <p className="text-gray-700">
                  By listing machinery, posting photos or writing messages/reviews, users grant Divvi a non-exclusive, 
                  royalty-free, worldwide licence to use, modify, display and distribute that content within the platform, 
                  for service provision, promotion or legal compliance.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">9.3 Prohibited Uses</h3>
                <p className="text-gray-700">
                  Users may not scrape, data-mine, reverse-engineer, or replicate Divvi content outside the platform; 
                  no bots or automation except with explicit Divvi permission.
                </p>
              </div>
            </div>
          </section>

          {/* Section 10: Privacy */}
          <section id="section-10" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-divvi-green text-white rounded-full flex items-center justify-center text-sm">10</span>
              Privacy & Data Protection
            </h2>
            
            <div className="bg-white rounded-xl border p-6">
              <p className="text-gray-700 mb-4">
                You agree that Divvi will collect, store and process your personal data (identity, address, payment, 
                verification documents, usage logs) for the purposes of:
              </p>
              <ul className="list-disc ml-6 text-gray-700 space-y-2 mb-4">
                <li>Providing platform services (listings, bookings, payments)</li>
                <li>Compliance (AML/KYC, insurance/dispute handling)</li>
                <li>Trust & Safety, fraud prevention, security and lawful obligations</li>
              </ul>
              <p className="text-gray-700">
                Divvi will handle data in accordance with applicable privacy laws (NZ / AUS) and its published 
                <Link href="/privacy" className="text-blue-600 hover:underline"> Privacy Policy</Link>.
              </p>
            </div>
          </section>

          {/* Section 11: Changes */}
          <section id="section-11" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-divvi-green text-white rounded-full flex items-center justify-center text-sm">11</span>
              Changes to Terms & Notices
            </h2>
            
            <div className="bg-white rounded-xl border p-6 space-y-4">
              <div>
                <p className="text-gray-700">
                  <strong>11.1</strong> Divvi may update these Terms from time to time, to reflect changes in legislation, 
                  business model, or platform features. Updated Terms will be posted on the site/app; for material changes, 
                  Divvi may notify users directly (email or in-app).
                </p>
              </div>
              
              <div>
                <p className="text-gray-700">
                  <strong>11.2</strong> Unless otherwise stated, the version of Terms that applies to a specific transaction 
                  or listing is the version accepted by the user at the time of listing/booking.
                </p>
              </div>
            </div>
          </section>

          {/* Section 12: Governing Law */}
          <section id="section-12" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-divvi-green text-white rounded-full flex items-center justify-center text-sm">12</span>
              Governing Law & Dispute Resolution
            </h2>
            
            <div className="bg-white rounded-xl border p-6">
              <p className="text-gray-700">
                These Terms are governed by the laws applicable to the user&apos;s country of residence (New Zealand or Australia). 
                Any disputes arising from the use of Divvi shall be resolved under those laws.
              </p>
            </div>
          </section>

          {/* Section 13: Definitions */}
          <section id="section-13" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-divvi-green text-white rounded-full flex items-center justify-center text-sm">13</span>
              Definitions
            </h2>
            
            <div className="bg-slate-50 rounded-xl border p-6">
              <dl className="space-y-3">
                {[
                  { term: 'Platform / Divvi', def: 'The website / application / service facilitating listings, bookings, payments, bonds, compliance, and dispute support.' },
                  { term: 'Owner', def: 'A user listing machinery for rent.' },
                  { term: 'Renter', def: 'A user booking machinery for rent.' },
                  { term: 'Listing', def: 'Machinery offered for rent.' },
                  { term: 'Booking', def: 'An accepted rental request between Owner and Renter.' },
                  { term: 'Bond', def: 'Security deposit authorised at booking to secure against damage / misuse.' },
                  { term: 'Platform Fee', def: 'Tiered fee: 1.5% for rentals under $5,000, 1% for rentals $5,000+ for facilitating the transaction.' },
                  { term: 'Verified / Compliance', def: 'Users or listings that have met identity, insurance, safety or other vetting requirements.' },
                  { term: 'Safety Report / Scam / Abuse / Vulnerability Reports', def: 'Reports submitted by users alleging misconduct, fraud, harmful communication, or platform security issues.' },
                  { term: 'Account Restriction / Suspension', def: 'Temporary or permanent limitation or deactivation of a user\'s ability to use some or all of Divvi\'s services.' },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:gap-4">
                    <dt className="font-semibold text-gray-900 sm:w-1/3">{item.term}</dt>
                    <dd className="text-gray-700 sm:w-2/3">{item.def}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          {/* Related Policies */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Related Policies</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Link 
                href="/privacy"
                className="bg-white rounded-lg border p-4 hover:border-gray-300 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 mb-1">Privacy Policy</h3>
                <p className="text-sm text-gray-600">How we handle your data</p>
              </Link>
              <Link 
                href="/policy/scam-prevention-and-advice"
                className="bg-white rounded-lg border p-4 hover:border-gray-300 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 mb-1">Scam Prevention</h3>
                <p className="text-sm text-gray-600">Stay safe from scams</p>
              </Link>
              <Link 
                href="/policy/account-restrictions"
                className="bg-white rounded-lg border p-4 hover:border-gray-300 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 mb-1">Account Restrictions</h3>
                <p className="text-sm text-gray-600">Enforcement policy</p>
              </Link>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-divvi-green text-white rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Questions About These Terms?</h2>
            <p className="text-divvi-green-200 mb-6">
              Contact our support team if you have any questions about these Terms & Conditions
            </p>
            <a 
              href="mailto:legal@Divvi.co.nz"
              className="inline-flex items-center gap-2 bg-white text-divvi-green px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              <Mail className="h-5 w-5" />
              legal@Divvi.co.nz
            </a>
          </section>

          {/* Last Updated */}
          <p className="text-center text-sm text-gray-500 mt-8">
            Last updated: {new Date().toLocaleDateString('en-NZ', { month: 'long', year: 'numeric' })} • Version 1.0
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardContent className="prose prose-neutral max-w-none p-8">
          <div dangerouslySetInnerHTML={{ __html: page.content.replace(/\n/g, '<br />') }} />
        </CardContent>
      </Card>
    </div>
  )
}
