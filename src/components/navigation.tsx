'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Button } from './ui/button'
import { Menu, X, User, LogOut, Settings, FileText, Shield, Tractor } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

export function Navigation() {
  const { data: session, status } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="border-b border-lendit-green-100 bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            {/* Lendit Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-lendit-green rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl text-lendit-green leading-tight">Lendit</span>
              </div>
            </Link>
            
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/browse" className="text-sm font-medium text-gray-700 hover:text-lendit-green transition-colors">
                Browse Machinery
              </Link>
              <Link href="/how-it-works" className="text-sm font-medium text-gray-700 hover:text-lendit-green transition-colors">
                How it Works
              </Link>
              <Link href="/insurance-damage" className="text-sm font-medium text-gray-700 hover:text-lendit-green transition-colors">
                Insurance & Damage
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-lendit-green"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          <div className="hidden md:flex items-center space-x-4">
            {status === 'loading' ? (
              <div className="h-10 w-24 bg-lendit-green-100 animate-pulse rounded" />
            ) : session ? (
              <>
                <Button asChild className="bg-lendit-green hover:bg-lendit-green-600">
                  <Link href="/listings/new">List Your Machinery</Link>
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-lendit-green hover:bg-lendit-green-50">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium text-lendit-green">{session.user?.name || session.user?.email}</p>
                      <p className="text-xs text-gray-500">{session.user?.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/listings" className="cursor-pointer">
                        <FileText className="mr-2 h-4 w-4" />
                        My Listings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/bookings" className="cursor-pointer">
                        <FileText className="mr-2 h-4 w-4" />
                        My Bookings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/verification" className="cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" />
                        Verification
                      </Link>
                    </DropdownMenuItem>
                    {(session.user as any)?.role === 'ADMIN' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="cursor-pointer">
                            <Settings className="mr-2 h-4 w-4" />
                            Admin Panel
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" className="text-lendit-green hover:bg-lendit-green-50">
                  <Link href="/auth/signin">Sign In</Link>
                </Button>
                <Button asChild className="bg-lendit-green hover:bg-lendit-green-600">
                  <Link href="/auth/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-lendit-green-100 py-4">
            <div className="flex flex-col space-y-3">
              <Link 
                href="/browse" 
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-lendit-green-50 hover:text-lendit-green transition-colors rounded"
                onClick={() => setMobileMenuOpen(false)}
              >
                Browse Machinery
              </Link>
              <Link 
                href="/how-it-works" 
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-lendit-green-50 hover:text-lendit-green transition-colors rounded"
                onClick={() => setMobileMenuOpen(false)}
              >
                How it Works
              </Link>
              <Link 
                href="/insurance-damage" 
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-lendit-green-50 hover:text-lendit-green transition-colors rounded"
                onClick={() => setMobileMenuOpen(false)}
              >
                Insurance & Damage
              </Link>
              
              <div className="border-t border-lendit-green-100 pt-3 mt-2">
                {session ? (
                  <>
                    <Link 
                      href="/dashboard" 
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-lendit-green-50 hover:text-lendit-green transition-colors rounded block"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link 
                      href="/dashboard/listings" 
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-lendit-green-50 hover:text-lendit-green transition-colors rounded block"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Listings
                    </Link>
                    <button 
                      onClick={() => { signOut(); setMobileMenuOpen(false); }}
                      className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors rounded w-full text-left"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 px-4">
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/auth/signin" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                    </Button>
                    <Button asChild className="w-full bg-lendit-green hover:bg-lendit-green-600">
                      <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}>Sign Up</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
