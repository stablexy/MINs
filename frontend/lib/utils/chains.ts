export type ChainType = 'ethereum' | 'solana' | 'bitcoin'

export interface ChainConfig {
  id: ChainType
  name: string
  shortName: string
  symbol: string
  color: string
  bgColor: string
  textColor: string
  explorerUrl: string
  explorerName: string
  icon: string
  decimals: number
  testnet?: {
    name: string
    explorerUrl: string
  }
}

export const CHAINS: Record<ChainType, ChainConfig> = {
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    shortName: 'ETH',
    symbol: 'ETH',
    color: '#627eea',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-400',
    explorerUrl: 'https://etherscan.io',
    explorerName: 'Etherscan',
    icon: '⟠',
    decimals: 18,
    testnet: {
      name: 'Sepolia',
      explorerUrl: 'https://sepolia.etherscan.io',
    },
  },
  solana: {
    id: 'solana',
    name: 'Solana',
    shortName: 'SOL',
    symbol: 'SOL',
    color: '#9945ff',
    bgColor: 'bg-purple-500/10',
    textColor: 'text-purple-400',
    explorerUrl: 'https://explorer.solana.com',
    explorerName: 'Solana Explorer',
    icon: '◎',
    decimals: 9,
    testnet: {
      name: 'Devnet',
      explorerUrl: 'https://explorer.solana.com/?cluster=devnet',
    },
  },
  bitcoin: {
    id: 'bitcoin',
    name: 'Bitcoin',
    shortName: 'BTC',
    symbol: 'BTC',
    color: '#f7931a',
    bgColor: 'bg-orange-500/10',
    textColor: 'text-orange-400',
    explorerUrl: 'https://mempool.space',
    explorerName: 'Mempool',
    icon: '₿',
    decimals: 8,
    testnet: {
      name: 'Testnet',
      explorerUrl: 'https://mempool.space/testnet',
    },
  },
}

export function getChain(id: ChainType): ChainConfig {
  return CHAINS[id]
}

export function getExplorerTxUrl(chain: ChainType, txHash: string): string {
  const config = CHAINS[chain]
  if (chain === 'ethereum') return `${config.explorerUrl}/tx/${txHash}`
  if (chain === 'solana') return `${config.explorerUrl}/tx/${txHash}`
  return `${config.explorerUrl}/tx/${txHash}`
}

export function getExplorerAddressUrl(chain: ChainType, address: string): string {
  const config = CHAINS[chain]
  if (chain === 'ethereum') return `${config.explorerUrl}/address/${address}`
  if (chain === 'solana') return `${config.explorerUrl}/address/${address}`
  return `${config.explorerUrl}/address/${address}`
}
