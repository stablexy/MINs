'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Users, Clock, Copy, Check, ExternalLink } from 'lucide-react'
import { formatAddress, formatBalance, cn } from '@/lib/utils/format'
import { type ChainType, getChain } from '@/lib/utils/chains'

interface WalletCardProps {
  address: string
  chain: ChainType
  balance?: bigint
  owners?: string[]
  required?: number
  pendingTxCount?: number
  className?: string
}

export function WalletCard({
  address,
  chain,
  balance,
  owners = [],
  required = 1,
  pendingTxCount = 0,
  className,
}: WalletCardProps) {
  const [copied, setCopied] = useState(false)
  const chainConfig = getChain(chain)

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Link href={`/wallets/${address}`} className={cn('card group hover:border-primary-500/40 transition-all duration-200 block', className)}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-xl', chainConfig.bgColor)}>
          {chainConfig.icon}
        </div>
        {pendingTxCount > 0 && (
          <span className="badge bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
            {pendingTxCount} pending
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 mb-1">
        <span className="font-mono text-sm text-slate-300">{formatAddress(address)}</span>
        <button
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-slate-300"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      <p className={cn('text-xs mb-4', chainConfig.textColor)}>{chainConfig.name}</p>

      <div className="text-2xl font-bold text-white mb-1">
        {balance !== undefined ? formatBalance(balance) : '—'}{' '}
        <span className="text-base font-normal text-slate-400">{chainConfig.symbol}</span>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-surface-border">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Users className="w-3.5 h-3.5" />
          <span>
            {required}-of-{owners.length} owners
          </span>
        </div>
        <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-primary-400 transition-colors" />
      </div>
    </Link>
  )
}
