export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatCurrencyDetailed(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })
}

export function getMonthName(monthStr: string): string {
  const date = new Date(monthStr)
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

export function getCurrentMonthFirst(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
}

export function getMonthKey(dateStr: string): string {
  return dateStr.substring(0, 7)
}

export function getDaysInMonth(monthStr: string): number {
  const [year, month] = monthStr.split('-').map(Number)
  return new Date(year, month, 0).getDate()
}

export function getDayOfMonth(dateStr: string): number {
  return new Date(dateStr).getDate()
}
