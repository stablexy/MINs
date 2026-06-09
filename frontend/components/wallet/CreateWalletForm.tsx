'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { Plus, Trash2, Check, ArrowLeft, ArrowRight } from 'lucide-react'
import { useMultiSigFactory } from '@/lib/hooks/useMultiSigFactory'
import { useSolanaMultisig } from '@/lib/hooks/useSolanaMultisig'
import { useBitcoinMultisig } from '@/lib/hooks/useBitcoinMultisig'
import { isValidAddress } from '@/lib/utils/format'
import type { ChainType } from '@/lib/utils/chains'
import { cn } from '@/lib/utils/format'

const CHAINS: { id: ChainType; name: string; icon: string; desc: string }[] = [
  { id: 'ethereum', name: 'Ethereum / EVM', icon: '⟠', desc: 'Smart contract on Ethereum, Polygon, Arbitrum, Optimism, or Base' },
  { id: 'solana', name: 'Solana', icon: '◎', desc: 'Native Solana multisig via Squads Protocol' },
  { id: 'bitcoin', name: 'Bitcoin', icon: '₿', desc: 'P2SH-P2WSH multisig address (m-of-n)' },
]

const STEPS = ['Select Chain', 'Add Owners', 'Set Threshold', 'Review & Deploy']

interface StepIndicatorProps {
  steps: string[]
  currentStep: number
}

