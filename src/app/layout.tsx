import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Lendit - Rent with Confidence | NZ & AU Farm Equipment Rentals',
  description: 'Rent tractors, loaders, diggers, and farm equipment across New Zealand and Australia. The trusted marketplace for machinery rentals.',
  keywords: ['farm equipment rental', 'tractor hire', 'machinery rental', 'New Zealand', 'Australia', 'agricultural equipment'],
  authors: [{ name: 'Lendit' }],
  openGraph: {
    title: 'Lendit - Farm Equipment Rentals',
    description: 'The trusted marketplace for farm machinery rentals across NZ & AU',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#1E3A2F',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <Providers>
          <Navigation />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
