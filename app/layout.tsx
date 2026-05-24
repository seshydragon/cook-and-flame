import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/layout/Navbar'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Cook & Flame',
  description: 'A vibrant community for home cooks to discover, curate, and share their favorite culinary creations.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={geist.className}>
        <Navbar />
        <main className="min-h-screen bg-gray-50 pt-16">
          {children}
        </main>
      </body>
    </html>
  )
}
