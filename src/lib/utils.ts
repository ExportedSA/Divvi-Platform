import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string, currency: string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  const validCurrency = currency === 'NZD' || currency === 'AUD' ? currency : 'NZD'
  const symbol = validCurrency === 'NZD' ? 'NZ$' : 'A$'
  return `${symbol}${numAmount.toFixed(2)}`
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-NZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function calculateDays(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export function calculateRentalCost(
  pricePerDay: number,
  pricePerWeek: number | null,
  days: number
): number {
  if (pricePerWeek && days >= 7) {
    const weeks = Math.floor(days / 7)
    const remainingDays = days % 7
    return weeks * pricePerWeek + remainingDays * pricePerDay
  }
  return days * pricePerDay
}
