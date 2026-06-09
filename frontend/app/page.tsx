import Link from 'next/link'
import { Shield, Users, Zap, Globe, ArrowRight, Lock, ChevronRight } from 'lucide-react'

const FEATURES = [
  { icon: '🛡️', title: 'Multi-Signature Security', description: 'Require M-of-N approvals before any transaction executes. Your funds are always protected.' },
  { icon: '👥', title: 'Team Management', description: 'Add or remove owners, adjust signing thresholds — all governed by the multisig itself.' },
  { icon: '⚡', title: 'Instant Execution', description: 'Once the threshold is reached, any owner can execute the transaction on-chain immediately.' },
  { icon: '🌐', title: 'Multi-Chain Support', description: 'Native support for Ethereum, Polygon, Arbitrum, Optimism, Base, plus Solana and Bitcoin.' },
]

const CHAINS = [
  { name: 'Ethereum', icon: '⟠', colorClass: 'text-blue-400 bg-blue-500/10', desc: 'EVM Smart Contracts' },
  { name: 'Solana', icon: '◎', colorClass: 'text-purple-400 bg-purple-500/10', desc: 'High-speed, low fees' },
  { name: 'Bitcoin', icon: '₿', colorClass: 'text-orange-400 bg-orange-500/10', desc: 'P2SH / P2WSH multisig' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface text-slate-200">
      <nav className="border-b border-surface-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-primary-400 text-2xl">🔐</span>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-400 to-violet-400 bg-clip-text text-transparent">MINs</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <Link href="/dashboard" className="hover:text-slate-200 transition-colors">Dashboard</Link>
            <Link href="/wallets" className="hover:text-slate-200 transition-colors">Wallets</Link>
          </div>
          <Link href="/wallets/create" className="btn-primary text-sm px-5 py-2">Get Started</Link>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-primary-500/10 text-primary-400 text-sm px-4 py-1.5 rounded-full border border-primary-500/20 mb-6">
          <span>⚡</span>
          <span>Secure · Multi-chain · Open source</span>
        </div>
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight mb-6">
          <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">Secure Multisig</span>
          <br />
          <span className="bg-gradient-to-r from-primary-400 to-violet-400 bg-clip-text text-transparent">Wallets for Every Chain</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
          Deploy and manage multi-signature wallets on Ethereum, Solana, and Bitcoin.
          Protect your assets with M-of-N approval workflows and full on-chain transparency.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/wallets/create" className="btn-primary flex items-center gap-2 text-base px-8 py-3">
            Create Wallet <span>→</span>
          </Link>
          <Link href="/dashboard" className="btn-secondary flex items-center gap-2 text-base px-8 py-3">
            View Dashboard <span>›</span>
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
          {[['12,400+', 'Multisig Wallets'], ['$2.1B+', 'Assets Protected'], ['3,200+', 'Active Teams']].map(([val, label]) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-bold text-white">{val}</p>
              <p className="text-sm text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <h2 className="text-center text-2xl font-bold text-white mb-10">Supported Networks</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {CHAINS.map((chain) => (
            <div key={chain.name} className={`card flex flex-col items-center gap-3 py-8 ${chain.colorClass}`}>
              <span className="text-4xl">{chain.icon}</span>
              <p className="font-semibold text-white">{chain.name}</p>
              <p className="text-xs text-slate-400">{chain.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        <h2 className="text-center text-3xl font-bold text-white mb-4">Everything you need</h2>
        <p className="text-center text-slate-400 mb-14 max-w-xl mx-auto">Built on battle-tested smart contracts with a clean, intuitive interface.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="card hover:border-primary-500/50 transition-colors">
              <div className="text-2xl mb-4">{f.icon}</div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-surface-border py-8 text-center text-sm text-slate-500">
        <p>MINs Multisig Platform — Open source, non-custodial, unstoppable.</p>
      </footer>
    </div>
  )
}
