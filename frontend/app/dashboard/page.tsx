'use client'

import { useAccount } from 'wagmi'
import Link from 'next/link'
import { Wallet, Plus, TrendingUp, Clock } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { WalletCard } from '@/components/wallet/WalletCard'
import { useMultiSigFactory } from '@/lib/hooks/useMultiSigFactory'
import { useMultiSigWallet } from '@/lib/hooks/useMultiSigWallet'
import type { ChainType } from '@/lib/utils/chains'

function WalletRow({ address }: { address: `0x${string}` }) {
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

export default function DashboardPage() {
  const { isConnected, address } = useAccount()
  const { userWallets, walletCount } = useMultiSigFactory()

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-surface">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
          <div className="text-6xl mb-6">🔐</div>
          <h2 className="text-2xl font-bold text-white mb-3">Connect Your Wallet</h2>
          <p className="text-slate-400 mb-8">Connect a wallet to view your multisig wallets and manage transactions.</p>
          <Link href="/" className="btn-primary inline-flex items-center gap-2 px-8 py-3">
            Go to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Manage your multisig wallets</p>
          </div>
          <Link href="/wallets/create" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Wallet
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { icon: Wallet, label: 'Your Wallets', value: userWallets?.length ?? 0, color: 'text-primary-400 bg-primary-500/10' },
            { icon: TrendingUp, label: 'Total Platform Wallets', value: walletCount ? walletCount.toString() : '—', color: 'text-violet-400 bg-violet-500/10' },
            { icon: Clock, label: 'Pending Actions', value: '—', color: 'text-yellow-400 bg-yellow-500/10' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="card flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{String(value)}</p>
                <p className="text-xs text-slate-400">{label}</p>
              </div>
            </div>
          ))}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Your Wallets</h2>
          {!userWallets || userWallets.length === 0 ? (
            <div className="card text-center py-16">
              <div className="text-4xl mb-4">🏦</div>
              <p className="text-slate-300 font-medium mb-2">No wallets yet</p>
              <p className="text-slate-500 text-sm mb-6">Create your first multisig wallet to get started.</p>
              <Link href="/wallets/create" className="btn-primary inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> Create Wallet
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {userWallets.map((addr) => (
                <WalletRow key={addr} address={addr} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
