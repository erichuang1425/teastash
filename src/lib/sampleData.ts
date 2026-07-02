import type { TeaItem, UsagePurpose, UsageRecord } from '../types'
import { addDays, nowISODateTime, todayISODate } from './date'
import { createId } from './id'

/**
 * Generates a fictional demo dataset anchored to "today" so relative expiry
 * countdowns always look meaningful, whether used on first launch or after
 * a "reset demo data" action. Names/brands are invented placeholders only.
 */
export function generateSampleData(): { teas: TeaItem[]; usageRecords: UsageRecord[] } {
  const today = todayISODate()
  const now = nowISODateTime()

  const makeTea = (partial: Omit<TeaItem, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder'> & { sortOrder: number }): TeaItem => ({
    id: createId(),
    createdAt: now,
    updatedAt: now,
    ...partial,
  })

  const ceremonial = makeTea({
    name: 'Ceremonial Matcha No. 1',
    brand: 'Sample Tea House',
    teaType: 'matcha',
    netWeightG: 30,
    remainingG: 22.5,
    purchaseDate: addDays(today, -22),
    openedDate: addDays(today, -10),
    unopenedExpiryDate: addDays(today, 340),
    openedExpiryDate: addDays(today, 19),
    storageLocation: 'Pantry, airtight tin',
    notes: 'Bright and sweet, low bitterness. Good for daily usucha.',
    imageDataUrl: null,
    tinColor: '#6B8E23',
    sortOrder: 0,
  })

  const morningSencha = makeTea({
    name: 'Morning Sencha',
    brand: 'Demo Leaf Co.',
    teaType: 'sencha',
    netWeightG: 100,
    remainingG: 100,
    purchaseDate: addDays(today, -5),
    openedDate: null,
    unopenedExpiryDate: addDays(today, 360),
    openedExpiryDate: null,
    storageLocation: 'Fridge, top shelf',
    notes: '',
    imageDataUrl: null,
    tinColor: '#8BA863',
    sortOrder: 1,
  })

  const houjichaRoast = makeTea({
    name: 'Houjicha Roast',
    brand: 'Sample Tea House',
    teaType: 'houjicha',
    netWeightG: 40,
    remainingG: 4,
    purchaseDate: addDays(today, -70),
    openedDate: addDays(today, -60),
    unopenedExpiryDate: addDays(today, 250),
    openedExpiryDate: addDays(today, 3),
    storageLocation: 'Pantry, sealed bag',
    notes: 'Nutty and toasty. Great after dinner.',
    imageDataUrl: null,
    tinColor: '#556B2F',
    sortOrder: 2,
  })

  const usuchaBlend = makeTea({
    name: 'Usucha Daily Blend',
    brand: 'Demo Leaf Co.',
    teaType: 'matcha',
    netWeightG: 20,
    remainingG: 0,
    purchaseDate: addDays(today, -90),
    openedDate: addDays(today, -80),
    unopenedExpiryDate: addDays(today, 200),
    openedExpiryDate: addDays(today, -5),
    storageLocation: 'Pantry, airtight tin',
    notes: 'Finished up — reorder soon.',
    imageDataUrl: null,
    tinColor: '#A7C7A1',
    sortOrder: 3,
  })

  const morningCloud = makeTea({
    name: 'Morning Cloud Oolong',
    brand: 'Sample Tea House',
    teaType: 'oolong',
    netWeightG: 50,
    remainingG: 50,
    purchaseDate: addDays(today, -2),
    openedDate: null,
    unopenedExpiryDate: addDays(today, 400),
    openedExpiryDate: null,
    storageLocation: 'Cabinet',
    notes: '',
    imageDataUrl: null,
    tinColor: '#283D2E',
    sortOrder: 4,
  })

  const eveningGenmaicha = makeTea({
    name: 'Evening Genmaicha',
    brand: 'Demo Leaf Co.',
    teaType: 'genmaicha',
    netWeightG: 60,
    remainingG: 14,
    purchaseDate: addDays(today, -100),
    openedDate: addDays(today, -65),
    unopenedExpiryDate: addDays(today, 150),
    openedExpiryDate: addDays(today, -5),
    storageLocation: 'Cabinet',
    notes: 'Past its best — finish soon or replace.',
    imageDataUrl: null,
    tinColor: '#4A7043',
    sortOrder: 5,
  })

  const teas = [ceremonial, morningSencha, houjichaRoast, usuchaBlend, morningCloud, eveningGenmaicha]

  const usagePattern: { offset: number; time: string; grams: number; purpose: UsagePurpose; notes: string }[] = [
    { offset: 0, time: '09:30', grams: 2, purpose: 'latte', notes: 'Milk 200ml, less sweet, smooth taste!' },
    { offset: 2, time: '14:20', grams: 2.5, purpose: 'usucha', notes: '' },
    { offset: 5, time: '10:15', grams: 2, purpose: 'latte', notes: '' },
    { offset: 8, time: '16:40', grams: 2, purpose: 'dessert', notes: 'Matcha cookies' },
    { offset: 11, time: '08:50', grams: 2, purpose: 'usucha', notes: '' },
    { offset: 20, time: '09:00', grams: 2, purpose: 'usucha', notes: '' },
    { offset: 35, time: '09:10', grams: 2, purpose: 'latte', notes: '' },
    { offset: 50, time: '11:00', grams: 2, purpose: 'usucha', notes: '' },
  ]

  const usageRecords: UsageRecord[] = []
  let running = ceremonial.remainingG
  const runningTotals: number[] = []
  for (const entry of usagePattern) {
    runningTotals.push(running)
    running += entry.grams
  }
  runningTotals.reverse()
  usagePattern.forEach((entry, i) => {
    usageRecords.push({
      id: createId(),
      teaId: ceremonial.id,
      date: addDays(today, -entry.offset),
      time: entry.time,
      gramsUsed: entry.grams,
      purpose: entry.purpose,
      notes: entry.notes,
      remainingAfter: runningTotals[i],
      createdAt: now,
    })
  })

  const houjichaUsage: { offset: number; time: string; grams: number }[] = [
    { offset: 1, time: '20:00', grams: 3 },
    { offset: 6, time: '19:30', grams: 3 },
    { offset: 14, time: '20:15', grams: 3 },
  ]
  let houjichaRunning = houjichaRoast.remainingG
  const houjichaTotals: number[] = []
  for (const entry of houjichaUsage) {
    houjichaTotals.push(houjichaRunning)
    houjichaRunning += entry.grams
  }
  houjichaTotals.reverse()
  houjichaUsage.forEach((entry, i) => {
    usageRecords.push({
      id: createId(),
      teaId: houjichaRoast.id,
      date: addDays(today, -entry.offset),
      time: entry.time,
      gramsUsed: entry.grams,
      purpose: 'other',
      notes: '',
      remainingAfter: houjichaTotals[i],
      createdAt: now,
    })
  })

  usageRecords.sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1))

  return { teas, usageRecords }
}
