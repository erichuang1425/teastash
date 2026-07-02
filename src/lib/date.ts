function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

export function todayISODate(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function nowTimeHHMM(): string {
  const d = new Date()
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function nowISODateTime(): string {
  return new Date().toISOString()
}

/** Parse a 'yyyy-mm-dd' string as a local-midnight Date (avoids UTC offset drift). */
export function parseISODate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

/** Days from today to the given ISO date. Negative means the date is in the past. */
export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const target = parseISODate(dateStr)
  const today = parseISODate(todayISODate())
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.round((target.getTime() - today.getTime()) / msPerDay)
}

export function formatDateDisplay(dateStr: string | null, locale: string): string {
  if (!dateStr) return ''
  const date = parseISODate(dateStr)
  return date.toLocaleDateString(locale === 'zh-TW' ? 'zh-TW' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function formatMonthLabel(monthKey: string, locale: string): string {
  const [y, m] = monthKey.split('-').map(Number)
  const date = new Date(y, (m ?? 1) - 1, 1)
  return date.toLocaleDateString(locale === 'zh-TW' ? 'zh-TW' : 'en-US', {
    year: 'numeric',
    month: 'short',
  })
}

export function monthKeyOf(dateStr: string): string {
  return dateStr.slice(0, 7)
}

export function addDays(dateStr: string, delta: number): string {
  const d = parseISODate(dateStr)
  d.setDate(d.getDate() + delta)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Whole days from `from` to `to` (both ISO dates); negative if `to` precedes `from`. */
export function daysBetween(from: string, to: string): number {
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.round((parseISODate(to).getTime() - parseISODate(from).getTime()) / msPerDay)
}
