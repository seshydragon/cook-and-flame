'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Flame, Home, Plus, BarChart2, Calendar, Star, User } from 'lucide-react'

const links = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/add', label: 'Add', icon: Plus },
  { href: '/macro-tracker', label: 'Macros', icon: BarChart2 },
  { href: '/meal-planner', label: 'Planner', icon: Calendar },
  { href: '/pricing', label: 'Pricing', icon: Star },
  { href: '/profile', label: 'Profile', icon: User },
]

export default function Navbar() {
  const pathname = usePathname()
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-16 flex items-center px-4 gap-2">
      <Link href="/" className="flex items-center gap-1.5 font-serif text-lg text-orange-700 font-semibold mr-2">
        <Flame size={20} className="text-orange-600" />
        Cook &amp; Flame
      </Link>
      <div className="flex-1" />
      <div className="flex items-center gap-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              pathname === href
                ? 'bg-orange-50 text-orange-700 font-medium'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
            }`}
          >
            <Icon size={15} />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
