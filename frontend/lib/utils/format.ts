import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAddress(address: string, chars = 4): string {
  if (!address) return ''
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

export function formatBalance(
  value: bigint | string | number,
  decimals = 18,
  displayDecimals = 4
): string {
  const n = typeof value === 'bigint' ? value : BigInt(value.toString())
  const divisor = BigInt(10 ** decimals)
  const whole = n / divisor
  const fraction = n % divisor
  const fractionStr = fraction.toString().padStart(decimals, '0').slice(0, displayDecimals)
  const trimmed = fractionStr.replace(/0+$/, '')
  return trimmed ? `${whole}.${trimmed}` : whole.toString()
}

export function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatRelativeTime(timestamp: number): string {
  return formatDistanceToNow(new Date(timestamp * 1000), { addSuffix: true })
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}

export function isValidAddress(address: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(address)
}

export function isValidSolanaAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
}

export function isValidBitcoinAddress(address: string): boolean {
  return /^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/.test(address)
}
