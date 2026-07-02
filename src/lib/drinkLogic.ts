import type { DrinkRecord, DrinkSize, DrinkType } from '../types'
import { monthKeyOf, parseISODate, todayISODate } from './date'

export const DRINK_TYPES: DrinkType[] = [
  'tea',
  'greenTea',
  'oolongTea',
  'blackTea',
  'milkTea',
  'powderedTea',
  'coffee',
  'espresso',
  'latte',
  'homemade',
  'energyDrink',
  'other',
]

export const DRINK_SIZES: DrinkSize[] = ['small', 'medium', 'large', 'custom']

export type StatsPeriod = 'week' | 'month' | 'year'

export interface DrinkStats {
  cups: number
  totalSpend: number
  totalCaffeineMg: number
  totalSugarG: number
  monthlyAverageMg: number
  mostPopularType: DrinkType | null
}

export interface CalendarDay {
  key: string
  date: string
  dayNumber: number
  inMonth: boolean
  isToday: boolean
}

const CAFFEINE_DEFAULTS: Record<DrinkType, number> = {
  tea: 45,
  greenTea: 35,
  oolongTea: 40,
  blackTea: 55,
  milkTea: 70,
  powderedTea: 70,
  coffee: 95,
  espresso: 65,
  latte: 75,
  homemade: 50,
  energyDrink: 120,
  other: 40,
}

export function defaultCaffeineFor(type: DrinkType): number {
  return CAFFEINE_DEFAULTS[type]
}

export function formatSpend(value: number): string {
  if (value <= 0) return '0'
  return value % 1 === 0 ? String(value) : value.toFixed(2)
}

export function recordDateTimeValue(record: Pick<DrinkRecord, 'date' | 'time'>): string {
  return `${record.date}T${record.time}`
}

export function sortRecordsNewestFirst(records: DrinkRecord[]): DrinkRecord[] {
  return [...records].sort((a, b) => (recordDateTimeValue(a) < recordDateTimeValue(b) ? 1 : -1))
}

export function recordsForDate(records: DrinkRecord[], date: string): DrinkRecord[] {
  return sortRecordsNewestFirst(records.filter((record) => record.date === date))
}

export function recordsForPeriod(records: DrinkRecord[], period: StatsPeriod, anchor = todayISODate()): DrinkRecord[] {
  const anchorDate = parseISODate(anchor)
  if (period === 'week') {
    const day = anchorDate.getDay()
    const mondayDelta = day === 0 ? -6 : 1 - day
    const start = new Date(anchorDate)
    start.setDate(anchorDate.getDate() + mondayDelta)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return records.filter((record) => {
      const date = parseISODate(record.date)
      return date >= start && date <= end
    })
  }

  if (period === 'month') {
    const monthKey = monthKeyOf(anchor)
    return records.filter((record) => monthKeyOf(record.date) === monthKey)
  }

  const year = anchorDate.getFullYear()
  return records.filter((record) => parseISODate(record.date).getFullYear() === year)
}

export function computeDrinkStats(records: DrinkRecord[]): DrinkStats {
  const totalCaffeineMg = records.reduce((sum, record) => sum + record.caffeineMg, 0)
  const totalSpend = records.reduce((sum, record) => sum + record.spendAmount, 0)
  const totalSugarG = records.reduce((sum, record) => sum + record.sugarG, 0)
  const byType = new Map<DrinkType, number>()

  for (const record of records) {
    byType.set(record.drinkType, (byType.get(record.drinkType) ?? 0) + 1)
  }

  const mostPopularType =
    [...byType.entries()].sort((a, b) => b[1] - a[1] || DRINK_TYPES.indexOf(a[0]) - DRINK_TYPES.indexOf(b[0]))[0]?.[0] ?? null

  const months = new Set(records.map((record) => monthKeyOf(record.date)))
  const monthlyAverageMg = months.size > 0 ? totalCaffeineMg / months.size : 0

  return {
    cups: records.length,
    totalSpend,
    totalCaffeineMg,
    totalSugarG,
    monthlyAverageMg,
    mostPopularType,
  }
}

export function buildMonthGrid(anchor = todayISODate()): CalendarDay[] {
  const today = todayISODate()
  const base = parseISODate(anchor)
  const year = base.getFullYear()
  const month = base.getMonth()
  const first = new Date(year, month, 1)
  const mondayOffset = (first.getDay() + 6) % 7
  const gridStart = new Date(first)
  gridStart.setDate(first.getDate() - mondayOffset)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + index)
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    return {
      key: value,
      date: value,
      dayNumber: date.getDate(),
      inMonth: date.getMonth() === month,
      isToday: value === today,
    }
  })
}

export function addMonths(anchor: string, delta: number): string {
  const date = parseISODate(anchor)
  date.setMonth(date.getMonth() + delta, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
}
