'use client'

import { useState } from 'react'
import { UserPlus, Trash2, Copy, Check, ExternalLink } from 'lucide-react'
import { formatAddress } from '@/lib/utils/format'

interface OwnerListProps {
  owners: string[]
  currentUser?: string
  required: number
  isOwner: boolean
  walletAddress: string
  onAddOwner?: (address: string) => Promise<void>
  onRemoveOwner?: (address: string) => Promise<void>
}

export function OwnerList({ owners, currentUser, required, isOwner, walletAddress, onAddOwner, onRemoveOwner }: OwnerListProps) {
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null)
  const [newOwner, setNewOwner] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const handleCopy = async (addr: string) => {
    await navigator.clipboard.writeText(addr)
    setCopiedAddr(addr)
    setTimeout(() => setCopiedAddr(null), 2000)
  }

  const handleAdd = async () => {
    if (!newOwner || !onAddOwner) return
    await onAddOwner(newOwner as `0x${string}`)
    setNewOwner('')
    setShowAdd(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-white">Owners</h3>
          <p className="text-xs text-slate-400">{required}-of-{owners.length} signatures required</p>
        </div>
        {isOwner && onAddOwner && (
          <button onClick={() => setShowAdd(!showAdd)} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5">
            <UserPlus className="w-3.5 h-3.5" />
            Add Owner
          </button>
        )}
      </div>

      {showAdd && (
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newOwner}
            onChange={(e) => setNewOwner(e.target.value)}
            placeholder="0x... new owner address"
            className="input flex-1 text-sm font-mono"
          />
          <button onClick={handleAdd} className="btn-primary text-sm px-4">Add</button>
          <button onClick={() => setShowAdd(false)} className="btn-secondary text-sm px-3">✕</button>
        </div>
      )}

      <div className="space-y-2">
        {owners.map((owner) => (
          <div key={owner} className="flex items-center justify-between p-3 bg-surface-tertiary rounded-lg border border-surface-border group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-xs font-bold text-primary-400">
                {owner.slice(2, 4).toUpperCase()}
              </div>
              <div>
                <p className="font-mono text-sm text-slate-200">{formatAddress(owner)}</p>
                {owner.toLowerCase() === currentUser?.toLowerCase() && (
                  <span className="text-xs text-primary-400">You</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleCopy(owner)} className="btn-ghost p-1.5 text-slate-500 hover:text-slate-200">
                {copiedAddr === owner ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <a href={`https://etherscan.io/address/${owner}`} target="_blank" rel="noopener noreferrer" className="btn-ghost p-1.5 text-slate-500 hover:text-slate-200">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              {isOwner && onRemoveOwner && owner.toLowerCase() !== currentUser?.toLowerCase() && owners.length > required && (
                <button onClick={() => onRemoveOwner(owner)} className="btn-ghost p-1.5 text-slate-500 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
