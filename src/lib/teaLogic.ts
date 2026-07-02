import type { TeaItem, TeaStatus, UsageRecord } from '../types'
import { daysUntil } from './date'

export function getTeaStatus(tea: TeaItem): TeaStatus {
  if (tea.remainingG <= 0) return 'finished'
  if (!tea.openedDate) return 'unopened'
  return 'active'
}

export function clampRemaining(value: number, netWeightG: number): number {
  return Math.min(Math.max(value, 0), netWeightG)
}

/** Days left before the opened-expiry date; null if not applicable. */
export function openedExpiryDaysLeft(tea: TeaItem): number | null {
  if (!tea.openedDate) return null
  return daysUntil(tea.openedExpiryDate)
}

export function unopenedExpiryDaysLeft(tea: TeaItem): number | null {
  return daysUntil(tea.unopenedExpiryDate)
}

const LOW_REMAINING_RATIO = 0.15
const LOW_REMAINING_ABSOLUTE_G = 8
const EXPIRING_SOON_DAYS = 21

export function isLowRemaining(tea: TeaItem): boolean {
  if (getTeaStatus(tea) !== 'active') return false
  const ratio = tea.netWeightG > 0 ? tea.remainingG / tea.netWeightG : 0
  return tea.remainingG <= LOW_REMAINING_ABSOLUTE_G || ratio <= LOW_REMAINING_RATIO
}

export function isExpiringSoon(tea: TeaItem): boolean {
  const days = openedExpiryDaysLeft(tea)
  return days !== null && days >= 0 && days <= EXPIRING_SOON_DAYS
}

export function isExpired(dateStr: string | null): boolean {
  const days = daysUntil(dateStr)
  return days !== null && days < 0
}

export function remainingRatio(tea: TeaItem): number {
  if (tea.netWeightG <= 0) return 0
  return Math.min(1, Math.max(0, tea.remainingG / tea.netWeightG))
}

export interface PaceInfo {
  gPerDay: number
  daysToEmpty: number
  /** null when the tea has no upcoming opened-expiry date to race against */
  finishBeforeExpiry: boolean | null
  /** grams/day needed to finish by the opened-expiry date */
  requiredGPerDay: number | null
}

const MIN_RECORDS_FOR_PACE = 2

/**
 * Estimates consumption pace from a tea's usage records: average g/day since
 * opening (or since the first log), projected days until empty, and whether
 * the current pace finishes the tin before its opened-expiry date.
 */
export function computePace(tea: TeaItem, allRecords: UsageRecord[]): PaceInfo | null {
  if (tea.remainingG <= 0) return null
  const records = allRecords.filter((r) => r.teaId === tea.id)
  if (records.length < MIN_RECORDS_FOR_PACE) return null

  const firstUseDate = records.reduce((min, r) => (r.date < min ? r.date : min), records[0].date)
  const startDate = tea.openedDate && tea.openedDate < firstUseDate ? tea.openedDate : firstUseDate
  const spanDays = Math.max(1, -(daysUntil(startDate) ?? 0))
  const totalUsed = records.reduce((sum, r) => sum + r.gramsUsed, 0)
  const gPerDay = totalUsed / spanDays
  if (gPerDay <= 0) return null

  const daysToEmpty = Math.ceil(tea.remainingG / gPerDay)

  const expiryDays = openedExpiryDaysLeft(tea)
  let finishBeforeExpiry: boolean | null = null
  let requiredGPerDay: number | null = null
  if (expiryDays !== null && expiryDays >= 0) {
    finishBeforeExpiry = daysToEmpty <= expiryDays
    requiredGPerDay = expiryDays > 0 ? tea.remainingG / expiryDays : tea.remainingG
  }

  return { gPerDay, daysToEmpty, finishBeforeExpiry, requiredGPerDay }
}

const USE_FIRST_WINDOW_DAYS = 30

/**
 * Picks the opened tea most worth prioritizing: nearest opened-expiry within
 * 30 days (ties broken by less remaining). Mirrors the 建議優先使用 badge in
 * the reference design. Returns null when nothing is urgent.
 */
export function pickUseFirstTeaId(teas: TeaItem[]): string | null {
  let best: TeaItem | null = null
  let bestDays = Infinity
  for (const tea of teas) {
    if (getTeaStatus(tea) !== 'active') continue
    const days = openedExpiryDaysLeft(tea)
    if (days === null || days < 0 || days > USE_FIRST_WINDOW_DAYS) continue
    if (days < bestDays || (days === bestDays && best !== null && tea.remainingG < best.remainingG)) {
      best = tea
      bestDays = days
    }
  }
  return best?.id ?? null
}
