'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { Plus } from 'lucide-react'
import { TransactionCard } from './TransactionCard'
import { ProposeTransaction } from './ProposeTransaction'
import { useMultiSigWallet, useTransaction, useIsConfirmed } from '@/lib/hooks/useMultiSigWallet'

interface TxRowProps {
  walletAddress: `0x${string}`
  txIndex: number
  required: number
  isOwner: boolean
  currentUser?: `0x${string}`
  onConfirm: (id: number) => Promise<void>
  onRevoke: (id: number) => Promise<void>
  onExecute: (id: number) => Promise<void>
  isPending: boolean
  filter: 'all' | 'pending' | 'executed'
}

function TxRow({
  walletAddress,
  txIndex,
  required,
  isOwner,
  currentUser,
  onConfirm,
  onRevoke,
  onExecute,
  isPending,
  filter,
}: TxRowProps) {
  const { transaction } = useTransaction(walletAddress, BigInt(txIndex))
  const hasConfirmed = useIsConfirmed(walletAddress, BigInt(txIndex), currentUser) ?? false

  if (!transaction) {
    return <div className="card h-32 animate-pulse" />
  }

  const tx = {
    id: txIndex,
    to: transaction[0],
    value: transaction[1],
    data: transaction[2],
    executed: transaction[3],
    numConfirmations: Number(transaction[4]),
    submittedAt: Number(transaction[5]),
    submittedBy: transaction[6],
    description: transaction[7],
  }

  // Apply filter
  if (filter === 'pending' && tx.executed) return null
  if (filter === 'executed' && !tx.executed) return null

  return (
    <TransactionCard
      tx={tx}
      required={required}
      isOwner={isOwner}
      hasConfirmed={hasConfirmed}
      onConfirm={onConfirm}
      onRevoke={onRevoke}
      onExecute={onExecute}
      isPending={isPending}
    />
  )
}

interface TransactionListProps {
  walletAddress: `0x${string}`
  transactionCount?: bigint
  owners?: `0x${string}`[]
  required: number
  isOwner: boolean
  limit?: number
  showAll?: boolean
}

export function TransactionList({
  walletAddress,
  transactionCount,
  owners = [],
  required,
  isOwner,
  limit,
  showAll = false,
}: TransactionListProps) {
  const { address: currentUser } = useAccount()
  const [filter, setFilter] = useState<'all' | 'pending' | 'executed'>('all')
  const [showPropose, setShowPropose] = useState(false)

  const { confirmTransaction, revokeConfirmation, executeTransaction, submitTransaction, isPending, isConfirming } =
    useMultiSigWallet({ walletAddress })

  const count = Number(transactionCount ?? 0)

  // Generate list of tx indices in reverse chronological order
  let txIds = Array.from({ length: count }, (_, i) => count - 1 - i)
  if (limit) {
    txIds = txIds.slice(0, limit)
  }

  const TABS = [
    { id: 'all' as const, label: 'All' },
    { id: 'pending' as const, label: 'Pending' },
    { id: 'executed' as const, label: 'Executed' },
  ]

  return (
    <div>
      {showAll && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1 bg-surface-secondary border border-surface-border rounded-lg p-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  filter === tab.id
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {isOwner && (
            <button
              onClick={() => setShowPropose(true)}
              className="btn-secondary flex items-center gap-1.5 text-sm"
            >
              <Plus className="w-4 h-4" />
              Propose
            </button>
          )}
        </div>
      )}

      {count === 0 ? (
        <div className="card flex flex-col items-center justify-center py-12 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-slate-300 font-medium mb-2">No transactions yet</p>
          <p className="text-slate-500 text-sm mb-4">
            Propose a transaction to get started.
          </p>
          {isOwner && (
            <button
              onClick={() => setShowPropose(true)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Propose Transaction
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {txIds.map((id) => (
            <TxRow
              key={id}
              walletAddress={walletAddress}
              txIndex={id}
              required={required}
              isOwner={isOwner}
              currentUser={currentUser}
              onConfirm={confirmTransaction}
              onRevoke={revokeConfirmation}
              onExecute={executeTransaction}
              isPending={isPending || isConfirming}
              filter={filter}
            />
          ))}
        </div>
      )}

      {showPropose && (
        <ProposeTransaction
          onClose={() => setShowPropose(false)}
          onSubmit={submitTransaction}
          isPending={isPending || isConfirming}
        />
      )}
    </div>
  )
}
