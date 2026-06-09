'use client'

import { useState } from 'react'
import { CheckCircle, Play, RotateCcw, Clock, ArrowUpRight } from 'lucide-react'
import { formatAddress, formatBalance, formatRelativeTime, cn } from '@/lib/utils/format'
import type { WalletTransaction } from '@/lib/hooks/useMultiSigWallet'

interface TransactionCardProps {
  tx: WalletTransaction
  required: number
  isOwner: boolean
  hasConfirmed: boolean
  onConfirm: (id: number) => Promise<void>
  onRevoke: (id: number) => Promise<void>
  onExecute: (id: number) => Promise<void>
  isPending?: boolean
}

export function TransactionCard({
  tx,
  required,
  isOwner,
  hasConfirmed,
  onConfirm,
  onRevoke,
  onExecute,
  isPending = false,
}: TransactionCardProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handle = async (action: string, fn: () => Promise<void>) => {
    setLoading(action)
    try { await fn() } finally { setLoading(null) }
  }

  const progress = Math.min((tx.numConfirmations / required) * 100, 100)
  const canExecute = tx.numConfirmations >= required && !tx.executed

  return (
    <div className={cn('card', tx.executed ? 'opacity-70' : '')}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn('w-2 h-2 rounded-full', tx.executed ? 'bg-green-400' : canExecute ? 'bg-yellow-400 animate-pulse' : 'bg-slate-500')} />
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {tx.executed ? 'Executed' : canExecute ? 'Ready to execute' : 'Pending'}
          </span>
        </div>
        <span className="text-xs text-slate-500">#{tx.id}</span>
      </div>

      <div className="mb-3">
        <p className="text-sm text-white font-medium mb-1 truncate">{tx.description || 'Transaction'}</p>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <ArrowUpRight className="w-3 h-3" />
          <span className="font-mono">{formatAddress(tx.to)}</span>
          {tx.value > 0n && (
            <span className="ml-1 text-slate-300">{formatBalance(tx.value)} ETH</span>
          )}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-400 mb-1.5">
          <span>Confirmations</span>
          <span className="font-medium text-slate-200">{tx.numConfirmations} / {required}</span>
        </div>
        <div className="w-full bg-surface-border rounded-full h-1.5">
          <div
            className={cn('h-1.5 rounded-full transition-all duration-500', tx.executed ? 'bg-green-500' : 'bg-primary-500')}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {!tx.executed && isOwner && (
        <div className="flex gap-2">
          {!hasConfirmed ? (
            <button
              onClick={() => handle('confirm', () => onConfirm(tx.id))}
              disabled={loading !== null || isPending}
              className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              {loading === 'confirm' ? 'Signing...' : 'Confirm'}
            </button>
          ) : (
            <button
              onClick={() => handle('revoke', () => onRevoke(tx.id))}
              disabled={loading !== null || isPending}
              className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {loading === 'revoke' ? 'Revoking...' : 'Revoke'}
            </button>
          )}
          {canExecute && (
            <button
              onClick={() => handle('execute', () => onExecute(tx.id))}
              disabled={loading !== null || isPending}
              className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3 bg-green-600 hover:bg-green-500"
            >
              <Play className="w-3.5 h-3.5" />
              {loading === 'execute' ? 'Executing...' : 'Execute'}
            </button>
          )}
        </div>
      )}

      <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
        <Clock className="w-3 h-3" />
        {formatRelativeTime(tx.submittedAt)}
      </p>
    </div>
  )
}
