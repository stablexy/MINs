'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAccount } from 'wagmi'
import Link from 'next/link'
import { ArrowLeft, Send, Download, Plus } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { OwnerList } from '@/components/wallet/OwnerList'
import { TransactionCard } from '@/components/transaction/TransactionCard'
import { ProposeTransaction } from '@/components/transaction/ProposeTransaction'
import { useMultiSigWallet, useTransaction, useIsConfirmed } from '@/lib/hooks/useMultiSigWallet'
import { formatAddress, formatBalance } from '@/lib/utils/format'

function TxItem({
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

  if (!transaction) return null

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

export default function WalletDetailPage() {
  const { address: walletAddr } = useParams<{ address: string }>()
  const { address: userAddress } = useAccount()
  const router = useRouter()
  const [showPropose, setShowPropose] = useState(false)
  const [tab, setTab] = useState<'pending' | 'all'>('pending')

  const walletAddress = walletAddr as `0x${string}`
  const {
    owners,
    required,
    balance,
    transactionCount,
    isOwner,
    isPending,
    isConfirming,
    submitTransaction,
    confirmTransaction,
    revokeConfirmation,
    executeTransaction,
    addOwner,
    removeOwner,
  } = useMultiSigWallet({ walletAddress })

  const txIds = Array.from({ length: Number(transactionCount ?? 0) }, (_, i) => i).reverse()

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Wallets
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Wallet info */}
          <div className="lg:col-span-1 space-y-4">
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-2xl">⟠</div>
                <div>
                  <p className="font-semibold text-white">Multisig Wallet</p>
                  <p className="text-xs text-blue-400">Ethereum</p>
                </div>
              </div>
              <p className="font-mono text-xs text-slate-400 mb-4 break-all">{walletAddress}</p>
              <div className="text-3xl font-bold text-white mb-1">
                {balance !== undefined ? formatBalance(balance) : '—'} <span className="text-lg font-normal text-slate-400">ETH</span>
              </div>
              <p className="text-xs text-slate-500 mb-6">
                {owners?.length ?? '—'} owners · {Number(required ?? 0)}-of-{owners?.length ?? '—'} threshold
              </p>
              <div className="flex gap-2">
                {isOwner && (
                  <button
                    onClick={() => setShowPropose(true)}
                    className="btn-primary flex-1 flex items-center justify-center gap-1.5 text-sm"
                  >
                    <Send className="w-4 h-4" /> Send
                  </button>
                )}
                <button className="btn-secondary flex items-center justify-center gap-1.5 text-sm px-4">
                  <Download className="w-4 h-4" /> Receive
                </button>
              </div>
            </div>

            <div className="card">
              <OwnerList
                owners={owners ?? []}
                currentUser={userAddress}
                required={Number(required ?? 1)}
                isOwner={!!isOwner}
                walletAddress={walletAddress}
                onAddOwner={isOwner ? addOwner : undefined}
                onRemoveOwner={isOwner ? removeOwner : undefined}
              />
            </div>
          </div>

          {/* Right: Transactions */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-1">
                {(['pending', 'all'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      tab === t ? 'bg-primary-500/10 text-primary-400' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
              {isOwner && (
                <button onClick={() => setShowPropose(true)} className="btn-secondary flex items-center gap-1.5 text-sm">
                  <Plus className="w-4 h-4" /> Propose
                </button>
              )}
            </div>

            {txIds.length === 0 ? (
              <div className="card text-center py-16">
                <div className="text-4xl mb-4">📋</div>
                <p className="text-slate-300 font-medium mb-2">No transactions yet</p>
                {isOwner && (
                  <button onClick={() => setShowPropose(true)} className="btn-primary mt-4 inline-flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Propose First Transaction
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {txIds.map((id) => (
                  <TxItem
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
          </div>
        </div>
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
