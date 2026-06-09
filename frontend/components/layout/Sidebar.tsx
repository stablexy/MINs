'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Wallet,
  Activity,
  Settings,
  Shield,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils/format'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/wallets', label: 'Wallets', icon: Wallet },
  { href: '/wallets', label: 'Transactions', icon: Activity },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'w-64 bg-surface-secondary border-r border-surface-border flex flex-col',
        className
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-surface-border">
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <span className="text-lg font-bold bg-gradient-to-r from-primary-400 to-violet-400 bg-clip-text text-transparent">
          MINs
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = pathname?.startsWith(item.href)

          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group',
                isActive
                  ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-surface-tertiary'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 flex-shrink-0',
                  isActive ? 'text-primary-400' : 'text-slate-500 group-hover:text-slate-300'
                )}
              />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-primary-400/50" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-surface-border">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-surface-tertiary transition-all"
        >
          <Settings className="w-4 h-4 text-slate-500" />
          Settings
        </Link>
      </div>
    </aside>
  )
}
