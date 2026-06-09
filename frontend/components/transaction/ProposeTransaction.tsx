'use client'

import { useState } from 'react'
import { X, Send } from 'lucide-react'
import { isAddress, parseEther } from 'viem'
import { isValidAddress } from '@/lib/utils/format'

interface ProposeTransactionProps {
  onClose: () => void
  onSubmit: (to: `0x${string}`, value: bigint, data: `0x${string}`, description: string) => Promise<void>
  isPending?: boolean
}

export function ProposeTransaction({ onClose, onSubmit, isPending = false }: ProposeTransactionProps) {
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!isValidAddress(to)) {
      setError('Invalid recipient address')
      return
    }
    const parsed = parseFloat(amount)
    if (isNaN(parsed) || parsed < 0) {
      setError('Invalid amount')
      return
    }

    setIsLoading(true)
    try {
      await onSubmit(to as `0x${string}`, parseEther(amount || '0'), '0x', description)
      onClose()
    } catch {
      setError('Transaction submission failed. Check console for details.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md card animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Propose Transaction</h2>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Recipient Address</label>
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="0x..."
              className="input font-mono text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Amount (ETH)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              step="any"
              min="0"
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this transaction for?"
              rows={3}
              className="input resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || isPending}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isLoading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
