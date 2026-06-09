'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { useMultiSigFactory } from '@/lib/hooks/useMultiSigFactory'
import { useAccount } from 'wagmi'
import { isValidAddress, formatAddress } from '@/lib/utils/format'
import type { ChainType } from '@/lib/utils/chains'

const CHAINS: { id: ChainType; name: string; icon: string; desc: string; available: boolean }[] = [
  { id: 'ethereum', name: 'Ethereum / EVM', icon: '⟠', desc: 'Deploy a Solidity smart contract', available: true },
  { id: 'solana', name: 'Solana', icon: '◎', desc: 'Configure via Squads Protocol', available: true },
  { id: 'bitcoin', name: 'Bitcoin', icon: '₿', desc: 'Generate P2SH-P2WSH address', available: true },
]

const STEPS = ['Select Chain', 'Add Owners', 'Set Threshold', 'Review & Deploy']

export default function CreateWalletPage() {
  const router = useRouter()
  const { address } = useAccount()
  const { createWallet, isPending } = useMultiSigFactory()

  const [step, setStep] = useState(0)
  const [chain, setChain] = useState<ChainType>('ethereum')
  const [owners, setOwners] = useState<string[]>(address ? [address] : [''])
  const [required, setRequired] = useState(1)
  const [newOwner, setNewOwner] = useState('')
  const [error, setError] = useState('')

  const addOwner = () => {
    setError('')
    if (!isValidAddress(newOwner)) { setError('Invalid address'); return }
    if (owners.includes(newOwner)) { setError('Address already added'); return }
    setOwners([...owners, newOwner])
    setNewOwner('')
  }

  const removeOwner = (idx: number) => {
    const next = owners.filter((_, i) => i !== idx)
    setOwners(next)
    if (required > next.length) setRequired(next.length)
  }

  const handleDeploy = async () => {
    if (chain !== 'ethereum') {
      router.push('/wallets')
      return
    }
    const validOwners = owners.filter(isValidAddress)
    if (validOwners.length === 0) { setError('Add at least one valid owner'); return }
    try {
      await createWallet(validOwners as `0x${string}`[], required)
      router.push('/wallets')
    } catch {
      setError('Deployment failed')
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 mb-8">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <h1 className="text-2xl font-bold text-white mb-2">Create Multisig Wallet</h1>
        <p className="text-slate-400 text-sm mb-8">Set up a secure multi-signature wallet in minutes.</p>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-10">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                i < step ? 'bg-green-500 text-white' : i === step ? 'bg-primary-500 text-white' : 'bg-surface-tertiary text-slate-500'
              }`}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs hidden sm:block ${i === step ? 'text-white font-medium' : 'text-slate-500'}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`flex-1 h-px ${i < step ? 'bg-green-500' : 'bg-surface-border'}`} />}
            </div>
          ))}
        </div>

        <div className="card">
          {/* Step 0: Choose chain */}
          {step === 0 && (
            <div>
              <h2 className="font-semibold text-white mb-4">Select Blockchain</h2>
              <div className="space-y-3">
                {CHAINS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setChain(c.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                      chain === c.id ? 'border-primary-500 bg-primary-500/10' : 'border-surface-border hover:border-surface-border/80 hover:bg-surface-tertiary'
                    }`}
                  >
                    <span className="text-2xl">{c.icon}</span>
                    <div className="text-left">
                      <p className="font-medium text-white">{c.name}</p>
                      <p className="text-xs text-slate-400">{c.desc}</p>
                    </div>
                    {chain === c.id && <Check className="w-5 h-5 text-primary-400 ml-auto" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Add owners */}
          {step === 1 && (
            <div>
              <h2 className="font-semibold text-white mb-1">Add Owners</h2>
              <p className="text-sm text-slate-400 mb-4">Add the addresses that will control this wallet.</p>
              <div className="space-y-2 mb-4">
                {owners.map((owner, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-3 bg-surface-tertiary rounded-lg border border-surface-border">
                    <span className="text-xs text-slate-500 w-5">{idx + 1}</span>
                    <span className="font-mono text-sm text-slate-200 flex-1 truncate">
                      {owner}
                      {owner.toLowerCase() === address?.toLowerCase() && <span className="ml-2 text-xs text-primary-400">(you)</span>}
                    </span>
                    {owners.length > 1 && (
                      <button onClick={() => removeOwner(idx)} className="text-slate-500 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  placeholder="0x... address"
                  className="input flex-1 font-mono text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && addOwner()}
                />
                <button onClick={addOwner} className="btn-secondary flex items-center gap-1.5">
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
              {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
            </div>
          )}

          {/* Step 2: Set threshold */}
          {step === 2 && (
            <div>
              <h2 className="font-semibold text-white mb-1">Set Signing Threshold</h2>
              <p className="text-sm text-slate-400 mb-6">How many owners must approve a transaction before it can be executed?</p>
              <div className="flex items-center gap-6 justify-center py-4">
                <button
                  onClick={() => setRequired(Math.max(1, required - 1))}
                  className="w-10 h-10 rounded-full bg-surface-tertiary border border-surface-border text-xl hover:border-primary-500 transition-colors"
                >
                  −
                </button>
                <div className="text-center">
                  <p className="text-5xl font-bold text-primary-400">{required}</p>
                  <p className="text-sm text-slate-400 mt-1">of {owners.filter(isValidAddress).length} owners</p>
                </div>
                <button
                  onClick={() => setRequired(Math.min(owners.filter(isValidAddress).length, required + 1))}
                  className="w-10 h-10 rounded-full bg-surface-tertiary border border-surface-border text-xl hover:border-primary-500 transition-colors"
                >
                  +
                </button>
              </div>
              <p className="text-center text-sm text-slate-400 mt-4">
                A threshold of {required} means {required} out of {owners.filter(isValidAddress).length} owners must sign.
              </p>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div>
              <h2 className="font-semibold text-white mb-4">Review & Deploy</h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between py-2 border-b border-surface-border">
                  <span className="text-slate-400 text-sm">Chain</span>
                  <span className="text-white font-medium capitalize">{chain}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-surface-border">
                  <span className="text-slate-400 text-sm">Owners</span>
                  <span className="text-white font-medium">{owners.filter(isValidAddress).length}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-surface-border">
                  <span className="text-slate-400 text-sm">Threshold</span>
                  <span className="text-white font-medium">{required}-of-{owners.filter(isValidAddress).length}</span>
                </div>
                <div className="py-2">
                  <p className="text-slate-400 text-sm mb-2">Owner Addresses</p>
                  {owners.filter(isValidAddress).map((o) => (
                    <p key={o} className="font-mono text-xs text-slate-300 truncate">{o}</p>
                  ))}
                </div>
              </div>
              {error && <p className="text-sm text-red-400 mb-4 bg-red-500/10 p-3 rounded-lg">{error}</p>}
              <button
                onClick={handleDeploy}
                disabled={isPending}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
              >
                {isPending ? '⏳ Deploying...' : '🚀 Deploy Wallet'}
              </button>
            </div>
          )}

          <div className="flex justify-between mt-6 pt-4 border-t border-surface-border">
            <button
              onClick={() => { setStep(s => s - 1); setError('') }}
              disabled={step === 0}
              className="btn-secondary flex items-center gap-2 disabled:opacity-30"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            {step < 3 && (
              <button
                onClick={() => { setError(''); setStep(s => s + 1) }}
                className="btn-primary flex items-center gap-2"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
