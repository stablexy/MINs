'use client'

import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'

export interface SolanaMultisigConfig {
  owners: string[]
  required: number
  walletAddress?: string
}

export interface SolanaTransaction {
  id: string
  to: string
  amount: number
  description: string
  executed: boolean
  approvals: string[]
  createdAt: number
}

export function useSolanaMultisig() {
  const [isLoading, setIsLoading] = useState(false)
  const [wallets, setWallets] = useState<SolanaMultisigConfig[]>([])

  const getConnection = useCallback(async () => {
    const { Connection, clusterApiUrl } = await import('@solana/web3.js')
    const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? clusterApiUrl('devnet')
    return new Connection(endpoint, 'confirmed')
  }, [])

  const getWalletBalance = useCallback(
    async (address: string): Promise<number> => {
      try {
        const { Connection, PublicKey, clusterApiUrl } = await import('@solana/web3.js')
        const connection = new Connection(
          process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? clusterApiUrl('devnet'),
          'confirmed'
        )
        const pubkey = new PublicKey(address)
        const balance = await connection.getBalance(pubkey)
        return balance / 1e9
      } catch {
        return 0
      }
    },
    []
  )

  const generateMultisigAddress = useCallback(
    async (owners: string[], required: number): Promise<string | undefined> => {
      try {
        setIsLoading(true)
        const { PublicKey } = await import('@solana/web3.js')

        const ownerPubkeys = owners.map((o) => new PublicKey(o))
        const [pda] = PublicKey.findProgramAddressSync(
          [
            Buffer.from('multisig'),
            ...ownerPubkeys.map((k) => k.toBuffer()),
            Buffer.from([required]),
          ],
          new PublicKey('msigmtwzgXJHj2ext4XJjCDmpbcMuufFb5cHuwg6Xdt')
        )
        return pda.toBase58()
      } catch (err) {
        console.error('Solana multisig address generation error:', err)
        return undefined
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const createMultisigWallet = useCallback(
    async (owners: string[], required: number): Promise<string | undefined> => {
      const toastId = toast.loading('Setting up Solana multisig...')
      try {
        setIsLoading(true)
        const address = await generateMultisigAddress(owners, required)
        if (!address) throw new Error('Failed to compute address')

        const newWallet: SolanaMultisigConfig = { owners, required, walletAddress: address }
        setWallets((prev) => [...prev, newWallet])

        toast.success('Solana multisig configured!', { id: toastId })
        return address
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to create Solana multisig'
        toast.error(msg.slice(0, 80), { id: toastId })
        return undefined
      } finally {
        setIsLoading(false)
      }
    },
    [generateMultisigAddress]
  )

  const getTransactionHistory = useCallback(
    async (address: string, limit = 10): Promise<SolanaTransaction[]> => {
      try {
        const connection = await getConnection()
        const { PublicKey } = await import('@solana/web3.js')
        const pubkey = new PublicKey(address)
        const signatures = await connection.getSignaturesForAddress(pubkey, { limit })

        return signatures.map((sig) => ({
          id: sig.signature,
          to: '',
          amount: 0,
          description: sig.memo ?? 'Unknown',
          executed: true,
          approvals: [],
          createdAt: sig.blockTime ?? 0,
        }))
      } catch {
        return []
      }
    },
    [getConnection]
  )

  return {
    isLoading,
    wallets,
    getWalletBalance,
    createMultisigWallet,
    generateMultisigAddress,
    getTransactionHistory,
  }
}
