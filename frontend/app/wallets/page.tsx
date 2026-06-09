'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { useAccount } from 'wagmi'
import { Header } from '@/components/layout/Header'
import { WalletCard } from '@/components/wallet/WalletCard'
import { useMultiSigFactory } from '@/lib/hooks/useMultiSigFactory'
import { useMultiSigWallet } from '@/lib/hooks/useMultiSigWallet'
import type { ChainType } from '@/lib/utils/chains'

const CHAIN_FILTERS: { id: ChainType | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'All Chains', icon: '🌐' },
  { id: 'ethereum', label: 'Ethereum', icon: '⟠' },
  { id: 'solana', label: 'Solana', icon: '◎' },
  { id: 'bitcoin', label: 'Bitcoin', icon: '₿' },
]

function WalletItem({ address }: { address: `0x${string}` }) {
  const { owners, required, balance } = useMultiSigWallet({ walletAddress: address })
  return (
    <WalletCard
      address={address}
      chain="ethereum"
      balance={balance}
      owners={owners ?? []}
      required={Number(required ?? 1)}
    />
  )
}

export default function WalletsPage() {
  const { isConnected } = useAccount()
  const { userWallets } = useMultiSigFactory()
  const [chainFilter, setChainFilter] = useState<ChainType | 'all'>('all')
  const [search, setSearch] = useState('')

  const filtered = (userWallets ?? []).filter((addr) =>
    addr.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Wallets</h1>
            <p className="text-slate-400 text-sm mt-1">All your multisig wallets across chains</p>
          </div>
          <Link href="/wallets/create" className="btn-primary flex items-center gap-2 self-start">
            <Plus className="w-4 h-4" /> New Wallet
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by address..."
              className="input pl-9"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CHAIN_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setChainFilter(f.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  chainFilter === f.id
                    ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent hover:border-surface-border'
                }`}
              >
                <span>{f.icon}</span> {f.label}
              </button>
            ))}
          </div>
        </div>

        {!isConnected ? (
          <div className="card text-center py-16">
            <p className="text-slate-300 mb-2 font-medium">Connect your wallet to see your multisigs</p>
            <p className="text-slate-500 text-sm">Use the Connect button in the top-right corner.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-4xl mb-4">🏦</div>
            <p className="text-slate-300 font-medium mb-2">
              {search ? 'No wallets match your search' : 'No wallets yet'}
            </p>
            {!search && (
              <Link href="/wallets/create" className="btn-primary inline-flex items-center gap-2 mt-4">
                <Plus className="w-4 h-4" /> Create First Wallet
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((addr) => (
              <WalletItem key={addr} address={addr} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
