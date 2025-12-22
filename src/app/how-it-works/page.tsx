import { Mail } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function HowItWorksPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Quick Navigation */}
        <div className="bg-white rounded-xl border p-6 mb-8">
          <h2 className="font-semibold text-gray-900 mb-4">Quick Navigation</h2>
          <div className="grid md:grid-cols-2 gap-2 text-sm">
            {[
              { num: 1, title: 'For Renters' },
              { num: 2, title: 'For Owners' },
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

        {/* Introduction */}
        <section className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">📋 How Divvi Works</h1>
          <div className="bg-white rounded-xl border p-6">
            <p className="text-gray-700 mb-4">
              Divvi connects <strong>equipment owners</strong> with people who need to rent <strong>machinery</strong>, 
              <strong>tools</strong>, and equipment. Whether you&apos;re looking to rent or let equipment, here&apos;s everything you need to know.
            </p>
          </div>
        </section>

        {/* Section 1: For Renters */}
        <section id="section-1" className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-divvi-green text-white rounded-full flex items-center justify-center text-sm">1</span>
            For Renters
          </h2>
          
          <div className="bg-white rounded-xl border p-6 space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">### 1. Find Equipment</h3>
              <p className="text-gray-700 mb-2">Browse our marketplace to find the equipment you need:</p>
              <ul className="list-disc ml-6 text-gray-700 space-y-1">
                <li><strong>Search</strong> by category, location, or keyword</li>
                <li><strong>Filter</strong> by price, availability, and features</li>
                <li><strong>Compare</strong> listings to find the best fit</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">### 2. Request a Booking</h3>
              <p className="text-gray-700 mb-2">Once you&apos;ve found the right equipment:</p>
              <ul className="list-disc ml-6 text-gray-700 space-y-1">
                <li>Select your <strong>rental dates</strong></li>
                <li>Check the <strong>total cost</strong> (if available)</li>
                <li>Review the <strong>cost breakdown</strong> including bond and fees</li>
                <li>Submit your <strong>booking request</strong></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">### 3. Get Approved</h3>
              <p className="text-gray-700 mb-2">The owner will review your request:</p>
              <ul className="list-disc ml-6 text-gray-700 space-y-1">
                <li>Most owners respond within <strong>2-24 hours</strong></li>
                <li>You may receive questions about your intended use</li>
                <li>Once approved, you&apos;ll receive confirmation</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">### 4. Pay & Pickup</h3>
              <p className="text-gray-700 mb-2">Complete your booking:</p>
              <ul className="list-disc ml-6 text-gray-700 space-y-1">
                <li><strong>Pay securely</strong> through the platform</li>
                <li>A <strong>security bond</strong> is held (released after return)</li>
                <li>Meet the owner or arrange delivery</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 2: For Owners */}
        <section id="section-2" className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-divvi-green text-white rounded-full flex items-center justify-center text-sm">2</span>
            For Owners
          </h2>
          
          <div className="bg-white rounded-xl border p-6 space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">### 1. List Your Equipment</h3>
              <p className="text-gray-700 mb-2">Create a listing for your equipment:</p>
              <ul className="list-disc ml-6 text-gray-700 space-y-1">
                <li>Add <strong>photos</strong> and detailed <strong>description</strong></li>
                <li>Set your <strong>daily/weekly rates</strong></li>
                <li>Specify <strong>location</strong> and <strong>availability</strong></li>
                <li>Define <strong>insurance</strong> and <strong>bond</strong> requirements</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">### 2. Receive Bookings</h3>
              <p className="text-gray-700 mb-2">When renters request your equipment:</p>
              <ul className="list-disc ml-6 text-gray-700 space-y-1">
                <li>Review the <strong>booking details</strong></li>
                <li>Check the renter&apos;s <strong>profile</strong></li>
                <li>Accept or decline within <strong>24 hours</strong></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">### 3. Hand Over Equipment</h3>
              <p className="text-gray-700 mb-2">Prepare for the rental:</p>
              <ul className="list-disc ml-6 text-gray-700 space-y-1">
                <li>Ensure equipment is <strong>clean</strong> and in <strong>good condition</strong></li>
                <li>Provide <strong>operating instructions</strong></li>
                <li>Document the <strong>condition</strong> with photos</li>
                <li>Meet the renter or arrange delivery</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">### 4. Get Paid</h3>
              <p className="text-gray-700 mb-2">After the rental:</p>
              <ul className="list-disc ml-6 text-gray-700 space-y-1">
                <li>Inspect equipment upon return</li>
                <li>Report any damage if necessary</li>
                <li>Payment is transferred to your account</li>
                <li>Bond is released or used for damage claims</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="bg-divvi-green text-white rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Need Help Getting Started?</h2>
          <p className="text-divvi-green-200 mb-6">
            Contact our support team if you have any questions about how Divvi works
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
