'use client'

import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'

export interface BitcoinMultisigWallet {
  address: string
  redeemScript: string
  owners: string[]
  required: number
  type: 'P2SH' | 'P2WSH' | 'P2SH-P2WSH'
}

export interface BitcoinUTXO {
  txid: string
  vout: number
  value: number
  scriptPubKey: string
}

export function useBitcoinMultisig() {
  const [isLoading, setIsLoading] = useState(false)
  const [wallets, setWallets] = useState<BitcoinMultisigWallet[]>([])

  const createMultisigAddress = useCallback(
    async (
      publicKeys: string[],
      required: number,
      type: 'P2SH' | 'P2WSH' | 'P2SH-P2WSH' = 'P2SH-P2WSH'
    ): Promise<BitcoinMultisigWallet | undefined> => {
      const toastId = toast.loading('Creating Bitcoin multisig address...')
      try {
        setIsLoading(true)
        const bitcoin = await import('bitcoinjs-lib')
        const network = bitcoin.networks.testnet

        const pubkeyBuffers = publicKeys.map((pk) => Buffer.from(pk, 'hex'))

        let address: string
        let redeemScript: Buffer | undefined

        if (type === 'P2SH') {
          const p2ms = bitcoin.payments.p2ms({
            m: required,
            pubkeys: pubkeyBuffers,
            network,
          })
          const p2sh = bitcoin.payments.p2sh({ redeem: p2ms, network })
          address = p2sh.address!
          redeemScript = p2ms.output!
        } else if (type === 'P2WSH') {
          const p2ms = bitcoin.payments.p2ms({
            m: required,
            pubkeys: pubkeyBuffers,
            network,
          })
          const p2wsh = bitcoin.payments.p2wsh({ redeem: p2ms, network })
          address = p2wsh.address!
          redeemScript = p2ms.output!
        } else {
          const p2ms = bitcoin.payments.p2ms({
            m: required,
            pubkeys: pubkeyBuffers,
            network,
          })
          const p2wsh = bitcoin.payments.p2wsh({ redeem: p2ms, network })
          const p2sh = bitcoin.payments.p2sh({ redeem: p2wsh, network })
          address = p2sh.address!
          redeemScript = p2ms.output!
        }

        const wallet: BitcoinMultisigWallet = {
          address,
          redeemScript: redeemScript!.toString('hex'),
          owners: publicKeys,
          required,
          type,
        }

        setWallets((prev) => [...prev, wallet])
        toast.success(`Bitcoin ${type} multisig created!`, { id: toastId })
        return wallet
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to create Bitcoin multisig'
        toast.error(msg.slice(0, 80), { id: toastId })
        return undefined
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const getAddressBalance = useCallback(async (address: string): Promise<number> => {
    try {
      const res = await fetch(`https://mempool.space/testnet/api/address/${address}`)
      if (!res.ok) return 0
      const data = await res.json()
      const funded: number = data.chain_stats?.funded_txo_sum ?? 0
      const spent: number = data.chain_stats?.spent_txo_sum ?? 0
      return (funded - spent) / 1e8
    } catch {
      return 0
    }
  }, [])

  const getUTXOs = useCallback(async (address: string): Promise<BitcoinUTXO[]> => {
    try {
      const res = await fetch(`https://mempool.space/testnet/api/address/${address}/utxo`)
      if (!res.ok) return []
      const data = await res.json()
      return (data as Array<{ txid: string; vout: number; value: number; scriptpubkey: string }>).map((utxo) => ({
        txid: utxo.txid,
        vout: utxo.vout,
        value: utxo.value,
        scriptPubKey: utxo.scriptpubkey,
      }))
    } catch {
      return []
    }
  }, [])

  const getTransactions = useCallback(async (address: string) => {
    try {
      const res = await fetch(`https://mempool.space/testnet/api/address/${address}/txs`)
      if (!res.ok) return []
      return await res.json()
    } catch {
      return []
    }
  }, [])

  return {
    isLoading,
    wallets,
    createMultisigAddress,
    getAddressBalance,
    getUTXOs,
    getTransactions,
  }
}
