import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import {
  mainnet,
  sepolia,
  polygon,
  arbitrum,
  optimism,
  base,
} from 'wagmi/chains'

export const wagmiConfig = getDefaultConfig({
  appName: 'MINs Multisig Platform',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? 'YOUR_PROJECT_ID',
  chains: [mainnet, sepolia, polygon, arbitrum, optimism, base],
  ssr: true,
})
