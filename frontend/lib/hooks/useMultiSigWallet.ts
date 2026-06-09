'use client'

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { useCallback } from 'react'
import { MultiSigWalletABI } from '@/lib/contracts'
import toast from 'react-hot-toast'

export interface WalletTransaction {
  id: number
  to: `0x${string}`
  value: bigint
  data: `0x${string}`
  executed: boolean
  numConfirmations: number
  submittedAt: number
  submittedBy: `0x${string}`
  description: string
}

export interface UseMultiSigWalletProps {
  walletAddress: `0x${string}` | undefined
}

export function useMultiSigWallet({ walletAddress }: UseMultiSigWalletProps) {
  const { address: userAddress } = useAccount()
  const { writeContractAsync, data: txHash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash })

  // ─── Read: Owners ───────────────────────────────────────────
  const { data: owners, refetch: refetchOwners } = useReadContract({
    address: walletAddress,
    abi: MultiSigWalletABI,
    functionName: 'getOwners',
    query: { enabled: !!walletAddress },
  })

  // ─── Read: Required threshold ───────────────────────────────
  const { data: required, refetch: refetchRequired } = useReadContract({
    address: walletAddress,
    abi: MultiSigWalletABI,
    functionName: 'required',
    query: { enabled: !!walletAddress },
  })

  // ─── Read: ETH Balance ──────────────────────────────────────
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: walletAddress,
    abi: MultiSigWalletABI,
    functionName: 'getBalance',
    query: { enabled: !!walletAddress },
  })

  // ─── Read: Transaction count ────────────────────────────────
  const { data: transactionCount, refetch: refetchCount } = useReadContract({
    address: walletAddress,
    abi: MultiSigWalletABI,
    functionName: 'getTransactionCount',
    query: { enabled: !!walletAddress },
  })

  // ─── Read: Is current user an owner ─────────────────────────
  const { data: isOwner } = useReadContract({
    address: walletAddress,
    abi: MultiSigWalletABI,
    functionName: 'isOwner',
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!walletAddress && !!userAddress },
  })

  // ─── Write: Submit Transaction ──────────────────────────────
  const submitTransaction = useCallback(
    async (to: `0x${string}`, value: bigint, data: `0x${string}`, description: string) => {
      if (!walletAddress) return
      const id = toast.loading('Submitting transaction...')
      try {
        await writeContractAsync({
          address: walletAddress,
          abi: MultiSigWalletABI,
          functionName: 'submitTransaction',
          args: [to, value, data, description],
        })
        toast.success('Transaction submitted!', { id })
        refetchCount()
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Transaction failed'
        toast.error(msg.slice(0, 80), { id })
        throw err
      }
    },
    [walletAddress, writeContractAsync, refetchCount]
  )

  // ─── Write: Confirm Transaction ─────────────────────────────
  const confirmTransaction = useCallback(
    async (txIndex: number) => {
      if (!walletAddress) return
      const id = toast.loading('Confirming transaction...')
      try {
        await writeContractAsync({
          address: walletAddress,
          abi: MultiSigWalletABI,
          functionName: 'confirmTransaction',
          args: [BigInt(txIndex)],
        })
        toast.success('Transaction confirmed!', { id })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Confirmation failed'
        toast.error(msg.slice(0, 80), { id })
        throw err
      }
    },
    [walletAddress, writeContractAsync]
  )

  // ─── Write: Revoke Confirmation ─────────────────────────────
  const revokeConfirmation = useCallback(
    async (txIndex: number) => {
      if (!walletAddress) return
      const id = toast.loading('Revoking confirmation...')
      try {
        await writeContractAsync({
          address: walletAddress,
          abi: MultiSigWalletABI,
          functionName: 'revokeConfirmation',
          args: [BigInt(txIndex)],
        })
        toast.success('Confirmation revoked!', { id })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Revoke failed'
        toast.error(msg.slice(0, 80), { id })
        throw err
      }
    },
    [walletAddress, writeContractAsync]
  )

  // ─── Write: Execute Transaction ─────────────────────────────
  const executeTransaction = useCallback(
    async (txIndex: number) => {
      if (!walletAddress) return
      const id = toast.loading('Executing transaction...')
      try {
        await writeContractAsync({
          address: walletAddress,
          abi: MultiSigWalletABI,
          functionName: 'executeTransaction',
          args: [BigInt(txIndex)],
        })
        toast.success('Transaction executed!', { id })
        refetchBalance()
        refetchCount()
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Execution failed'
        toast.error(msg.slice(0, 80), { id })
        throw err
      }
    },
    [walletAddress, writeContractAsync, refetchBalance, refetchCount]
  )

  // ─── Write: Add Owner (via self-call transaction) ────────────
  const addOwner = useCallback(
    async (newOwner: `0x${string}`) => {
      if (!walletAddress) return
      // Encode the addOwner calldata for a self-call transaction
      const { encodeFunctionData } = await import('viem')
      const data = encodeFunctionData({
        abi: MultiSigWalletABI,
        functionName: 'addOwner',
        args: [newOwner],
      })
      return submitTransaction(walletAddress, 0n, data as `0x${string}`, `Add owner: ${newOwner}`)
    },
    [walletAddress, submitTransaction]
  )

  // ─── Write: Remove Owner (via self-call transaction) ─────────
  const removeOwner = useCallback(
    async (owner: `0x${string}`) => {
      if (!walletAddress) return
      const { encodeFunctionData } = await import('viem')
      const data = encodeFunctionData({
        abi: MultiSigWalletABI,
        functionName: 'removeOwner',
        args: [owner],
      })
      return submitTransaction(walletAddress, 0n, data as `0x${string}`, `Remove owner: ${owner}`)
    },
    [walletAddress, submitTransaction]
  )

  const refetchAll = useCallback(() => {
    refetchOwners()
    refetchRequired()
    refetchBalance()
    refetchCount()
  }, [refetchOwners, refetchRequired, refetchBalance, refetchCount])

  return {
    // State
    owners: owners as `0x${string}`[] | undefined,
    required: required as bigint | undefined,
    balance: balance as bigint | undefined,
    transactionCount: transactionCount as bigint | undefined,
    isOwner: isOwner as boolean | undefined,

    // Transaction state
    txHash,
    isPending,
    isConfirming,
    isConfirmed,

    // Actions
    submitTransaction,
    confirmTransaction,
    revokeConfirmation,
    executeTransaction,
    addOwner,
    removeOwner,
    refetchAll,
  }
}

