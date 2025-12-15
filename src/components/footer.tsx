import Link from 'next/link'
import { Tractor, Mail, MapPin } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-lendit-green text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-lendit-green font-bold text-xl">L</span>
              </div>
              <div>
                <span className="font-bold text-2xl">Lendit</span>
                <p className="text-lendit-green-200 text-xs">Rent with confidence</p>
              </div>
            </div>
            <p className="text-lendit-green-200 text-sm leading-relaxed">
              The trusted marketplace for farm machinery rentals across New Zealand and Australia.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/browse" className="text-lendit-green-200 hover:text-white transition-colors text-sm">
                  Browse Machinery
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-lendit-green-200 hover:text-white transition-colors text-sm">
                  How it Works
                </Link>
              </li>
              <li>
                <Link href="/dashboard/listings/new" className="text-lendit-green-200 hover:text-white transition-colors text-sm">
                  List Your Equipment
                </Link>
              </li>
              <li>
                <Link href="/dashboard/become-owner" className="text-lendit-green-200 hover:text-white transition-colors text-sm">
                  Become an Owner
                </Link>
              </li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Policies</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-lendit-green-200 hover:text-white transition-colors text-sm">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/insurance-damage" className="text-lendit-green-200 hover:text-white transition-colors text-sm">
                  Insurance & Damage
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-lendit-green-200 hover:text-white transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-lendit-green-200 text-sm">
                <Mail className="h-4 w-4" />
                <span>support@lendit.co.nz</span>
              </li>
              <li className="flex items-start gap-2 text-lendit-green-200 text-sm">
                <MapPin className="h-4 w-4 mt-0.5" />
                <span>Serving NZ & Australia</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-lendit-green-600 mt-10 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-lendit-green-200 text-sm">
              © {currentYear} Lendit. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <span className="text-lendit-green-200 text-xs">
                🇳🇿 New Zealand
              </span>
              <span className="text-lendit-green-200 text-xs">
                🇦🇺 Australia
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
