export type TeaType =
  | 'matcha'
  | 'sencha'
  | 'genmaicha'
  | 'houjicha'
  | 'oolong'
  | 'blackTea'
  | 'puerh'
  | 'other'

export type UsagePurpose = 'usucha' | 'koicha' | 'latte' | 'dessert' | 'other'

export interface TeaItem {
  id: string
  name: string
  brand: string
  teaType: TeaType
  netWeightG: number
  remainingG: number
  purchaseDate: string | null
  openedDate: string | null
  unopenedExpiryDate: string | null
  openedExpiryDate: string | null
  storageLocation: string
  notes: string
  imageDataUrl: string | null
  tinColor: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface UsageRecord {
  id: string
  teaId: string
  date: string // yyyy-mm-dd
  time: string // HH:mm
  gramsUsed: number
  purpose: UsagePurpose
  notes: string
  remainingAfter: number
  createdAt: string
}

export type TeaStatus = 'unopened' | 'active' | 'finished'

export interface AppSettings {
  language: 'en' | 'zh-TW'
  hasCompletedOnboarding: boolean
}

export interface BackupPayload {
  schemaVersion: number
  exportedAt: string
  app: 'teastash'
  teas: TeaItem[]
  usageRecords: UsageRecord[]
}
