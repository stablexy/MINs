'use client'

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount, useChainId } from 'wagmi'
import { useCallback } from 'react'
import { MultiSigFactoryABI, getFactoryAddress } from '@/lib/contracts'
import { keccak256, toBytes } from 'viem'
import toast from 'react-hot-toast'

export function useMultiSigFactory() {
  const { address } = useAccount()
  const chainId = useChainId()
  const factoryAddress = getFactoryAddress(chainId)

  const { writeContractAsync, data: txHash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash })

  const { data: userWallets, refetch: refetchWallets } = useReadContract({
    address: factoryAddress,
    abi: MultiSigFactoryABI,
    functionName: 'getWallets',
    args: address ? [address] : undefined,
    query: { enabled: !!factoryAddress && !!address },
  })

  const { data: walletCount } = useReadContract({
    address: factoryAddress,
    abi: MultiSigFactoryABI,
    functionName: 'getWalletCount',
    query: { enabled: !!factoryAddress },
  })

  const createWallet = useCallback(
    async (owners: `0x${string}`[], required: number, saltSuffix?: string) => {
      if (!factoryAddress) {
        toast.error('Factory not deployed on this network')
        return
      }
      const toastId = toast.loading('Deploying multisig wallet...')
      try {
        const salt = keccak256(toBytes(saltSuffix ?? `${Date.now()}-${Math.random()}`))
        const hash = await writeContractAsync({
          address: factoryAddress,
          abi: MultiSigFactoryABI,
          functionName: 'createWallet',
          args: [owners, BigInt(required), salt],
        })
        toast.success('Wallet deployed!', { id: toastId })
        refetchWallets()
        return hash
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Deployment failed'
        toast.error(msg.slice(0, 80), { id: toastId })
        throw err
      }
    },
    [factoryAddress, writeContractAsync, refetchWallets]
  )

  const computeAddress = useCallback(
    async (owners: `0x${string}`[], required: number, saltSuffix: string) => {
      if (!factoryAddress) return undefined
      const salt = keccak256(toBytes(saltSuffix))
      return salt
    },
    [factoryAddress]
  )

  return {
    factoryAddress,
    userWallets: userWallets as `0x${string}`[] | undefined,
    walletCount: walletCount as bigint | undefined,
    isPending,
    isConfirming,
    isConfirmed,
    createWallet,
    computeAddress,
    refetchWallets,
  }
}