/**
 * Hook to read a single transaction by index.
 */
export function useTransaction(
  walletAddress: `0x${string}` | undefined,
  txIndex: bigint | undefined
) {
  const { data, isLoading, refetch } = useReadContract({
    address: walletAddress,
    abi: MultiSigWalletABI,
    functionName: 'getTransaction',
    args: txIndex !== undefined ? [txIndex] : undefined,
    query: { enabled: !!walletAddress && txIndex !== undefined },
  })

  return {
    transaction: data as
      | [
          `0x${string}`,
          bigint,
          `0x${string}`,
          boolean,
          bigint,
          bigint,
          `0x${string}`,
          string
        ]
      | undefined,
    isLoading,
    refetch,
  }
}

/**
 * Hook to check if a specific owner has confirmed a transaction.
 */
export function useIsConfirmed(
  walletAddress: `0x${string}` | undefined,
  txIndex: bigint | undefined,
  ownerAddress: `0x${string}` | undefined
) {
  const { data } = useReadContract({
    address: walletAddress,
    abi: MultiSigWalletABI,
    functionName: 'isTransactionConfirmed',
    args: txIndex !== undefined && ownerAddress ? [txIndex, ownerAddress] : undefined,
    query: { enabled: !!walletAddress && txIndex !== undefined && !!ownerAddress },
  })

  return data as boolean | undefined
}
