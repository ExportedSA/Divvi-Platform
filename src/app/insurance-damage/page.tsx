import { Mail } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function InsuranceDamagePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Quick Navigation */}
        <div className="bg-white rounded-xl border p-6 mb-8">
          <h2 className="font-semibold text-gray-900 mb-4">Quick Navigation</h2>
          <div className="grid md:grid-cols-2 gap-2 text-sm">
            {[
              { num: 1, title: 'Overview' },
              { num: 2, title: 'Insurance Modes' },
              { num: 3, title: 'Security Bond' },
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

        {/* Section 1: Overview */}
        <section id="section-1" className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-divvi-green text-white rounded-full flex items-center justify-center text-sm">1</span>
            Overview
          </h2>
          
          <div className="bg-white rounded-xl border p-6">
            <p className="text-gray-700 mb-4">
              Divvi facilitates equipment rentals between owners and renters across New Zealand. This policy establishes clear guidelines for 
              insurance coverage, damage reporting, and dispute resolution.
            </p>
          </div>
        </section>

        {/* Section 2: Insurance Modes */}
        <section id="section-2" className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-divvi-green text-white rounded-full flex items-center justify-center text-sm">2</span>
            Insurance Modes
          </h2>
          
          <div className="bg-white rounded-xl border p-6 space-y-6">
            <p className="text-gray-700">
              Equipment on Divvi can be listed under three insurance modes:
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">### Owner-Provided Insurance</h3>
              <ul className="list-disc ml-6 text-blue-700 text-sm space-y-1">
                <li>The owner maintains insurance coverage for the equipment</li>
                <li>Renters are still responsible for damage caused by negligence or misuse</li>
                <li>The owner&apos;s insurance details are shown on the listing</li>
                <li>Excess amounts may apply and will be communicated before booking</li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-semibold text-amber-800 mb-2">### Renter-Provided Insurance</h3>
              <ul className="list-disc ml-6 text-amber-700 text-sm space-y-1">
                <li>The renter must provide their own insurance coverage</li>
                <li>Proof of insurance may be requested before pickup</li>
                <li>The renter is fully responsible for any damage during the rental period</li>
              </ul>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-2">### No Insurance</h3>
              <ul className="list-disc ml-6 text-red-700 text-sm space-y-1">
                <li>Neither party provides insurance coverage</li>
                <li>The renter bears full responsibility for any damage, loss, or theft</li>
                <li>We strongly recommend appropriate coverage for high-value equipment</li>
              </ul>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-6">
              <p className="text-slate-700 text-sm">
                <strong>⚠️ Important:</strong> Regardless of insurance mode, renters are always responsible for damage caused by 
                negligence, misuse, or failure to follow operating instructions.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Security Bond */}
        <section id="section-3" className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-divvi-green text-white rounded-full flex items-center justify-center text-sm">3</span>
            Security Bond
          </h2>
          
          <div className="bg-white rounded-xl border p-6 space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">### Bond Purpose</h3>
              <p className="text-gray-700 mb-2">
                Bonds provide security against potential damage or loss:
              </p>
              <ul className="list-disc ml-6 text-gray-700 space-y-1">
                <li>Bond amounts are set by owners based on equipment value</li>
                <li>Bonds are held during the rental period</li>
                <li>Bonds are held pending return inspection</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">### Bond Release</h3>
              <p className="text-gray-700 mb-2">
                Bonds are released within 48 hours of successful return inspection:
              </p>
              <ul className="list-disc ml-6 text-gray-700 space-y-1">
                <li>If damage is reported, the bond may be held pending resolution</li>
                <li>Partial bond amounts may be retained to cover repair costs</li>
                <li>Full bond capture may occur for significant damage or loss</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">### Dispute Resolution</h3>
              <p className="text-green-700 text-sm mb-2">
                If there&apos;s a disagreement about damage:
              </p>
              <ul className="list-disc ml-6 text-green-700 text-sm space-y-1">
                <li>Both parties should provide photographic evidence</li>
                <li>Divvi&apos;s support team will review the case</li>
                <li>Decisions are made based on evidence and policy guidelines</li>
                <li>Appeals can be submitted within 7 days of a decision</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="bg-divvi-green text-white rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Questions About Insurance or Damage?</h2>
          <p className="text-divvi-green-200 mb-6">
            Contact our support team if you need help with insurance or damage claims
          </p>
          <a 
            href="mailto:support@divvi.co.nz"
            className="inline-flex items-center gap-2 bg-white text-divvi-green px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            <Mail className="h-5 w-5" />
            support@divvi.co.nz
          </a>
        </section>

        {/* Last Updated */}
        <p className="text-center text-sm text-gray-500 mt-8">
          Last updated: {new Date().toLocaleDateString('en-NZ', { month: 'long', year: 'numeric' })}
        </p>
      </div>
    </div>
  )
}
