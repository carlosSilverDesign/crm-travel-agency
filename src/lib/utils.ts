import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'USD') {
  try {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  } catch (e) {
    return `${currency} ${amount.toFixed(2)}`
  }
}

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return '-'
  try {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'medium',
    }).format(new Date(date))
  } catch (e) {
    return String(date)
  }
}
