'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAccount } from 'wagmi'
import { ArrowLeft, Plus, Filter } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { TransactionCard } from '@/components/transaction/TransactionCard'
import { ProposeTransaction } from '@/components/transaction/ProposeTransaction'
import { useMultiSigWallet, useTransaction, useIsConfirmed } from '@/lib/hooks/useMultiSigWallet'

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
}: {
  walletAddress: `0x${string}`
  txIndex: number
  required: number
  isOwner: boolean
  currentUser?: `0x${string}`
  onConfirm: (id: number) => Promise<void>
  onRevoke: (id: number) => Promise<void>
  onExecute: (id: number) => Promise<void>
  isPending: boolean
}) {
  const { transaction } = useTransaction(walletAddress, BigInt(txIndex))
  const hasConfirmed = useIsConfirmed(walletAddress, BigInt(txIndex), currentUser) ?? false

  if (!transaction) return <div className="card animate-pulse h-32" />

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

export default function TransactionsPage() {
  const { address: walletAddr } = useParams<{ address: string }>()
  const { address: userAddress } = useAccount()
  const router = useRouter()
  const [showPropose, setShowPropose] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'executed'>('all')

  const walletAddress = walletAddr as `0x${string}`
  const {
    required,
    transactionCount,
    isOwner,
    isPending,
    isConfirming,
    submitTransaction,
    confirmTransaction,
    revokeConfirmation,
    executeTransaction,
  } = useMultiSigWallet({ walletAddress })

  const txIds = Array.from({ length: Number(transactionCount ?? 0) }, (_, i) => i).reverse()

  const TABS = [
    { id: 'all', label: `All (${txIds.length})` },
    { id: 'pending', label: 'Pending' },
    { id: 'executed', label: 'Executed' },
  ] as const

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-xl font-bold text-white flex-1">Transactions</h1>
          {isOwner && (
            <button onClick={() => setShowPropose(true)} className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Propose
            </button>
          )}
        </div>

        <div className="flex gap-1 mb-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === t.id ? 'bg-primary-500/10 text-primary-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {txIds.length === 0 ? (
          <div className="card text-center py-20">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-slate-300 font-medium mb-2">No transactions</p>
            {isOwner && (
              <button onClick={() => setShowPropose(true)} className="btn-primary mt-4 inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> Propose First Transaction
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
                required={Number(required ?? 1)}
                isOwner={!!isOwner}
                currentUser={userAddress}
                onConfirm={confirmTransaction}
                onRevoke={revokeConfirmation}
                onExecute={executeTransaction}
                isPending={isPending || isConfirming}
              />
            ))}
          </div>
        )}
      </main>

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
