import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'MINs — Multisig Wallet Platform',
  description:
    'Secure multi-signature wallets for Ethereum, Solana, and Bitcoin. Create, manage, and execute multi-party transactions with ease.',
  keywords: 'multisig, wallet, ethereum, solana, bitcoin, defi, web3',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