function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center mb-8">
      {steps.map((step, idx) => (
        <div key={step} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all',
                idx < currentStep
                  ? 'bg-emerald-500 text-white'
                  : idx === currentStep
                  ? 'bg-primary-600 text-white ring-4 ring-primary-600/20'
                  : 'bg-surface-tertiary text-slate-500 border border-surface-border'
              )}
            >
              {idx < currentStep ? <Check className="w-4 h-4" /> : idx + 1}
            </div>
            <span
              className={cn(
                'mt-1.5 text-xs hidden sm:block',
                idx === currentStep ? 'text-white font-medium' : 'text-slate-500'
              )}
            >
              {step}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div
              className={cn(
                'flex-1 h-px mx-2 mb-4 transition-all',
                idx < currentStep ? 'bg-emerald-500' : 'bg-surface-border'
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}

export function CreateWalletForm() {
  const router = useRouter()
  const { address: userAddress } = useAccount()
  const { createWallet, isPending } = useMultiSigFactory()
  const { createMultisigWallet: createSolanaWallet, isLoading: solanaLoading } = useSolanaMultisig()
  const { createMultisigAddress: createBtcWallet, isLoading: btcLoading } = useBitcoinMultisig()

  const [step, setStep] = useState(0)
  const [chain, setChain] = useState<ChainType>('ethereum')
  const [owners, setOwners] = useState<string[]>(userAddress ? [userAddress] : [''])
  const [required, setRequired] = useState(1)
  const [newOwner, setNewOwner] = useState('')
  const [ownerError, setOwnerError] = useState('')
  const [result, setResult] = useState<{ address: string } | null>(null)

  const isDeploying = isPending || solanaLoading || btcLoading

  // ── Owner management ────────────────────────────────────────
  const handleAddOwner = () => {
    setOwnerError('')
    if (!isValidAddress(newOwner)) {
      setOwnerError('Please enter a valid Ethereum address (0x...)')
      return
    }
    if (owners.map((o) => o.toLowerCase()).includes(newOwner.toLowerCase())) {
      setOwnerError('This address is already in the list')
      return
    }
    setOwners((prev) => [...prev, newOwner])
    setNewOwner('')
  }

  const handleRemoveOwner = (idx: number) => {
    const next = owners.filter((_, i) => i !== idx)
    setOwners(next)
    if (required > next.length) setRequired(Math.max(1, next.length))
  }

  // ── Deploy / Create ──────────────────────────────────────────
  const handleDeploy = async () => {
    try {
      if (chain === 'ethereum') {
        const validOwners = owners.filter(isValidAddress) as `0x${string}`[]
        if (validOwners.length === 0) return
        await createWallet(validOwners, required)
        router.push('/wallets')
      } else if (chain === 'solana') {
        const addr = await createSolanaWallet(owners, required)
        if (addr) setResult({ address: addr })
      } else if (chain === 'bitcoin') {
        // Bitcoin uses public keys — for demo we treat owners as public keys
        const wallet = await createBtcWallet(owners, required)
        if (wallet) setResult({ address: wallet.address })
      }
    } catch (err) {
      console.error('Deploy error:', err)
    }
  }

  // ── Rendered step content ────────────────────────────────────
  const renderStep = () => {
    if (result) {
      return (
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Wallet Created!</h3>
          <p className="text-slate-400 text-sm mb-4">Your multisig wallet has been set up.</p>
          <div className="bg-surface-tertiary border border-surface-border rounded-lg px-4 py-3 mb-6 font-mono text-sm text-slate-200 break-all">
            {result.address}
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => router.push('/wallets')} className="btn-primary">
              View All Wallets
            </button>
            <button
              onClick={() => {
                setResult(null)
                setStep(0)
                setOwners(userAddress ? [userAddress] : [''])
                setRequired(1)
              }}
              className="btn-secondary"
            >
              Create Another
            </button>
          </div>
        </div>
      )
    }

    switch (step) {
      case 0:
        return (
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">Select Blockchain</h2>
            <p className="text-sm text-slate-400 mb-4">Choose the chain where your multisig will live.</p>
            <div className="space-y-3">
              {CHAINS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setChain(c.id)}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left',
                    chain === c.id
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-surface-border hover:bg-surface-tertiary hover:border-primary-500/30'
                  )}
                >
                  <span className="text-3xl">{c.icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-white">{c.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{c.desc}</p>
                  </div>
                  {chain === c.id && (
                    <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )

      case 1:
        return (
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">Add Owners</h2>
            <p className="text-sm text-slate-400 mb-4">
              Add all wallet owner addresses. Each owner will be able to propose and approve transactions.
            </p>
            <div className="space-y-2 mb-4 max-h-56 overflow-y-auto pr-1">
              {owners.map((owner, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-3 bg-surface-tertiary rounded-lg border border-surface-border"
                >
                  <span className="text-xs text-slate-500 w-4 text-center">{idx + 1}</span>
                  <p className="font-mono text-sm text-slate-200 flex-1 min-w-0 truncate">
                    {owner}
                  </p>
                  {owner.toLowerCase() === userAddress?.toLowerCase() && (
                    <span className="text-xs text-primary-400 shrink-0">(you)</span>
                  )}
                  {owners.length > 1 && (
                    <button
                      onClick={() => handleRemoveOwner(idx)}
                      className="text-slate-500 hover:text-red-400 transition-colors shrink-0"
                    >
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
                onKeyDown={(e) => e.key === 'Enter' && handleAddOwner()}
                placeholder="0x... wallet address"
                className="input flex-1 font-mono text-sm"
              />
              <button onClick={handleAddOwner} className="btn-secondary flex items-center gap-1.5 shrink-0">
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            {ownerError && <p className="text-sm text-red-400 mt-2">{ownerError}</p>}
          </div>
        )

      case 2:
        return (
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">Set Threshold</h2>
            <p className="text-sm text-slate-400 mb-6">
              How many owners must approve before a transaction can execute?
            </p>
            <div className="flex items-center justify-center gap-8 py-6">
              <button
                onClick={() => setRequired((r) => Math.max(1, r - 1))}
                className="w-12 h-12 rounded-full bg-surface-tertiary border border-surface-border text-xl hover:border-primary-500 transition-colors disabled:opacity-50"
                disabled={required <= 1}
              >
                −
              </button>
              <div className="text-center">
                <p className="text-5xl font-bold text-primary-400">{required}</p>
                <p className="text-sm text-slate-400 mt-1">of {owners.length} owners</p>
              </div>
              <button
                onClick={() => setRequired((r) => Math.min(owners.length, r + 1))}
                className="w-12 h-12 rounded-full bg-surface-tertiary border border-surface-border text-xl hover:border-primary-500 transition-colors disabled:opacity-50"
                disabled={required >= owners.length}
              >
                +
              </button>
            </div>
            <div className="bg-primary-500/5 border border-primary-500/20 rounded-lg px-4 py-3 text-sm text-slate-300">
              Any transaction will require{' '}
              <span className="text-primary-400 font-semibold">{required}</span> out of{' '}
              <span className="text-primary-400 font-semibold">{owners.length}</span> owner
              {owners.length > 1 ? 's' : ''} to approve before it can be executed.
            </div>
          </div>
        )

      case 3:
        return (
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">Review & Deploy</h2>
            <p className="text-sm text-slate-400 mb-4">Review your wallet configuration before deploying.</p>
            <div className="space-y-4">
              <div className="p-4 bg-surface-tertiary rounded-xl border border-surface-border">
                <p className="text-xs text-slate-500 mb-1">Chain</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{CHAINS.find((c) => c.id === chain)?.icon}</span>
                  <span className="text-white font-medium">
                    {CHAINS.find((c) => c.id === chain)?.name}
                  </span>
                </div>
              </div>
              <div className="p-4 bg-surface-tertiary rounded-xl border border-surface-border">
                <p className="text-xs text-slate-500 mb-2">
                  Owners ({owners.length})
                </p>
                <div className="space-y-1.5">
                  {owners.map((o, idx) => (
                    <p key={idx} className="font-mono text-xs text-slate-300 truncate">
                      {o}
                      {o.toLowerCase() === userAddress?.toLowerCase() && (
                        <span className="ml-2 text-primary-400">(you)</span>
                      )}
                    </p>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-surface-tertiary rounded-xl border border-surface-border">
                <p className="text-xs text-slate-500 mb-1">Signing Threshold</p>
                <p className="text-white font-semibold">
                  {required} of {owners.length} owners
                </p>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div>
      <StepIndicator steps={STEPS} currentStep={step} />

      <div className="card mb-6">{renderStep()}</div>

      {!result && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="btn-secondary flex items-center gap-2 disabled:opacity-40"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => {
                setOwnerError('')
                setStep((s) => s + 1)
              }}
              disabled={step === 1 && owners.filter(isValidAddress).length === 0}
              className="btn-primary flex items-center gap-2"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleDeploy}
              disabled={isDeploying}
              className="btn-primary flex items-center gap-2 min-w-[140px] justify-center"
            >
              {isDeploying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Deploy Wallet
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
