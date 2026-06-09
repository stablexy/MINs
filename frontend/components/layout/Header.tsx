'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { cn } from '@/lib/utils/format'

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/wallets', label: 'Wallets' },
]

export function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-surface-border bg-surface/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">🔐</span>
          <span className="text-lg font-bold bg-gradient-to-r from-primary-400 to-violet-400 bg-clip-text text-transparent">
            MINs
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 flex-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                pathname?.startsWith(link.href)
                  ? 'bg-primary-500/10 text-primary-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-surface-tertiary'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto">
          <ConnectButton chainStatus="icon" showBalance={false} />
        </div>
      </div>
    </header>
  )
}
