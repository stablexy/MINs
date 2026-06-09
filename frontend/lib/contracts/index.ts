import MultiSigWalletABI from './abis/MultiSigWallet.json'
import MultiSigFactoryABI from './abis/MultiSigFactory.json'

export { MultiSigWalletABI, MultiSigFactoryABI }

export const CONTRACT_ADDRESSES: Record<number, { factory: `0x${string}` }> = {
  31337: { factory: '0x5FbDB2315678afecb367f032d93F642f64180aa3' },
  11155111: { factory: '0x0000000000000000000000000000000000000000' },
  1: { factory: '0x0000000000000000000000000000000000000000' },
  137: { factory: '0x0000000000000000000000000000000000000000' },
  42161: { factory: '0x0000000000000000000000000000000000000000' },
  10: { factory: '0x0000000000000000000000000000000000000000' },
  8453: { factory: '0x0000000000000000000000000000000000000000' },
}

export function getFactoryAddress(chainId: number): `0x${string}` | undefined {
  return CONTRACT_ADDRESSES[chainId]?.factory
}
